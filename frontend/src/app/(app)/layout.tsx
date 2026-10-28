import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';
import { getSessionUser } from '@/lib/server-auth';

// Every page in this group requires a valid server-side session; the role used by the UI comes from here.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return <AppShell user={user}>{children}</AppShell>;
}
