import { NextRequest, NextResponse } from 'next/server';
import { getPrivateAssetUrl, type PrivateAsset } from '@/lib/privateAssets';
import { getLocalUser, readLocalProfile, updateLocalProfile } from '@/lib/sqliteAuth';

export const runtime = 'nodejs';

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Profile request failed.';
  const status = message.includes('Sign in') ? 401 : 500;
  return NextResponse.json({ ok: false, message }, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function GET() {
  try {
    const user = await getLocalUser();
    if (!user) return NextResponse.json({ ok: false, message: 'Sign in to manage your profile.' }, { status: 401 });
    const profile = await readLocalProfile(user.id);
    const photoAsset: PrivateAsset | null = profile?.default_body_path ? { bucket: 'bodies', key: profile.default_body_path } : null;
    return NextResponse.json({
      ok: true,
      profile: {
        name: profile?.display_name ?? user.displayName,
        email: user.email,
        deleteOriginals: profile?.delete_originals ?? true,
        defaultPhotoUrl: photoAsset ? await getPrivateAssetUrl(user.id, photoAsset) : null,
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getLocalUser();
    if (!user) return NextResponse.json({ ok: false, message: 'Sign in to manage your profile.' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const update: { display_name?: string; delete_originals?: boolean } = {};
    if (typeof body.name === 'string') update.display_name = body.name.trim().slice(0, 80);
    if (typeof body.deleteOriginals === 'boolean') update.delete_originals = body.deleteOriginals;
    if (!Object.keys(update).length) return NextResponse.json({ ok: false, message: 'There are no profile changes to save.' }, { status: 400 });
    await updateLocalProfile(user.id, update);
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
