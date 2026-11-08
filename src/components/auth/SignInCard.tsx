'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';

type SignInStatus = 'empty' | 'loading' | 'success' | 'error';

export function SignInCard() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<SignInStatus>('empty');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setStatus('error');
      setErrorMessage('Enter your email and password to continue.');
      return;
    }

    setStatus('loading');
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus('error');
        setErrorMessage(typeof result?.message === 'string' ? result.message : 'That email and password combination wasn’t recognized. Check them and try again.');
        return;
      }

      setStatus('success');
      router.replace('/app');
      router.refresh();
    } catch {
      setStatus('error');
      setErrorMessage('We couldn’t reach sign-in. Check your connection and try again.');
    }
  }

  return (
    <GlassCard variant="light" radius="24" className="w-full max-w-[440px] space-y-6 p-6 sm:p-8">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--ice-100)] px-3 py-1 text-xs font-semibold text-[var(--blue-700)]">
          <Sparkles size={14} aria-hidden="true" /> Your style, saved
        </span>
        <h1 className="font-display text-4xl leading-tight text-[var(--ink-900)] sm:text-5xl">Welcome back</h1>
        <p className="text-sm leading-relaxed text-[var(--ink-500)]">
          Sign in to revisit your wardrobe, saved looks, and try-ons.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={status === 'loading'}>
        <Input
          label="Email address"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {status === 'error' && (
          <p role="alert" className="rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/5 px-3 py-2 text-sm text-[var(--danger)]">
            {errorMessage}
          </p>
        )}
        {status === 'success' && (
          <p role="status" className="flex items-center gap-2 text-sm font-medium text-[var(--success)]">
            <CheckCircle2 size={17} aria-hidden="true" /> Signed in. Opening your dashboard…
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          isLoading={status === 'loading'}
          loadingText="Signing in…"
          rightIcon={<ArrowRight size={17} aria-hidden="true" />}
        >
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--ink-500)]">
        New to Mirror Moment?{' '}
        <Link href="/signup" className="font-semibold text-[var(--blue-700)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-600)]">
          Create an account
        </Link>
      </p>
    </GlassCard>
  );
}
