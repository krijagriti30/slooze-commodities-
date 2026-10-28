import type { ApolloError } from '@apollo/client';

export type FieldErrors = Record<string, string>;

export function errorInfo(error: ApolloError | undefined) {
  const gqlErr = error?.graphQLErrors?.[0];
  const code = gqlErr?.extensions?.code as string | undefined;
  const fields = (gqlErr?.extensions?.fields ?? {}) as FieldErrors;
  const networkDown = !!error?.networkError;
  const message = networkDown
    ? 'Cannot reach the server. Check your connection and try again.'
    : gqlErr?.message ?? error?.message ?? 'Something went wrong.';
  return { code, fields, message, networkDown };
}
