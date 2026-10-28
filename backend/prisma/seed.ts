import '../src/common/env';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';
import { sqliteUrl } from '../src/common/db-url';

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
  console.error('Refusing to seed demo users in production. Set ALLOW_DEMO_SEED=true to override deliberately.');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaBetterSQLite3({ url: sqliteUrl() }) });

// LOCAL DEVELOPMENT ONLY. Override via env; never reuse these anywhere real.
const users = [
  { email: 'manager@slooze.xyz', name: 'Morgan Manager', role: Role.MANAGER, password: process.env.DEMO_MANAGER_PASSWORD ?? 'Manager@123' },
  { email: 'storekeeper@slooze.xyz', name: 'Sam Storekeeper', role: Role.STORE_KEEPER, password: process.env.DEMO_STORE_KEEPER_PASSWORD ?? 'Store@12345' },
];

const products = [
  ['Basmati Rice', 'GRN-BAS-001', 'Grains', 'kg', 92.5, 12000, 3000],
  ['Wheat (Sharbati)', 'GRN-WHT-002', 'Grains', 'kg', 34.2, 25000, 5000],
  ['Yellow Maize', 'GRN-MAZ-003', 'Grains', 'kg', 22.8, 1800, 4000],
  ['Toor Dal', 'PLS-TOR-001', 'Pulses', 'kg', 128, 6400, 1500],
  ['Chickpeas (Chana)', 'PLS-CHN-002', 'Pulses', 'kg', 74, 5200, 1500],
  ['Black Pepper', 'SPC-BPP-001', 'Spices', 'kg', 640, 900, 300],
  ['Turmeric Fingers', 'SPC-TUR-002', 'Spices', 'kg', 168, 450, 500],
  ['Cumin Seeds', 'SPC-CUM-003', 'Spices', 'kg', 285, 1300, 400],
  ['Refined Sunflower Oil', 'OIL-SUN-001', 'Edible Oils', 'litre', 118, 7800, 2000],
  ['Mustard Oil', 'OIL-MUS-002', 'Edible Oils', 'litre', 146, 3100, 1000],
  ['Raw Sugar', 'SWT-SUG-001', 'Sweeteners', 'kg', 41, 15000, 4000],
  ['Jaggery Blocks', 'SWT-JAG-002', 'Sweeteners', 'kg', 58, 2600, 800],
  ['Arabica Coffee Beans', 'BEV-ARA-001', 'Beverages', 'kg', 720, 380, 400],
  ['Assam Tea Leaves', 'BEV-TEA-002', 'Beverages', 'kg', 310, 1200, 500],
] as const;

async function main() {
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash },
      create: { email: u.email, name: u.name, role: u.role, passwordHash },
    });
  }
  for (const [name, sku, category, unit, price, stock, reorderLevel] of products) {
    await prisma.product.upsert({
      where: { sku },
      update: {},
      create: { name, sku, category, unit, price, stock, reorderLevel, description: `${name} - sample demo commodity.` },
    });
  }
  console.log(`Seeded ${users.length} demo users and ${products.length} products (repeatable).`);
}

main().finally(() => prisma.$disconnect());
