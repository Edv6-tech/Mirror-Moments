'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ChevronDown,
  Shirt,
  Scissors,
  Palette,
  Footprints,
  Eye,
  Gem,
} from 'lucide-react';
import clsx from 'clsx';
import FX7TiltCard from '@/components/effects/FX7TiltCard';

// ── Categories (Strictly Lucide icons - ZERO emojis) ─────────────────────────
const CATEGORIES = [
  { id: 'all',      label: 'All',      icon: Sparkles },
  { id: 'dresses',  label: 'Dress',    icon: Shirt },
  { id: 'hair',     label: 'Hair',     icon: Scissors },
  { id: 'makeup',   label: 'Makeup',   icon: Palette },
  { id: 'shoes',    label: 'Shoes',    icon: Footprints },
  { id: 'bags',     label: 'Bags',     icon: ShoppingBag },
  { id: 'nails',    label: 'Nails',    icon: Sparkles },
  { id: 'eyes',     label: 'Eye Color',icon: Eye },
  { id: 'jewels',   label: 'Jewelry',  icon: Gem },
];

// ── Premium Shades Pills (Matching reference picture) ────────────────────────
const PREMIUM_SHADES = [
  {
    title: 'Dress Try-On',
    action: 'Try a sample',
    bg: 'bg-[#F9C3C6]',
    text: 'text-[#8A1A24]',
    btnBg: 'bg-[#EA384D] text-white',
    img: '/garments/garment_emerald_slip.jpg',
    alt: 'Model wearing an emerald evening dress',
    href: '/app/studio',
  },
  {
    title: 'Hair Studio',
    action: 'Explore styles',
    bg: 'bg-[#FEE4A6]',
    text: 'text-[#7D5200]',
    btnBg: 'bg-[#D97706] text-white',
    img: '/garments/garment_emerald_slip.jpg',
    alt: 'Portrait featuring sleek long black hair',
    href: '/app/studio?mode=hair',
  },
  {
    title: 'Eye Colour',
    action: 'Try lens colours',
    bg: 'bg-[#E3E8EF]',
    text: 'text-[#2D3748]',
    btnBg: 'bg-[#4B5563] text-white',
    img: '/samples/portrait-eyecolor.jpg',
    alt: 'Close-up portrait of a woman with clear blue eyes',
    href: '/app/eye-color',
  },
  {
    title: 'My Wardrobe',
    action: 'View saved looks',
    bg: 'bg-[#DCCAC1]',
    text: 'text-[#5C3F34]',
    btnBg: 'bg-[#7C5040] text-white',
    img: '/garments/garment_olive_overshirt.jpg',
    alt: 'Clothing rack with garments in a wardrobe',
    href: '/app/wardrobe',
  },
];

