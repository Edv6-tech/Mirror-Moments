'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Sparkles,
  Menu,
  X,
  Shirt,
  BookMarked,
  Users,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import clsx from 'clsx';

import { AuroraBackground, Button, Chip, GlassCard } from '@/components/ui';
import FX8BeforeAfterSlider from '@/components/effects/FX8BeforeAfterSlider';
import { FaqAccordion } from '@/components/ui/FaqAccordion';

// ─── Motion helpers ───────────────────────────────────────────────────────────
const ease = [0.22, 1, 0.36, 1] as const;

function FadeRise({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── SVG placeholders ─────────────────────────────────────────────────────────
function DressSVG() {
  return (
    <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="dressG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#1E3FB8" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <rect width="120" height="160" fill="var(--ice-100)" />
      <path
        d="M60 24 C48 24 38 34 36 44 L28 80 C25 92 24 104 28 116 L34 148 L86 148 L92 116 C96 104 95 92 92 80 L84 44 C82 34 72 24 60 24 Z"
        fill="url(#dressG)"
        stroke="rgba(37,99,235,0.5)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function PersonSVG() {
  return (
    <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="120" height="160" fill="var(--ice-100)" />
      <circle cx="60" cy="28" r="16" fill="rgba(91,107,140,0.4)" />
      <path
        d="M60 44 C44 44 34 56 32 68 L24 108 C22 120 24 132 28 144 L92 144 C96 132 98 120 96 108 L88 68 C86 56 76 44 60 44 Z"
        fill="rgba(91,107,140,0.3)"
        stroke="rgba(91,107,140,0.5)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function YouWearingItSVG() {
  return (
    <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="resultG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1E3FB8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <rect width="120" height="160" fill="url(#resultG)" />
      <circle cx="60" cy="28" r="16" fill="rgba(255,255,255,0.5)" />
      <path
        d="M60 44 C44 44 34 56 32 68 L24 108 C22 120 24 132 28 144 L92 144 C96 132 98 120 96 108 L88 68 C86 56 76 44 60 44 Z"
        fill="rgba(255,255,255,0.3)"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.5"
      />
      <text x="60" y="82" textAnchor="middle" fill="white" fontFamily="sans-serif" fontSize="8" opacity="0.9">✓</text>
    </svg>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '#how-it-works', label: 'How it works' },
    { href: '#showcase', label: 'Showcase' },
    { href: '#faq', label: 'FAQ' },
  ];

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-[72px] glass-surface-light">
      <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between">
        {/* Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sky-400)] rounded-lg"
          aria-label="Mirror Moment home"
        >
          <Sparkles size={20} className="text-[var(--blue-600)]" aria-hidden="true" />
          <span className="font-display text-[22px] font-semibold text-[var(--ink-900)]">
            Mirror Moment
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Site navigation">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={(e) => handleSmoothScroll(e, href)}
              className="text-[14px] font-semibold text-[var(--ink-500)] hover:text-[var(--ink-900)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sky-400)] rounded-md px-1"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/try">
            <Button variant="primary" size="sm">Try it free</Button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden flex items-center justify-center w-11 h-11 rounded-full hover:bg-[var(--ice-100)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sky-400)]"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? (
            <X size={22} className="text-[var(--ink-900)]" />
          ) : (
            <Menu size={22} className="text-[var(--ink-900)]" />
          )}
        </button>
      </div>

      {/* Mobile full-screen overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 glass-surface-light flex flex-col items-center justify-center gap-8 animate-in fade-in duration-200">
          <button
            type="button"
            className="absolute top-5 right-5 w-11 h-11 flex items-center justify-center rounded-full hover:bg-[var(--ice-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sky-400)]"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <X size={24} className="text-[var(--ink-900)]" />
          </button>
          <nav aria-label="Mobile navigation" className="flex flex-col items-center gap-6">
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={(e) => handleSmoothScroll(e, href)}
                className="font-display text-3xl font-semibold text-[var(--ink-900)] hover:text-[var(--blue-600)] transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col items-center gap-3 w-48">
            <Link href="/login" className="w-full" onClick={() => setMenuOpen(false)}>
              <Button variant="secondary" size="lg" className="w-full">Log in</Button>
            </Link>
            <Link href="/try" className="w-full" onClick={() => setMenuOpen(false)}>
              <Button variant="primary" size="lg" className="w-full">Try it free</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Hero floating card ───────────────────────────────────────────────────────
function HeroCard({
  step,
  label,
  children,
  delay,
}: {
  step: string;
  label: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease }}
      style={{
        // Continuous oscillation
        animation: `floatY${delay * 10 | 0} 4s ease-in-out infinite`,
      }}
    >
      <GlassCard
        variant="light"
        radius="24"
        className="w-[140px] md:w-[160px] flex flex-col overflow-hidden p-0"
      >
        <div className="aspect-[3/4] w-full overflow-hidden bg-[var(--ice-100)]">
          {children}
        </div>
        <div className="px-3 py-2">
          <p className="text-[11px] font-semibold text-[var(--blue-700)] uppercase tracking-wider">{step}</p>
          <p className="text-[13px] text-[var(--ink-900)] font-semibold leading-snug">{label}</p>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ─── Step card (How it works) ─────────────────────────────────────────────────
function StepCard({
  num,
  title,
  desc,
  delay,
}: {
  num: number;
  title: string;
  desc: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease }}
    >
      <GlassCard variant="light" radius="24" className="h-full flex flex-col gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--blue-600)] flex items-center justify-center text-white font-display text-xl font-semibold">
          {num}
        </div>
        <h3 className="font-display text-xl font-semibold text-[var(--ink-900)]">{title}</h3>
        <p className="text-[14px] text-[var(--ink-500)] leading-relaxed">{desc}</p>
      </GlassCard>
    </motion.div>
  );
}

// ─── FAQ data ─────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    question: 'Do I need an account?',
    answer:
      'No — guests get 3 free tries per day. Create an account for 10 tries and a saved wardrobe.',
  },
  {
    question: 'What photos work best?',
    answer: 'Clear, well-lit full-body shots. The whole dress should be visible.',
  },
  {
    question: 'Can the dress be worn by someone else?',
    answer:
      'Yes — our AI lifts the dress out whether it\'s on a person, mannequin or laid flat.',
  },
  {
    question: 'Are my photos stored?',
    answer:
      'For guests, nothing is stored on our servers. For accounts, photos are private and deletable.',
  },
  {
    question: 'How accurate is it?',
    answer:
      'Think of it as a vibe check, not a fit guarantee. It gives you a realistic sense of the look.',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const handleSmoothScroll = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Keyframes for floating hero cards */}
      <style>{`
        @keyframes floatY0 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes floatY6 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes floatY12 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @media (prefers-reduced-motion: reduce) {
          [style*="floatY"] { animation: none !important; }
        }
      `}</style>

      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <AuroraBackground variant="light" className="min-h-screen pt-[72px]">
        <section className="min-h-[calc(100vh-72px)] flex flex-col items-center justify-center px-4 py-20 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="flex flex-col items-center gap-5 max-w-[680px]"
          >
            <Chip label="Try-on for your next big occasion" variant="ice" icon={<Sparkles size={12} />} />

            <h1
              className="font-display font-semibold text-[var(--ink-900)] leading-[1.05] tracking-tight"
              style={{ fontSize: 'clamp(44px, 7vw, 88px)' }}
            >
              Wear the dress
              <br />
              <span className="text-gradient">before it&apos;s yours.</span>
            </h1>

            <p className="text-[20px] text-[var(--ink-500)] max-w-[560px]">
              Upload any dress photo, even one worn by someone else. We lift the dress out
              and dress you in it.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link href="/try">
                <Button variant="primary" size="lg" leftIcon={<Sparkles size={18} />}>
                  Try a dress now
                </Button>
              </Link>
              <button
                type="button"
                onClick={(e) => handleSmoothScroll(e, '#how-it-works')}
                className="h-[56px] min-h-[56px] px-9 text-[16px] rounded-full font-semibold border border-[var(--blue-500)]/40 bg-white/70 backdrop-blur-md text-[var(--blue-700)] hover:border-[var(--blue-500)] hover:bg-[var(--ice-100)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sky-400)]"
              >
                See how it works
              </button>
            </div>

            <p className="text-[12px] text-[var(--ink-500)]">
              Powered by YouCam AI · Your photos stay private.
            </p>
          </motion.div>

          {/* Floating step cards */}
          <div className="flex items-end justify-center gap-4 mt-14 flex-wrap">
            <HeroCard step="Step 1" label="Dress photo" delay={0.3}>
              <DressSVG />
            </HeroCard>
            <HeroCard step="Step 2" label="Dress only" delay={0.5}>
              <div className="w-full h-full bg-[var(--ice-100)] flex items-center justify-center">
                <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <rect width="120" height="160" fill="var(--pearl-50)" />
                  <path
                    d="M60 36 C44 36 34 48 32 60 L24 100 C22 112 24 124 28 136 L92 136 C96 124 98 112 96 100 L88 60 C86 48 76 36 60 36 Z"
                    fill="rgba(37,99,235,0.18)"
                    stroke="rgba(56,189,248,0.8)"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  <text x="60" y="90" textAnchor="middle" fill="#38BDF8" fontFamily="sans-serif" fontSize="8">lifted ✓</text>
                </svg>
              </div>
            </HeroCard>
            <HeroCard step="Step 3" label="You, wearing it" delay={0.7}>
              <YouWearingItSVG />
            </HeroCard>
          </div>
        </section>
      </AuroraBackground>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="py-24 md:py-32 bg-[var(--pearl-50)] px-4"
        aria-labelledby="hiw-heading"
      >
        <div className="max-w-5xl mx-auto space-y-12">
          <FadeRise className="text-center">
            <h2
              id="hiw-heading"
              className="font-display font-semibold text-[var(--ink-900)]"
              style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
            >
              How it works
            </h2>
          </FadeRise>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StepCard num={1} title="Upload a dress" desc="A model, mannequin or flat lay — any clear photo works." delay={0} />
            <StepCard num={2} title="We lift it out" desc="Our AI isolates the dress in seconds. You see it glowing alone." delay={0.08} />
            <StepCard num={3} title="Add your photo" desc="One full-body shot, facing the camera. Just you." delay={0.16} />
            <StepCard num={4} title="See yourself in it" desc="A realistic preview so you can decide before you buy." delay={0.24} />
          </div>
        </div>
      </section>

      {/* ── Showcase ─────────────────────────────────────────────── */}
      <section
        id="showcase"
        className="py-24 md:py-32 bg-[var(--ice-100)] px-4"
        aria-labelledby="showcase-heading"
      >
        <div className="max-w-3xl mx-auto space-y-8">
          <FadeRise className="text-center space-y-4">
            <h2
              id="showcase-heading"
              className="font-display font-semibold text-[var(--ink-900)]"
              style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
            >
              See the difference
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {['Wedding guest', 'Evening', 'Everyday'].map((label) => (
                <Chip key={label} label={label} variant="ice" />
              ))}
            </div>
          </FadeRise>

          <FadeRise delay={0.1}>
            <FX8BeforeAfterSlider
              beforeSrc=""
              afterSrc=""
              beforeAlt="Dress alone on a mannequin"
              afterAlt="You wearing the dress"
              className="max-w-md mx-auto"
            />
          </FadeRise>

          <FadeRise delay={0.2} className="flex justify-center">
            <Link href="/try">
              <Button variant="secondary" size="lg" leftIcon={<ArrowRight size={18} />}>
                Try your own
              </Button>
            </Link>
          </FadeRise>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 bg-[var(--pearl-50)] px-4" aria-labelledby="features-heading">
        <div className="max-w-4xl mx-auto space-y-12">
          <FadeRise className="text-center">
            <h2
              id="features-heading"
              className="font-display font-semibold text-[var(--ink-900)]"
              style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
            >
              Built for real decisions
            </h2>
          </FadeRise>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: <Shirt size={28} className="text-[var(--blue-600)]" aria-hidden="true" />, title: 'Works with worn dresses', desc: 'From anyone — model, friend, social post. We lift the dress, not the person.' },
              { icon: <BookMarked size={28} className="text-[var(--blue-600)]" aria-hidden="true" />, title: 'Your wardrobe, saved', desc: 'Lifted dresses live in your wardrobe. Try them again any time.' },
              { icon: <Users size={28} className="text-[var(--blue-600)]" aria-hidden="true" />, title: 'Compare and ask friends', desc: 'Share a shortlist link. Friends vote on which dress is the one.' },
            ].map(({ icon, title, desc }, i) => (
              <FadeRise key={title} delay={i * 0.1}>
                <GlassCard variant="light" radius="24" className="flex flex-col gap-3 h-full">
                  <div className="w-12 h-12 rounded-[16px] bg-[var(--ice-100)] flex items-center justify-center">
                    {icon}
                  </div>
                  <h3 className="font-display text-xl font-semibold text-[var(--ink-900)]">{title}</h3>
                  <p className="text-[14px] text-[var(--ink-500)] leading-relaxed">{desc}</p>
                </GlassCard>
              </FadeRise>
            ))}
          </div>
        </div>
      </section>

      {/* ── Privacy band ─────────────────────────────────────────── */}
      <section
        className="py-20 bg-[var(--navy-900)] text-white px-4"
        aria-labelledby="privacy-heading"
      >
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <FadeRise>
            <h2
              id="privacy-heading"
              className="font-display font-semibold"
              style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
            >
              Your photos are yours.
            </h2>
          </FadeRise>
          <FadeRise delay={0.1}>
            <ul className="flex flex-col sm:flex-row items-center justify-center gap-6 text-[15px] font-semibold text-white/90">
              {[
                'Photos are private by default',
                'Dress lifted on your device',
                'Delete everything in one click',
              ].map((text) => (
                <li key={text} className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-[var(--sky-400)] flex-shrink-0" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          </FadeRise>
          <FadeRise delay={0.2}>
            <Link href="/privacy">
              <Button
                variant="secondary"
                size="md"
                className="border-white/40 text-white hover:bg-white/10 hover:border-white/70"
              >
                How we handle photos
              </Button>
            </Link>
          </FadeRise>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section
        id="faq"
        className="py-24 md:py-32 bg-[var(--pearl-50)] px-4"
        aria-labelledby="faq-heading"
      >
        <div className="max-w-2xl mx-auto space-y-8">
          <FadeRise className="text-center">
            <h2
              id="faq-heading"
              className="font-display font-semibold text-[var(--ink-900)]"
              style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
            >
              Questions
            </h2>
          </FadeRise>
          <FadeRise delay={0.05}>
            <FaqAccordion items={FAQ_ITEMS} />
          </FadeRise>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section
        className="py-24 px-4 text-white text-center"
        style={{ background: 'var(--grad-primary)' }}
        aria-labelledby="cta-heading"
      >
        <div className="max-w-xl mx-auto space-y-6">
          <FadeRise>
            <h2
              id="cta-heading"
              className="font-display font-semibold"
              style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
            >
              Find your dress.
            </h2>
          </FadeRise>
          <FadeRise delay={0.1}>
            <Link href="/try">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-[var(--blue-700)] border-transparent hover:bg-[var(--ice-100)]"
              >
                Try it free
              </Button>
            </Link>
          </FadeRise>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-[var(--navy-950)] text-white py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-white/60">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--sky-400)]" aria-hidden="true" />
            <span className="font-display text-[18px] font-semibold text-white">Mirror Moment</span>
          </div>
          <nav aria-label="Footer navigation" className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sky-400)] rounded">
              Privacy
            </Link>
            <a href="mailto:hello@mirrormoment.app" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sky-400)] rounded">
              Contact
            </a>
          </nav>
          <p>Built with the YouCam API · 2026</p>
        </div>
      </footer>
    </>
  );
}
