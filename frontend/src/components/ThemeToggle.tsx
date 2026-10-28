'use client';

import { MoonIcon, SunIcon } from './Icons';

export const THEME_KEY = 'slooze-theme';

export function ThemeToggle() {
  // Both icons are always rendered; CSS (`dark:`) picks one, so server and client markup match (no hydration mismatch).
  const toggle = () => {
    const dark = document.documentElement.classList.toggle('dark');
    try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch { /* storage unavailable: theme still applies for this visit */ }
  };
  return (
    <button type="button" onClick={toggle} className="btn-ghost h-9 w-9 !p-0" aria-label="Toggle light and dark theme" title="Toggle theme">
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
    </button>
  );
}
