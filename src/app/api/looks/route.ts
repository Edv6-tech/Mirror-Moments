import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { deletePrivateAssets, getPrivateAssetUrl, hasCloudPrivateStorage, resolvePrivateAssetOwner, type PrivateAsset } from '@/lib/privateAssets';

export async function GET() {
  try {
    const ownerId = await resolvePrivateAssetOwner();
    if (!hasCloudPrivateStorage() || ownerId === 'local-demo') {
      return NextResponse.json({ ok: true, looks: [] }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('generated_looks')
      .select('id,category,name,result_path,is_favourite,created_at')
      .eq('user_id', ownerId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Saved looks could not be loaded: ${error.message}`);
    const looks = await Promise.all((data ?? []).map(async (row) => {
      const resultAsset: PrivateAsset = { bucket: 'results', key: row.result_path };
      return {
        id: row.id,
        category: row.category,
        name: row.name,
        resultImage: await getPrivateAssetUrl(ownerId, resultAsset),
        date: row.created_at,
        isFavourite: row.is_favourite,
      };
    }));
    return NextResponse.json({ ok: true, looks }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Saved looks could not be loaded.';
    return NextResponse.json({ ok: false, message }, { status: message.includes('Sign in') ? 401 : 503, headers: { 'Cache-Control': 'private, no-store' } });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ownerId = await resolvePrivateAssetOwner();
    if (!hasCloudPrivateStorage() || ownerId === 'local-demo') return NextResponse.json({ ok: false, message: 'Sign in with a configured account to update saved looks.' }, { status: 503 });
    const body = await request.json().catch(() => ({}));
    if (typeof body.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.id) || typeof body.isFavourite !== 'boolean') {
      return NextResponse.json({ ok: false, message: 'A valid look and favourite value are required.' }, { status: 400 });
    }
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('generated_looks').update({ is_favourite: body.isFavourite }).eq('user_id', ownerId).eq('id', body.id).select('id').maybeSingle();
    if (error) throw new Error(`Favourite could not be saved: ${error.message}`);
    if (!data) return NextResponse.json({ ok: false, message: 'That saved look was not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Favourite could not be saved.';
    return NextResponse.json({ ok: false, message }, { status: message.includes('Sign in') ? 401 : 503 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ownerId = await resolvePrivateAssetOwner();
    if (!hasCloudPrivateStorage() || ownerId === 'local-demo') return NextResponse.json({ ok: false, message: 'Sign in with a configured account to delete saved looks.' }, { status: 503 });
    const id = request.nextUrl.searchParams.get('id') ?? '';
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false, message: 'A valid look ID is required.' }, { status: 400 });
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('generated_looks').delete().eq('user_id', ownerId).eq('id', id).select('id,result_path').maybeSingle();
    if (error) throw new Error(`Saved look could not be deleted: ${error.message}`);
    if (!data) return NextResponse.json({ ok: false, message: 'That saved look was not found.' }, { status: 404 });
    await deletePrivateAssets([{ bucket: 'results', key: data.result_path }]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Saved look could not be deleted.';
    return NextResponse.json({ ok: false, message }, { status: message.includes('Sign in') ? 401 : 503 });
  }
}
