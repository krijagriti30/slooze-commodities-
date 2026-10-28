# Slooze Commodities Management

Role-based commodities management app built for the Slooze front-end take-home challenge
(<https://github.com/slooze-careers/front-end-challenge>).

- **Frontend:** Next.js 15 (App Router) · TypeScript · Tailwind CSS 3 · Apollo Client 3
- **Backend:** NestJS 10 · GraphQL (Apollo Server 4, code-first) · Prisma 6 · SQLite
- **Auth:** server-side sessions in the database, opaque token in an HTTP-only cookie, role-based access control

## Assumptions (please read)

1. **Figma was not inspected.** The Figma file blocks automated access, so the UI is a clean, original design built from the written requirements, not a pixel match. Send exported frames and I can align spacing, colours and layout.
2. **GraphQL instead of REST.** The challenge README mentions `POST /auth/login`, `GET /products`, etc., but also mandates NestJS + GraphQL + Apollo. All operations are GraphQL (`login`, `products`, `createProduct`, `updateProduct`, `dashboardStats`).
3. Dashboard metrics are invented from the Product model (the brief does not define them): totals, inventory value (stock × price, INR), value/stock by category, low stock, recent updates. All come from the database.
4. Currency is formatted as INR. Prices are stored as floats (fine for a demo; use integer minor units for real money).

## Role permissions

| Feature | Manager | Store Keeper |
|---|---|---|
| Login | Yes | Yes |
| Dashboard (page **and** API) | Yes | No (403 page / `FORBIDDEN`) |
| View products | Yes | Yes |
| Add products | Yes | Yes |
| Edit products | Yes | Yes |
| Dashboard menu item | Visible | Hidden |

Enforced in three places: a global NestJS `AuthGuard` + `@Roles()` on the API, a server-side role check in the Next.js layout/page, and role-filtered navigation. The role is always read from the server-side session, never from client state.

## Structure

```
backend/   NestJS API (src/auth, src/products, src/dashboard), prisma/ (schema, SQL migration, seed), scripts/e2e.ts
frontend/  Next.js app (src/app: login, (app)/dashboard, (app)/products), src/components, src/lib
```

## Prerequisites

Node.js 20.12+ (developed on 22) and npm. Internet access for `npm install` and Prisma's engine download.

## Setup

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run db:migrate        # prisma migrate deploy (creates prisma/dev.db)
npm run db:seed           # repeatable demo users + products
npm run dev               # builds, then serves http://localhost:4000/graphql

# Frontend (second terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev               # http://localhost:3000
```

### Demo accounts (local development only)

| Role | Email | Password |
|---|---|---|
| Manager | `manager@slooze.xyz` | `Manager@123` |
| Store Keeper | `storekeeper@slooze.xyz` | `Store@12345` |

Override with `DEMO_MANAGER_PASSWORD` / `DEMO_STORE_KEEPER_PASSWORD`. Passwords are stored as bcrypt hashes. The seed **refuses to run when `NODE_ENV=production`** unless `ALLOW_DEMO_SEED=true`. Never use these credentials anywhere real.

## Environment variables

| App | Variable | Purpose |
|---|---|---|
| backend | `PORT` | API port (default 4000) |
| backend | `DATABASE_URL` | SQLite URL, e.g. `file:./dev.db` (relative to `backend/prisma/`) |
| backend | `FRONTEND_ORIGINS` | Comma-separated CORS allow-list (credentials enabled) |
| backend | `SESSION_COOKIE_NAME`, `SESSION_TTL_HOURS` | Session cookie name / lifetime |
| backend | `COOKIE_SAMESITE` | `lax` (default). `none` only for cross-site setups (forces `Secure`) |
| backend | `NODE_ENV` | `production` enables `Secure` cookies, hides stack traces and introspection |
| frontend | `BACKEND_GRAPHQL_URL` | **Server-only.** API URL used by the `/api/graphql` proxy and server-side session lookup. Read at **build** time for the rewrite |
| frontend | `NEXT_PUBLIC_GRAPHQL_URL` | Optional. Bypass the proxy and call the API directly (needs CORS + cross-site cookies) |

No secrets are placed in client-side variables.

## How auth works

`login` creates a random 256-bit token, stores only its SHA-256 hash in the `Session` table, and sets it in an **HTTP-only, SameSite=Lax** cookie (`Secure` in production). Nothing is stored in localStorage. `logout` deletes the session row, so a copied cookie stops working immediately. Login is throttled (10 attempts / 15 min per IP + email) and uses constant-time-ish comparison for unknown emails.

The browser only talks to the Next.js origin (`/api/graphql` is rewritten to the backend), so the cookie is first-party and no CORS is needed in the default setup. CSRF: SameSite=Lax cookies plus Apollo Server's `csrfPrevention` (mutations need a JSON content type and cannot be sent from a plain cross-site form).

## Checks

```bash
cd backend  && npm run typecheck && npm run lint && npm run build
cd backend  && npm run dev   # in one terminal
cd backend  && npm test      # 26 black-box API checks against the running server
cd frontend && npm run typecheck && npm run lint && npm run build
```

## Deployment

- **Backend** needs a host with a **persistent disk** (Render, Railway, Fly.io with a volume): SQLite is a file. Do not use ephemeral/serverless storage. Set `NODE_ENV=production`, `DATABASE_URL` (path on the volume), `FRONTEND_ORIGINS`. Run `npm run build && npm run db:migrate` before `npm start`. To seed a demo deployment deliberately, set `ALLOW_DEMO_SEED=true` and strong `DEMO_*_PASSWORD` values.
- **Frontend** (Vercel/Netlify/Node): set `BACKEND_GRAPHQL_URL` to the deployed API's `/graphql` **before building**.
- Switching to Postgres means changing the Prisma provider/adapter and regenerating the SQL migration.

## Known limitations

- Login throttling is in-memory (per process); use a shared store when running multiple instances.
- No product deletion (not required, deliberately omitted). No refresh of other users' edits in real time.
- Charts are hand-built CSS/SVG (no chart dependency).
- Not pixel-matched to Figma (see Assumptions).
