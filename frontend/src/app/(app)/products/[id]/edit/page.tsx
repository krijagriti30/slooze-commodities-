import type { Metadata } from 'next';
import { EditProduct } from './EditProduct';

export const metadata: Metadata = { title: 'Edit product' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <EditProduct id={id} />
    </div>
  );
}
