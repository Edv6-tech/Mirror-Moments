import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { uploadFile, saveResult, isMockMode } from '@/lib/youcam/youcamClient';
import { validateImageBuffer } from '@/lib/imageValidation';
import { rejectOversizedRequest } from '@/lib/requestLimits';
import { consumeTryOnQuota } from '@/lib/tryonQuota';

// ── Endpoints (grounded in YouCam AI Nail VTO v1.0 docs) ─────────────────────
// POST /s2s/v2.0/task/nail-vto   — create task
// GET  /s2s/v2.0/task/nail-vto/{task_id} — poll

const BASE_URL = process.env.YOUCAM_BASE_URL ?? 'https://yce-api-01.makeupar.com';
const API_KEY  = process.env.YOUCAM_API_KEY ?? '';

const POLL_MAX      = 30;   // max attempts
const POLL_INTERVAL = 3000; // ms between polls

function authHeaders() {
  return { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' };
}

async function createNailTask(payload: Record<string, unknown>): Promise<string> {
  const res  = await fetch(`${BASE_URL}/s2s/v2.0/task/nail-vto`, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data?.data?.task_id) {
    const code = data?.error_code ?? data?.error ?? res.status;
    throw new Error(`Nail VTO task creation failed: ${code}`);
  }
  return data.data.task_id as string;
}

async function pollNailTask(taskId: string): Promise<string> {
  for (let i = 0; i < POLL_MAX; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    const res  = await fetch(`${BASE_URL}/s2s/v2.0/task/nail-vto/${taskId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = await res.json();
    const status = data?.data?.task_status as string | undefined;

    if (status === 'success') {
      // docs: results.url  (same pattern as other YouCam endpoints)
      const url =
        (data?.data?.results?.url as string | undefined) ??
        (data?.data?.results?.[0]?.download_url as string | undefined);
      if (!url) throw new Error('Nail VTO task succeeded but result URL missing');
      return url;
    }
    if (status === 'error') {
      const reason = data?.data?.error ?? data?.data?.failure_reason ?? 'unknown_error';
      throw new Error(`Nail VTO engine error: ${reason}`);
    }
    // queued / running — keep polling
  }
  throw new Error(`Nail VTO task timed out after ${POLL_MAX} attempts`);
}

export async function POST(req: NextRequest) {
  try {
    const tooLarge = rejectOversizedRequest(req, 12 * 1024 * 1024);
    if (tooLarge) return tooLarge;
    const quota = await consumeTryOnQuota(req);
    if (quota.response) return quota.response;
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 2000));
      return NextResponse.json({
        ok:        true,
        resultUrl: '/sample_face_valid.jpg',
        taskId:    `mock_nail_${Date.now()}`,
        mock:      true,
      });
    }

    const contentType = req.headers.get('content-type') ?? '';
    let handBuffer: Buffer | null = null;
    let handMime = 'image/jpeg';
    let effectPayload: Record<string, unknown> = {};

    if (contentType.includes('multipart/form-data')) {
      const form       = await req.formData();
      const handFile   = form.get('handPhoto') as File | null;
      const effectRaw  = form.get('effectPayload') as string | null;

      if (handFile) {
        if (!['image/jpeg', 'image/png'].includes(handFile.type)) return NextResponse.json({ ok: false, message: 'Use a JPG or PNG hand photo.' }, { status: 400 });
        handMime = handFile.type;
        handBuffer = Buffer.from(await handFile.arrayBuffer());
      }
      if (effectRaw) {
        try { effectPayload = JSON.parse(effectRaw); } catch { effectPayload = {}; }
      }
    } else {
      const body   = await req.json().catch(() => ({}));
      effectPayload = body.effectPayload ?? {};
      if (body.handPhoto?.startsWith('data:image')) {
        handMime = body.handPhoto.slice(5, body.handPhoto.indexOf(';'));
        handBuffer = Buffer.from(body.handPhoto.split(',')[1], 'base64');
      }
    }

    if (!effectPayload.effects || !Array.isArray(effectPayload.effects)) {
      return NextResponse.json(
        { ok: false, message: 'No nail effect configuration provided.' },
        { status: 400 }
      );
    }

    // ── Upload hand photo OR use sample URL from docs ──────────────────────
    let src_file_id: string | undefined;
    let src_file_url: string | undefined;

    if (handBuffer && handBuffer.length > 0) {
      if (handBuffer.length > 10 * 1024 * 1024) {
        return NextResponse.json(
          { ok: false, message: 'Hand photo too large — max 10 MB.' },
          { status: 400 }
        );
      }
      const imageError = validateImageBuffer(handBuffer, handMime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png'] });
      if (imageError) return NextResponse.json({ ok: false, message: `Hand photo: ${imageError}` }, { status: 400 });
      src_file_id = await uploadFile(handBuffer, handMime, handMime === 'image/png' ? 'hand.png' : 'hand.jpg');
    } else {
      const samplePath = path.resolve(process.cwd(), 'public/samples/sample-hand.jpg');
      if (!fs.existsSync(samplePath)) return NextResponse.json({ ok: false, message: 'No sample hand photo is available. Upload a hand photo to continue.' }, { status: 400 });
      src_file_id = await uploadFile(fs.readFileSync(samplePath), 'image/jpeg', 'sample-hand.jpg');
    }

    const taskPayload: Record<string, unknown> = {
      ...(src_file_id ? { src_file_id } : { src_file_url }),
      version:     '1.0',
      effect_type: effectPayload.effect_type ?? 'nail_polish',
      effects:     effectPayload.effects,
    };
    if (effectPayload.ref_file_ids) {
      taskPayload.ref_file_ids = effectPayload.ref_file_ids;
    }

    const taskId       = await createNailTask(taskPayload);
    const remoteUrl    = await pollNailTask(taskId);
    const localResult  = await saveResult(remoteUrl, 'nail_tryon', { userId: quota.userId, category: 'nails' });

    return NextResponse.json({ ok: true, resultUrl: localResult, taskId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Nail try-on failed.';
    console.error('Nail VTO error:', message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
