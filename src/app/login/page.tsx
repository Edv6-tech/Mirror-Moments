import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { SignInCard } from '@/components/auth/SignInCard';

export const metadata: Metadata = {
  title: 'Sign in — Mirror Moment',
  description: 'Sign in to Mirror Moment with your email and password to revisit saved looks.',
};

export default function LoginPage() {
  return (
    <main className="app-dashboard-theme min-h-screen">
      <AuroraBackground className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-[1fr_440px] md:gap-16">
          <section className="hidden md:block">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--blue-700)] hover:text-[var(--blue-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-600)] rounded-md">
              <ArrowLeft size={16} aria-hidden="true" /> Back to Mirror Moment
            </Link>
            <p className="mt-16 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--blue-700)]">Your next look awaits</p>
            <h2 className="mt-4 max-w-xl font-display text-[clamp(42px,6vw,76px)] leading-[0.98] text-[var(--ink-900)]">
              Pick up right where your style left off.
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-[var(--ink-500)]">
              Your saved wardrobe and favourite try-ons are ready when you are.
            </p>
            <div aria-hidden="true" className="mt-10 flex items-center gap-3">
              <span className="h-1.5 w-20 rounded-full bg-[var(--blue-700)]" />
              <span className="h-1.5 w-10 rounded-full bg-[var(--blue-600)]/50" />
              <span className="h-1.5 w-5 rounded-full bg-[var(--sky-400)]/70" />
            </div>
          </section>

          <div className="w-full">
            <Link href="/" className="mb-6 inline-flex text-center font-display text-3xl tracking-wide text-[var(--ink-900)] md:hidden">
              Mirror<span className="text-[var(--blue-600)]"> Moment</span>
            </Link>
            <SignInCard />
            <p className="mx-auto mt-5 max-w-sm text-center text-xs leading-relaxed text-[var(--ink-500)]">
              By signing in, you agree to our{' '}
              <Link href="/privacy" className="font-semibold text-[var(--blue-700)] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-600)]">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </AuroraBackground>
    </main>
  );
}
