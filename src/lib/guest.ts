import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function getGuestId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get('guest_id')?.value;
  if (existing) return existing;
  return crypto.randomUUID();
}

export function hashGuestSubject(guestId: string, ip: string): string {
  return crypto.createHash('sha256').update(guestId + ip).digest('hex');
}
