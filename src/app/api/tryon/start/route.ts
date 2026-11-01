import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
    return NextResponse.json({
      error: 'ENDPOINT_NOT_IMPLEMENTED',
      message: 'This legacy task endpoint does not create YouCam try-ons yet. Use the active Dress Studio endpoint instead.',
    }, { status: 501 });
}
