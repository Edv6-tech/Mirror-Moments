'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wand2,
  Shirt,
  Image as ImageIcon,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/studio', label: 'Studio', icon: Wand2 },
  { href: '/app/full-look', label: 'Full Look', icon: Sparkles },
  { href: '/app/wardrobe', label: 'Wardrobe', icon: Shirt },
  { href: '/app/looks', label: 'Looks', icon: ImageIcon },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--pearl-50)] text-[var(--ink-900)] flex flex-col lg:flex-row">
      {/* ── Desktop Sidebar (264px) ── */}
      <aside
        className="hidden lg:flex w-[264px] flex-col justify-between shrink-0 p-6 fixed inset-y-0 left-0 z-40 text-white select-none"
        style={{
          background: 'linear-gradient(180deg, var(--navy-900) 0%, var(--navy-950) 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="space-y-8">
          {/* Brand Wordmark */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-8 h-8 rounded-full bg-dashboard-gradient flex items-center justify-center shadow-[var(--shadow-glow)]">
              <Sparkles size={16} className="text-white" />
            </span>
            <span className="font-display text-2xl font-semibold tracking-wide text-white group-hover:text-[var(--sky-400)] transition-colors">
              Mirror<span className="text-[var(--sky-400)]"> Moment</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5" aria-label="Sidebar navigation">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== '/app' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    'relative flex items-center gap-3.5 h-[48px] px-4 rounded-xl text-sm font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-white/12 text-white shadow-[0_0_20px_rgba(56,189,248,0.25)]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[var(--sky-400)] shadow-[0_0_8px_var(--sky-400)]"
                      aria-hidden="true"
                    />
                  )}
                  <Icon size={20} className={clsx(isActive ? 'text-[var(--sky-400)]' : 'text-white/60')} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom card & User Profile */}
        <div className="space-y-4 pt-6 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-white/[0.06] backdrop-blur border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-white/70">Tries left today</span>
              <span className="text-[var(--sky-400)] font-mono">10 / 10</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[var(--blue-500)] to-[var(--sky-400)] h-full w-full rounded-full shadow-[0_0_8px_var(--sky-400)]"
              />
            </div>
            <p className="text-[11px] text-white/50">Resets daily at 00:00 UTC</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-dashboard-gradient border border-white/20 flex items-center justify-center font-display font-bold text-sm text-white">
                M
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white leading-tight">Guest User</p>
                <p className="text-[10px] text-white/50">Free Tier</p>
              </div>
            </div>
            <Link
              href="/login"
              title="Log out"
              className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut size={16} />
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 lg:pl-[264px] flex flex-col min-h-screen">
        <main className="app-dashboard-theme flex-1 pb-[84px] lg:pb-12">
          {children}
          <PageInspiration pathname={pathname} />
        </main>

        {/* ── Mobile & Tablet Bottom Navigation (< 1024px) ── */}
        <nav
          aria-label="Mobile navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 z-50 glass-surface-light border-t border-[var(--line)] safe-area-inset-bottom"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center justify-around h-[72px] max-w-md mx-auto px-2 relative">
            {NAV_ITEMS.map(({ href, label, icon: Icon }, index) => {
              const isCenter = index === 1; // Studio
              const isActive = pathname === href || (href !== '/app' && pathname.startsWith(href));

              if (isCenter) {
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-label="Studio (Try-on)"
                    className="relative -top-5 flex flex-col items-center group focus-visible:outline-none"
                  >
                    <span className="w-14 h-14 rounded-full bg-dashboard-gradient text-white shadow-[var(--shadow-glow)] flex items-center justify-center transform active:scale-95 group-hover:scale-105 transition-all">
                      <Wand2 size={24} />
                    </span>
                    <span className="text-[11px] font-semibold mt-1 text-[var(--blue-600)]">
                      Studio
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200',
                    isActive
                      ? 'text-[var(--blue-600)]'
                      : 'text-[var(--ink-500)] hover:text-[var(--ink-900)]'
                  )}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span
                    className={clsx(
                      'text-[10px] font-semibold tracking-wide',
                      isActive ? 'text-[var(--blue-600)]' : 'text-[var(--ink-500)]'
                    )}
                  >
                    {label}
                  </span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-[var(--blue-600)]" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

const INSPIRATION: Record<string, { title: string; note: string; cards: { label: string; detail: string; href: string; image: string; alt: string }[] }> = {
  '/app': { title: 'A little inspiration for your next look', note: 'Explore a style, start with a sample, and make it your own.', cards: [
    { label: 'Find your next outfit', detail: 'Preview dresses and build a wardrobe you love.', href: '/app/studio', image: '/garments/garment_emerald_slip.jpg', alt: 'Editorial fashion outfit inspiration' },
    { label: 'Add a finishing touch', detail: 'Try a new beauty or accessory detail.', href: '/app/earring', image: '/samples/earring-gold-drop.jpg', alt: 'Delicate earring styling inspiration' },
    { label: 'See colour differently', detail: 'Explore a fresh eye colour with a sample portrait.', href: '/app/eye-color', image: '/samples/portrait-eyecolor.jpg', alt: 'Blue-eyed beauty portrait' },
  ] },
  '/app/studio': { title: 'Make the look your own', note: 'Start with a ready-made sample or bring a photo of your own.', cards: [
    { label: 'Hair, your way', detail: 'Preview a different cut or colour on a sample.', href: '/app/studio?mode=hair', image: '/samples/hair-curly.jpg', alt: 'Glossy hairstyle inspiration' },
    { label: 'The perfect bag', detail: 'Try a bag with your outfit before you commit.', href: '/app/studio?mode=bag', image: '/samples/bag-tote.jpg', alt: 'Structured handbag inspiration' },
    { label: 'Save your favourites', detail: 'Keep your best combinations together.', href: '/app/looks', image: '/samples/shoes-heels.jpg', alt: 'Polished fashion look inspiration' },
  ] },
  '/app/full-look': { title: 'Build a look from head to toe', note: 'Choose several studios and explore each part of your look.', cards: [
    { label: 'Start with an outfit', detail: 'Try a dress, then build around it.', href: '/app/studio', image: '/garments/garment_emerald_slip.jpg', alt: 'Fashion outfit inspiration' },
    { label: 'Add your finishing touches', detail: 'Explore beauty styles and accessories.', href: '/app/earring', image: '/samples/earring-gold-drop.jpg', alt: 'Earring styling inspiration' },
    { label: 'Keep your favourites', detail: 'Save looks to revisit in your gallery.', href: '/app/looks', image: '/samples/shoes-heels.jpg', alt: 'Complete look inspiration' },
  ] },
  '/app/wardrobe': { title: 'Style what is already yours', note: 'Build an outfit around pieces you have saved.', cards: [
    { label: 'Try a new piece', detail: 'See how a dress might look before adding it.', href: '/app/studio', image: '/garments/garment_emerald_slip.jpg', alt: 'Dress styling inspiration' },
    { label: 'Create a complete look', detail: 'Bring clothing and accessories together.', href: '/app/looks', image: '/samples/shoes-heels.jpg', alt: 'Complete outfit inspiration' },
    { label: 'Finish with a detail', detail: 'Explore earrings that complement your style.', href: '/app/earring', image: '/samples/earring-gold-drop.jpg', alt: 'Earring detail inspiration' },
  ] },
  '/app/looks': { title: 'Your next favourite combination', note: 'Small changes can give a familiar outfit a new feel.', cards: [
    { label: 'Try a new dress', detail: 'Preview a piece with your own photo or a sample.', href: '/app/studio', image: '/garments/garment_emerald_slip.jpg', alt: 'Fashion look inspiration' },
    { label: 'Change the mood', detail: 'Explore a soft new eye colour.', href: '/app/eye-color', image: '/samples/portrait-eyecolor.jpg', alt: 'Beauty portrait with blue eyes' },
    { label: 'Add a little shine', detail: 'Find earrings to finish the look.', href: '/app/earring', image: '/samples/earring-gold-drop.jpg', alt: 'Earrings as a finishing detail' },
  ] },
  '/app/settings': { title: 'Your style space, your way', note: 'Your photos stay private. You control your preferences and saved looks.', cards: [
    { label: 'Your wardrobe', detail: 'Keep track of the pieces you have tried.', href: '/app/wardrobe', image: '/garments/garment_emerald_slip.jpg', alt: 'Wardrobe styling inspiration' },
    { label: 'Your saved looks', detail: 'Return to combinations you want to remember.', href: '/app/looks', image: '/samples/shoes-heels.jpg', alt: 'Saved outfit inspiration' },
    { label: 'Try something new', detail: 'Explore styles with a sample photo.', href: '/app/studio', image: '/samples/bag-tote.jpg', alt: 'Fashion accessory inspiration' },
  ] },
};

const BEAUTY_PATHWAYS: Record<string, { label: string; detail: string; href: string; image: string; alt: string }[]> = {
  '/app/eye-color': [
    { label: 'Try a hairstyle', detail: 'Pair your eye look with a new hair style.', href: '/app/studio?mode=hair', image: '/samples/hair-curly.jpg', alt: 'Hair styling inspiration' },
    { label: 'Add earrings', detail: 'Frame your face with a little shine.', href: '/app/earring', image: '/samples/earring-gold-drop.jpg', alt: 'Earring styling inspiration' },
    { label: 'Explore makeup', detail: 'Bring the whole beauty look together.', href: '/app/makeup', image: '/samples/portrait-eyecolor.jpg', alt: 'Makeup palette inspiration' },
  ],
  '/app/makeup': [
    { label: 'Find your eye colour', detail: 'See a different eye shade on a sample portrait.', href: '/app/eye-color', image: '/samples/portrait-eyecolor.jpg', alt: 'Blue-eyed beauty portrait' },
    { label: 'Finish with nails', detail: 'Coordinate a nail colour with your makeup.', href: '/app/nails', image: '/samples/sample-hand.jpg', alt: 'Polished manicure inspiration' },
    { label: 'Try a new hairstyle', detail: 'Complete your look with a fresh style.', href: '/app/studio?mode=hair', image: '/samples/hair-curly.jpg', alt: 'Hair styling inspiration' },
  ],
  '/app/nails': [
    { label: 'Explore makeup', detail: 'Match your manicure to a makeup look.', href: '/app/makeup', image: '/samples/portrait-eyecolor.jpg', alt: 'Makeup palette inspiration' },
    { label: 'Try rings', detail: 'See how a ring pairs with your nail colour.', href: '/app/ring', image: '/samples/ring-solitaire.jpg', alt: 'Ring styling inspiration' },
    { label: 'Style a new outfit', detail: 'Bring your beauty choices into a full look.', href: '/app/studio', image: '/garments/garment_emerald_slip.jpg', alt: 'Fashion outfit inspiration' },
  ],
  '/app/earring': [
    { label: 'Pair it with a necklace', detail: 'Explore a coordinated jewellery set.', href: '/app/necklace', image: '/samples/necklace-pendant.jpg', alt: 'Layered necklace inspiration' },
    { label: 'Try a new makeup look', detail: 'See earrings alongside a beauty look.', href: '/app/makeup', image: '/samples/portrait-eyecolor.jpg', alt: 'Makeup inspiration' },
    { label: 'Explore eye colours', detail: 'Find a shade that complements your choice.', href: '/app/eye-color', image: '/samples/portrait-eyecolor.jpg', alt: 'Blue-eyed beauty portrait' },
  ],
  '/app/ring': [
    { label: 'Coordinate your jewellery', detail: 'Pair your ring with a necklace.', href: '/app/necklace', image: '/samples/necklace-pendant.jpg', alt: 'Necklace jewellery inspiration' },
    { label: 'Add earrings', detail: 'Complete a matching jewellery set.', href: '/app/earring', image: '/samples/earring-gold-drop.jpg', alt: 'Earring styling inspiration' },
    { label: 'Choose a nail colour', detail: 'Preview a manicure beside your ring.', href: '/app/nails', image: '/samples/sample-hand.jpg', alt: 'Manicure inspiration' },
  ],
  '/app/necklace': [
    { label: 'Find matching earrings', detail: 'Bring your jewellery together.', href: '/app/earring', image: '/samples/earring-gold-drop.jpg', alt: 'Earring styling inspiration' },
    { label: 'Try a ring', detail: 'Add another detail to your set.', href: '/app/ring', image: '/samples/ring-solitaire.jpg', alt: 'Ring styling inspiration' },
    { label: 'Explore makeup', detail: 'Pair jewellery with a fresh beauty look.', href: '/app/makeup', image: '/samples/portrait-eyecolor.jpg', alt: 'Makeup styling inspiration' },
  ],
};

function PageInspiration({ pathname }: { pathname: string }) {
  const page = INSPIRATION[pathname];
  const cards = page?.cards ?? BEAUTY_PATHWAYS[pathname];
  if (!cards) return null;
  const title = page?.title ?? 'Complete the look';
  const note = page?.note ?? 'Explore a complementary style and make the result your own.';

  return (
    <section className="app-inspiration mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16" aria-labelledby="inspiration-heading">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div><p className="app-page-kicker mb-3">A little style inspiration</p><h2 id="inspiration-heading" className="font-display text-3xl sm:text-4xl text-[var(--ink-900)]">{title}</h2></div>
        <p className="max-w-sm text-sm leading-relaxed text-[var(--ink-500)]">{note}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => (
          <Link key={card.href + card.label} href={card.href} className="app-inspiration-card group" style={{ ['--card-index' as string]: index } as React.CSSProperties}>
            <div className="app-inspiration-image-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.image} alt={card.alt} loading="lazy" className="app-inspiration-image" />
              <span className="app-inspiration-number" aria-hidden="true">0{index + 1}</span>
            </div>
            <div className="p-5"><h3 className="font-display text-2xl text-[var(--ink-900)] group-hover:text-[var(--blue-700)] transition-colors">{card.label}</h3><p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-500)]">{card.detail}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold tracking-wide text-[var(--blue-700)]">EXPLORE <span aria-hidden="true">↗</span></span></div>
          </Link>
        ))}
      </div>
    </section>
  );
}
