import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { uploadFile, createTask, pollTask, saveResult, isMockMode } from '@/lib/youcam/youcamClient';
import { validateImageBuffer } from '@/lib/imageValidation';
import { readLocalPublicImage } from '@/lib/sampleImages';
import { downloadPrivateAsset, resolvePrivateAssetOwner, type PrivateAsset } from '@/lib/privateAssets';
import { rejectOversizedRequest } from '@/lib/requestLimits';
import { consumeTryOnQuota } from '@/lib/tryonQuota';

// Helper to resolve a garment file buffer by ID or path
async function getGarmentBuffer(garmentId: string, ownerId: string): Promise<{ buffer: Buffer; fileName: string }> {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(garmentId)) throw new Error('Invalid garment reference ID.');
  // 1. Check in wardrobe database data/wardrobe/items.json
  const dbPath = path.resolve(process.cwd(), 'data/wardrobe/items.json');
  if (fs.existsSync(dbPath)) {
    try {
      const items = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      const found = items.find((it: any) => it.id === garmentId && it.ownerId === ownerId);
      if (found) {
        if (found.whiteAsset?.key) {
          const asset = found.whiteAsset as PrivateAsset;
          const privateBuffer = await downloadPrivateAsset(asset);
          if (privateBuffer) return { buffer: privateBuffer, fileName: path.basename(asset.key) };
        }
        const whitePath = path.resolve(process.cwd(), `public${found.whiteUrl}`);
        if (fs.existsSync(whitePath)) {
          return { buffer: fs.readFileSync(whitePath), fileName: path.basename(whitePath) };
        }
        const transPath = path.resolve(process.cwd(), `public${found.transparentUrl}`);
        if (fs.existsSync(transPath)) {
          return { buffer: fs.readFileSync(transPath), fileName: path.basename(transPath) };
        }
      }
    } catch {}
  }

  // 2. Check only packaged, known garment samples. User uploads are resolved
  // from their private collection records above and never from public paths.
  const possiblePaths = [
    path.resolve(process.cwd(), `public/garments/${garmentId}`),
    path.resolve(process.cwd(), `public/garments/${garmentId}.jpg`),
    path.resolve(process.cwd(), `public/garments/garment_${garmentId}.jpg`),
    path.resolve(process.cwd(), `data/garments/${garmentId}`),
    path.resolve(process.cwd(), `data/garments/${garmentId}.jpg`),
    path.resolve(process.cwd(), `data/garments/garment_${garmentId}.jpg`),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
      return { buffer: fs.readFileSync(/*turbopackIgnore: true*/ p), fileName: path.basename(p) };
    }
  }

  throw new Error(`Garment reference not found for ID: ${garmentId}`);
}

