'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  RotateCcw,
  Sparkles,
  Upload,
  Loader2,
  Check,
  Palette,
} from 'lucide-react';
import clsx from 'clsx';
import { Button, Dropzone, DemoPreviewNotice } from '@/components/ui';
import FX6CurtainReveal from '@/components/effects/FX6CurtainReveal';
import FX5WeavingLoader from '@/components/effects/FX5WeavingLoader';
import FX7TiltCard from '@/components/effects/FX7TiltCard';

// ── Makeup effect presets (grounded in YouCam Makeup VTO v1.0 docs) ─────────
// Each preset is a complete `effects` array ready to POST to /api/makeup-vto

// YouCam CDN thumbnails — sourced directly from official pattern catalog JSON in docs
const LOOKS: Array<{
  id: string;
  name: string;
  tag: string;
  description: string;
  // Real thumbnails from YouCam pattern CDN (from docs)
  thumbnails: string[];
  // Actual hex swatches from the palette definitions
  swatches: string[];
  effects: unknown[];
}> = [
  {
    id: 'natural_glow',
    name: 'Natural Glow',
    tag: 'Glow',
    description: 'Soft blush, nude lip, subtle lashes',
    thumbnails: [
      // blush 1color1
      '/samples/makeup-natural-blush.jpg',
      // eyelashes Natural1
      '/samples/makeup-natural-lashes.png',
    ],
    swatches: ['#e8b4a0', '#c9806b', '#1a1a1a'],
    effects: [
      { category: 'skin_smooth', skinSmoothStrength: 60, skinSmoothColorIntensity: 50 },
      {
        category: 'blush',
        pattern: { name: '1color1' },
        palettes: [{ color: '#e8b4a0', texture: 'matte', colorIntensity: 45 }],
      },
      {
        category: 'lip_color',
        shape: { name: 'original' },
        style: { type: 'full' },
        palettes: [{ color: '#c9806b', texture: 'gloss', colorIntensity: 55, gloss: 60 }],
      },
      {
        category: 'eyelashes',
        pattern: { name: 'Natural1' },
        palettes: [{ color: '#1a1a1a', colorIntensity: 70 }],
      },
    ],
  },
  {
    id: 'red_carpet',
    name: 'Red Carpet',
    tag: 'Classic',
    description: 'Bold red lip, dramatic liner, contoured',
    thumbnails: [
      // eyeliner Arabic3
      '/samples/makeup-red-liner.jpg',
      // eyelashes UpperDense1
      '/samples/makeup-dense-lashes.jpg',
    ],
    swatches: ['#c0021f', '#e8c8a0', '#0d0d0d'],
    effects: [
      { category: 'skin_smooth', skinSmoothStrength: 70, skinSmoothColorIntensity: 60 },
      {
        category: 'foundation',
        palettes: [{ color: '#e8c8a0', colorIntensity: 40, glowIntensity: 30, coverageIntensity: 55 }],
      },
      {
        category: 'lip_color',
        shape: { name: 'plump' },
        morphology: { fullness: 30, wrinkless: 20 },
        style: { type: 'full' },
        palettes: [{ color: '#c0021f', texture: 'matte', colorIntensity: 90 }],
      },
      {
        category: 'eye_liner',
        pattern: { name: 'Arabic3' },
        palettes: [{ color: '#0d0d0d', texture: 'matte', colorIntensity: 85 }],
      },
      {
        category: 'eyelashes',
        pattern: { name: 'UpperDense1' },
        palettes: [{ color: '#000000', colorIntensity: 90 }],
      },
      {
        category: 'contour',
        pattern: { name: 'OvalFace6' },
        palettes: [{ color: '#a07858', colorIntensity: 40 }],
      },
    ],
  },
  {
    id: 'smoky_night',
    name: 'Smoky Night',
    tag: 'Evening',
    description: 'Dark smoky eye, nude lip, shimmer highlight',
    thumbnails: [
      // eyeshadow 3colors1
      '/samples/makeup-smoky-shadow.jpg',
      // eyeliner 2colors1
      '/samples/makeup-smoky-liner.jpg',
    ],
    swatches: ['#1a1a2e', '#4a3060', '#c4a882', '#f5e6c8'],
    effects: [
      { category: 'skin_smooth', skinSmoothStrength: 55, skinSmoothColorIntensity: 45 },
      {
        category: 'eye_shadow',
        pattern: { name: '3colors1' },
        palettes: [
          { color: '#1a1a2e', texture: 'matte', colorIntensity: 80 },
          { color: '#4a3060', texture: 'shimmer', colorIntensity: 70, shimmerColor: '#9b59b6', shimmerIntensity: 60, shimmerDensity: 50, shimmerSize: 40 },
          { color: '#0d0d0d', texture: 'matte', colorIntensity: 90 },
        ],
      },
      {
        category: 'eye_liner',
        pattern: { name: '2colors1' },
        palettes: [
          { color: '#0d0d0d', texture: 'matte', colorIntensity: 90 },
          { color: '#5b2d8e', texture: 'matte', colorIntensity: 60 },
        ],
      },
      {
        category: 'eyelashes',
        pattern: { name: 'UpperDense1' },
        palettes: [{ color: '#000000', colorIntensity: 95 }],
      },
      {
        category: 'lip_color',
        shape: { name: 'original' },
        style: { type: 'full' },
        palettes: [{ color: '#c4a882', texture: 'matte', colorIntensity: 50 }],
      },
      {
        category: 'highlighter',
        pattern: { name: 'OvalFace2' },
        palettes: [{ color: '#f5e6c8', glowIntensity: 70, shimmerIntensity: 65, shimmerDensity: 55, shimmerSize: 45, colorIntensity: 60 }],
      },
    ],
  },
  {
    id: 'spring_fresh',
    name: 'Spring Fresh',
    tag: 'Fresh',
    description: 'Peachy blush, coral lip, soft brows',
    thumbnails: [
      // blush 2colors1
      '/samples/makeup-spring-blush.jpg',
      // eyebrows SoftArch1
      '/samples/makeup-spring-brows.jpg',
    ],
    swatches: ['#ff9eb5', '#f2a53e', '#f5715a', '#7a5230'],
    effects: [
      { category: 'skin_smooth', skinSmoothStrength: 65, skinSmoothColorIntensity: 55 },
      {
        category: 'blush',
        pattern: { name: '2colors6' },
        palettes: [
          { color: '#ff9eb5', texture: 'satin', glowStrength: 40, colorIntensity: 55 },
          { color: '#f2a53e', texture: 'matte', colorIntensity: 40 },
        ],
      },
      {
        category: 'lip_color',
        shape: { name: 'heart-shaped' },
        style: { type: 'full' },
        palettes: [{ color: '#f5715a', texture: 'gloss', colorIntensity: 70, gloss: 65 }],
      },
      {
        category: 'eyebrows',
        pattern: { type: 'shape', name: 'SoftArch1', curvature: 10, thickness: 5, definition: 40 },
        palettes: [{ color: '#7a5230', texture: 'matte', colorIntensity: 55 }],
      },
      {
        category: 'eyelashes',
        pattern: { name: 'Upper1' },
        palettes: [{ color: '#2d1a00', colorIntensity: 75 }],
      },
    ],
  },
  {
    id: 'bronze_goddess',
    name: 'Bronze Goddess',
    tag: 'Bronze',
    description: 'Sun-kissed bronzer, warm eyeshadow, glossy lip',
    thumbnails: [
      // bronzer Bronzer1
      '/samples/makeup-bronzer.jpg',
      // eyeshadow 2colors1
      '/samples/makeup-bronze-shadow.jpg',
    ],
    swatches: ['#8b5a2b', '#c87941', '#f8d87a', '#c47947'],
    effects: [
      { category: 'skin_smooth', skinSmoothStrength: 50, skinSmoothColorIntensity: 40 },
      {
        category: 'bronzer',
        pattern: { name: 'Bronzer1' },
        palettes: [{ color: '#8b5a2b', colorIntensity: 50 }],
      },
      {
        category: 'highlighter',
        pattern: { name: 'RoundFace3' },
        palettes: [{ color: '#f8d87a', glowIntensity: 80, shimmerIntensity: 70, shimmerDensity: 60, shimmerSize: 50, colorIntensity: 65 }],
      },
      {
        category: 'eye_shadow',
        pattern: { name: '2colors1' },
        palettes: [
          { color: '#c87941', texture: 'shimmer', colorIntensity: 65, shimmerColor: '#f5a623', shimmerIntensity: 55, shimmerDensity: 45, shimmerSize: 35 },
          { color: '#6b3a2a', texture: 'matte', colorIntensity: 70 },
        ],
      },
      {
        category: 'lip_color',
        shape: { name: 'petal' },
        style: { type: 'full' },
        palettes: [{ color: '#c47947', texture: 'gloss', colorIntensity: 75, gloss: 70 }],
      },
    ],
  },
  {
    id: 'editorial',
    name: 'Editorial',
    tag: 'Editorial',
    description: 'Bold liner, graphic eye, statement lip',
    thumbnails: [
      // eyeliner 3colors2
      '/samples/makeup-editorial-liner.jpg',
      // eyelashes Artistic1
      '/samples/makeup-editorial-lashes.jpg',
    ],
    swatches: ['#000d99', '#0099cc', '#6600cc'],
    effects: [
      { category: 'skin_smooth', skinSmoothStrength: 75, skinSmoothColorIntensity: 65 },
      {
        category: 'eye_liner',
        pattern: { name: '3colors2' },
        palettes: [
          { color: '#000d99', texture: 'matte', colorIntensity: 90 },
          { color: '#0099cc', texture: 'matte', colorIntensity: 75 },
          { color: '#00cccc', texture: 'shimmer', colorIntensity: 60, shimmerColor: '#00ffff', shimmerIntensity: 70, shimmerSize: 40 },
        ],
      },
      {
        category: 'eyelashes',
        pattern: { name: 'Artistic1' },
        palettes: [{ color: '#000066', colorIntensity: 85 }],
      },
      {
        category: 'lip_color',
        shape: { name: 'vintage' },
        style: { type: 'full' },
        palettes: [{ color: '#6600cc', texture: 'matte', colorIntensity: 85 }],
      },
      {
        category: 'concealer',
        palettes: [{ color: '#f0e0c8', colorIntensity: 55, colorUnderEyeIntensity: 60, coverageLevel: 65 }],
      },
    ],
  },
];

