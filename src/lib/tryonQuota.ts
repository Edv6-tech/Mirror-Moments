import 'server-only';
import crypto from 'node:crypto';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface QuotaResult {
  allowed: boolean;
  used: number;
  remaining: number;
  reason: 'global_limit' | 'subject_limit' | null;
}

export interface TryOnQuota {
  subject: string;
  userId: string | null;
  result: QuotaResult;
  response: NextResponse | null;
}

const localUsage = new Map<string, number>();

function dayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function configuredLimits() {
  return {
    user: Math.max(1, Number.parseInt(process.env.DAILY_LIMIT_USER || '10', 10) || 10),
    guest: Math.max(1, Number.parseInt(process.env.DAILY_LIMIT_GUEST || '3', 10) || 3),
    global: Math.max(1, Number.parseInt(process.env.GLOBAL_DAILY_BUDGET || '200', 10) || 200),
  };
}

function subjectForGuest(request: NextRequest): string {
  const forwarded = request.headers.get('x-vercel-forwarded-for')
    ?? request.headers.get('x-real-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()
    ?? 'unknown-client';
  return `guest:${crypto.createHash('sha256').update(forwarded).digest('hex').slice(0, 48)}`;
}

async function identify(request: NextRequest): Promise<{ subject: string; userId: string | null }> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && publishable) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return { subject: `user:${user.id}`, userId: user.id };
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('Usage controls are not configured on the server.');
  }
  return { subject: subjectForGuest(request), userId: null };
}

async function adminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) {
    if (process.env.NODE_ENV !== 'production') return null;
    throw new Error('Usage controls are not configured on the server.');
  }
  return createSupabaseClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}

function localCount(subject: string): number {
  return localUsage.get(`${dayKey()}:${subject}`) ?? 0;
}

export async function getTryOnUsage(request: NextRequest): Promise<{ result: QuotaResult; limit: number }> {
  const { subject, userId } = await identify(request);
  const limits = configuredLimits();
  const limit = userId ? limits.user : limits.guest;
  const admin = await adminClient();
  if (!admin) {
    const used = localCount(subject);
    return { result: { allowed: used < limit, used, remaining: Math.max(0, limit - used), reason: used >= limit ? 'subject_limit' : null }, limit };
  }
  const { data, error } = await admin.from('usage_counters').select('count').eq('day', dayKey()).eq('subject', subject).maybeSingle();
  if (error) throw new Error(`Usage could not be loaded: ${error.message}`);
  const used = Number(data?.count ?? 0);
  return { result: { allowed: used < limit, used, remaining: Math.max(0, limit - used), reason: used >= limit ? 'subject_limit' : null }, limit };
}

export async function consumeTryOnQuota(request: NextRequest): Promise<TryOnQuota> {
  const { subject, userId } = await identify(request);
  const limits = configuredLimits();
  const limit = userId ? limits.user : limits.guest;
  const admin = await adminClient();
  let result: QuotaResult;

  if (admin) {
    const { data, error } = await admin.rpc('consume_tryon_quota', {
      p_day: dayKey(),
      p_subject: subject,
      p_subject_limit: limit,
      p_global_limit: limits.global,
    });
    if (error) throw new Error(`Usage controls failed: ${error.message}`);
    result = data as QuotaResult;
  } else {
    const used = localCount(subject);
    const total = localCount('__global__');
    if (total >= limits.global) result = { allowed: false, used, remaining: Math.max(0, limit - used), reason: 'global_limit' };
    else if (used >= limit) result = { allowed: false, used, remaining: 0, reason: 'subject_limit' };
    else {
      localUsage.set(`${dayKey()}:${subject}`, used + 1);
      localUsage.set(`${dayKey()}:__global__`, localCount('__global__') + 1);
      result = { allowed: true, used: used + 1, remaining: Math.max(0, limit - used - 1), reason: null };
    }
  }

  if (result.allowed) return { subject, userId, result, response: null };
  const global = result.reason === 'global_limit';
  return {
    subject,
    userId,
    result,
    response: NextResponse.json(
      { ok: false, code: global ? 'DAILY_BUDGET_REACHED' : 'DAILY_LIMIT_REACHED', message: global ? 'Today’s try-on capacity has been reached. Please try again tomorrow.' : `You’ve reached today’s try-on limit of ${limit}. Please try again tomorrow.`, usage: result },
      { status: 429, headers: { 'Cache-Control': 'private, no-store' } },
    ),
  };
}
