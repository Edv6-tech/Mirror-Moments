import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { getPrivateAssetUrl, hasCloudPrivateStorage, resolvePrivateAssetOwner, type PrivateAsset } from '@/lib/privateAssets';
import { createAdminClient } from '@/lib/supabase/admin';

interface WardrobeRecord {
  id: string;
  ownerId?: string;
  name: string;
  transparentAsset?: PrivateAsset;
  whiteAsset?: PrivateAsset;
  transparentUrl?: string;
  whiteUrl?: string;
  createdAt: string;
}

export async function GET() {
  try {
    const ownerId = await resolvePrivateAssetOwner();
    if (hasCloudPrivateStorage()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase.from('dresses').select('id,name,lifted_path,garment_path,created_at,coverage').eq('user_id', ownerId).order('created_at', { ascending: false });
      if (error) throw new Error(`Your wardrobe could not be loaded: ${error.message}`);
      const items = await Promise.all((data ?? []).map(async (row) => {
        const transparentAsset: PrivateAsset = { bucket: 'dresses', key: row.lifted_path };
        const whiteAsset: PrivateAsset = { bucket: 'dresses', key: row.garment_path };
        return {
          id: row.id,
          ownerId,
          name: row.name,
          createdAt: row.created_at,
          coverage: row.coverage,
          transparentAsset,
          whiteAsset,
          transparentUrl: await getPrivateAssetUrl(ownerId, transparentAsset),
          whiteUrl: await getPrivateAssetUrl(ownerId, whiteAsset),
        };
      }));
      return NextResponse.json({ ok: true, items }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    const dbPath = path.resolve(process.cwd(), 'data/wardrobe/items.json');
    const items: WardrobeRecord[] = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf8')) : [];
    const ownedItems = await Promise.all(items.filter((item) => item.ownerId === ownerId).map(async (item) => ({
      ...item,
      whiteUrl: item.whiteAsset ? await getPrivateAssetUrl(ownerId, item.whiteAsset) : item.whiteUrl,
      transparentUrl: item.transparentAsset ? await getPrivateAssetUrl(ownerId, item.transparentAsset) : item.transparentUrl,
    })));
    return NextResponse.json({ ok: true, items: ownedItems }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Your wardrobe could not be loaded.';
    const status = message.includes('Sign in') ? 401 : message.includes('not configured') ? 503 : 500;
    return NextResponse.json({ ok: false, message }, { status });
  }
}
