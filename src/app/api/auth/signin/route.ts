import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { signInLocalUser } from '@/lib/sqliteAuth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') && request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json({ ok: false, message: 'This sign-in request could not be verified.' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string' || !body.email.trim() || !body.password) {
    return NextResponse.json({ ok: false, message: 'Enter your email and password to continue.' }, { status: 400 });
  }
  try {
    const address = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-client';
    const rateKey = createHash('sha256').update(`${address}:${body.email.trim().toLowerCase()}`).digest('hex');
    const user = await signInLocalUser(body.email, body.password, rateKey);
    return NextResponse.json({ ok: true, user: { email: user.email, name: user.displayName } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign-in could not be completed.';
    const status = /wasn’t recognized/i.test(message) ? 401 : /too many sign-in attempts/i.test(message) ? 429 : 500;
    return NextResponse.json({ ok: false, message }, { status, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
