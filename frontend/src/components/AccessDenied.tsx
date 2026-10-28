import Link from 'next/link';

export function AccessDenied() {
  return (
    <div className="card mx-auto mt-10 max-w-lg p-8 text-center" role="alert">
      <p className="text-4xl font-semibold text-danger">403</p>
      <h1 className="mt-2 text-xl font-semibold">Access denied</h1>
      <p className="mt-2 text-sm text-muted">The dashboard is available to Managers only. Your account can still view, add and edit products.</p>
      <Link href="/products" className="btn-primary mt-6">Go to Products</Link>
    </div>
  );
}
