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
      { category: 'skin_smooth', skinSmoothStrength: 20, skinSmoothColorIntensity: 50 },
      {
        category: 'blush',
        pattern: { name: '1color1' },
        palettes: [{ color: '#e8b4a0', texture: 'matte', colorIntensity: 45 }],
      },
      {
        category: 'lip_color',
        shape: { name: 'original' },
        style: { type: 'full' },
        palettes: [{ color: '#c9806b', texture: 'gloss', colorIntensity: 55, gloss: 60, transparencyIntensity: 30 }],
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
      { category: 'skin_smooth', skinSmoothStrength: 20, skinSmoothColorIntensity: 60 },
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
      { category: 'skin_smooth', skinSmoothStrength: 20, skinSmoothColorIntensity: 45 },
      {
        category: 'eye_shadow',
        pattern: { name: '3colors1' },
        palettes: [
          { color: '#1a1a2e', texture: 'matte', colorIntensity: 80 },
          { color: '#4a3060', texture: 'shimmer', colorIntensity: 70, shimmerColor: '#9b59b6', shimmerIntensity: 60 },
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
      { category: 'skin_smooth', skinSmoothStrength: 20, skinSmoothColorIntensity: 55 },
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
        palettes: [{ color: '#f5715a', texture: 'gloss', colorIntensity: 70, gloss: 65, transparencyIntensity: 30 }],
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
      { category: 'skin_smooth', skinSmoothStrength: 20, skinSmoothColorIntensity: 40 },
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
          { color: '#c87941', texture: 'shimmer', colorIntensity: 65, shimmerColor: '#f5a623', shimmerIntensity: 55 },
          { color: '#6b3a2a', texture: 'matte', colorIntensity: 70 },
        ],
      },
      {
        category: 'lip_color',
        shape: { name: 'petal' },
        style: { type: 'full' },
        palettes: [{ color: '#c47947', texture: 'gloss', colorIntensity: 75, gloss: 70, transparencyIntensity: 30 }],
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
      { category: 'skin_smooth', skinSmoothStrength: 20, skinSmoothColorIntensity: 65 },
      {
        category: 'eye_liner',
        pattern: { name: '3colors2' },
        palettes: [
          { color: '#000d99', texture: 'matte', colorIntensity: 90 },
          { color: '#0099cc', texture: 'matte', colorIntensity: 75 },
          { color: '#00cccc', texture: 'shimmer', colorIntensity: 60, shimmerColor: '#00ffff', shimmerIntensity: 70 },
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
  {
    id: 'soft_glam',
    name: 'Soft Glam',
    tag: 'Everyday glam',
    description: 'Warm rose eyes, soft definition, satin-smooth color',
    thumbnails: ['/samples/makeup-spring-blush.jpg', '/samples/makeup-natural-lashes.png'],
    swatches: ['#d78376', '#9a6556', '#b86570'],
    effects: [
      { category: 'skin_smooth', skinSmoothStrength: 20, skinSmoothColorIntensity: 45 },
      {
        category: 'blush',
        pattern: { name: '1color1' },
        palettes: [{ color: '#d78376', texture: 'satin', glowStrength: 32, colorIntensity: 42 }],
      },
      {
        category: 'eye_shadow',
        pattern: { name: '2colors1' },
        palettes: [
          { color: '#9a6556', texture: 'matte', colorIntensity: 48 },
          { color: '#c58c7c', texture: 'shimmer', shimmerColor: '#efd0bc', shimmerIntensity: 35, colorIntensity: 38 },
        ],
      },
      {
        category: 'lip_color',
        shape: { name: 'original' },
        style: { type: 'full' },
        palettes: [{ color: '#b86570', texture: 'gloss', colorIntensity: 52, gloss: 48, transparencyIntensity: 28 }],
      },
      { category: 'eyelashes', pattern: { name: 'Natural1' }, palettes: [{ color: '#261b19', colorIntensity: 65 }] },
    ],
  },
  {
    id: 'rosewater',
    name: 'Rosewater',
    tag: 'Fresh & rosy',
    description: 'Petal-pink cheeks, bright eyes, a sheer rosy lip',
    thumbnails: ['/samples/makeup-natural-blush.jpg', '/samples/makeup-spring-brows.jpg'],
    swatches: ['#ed9ba3', '#e8ad91', '#d46f83'],
    effects: [
      { category: 'skin_smooth', skinSmoothStrength: 20, skinSmoothColorIntensity: 42 },
      {
        category: 'blush',
        pattern: { name: '2colors6' },
        palettes: [
          { color: '#ed9ba3', texture: 'satin', glowStrength: 28, colorIntensity: 48 },
          { color: '#e8ad91', texture: 'matte', colorIntensity: 32 },
        ],
      },
      {
        category: 'lip_color',
        shape: { name: 'heart-shaped' },
        style: { type: 'full' },
        palettes: [{ color: '#d46f83', texture: 'gloss', colorIntensity: 55, gloss: 45, transparencyIntensity: 35 }],
      },
      { category: 'eyelashes', pattern: { name: 'Upper1' }, palettes: [{ color: '#3a2523', colorIntensity: 58 }] },
    ],
  },
  {
    id: 'after_hours',
    name: 'After Hours',
    tag: 'Night out',
    description: 'Smoked plum eyes, precise liner, a deep berry lip',
    thumbnails: ['/samples/makeup-smoky-shadow.jpg', '/samples/makeup-editorial-liner.jpg'],
    swatches: ['#46334f', '#241e2b', '#8b3155'],
    effects: [
      { category: 'skin_smooth', skinSmoothStrength: 20, skinSmoothColorIntensity: 45 },
      {
        category: 'eye_shadow',
        pattern: { name: '3colors1' },
        palettes: [
          { color: '#76617d', texture: 'matte', colorIntensity: 62 },
          { color: '#46334f', texture: 'shimmer', shimmerColor: '#c2a0d2', shimmerIntensity: 48, colorIntensity: 55 },
          { color: '#241e2b', texture: 'matte', colorIntensity: 72 },
        ],
      },
      { category: 'eye_liner', pattern: { name: 'Arabic3' }, palettes: [{ color: '#211a25', texture: 'matte', colorIntensity: 68 }] },
      { category: 'eyelashes', pattern: { name: 'UpperDense1' }, palettes: [{ color: '#1c1720', colorIntensity: 78 }] },
      {
        category: 'lip_color',
        shape: { name: 'plump' },
        style: { type: 'full' },
        palettes: [{ color: '#8b3155', texture: 'matte', colorIntensity: 72 }],
      },
    ],
  },
];

type AsyncState = 'idle' | 'loading' | 'success' | 'error';

async function prepareMakeupPhoto(file: File, zoom: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    // Center the frame horizontally and bias it upward for tall photos so a
    // full-body upload can still provide a large, clear face to Makeup VTO.
    const sourceWidth = Math.max(1, Math.round(bitmap.width / zoom));
    const isTallPortrait = bitmap.height / bitmap.width > 1.45;
    const sourceHeight = isTallPortrait
      ? Math.min(bitmap.height, Math.round(sourceWidth * 1.1))
      : Math.min(bitmap.height, Math.max(1, Math.round(bitmap.height / zoom), sourceWidth));
    const sourceX = Math.round((bitmap.width - sourceWidth) / 2);
    const sourceY = isTallPortrait ? 0 : Math.round((bitmap.height - sourceHeight) / 2);
    // YouCam currently rejects source crops below 320x320. Enlarge only enough
    // to meet that minimum, and otherwise preserve source detail; always stay
    // below its maximum width and height.
    const minimumSideScale = 320 / Math.min(sourceWidth, sourceHeight);
    const scale = Math.min(
      Math.max(1, minimumSideScale),
      1919 / sourceWidth,
      1079 / sourceHeight,
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sourceWidth * scale);
    canvas.height = Math.round(sourceHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not prepare this photo. Please choose another image.');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);

    const normalized = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.94));
    if (!normalized) throw new Error('Could not prepare this photo. Please choose another image.');
    return normalized;
  } finally {
    bitmap.close();
  }
}

export default function MakeupStudioPage() {
  const [selectedLook, setSelectedLook] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [makeupZoom, setMakeupZoom] = useState(1.5);
  const [state, setState] = useState<AsyncState>('idle');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isMockResult, setIsMockResult] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleSelfie = useCallback((file: File) => {
    setSelfieFile(file);
    setMakeupZoom(1.5);
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
      if (selfieFile) {
        const preparedPhoto = await prepareMakeupPhoto(selfieFile, makeupZoom);
        form.append('personPhoto', preparedPhoto, 'makeup-selfie.jpg');
      }

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
  }, [selectedLook, selfieFile, makeupZoom]);

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
              <p className="text-xs leading-relaxed text-white/60">Use a clear, front-facing photo with your whole face visible. For a crisp result, choose an image at least 320 × 320 pixels and make your face about one-third of its width. JPG or PNG, under 10 MB. Full-body photos are okay—we&apos;ll zoom in for makeup.</p>
              {selfiePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-[4/5] max-h-80">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selfiePreview} alt="Your photo, framed toward the face for makeup" className="w-full h-full object-cover object-top transition-transform" style={{ transform: `scale(${makeupZoom})`, transformOrigin: 'center top' }} />
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
              {selfiePreview && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="makeup-face-zoom" className="text-xs font-semibold text-white/75">Zoom on face</label>
                    <span className="text-xs tabular-nums text-white/55">{makeupZoom.toFixed(1)}×</span>
                  </div>
                  <input id="makeup-face-zoom" type="range" min="1" max="3" step="0.1" value={makeupZoom} onChange={(event) => setMakeupZoom(Number(event.target.value))} aria-valuetext={`${makeupZoom.toFixed(1)} times zoom`} className="w-full accent-[var(--sky-400)]" />
                  <p className="text-[11px] leading-relaxed text-white/45">The zoomed frame is sent for makeup. Dress and bag try-ons use your full-body photo in their studios.</p>
                </div>
              )}
              {!selfiePreview && (
                <p className="text-[11px] text-white/30 text-center">No photo? We&apos;ll use a sample image for preview</p>
              )}
            </div>

            {/* Step 2 — Pick a look */}
            <div className="p-5 rounded-3xl border border-white/10 space-y-4" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/50">Step 2 — Choose a Look</p>
                  <p className="mt-1 text-sm text-white/75">From barely-there to after-dark.</p>
                </div>
                <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-white/55">{LOOKS.length} looks</span>
              </div>
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
                      {/* Larger inspiration strip makes each finish easier to compare. */}
                      <div className="relative flex h-24 w-full overflow-hidden bg-black/20 sm:h-28">
                        {look.thumbnails.map((url, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={url} alt="" aria-hidden="true"
                            className="h-full min-w-0 flex-1 object-cover object-center" loading="lazy" />
                        ))}
                        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
                        <span className="absolute bottom-2 left-2 rounded-full border border-white/25 bg-black/35 px-2 py-0.5 text-[9px] font-semibold text-white/90 backdrop-blur-sm">{look.tag}</span>
                        {selectedLook === look.id && (
                          <span aria-hidden="true" className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--sky-400)] shadow-md">
                            <Check size={12} className="text-[var(--navy-950)]" />
                          </span>
                        )}
                      </div>
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
                    <div className="flex h-full w-full items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={resultUrl} alt={`${selectedLookData?.name ?? 'Makeup'} virtual try-on result`} className="h-auto max-h-full w-auto max-w-full object-contain" />
                    </div>
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
