import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, EyeOff, Trash2, ArrowLeft } from 'lucide-react';
import { GlassCard, Button } from '@/components/ui';

export const metadata = {
  title: 'Privacy Policy — Mirror Moment',
  description: 'How Mirror Moment protects your photos, on-device AI extraction, and data retention rules.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--pearl-50)] text-[var(--ink-900)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--ink-500)] hover:text-[var(--ink-900)] transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>

        <div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--ink-900)]">
            Your Photos Are Yours
          </h1>
          <p className="text-base text-[var(--ink-500)] mt-2">
            Mirror Moment is engineered with a strict privacy-first architecture. Here is exactly what happens to your photos.
          </p>
        </div>

        {/* ── Key Highlights ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard variant="light" className="p-5 space-y-2">
            <Lock className="text-[var(--blue-600)]" size={24} />
            <h2 className="font-semibold text-sm">Private by Default</h2>
            <p className="text-xs text-[var(--ink-500)] leading-relaxed">
              No public buckets. Images are accessible only via time-limited signed URLs that expire within 60 minutes.
            </p>
          </GlassCard>

          <GlassCard variant="light" className="p-5 space-y-2">
            <EyeOff className="text-[var(--blue-600)]" size={24} />
            <h2 className="font-semibold text-sm">On-Device Lifting</h2>
            <p className="text-xs text-[var(--ink-500)] leading-relaxed">
              Dress extraction runs directly in your browser with WebAssembly. The original photo never leaves your machine for step 2.
            </p>
          </GlassCard>

          <GlassCard variant="light" className="p-5 space-y-2">
            <Trash2 className="text-[var(--blue-600)]" size={24} />
            <h2 className="font-semibold text-sm">One-Click Deletion</h2>
            <p className="text-xs text-[var(--ink-500)] leading-relaxed">
              You can wipe all your data, wardrobe dresses, and generated looks instantly in Settings.
            </p>
          </GlassCard>
        </div>

        {/* ── Detailed Policy Content ── */}
        <GlassCard variant="light" className="p-8 space-y-6 text-sm text-[var(--ink-900)] leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-display text-2xl font-semibold">1. What We Collect</h2>
            <p className="text-[var(--ink-500)]">
              For guest users, we store zero photos and zero personal data on our servers. For signed-in users, we store your email address, display name, and the items you choose to save in your Wardrobe or Looks gallery.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl font-semibold">2. How YouCam AI Is Used</h2>
            <p className="text-[var(--ink-500)]">
              To produce the realistic fabric drape in Step 4, your photo and the isolated dress image are transmitted via encrypted HTTPS directly to the Perfect Corp YouCam AI-Cloth service. These images are processed ephemerally and are never used to train external models.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl font-semibold">3. Data Retention &amp; Rights</h2>
            <p className="text-[var(--ink-500)]">
              You maintain full ownership of all uploaded content. Under GDPR and CCPA, you have the right to export or erase all personal information at any time via your Settings page.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl font-semibold">4. Contact Us</h2>
            <p className="text-[var(--ink-500)]">
              Questions regarding our security practices or privacy policies can be directed to privacy@mirrormoment.app.
            </p>
          </section>
        </GlassCard>
      </div>
    </div>
  );
}
