'use client';

import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SearchIcon } from '@/components/Icons';
import { errorInfo } from '@/lib/errors';
import { formatCurrency, formatNumber } from '@/lib/format';
import { PRODUCTS, type Product, type ProductSortField } from '@/lib/graphql';

type Data = { products: { items: Product[]; total: number; page: number; pageSize: number }; productCategories: string[] };
const PAGE_SIZE = 10;

export function ProductsView({ notice }: { notice: string | null }) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState<ProductSortField>('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, loading, error, refetch } = useQuery<Data>(PRODUCTS, {
    variables: { input: { search: debounced || undefined, category: category || undefined, sortBy, sortDir, page, pageSize: PAGE_SIZE } },
  });
  const items = data?.products.items ?? [];
  const total = data?.products.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = !!debounced || !!category;

  const sortHeader = (field: ProductSortField, label: string, align = 'text-left') => (
    <th scope="col" className={`px-4 py-3 ${align}`} aria-sort={sortBy === field ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="inline-flex items-center gap-1 font-medium hover:text-fg"
        onClick={() => { if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); else { setSortBy(field); setSortDir('asc'); } setPage(1); }}>
        {label}<span aria-hidden className="text-xs">{sortBy === field ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
      </button>
    </th>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted">{data ? `${formatNumber(total)} product${total === 1 ? '' : 's'}` : 'Browse and manage commodities.'}</p>
        </div>
        <Link href="/products/new" className="btn-primary">Add product</Link>
      </div>

      {notice && <div role="status" className="rounded-lg border border-success/40 bg-success/10 px-4 py-2 text-sm text-success">{notice}</div>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input type="search" className="input pl-9" placeholder="Search by name, SKU or category" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
        </div>
        <select className="input sm:w-52" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Filter by category">
          <option value="">All categories</option>
          {data?.productCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {error && !data && (
        <div className="card p-8 text-center" role="alert">
          <p className="font-medium">{errorInfo(error).message}</p>
          <button className="btn-primary mt-4" onClick={() => void refetch()}>Retry</button>
        </div>
      )}

      {!error && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead className="border-b border-border bg-surface-2 text-muted">
                <tr>
                  {sortHeader('name', 'Product')}
                  {sortHeader('category', 'Category')}
                  {sortHeader('price', 'Price', 'text-right')}
                  {sortHeader('stock', 'Stock', 'text-right')}
                  <th scope="col" className="px-4 py-3 text-right font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && !data && Array.from({ length: 6 }, (_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="skeleton h-6" /></td></tr>)}
                {items.map((p) => {
                  const low = p.stock <= p.reorderLevel;
                  return (
                    <tr key={p.id} className="hover:bg-surface-2/60">
                      <td className="px-4 py-3"><p className="font-medium">{p.name}</p><p className="text-xs text-muted">{p.sku}</p></td>
                      <td className="px-4 py-3">{p.category}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(p.price)}<span className="text-xs text-muted"> / {p.unit}</span></td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatNumber(p.stock)} {p.unit}
                        {low && <span className="badge ml-2 bg-warning/15 text-warning">Low</span>}
                      </td>
                      <td className="px-4 py-3 text-right"><Link href={`/products/${p.id}/edit`} className="btn-ghost !px-3 !py-1.5" aria-label={`Edit ${p.name}`}>Edit</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data && items.length === 0 && (
            <div className="p-10 text-center">
              <p className="font-medium">{filtered ? 'No products match your filters' : 'No products yet'}</p>
              <p className="mt-1 text-sm text-muted">{filtered ? 'Try a different search or category.' : 'Add your first commodity to get started.'}</p>
              {!filtered && <Link href="/products/new" className="btn-primary mt-4">Add product</Link>}
            </div>
          )}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
              <span className="text-muted">Page {page} of {pages}</span>
              <div className="flex gap-2">
                <button className="btn-ghost !py-1.5" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <button className="btn-ghost !py-1.5" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
