'use client';

import { useApolloClient, useMutation, type ApolloError } from '@apollo/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import { Spinner } from './Icons';
import { errorInfo, type FieldErrors } from '@/lib/errors';
import { CREATE_PRODUCT, UPDATE_PRODUCT, type Product, type ProductInput } from '@/lib/graphql';

type FormState = Record<'name' | 'sku' | 'category' | 'unit' | 'price' | 'stock' | 'reorderLevel' | 'description', string>;

const empty: FormState = { name: '', sku: '', category: '', unit: 'kg', price: '', stock: '', reorderLevel: '0', description: '' };

function validate(f: FormState): { errors: FieldErrors; input?: ProductInput } {
  const e: FieldErrors = {};
  if (f.name.trim().length < 2) e.name = 'Name must be at least 2 characters.';
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{1,39}$/.test(f.sku.trim())) e.sku = 'SKU: 2-40 letters, numbers, "-" or "_".';
  if (f.category.trim().length < 2) e.category = 'Category is required.';
  if (!f.unit.trim()) e.unit = 'Unit is required (e.g. kg, litre).';
  const price = Number(f.price);
  if (f.price.trim() === '' || !Number.isFinite(price)) e.price = 'Enter a price.';
  else if (price < 0) e.price = 'Price cannot be negative.';
  else if (Math.round(price * 100) / 100 !== price) e.price = 'Use at most 2 decimal places.';
  const whole = (v: string, label: string) => (v.trim() === '' || !/^\d+$/.test(v.trim()) ? `${label} must be a whole number, 0 or more.` : undefined);
  const se = whole(f.stock, 'Stock'); if (se) e.stock = se;
  const re = whole(f.reorderLevel, 'Reorder level'); if (re) e.reorderLevel = re;
  if (f.description.length > 500) e.description = 'Description is limited to 500 characters.';
  if (Object.keys(e).length) return { errors: e };
  return { errors: e, input: { name: f.name.trim(), sku: f.sku.trim(), category: f.category.trim(), unit: f.unit.trim(), price, stock: Number(f.stock), reorderLevel: Number(f.reorderLevel), description: f.description.trim() || null } };
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const client = useApolloClient();
  const uid = useId();
  const editing = !!product;
  const [form, setForm] = useState<FormState>(product
    ? { name: product.name, sku: product.sku, category: product.category, unit: product.unit, price: String(product.price), stock: String(product.stock), reorderLevel: String(product.reorderLevel), description: product.description ?? '' }
    : empty);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [create, { loading: creating }] = useMutation(CREATE_PRODUCT);
  const [update, { loading: updating }] = useMutation(UPDATE_PRODUCT);
  const busy = creating || updating || done;

  const set = (k: keyof FormState) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return; // block duplicate submissions
    setFormError(null);
    const { errors: ve, input } = validate(form);
    setErrors(ve);
    if (!input) return;
    try {
      if (editing) await update({ variables: { id: product.id, input } });
      else await create({ variables: { input } });
    } catch (err) {
      const info = errorInfo(err as ApolloError);
      setErrors(info.fields);
      setFormError(info.code === 'UNAUTHENTICATED' ? 'Your session has expired. Please sign in again.' : info.message);
      return;
    }
    setDone(true);
    await client.refetchQueries({ include: ['Products'] });
    router.push(`/products?notice=${editing ? 'updated' : 'created'}`);
    router.refresh();
  }

  const field = (k: keyof FormState, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`${uid}-${k}`} className="label">{label}</label>
      <input id={`${uid}-${k}`} className={`input ${errors[k] ? 'input-error' : ''}`} value={form[k]} onChange={set(k)} disabled={busy}
        aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `${uid}-${k}-err` : undefined} {...props} />
      {errors[k] && <p id={`${uid}-${k}-err`} className="field-error">{errors[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-5 p-6">
      {formError && <div role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{formError}</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        {field('name', 'Product name')}
        {field('sku', 'SKU')}
        {field('category', 'Category')}
        {field('unit', 'Unit of measure', { placeholder: 'kg, litre, ton…' })}
        {field('price', 'Price per unit (INR)', { inputMode: 'decimal' })}
        {field('stock', 'Stock on hand', { inputMode: 'numeric' })}
        {field('reorderLevel', 'Reorder level', { inputMode: 'numeric' })}
      </div>
      <div>
        <label htmlFor={`${uid}-description`} className="label">Description <span className="font-normal text-muted">(optional)</span></label>
        <textarea id={`${uid}-description`} rows={3} className={`input ${errors.description ? 'input-error' : ''}`} value={form.description} onChange={set('description')} disabled={busy} />
        {errors.description && <p className="field-error">{errors.description}</p>}
      </div>
      <div className="flex justify-end gap-3">
        <Link href="/products" className="btn-ghost">Cancel</Link>
        <button type="submit" className="btn-primary" disabled={busy}>{busy && <Spinner />}{busy ? 'Saving…' : editing ? 'Save changes' : 'Create product'}</button>
      </div>
    </form>
  );
}