// ── Featured try-on studios ─────────────────────────────────────────────────
const CLOTHES_ITEMS = [
  {
    id: 'dress-try-on',
    title: 'Dress Try-On',
    tag: 'CLOTHING',
    desc: 'Lift a dress from a photo, then preview it on you.',
    leftLabel: 'Choose a sample',
    studio: 'Upload or sample',
    href: '/app/studio',
    img: '/garments/garment_emerald_slip.jpg',
    alt: 'Model wearing an emerald evening dress',
    icon: Shirt,
  },
  {
    id: 'makeup-studio',
    title: 'Makeup Studio',
    tag: 'BEAUTY',
    desc: 'Preview a curated makeup look on your photo.',
    leftLabel: '6 curated looks',
    studio: 'Choose a look',
    href: '/app/makeup',
    img: '/hero-model.png',
    alt: 'Close-up portrait for a makeup try-on preview',
    icon: Palette,
  },
  {
    id: 'hair-studio',
    title: 'Hair Try-On',
    tag: 'HAIR',
    desc: 'Use a hairstyle reference to explore a new look.',
    leftLabel: 'Add a reference',
    studio: 'Add a reference',
    href: '/app/studio?mode=hair',
    img: '/samples/hair-curly.jpg',
    alt: 'Woman with voluminous curly hair for hairstyle inspiration',
    icon: Scissors,
  },
  {
    id: 'shoe-studio',
    title: 'Shoes Try-On',
    tag: 'FOOTWEAR',
    desc: 'Preview shoes alongside your outfit photo.',
    leftLabel: 'Choose a style',
    studio: 'Choose a style',
    href: '/app/studio?mode=shoes',
    img: '/samples/shoes-heels.jpg',
    alt: 'White pointed-toe stiletto heels',
    icon: Footprints,
  },
  {
    id: 'bag-studio',
    title: 'Bag Try-On',
    tag: 'ACCESSORIES',
    desc: 'Preview a bag style with your look.',
    leftLabel: 'Choose a style',
    studio: 'Choose a style',
    href: '/app/studio?mode=bag',
    img: '/samples/bag-tote.jpg',
    alt: 'Beige leather handbag with gold hardware on a light surface',
    icon: ShoppingBag,
  },
  {
    id: 'nail-studio',
    title: 'Nail Studio',
    tag: 'NAILS',
    desc: 'Try polish colours, textures and press-on shapes.',
    leftLabel: 'Pick a finish',
    studio: 'Choose a finish',
    href: '/app/nails',
    img: '/samples/shoes-sneakers.jpg',
    alt: 'Glossy manicure detail for nail colour inspiration',
    icon: Sparkles,
  },
  {
    id: 'eye-colour',
    title: 'Eye Colour Lens',
    tag: 'BEAUTY',
    desc: 'Preview lens colours on a photo of yourself.',
    leftLabel: 'Pick a lens',
    studio: 'Pick a colour',
    href: '/app/eye-color',
    img: '/samples/portrait-eyecolor.jpg',
    alt: 'Close-up portrait of a woman with clear blue eyes',
    icon: Eye,
  },
  {
    id: 'earring-studio',
    title: 'Earring Try-On',
    tag: 'JEWELRY',
    desc: 'Compare earring styles on your photo.',
    leftLabel: 'Compare styles',
    studio: 'Choose a style',
    href: '/app/earring',
    img: '/samples/earring-gold-drop.jpg',
    alt: 'Polished gold and diamond drop earrings on a white stand',
    icon: Gem,
  },
];

// ── Virtual Try-On Studios Quick Access ──────────────────────────────────────
const TRYON_STUDIOS = [
  { name: 'Full Look Studio', href: '/app/full-look', icon: Sparkles, label: 'Head to toe' },
  { name: 'Dress Try-On', href: '/app/studio', icon: Shirt, label: 'Flagship' },
  { name: 'Makeup Studio', href: '/app/makeup', icon: Palette, label: 'Beauty' },
  { name: 'Hair Studio', href: '/app/studio?mode=hair', icon: Scissors, label: 'Styling' },
  { name: 'Earrings VTO', href: '/app/earring', icon: Gem, label: 'Jewelry' },
  { name: 'Ring Try-On', href: '/app/ring', icon: Gem, label: 'Jewelry' },
  { name: 'Necklace VTO', href: '/app/necklace', icon: Gem, label: 'Jewelry' },
  { name: 'Eye Color Lens', href: '/app/eye-color', icon: Eye, label: 'Beauty' },
  { name: 'Nail Studio', href: '/app/nails', icon: Sparkles, label: 'Nails' },
  { name: 'Shoes Try-On', href: '/app/studio?mode=shoes', icon: Footprints, label: 'Footwear' },
  { name: 'Bag Try-On', href: '/app/studio?mode=bag', icon: ShoppingBag, label: 'Accessories' },
];

