import type { Metadata } from 'next';
import { AccessDenied } from '@/components/AccessDenied';
import { getSessionUser } from '@/lib/server-auth';
import { DashboardView } from './DashboardView';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await getSessionUser();
  // Role gate on the server: Store Keepers never receive the dashboard UI. The API also rejects them (FORBIDDEN).
  if (user?.role !== 'MANAGER') return <AccessDenied />;
  return <DashboardView />;
}
