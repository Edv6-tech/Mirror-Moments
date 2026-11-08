import { NextRequest, NextResponse } from 'next/server';
import { registerLocalUser } from '@/lib/sqliteAuth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') && request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json({ ok: false, message: 'This sign-up request could not be verified.' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string' || typeof body.name !== 'string') {
    return NextResponse.json({ ok: false, message: 'Enter your name, email, and password.' }, { status: 400 });
  }
  if (!body.name.trim()) return NextResponse.json({ ok: false, message: 'Enter your name.' }, { status: 400 });
  try {
    const user = await registerLocalUser(body.email, body.password, body.name);
    return NextResponse.json({ ok: true, user: { email: user.email, name: user.displayName } }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Your account could not be created.';
    const status = /already exists/i.test(message) ? 409 : /valid email|password must/i.test(message) ? 400 : 500;
    return NextResponse.json({ ok: false, message }, { status, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
