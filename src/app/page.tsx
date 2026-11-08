'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, useReducedMotion } from 'framer-motion';
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

function HeroSilkArt() {
  return (
    <div className="landing-hero-art" aria-hidden="true">
      <svg className="landing-hero-ribbons" viewBox="0 0 1440 900" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path className="landing-ribbon-glow" d="M-120 650C170 440 330 805 625 570S1010 155 1550 335" />
        <path className="landing-ribbon landing-ribbon--one" d="M-120 650C170 440 330 805 625 570S1010 155 1550 335" />
        <path className="landing-ribbon landing-ribbon--two" d="M-150 285C180 500 340 145 710 350S1110 780 1540 570" />
        <path className="landing-ribbon-highlight" d="M-150 285C180 500 340 145 710 350S1110 780 1540 570" />
      </svg>
      <span className="landing-bubble landing-bubble--one" />
      <span className="landing-bubble landing-bubble--two" />
      <span className="landing-bubble landing-bubble--three" />
      <span className="landing-bubble landing-bubble--four" />
      <span className="landing-art-spark landing-art-spark--one">✦</span>
      <span className="landing-art-spark landing-art-spark--two">✧</span>
    </div>
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
  category,
  label,
  image,
  alt,
  delay,
}: {
  category: string;
  label: string;
  image: string;
  alt: string;
  delay: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease }}
      style={{
        // Continuous oscillation
        animation: reduceMotion ? 'none' : `floatY${delay * 10 | 0} 4s ease-in-out infinite`,
      }}
    >
      <GlassCard
        variant="light"
        radius="24"
        className="group w-[140px] md:w-[160px] flex flex-col overflow-hidden p-0"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--ice-100)]">
          <Image src={image} alt={alt} fill sizes="(max-width: 768px) 140px, 160px" className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none" />
        </div>
        <div className="px-3 py-2">
          <p className="text-[11px] font-semibold text-[var(--blue-700)] uppercase tracking-wider">{category}</p>
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
    <main className="landing-theme min-h-screen bg-[var(--white)] text-[var(--ink-900)]">
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
        <section className="min-h-[calc(100vh-72px)] flex flex-col items-center justify-center px-4 py-20 text-center relative isolate">
          <HeroSilkArt />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="relative z-10 flex flex-col items-center gap-5 max-w-[680px]"
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
              <Link href="/login">
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
            <HeroCard category="Fashion" label="A dress for the moment" image="/garments/garment_emerald_slip.jpg" alt="Model in a flowing red occasion dress" delay={0.3} />
            <HeroCard category="Accessories" label="The finishing touch" image="/samples/bag-crossbody.jpg" alt="Crossbody bag styling sample" delay={0.5} />
            <HeroCard category="Beauty" label="A fresh point of view" image="/samples/portrait-eyecolor.jpg" alt="Portrait showing a blue eye colour preview" delay={0.7} />
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
              Style the whole look
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {['Wedding guest', 'Evening', 'Everyday'].map((label) => (
                <Chip key={label} label={label} variant="ice" />
              ))}
            </div>
          </FadeRise>

          <FadeRise delay={0.1}>
            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
              {[
                { image: '/garments/garment_gold_gown.jpg', alt: 'Model wearing a plum evening gown', title: 'Occasion outfits', detail: 'See how a new silhouette could feel.' },
                { image: '/samples/earring-gold-drop.jpg', alt: 'Gold drop earrings on a display stand', title: 'Finishing details', detail: 'Bring accessories into the picture.' },
                { image: '/samples/hair-curly.jpg', alt: 'Curly hairstyle sample', title: 'Beauty changes', detail: 'Explore hair and beauty together.' },
              ].map((item) => (
                <article key={item.title} className="group overflow-hidden rounded-[24px] border border-[var(--line)] bg-white shadow-[var(--shadow-soft)] transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:transform-none">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image src={item.image} alt={item.alt} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none" />
                  </div>
                  <div className="p-5 text-left">
                    <h3 className="font-display text-2xl text-[var(--ink-900)]">{item.title}</h3>
                    <p className="mt-1 text-sm text-[var(--ink-500)]">{item.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </FadeRise>

          <FadeRise delay={0.2} className="flex justify-center">
            <Link href="/login">
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
        className="py-20 bg-[var(--blue-700)] text-white px-4"
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
            <Link href="/login">
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
      <footer className="bg-[var(--blue-700)] text-white py-10 px-4">
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
    </main>
  );
}
