/** @type {import('next').NextConfig} */
const backend = process.env.BACKEND_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

const nextConfig = {
  poweredByHeader: false,
  // Same-origin proxy: the browser only talks to this app, so the HTTP-only session cookie is first-party
  // (no CORS or third-party-cookie problems in deployment). BACKEND_GRAPHQL_URL is server-only and read at build time.
  async rewrites() {
    return [{ source: '/api/graphql', destination: backend }];
  },
};
export default nextConfig;