export async function POST(req: NextRequest) {
  try {
    const tooLarge = rejectOversizedRequest(req, 22 * 1024 * 1024);
    if (tooLarge) return tooLarge;
    const quota = await consumeTryOnQuota(req);
    if (quota.response) return quota.response;
    let personBuffer: Buffer | null = null;
    let personContentType = 'image/jpeg';
    let personFileName = 'person.jpg';
    let garmentBuffer: Buffer | null = null;
    let garmentContentType = 'image/jpeg';
    let garmentFileName = 'garment.jpg';
    let garmentId = 'emerald_slip';
    let garmentCategory = 'auto';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const personFile = formData.get('personPhoto') as File | null;
      const garmentFile = formData.get('garmentPhoto') as File | null;
      const gId = formData.get('garmentId') as string | null;
      const requestedCategory = formData.get('garmentCategory');
      if (gId) garmentId = gId;
      if (typeof requestedCategory === 'string') garmentCategory = requestedCategory;

      if (personFile) {
        if (!['image/jpeg', 'image/png'].includes(personFile.type)) {
          return NextResponse.json({ ok: false, message: 'Use a JPG or PNG photo for the try-on.' }, { status: 400 });
        }
        const arrayBuf = await personFile.arrayBuffer();
        personBuffer = Buffer.from(arrayBuf);
        personContentType = personFile.type;
        personFileName = personFile.name || (personFile.type === 'image/png' ? 'person.png' : 'person.jpg');
      }
      if (garmentFile) {
        if (!['image/jpeg', 'image/png'].includes(garmentFile.type)) {
          return NextResponse.json({ ok: false, message: 'Use a JPG or PNG garment reference.' }, { status: 400 });
        }
        const arrayBuf = await garmentFile.arrayBuffer();
        garmentBuffer = Buffer.from(arrayBuf);
        garmentFileName = garmentFile.name || 'garment.jpg';
        garmentContentType = garmentFile.type;
      }
    } else {
      const body = await req.json().catch(() => ({}));
      if (body.garmentId) garmentId = body.garmentId;
      if (typeof body.garmentCategory === 'string') garmentCategory = body.garmentCategory;

      if (body.garmentPhoto) {
        if (body.garmentPhoto.startsWith('data:image')) {
          const mimeType = body.garmentPhoto.slice(5, body.garmentPhoto.indexOf(';'));
          if (!['image/jpeg', 'image/png'].includes(mimeType)) {
            return NextResponse.json({ ok: false, message: 'Use a JPG or PNG garment reference.' }, { status: 400 });
          }
          garmentContentType = mimeType;
          garmentFileName = mimeType === 'image/png' ? 'garment.png' : 'garment.jpg';
          const base64Data = body.garmentPhoto.split(',')[1];
          garmentBuffer = Buffer.from(base64Data, 'base64');
        } else if (body.garmentPhoto.startsWith('/')) {
          const localImage = readLocalPublicImage(body.garmentPhoto);
          if (localImage) {
            garmentBuffer = localImage.buffer;
            garmentFileName = path.basename(body.garmentPhoto);
            garmentContentType = localImage.mime;
          }
        }
      }

      if (body.personPhoto) {
        if (body.personPhoto.startsWith('data:image')) {
          const mimeType = body.personPhoto.slice(5, body.personPhoto.indexOf(';'));
          if (!['image/jpeg', 'image/png'].includes(mimeType)) {
            return NextResponse.json({ ok: false, message: 'Use a JPG or PNG photo for the try-on.' }, { status: 400 });
          }
          personContentType = mimeType;
          personFileName = mimeType === 'image/png' ? 'person.png' : 'person.jpg';
          const base64Data = body.personPhoto.split(',')[1];
          personBuffer = Buffer.from(base64Data, 'base64');
        } else if (body.personPhoto.startsWith('/')) {
          const localImage = readLocalPublicImage(body.personPhoto);
          if (localImage) {
            personBuffer = localImage.buffer;
            personFileName = path.basename(body.personPhoto);
            personContentType = localImage.mime;
          }
        }
      }
    }

    const allowedCategories = ['full_body', 'upper_body', 'lower_body', 'shoes', 'auto', 'outer'];
    if (!allowedCategories.includes(garmentCategory)) {
      return NextResponse.json({ ok: false, message: 'Choose a supported garment coverage before trying it on.' }, { status: 400 });
    }

    // Only use a sample target photo in mock mode; live try-on requires the user's own photo.
    if (!personBuffer || personBuffer.length === 0) {
      if (!isMockMode()) {
        return NextResponse.json(
          { ok: false, message: 'Please upload a clear photo of yourself, framed to match the garment coverage.' },
          { status: 400 }
        );
      }
      const sampleFace = path.resolve(process.cwd(), 'public/sample_face_valid.jpg');
      if (fs.existsSync(sampleFace)) {
        personBuffer = fs.readFileSync(sampleFace);
      } else {
        return NextResponse.json(
          { ok: false, message: 'Please upload a photo of yourself (under 10MB, JPG/PNG).' },
          { status: 400 }
        );
      }
    }

    // Validation checks
    if (personBuffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, message: 'Person photo is too large. Max file size is 10 MB.' },
        { status: 400 }
      );
    }

    const personImageError = validateImageBuffer(personBuffer, personContentType, { maxBytes: 10 * 1024 * 1024, minLongSide: 128, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png'] });
    if (personImageError) return NextResponse.json({ ok: false, message: `Try-on photo: ${personImageError}` }, { status: 400 });
    if (garmentBuffer) {
      const garmentImageError = validateImageBuffer(garmentBuffer, garmentContentType, { maxBytes: 10 * 1024 * 1024, minLongSide: 128, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png'] });
      if (garmentImageError) return NextResponse.json({ ok: false, message: `Garment reference: ${garmentImageError}` }, { status: 400 });
    }

    // Mock mode fast path
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 2000));
      return NextResponse.json({
        ok: true,
        resultUrl: '/sample_face_valid.jpg',
        taskId: `mock_tryon_${Date.now()}`,
        mock: true,
      });
    }

    // 1. Load garment reference image
    if (!garmentBuffer) {
      const ownerId = await resolvePrivateAssetOwner();
      const garment = await getGarmentBuffer(garmentId, ownerId);
      garmentBuffer = garment.buffer;
      garmentFileName = garment.fileName;
      garmentContentType = garment.fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    }

    // 2. Upload both images to YouCam File API
    const srcFileId = await uploadFile(personBuffer, personContentType, personFileName);
    const refFileId = await uploadFile(garmentBuffer, garmentContentType, garmentFileName);

    // 3. Create cloth task POST /s2s/v2.0/task/cloth-v4 with the selected matching region.
    const taskId = await createTask('/s2s/v2.0/task/cloth-v4', {
      src_file_id: srcFileId,
      ref_file_id: refFileId,
      garment_category: garmentCategory,
      filter_multi_person: 'off',
    });

    // 4. Poll task
    const pollResult = await pollTask('/s2s/v2.0/task/cloth-v4', taskId);

    // 5. Download and cache result
    const localResultUrl = await saveResult(pollResult.url, 'dress_tryon', { userId: quota.userId, category: 'dress' });

    return NextResponse.json({
      ok: true,
      resultUrl: localResultUrl,
      taskId,
    });
  } catch (err: any) {
    console.error('Dress try-on error:', err);
    const providerMessage = String(err?.message ?? '');
    if (providerMessage.includes('error_apply_region_mismatch')) {
      return NextResponse.json(
        {
          ok: false,
          code: 'error_apply_region_mismatch',
          message: 'The clothing coverage does not match the area in your photo. Choose the matching garment coverage, then upload a front-facing photo that clearly shows the same area. For a full-length dress, use a full-length photo.',
        },
        { status: 422 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        message: err.message || 'Dress try-on failed. Please try a different photo or check connection.',
      },
      { status: 500 }
    );
  }
}
