import { NextRequest, NextResponse } from 'next/server';
import { mimeFromAssetKey, readSignedLocalAsset } from '@/lib/privateAssets';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const bucket = searchParams.get('bucket') ?? '';
  const key = searchParams.get('key') ?? '';
  const expires = Number(searchParams.get('expires'));
  const signature = searchParams.get('signature') ?? '';

  const image = await readSignedLocalAsset(bucket, key, expires, signature);
  if (!image) return NextResponse.json({ ok: false, message: 'This private image link is invalid or has expired.' }, { status: 404 });

  return new NextResponse(new Uint8Array(image), {
    headers: {
      'Content-Type': mimeFromAssetKey(key),
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}
