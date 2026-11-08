import Link from 'next/link';
import { ArrowRight, Eye, Gem, Heart, ScanFace, Scissors, Sparkles } from 'lucide-react';
import CombinedLookBuilder from '@/components/full-look/CombinedLookBuilder';

const OTHER_STUDIOS = [
  { label: 'Hair', href: '/app/studio?mode=hair', image: '/samples/hair-curly.jpg', icon: Scissors },
  { label: 'Eye colour', href: '/app/eye-color', image: '/samples/portrait-eyecolor.jpg', icon: Eye },
  { label: 'Earrings', href: '/app/earring', image: '/samples/earring-gold-drop.jpg', icon: Sparkles },
  { label: 'Necklace', href: '/app/necklace', image: '/samples/necklace-pendant.jpg', icon: Gem },
  { label: 'Rings', href: '/app/ring', image: '/samples/ring-solitaire.jpg', icon: Heart },
  { label: 'Nails', href: '/app/nails', image: '/samples/sample-hand.jpg', icon: ScanFace },
];

export default function FullLookPage() {
  return (
    <div className="app-page-atmosphere min-h-screen">
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <CombinedLookBuilder />

        <section aria-labelledby="more-studios-title">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="app-page-kicker mb-2">Keep styling</p>
              <h2 id="more-studios-title" className="font-display text-3xl text-[var(--ink-900)]">More ways to finish the look</h2>
            </div>
            <Link href="/app" className="hidden items-center gap-2 text-sm font-bold text-[var(--blue-700)] hover:underline sm:inline-flex">All studios <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OTHER_STUDIOS.map(({ label, href, image, icon: Icon }) => (
              <Link key={label} href={href} className="group flex items-center gap-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--glass-light-bg)] p-3 shadow-[var(--shadow-soft)] motion-safe:transition-transform motion-safe:hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue-700)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" aria-hidden="true" className="h-16 w-16 rounded-xl object-cover" loading="lazy" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-bold text-[var(--ink-900)]"><Icon size={15} className="text-[var(--blue-700)]" aria-hidden="true" />{label}</span>
                  <span className="mt-1 block text-xs text-[var(--ink-500)]">Open its try-on studio</span>
                </span>
                <ArrowRight size={16} className="text-[var(--blue-700)] motion-safe:transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            ))}
          </div>
          <Link href="/app" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--blue-700)] hover:underline sm:hidden">All studios <ArrowRight size={15} aria-hidden="true" /></Link>
        </section>
      </div>
    </div>
  );
}
