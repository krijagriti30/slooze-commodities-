'use client';

import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { ProductForm } from '@/components/ProductForm';
import { errorInfo } from '@/lib/errors';
import { PRODUCT, type Product } from '@/lib/graphql';

export function EditProduct({ id }: { id: string }) {
  const { data, loading, error, refetch } = useQuery<{ product: Product }>(PRODUCT, { variables: { id }, fetchPolicy: 'network-only' });
  if (data?.product) return <ProductForm product={data.product} />;
  if (loading) return <div className="skeleton h-96" aria-busy="true" />;
  const info = errorInfo(error);
  return (
    <div className="card p-8 text-center" role="alert">
      <p className="font-medium">{info.code === 'NOT_FOUND' ? 'This product no longer exists.' : info.message}</p>
      <div className="mt-4 flex justify-center gap-3">
        {info.code !== 'NOT_FOUND' && <button className="btn-primary" onClick={() => void refetch()}>Retry</button>}
        <Link href="/products" className="btn-ghost">Back to products</Link>
      </div>
    </div>
  );
}
