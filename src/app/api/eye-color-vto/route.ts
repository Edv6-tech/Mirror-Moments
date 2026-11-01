import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { uploadFile, saveResult, isMockMode } from '@/lib/youcam/youcamClient';
import { validateImageBuffer } from '@/lib/imageValidation';
import { isSafePublicHttpsImageUrl, readLocalPublicImage } from '@/lib/sampleImages';
import { rejectOversizedRequest } from '@/lib/requestLimits';
import { consumeTryOnQuota } from '@/lib/tryonQuota';

// ── Endpoints (grounded in YouCam AI Eye Color Lens VTO docs) ─────────────────
// POST /s2s/v2.0/task/eye-color-vto   — create task
// GET  /s2s/v2.0/task/eye-color-vto/{task_id} — poll
//
// Files use the documented shared file-registration endpoint.

const BASE_URL = process.env.YOUCAM_BASE_URL ?? 'https://yce-api-01.makeupar.com';
const API_KEY  = process.env.YOUCAM_API_KEY ?? '';

const POLL_MAX      = 30;
const POLL_INTERVAL = 3000;

function validLensPng(buffer: Buffer): boolean {
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(pngSignature) || buffer.toString('ascii', 12, 16) !== 'IHDR') return false;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return width >= 200 && width <= 600 && height >= 200 && height <= 600;
}

