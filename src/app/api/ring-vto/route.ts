import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { uploadFile, saveResult, isMockMode } from '@/lib/youcam/youcamClient';
import { validateImageBuffer } from '@/lib/imageValidation';
import { isSafePublicHttpsImageUrl, readLocalSampleImage } from '@/lib/sampleImages';
import { rejectOversizedRequest } from '@/lib/requestLimits';
import { consumeTryOnQuota } from '@/lib/tryonQuota';

// ── Endpoints (grounded in YouCam AI Ring VTO docs) ───────────────────────────
// POST /s2s/v2.0/task/2d-vto/ring   — create task
// GET  /s2s/v2.0/task/2d-vto/ring/{task_id} — poll

const BASE_URL = process.env.YOUCAM_BASE_URL ?? 'https://yce-api-01.makeupar.com';
const API_KEY  = process.env.YOUCAM_API_KEY ?? '';
const POLL_MAX      = 30;
const POLL_INTERVAL = 3000;

function authHeaders() {
  return { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' };
}

async function createRingTask(payload: Record<string, unknown>): Promise<string> {
  const res  = await fetch(`${BASE_URL}/s2s/v2.0/task/2d-vto/ring`, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data?.data?.task_id) {
    const code = data?.error_code ?? data?.error ?? res.status;
    throw new Error(`Ring VTO task creation failed: ${code}`);
  }
  return data.data.task_id as string;
}

async function pollRingTask(taskId: string): Promise<string> {
  for (let i = 0; i < POLL_MAX; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    const res  = await fetch(`${BASE_URL}/s2s/v2.0/task/2d-vto/ring/${taskId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = await res.json();
    const status = data?.data?.task_status as string | undefined;
    if (status === 'success') {
      const url =
        (data?.data?.results?.url as string | undefined) ??
        (data?.data?.results?.[0]?.download_url as string | undefined);
      if (!url) throw new Error('Ring VTO succeeded but result URL missing');
      return url;
    }
    if (status === 'error') {
      const reason = data?.data?.error ?? data?.data?.failure_reason ?? 'unknown_error';
      throw new Error(`Ring VTO engine error: ${reason}`);
    }
  }
  throw new Error(`Ring VTO timed out after ${POLL_MAX} attempts`);
}

export async function POST(req: NextRequest) {
  try {
    const tooLarge = rejectOversizedRequest(req, 22 * 1024 * 1024);
    if (tooLarge) return tooLarge;
    const quota = await consumeTryOnQuota(req);
    if (quota.response) return quota.response;
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 2000));
      return NextResponse.json({ ok: true, resultUrl: '/sample_face_valid.jpg', taskId: `mock_ring_${Date.now()}`, mock: true });
    }

    const contentType = req.headers.get('content-type') ?? '';
    let handBuffer: Buffer | null = null;
    let ringBuffer: Buffer | null = null;
    let handMime = 'image/jpeg';
    let ringMime = 'image/jpeg';
    let handUrl:    string | undefined;
    let ringUrl:    string | undefined;

    if (contentType.includes('multipart/form-data')) {
      const form      = await req.formData();
      const handRaw   = form.get('handPhoto')  as File   | null;
      const ringRaw   = form.get('ringPhoto')  as File   | null;
      const handUrlR  = form.get('handUrl')    as string | null;
      const ringUrlR  = form.get('ringUrl')    as string | null;

      if (handRaw) {
        if (!['image/jpeg', 'image/png'].includes(handRaw.type)) return NextResponse.json({ ok: false, message: 'Use a JPG or PNG hand photo.' }, { status: 400 });
        handMime = handRaw.type;
        handBuffer = Buffer.from(await handRaw.arrayBuffer());
      }
      if (ringRaw) {
        if (!['image/jpeg', 'image/png'].includes(ringRaw.type)) return NextResponse.json({ ok: false, message: 'Use a JPG or PNG ring image.' }, { status: 400 });
        ringMime = ringRaw.type;
        ringBuffer = Buffer.from(await ringRaw.arrayBuffer());
      }
      if (handUrlR) handUrl    = handUrlR;
      if (ringUrlR) ringUrl    = ringUrlR;
    } else {
      const body = await req.json().catch(() => ({}));
      handUrl    = body.handUrl as string | undefined;
      ringUrl    = body.ringUrl as string | undefined;
    }

    if (handBuffer  && handBuffer.length  > 10 * 1024 * 1024)
      return NextResponse.json({ ok: false, message: 'Hand photo too large — max 10 MB.' }, { status: 400 });
    if (ringBuffer  && ringBuffer.length  > 10 * 1024 * 1024)
      return NextResponse.json({ ok: false, message: 'Ring image too large — max 10 MB.' }, { status: 400 });
    if (handBuffer) {
      const imageError = validateImageBuffer(handBuffer, handMime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png'] });
      if (imageError) return NextResponse.json({ ok: false, message: `Hand photo: ${imageError}` }, { status: 400 });
    }
    if (ringBuffer) {
      const imageError = validateImageBuffer(ringBuffer, ringMime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png'] });
      if (imageError) return NextResponse.json({ ok: false, message: `Ring image: ${imageError}` }, { status: 400 });
    }

    // ── Source hand photo ──────────────────────────────────────────────────────
    let src_file_id:  string | undefined;
    let src_file_url: string | undefined;

    if (handBuffer && handBuffer.length > 0) {
      src_file_id = await uploadFile(handBuffer, handMime, handMime === 'image/png' ? 'hand.png' : 'hand.jpg');
    } else if (handUrl) {
      const sample = readLocalSampleImage(handUrl);
      if (sample) {
        const imageError = validateImageBuffer(sample.buffer, sample.mime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png'] });
        if (imageError) return NextResponse.json({ ok: false, message: `Hand sample: ${imageError}` }, { status: 400 });
        src_file_id = await uploadFile(sample.buffer, sample.mime, 'sample-hand.jpg');
      } else if (isSafePublicHttpsImageUrl(handUrl)) {
        src_file_url = handUrl;
      } else return NextResponse.json({ ok: false, message: 'Use an HTTPS image URL, the built-in hand sample, or upload a photo.' }, { status: 400 });
    } else {
      const samplePath = path.resolve(process.cwd(), 'public/samples/sample-hand.jpg');
      if (!fs.existsSync(samplePath)) return NextResponse.json({ ok: false, message: 'No sample hand photo is available. Upload a hand photo to continue.' }, { status: 400 });
      src_file_id = await uploadFile(fs.readFileSync(samplePath), 'image/jpeg', 'sample-hand.jpg');
    }

    // ── Ring reference ─────────────────────────────────────────────────────────
    let ref_file_id:  string | undefined;
    let ref_file_url: string | undefined;

    if (ringBuffer && ringBuffer.length > 0) {
      ref_file_id = await uploadFile(ringBuffer, ringMime, ringMime === 'image/png' ? 'ring.png' : 'ring.jpg');
    } else if (ringUrl) {
      const sample = readLocalSampleImage(ringUrl);
      if (sample) {
        const imageError = validateImageBuffer(sample.buffer, sample.mime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png'] });
        if (imageError) return NextResponse.json({ ok: false, message: `Ring sample: ${imageError}` }, { status: 400 });
        ref_file_id = await uploadFile(sample.buffer, sample.mime, `ring-sample.${sample.mime === 'image/png' ? 'png' : 'jpg'}`);
      } else if (isSafePublicHttpsImageUrl(ringUrl)) {
        ref_file_url = ringUrl;
      } else return NextResponse.json({ ok: false, message: 'Use an HTTPS image URL, a built-in ring sample, or upload an image file.' }, { status: 400 });
    } else {
      return NextResponse.json({ ok: false, message: 'A ring image (file or URL) is required.' }, { status: 400 });
    }

    const taskPayload: Record<string, unknown> = {
      ...(src_file_id  ? { src_file_id }  : { src_file_url }),
      ...(ref_file_id  ? { ref_file_ids: [ref_file_id] }  : { ref_file_urls: [ref_file_url] }),
    };

    const taskId      = await createRingTask(taskPayload);
    const remoteUrl   = await pollRingTask(taskId);
    const localResult = await saveResult(remoteUrl, 'ring_tryon', { userId: quota.userId, category: 'ring' });

    return NextResponse.json({ ok: true, resultUrl: localResult, taskId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ring VTO failed.';
    console.error('Ring VTO error:', message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
