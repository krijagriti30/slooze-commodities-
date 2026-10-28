import type { Metadata } from 'next';
import { ProductForm } from '@/components/ProductForm';

export const metadata: Metadata = { title: 'Add product' };

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-semibold">Add product</h1>
      <ProductForm />
    </div>
  );
}
