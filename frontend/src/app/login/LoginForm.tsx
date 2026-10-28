'use client';

import { useApolloClient, useMutation, type ApolloError } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import { EyeIcon, EyeOffIcon, Spinner } from '@/components/Icons';
import { errorInfo } from '@/lib/errors';
import { LOGIN, type SessionUser } from '@/lib/graphql';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const router = useRouter();
  const client = useApolloClient();
  const id = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [login, { loading }] = useMutation<{ login: SessionUser }>(LOGIN);
  const busy = loading || redirecting;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return; // prevent duplicate submissions
    setFormError(null);
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Email is required.';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Password is required.';
    setErrors(next);
    if (Object.keys(next).length) return;

    let user: SessionUser | undefined;
    try {
      const { data } = await login({ variables: { input: { email: email.trim(), password } } });
      user = data?.login;
    } catch (err) {
      const info = errorInfo(err as ApolloError);
      if (info.code === 'BAD_USER_INPUT') setErrors({ email: info.fields['email'], password: info.fields['password'] });
      setFormError(info.code === 'INVALID_CREDENTIALS' ? 'Incorrect email or password.' : info.message);
      return;
    }
    if (!user) { setFormError('Sign-in failed. Please try again.'); return; }
    setRedirecting(true);
    await client.clearStore();
    router.replace(user.role === 'MANAGER' ? '/dashboard' : '/products');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && <div role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{formError}</div>}
      <div>
        <label htmlFor={`${id}-email`} className="label">Email</label>
        <input id={`${id}-email`} type="email" autoComplete="username" className={`input ${errors.email ? 'input-error' : ''}`} value={email}
          onChange={(e) => setEmail(e.target.value)} disabled={busy} aria-invalid={!!errors.email} aria-describedby={errors.email ? `${id}-email-err` : undefined} placeholder="you@company.com" />
        {errors.email && <p id={`${id}-email-err`} className="field-error">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor={`${id}-pw`} className="label">Password</label>
        <div className="relative">
          <input id={`${id}-pw`} type={show ? 'text' : 'password'} autoComplete="current-password" className={`input pr-10 ${errors.password ? 'input-error' : ''}`} value={password}
            onChange={(e) => setPassword(e.target.value)} disabled={busy} aria-invalid={!!errors.password} aria-describedby={errors.password ? `${id}-pw-err` : undefined} />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg" aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {errors.password && <p id={`${id}-pw-err`} className="field-error">{errors.password}</p>}
      </div>
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy && <Spinner />} {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
