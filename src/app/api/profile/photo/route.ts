import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deletePrivateAssets, getPrivateAssetUrl, hasCloudPrivateStorage, storePrivateAsset, type PrivateAsset } from '@/lib/privateAssets';
import { validateImageBuffer } from '@/lib/imageValidation';
import { rejectOversizedRequest } from '@/lib/requestLimits';

export async function POST(request: NextRequest) {
  try {
    const tooLarge = rejectOversizedRequest(request, 11 * 1024 * 1024);
    if (tooLarge) return tooLarge;
    if (!hasCloudPrivateStorage()) return NextResponse.json({ ok: false, message: 'Configure Supabase to save a default photo.' }, { status: 503 });
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ ok: false, message: 'Sign in to save a default photo.' }, { status: 401 });
    const form = await request.formData();
    const file = form.get('photo');
    if (!(file instanceof File)) return NextResponse.json({ ok: false, message: 'Choose a JPG or PNG photo.' }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const issue = validateImageBuffer(bytes, file.type, { maxBytes: 10 * 1024 * 1024, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png'] });
    if (issue) return NextResponse.json({ ok: false, message: issue }, { status: 400 });

    const { data: profile } = await supabase.from('profiles').select('default_body_path').eq('id', user.id).maybeSingle();
    const asset = await storePrivateAsset(user.id, 'bodies', bytes, file.type);
    const { error } = await supabase.from('profiles').upsert({ id: user.id, default_body_path: asset.key });
    if (error) {
      await deletePrivateAssets([asset]);
      throw new Error(`Default photo could not be saved: ${error.message}`);
    }
    if (profile?.default_body_path) await deletePrivateAssets([{ bucket: 'bodies', key: profile.default_body_path }]);
    return NextResponse.json({ ok: true, photoUrl: await getPrivateAssetUrl(user.id, asset) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Default photo could not be saved.';
    return NextResponse.json({ ok: false, message }, { status: message.includes('Sign in') ? 401 : 503 });
  }
}

export async function DELETE() {
  try {
    if (!hasCloudPrivateStorage()) return NextResponse.json({ ok: false, message: 'Configure Supabase to remove a saved photo.' }, { status: 503 });
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ ok: false, message: 'Sign in to remove a saved photo.' }, { status: 401 });
    const { data: profile, error: loadError } = await supabase.from('profiles').select('default_body_path').eq('id', user.id).maybeSingle();
    if (loadError) throw new Error(`Default photo could not be loaded: ${loadError.message}`);
    const { error } = await supabase.from('profiles').update({ default_body_path: null }).eq('id', user.id);
    if (error) throw new Error(`Default photo could not be removed: ${error.message}`);
    if (profile?.default_body_path) {
      const asset: PrivateAsset = { bucket: 'bodies', key: profile.default_body_path };
      await deletePrivateAssets([asset]);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Default photo could not be removed.';
    return NextResponse.json({ ok: false, message }, { status: message.includes('Sign in') ? 401 : 503 });
  }
}
