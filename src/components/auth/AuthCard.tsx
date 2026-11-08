'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GlassCard } from '@/components/ui/GlassCard';

type SignUpStatus = 'empty' | 'loading' | 'success' | 'error';

export function AuthCard() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<SignUpStatus>('empty');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    if (!name.trim() || !email.trim() || password.length < 8 || password.length > 256) {
      setStatus('error');
      setErrorMessage('Add your name and email, and choose a password between 8 and 256 characters.');
      return;
    }
    setStatus('loading');
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus('error');
        setErrorMessage(typeof result?.message === 'string' ? result.message : 'Your account could not be created. Please try again.');
        return;
      }
      setStatus('success');
      router.replace('/app');
      router.refresh();
    } catch {
      setStatus('error');
      setErrorMessage('We couldn’t reach sign-up. Check your connection and try again.');
    }
  }

  return (
    <GlassCard variant="light" radius="24" className="w-full max-w-[440px] space-y-6 p-6 sm:p-8">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--ice-100)] px-3 py-1 text-xs font-semibold text-[var(--blue-700)]">
          <Sparkles size={14} aria-hidden="true" /> Keep every look close
        </span>
        <h1 className="font-display text-4xl leading-tight text-[var(--ink-900)] sm:text-5xl">Create your account</h1>
        <p className="text-sm leading-relaxed text-[var(--ink-500)]">Save your wardrobe and pick up your try-ons whenever inspiration strikes.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={status === 'loading'}>
        <Input label="Name" name="name" placeholder="Your name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />
        <Input label="Email address" name="email" type="email" placeholder="you@example.com" autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input label="Password" name="password" type="password" placeholder="At least 8 characters" autoComplete="new-password" minLength={8} maxLength={256} required value={password} onChange={(event) => setPassword(event.target.value)} />

        {status === 'error' && (
          <p role="alert" className="rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/5 px-3 py-2 text-sm text-[var(--danger)]">{errorMessage}</p>
        )}
        {status === 'success' && (
          <p role="status" className="flex items-center gap-2 text-sm font-medium text-[var(--success)]"><CheckCircle2 size={17} aria-hidden="true" /> Account created. Opening your dashboard…</p>
        )}

        <Button type="submit" className="w-full" isLoading={status === 'loading'} loadingText="Creating account…" rightIcon={<ArrowRight size={17} aria-hidden="true" />}>
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--ink-500)]">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-[var(--blue-700)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-600)]">Sign in</Link>
      </p>
    </GlassCard>
  );
}
