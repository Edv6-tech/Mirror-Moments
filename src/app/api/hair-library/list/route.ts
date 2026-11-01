import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { getPrivateAssetUrl, hasCloudPrivateStorage, resolvePrivateAssetOwner, type PrivateAsset } from '@/lib/privateAssets';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const ownerId = await resolvePrivateAssetOwner();
    if (hasCloudPrivateStorage()) {
      const supabase = await createClient();
      const { data, error } = await supabase.from('hair_references').select('id,name,reference_path,thumbnail_path,created_at').order('created_at', { ascending: false });
      if (error) throw new Error(`Your hair collection could not be loaded: ${error.message}`);
      const items = await Promise.all((data ?? []).map(async (row) => {
        const referenceAsset: PrivateAsset = { bucket: 'bodies', key: row.reference_path };
        const thumbnailAsset: PrivateAsset = { bucket: 'bodies', key: row.thumbnail_path };
        return {
          id: row.id,
          name: row.name,
          createdAt: row.created_at,
          referenceAsset,
          thumbnailAsset,
          refUrl: await getPrivateAssetUrl(ownerId, referenceAsset),
          thumbnailUrl: await getPrivateAssetUrl(ownerId, thumbnailAsset),
        };
      }));
      return NextResponse.json({ ok: true, items }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    const dbPath = path.resolve(process.cwd(), 'data/hair/items.json');
    const items: Array<{ ownerId?: string; referenceAsset?: PrivateAsset; thumbnailAsset?: PrivateAsset; [key: string]: unknown }> = fs.existsSync(dbPath)
      ? JSON.parse(fs.readFileSync(dbPath, 'utf8'))
      : [];
    const ownedItems = await Promise.all(items.filter((item) => item.ownerId === ownerId).map(async (item) => ({
      ...item,
      refUrl: item.referenceAsset ? await getPrivateAssetUrl(ownerId, item.referenceAsset) : undefined,
      thumbnailUrl: item.thumbnailAsset ? await getPrivateAssetUrl(ownerId, item.thumbnailAsset) : undefined,
    })));
    return NextResponse.json({ ok: true, items: ownedItems }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Your hair collection could not be loaded.';
    const status = message.includes('Sign in') ? 401 : message.includes('not configured') ? 503 : 500;
    return NextResponse.json({ ok: false, message }, { status });
  }
}
