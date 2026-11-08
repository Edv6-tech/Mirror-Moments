import { NextRequest, NextResponse } from 'next/server';
import { signOutLocalUser } from '@/lib/sqliteAuth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') && request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json({ ok: false, message: 'This sign-out request could not be verified.' }, { status: 403 });
  }
  await signOutLocalUser();
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
