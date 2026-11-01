import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { deleteOwnerPrivateAssets, hasCloudPrivateStorage } from '@/lib/privateAssets';

export async function DELETE(request: NextRequest) {
  try {
    const confirmation = await request.json().catch(() => ({}));
    if (confirmation.confirmation !== 'DELETE') {
      return NextResponse.json({ ok: false, message: 'Type DELETE to confirm permanent account removal.' }, { status: 400 });
    }
    if (!hasCloudPrivateStorage()) return NextResponse.json({ ok: false, message: 'Account deletion requires configured cloud storage.' }, { status: 503 });
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ ok: false, message: 'Sign in to delete your account.' }, { status: 401 });

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createSupabaseClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    await deleteOwnerPrivateAssets(user.id);
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`Account deletion failed: ${error.message}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Account could not be deleted.';
    const status = message.includes('Sign in') ? 401 : message.includes('requires configured') ? 503 : 500;
    return NextResponse.json({ ok: false, message }, { status, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
