import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { uploadFile, createTask, pollTask, saveResult, isMockMode } from '@/lib/youcam/youcamClient';
import { validateImageBuffer } from '@/lib/imageValidation';
import { readLocalPublicImage } from '@/lib/sampleImages';
import { rejectOversizedRequest } from '@/lib/requestLimits';
import { consumeTryOnQuota } from '@/lib/tryonQuota';

// Per YouCam docs (ai_hairstyle v2.1):
//   POST /s2s/v2.1/task/hair-transfer
//   GET  /s2s/v2.1/task/hair-transfer/{task_id}
//   Format: JPG/JPEG only, long side ≤ 1024, face width ≥ 128
//   Ref is a photo of someone with the target hairstyle (face must be visible)
//   The client-side SegFormer worker already resizes to max 1024 before sending.

export async function POST(req: NextRequest) {
  try {
    const tooLarge = rejectOversizedRequest(req, 22 * 1024 * 1024);
    if (tooLarge) return tooLarge;
    const quota = await consumeTryOnQuota(req);
    if (quota.response) return quota.response;
    let userBuffer: Buffer | null = null;
    let templateId: string | null = null;
    let refFileBuffer: Buffer | null = null;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const userFile = formData.get('userPhoto') as File | null;
      const refFile = formData.get('refPhoto') as File | null;
      templateId = formData.get('templateId') as string | null;

      if (userFile) {
        if (userFile.type !== 'image/jpeg') return NextResponse.json({ ok: false, message: 'Hair try-on needs a JPG/JPEG photo.' }, { status: 400 });
        userBuffer = Buffer.from(await userFile.arrayBuffer());
      }
      if (refFile) {
        if (refFile.type !== 'image/jpeg') return NextResponse.json({ ok: false, message: 'Choose a JPG/JPEG hairstyle reference.' }, { status: 400 });
        refFileBuffer = Buffer.from(await refFile.arrayBuffer());
      }
    } else {
      const body = await req.json().catch(() => ({}));
      templateId = body.templateId || null;

      if (body.userPhoto) {
        if (body.userPhoto.startsWith('data:image')) {
          const base64 = body.userPhoto.split(',')[1];
          userBuffer = Buffer.from(base64, 'base64');
        } else if (body.userPhoto.startsWith('/')) {
          const local = readLocalPublicImage(body.userPhoto);
          if (local?.mime === 'image/jpeg') userBuffer = local.buffer;
        }
      }

      if (body.refPhoto) {
        if (body.refPhoto.startsWith('data:image')) {
          const base64 = body.refPhoto.split(',')[1];
          refFileBuffer = Buffer.from(base64, 'base64');
        } else if (body.refPhoto.startsWith('/')) {
          const local = readLocalPublicImage(body.refPhoto);
          if (local?.mime === 'image/jpeg') refFileBuffer = local.buffer;
        }
      }
    }

    // A sample is only appropriate for an explicitly mocked demo request.
    if (!userBuffer) {
      if (!isMockMode()) {
        return NextResponse.json(
          { ok: false, message: 'Please upload a front-facing JPG photo with one face and visible shoulders.' },
          { status: 400 }
        );
      }
      const sampleFace = path.resolve(process.cwd(), 'public/sample_face_valid.jpg');
      if (fs.existsSync(sampleFace)) {
        userBuffer = fs.readFileSync(sampleFace);
      } else {
        return NextResponse.json(
          { ok: false, message: 'Please upload a front-facing photo with one face and visible shoulders.' },
          { status: 400 }
        );
      }
    }

    const userImageError = validateImageBuffer(userBuffer, 'image/jpeg', { maxBytes: 10 * 1024 * 1024, maxLongSide: 1024, allowedMimes: ['image/jpeg'] });
    if (userImageError) return NextResponse.json({ ok: false, message: `Your photo: ${userImageError}` }, { status: 400 });
    if (refFileBuffer) {
      const refImageError = validateImageBuffer(refFileBuffer, 'image/jpeg', { maxBytes: 10 * 1024 * 1024, maxLongSide: 1024, allowedMimes: ['image/jpeg'] });
      if (refImageError) return NextResponse.json({ ok: false, message: `Hairstyle reference: ${refImageError}` }, { status: 400 });
    }

    // Per docs: require ref photo when no template — do NOT fall back to a fake template ID
    if (!templateId && !refFileBuffer) {
      return NextResponse.json(
        { ok: false, message: 'Please upload a reference photo showing the hairstyle you want to try on.' },
        { status: 400 }
      );
    }

    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 2000));
      return NextResponse.json({
        ok: true,
        resultUrl: '/sample_face_valid.jpg',
        taskId: `mock_hair_${Date.now()}`,
        mock: true,
      });
    }

    // 1. Upload user photo (JPEG per docs)
    const srcFileId = await uploadFile(userBuffer, 'image/jpeg', 'user_face.jpg');

    // 2. Prepare payload
    const payload: Record<string, unknown> = {
      src_file_id: srcFileId,
    };

    if (refFileBuffer) {
      // Upload the reference photo (person with target hairstyle, JPEG per docs)
      const refFileId = await uploadFile(refFileBuffer, 'image/jpeg', 'hair_ref.jpg');
      payload.ref_file_id = refFileId;
    } else {
      payload.template_id = templateId;
    }

    // 3. Create task at POST /s2s/v2.1/task/hair-transfer
    const taskId = await createTask('/s2s/v2.1/task/hair-transfer', payload);

    // 4. Poll GET /s2s/v2.1/task/hair-transfer/{task_id}
    const pollResult = await pollTask('/s2s/v2.1/task/hair-transfer', taskId);

    // 5. Save result locally (YouCam URLs expire after ~24h)
    const localResultUrl = await saveResult(pollResult.url, 'hair_tryon', { userId: quota.userId, category: 'hair' });

    return NextResponse.json({
      ok: true,
      resultUrl: localResultUrl,
      taskId,
    });
  } catch (err: any) {
    console.error('Hair try-on error:', err);

    // Map known YouCam error codes to friendly messages
    const msg = err.message || '';
    let friendlyMessage = 'Hair try-on failed. Please try a different photo.';
    if (msg.includes('error_no_shoulder')) {
      friendlyMessage = 'Shoulders are not visible. Please use a photo that shows your shoulders.';
    } else if (msg.includes('error_face_too_small') || msg.includes('face width')) {
      friendlyMessage = 'Your face is too small or too far away. Use a clear, front-facing photo with your head and shoulders visible.';
    } else if (msg.includes('error_below_min_image_size')) {
      friendlyMessage = 'The photo is too small for hair try-on. Choose a higher-resolution image.';
    } else if (msg.includes('error_exceed_max_image_size')) {
      friendlyMessage = 'The photo is too large for hair try-on. Please choose a smaller image.';
    } else if (msg.includes('error_large_face_angle')) {
      friendlyMessage = 'Face angle is too large. Please use a front-facing photo.';
    } else if (msg.includes('error_face_pose')) {
      friendlyMessage = 'Please use a front-facing photo with your head level.';
    } else if (msg.includes('error_insufficient_landmarks')) {
      friendlyMessage = 'Could not detect face or body landmarks. Please use a clearer, front-facing photo.';
    } else if (msg.includes('error_hair_too_short')) {
      friendlyMessage = 'Hair in the reference photo is too short to transfer. Please try a different reference.';
    } else if (msg.includes('Server key problem') || msg.includes('InvalidAccessToken') || msg.includes('401')) {
      friendlyMessage = 'YouCam rejected the server API key. Set an active YOUCAM_API_KEY in the server environment, then restart the app.';
    }

    return NextResponse.json(
      { ok: false, message: friendlyMessage },
      { status: 500 }
    );
  }
}
