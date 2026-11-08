import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteOwnerPrivateAssets, hasCloudPrivateStorage } from '@/lib/privateAssets';
import { getLocalUser, removeLocalUser, signOutLocalUser } from '@/lib/sqliteAuth';

export const runtime = 'nodejs';

function removeLocalOwnerRows(filePath: string, ownerId: string) {
  if (!fs.existsSync(filePath)) return;
  const rows: Array<{ ownerId?: string }> = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  fs.writeFileSync(filePath, JSON.stringify(rows.filter((row) => row.ownerId !== ownerId), null, 2));
}

export async function DELETE(request: NextRequest) {
  try {
    const confirmation = await request.json().catch(() => ({}));
    if (confirmation.confirmation !== 'DELETE') {
      return NextResponse.json({ ok: false, message: 'Type DELETE to confirm permanent account removal.' }, { status: 400 });
    }
    const user = await getLocalUser();
    if (!user) return NextResponse.json({ ok: false, message: 'Sign in to delete your account.' }, { status: 401 });

    if (hasCloudPrivateStorage()) {
      const admin = createAdminClient();
      for (const table of ['shortlists', 'looks', 'generated_looks', 'hair_references', 'dresses']) {
        const { error } = await admin.from(table).delete().eq('user_id', user.id);
        if (error) throw new Error(`Account data could not be removed: ${error.message}`);
      }
    }

    await deleteOwnerPrivateAssets(user.id);
    const dataRoot = path.resolve(process.cwd(), 'data');
    removeLocalOwnerRows(path.join(dataRoot, 'wardrobe/items.json'), user.id);
    removeLocalOwnerRows(path.join(dataRoot, 'hair/items.json'), user.id);
    await signOutLocalUser();
    await removeLocalUser(user.id);
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Account could not be deleted.';
    const status = message.includes('Sign in') ? 401 : 500;
    return NextResponse.json({ ok: false, message }, { status, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
