import type { Metadata } from 'next';
import { ProductsView } from './ProductsView';

export const metadata: Metadata = { title: 'Products' };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  return <ProductsView notice={notice === 'created' ? 'Product created.' : notice === 'updated' ? 'Product updated.' : null} />;
}
