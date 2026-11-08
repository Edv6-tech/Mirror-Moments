import type { Metadata } from 'next';
import Image from 'next/image';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { AuthCard } from '@/components/auth/AuthCard';

export const metadata: Metadata = {
  title: 'Sign up — Mirror Moment',
  description: 'Create a free Mirror Moment account to save your wardrobe and looks.',
};

export default function SignupPage() {
  return (
    <main className="app-dashboard-theme min-h-screen flex">
      {/* ── Left panel — dark brand half (desktop only) ── */}
      <div
        className="hidden md:flex md:w-1/2 lg:w-[55%] relative flex-col justify-between p-10 overflow-hidden"
        style={{ background: 'var(--blue-700)' }}
        aria-hidden="true"
      >
        <AuroraBackground className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-8 z-0 overflow-hidden rounded-[28px] bg-white">
          <Image
            src="/signup-rose-bouquet.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 55vw, 100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--blue-700)]/55 via-transparent to-[var(--blue-700)]/20" />
        </div>
        {/* Wordmark */}
        <div className="relative z-10">
          <span className="font-display text-2xl text-white tracking-wide select-none">
            Mirror<span className="text-[var(--sky-400)]"> Moment</span>
          </span>
        </div>
        {/* Quote */}
        <blockquote className="relative z-10 max-w-xs">
          <p className="font-display text-[clamp(24px,3vw,36px)] text-white leading-tight mb-3">
            Your next favourite dress is one photo away.
          </p>
          <cite className="not-italic text-[13px] text-[var(--sky-400)] font-medium uppercase tracking-widest">
            Mirror Moment
          </cite>
        </blockquote>
      </div>

      {/* ── Right panel — auth form ── */}
      <div
        className="flex flex-1 flex-col items-center justify-center p-6 md:p-12"
        style={{ background: 'var(--pearl-50)' }}
      >
        {/* Mobile wordmark */}
        <div className="md:hidden mb-8 text-center">
          <span className="font-display text-3xl text-[var(--ink-900)] tracking-wide select-none">
            Mirror<span className="text-[var(--blue-600)]"> Moment</span>
          </span>
        </div>

        <AuthCard />

        <p className="mt-8 text-[12px] text-[var(--ink-500)] text-center max-w-xs">
          By continuing, you agree to our{' '}
          <a href="/privacy" className="underline underline-offset-2 hover:text-[var(--ink-900)]">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </main>
  );
}
