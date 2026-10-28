'use client';

import { useApolloClient, useMutation } from '@apollo/client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { BoxIcon, GridIcon, LogoutIcon, MenuIcon, Spinner } from './Icons';
import { ThemeToggle } from './ThemeToggle';
import { LOGOUT, type SessionUser } from '@/lib/graphql';

// Role-based menu: items are filtered by the server-verified role passed in from the layout.
const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: GridIcon, roles: ['MANAGER'] },
  { href: '/products', label: 'Products', icon: BoxIcon, roles: ['MANAGER', 'STORE_KEEPER'] },
] as const;

export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const client = useApolloClient();
  const [open, setOpen] = useState(false);
  const [logout, { loading }] = useMutation(LOGOUT);

  async function onLogout() {
    try { await logout(); } finally {
      await client.clearStore();
      router.replace('/login');
      router.refresh();
    }
  }

  const nav = (
    <nav aria-label="Main" className="flex-1 space-y-1 p-3">
      {NAV.filter((n) => (n.roles as readonly string[]).includes(user.role)).map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-surface-2 hover:text-fg'}`}>
            <Icon /> {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-2 border-b border-border px-5 font-semibold"><BoxIcon className="text-primary" /> Slooze Commodities</div>
        {nav}
        <div className="border-t border-border p-4">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.role === 'MANAGER' ? 'Manager' : 'Store Keeper'}</p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur lg:px-8">
          <button type="button" className="btn-ghost h-9 w-9 !p-0 lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><MenuIcon /></button>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <button type="button" className="btn-ghost h-9" onClick={onLogout} disabled={loading}>
              {loading ? <Spinner /> : <LogoutIcon />} <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
