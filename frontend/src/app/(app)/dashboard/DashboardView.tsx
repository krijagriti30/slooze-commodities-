'use client';

import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { errorInfo } from '@/lib/errors';
import { formatCompactCurrency, formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { DASHBOARD, type DashboardStats } from '@/lib/graphql';

const PALETTE = ['#4361ee', '#16a34a', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#ef4444'];

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Donut({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 15.9155; // circumference = 100
  let offset = 25;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <svg viewBox="0 0 36 36" className="h-40 w-40 shrink-0 -rotate-0" role="img" aria-label="Units in stock by category">
        <circle cx="18" cy="18" r={r} fill="none" className="stroke-surface-2" strokeWidth="5" />
        {data.map((d, i) => {
          const pct = (d.value / total) * 100;
          const el = <circle key={d.label} cx="18" cy="18" r={r} fill="none" stroke={PALETTE[i % PALETTE.length]} strokeWidth="5" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={offset} />;
          offset -= pct;
          return el;
        })}
      </svg>
      <ul className="w-full space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />{d.label}</span>
            <span className="tabular-nums text-muted">{((d.value / total) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28" />)}</div>
      <div className="grid gap-6 lg:grid-cols-2"><div className="skeleton h-72" /><div className="skeleton h-72" /></div>
    </div>
  );
}

export function DashboardView() {
  const { data, loading, error, refetch } = useQuery<{ dashboardStats: DashboardStats }>(DASHBOARD);
  const stats = data?.dashboardStats;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted">Live inventory insights from your product catalogue.</p>
      </div>

      {!stats && loading && <Skeleton />}
      {!stats && error && (
        <div className="card p-8 text-center" role="alert">
          <p className="font-medium">{errorInfo(error).message}</p>
          <button className="btn-primary mt-4" onClick={() => void refetch()}>Retry</button>
        </div>
      )}

      {stats && stats.totalProducts === 0 && (
        <div className="card p-10 text-center">
          <h2 className="text-lg font-semibold">No products yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">Add your first commodity to see inventory statistics and charts here.</p>
          <Link href="/products/new" className="btn-primary mt-5">Add product</Link>
        </div>
      )}

      {stats && stats.totalProducts > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Total products" value={formatNumber(stats.totalProducts)} />
            <Stat label="Categories" value={formatNumber(stats.totalCategories)} />
            <Stat label="Units in stock" value={formatNumber(stats.totalUnitsInStock)} hint="Across all units of measure" />
            <Stat label="Inventory value" value={formatCompactCurrency(stats.inventoryValue)} hint={formatCurrency(stats.inventoryValue)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-5" aria-labelledby="value-h">
              <h2 id="value-h" className="font-semibold">Inventory value by category</h2>
              <ul className="mt-4 space-y-3">
                {stats.categoryBreakdown.map((c, i) => {
                  const max = stats.categoryBreakdown[0]?.value || 1;
                  return (
                    <li key={c.category}>
                      <div className="mb-1 flex justify-between text-sm"><span>{c.category} <span className="text-muted">({c.productCount})</span></span><span className="tabular-nums">{formatCompactCurrency(c.value)}</span></div>
                      <div className="h-2.5 rounded-full bg-surface-2"><div className="h-full rounded-full" style={{ width: `${Math.max((c.value / max) * 100, 2)}%`, background: PALETTE[i % PALETTE.length] }} /></div>
                    </li>
                  );
                })}
              </ul>
            </section>
            <section className="card p-5" aria-labelledby="stock-h">
              <h2 id="stock-h" className="mb-4 font-semibold">Units in stock by category</h2>
              {stats.totalUnitsInStock > 0
                ? <Donut data={stats.categoryBreakdown.map((c) => ({ label: c.category, value: c.stock }))} />
                : <p className="text-sm text-muted">All products are currently out of stock.</p>}
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-5" aria-labelledby="low-h">
              <div className="flex items-center justify-between">
                <h2 id="low-h" className="font-semibold">Low stock</h2>
                <span className={`badge ${stats.lowStockCount ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'}`}>{stats.lowStockCount} item{stats.lowStockCount === 1 ? '' : 's'}</span>
              </div>
              {stats.lowStockProducts.length === 0
                ? <p className="mt-4 text-sm text-muted">Every product is above its reorder level.</p>
                : <ul className="mt-3 divide-y divide-border">{stats.lowStockProducts.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                      <Link href={`/products/${p.id}/edit`} className="font-medium hover:text-primary">{p.name}</Link>
                      <span className="tabular-nums text-warning">{formatNumber(p.stock)} / {formatNumber(p.reorderLevel)} {p.unit}</span>
                    </li>))}</ul>}
            </section>
            <section className="card p-5" aria-labelledby="recent-h">
              <h2 id="recent-h" className="font-semibold">Recent updates</h2>
              <ul className="mt-3 divide-y divide-border">{stats.recentUpdates.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-medium">{p.name}</span><span className="text-xs text-muted">{formatDate(p.updatedAt)}</span>
                </li>))}</ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
