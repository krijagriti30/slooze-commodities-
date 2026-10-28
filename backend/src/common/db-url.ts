import path from 'node:path';

/**
 * Mirrors the Prisma CLI: relative SQLite paths resolve against the `prisma/` directory,
 * so `migrate deploy` and the runtime client always use the same file.
 * Run all backend commands from the backend/ directory.
 */
export function sqliteUrl(): string {
  const raw = process.env.DATABASE_URL ?? 'file:./dev.db';
  if (!raw.startsWith('file:')) {
    throw new Error('DATABASE_URL must be a SQLite "file:" URL for this project.');
  }
  const file = raw.slice('file:'.length);
  const abs = path.isAbsolute(file) ? file : path.resolve(process.cwd(), 'prisma', file);
  return `file:${abs}`;
}