function authHeaders() {
  return { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' };
}

// ── Error code → user-friendly messages (from docs) ──────────────────────────
const ERROR_MAP: Record<string, string> = {
  error_below_min_image_size:       'Your photo is too small — the short side must be at least 320 px.',
  error_face_position_invalid:      'Face position is invalid. Make sure your face is fully in frame and front-facing.',
  error_face_position_too_small:    'Your face is too small in the photo. Move closer to the camera.',
  error_face_position_out_of_boundary: 'Your face is cut off. Make sure your entire face fits within the frame.',
  error_insufficient_lighting:      'Photo is too dark. Move to a brighter spot and try again.',
  error_face_angle_invalid:         'Head angle is off. Keep your face within 10° of straight-on (front-facing).',
};

async function createEyeTask(payload: Record<string, unknown>): Promise<string> {
  const res  = await fetch(`${BASE_URL}/s2s/v2.0/task/eye-color-vto`, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data?.data?.task_id) {
    const code = data?.error_code ?? data?.error ?? res.status;
    throw new Error(`Eye Color VTO task creation failed: ${code}`);
  }
  return data.data.task_id as string;
}

async function pollEyeTask(taskId: string): Promise<string> {
  for (let i = 0; i < POLL_MAX; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    const res  = await fetch(`${BASE_URL}/s2s/v2.0/task/eye-color-vto/${taskId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = await res.json();
    const status = data?.data?.task_status as string | undefined;

    if (status === 'success') {
      const url =
        (data?.data?.results?.url as string | undefined) ??
        (data?.data?.results?.[0]?.download_url as string | undefined);
      if (!url) throw new Error('Eye Color VTO succeeded but result URL missing');
      return url;
    }
    if (status === 'error') {
      const reason = (data?.data?.error ?? data?.data?.failure_reason ?? 'unknown_error') as string;
      throw new Error(ERROR_MAP[reason] ?? `Eye Color VTO engine error: ${reason}`);
    }
  }
  throw new Error(`Eye Color VTO timed out after ${POLL_MAX} attempts`);
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
        ok: true, resultUrl: '/sample_face_valid.jpg',
        taskId: `mock_eye_${Date.now()}`, mock: true,
      });
    }

    const contentType = req.headers.get('content-type') ?? '';
    let selfieBuffer: Buffer | null = null;
    let selfieMime = 'image/jpeg';
    let selfieUrl:    string | undefined;
    let lensId:       string | undefined; // e.g. 'ocean_blue' — maps to public/lenses/<id>.png
    let lensBuffer:   Buffer | null = null;

    if (contentType.includes('multipart/form-data')) {
      const form      = await req.formData();
      const selfieRaw = form.get('selfiePhoto') as File   | null;
      const selfieU   = form.get('selfieUrl')   as string | null;
      const lensIdRaw = form.get('lensId')      as string | null;  // preferred: local PNG id
      const lensRaw   = form.get('lensPhoto')   as File   | null;  // fallback: uploaded file

      if (selfieRaw) {
        if (!['image/jpeg', 'image/png'].includes(selfieRaw.type)) return NextResponse.json({ ok: false, message: 'Use a JPG or PNG selfie.' }, { status: 400 });
        selfieMime = selfieRaw.type;
        selfieBuffer = Buffer.from(await selfieRaw.arrayBuffer());
      }
      if (selfieU)   selfieUrl    = selfieU;
      if (lensIdRaw) lensId       = lensIdRaw;
      if (lensRaw) {
        if (lensRaw.type !== 'image/png') return NextResponse.json({ ok: false, message: 'The eye-colour lens reference must be a PNG.' }, { status: 400 });
        lensBuffer = Buffer.from(await lensRaw.arrayBuffer());
      }
    } else {
      const body = await req.json().catch(() => ({}));
      selfieUrl  = body.selfieUrl  as string | undefined;
      lensId     = body.lensId     as string | undefined;
    }

    // Validate sizes per docs: selfie long side ≤ 1920, short side ≥ 320, < 10 MB
    if (selfieBuffer && selfieBuffer.length > 10 * 1024 * 1024)
      return NextResponse.json({ ok: false, message: 'Selfie too large — max 10 MB.' }, { status: 400 });
    if (lensBuffer && lensBuffer.length > 10 * 1024 * 1024)
      return NextResponse.json({ ok: false, message: 'Lens image too large — max 10 MB.' }, { status: 400 });

    // ── Upload selfie ──────────────────────────────────────────────────────────
    let src_file_id:  string | undefined;
    let src_file_url: string | undefined;

    if (selfieBuffer && selfieBuffer.length > 0) {
      const imageError = validateImageBuffer(selfieBuffer, selfieMime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 1920, minShortSide: 320, allowedMimes: ['image/jpeg', 'image/png'] });
      if (imageError) return NextResponse.json({ ok: false, message: `Selfie: ${imageError}` }, { status: 400 });
      src_file_id = await uploadFile(selfieBuffer, selfieMime, selfieMime === 'image/png' ? 'selfie.png' : 'selfie.jpg');
    } else if (selfieUrl) {
      const localSelfie = readLocalPublicImage(selfieUrl);
      if (localSelfie) {
        const imageError = validateImageBuffer(localSelfie.buffer, localSelfie.mime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 1920, minShortSide: 320, allowedMimes: ['image/jpeg', 'image/png'] });
        if (imageError) return NextResponse.json({ ok: false, message: `Portrait sample: ${imageError}` }, { status: 400 });
        src_file_id = await uploadFile(localSelfie.buffer, localSelfie.mime, 'sample-selfie.jpg');
      } else if (isSafePublicHttpsImageUrl(selfieUrl)) {
        src_file_url = selfieUrl;
      } else return NextResponse.json({ ok: false, message: 'Use an HTTPS image URL, the built-in portrait sample, or upload a selfie.' }, { status: 400 });
    } else {
      const samplePath = path.resolve(process.cwd(), 'public/sample_face_valid.jpg');
      if (!fs.existsSync(samplePath)) return NextResponse.json({ ok: false, message: 'No sample portrait is available. Upload a selfie to continue.' }, { status: 400 });
      src_file_id = await uploadFile(fs.readFileSync(samplePath), 'image/jpeg', 'sample-selfie.jpg');
    }

    // ── Resolve & upload lens PNG ──────────────────────────────────────────────
    // Priority: local lens ID → uploaded file → error
    // We upload the selected lens through the documented shared file endpoint.
    // Per docs: lens must be PNG 200×200 to 600×600, background removed preferred.
    let ref_file_id: string;

    if (lensId) {
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(lensId)) {
        return NextResponse.json({ ok: false, message: 'Choose a valid eye-colour lens preset.' }, { status: 400 });
      }
      // Load from public/lenses/<lensId>.png (generated by scripts/generate-lenses.mjs)
      const lensPath = path.join(process.cwd(), 'public', 'lenses', `${lensId}.png`);
      if (!fs.existsSync(lensPath)) {
        return NextResponse.json(
          { ok: false, message: `Lens preset '${lensId}' not found. Run scripts/generate-lenses.mjs first.` },
          { status: 400 }
        );
      }
      const localLensBuffer = fs.readFileSync(lensPath);
      if (!validLensPng(localLensBuffer)) return NextResponse.json({ ok: false, message: 'This lens preset must be a 200–600 px square PNG.' }, { status: 400 });
      ref_file_id = await uploadFile(localLensBuffer, 'image/png', `${lensId}.png`);
    } else if (lensBuffer && lensBuffer.length > 0) {
      if (!validLensPng(lensBuffer)) return NextResponse.json({ ok: false, message: 'The lens reference must be a PNG with width and height from 200 to 600 px.' }, { status: 400 });
      ref_file_id = await uploadFile(lensBuffer, 'image/png', 'lens.png');
    } else {
      return NextResponse.json(
        { ok: false, message: 'A lens ID or lens image file is required.' },
        { status: 400 }
      );
    }

    const taskPayload: Record<string, unknown> = {
      version: '1.0',
      ...(src_file_id ? { src_file_id } : { src_file_url }),
      ref_file_id,
      effect: {
        intensity: 1,
        enlargement: 0,
        skin_smooth_strength: 50,
        skin_smooth_color_intensity: 50,
      },
    };

    const taskId      = await createEyeTask(taskPayload);
    const remoteUrl   = await pollEyeTask(taskId);
    const localResult = await saveResult(remoteUrl, 'eye_color_tryon', { userId: quota.userId, category: 'eye-color' });

    return NextResponse.json({ ok: true, resultUrl: localResult, taskId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Eye Color VTO failed.';
    console.error('Eye Color VTO error:', message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
