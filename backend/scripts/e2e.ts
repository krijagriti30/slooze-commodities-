// Black-box API checks against a RUNNING backend: API_URL=http://localhost:4000/graphql npm test
import '../src/common/env';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';
import { sqliteUrl } from '../src/common/db-url';

const URL = process.env.API_URL ?? 'http://localhost:4000/graphql';
const ORIGIN = (process.env.FRONTEND_ORIGINS ?? 'http://localhost:3000').split(',')[0];
const MGR = { email: 'manager@slooze.xyz', password: process.env.DEMO_MANAGER_PASSWORD ?? 'Manager@123' };
const SK = { email: 'storekeeper@slooze.xyz', password: process.env.DEMO_STORE_KEEPER_PASSWORD ?? 'Store@12345' };

/* eslint-disable @typescript-eslint/no-explicit-any -- black-box test reads arbitrary GraphQL JSON */
type Res = { data?: any; errors?: { message: string; extensions?: any }[]; setCookie: string | null };
async function gql(query: string, variables: object = {}, cookie = ''): Promise<Res> {
  const r = await fetch(URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN, ...(cookie ? { cookie } : {}) },
    body: JSON.stringify({ query, variables }),
  });
  return { ...(await r.json()), setCookie: r.headers.get('set-cookie') };
}
const code = (r: Res) => r.errors?.[0]?.extensions?.code;
let pass = 0, fail = 0;
function check(name: string, ok: boolean, detail = '') {
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + detail}`);
}

const LOGIN = `mutation($input: LoginInput!){ login(input:$input){ id email role } }`;
const PRODUCT = (s: string) => ({ name: 'E2E Test Item', sku: s, category: 'Test', unit: 'kg', price: 10.5, stock: 5, reorderLevel: 1 });
const CREATE = `mutation($input: ProductInput!){ createProduct(input:$input){ id sku name } }`;
const UPDATE = `mutation($id: ID!, $input: ProductInput!){ updateProduct(id:$id,input:$input){ id name price } }`;

async function loginAs(u: { email: string; password: string }) {
  const r = await gql(LOGIN, { input: u });
  return { r, cookie: (r.setCookie ?? '').split(';')[0] };
}

async function main() {
  const created: string[] = [];
  // --- unauthenticated
  check('me is null when signed out', (await gql('{ me { id } }')).data?.me === null);
  check('products rejected when signed out', code(await gql('{ products { total } }')) === 'UNAUTHENTICATED');
  check('dashboard rejected when signed out', code(await gql('{ dashboardStats { totalProducts } }')) === 'UNAUTHENTICATED');
  // --- login failures
  check('wrong password -> INVALID_CREDENTIALS', code(await gql(LOGIN, { input: { email: MGR.email, password: 'nope' } })) === 'INVALID_CREDENTIALS');
  check('unknown email -> INVALID_CREDENTIALS', code(await gql(LOGIN, { input: { email: 'x@y.com', password: 'nope' } })) === 'INVALID_CREDENTIALS');
  check('bad email format -> BAD_USER_INPUT', code(await gql(LOGIN, { input: { email: 'bad', password: 'x' } })) === 'BAD_USER_INPUT');
  // --- manager
  const m = await loginAs(MGR);
  check('manager login ok with MANAGER role', m.r.data?.login?.role === 'MANAGER', JSON.stringify(m.r.errors));
  check('session cookie is HttpOnly + SameSite', /HttpOnly/i.test(m.r.setCookie ?? '') && /SameSite=/i.test(m.r.setCookie ?? ''), m.r.setCookie ?? 'none');
  check('manager me returns user', (await gql('{ me { role } }', {}, m.cookie)).data?.me?.role === 'MANAGER');
  const dash = await gql('{ dashboardStats { totalProducts totalCategories inventoryValue lowStockCount categoryBreakdown { category value } } }', {}, m.cookie);
  check('manager can read dashboard (real data)', (dash.data?.dashboardStats?.totalProducts ?? 0) > 0, JSON.stringify(dash.errors));
  check('manager lists products', (await gql('{ products(input:{pageSize:5, sortBy:"price", sortDir:"desc"}) { total items { name price } } }', {}, m.cookie)).data?.products?.items?.length === 5);
  check('search filters products', (await gql('{ products(input:{search:"rice"}) { total } }', {}, m.cookie)).data?.products?.total === 1);
  const sku1 = `E2E-M-${Date.now()}`;
  const c1 = await gql(CREATE, { input: PRODUCT(sku1) }, m.cookie);
  check('manager creates product', !!c1.data?.createProduct?.id, JSON.stringify(c1.errors));
  if (c1.data?.createProduct?.id) created.push(c1.data.createProduct.id);
  check('duplicate SKU rejected with field error', !!(await gql(CREATE, { input: PRODUCT(sku1) }, m.cookie)).errors?.[0]?.extensions?.fields?.sku);
  check('negative price rejected', code(await gql(CREATE, { input: { ...PRODUCT(sku1 + 'x'), price: -1 } }, m.cookie)) === 'BAD_USER_INPUT');
  const u1 = await gql(UPDATE, { id: c1.data?.createProduct?.id, input: { ...PRODUCT(sku1), price: 99 } }, m.cookie);
  check('manager edits product', u1.data?.updateProduct?.price === 99, JSON.stringify(u1.errors));
  // --- store keeper
  const s = await loginAs(SK);
  check('store keeper login ok with STORE_KEEPER role', s.r.data?.login?.role === 'STORE_KEEPER', JSON.stringify(s.r.errors));
  check('store keeper DENIED dashboard', code(await gql('{ dashboardStats { totalProducts } }', {}, s.cookie)) === 'FORBIDDEN');
  check('store keeper views products', ((await gql('{ products { total } }', {}, s.cookie)).data?.products?.total ?? 0) > 0);
  const sku2 = `E2E-S-${Date.now()}`;
  const c2 = await gql(CREATE, { input: PRODUCT(sku2) }, s.cookie);
  check('store keeper CAN add product', !!c2.data?.createProduct?.id, JSON.stringify(c2.errors));
  if (c2.data?.createProduct?.id) created.push(c2.data.createProduct.id);
  const u2 = await gql(UPDATE, { id: c2.data?.createProduct?.id, input: { ...PRODUCT(sku2), stock: 77 } }, s.cookie);
  check('store keeper CAN edit product', !!u2.data?.updateProduct?.id, JSON.stringify(u2.errors));
  // --- forged role cannot be injected; logout invalidates server-side
  check('forged cookie rejected', code(await gql('{ products { total } }', {}, 'slooze_sid=forged')) === 'UNAUTHENTICATED');
  check('logout returns true', (await gql('mutation{ logout }', {}, m.cookie)).data?.logout === true);
  check('old manager cookie invalid after logout (server-side)', code(await gql('{ dashboardStats { totalProducts } }', {}, m.cookie)) === 'UNAUTHENTICATED');
  // --- CORS
  const pre = await fetch(URL, { method: 'OPTIONS', headers: { origin: ORIGIN, 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type' } });
  check('CORS allows configured origin with credentials', pre.headers.get('access-control-allow-origin') === ORIGIN && pre.headers.get('access-control-allow-credentials') === 'true');
  const evil = await fetch(URL, { method: 'OPTIONS', headers: { origin: 'https://evil.example', 'access-control-request-method': 'POST' } });
  check('CORS does not allow other origins', evil.headers.get('access-control-allow-origin') !== 'https://evil.example');

  const db = new PrismaClient({ adapter: new PrismaBetterSQLite3({ url: sqliteUrl() }) });
  await db.product.deleteMany({ where: { id: { in: created } } });
  await db.$disconnect();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
void main();
