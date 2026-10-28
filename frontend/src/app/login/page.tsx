import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSessionUser, homeFor } from '@/lib/server-auth';
import { LoginForm } from './LoginForm';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BoxIcon } from '@/components/Icons';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect(homeFor(user.role));
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-primary p-12 text-primary-fg lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold"><BoxIcon /> Slooze Commodities</div>
        <div>
          <h2 className="max-w-md text-3xl font-semibold leading-tight">Track every commodity, from stock level to inventory value.</h2>
          <p className="mt-3 max-w-md opacity-80">Managers get the full dashboard. Store keepers manage the product catalogue.</p>
        </div>
        <p className="text-sm opacity-70">&copy; Slooze</p>
      </section>
      <section className="relative flex items-center justify-center p-6">
        <div className="absolute right-4 top-4"><ThemeToggle /></div>
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 text-lg font-semibold lg:hidden"><BoxIcon className="text-primary" /> Slooze Commodities</div>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="mb-6 mt-1 text-sm text-muted">Sign in to manage your commodities.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
