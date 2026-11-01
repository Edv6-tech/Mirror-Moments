'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ExternalLink, Sparkles } from 'lucide-react';

const OPTIONS = [
  { id: 'dress', label: 'Dress', group: 'Outfit', href: '/app/studio', image: '/garments/garment_emerald_slip.jpg', alt: 'Model in a dress, for outfit inspiration', hint: 'Choose a dress to build around.' },
  { id: 'hair', label: 'Hair', group: 'Beauty', href: '/app/studio?mode=hair', image: '/samples/hair-curly.jpg', alt: 'Long glossy hair inspiration', hint: 'Explore a new cut or colour.' },
  { id: 'makeup', label: 'Makeup', group: 'Beauty', href: '/app/makeup', image: '/samples/portrait-eyecolor.jpg', alt: 'Makeup styling inspiration', hint: 'Try a curated beauty look.' },
  { id: 'eyes', label: 'Eye colour', group: 'Beauty', href: '/app/eye-color', image: '/samples/portrait-eyecolor.jpg', alt: 'Portrait with blue eyes', hint: 'Preview a different lens shade.' },
  { id: 'shoes', label: 'Shoes', group: 'Accessories', href: '/app/studio?mode=shoes', image: '/samples/shoes-heels.jpg', alt: 'Elegant shoes for outfit styling', hint: 'Choose footwear for the occasion.' },
  { id: 'bag', label: 'Bag', group: 'Accessories', href: '/app/studio?mode=bag', image: '/samples/bag-tote.jpg', alt: 'Structured handbag inspiration', hint: 'Try a bag alongside your outfit.' },
  { id: 'earrings', label: 'Earrings', group: 'Jewellery', href: '/app/earring', image: '/samples/earring-gold-drop.jpg', alt: 'Gold earring styling inspiration', hint: 'Frame your face with a new pair.' },
  { id: 'necklace', label: 'Necklace', group: 'Jewellery', href: '/app/necklace', image: '/samples/necklace-pendant.jpg', alt: 'Layered necklace inspiration', hint: 'Add a detail around the neckline.' },
  { id: 'ring', label: 'Ring', group: 'Jewellery', href: '/app/ring', image: '/samples/ring-solitaire.jpg', alt: 'Delicate ring styling inspiration', hint: 'Try a piece of hand jewellery.' },
  { id: 'nails', label: 'Nails', group: 'Beauty', href: '/app/nails', image: '/samples/sample-hand.jpg', alt: 'Polished manicure inspiration', hint: 'Coordinate a colour or finish.' },
];

const GROUPS = ['Outfit', 'Beauty', 'Accessories', 'Jewellery'];