type AsyncState = 'idle' | 'loading' | 'success' | 'error';

export default function MakeupStudioPage() {
  const [selectedLook, setSelectedLook] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [state, setState] = useState<AsyncState>('idle');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isMockResult, setIsMockResult] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleSelfie = useCallback((file: File) => {
    setSelfieFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setSelfiePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleApply = useCallback(async () => {
    if (!selectedLook) return;
    const look = LOOKS.find((l) => l.id === selectedLook);
    if (!look) return;

    setState('loading');
    setErrorMsg(null);
    setResultUrl(null);

    try {
      const form = new FormData();
      form.append('effects', JSON.stringify(look.effects));
      if (selfieFile) form.append('personPhoto', selfieFile);

      const res = await fetch('/api/makeup-vto', { method: 'POST', body: form });
      const data = await res.json();

      if (data.ok && data.resultUrl) {
        setResultUrl(data.resultUrl);
        setIsMockResult(Boolean(data.mock));
        setState('success');
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      } else {
        setErrorMsg(data.message ?? 'Something went wrong. Please try again.');
        setState('error');
      }
    } catch {
      setErrorMsg('Network error. Please check your connection.');
      setState('error');
    }
  }, [selectedLook, selfieFile]);

  const handleReset = useCallback(() => {
    setState('idle');
    setResultUrl(null);
    setErrorMsg(null);
    setSelfiePreview(null);
    setSelfieFile(null);
    setSelectedLook(null);
  }, []);

  const selectedLookData = LOOKS.find((l) => l.id === selectedLook);

  return (
    <div
      className="min-h-screen py-8 mirror-studio"
      style={{ background: 'var(--grad-silk-light)' }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ── Header ── */}
        <header className="flex items-center gap-3">
          <Link href="/app" aria-label="Back to dashboard"
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ArrowLeft size={18} className="text-white/70" />
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-dashboard-gradient text-white flex items-center justify-center shadow-xl">
            <Palette size={22} />
          </div>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">AI Makeup Studio</h1>
            <p className="text-xs text-white/50 mt-0.5">Powered by YouCam AI Makeup Virtual Try-On v1.0</p>
          </div>
        </header>

        {/* ── Main Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT — Photo upload + look picker */}
          <section className="space-y-5">
            {/* Step 1 — Selfie */}
            <div className="p-5 rounded-3xl border border-white/10 space-y-3" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-white/50">Step 1 — Your Photo</p>
              <p className="text-xs text-white/40">Face fully visible · long side &lt; 1920 px · JPG or PNG · max 10 MB</p>
              {selfiePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-[4/5] max-h-80">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selfiePreview} alt="Your selfie preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setSelfiePreview(null); setSelfieFile(null); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full text-white flex items-center justify-center hover:bg-black/80 transition"
                    aria-label="Remove photo"
                  >×</button>
                </div>
              ) : (
                <Dropzone
                  onFileSelect={handleSelfie}
                  accept="image/jpeg,image/png"
                  maxSizeMb={10}
                  label="Drop your selfie here or click to browse"
                  hint="Face clearly visible, front-facing"
                  variant="light"
                />
              )}
              {!selfiePreview && (
                <p className="text-[11px] text-white/30 text-center">No photo? We&apos;ll use a sample image for preview</p>
              )}
            </div>

            {/* Step 2 — Pick a look */}
            <div className="p-5 rounded-3xl border border-white/10 space-y-4" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-white/50">Step 2 — Choose a Look</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {LOOKS.map((look) => (
                  <FX7TiltCard key={look.id} maxDeg={8} className="cursor-pointer">
                    <button
                      onClick={() => setSelectedLook(look.id)}
                      aria-pressed={selectedLook === look.id}
                      className={clsx(
                        'relative w-full rounded-2xl border-2 text-left transition-all duration-200 overflow-hidden focus-visible:ring-2 focus-visible:ring-[var(--sky-400)]',
                        selectedLook === look.id
                          ? 'border-[var(--sky-400)] shadow-[0_0_16px_rgba(234,56,77,0.24)]'
                          : 'border-white/10 hover:border-white/30'
                      )}
                    >
                      {/* Thumbnail strip */}
                      <div className="flex h-16 w-full overflow-hidden bg-black/20">
                        {look.thumbnails.map((url, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={url} alt="" aria-hidden="true"
                            className="flex-1 object-cover object-center min-w-0" loading="lazy" />
                        ))}
                      </div>
                      {selectedLook === look.id && (
                        <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-[var(--sky-400)] rounded-full flex items-center justify-center shadow-md">
                          <Check size={11} className="text-[var(--navy-950)]" />
                        </span>
                      )}
                      <div className="p-2.5 space-y-1.5">
                        <p className="text-xs font-semibold text-white truncate">{look.name}</p>
                        <div className="flex items-center gap-1">
                          {look.swatches.map((hex) => (
                            <span key={hex} title={hex}
                              className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm flex-shrink-0"
                              style={{ backgroundColor: hex }} />
                          ))}
                        </div>
                        <p className="text-[10px] text-white/40 leading-tight line-clamp-2">{look.description}</p>
                      </div>
                    </button>
                  </FX7TiltCard>
                ))}
              </div>
            </div>

            {/* Apply button */}
            <Button
              variant="primary" size="lg" className="w-full"
              disabled={!selectedLook || state === 'loading'}
              onClick={handleApply}
              leftIcon={state === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              aria-label={!selectedLook ? 'Select a look first' : state === 'loading' ? 'Applying makeup…' : 'Apply look'}
            >
              {state === 'loading' ? 'Applying makeup…' : selectedLookData ? `Apply "${selectedLookData.name}"` : 'Select a look to apply'}
            </Button>

            {/* Error state */}
            {state === 'error' && errorMsg && (
              <div role="alert" className="p-4 rounded-2xl border border-[var(--danger)]/30 text-sm text-[var(--danger)] space-y-2" style={{ background: 'rgba(229,72,77,0.1)' }}>
                <p className="font-semibold">Something went wrong</p>
                <p className="text-xs">{errorMsg}</p>
                <button onClick={() => { setState('idle'); setErrorMsg(null); }} className="text-xs font-semibold underline">Dismiss</button>
              </div>
            )}
          </section>

          {/* RIGHT — Result panel */}
          <section ref={resultRef} className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-white/50">Step 3 — Your Makeover Result</p>

            {/* Loading */}
            {state === 'loading' && (
              <div className="aspect-[4/5] max-h-[520px] rounded-3xl bg-[var(--navy-950)] flex items-center justify-center overflow-hidden">
                <FX5WeavingLoader personUrl={selfiePreview ?? undefined} />
              </div>
            )}

            {/* Success */}
            {state === 'success' && resultUrl && (
              <div className="space-y-3">
                {isMockResult && <DemoPreviewNotice />}
                <div className="aspect-[4/5] max-h-[520px] rounded-3xl overflow-hidden border border-white/10 bg-black">
                  <FX6CurtainReveal>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resultUrl} alt={`${selectedLookData?.name ?? 'Makeup'} virtual try-on result`} className="w-full h-full object-cover" />
                  </FX6CurtainReveal>
                </div>
                <p className="text-[11px] text-center text-white/30">A vibe check, not a fit guarantee — lighting and skin tone affect results.</p>
                <div className="flex gap-3">
                  <a href={resultUrl} download={`makeup_${selectedLookData?.id ?? 'look'}.jpg`} className="flex-1">
                    <Button variant="primary" size="md" className="w-full" leftIcon={<Download size={16} />}>Save look</Button>
                  </a>
                  <Button variant="secondary" size="md" onClick={handleReset} leftIcon={<RotateCcw size={16} />} aria-label="Try a different look">Try another</Button>
                </div>
              </div>
            )}

            {/* Idle / empty */}
            {(state === 'idle' || state === 'error') && (
              <div className="aspect-[4/5] max-h-[520px] rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-3 p-8" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Palette size={28} className="text-white/30" />
                </div>
                <div>
                  <p className="font-semibold text-white/70 text-sm">Your makeover appears here</p>
                  <p className="text-xs text-white/40 mt-1">Upload a photo · pick a look · hit Apply</p>
                </div>
                <button
                  onClick={async () => {
                    const look = selectedLook ?? 'natural_glow';
                    if (!selectedLook) setSelectedLook(look);
                    const targetLook = LOOKS.find((l) => l.id === look) ?? LOOKS[0];
                    setState('loading'); setErrorMsg(null); setResultUrl(null); setIsMockResult(false);
                    try {
                      const form = new FormData();
                      form.append('effects', JSON.stringify(targetLook.effects));
                      const res = await fetch('/api/makeup-vto', { method: 'POST', body: form });
                      const data = await res.json();
                      if (data.ok && data.resultUrl) { setResultUrl(data.resultUrl); setIsMockResult(Boolean(data.mock)); setState('success'); }
                      else { setErrorMsg(data.message ?? 'Something went wrong.'); setState('error'); }
                    } catch { setErrorMsg('Network error.'); setState('error'); }
                  }}
                  className="mt-2 text-xs font-semibold text-[var(--sky-400)] underline underline-offset-2 hover:text-white"
                >
                  <Upload size={12} className="inline mr-1" />
                  Try with sample photo
                </button>
              </div>
            )}
          </section>
        </div>

        {/* ── Effect legend ── */}
        {selectedLookData && (
          <aside className="rounded-2xl border border-white/10 p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-xs font-bold uppercase tracking-wider text-white/50">
              {selectedLookData.name} — effects applied
            </p>
            <div className="flex flex-wrap gap-2">
              {(selectedLookData.effects as Array<{ category: string }>).map((e) => (
                <span key={e.category}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/60">
                  {e.category.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
