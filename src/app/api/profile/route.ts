import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPrivateAssetUrl, hasCloudPrivateStorage, type PrivateAsset } from '@/lib/privateAssets';

async function getUserAndProfile() {
  if (!hasCloudPrivateStorage()) throw new Error('Configure Supabase to manage an account profile.');
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sign in to manage your profile.');
  const { data, error } = await supabase.from('profiles').select('display_name,delete_originals,default_body_path').eq('id', user.id).maybeSingle();
  if (error) throw new Error(`Profile could not be loaded: ${error.message}`);
  return { supabase, user, profile: data };
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Profile request failed.';
  const status = message.includes('Sign in') ? 401 : message.includes('Configure Supabase') ? 503 : 500;
  return NextResponse.json({ ok: false, message }, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function GET() {
  try {
    const { user, profile } = await getUserAndProfile();
    const photoAsset: PrivateAsset | null = profile?.default_body_path ? { bucket: 'bodies', key: profile.default_body_path } : null;
    return NextResponse.json({
      ok: true,
      profile: {
        name: profile?.display_name ?? user.user_metadata?.full_name ?? '',
        email: user.email ?? '',
        deleteOriginals: profile?.delete_originals ?? true,
        defaultPhotoUrl: photoAsset ? await getPrivateAssetUrl(user.id, photoAsset) : null,
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user } = await getUserAndProfile();
    const body = await request.json().catch(() => ({}));
    const update: { display_name?: string; delete_originals?: boolean } = {};
    if (typeof body.name === 'string') update.display_name = body.name.trim().slice(0, 80);
    if (typeof body.deleteOriginals === 'boolean') update.delete_originals = body.deleteOriginals;
    if (!Object.keys(update).length) return NextResponse.json({ ok: false, message: 'There are no profile changes to save.' }, { status: 400 });
    const { error } = await supabase.from('profiles').upsert({ id: user.id, ...update });
    if (error) throw new Error(`Profile changes could not be saved: ${error.message}`);
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
