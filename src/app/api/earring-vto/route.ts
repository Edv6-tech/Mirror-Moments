import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { uploadFile, saveResult, isMockMode } from '@/lib/youcam/youcamClient';
import { validateImageBuffer } from '@/lib/imageValidation';
import { isSafePublicHttpsImageUrl, readLocalSampleImage } from '@/lib/sampleImages';
import { rejectOversizedRequest } from '@/lib/requestLimits';
import { consumeTryOnQuota } from '@/lib/tryonQuota';

// ── Endpoints (grounded in YouCam AI Earring VTO docs) ────────────────────────
// POST /s2s/v2.0/task/2d-vto/earring   — create task
// GET  /s2s/v2.0/task/2d-vto/earring/{task_id} — poll

const BASE_URL = process.env.YOUCAM_BASE_URL ?? 'https://yce-api-01.makeupar.com';
const API_KEY  = process.env.YOUCAM_API_KEY ?? '';
const POLL_MAX      = 30;
const POLL_INTERVAL = 3000;

function authHeaders() {
  return { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' };
}

async function createEarringTask(payload: Record<string, unknown>): Promise<string> {
  const res  = await fetch(`${BASE_URL}/s2s/v2.0/task/2d-vto/earring`, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data?.data?.task_id) {
    const code = data?.error_code ?? data?.error ?? res.status;
    throw new Error(`Earring VTO task creation failed: ${code}`);
  }
  return data.data.task_id as string;
}

async function pollEarringTask(taskId: string): Promise<string> {
  for (let i = 0; i < POLL_MAX; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    const res  = await fetch(`${BASE_URL}/s2s/v2.0/task/2d-vto/earring/${taskId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = await res.json();
    const status = data?.data?.task_status as string | undefined;
    if (status === 'success') {
      const url =
        (data?.data?.results?.url as string | undefined) ??
        (data?.data?.results?.[0]?.download_url as string | undefined);
      if (!url) throw new Error('Earring VTO succeeded but result URL missing');
      return url;
    }
    if (status === 'error') {
      const reason = data?.data?.error ?? data?.data?.failure_reason ?? 'unknown_error';
      throw new Error(`Earring VTO engine error: ${reason}`);
    }
  }
  throw new Error(`Earring VTO timed out after ${POLL_MAX} attempts`);
}

export async function POST(req: NextRequest) {
  try {
    const tooLarge = rejectOversizedRequest(req, 22 * 1024 * 1024);
    if (tooLarge) return tooLarge;
    const quota = await consumeTryOnQuota(req);
    if (quota.response) return quota.response;
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 2000));
      return NextResponse.json({ ok: true, resultUrl: '/sample_face_valid.jpg', taskId: `mock_earring_${Date.now()}`, mock: true });
    }

    const contentType = req.headers.get('content-type') ?? '';
    let selfieBuffer:  Buffer | null = null;
    let earringBuffer: Buffer | null = null;
    let selfieMime = 'image/jpeg';
    let earringMime = 'image/jpeg';
    let selfieUrl:     string | undefined;
    let earringUrl:    string | undefined;

    if (contentType.includes('multipart/form-data')) {
      const form        = await req.formData();
      const selfieRaw   = form.get('selfiePhoto')   as File   | null;
      const earringRaw  = form.get('earringPhoto')  as File   | null;
      const selfieUrlR  = form.get('selfieUrl')     as string | null;
      const earringUrlR = form.get('earringUrl')    as string | null;

      if (selfieRaw) {
        if (!['image/jpeg', 'image/png'].includes(selfieRaw.type)) return NextResponse.json({ ok: false, message: 'Use a JPG or PNG selfie.' }, { status: 400 });
        selfieMime = selfieRaw.type;
        selfieBuffer = Buffer.from(await selfieRaw.arrayBuffer());
      }
      if (earringRaw) {
        if (!['image/jpeg', 'image/png'].includes(earringRaw.type)) return NextResponse.json({ ok: false, message: 'Use a JPG or PNG earring image.' }, { status: 400 });
        earringMime = earringRaw.type;
        earringBuffer = Buffer.from(await earringRaw.arrayBuffer());
      }
      if (selfieUrlR)  selfieUrl     = selfieUrlR;
      if (earringUrlR) earringUrl    = earringUrlR;
    } else {
      const body   = await req.json().catch(() => ({}));
      selfieUrl    = body.selfieUrl  as string | undefined;
      earringUrl   = body.earringUrl as string | undefined;
    }

    // Size guards — max 10 MB each
    if (selfieBuffer  && selfieBuffer.length  > 10 * 1024 * 1024)
      return NextResponse.json({ ok: false, message: 'Selfie too large — max 10 MB.' }, { status: 400 });
    if (earringBuffer && earringBuffer.length > 10 * 1024 * 1024)
      return NextResponse.json({ ok: false, message: 'Earring image too large — max 10 MB.' }, { status: 400 });
    if (selfieBuffer) {
      const imageError = validateImageBuffer(selfieBuffer, selfieMime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png'] });
      if (imageError) return NextResponse.json({ ok: false, message: `Selfie: ${imageError}` }, { status: 400 });
    }
    if (earringBuffer) {
      const imageError = validateImageBuffer(earringBuffer, earringMime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png'] });
      if (imageError) return NextResponse.json({ ok: false, message: `Earring image: ${imageError}` }, { status: 400 });
    }

    // ── Source selfie ──────────────────────────────────────────────────────────
    let src_file_id:  string | undefined;
    let src_file_url: string | undefined;

    if (selfieBuffer && selfieBuffer.length > 0) {
      src_file_id = await uploadFile(selfieBuffer, selfieMime, selfieMime === 'image/png' ? 'selfie.png' : 'selfie.jpg');
    } else if (selfieUrl) {
      const sample = readLocalSampleImage(selfieUrl);
      if (sample) {
        const imageError = validateImageBuffer(sample.buffer, sample.mime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png'] });
        if (imageError) return NextResponse.json({ ok: false, message: `Portrait sample: ${imageError}` }, { status: 400 });
        src_file_id = await uploadFile(sample.buffer, sample.mime, 'sample-selfie.jpg');
      } else if (isSafePublicHttpsImageUrl(selfieUrl)) {
        src_file_url = selfieUrl;
      } else return NextResponse.json({ ok: false, message: 'Use an HTTPS image URL, the built-in portrait sample, or upload a selfie.' }, { status: 400 });
    } else {
      const samplePath = path.resolve(process.cwd(), 'public/sample_face_valid.jpg');
      if (!fs.existsSync(samplePath)) return NextResponse.json({ ok: false, message: 'No sample portrait is available. Upload a selfie to continue.' }, { status: 400 });
      src_file_id = await uploadFile(fs.readFileSync(samplePath), 'image/jpeg', 'sample-selfie.jpg');
    }

    // ── Earring reference ──────────────────────────────────────────────────────
    let ref_file_id:  string | undefined;
    let ref_file_url: string | undefined;

    if (earringBuffer && earringBuffer.length > 0) {
      ref_file_id = await uploadFile(earringBuffer, earringMime, earringMime === 'image/png' ? 'earring.png' : 'earring.jpg');
    } else if (earringUrl) {
      const sample = readLocalSampleImage(earringUrl);
      if (sample) {
        const imageError = validateImageBuffer(sample.buffer, sample.mime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png'] });
        if (imageError) return NextResponse.json({ ok: false, message: `Earring sample: ${imageError}` }, { status: 400 });
        ref_file_id = await uploadFile(sample.buffer, sample.mime, `earring-sample.${sample.mime === 'image/png' ? 'png' : 'jpg'}`);
      } else if (isSafePublicHttpsImageUrl(earringUrl)) {
        ref_file_url = earringUrl;
      } else return NextResponse.json({ ok: false, message: 'Use an HTTPS image URL, a built-in earring sample, or upload an image file.' }, { status: 400 });
    } else {
      return NextResponse.json({ ok: false, message: 'An earring image (file or URL) is required.' }, { status: 400 });
    }

    // The Earring VTO schema requires both the file selectors and the
    // corresponding source/object metadata. Other 2D VTO routes accept only
    // the selectors, but the earring endpoint rejects that shorter payload
    // with InvalidParameters.
    const sourceName = src_file_id ?? src_file_url;
    const objectName = ref_file_id ?? ref_file_url;
    if (!sourceName || !objectName) {
      return NextResponse.json({ ok: false, message: 'A selfie and an earring image are required.' }, { status: 400 });
    }

    const taskPayload: Record<string, unknown> = {
      ...(src_file_id ? { src_file_id } : { src_file_url }),
      ...(ref_file_id ? { ref_file_ids: [ref_file_id] } : { ref_file_urls: [ref_file_url] }),
      source_info: { name: sourceName },
      object_infos: [{
        name: objectName,
        parameter: { earring_need_remove_background: true },
      }],
    };

    const taskId      = await createEarringTask(taskPayload);
    const remoteUrl   = await pollEarringTask(taskId);
    const localResult = await saveResult(remoteUrl, 'earring_tryon', { userId: quota.userId, category: 'earring' });

    return NextResponse.json({ ok: true, resultUrl: localResult, taskId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Earring VTO failed.';
    console.error('Earring VTO error:', message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
