import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { uploadFile, createTask, pollTask, saveResult, isMockMode } from '@/lib/youcam/youcamClient';
import { validateImageBuffer } from '@/lib/imageValidation';
import { rejectOversizedRequest } from '@/lib/requestLimits';
import { consumeTryOnQuota } from '@/lib/tryonQuota';

// Per YouCam docs (ai_shoes v3.0):
//   POST /s2s/v2.0/task/shoes-transfer
//   GET  /s2s/v2.0/task/shoes-transfer/{task_id}
//   Selfie: 512×512 min, foot visible, full body preferred
//   Ref: product (512×512) or worn (800×800)
//   Params: gender (optional), style (optional, "random")
//   Formats: jpg/jpeg/png/heic, < 10 MB

export async function POST(req: NextRequest) {
  try {
    const tooLarge = rejectOversizedRequest(req, 22 * 1024 * 1024);
    if (tooLarge) return tooLarge;
    const quota = await consumeTryOnQuota(req);
    if (quota.response) return quota.response;
    let personBuffer: Buffer | null = null;
    let refBuffer: Buffer | null = null;
    let personMime = 'image/jpeg';
    let refMime = 'image/jpeg';
    let gender = 'female';
    let style = 'random';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const personFile = formData.get('personPhoto') as File | null;
      const refFile = formData.get('garmentPhoto') as File | null;
      if (formData.get('gender')) gender = formData.get('gender') as string;
      if (formData.get('style')) style = formData.get('style') as string;

      if (personFile) {
        if (!['image/jpeg', 'image/png'].includes(personFile.type)) return NextResponse.json({ ok: false, message: 'Use a JPG or PNG photo.' }, { status: 400 });
        personMime = personFile.type;
        personBuffer = Buffer.from(await personFile.arrayBuffer());
      }
      if (refFile) {
        if (!['image/jpeg', 'image/png'].includes(refFile.type)) return NextResponse.json({ ok: false, message: 'Use a JPG or PNG shoe reference.' }, { status: 400 });
        refMime = refFile.type;
        refBuffer = Buffer.from(await refFile.arrayBuffer());
      }
    } else {
      const body = await req.json().catch(() => ({}));
      if (body.gender) gender = body.gender;
      if (body.style) style = body.style;

      if (body.personPhoto?.startsWith('data:image')) {
        personMime = body.personPhoto.slice(5, body.personPhoto.indexOf(';'));
        personBuffer = Buffer.from(body.personPhoto.split(',')[1], 'base64');
      }
      if (body.garmentPhoto?.startsWith('data:image')) {
        refMime = body.garmentPhoto.slice(5, body.garmentPhoto.indexOf(';'));
        refBuffer = Buffer.from(body.garmentPhoto.split(',')[1], 'base64');
      }
    }

    if (!personBuffer) {
      return NextResponse.json(
        { ok: false, message: 'Please upload a full-body photo with your feet visible.' },
        { status: 400 }
      );
    }
    if (!refBuffer) {
      return NextResponse.json(
        { ok: false, message: 'Please upload a shoes reference photo.' },
        { status: 400 }
      );
    }

    for (const [label, buffer, mime] of [['Person photo', personBuffer, personMime], ['Shoe reference', refBuffer, refMime]] as const) {
      const imageError = validateImageBuffer(buffer, mime, { maxBytes: 10 * 1024 * 1024, minShortSide: 512, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png'] });
      if (imageError) return NextResponse.json({ ok: false, message: `${label}: ${imageError}` }, { status: 400 });
    }

    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 2000));
      return NextResponse.json({
        ok: true,
        resultUrl: '/sample_face_valid.jpg',
        taskId: `mock_shoes_${Date.now()}`,
        mock: true,
      });
    }

    // Upload both images
    const srcFileId = await uploadFile(personBuffer, personMime, personMime === 'image/png' ? 'person.png' : 'person.jpg');
    const refFileId = await uploadFile(refBuffer, refMime, refMime === 'image/png' ? 'shoes_ref.png' : 'shoes_ref.jpg');

    // Create task
    const taskId = await createTask('/s2s/v2.0/task/shoes-transfer', {
      src_file_id: srcFileId,
      ref_file_id: refFileId,
      gender,
      style,
    });

    // Poll result
    const pollResult = await pollTask('/s2s/v2.0/task/shoes-transfer', taskId);
    const localResultUrl = await saveResult(pollResult.url, 'shoes_tryon', { userId: quota.userId, category: 'shoes' });

    return NextResponse.json({ ok: true, resultUrl: localResultUrl, taskId });
  } catch (err: any) {
    console.error('Shoes try-on error:', err);
    const msg = err.message || '';
    let friendlyMessage = 'Shoes try-on failed. Please try a different photo.';
    if (msg.includes('error_no_face')) {
      friendlyMessage = 'No face detected. Please use a photo with your face visible.';
    } else if (msg.includes('invalid_parameter')) {
      friendlyMessage = 'Invalid gender or style. Please try again.';
    } else if (msg.includes('Server key problem') || msg.includes('InvalidAccessToken') || msg.includes('401')) {
      friendlyMessage = 'YouCam rejected the server API key. Update YOUCAM_API_KEY in the server environment and restart the app.';
    }
    return NextResponse.json({ ok: false, message: friendlyMessage }, { status: 500 });
  }
}
