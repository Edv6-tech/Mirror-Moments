import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getPrivateAssetUrl, hasCloudPrivateStorage, resolvePrivateAssetOwner, storePrivateAsset, type PrivateAsset } from '@/lib/privateAssets';
import { validateImageBuffer } from '@/lib/imageValidation';
import { createClient } from '@/lib/supabase/server';
import { rejectOversizedRequest } from '@/lib/requestLimits';

interface HairRecord {
  id: string;
  ownerId: string;
  name: string;
  referenceAsset: PrivateAsset;
  thumbnailAsset: PrivateAsset;
  createdAt: string;
}

const DB_PATH = path.resolve(process.cwd(), 'data/hair/items.json');

export async function POST(req: NextRequest) {
  try {
    const tooLarge = rejectOversizedRequest(req, 22 * 1024 * 1024);
    if (tooLarge) return tooLarge;
    const ownerId = await resolvePrivateAssetOwner();
    const formData = await req.formData();
    const file = formData.get('file');
    const thumbFile = formData.get('thumb');
    const consent = formData.get('consent');
    const styleName = String(formData.get('name') || 'Custom Hairstyle').trim().slice(0, 80);
    if (!(file instanceof File) || !file.size) return NextResponse.json({ ok: false, message: 'Please provide a hair photo.' }, { status: 400 });
    if (consent !== 'true' && consent !== 'on') return NextResponse.json({ ok: false, message: 'Consent is required to save this reference photo.' }, { status: 400 });
    if (file.type !== 'image/jpeg') return NextResponse.json({ ok: false, message: 'Hair references must be JPG/JPEG photos.' }, { status: 400 });

    const referenceBuffer = Buffer.from(await file.arrayBuffer());
    const referenceError = validateImageBuffer(referenceBuffer, file.type, { maxBytes: 10 * 1024 * 1024, maxLongSide: 1024, allowedMimes: ['image/jpeg'] });
    if (referenceError) return NextResponse.json({ ok: false, message: referenceError }, { status: 400 });
    const thumbnailBuffer = thumbFile instanceof File ? Buffer.from(await thumbFile.arrayBuffer()) : referenceBuffer;
    const thumbnailMime = thumbFile instanceof File ? thumbFile.type : file.type;
    const thumbnailError = validateImageBuffer(thumbnailBuffer, thumbnailMime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 1024, allowedMimes: ['image/jpeg', 'image/png'] });
    if (thumbnailError) return NextResponse.json({ ok: false, message: `Hairstyle thumbnail: ${thumbnailError}` }, { status: 400 });

    const id = crypto.randomUUID();
    const referenceAsset = await storePrivateAsset(ownerId, 'bodies', referenceBuffer, 'image/jpeg');
    const thumbnailAsset = await storePrivateAsset(ownerId, 'bodies', thumbnailBuffer, thumbnailMime);
    const record: HairRecord = { id, ownerId, name: styleName || 'Custom Hairstyle', referenceAsset, thumbnailAsset, createdAt: new Date().toISOString() };
    if (hasCloudPrivateStorage()) {
      const supabase = await createClient();
      const { error } = await supabase.from('hair_references').insert({
        id,
        user_id: ownerId,
        name: record.name,
        reference_path: referenceAsset.key,
        thumbnail_path: thumbnailAsset.key,
      });
      if (error) throw new Error(`Could not save the hairstyle to your account: ${error.message}`);
    } else {
      const items: HairRecord[] = fs.existsSync(DB_PATH) ? JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) : [];
      items.unshift(record);
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(items, null, 2));
    }

    return NextResponse.json({
      ok: true,
      item: {
        ...record,
        refUrl: await getPrivateAssetUrl(ownerId, referenceAsset),
        thumbnailUrl: await getPrivateAssetUrl(ownerId, thumbnailAsset),
      },
      message: 'Hairstyle saved privately to your collection.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Hair upload failed.';
    const status = message.includes('Sign in') ? 401 : message.includes('not configured') ? 503 : 500;
    return NextResponse.json({ ok: false, message }, { status });
  }
}
