import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getPrivateAssetUrl, hasCloudPrivateStorage, resolvePrivateAssetOwner, storePrivateAsset, type PrivateAsset } from '@/lib/privateAssets';
import { validateImageBuffer, type SupportedImageMime } from '@/lib/imageValidation';
import { createClient } from '@/lib/supabase/server';
import { rejectOversizedRequest } from '@/lib/requestLimits';

interface WardrobeRecord {
  id: string;
  ownerId: string;
  name: string;
  transparentAsset: PrivateAsset;
  whiteAsset: PrivateAsset;
  createdAt: string;
  coverage: number;
}

const DB_PATH = path.resolve(process.cwd(), 'data/wardrobe/items.json');

export async function POST(req: NextRequest) {
  try {
    const tooLarge = rejectOversizedRequest(req, 120 * 1024 * 1024);
    if (tooLarge) return tooLarge;
    const ownerId = await resolvePrivateAssetOwner();
    const formData = await req.formData();
    const files = [...formData.getAll('files'), formData.get('file')]
      .filter((value): value is File => value instanceof File && value.size > 0);
    if (!files.length) return NextResponse.json({ ok: false, message: 'Choose at least one garment image.' }, { status: 400 });
    if (files.length > 10) return NextResponse.json({ ok: false, message: 'Upload up to 10 garment images at a time.' }, { status: 400 });

    const transparentFile = formData.get('transparentFile');
    const whiteFile = formData.get('whiteFile');
    if (transparentFile && !(transparentFile instanceof File)) return NextResponse.json({ ok: false, message: 'The transparent garment image is invalid.' }, { status: 400 });
    if (whiteFile && !(whiteFile instanceof File)) return NextResponse.json({ ok: false, message: 'The garment preview image is invalid.' }, { status: 400 });
    const customName = String(formData.get('name') ?? '').trim().slice(0, 80);

    const cloudStorage = hasCloudPrivateStorage();
    const existing: WardrobeRecord[] = !cloudStorage && fs.existsSync(DB_PATH)
      ? JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
      : [];
    const supabase = cloudStorage ? await createClient() : null;
    const processedItems: Array<WardrobeRecord & { transparentUrl: string; whiteUrl: string }> = [];

    for (const file of files) {
      const mime = file.type as SupportedImageMime;
      const baseBuffer = Buffer.from(await file.arrayBuffer());
      const baseError = validateImageBuffer(baseBuffer, mime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png', 'image/webp'] });
      if (baseError) return NextResponse.json({ ok: false, message: `${file.name}: ${baseError}` }, { status: 400 });

      const transparentBuffer = transparentFile instanceof File ? Buffer.from(await transparentFile.arrayBuffer()) : baseBuffer;
      const transparentMime = transparentFile instanceof File ? transparentFile.type as SupportedImageMime : mime;
      const transparentError = validateImageBuffer(transparentBuffer, transparentMime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png', 'image/webp'] });
      if (transparentError) return NextResponse.json({ ok: false, message: `Transparent garment image: ${transparentError}` }, { status: 400 });

      const whiteBuffer = whiteFile instanceof File ? Buffer.from(await whiteFile.arrayBuffer()) : baseBuffer;
      const whiteMime = whiteFile instanceof File ? whiteFile.type as SupportedImageMime : mime;
      const whiteError = validateImageBuffer(whiteBuffer, whiteMime, { maxBytes: 10 * 1024 * 1024, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png', 'image/webp'] });
      if (whiteError) return NextResponse.json({ ok: false, message: `Garment preview image: ${whiteError}` }, { status: 400 });

      const id = crypto.randomUUID();
      const transparentAsset = await storePrivateAsset(ownerId, 'dresses', transparentBuffer, transparentMime);
      const whiteAsset = await storePrivateAsset(ownerId, 'dresses', whiteBuffer, whiteMime);
      const record: WardrobeRecord = {
        id,
        ownerId,
        name: customName || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').slice(0, 80) || 'Saved garment',
        transparentAsset,
        whiteAsset,
        createdAt: new Date().toISOString(),
        coverage: 0,
      };
      if (supabase) {
        const { error } = await supabase.from('dresses').insert({
          id,
          user_id: ownerId,
          name: record.name,
          lifted_path: transparentAsset.key,
          garment_path: whiteAsset.key,
          coverage: 0,
          worn_detected: false,
        });
        if (error) throw new Error(`Could not save the garment to your account: ${error.message}`);
      } else {
        existing.unshift(record);
      }
      processedItems.push({
        ...record,
        transparentUrl: await getPrivateAssetUrl(ownerId, transparentAsset),
        whiteUrl: await getPrivateAssetUrl(ownerId, whiteAsset),
      });
    }

    if (!cloudStorage) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(existing, null, 2));
    }
    return NextResponse.json({ ok: true, items: processedItems, message: `Saved ${processedItems.length} garment${processedItems.length === 1 ? '' : 's'} privately.` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Wardrobe upload failed.';
    const status = message.includes('Sign in') ? 401 : message.includes('not configured') ? 503 : 500;
    return NextResponse.json({ ok: false, message }, { status });
  }
}
