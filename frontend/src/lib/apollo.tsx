'use client';

import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache } from '@apollo/client';
import { useState, type ReactNode } from 'react';

// Same-origin proxy by default; the session cookie is HTTP-only and never touched by JS.
const uri = process.env.NEXT_PUBLIC_GRAPHQL_URL || '/api/graphql';

function makeClient() {
  return new ApolloClient({
    link: new HttpLink({ uri, credentials: process.env.NEXT_PUBLIC_GRAPHQL_URL ? 'include' : 'same-origin' }),
    cache: new InMemoryCache(),
    defaultOptions: { watchQuery: { fetchPolicy: 'cache-and-network', errorPolicy: 'all' } },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(makeClient);
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
