'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GlassCard } from '@/components/ui/GlassCard';
import { createClient } from '@/lib/supabase/client';

export function AuthCard() {
  const router = useRouter();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Validation errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  // ── Validation helpers ────────────────────────────────────────────────────
  const validateEmail = (v: string) => {
    if (!v) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
    return '';
  };
  const validatePassword = (v: string) => {
    if (!v) return 'Password is required.';
    if (v.length < 8) return 'Password must be at least 8 characters.';
    return '';
  };
  const validateName = (v: string) => {
    if (!v.trim()) return 'Name is required.';
    return '';
  };

  // ── Blur handlers ─────────────────────────────────────────────────────────
  const handleEmailBlur = () => setEmailError(validateEmail(email));
  const handlePasswordBlur = () => setPasswordError(validatePassword(password));
  const handleNameBlur = () => setNameError(validateName(name));

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setIsLoading(true);
    setFormError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (error) { setFormError(error.message); setIsLoading(false); }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError('');

      const eErr = validateEmail(email);
      const pErr = validatePassword(password);
      const nErr = validateName(name);
      setEmailError(eErr);
      setPasswordError(pErr);
      setNameError(nErr);
      if (eErr || pErr || nErr) return;

      setIsLoading(true);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) { setFormError(error.message); setIsLoading(false); return; }

      router.push('/app');
    },
    [email, password, name, router, supabase]
  );

  return (
    <GlassCard variant="light" radius="24" className="w-full max-w-[420px] space-y-6">
      {/* ── Form ── */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Name"
          placeholder="Your name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          error={nameError}
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={handleEmailBlur}
          error={emailError}
        />
        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={handlePasswordBlur}
          error={passwordError}
        />

        {formError && (
          <p role="alert" className="text-[13px] text-[var(--danger)] font-medium">
            {formError}
          </p>
        )}
        <Button type="submit" className="w-full" isLoading={isLoading} loadingText="One moment…">
          Create account
        </Button>
      </form>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--line)]" />
        <span className="text-[12px] text-[var(--ink-500)] font-medium uppercase tracking-wide">or</span>
        <div className="flex-1 h-px bg-[var(--line)]" />
      </div>

      {/* ── OAuth + Guest ── */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={handleGoogle}
          aria-label="Continue with Google"
        >
          {/* Simple Google "G" icon via SVG */}
          <svg className="w-4 h-4 mr-2 flex-shrink-0" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => router.push('/try')}
          aria-label="Continue as guest without an account"
        >
          Continue as guest
        </Button>
      </div>
    </GlassCard>
  );
}
