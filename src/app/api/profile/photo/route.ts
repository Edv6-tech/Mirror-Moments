import { NextRequest, NextResponse } from 'next/server';
import { deletePrivateAssets, getPrivateAssetUrl, storePrivateAsset, type PrivateAsset } from '@/lib/privateAssets';
import { validateImageBuffer } from '@/lib/imageValidation';
import { getLocalUser, readLocalProfile, updateLocalProfile } from '@/lib/sqliteAuth';
import { rejectOversizedRequest } from '@/lib/requestLimits';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const tooLarge = rejectOversizedRequest(request, 11 * 1024 * 1024);
    if (tooLarge) return tooLarge;
    const user = await getLocalUser();
    if (!user) return NextResponse.json({ ok: false, message: 'Sign in to save a default photo.' }, { status: 401 });
    const form = await request.formData();
    const file = form.get('photo');
    if (!(file instanceof File)) return NextResponse.json({ ok: false, message: 'Choose a JPG or PNG photo.' }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const issue = validateImageBuffer(bytes, file.type, { maxBytes: 10 * 1024 * 1024, maxLongSide: 4096, allowedMimes: ['image/jpeg', 'image/png'] });
    if (issue) return NextResponse.json({ ok: false, message: issue }, { status: 400 });

    const profile = await readLocalProfile(user.id);
    const asset = await storePrivateAsset(user.id, 'bodies', bytes, file.type);
    try {
      await updateLocalProfile(user.id, { default_body_path: asset.key });
    } catch (error) {
      await deletePrivateAssets([asset]);
      throw error;
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
    const user = await getLocalUser();
    if (!user) return NextResponse.json({ ok: false, message: 'Sign in to remove a saved photo.' }, { status: 401 });
    const profile = await readLocalProfile(user.id);
    await updateLocalProfile(user.id, { default_body_path: null });
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