export default function DashboardPage() {
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-slate-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">

        {/* ════════════════════════════════════════════════════════════════════
            HERO BANNER — EXACT WHITE & RED RECREATION FROM REFERENCE
            ════════════════════════════════════════════════════════════════════ */}
        <section className="relative rounded-[32px] sm:rounded-[40px] overflow-hidden bg-gradient-to-br from-[#FF4D5A] via-[#EA384D] to-[#D92238] text-white p-6 sm:p-10 lg:p-12 shadow-2xl shadow-[#EA384D]/25">

          {/* Subtle background circles for organic depth */}
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 w-[550px] h-[550px] rounded-full bg-white/10 blur-3xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -left-24 w-[350px] h-[350px] rounded-full bg-black/10 blur-2xl pointer-events-none"
          />

          {/* Banner Mini-Navbar */}
          <div className="relative z-10 flex items-center justify-between pb-8 sm:pb-12 border-b border-white/15">
            {/* Logo */}
            <Link href="/app" className="flex items-center gap-2.5 group">
              <span className="w-8 h-8 rounded-full bg-white text-[#EA384D] flex items-center justify-center shadow-md font-bold text-sm">
                M
              </span>
              <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
                Mirror Moment
              </span>
            </Link>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-wide text-white/90">
              <Link href="/app" className="text-white border-b-2 border-white pb-0.5">
                Home
              </Link>
              <Link href="/app/studio" className="hover:text-white transition-colors">
                Try-On Studio
              </Link>
              <Link href="/app/wardrobe" className="hover:text-white transition-colors">
                Wardrobe
              </Link>
              <Link href="/app/looks" className="hover:text-white transition-colors">
                Saved Looks
              </Link>
              <Link href="/app/settings" className="hover:text-white transition-colors">
                Settings
              </Link>
            </nav>

            {/* Cart / Action Icon */}
            <div className="flex items-center gap-3">
              <Link
                href="/app/wardrobe"
                aria-label="Open your wardrobe"
                className="relative w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center transition-colors"
              >
                <ShoppingBag size={16} className="text-white" />
              </Link>
            </div>
          </div>

          {/* Banner Main Grid */}
          <div className="relative z-10 pt-8 sm:pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left Column: Headline, CTAs, Customer Badge */}
            <div className="lg:col-span-7 space-y-6 text-left">

              {/* Badge */}
              <div className="inline-block px-3.5 py-1 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm text-xs font-medium text-white/95">
                Clothing, beauty and accessories — ready to try on
              </div>

              {/* Display Headline */}
              <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08]">
                See the look<br />
                on you.
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-white/90 max-w-lg leading-relaxed font-normal">
                Choose a clothing or beauty studio, upload a photo or start from a sample, and preview the style on your own image.
              </p>

              {/* Select Category Pill Bar */}
              <div className="max-w-md bg-white/20 backdrop-blur-md border border-white/30 rounded-full p-1.5 pl-5 pr-1.5 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2 text-xs font-medium text-white/90">
                  <span>Choose a studio</span>
                  <ChevronDown size={14} className="text-white/80" />
                </div>
                <Link href="/app/studio">
                  <button
                    type="button"
                    className="px-6 py-2.5 rounded-full bg-white text-[#EA384D] font-bold text-xs sm:text-sm hover:bg-white/95 transition-all shadow-md active:scale-95"
                  >
                    Start a try-on
                  </button>
                </Link>
              </div>

              {/* Social Proof Card */}
              <div className="inline-flex items-center gap-4 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 pr-6 shadow-md">
                {/* 3 Overlapping Avatars */}
                <div className="flex -space-x-3 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                  src="/samples/portrait-eyecolor.jpg"
                  alt="Makeup inspiration portrait"
                    className="inline-block w-10 h-10 rounded-full ring-2 ring-white object-cover"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/samples/earring-gold-drop.jpg"
                    alt="Gold earrings preview"
                    className="inline-block w-10 h-10 rounded-full ring-2 ring-white object-cover"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/samples/portrait-eyecolor.jpg"
                    alt="Blue-eyed portrait preview"
                    className="inline-block w-10 h-10 rounded-full ring-2 ring-white object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">10 virtual try-on studios</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex text-amber-300" aria-hidden="true">
                      {[...Array(3)].map((_, i) => (
                        <Sparkles key={i} size={11} />
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold text-white/90">Clothing · beauty · accessories</span>
                  </div>
                </div>
              </div>

              {/* Bottom Member Link */}
              <div className="pt-2 text-xs font-medium text-white/80">
                <span>Want to save your looks? </span>
                <Link
                  href="/signup"
                  className="font-bold text-white underline underline-offset-4 hover:text-white/90"
                >
                  Create an account
                </Link>
              </div>
            </div>

            {/* Right Column: Sample outfit photo on Halo Backdrop */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
              <FX7TiltCard maxDeg={8} className="cursor-pointer">
                <div className="relative w-[280px] h-[340px] sm:w-[340px] sm:h-[420px] lg:w-[380px] lg:h-[460px] flex items-center justify-center">

                  {/* Circular Red Halo Background (matches reference) */}
                  <div className="absolute w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] lg:w-[360px] lg:h-[360px] rounded-full bg-[#FF6B76]/50 blur-sm" />

                  {/* Inner Halo Disc */}
                  <div className="absolute w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] lg:w-[340px] lg:h-[340px] rounded-full bg-gradient-to-tr from-[#FFA0A6]/40 to-white/30 border border-white/30 backdrop-blur-sm" />

                  {/* Full-length sample outfit photo */}
                  <div className="relative z-10 w-[230px] h-[290px] sm:w-[280px] sm:h-[360px] lg:w-[320px] lg:h-[410px] rounded-[32px] overflow-hidden shadow-2xl shadow-black/30 border-2 border-white/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/garments/garment_floral_blouse.jpg"
                      alt="Model wearing a soft grey outfit in a full-length sample photo"
                      className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
                    />
                    {/* Subtle bottom vignette */}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-white border border-white/30">
                        <Sparkles size={12} className="text-amber-300" />
                        <span>AI Virtual Try-On</span>
                      </div>
                    </div>
                  </div>
                </div>
              </FX7TiltCard>
            </div>
          </div>
        </section>


        {/* ════════════════════════════════════════════════════════════════════
            SECTION 2: "PREMIUM SHADES" — EXACT RECREATION FROM REFERENCE
            ════════════════════════════════════════════════════════════════════ */}
        <section className="space-y-6">
          {/* Section Divider Header with Red Ornamental Wings */}
          <div className="flex items-center justify-center gap-4">
            <span className="h-[1.5px] w-12 bg-gradient-to-r from-transparent to-[#EA384D]/60" />
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#EA384D] tracking-wide">
              Find your next look
            </h2>
            <span className="h-[1.5px] w-12 bg-gradient-to-l from-transparent to-[#EA384D]/60" />
          </div>

          {/* 4 Capsule/Pill Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PREMIUM_SHADES.map((shade) => (
              <FX7TiltCard key={shade.title} maxDeg={6}>
                <Link
                  href={shade.href}
                  className={clsx(
                    'relative h-28 rounded-full p-4 pl-6 flex items-center justify-between overflow-hidden shadow-sm hover:shadow-md transition-all border border-black/5',
                    shade.bg
                  )}
                >
                  <div className="space-y-1.5 z-10">
                    <p className={clsx('font-bold text-sm tracking-tight', shade.text)}>
                      {shade.title}
                    </p>
                    <span
                      className={clsx(
                        'inline-block px-3 py-1 rounded-full text-[10px] font-bold shadow-sm',
                        shade.btnBg
                      )}
                    >
                      {shade.action}
                    </span>
                  </div>

                  {/* Model Thumbnail */}
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shade.img}
                      alt={shade.alt}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/hero-model.png';
                      }}
                    />
                  </div>
                </Link>
              </FX7TiltCard>
            ))}
          </div>
        </section>


        {/* ════════════════════════════════════════════════════════════════════
            SECTION 3: "CATEGORY" — CLEAN WHITE & RED (ZERO EMOJIS)
            ════════════════════════════════════════════════════════════════════ */}
        <section className="space-y-6">
          {/* Section Divider Header with Red Ornamental Wings */}
          <div className="flex items-center justify-center gap-4">
            <span className="h-[1.5px] w-12 bg-gradient-to-r from-transparent to-[#EA384D]/60" />
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#EA384D] tracking-wide">
              Explore by studio
            </h2>
            <span className="h-[1.5px] w-12 bg-gradient-to-l from-transparent to-[#EA384D]/60" />
          </div>

          {/* Horizontal Category Circular Strip */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 overflow-x-auto py-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex flex-col items-center gap-2 group flex-shrink-0 focus:outline-none"
                >
                  <div
                    className={clsx(
                      'w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 border-2',
                      isActive
                        ? 'border-[#EA384D] bg-[#FFF0F2] text-[#EA384D] shadow-md scale-105'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-[#EA384D]/40 hover:text-[#EA384D] hover:bg-[#FFF5F6]'
                    )}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                  </div>
                  <span
                    className={clsx(
                      'text-xs font-bold tracking-tight transition-colors',
                      isActive ? 'text-[#EA384D]' : 'text-slate-600 group-hover:text-[#EA384D]'
                    )}
                  >
                    {cat.label}
                  </span>
                  {isActive && (
                    <span className="w-5 h-[2px] rounded-full bg-[#EA384D] -mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </section>


        {/* ════════════════════════════════════════════════════════════════════
            SECTION 4: PRODUCT TRY-ON GRID (WHITE & RED THEME)
            ════════════════════════════════════════════════════════════════════ */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                Explore Mirror Moment Studios
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Choose a studio to preview clothing, hair and beauty styles on your photo.
              </p>
            </div>
            <Link
              href="/app/studio"
              className="text-xs font-bold text-[#EA384D] hover:underline flex items-center gap-1"
            >
              <span>View all studios</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* 4-column Coral-Red Card Grid (matches reference image) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CLOTHES_ITEMS.map((item) => (
              <FX7TiltCard key={item.id} maxDeg={7} className="h-full">
                <div className="group h-full rounded-[28px] overflow-hidden bg-[#EA384D] text-white flex flex-col justify-between shadow-xl shadow-[#EA384D]/20 border border-white/20 transition-all duration-300">

                  {/* Image Container with Badges */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-white/10">
                    {item.img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.img}
                        alt={item.alt ?? item.title}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.opacity = '0';
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#FF6B76]/40 to-[#D92238]/70" aria-hidden="true">
                        <item.icon size={64} strokeWidth={1.2} className="text-white/90" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#EA384D] via-transparent to-black/20" />

                    {/* Top Tag */}
                    <span className="absolute top-3.5 left-3.5 px-2.5 py-0.5 rounded-full bg-white text-[#EA384D] font-extrabold text-[10px] tracking-wider uppercase shadow-md">
                      {item.tag}
                    </span>

                    {/* Studio pill */}
                    <span className="absolute top-3.5 right-3.5 px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white font-semibold text-[10px] border border-white/20">
                      {item.studio}
                    </span>
                  </div>

                  {/* Card Content & Action Button */}
                  <div className="p-5 pt-3 space-y-3">
                    <div>
                      <h3 className="font-display text-lg font-bold text-white tracking-tight leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-white/80 line-clamp-2 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/15">
                      <span className="font-display text-base font-bold text-white">
                        {item.leftLabel}
                      </span>
                      <Link href={item.href}>
                        <button
                          type="button"
                          className="px-4 py-1.5 rounded-full bg-white text-[#EA384D] text-xs font-bold hover:bg-white/95 transition-all shadow-md active:scale-95"
                        >
                          Open studio
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </FX7TiltCard>
            ))}
          </div>
        </section>


        {/* ════════════════════════════════════════════════════════════════════
            SECTION 5: ALL VIRTUAL TRY-ON STUDIOS (CLEAN RED & WHITE PILLS)
            ════════════════════════════════════════════════════════════════════ */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-slate-900">
              10 AI Virtual Studios
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              No app install · Photo-based previews
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {TRYON_STUDIOS.map((st) => {
              const Icon = st.icon;
              return (
                <Link
                  key={st.name}
                  href={st.href}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-[#EA384D] hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FFF0F2] text-[#EA384D] flex items-center justify-center group-hover:bg-[#EA384D] group-hover:text-white transition-colors">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-[#EA384D] transition-colors">
                      {st.name}
                    </p>
                    <span className="text-[10px] font-semibold text-slate-600 block uppercase tracking-wide">
                      {st.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
