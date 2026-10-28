import { GraphQLError } from 'graphql';

export const gqlError = (message: string, code: string, extra: Record<string, unknown> = {}) =>
  new GraphQLError(message, { extensions: { code, ...extra } });
