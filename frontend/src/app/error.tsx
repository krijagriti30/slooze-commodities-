'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="card max-w-md p-8 text-center">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted">The service may be unavailable. Please try again.</p>
        <button className="btn-primary mt-5" onClick={reset}>Retry</button>
      </div>
    </main>
  );
}
