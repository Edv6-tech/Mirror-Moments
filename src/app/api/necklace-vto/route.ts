import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { uploadFile, saveResult, isMockMode } from '@/lib/youcam/youcamClient';
import { validateImageBuffer } from '@/lib/imageValidation';
import { isSafePublicHttpsImageUrl, readLocalSampleImage } from '@/lib/sampleImages';
import { rejectOversizedRequest } from '@/lib/requestLimits';
import { consumeTryOnQuota } from '@/lib/tryonQuota';

// ── Endpoints (grounded in YouCam AI Necklace VTO docs) ───────────────────────
// POST /s2s/v2.0/task/2d-vto/necklace   — create task
// GET  /s2s/v2.0/task/2d-vto/necklace/{task_id} — poll

const BASE_URL = process.env.YOUCAM_BASE_URL ?? 'https://yce-api-01.makeupar.com';
const API_KEY  = process.env.YOUCAM_API_KEY ?? '';

const POLL_MAX      = 30;
const POLL_INTERVAL = 3000;

function authHeaders() {
  return { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' };
}

async function createNecklaceTask(payload: Record<string, unknown>): Promise<string> {
  const res  = await fetch(`${BASE_URL}/s2s/v2.0/task/2d-vto/necklace`, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data?.data?.task_id) {
    const code = data?.error_code ?? data?.error ?? res.status;
    throw new Error(`Necklace VTO task creation failed: ${code}`);
  }
  return data.data.task_id as string;
}

async function pollNecklaceTask(taskId: string): Promise<string> {
  for (let i = 0; i < POLL_MAX; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    const res  = await fetch(`${BASE_URL}/s2s/v2.0/task/2d-vto/necklace/${taskId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = await res.json();
    const status = data?.data?.task_status as string | undefined;

    if (status === 'success') {
      const url =
        (data?.data?.results?.url as string | undefined) ??
        (data?.data?.results?.[0]?.download_url as string | undefined);
      if (!url) throw new Error('Necklace VTO task succeeded but result URL missing');
      return url;
    }
    if (status === 'error') {
      const reason = data?.data?.error ?? data?.data?.failure_reason ?? 'unknown_error';
      // Map known error codes to user-friendly messages (per docs)
      const friendly: Record<string, string> = {
        PHOTO_DETECTION_FAIL: 'Could not detect a face in the selfie. Please use a clear, front-facing photo.',
        OBJECT_DETECTION_FAIL: 'Could not detect the necklace. Ensure the product image shows the necklace clearly.',
        PHOTO_CHECK_INVALID: 'Selfie failed validation. Ensure your neck is fully visible and head rotation is within 20°.',
        INPUT_ERROR: 'Invalid input. Check that the selfie and necklace images meet the size requirements.',
        INPUT_MAIN_IMAGE_EMPTY: 'No selfie image was received.',
      };
      throw new Error(friendly[reason] ?? `Necklace VTO engine error: ${reason}`);
    }
    // queued / running — keep polling
  }
  throw new Error(`Necklace VTO task timed out after ${POLL_MAX} attempts`);
}

export async function POST(req: NextRequest) {
  try {
    const tooLarge = rejectOversizedRequest(req, 22 * 1024 * 1024);
    if (tooLarge) return tooLarge;
    const quota = await consumeTryOnQuota(req);
    if (quota.response) return quota.response;
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 2000));
      return NextResponse.json({
        ok:        true,
        resultUrl: '/sample_face_valid.jpg',
        taskId:    `mock_necklace_${Date.now()}`,
        mock:      true,
      });
    }

    const contentType = req.headers.get('content-type') ?? '';
    let selfieBuffer:   Buffer | null = null;
    let necklaceBuffer: Buffer | null = null;
    let selfieMime = 'image/jpeg';
    let necklaceMime = 'image/jpeg';
    let selfieUrl: string | undefined;
    let necklaceUrl:    string | undefined;
    let shadowIntensity        = 0.15;
    let ambientLightIntensity  = 1.0;

    if (contentType.includes('multipart/form-data')) {
      const form          = await req.formData();
      const selfieRaw     = form.get('selfiePhoto')   as File   | null;
      const necklaceRaw   = form.get('necklacePhoto') as File   | null;
      const necklaceUrlRaw= form.get('necklaceUrl')   as string | null;
      const selfieUrlRaw = form.get('selfieUrl') as string | null;
      const shadowRaw     = form.get('shadowIntensity')       as string | null;
      const ambientRaw    = form.get('ambientLightIntensity') as string | null;

      if (selfieRaw) {
        if (!['image/jpeg', 'image/png'].includes(selfieRaw.type)) return NextResponse.json({ ok: false, message: 'Use a JPG or PNG selfie.' }, { status: 400 });
        selfieMime = selfieRaw.type;
        selfieBuffer = Buffer.from(await selfieRaw.arrayBuffer());
      }
      if (necklaceRaw) {
        if (!['image/jpeg', 'image/png'].includes(necklaceRaw.type)) return NextResponse.json({ ok: false, message: 'Use a JPG or PNG necklace image.' }, { status: 400 });
        necklaceMime = necklaceRaw.type;
        necklaceBuffer = Buffer.from(await necklaceRaw.arrayBuffer());
      }
      if (necklaceUrlRaw) necklaceUrl    = necklaceUrlRaw;
      if (selfieUrlRaw) selfieUrl = selfieUrlRaw;
      if (shadowRaw)      shadowIntensity = parseFloat(shadowRaw);
      if (ambientRaw)     ambientLightIntensity = parseFloat(ambientRaw);
    } else {
      const body           = await req.json().catch(() => ({}));
      necklaceUrl          = body.necklaceUrl as string | undefined;
      selfieUrl            = body.selfieUrl as string | undefined;
      shadowIntensity      = typeof body.shadowIntensity === 'number' ? body.shadowIntensity : 0.15;
      ambientLightIntensity= typeof body.ambientLightIntensity === 'number' ? body.ambientLightIntensity : 1.0;
      if (body.selfiePhoto?.startsWith('data:image')) {
        selfieMime = body.selfiePhoto.slice(5, body.selfiePhoto.indexOf(';'));
        selfieBuffer = Buffer.from(body.selfiePhoto.split(',')[1], 'base64');
      }
    }

    // Validate sizes — docs: long side ≤ 4096, < 10 MB
    if (selfieBuffer && selfieBuffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, message: 'Selfie too large — max 10 MB.' },
        { status: 400 }
      );
    }
    if (necklaceBuffer && necklaceBuffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, message: 'Necklace image too large — max 10 MB.' },
        { status: 400 }
      );
    }
    if (selfieBuffer) {
      const imageError = validateImageBuffer(selfieBuffer, selfieMime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png'] });
      if (imageError) return NextResponse.json({ ok: false, message: `Selfie: ${imageError}` }, { status: 400 });
    }
    if (necklaceBuffer) {
      const imageError = validateImageBuffer(necklaceBuffer, necklaceMime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png'] });
      if (imageError) return NextResponse.json({ ok: false, message: `Necklace image: ${imageError}` }, { status: 400 });
    }

    // Clamp intensities to documented range [0.0, 1.0]
    shadowIntensity       = Math.max(0, Math.min(1, shadowIntensity));
    ambientLightIntensity = Math.max(0, Math.min(1, ambientLightIntensity));

    // ── Source selfie ──────────────────────────────────────────────────────────
    let src_file_id:  string | undefined;
    let src_file_url: string | undefined;

    if (selfieBuffer && selfieBuffer.length > 0) {
      const imageError = validateImageBuffer(selfieBuffer, selfieMime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png'] });
      if (imageError) return NextResponse.json({ ok: false, message: `Selfie: ${imageError}` }, { status: 400 });
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

    // ── Necklace reference (ref_file_urls array per docs) ─────────────────────
    let ref_file_ids: string[] | undefined;
    let ref_file_urls: string[] | undefined;

    if (necklaceBuffer && necklaceBuffer.length > 0) {
      const necklaceId = await uploadFile(necklaceBuffer, necklaceMime, necklaceMime === 'image/png' ? 'necklace.png' : 'necklace.jpg');
      ref_file_ids = [necklaceId];
    } else if (necklaceUrl) {
      const sample = readLocalSampleImage(necklaceUrl);
      if (sample) {
        const imageError = validateImageBuffer(sample.buffer, sample.mime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png'] });
        if (imageError) return NextResponse.json({ ok: false, message: `Necklace sample: ${imageError}` }, { status: 400 });
        const sampleId = await uploadFile(sample.buffer, sample.mime, `necklace-sample.${sample.mime === 'image/png' ? 'png' : 'jpg'}`);
        ref_file_ids = [sampleId];
      } else if (isSafePublicHttpsImageUrl(necklaceUrl)) {
        ref_file_urls = [necklaceUrl];
      } else return NextResponse.json({ ok: false, message: 'Use an HTTPS image URL, a built-in necklace sample, or upload an image file.' }, { status: 400 });
    } else {
      return NextResponse.json(
        { ok: false, message: 'A necklace product image (file or URL) is required.' },
        { status: 400 }
      );
    }

    const taskPayload: Record<string, unknown> = {
      ...(src_file_id  ? { src_file_id }  : { src_file_url }),
      ...(ref_file_ids ? { ref_file_ids } : { ref_file_urls }),
      necklace_shadow_intensity:       shadowIntensity,
      necklace_ambient_light_intensity: ambientLightIntensity,
    };

    const taskId      = await createNecklaceTask(taskPayload);
    const remoteUrl   = await pollNecklaceTask(taskId);
    const localResult = await saveResult(remoteUrl, 'necklace_tryon', { userId: quota.userId, category: 'necklace' });

    return NextResponse.json({ ok: true, resultUrl: localResult, taskId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Necklace VTO failed.';
    console.error('Necklace VTO error:', message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
