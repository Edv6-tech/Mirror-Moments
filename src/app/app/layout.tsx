import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getLocalUser } from '@/lib/sqliteAuth';
import AppShell from './AppShell';

export default async function AuthenticatedAppLayout({ children }: { children: ReactNode }) {
  const user = await getLocalUser();
  if (!user) redirect('/login');

  return <AppShell>{children}</AppShell>;
}
