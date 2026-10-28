import type { Config } from 'tailwindcss';

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'), surface: token('surface'), 'surface-2': token('surface-2'),
        border: token('border'), fg: token('fg'), muted: token('muted'),
        primary: token('primary'), 'primary-fg': token('primary-fg'),
        success: token('success'), warning: token('warning'), danger: token('danger'),
      },
      boxShadow: { card: '0 1px 2px rgb(var(--shadow) / 0.06), 0 1px 3px rgb(var(--shadow) / 0.08)' },
    },
  },
  plugins: [],
} satisfies Config;
