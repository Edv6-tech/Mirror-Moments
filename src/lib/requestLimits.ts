import { NextResponse, type NextRequest } from 'next/server';

export function rejectOversizedRequest(request: NextRequest, maxBytes: number): NextResponse | null {
  const rawLength = request.headers.get('content-length');
  if (!rawLength) return null;
  const length = Number(rawLength);
  if (!Number.isFinite(length) || length < 0) return NextResponse.json({ ok: false, message: 'Invalid request size.' }, { status: 400 });
  if (length > maxBytes) return NextResponse.json({ ok: false, message: `Request is too large. Limit: ${Math.floor(maxBytes / (1024 * 1024))} MB.` }, { status: 413 });
  return null;
}