export default function FullLookPage() {
  const [selected, setSelected] = useState<string[]>(['dress', 'shoes', 'bag']);
  const chosen = useMemo(() => OPTIONS.filter((option) => selected.includes(option.id)), [selected]);

  function toggleOption(id: string) {
    setSelected((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  }

  const firstStudio = chosen[0]?.href ?? '/app/studio';

  return (
    <div className="app-page-atmosphere min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="relative mb-10 overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--grad-silk-light)] p-6 shadow-[var(--shadow-soft)] sm:p-10 lg:p-14">
          <div className="relative z-10 max-w-2xl">
            <p className="app-page-kicker mb-4"><Sparkles size={14} aria-hidden="true" /> THE FULL LOOK STUDIO</p>
            <h1 className="app-page-title font-display text-4xl leading-tight text-[var(--ink-900)] sm:text-5xl lg:text-6xl">Style the whole story.</h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--ink-500)] sm:text-lg">Build a head-to-toe look by choosing the pieces you want to explore. Pick several, then open their studios and try each style on your photo.</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href={firstStudio} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-dashboard-gradient px-6 py-3 text-sm font-bold text-white shadow-[var(--shadow-glow)] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--blue-700)]">
                {chosen.length ? `Start with ${chosen[0].label}` : 'Choose your first piece'} <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <span className="text-sm text-[var(--ink-500)]">{selected.length} {selected.length === 1 ? 'studio' : 'studios'} selected</span>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-16 -top-20 hidden h-80 w-80 rounded-full bg-[var(--ice-100)] opacity-80 blur-3xl sm:block" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-40 right-24 hidden h-80 w-80 rounded-full bg-[var(--blue-500)] opacity-10 blur-3xl sm:block" aria-hidden="true" />
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
          <div className="space-y-10">
            {GROUPS.map((group) => {
              const options = OPTIONS.filter((option) => option.group === group);
              return (
                <section key={group} aria-labelledby={`group-${group.toLowerCase()}`}>
                  <div className="mb-4 flex items-end justify-between gap-4">
                    <div><p className="app-page-kicker mb-2">Choose your details</p><h2 id={`group-${group.toLowerCase()}`} className="font-display text-3xl text-[var(--ink-900)]">{group}</h2></div>
                    <span className="text-xs font-semibold text-[var(--ink-500)]">Select as many as you like</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {options.map((option) => {
                      const isSelected = selected.includes(option.id);
                      return (
                        <button key={option.id} type="button" aria-pressed={isSelected} onClick={() => toggleOption(option.id)} className={`app-full-look-option group overflow-hidden rounded-3xl border text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue-700)] ${isSelected ? 'border-[var(--blue-600)] ring-2 ring-[var(--blue-600)] shadow-[var(--shadow-lifted)]' : 'border-[var(--line)] shadow-[var(--shadow-soft)] hover:-translate-y-1 hover:border-[var(--blue-500)]'}`}>
                          <span className="relative block aspect-[16/10] overflow-hidden bg-[var(--ice-100)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={option.image} alt={option.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <span className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full shadow-md ${isSelected ? 'bg-[var(--blue-700)] text-white' : 'bg-white/90 text-[var(--ink-500)]'}`} aria-hidden="true">{isSelected ? <Check size={16} /> : <span className="text-lg leading-none">+</span>}</span>
                          </span>
                          <span className="block p-4">
                            <span className="flex items-center justify-between gap-3"><span className="font-display text-2xl text-[var(--ink-900)]">{option.label}</span><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--blue-700)]">{isSelected ? 'Selected' : 'Add'}</span></span>
                            <span className="mt-1 block text-sm leading-relaxed text-[var(--ink-500)]">{option.hint}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          <aside className="rounded-3xl border border-[var(--line)] bg-[var(--glass-light-bg)] p-5 shadow-[var(--shadow-soft)] lg:sticky lg:top-6" aria-labelledby="look-plan-title">
            <p className="app-page-kicker mb-3">Your styling session</p>
            <h2 id="look-plan-title" className="font-display text-2xl text-[var(--ink-900)]">Your look plan</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-500)]">Open each selected studio to create its preview. You can keep multiple studios open while you compare ideas.</p>
            {chosen.length ? (
              <ol className="mt-5 space-y-2">
                {chosen.map((option, index) => (
                  <li key={option.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white/70 p-3">
                    <span className="flex min-w-0 items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ice-100)] text-xs font-bold text-[var(--blue-700)]">{String(index + 1).padStart(2, '0')}</span><span className="truncate text-sm font-semibold text-[var(--ink-900)]">{option.label}</span></span>
                    <Link href={option.href} target="_blank" rel="noreferrer" aria-label={`Open ${option.label} studio in a new tab`} className="rounded-full p-2 text-[var(--blue-700)] transition-colors hover:bg-[var(--ice-100)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue-700)]"><ExternalLink size={16} aria-hidden="true" /></Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-5 rounded-2xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--ink-500)]">Choose one or more details to start your look plan.</p>
            )}
            <p className="mt-5 border-t border-[var(--line)] pt-4 text-xs leading-relaxed text-[var(--ink-500)]">Each studio creates its own preview from your photo. Save your favourites in Looks to keep them together.</p>
            <Link href="/app/looks" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--blue-700)] hover:underline">View saved looks <ArrowRight size={14} aria-hidden="true" /></Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
