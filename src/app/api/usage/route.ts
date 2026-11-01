import { NextRequest, NextResponse } from 'next/server';
import { getTryOnUsage } from '@/lib/tryonQuota';

export async function GET(request: NextRequest) {
  try {
    const { result, limit } = await getTryOnUsage(request);
    return NextResponse.json({
      ok: true,
      limit,
      used: result.used,
      remaining: result.remaining,
      resetsAt: '00:00 UTC',
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Usage could not be loaded.';
    return NextResponse.json({ ok: false, message }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
