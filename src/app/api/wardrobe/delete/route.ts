import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@/lib/supabase/server';
import { deletePrivateAssets, hasCloudPrivateStorage, resolvePrivateAssetOwner, type PrivateAsset } from '@/lib/privateAssets';

interface WardrobeRecord { id: string; ownerId?: string; transparentAsset?: PrivateAsset; whiteAsset?: PrivateAsset }

export async function DELETE(request: NextRequest) {
  try {
    const ownerId = await resolvePrivateAssetOwner();
    const id = request.nextUrl.searchParams.get('id') ?? '';
    if (!/^(?:[0-9a-f-]{36}|dress_[a-zA-Z0-9_-]{1,80})$/i.test(id)) {
      return NextResponse.json({ ok: false, message: 'A valid wardrobe item is required.' }, { status: 400 });
    }

    if (hasCloudPrivateStorage()) {
      const supabase = await createClient();
      const { data: item, error: loadError } = await supabase.from('dresses').select('id,lifted_path,garment_path').eq('id', id).maybeSingle();
      if (loadError) throw new Error(`Wardrobe item could not be loaded: ${loadError.message}`);
      if (!item) return NextResponse.json({ ok: false, message: 'That wardrobe item was not found.' }, { status: 404 });
      const { error } = await supabase.from('dresses').delete().eq('id', id);
      if (error) throw new Error(`Wardrobe item could not be deleted: ${error.message}`);
      await deletePrivateAssets([
        { bucket: 'dresses', key: item.lifted_path },
        { bucket: 'dresses', key: item.garment_path },
      ]);
    } else {
      const dbPath = path.resolve(process.cwd(), 'data/wardrobe/items.json');
      const items: WardrobeRecord[] = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf8')) : [];
      const item = items.find((record) => record.id === id && record.ownerId === ownerId);
      if (!item) return NextResponse.json({ ok: false, message: 'That wardrobe item was not found.' }, { status: 404 });
      const remaining = items.filter((record) => record.id !== id);
      fs.writeFileSync(dbPath, JSON.stringify(remaining, null, 2));
      await deletePrivateAssets([item.transparentAsset, item.whiteAsset].filter((asset): asset is PrivateAsset => Boolean(asset)));
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Wardrobe item could not be deleted.';
    return NextResponse.json({ ok: false, message }, { status: message.includes('Sign in') ? 401 : 503 });
  }
}
