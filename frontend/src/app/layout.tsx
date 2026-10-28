import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from '@/lib/apollo';
import './globals.css';

export const metadata: Metadata = { title: { default: 'Slooze Commodities', template: '%s · Slooze Commodities' }, description: 'Commodities management' };

// Runs before first paint: applies the saved theme (or the OS preference) so there is no flash of the wrong theme.
const themeScript = `try{var t=localStorage.getItem('slooze-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
