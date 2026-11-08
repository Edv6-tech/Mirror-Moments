import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { uploadFile, isMockMode, getResultImageDataUrl } from '@/lib/youcam/youcamClient';
import { validateImageBuffer } from '@/lib/imageValidation';
import { rejectOversizedRequest } from '@/lib/requestLimits';
import { consumeTryOnQuota } from '@/lib/tryonQuota';

const BASE_URL = process.env.YOUCAM_BASE_URL ?? 'https://yce-api-01.makeupar.com';
const API_KEY = process.env.YOUCAM_API_KEY ?? '';

const POLL_MAX = 30;   // attempts
const POLL_INTERVAL = 3000; // ms

function headers() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function createMakeupTask(payload: {
  src_file_id?: string;
  src_file_url?: string;
  effects: unknown[];
  version: string;
}): Promise<string> {
  const res = await fetch(`${BASE_URL}/s2s/v2.0/task/makeup-vto`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data?.data?.task_id) {
    const code = data?.error_code ?? data?.error ?? res.status;
    throw new Error(`Makeup VTO task creation failed: ${code}`);
  }
  return data.data.task_id as string;
}

async function pollMakeupTask(taskId: string): Promise<string> {
  for (let i = 0; i < POLL_MAX; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    const res = await fetch(`${BASE_URL}/s2s/v2.0/task/makeup-vto/${taskId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = await res.json();
    const status = data?.data?.task_status as string | undefined;
    if (status === 'success') {
      // Per docs the result URL is in data.results.url
      const url = data?.data?.results?.url as string | undefined;
      if (!url) throw new Error('Makeup VTO task succeeded but result URL missing');
      return url;
    }
    if (status === 'error') {
      const reason = data?.data?.error ?? data?.data?.failure_reason ?? 'unknown_error';
      const detail = data?.data?.error_message;
      throw new Error(`Makeup VTO engine error: ${reason}${detail ? ` — ${detail}` : ''}`);
    }
    // still running / queued — continue polling
  }
  throw new Error('Makeup VTO task timed out after ' + POLL_MAX + ' attempts');
}

export async function POST(req: NextRequest) {
  try {
    const tooLarge = rejectOversizedRequest(req, 12 * 1024 * 1024);
    if (tooLarge) return tooLarge;
    const quota = await consumeTryOnQuota(req);
    if (quota.response) return quota.response;
    // --- Mock fast-path ---
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 2000));
      return NextResponse.json({
        ok: true,
        resultUrl: '/sample_face_valid.jpg',
        taskId: `mock_makeup_${Date.now()}`,
        mock: true,
      });
    }

    const contentType = req.headers.get('content-type') ?? '';
    let personBuffer: Buffer | null = null;
    let personMime = 'image/jpeg';
    let effects: unknown[] = [];
    let includeResultImageData = false;

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const personFile = form.get('personPhoto') as File | null;
      const effectsRaw = form.get('effects') as string | null;
      includeResultImageData = form.get('includeResultImageData') === 'true';

      if (personFile) {
        if (!['image/jpeg', 'image/png'].includes(personFile.type)) return NextResponse.json({ ok: false, message: 'Use a JPG or PNG selfie.' }, { status: 400 });
        personMime = personFile.type;
        personBuffer = Buffer.from(await personFile.arrayBuffer());
      }
      if (effectsRaw) {
        try { effects = JSON.parse(effectsRaw); } catch { effects = []; }
      }
    } else {
      const body = await req.json().catch(() => ({}));
      effects = Array.isArray(body.effects) ? body.effects : [];
      includeResultImageData = body.includeResultImageData === true;

      if (body.personPhoto) {
        if (body.personPhoto.startsWith('data:image')) {
          personMime = body.personPhoto.slice(5, body.personPhoto.indexOf(';'));
          personBuffer = Buffer.from(body.personPhoto.split(',')[1], 'base64');
        }
      }
    }

    if (!effects.length) {
      return NextResponse.json(
        { ok: false, message: 'Please select at least one makeup effect.' },
        { status: 400 }
      );
    }

    // --- Upload selfie if provided, otherwise use public URL ---
    let src_file_id: string | undefined;
    let src_file_url: string | undefined;

    if (personBuffer && personBuffer.length > 0) {
      if (personBuffer.length > 10 * 1024 * 1024) {
        return NextResponse.json(
          { ok: false, message: 'Photo too large — max 10 MB.' },
          { status: 400 }
        );
      }
      const imageError = validateImageBuffer(personBuffer, personMime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 1919, allowedMimes: ['image/jpeg', 'image/png'] });
      if (imageError) return NextResponse.json({ ok: false, message: `Selfie: ${imageError}` }, { status: 400 });
      src_file_id = await uploadFile(personBuffer, personMime, personMime === 'image/png' ? 'selfie.png' : 'selfie.jpg');
    } else {
      const samplePath = path.resolve(process.cwd(), 'public/sample_face_valid.jpg');
      if (!fs.existsSync(samplePath)) return NextResponse.json({ ok: false, message: 'No sample portrait is available. Upload a selfie to continue.' }, { status: 400 });
      src_file_id = await uploadFile(fs.readFileSync(samplePath), 'image/jpeg', 'sample-selfie.jpg');
    }

    const taskPayload = {
      ...(src_file_id ? { src_file_id } : { src_file_url }),
      effects,
      version: '1.0',
    };

    const taskId = await createMakeupTask(taskPayload);
    const resultRemoteUrl = await pollMakeupTask(taskId);
    const resultImageData = includeResultImageData ? await getResultImageDataUrl(resultRemoteUrl) : undefined;

    // Cache result locally
    const { saveResult } = await import('@/lib/youcam/youcamClient');
    const localResultUrl = await saveResult(resultRemoteUrl, 'makeup_tryon', { userId: quota.userId, category: 'makeup' });

    return NextResponse.json({ ok: true, resultUrl: localResultUrl, ...(resultImageData ? { resultImageData } : {}), taskId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Makeup try-on failed.';
    console.error('Makeup VTO error:', message);
    return NextResponse.json(
      { ok: false, message },
      { status: 500 }
    );
  }
}
