import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import type { SessionUser } from './graphql';

const BACKEND = process.env.BACKEND_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

/**
 * Trusted, server-side role lookup. Forwards the visitor's session cookie to the API;
 * the role comes from the database via the session, never from anything the client can edit.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const cookie = (await cookies()).toString();
  if (!cookie) return null;
  const res = await fetch(BACKEND, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ query: '{ me { id email name role } }' }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Auth service responded ${res.status}`);
  const json = (await res.json()) as { data?: { me: SessionUser | null } };
  return json.data?.me ?? null;
});

export const homeFor = (role: SessionUser['role']) => (role === 'MANAGER' ? '/dashboard' : '/products');
