import { redirect } from 'next/navigation';
import { getSessionUser, homeFor } from '@/lib/server-auth';

export default async function Index() {
  const user = await getSessionUser();
  redirect(user ? homeFor(user.role) : '/login');
}
