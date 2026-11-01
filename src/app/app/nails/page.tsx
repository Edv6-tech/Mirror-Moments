'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  RotateCcw,
  Sparkles,
  Check,
  Upload,
} from 'lucide-react';
import clsx from 'clsx';
import { Button, Dropzone, DemoPreviewNotice } from '@/components/ui';
import FX6CurtainReveal from '@/components/effects/FX6CurtainReveal';
import FX5WeavingLoader from '@/components/effects/FX5WeavingLoader';
// ── Types ─────────────────────────────────────────────────────────────────────
type NailType   = 'nail_polish' | 'press_on_nails';
// Per docs — nail_polish supports all 9 textures; press_on_nails supports 3
type Texture    = 'cream' | 'matte' | 'metallic' | 'jelly' | 'sheer' | 'pearl' | 'textured' | 'shimmer_coarse' | 'shimmer_fine';
// Press-on nail shapes per docs nails.json
type NailShape  = 'square_oval' | 'square_square' | 'squoval_squoval' | 'oval_oval' | 'almond_oval' | 'stiletto_oval';
type AsyncState = 'idle' | 'loading' | 'success' | 'error';
const SAMPLE_HAND_PHOTO = '/samples/sample-hand.jpg';

const FINGERS = ['thumb', 'index', 'middle', 'ring', 'pinky'] as const;

// ── Colour presets (real nail polish palette names + hex) ──────────────────
const COLOR_PRESETS: Array<{ name: string; hex: string }> = [
  { name: 'Cherry Red',    hex: '#c0021f' },
  { name: 'Rose Gold',     hex: '#b76e79' },
  { name: 'Ballet Pink',   hex: '#f4b8c1' },
  { name: 'Coral Crush',   hex: '#f4734a' },
  { name: 'Burgundy',      hex: '#6e1423' },
  { name: 'Mauve Nude',    hex: '#c09080' },
  { name: 'Espresso',      hex: '#3d1c02' },
  { name: 'Forest Green',  hex: '#1b4332' },
  { name: 'Sage',          hex: '#8aad96' },
  { name: 'Sky Blue',      hex: '#89c4e1' },
  { name: 'Cobalt',        hex: '#003399' },
  { name: 'Lilac Dream',   hex: '#c5a3d2' },
  { name: 'Plum Noir',     hex: '#4a0050' },
  { name: 'Midnight Black',hex: '#1a1a1a' },
  { name: 'Pearlescent',   hex: '#f0ece4' },
  { name: 'Golden Hour',   hex: '#d4a017' },
];

// ── Texture options per nail type ─────────────────────────────────────────────
const POLISH_TEXTURES: Array<{ id: Texture; label: string; hint: string }> = [
  { id: 'cream',         label: 'Cream',         hint: 'Classic glossy finish' },
  { id: 'matte',         label: 'Matte',          hint: 'Flat, velvety look' },
  { id: 'metallic',      label: 'Metallic',       hint: 'Mirror-like shine' },
  { id: 'jelly',         label: 'Jelly',          hint: 'Sheer translucent' },
  { id: 'sheer',         label: 'Sheer',          hint: 'See-through tint' },
  { id: 'pearl',         label: 'Pearl',          hint: 'Iridescent shimmer' },
  { id: 'shimmer_fine',  label: 'Fine Shimmer',   hint: 'Subtle glitter' },
  { id: 'shimmer_coarse',label: 'Glitter',        hint: 'Bold sparkle' },
  { id: 'textured',      label: 'Textured',       hint: 'Sand / sugar finish' },
];

const PRESS_ON_TEXTURES: Array<{ id: Texture; label: string }> = [
  { id: 'cream',    label: 'Cream' },
  { id: 'matte',    label: 'Matte' },
  { id: 'metallic', label: 'Metallic' },
];

// ── Press-on nail shapes (subset of docs nails.json, most popular) ────────────
const SHAPES: Array<{ id: NailShape; label: string; emoji: string }> = [
  { id: 'square_oval',    label: 'Square Oval',  emoji: '▭' },
  { id: 'square_square',  label: 'Square',       emoji: '□' },
  { id: 'squoval_squoval',label: 'Squoval',      emoji: '▢' },
  { id: 'oval_oval',      label: 'Oval',         emoji: '⬭' },
  { id: 'almond_oval',    label: 'Almond',       emoji: '△' },
  { id: 'stiletto_oval',  label: 'Stiletto',     emoji: '▲' },
];

// ── Build the effect payload per docs ─────────────────────────────────────────
function buildEffects(
  nailType: NailType,
  color:    string,
  texture:  Texture,
  shape:    NailShape,
  length:   number,
) {
  return FINGERS.map((finger) => {
    if (nailType === 'nail_polish') {
      return {
        sub_type:    'color',
        finger,
        color,
        texture,
        transparency: texture === 'metallic' ? undefined : 0,
        reflection:  30,
        contrast:    20,
        roughness:   0,
        ...(texture === 'pearl'           && { shimmer_opacity: 50 }),
        ...(texture === 'shimmer_fine'    && { shimmer_size: 40 }),
        ...(texture === 'shimmer_coarse'  && { shimmer_size: 60 }),
        ...(texture === 'textured'        && { textured_size: 50 }),
      };
    }
    // press_on_nails
    return {
      sub_type:   'color',
      finger,
      shape,
      length,
      color,
      texture:    texture as 'cream' | 'matte' | 'metallic',
      reflection: 30,
      contrast:   20,
      roughness:  0,
    };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function NailStudioPage() {
  const [nailType,    setNailType]    = useState<NailType>('nail_polish');
  const [color,       setColor]       = useState('#c0021f');
  const [texture,     setTexture]     = useState<Texture>('cream');
  const [shape,       setShape]       = useState<NailShape>('square_oval');
  const [length,      setLength]      = useState(1.0);
  const [handPreview, setHandPreview] = useState<string | null>(null);
  const [handFile,    setHandFile]    = useState<File | null>(null);
  const [state,       setState]       = useState<AsyncState>('idle');
  const [resultUrl,   setResultUrl]   = useState<string | null>(null);
  const [isMockResult, setIsMockResult] = useState(false);
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Keep texture valid when switching nail type
  const handleNailTypeChange = (t: NailType) => {
    setNailType(t);
    if (t === 'press_on_nails' && !['cream','matte','metallic'].includes(texture)) {
      setTexture('cream');
    }
  };

  const handleHand = useCallback((file: File) => {
    setHandFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setHandPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleSampleHand = useCallback(() => {
    setHandFile(null);
    setHandPreview(SAMPLE_HAND_PHOTO);
    setResultUrl(null);
    setErrorMsg(null);
    setState('idle');
  }, []);

  const handleApply = useCallback(async () => {
    setState('loading');
    setErrorMsg(null);
    setResultUrl(null);

    const effects       = buildEffects(nailType, color, texture, shape, length);
    const effectPayload = { effect_type: nailType, effects };

    const form = new FormData();
    form.append('effectPayload', JSON.stringify(effectPayload));
    if (handFile) form.append('handPhoto', handFile);

    try {
      const res  = await fetch('/api/nail-vto', { method: 'POST', body: form });
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
  }, [nailType, color, texture, shape, length, handFile]);

  const handleReset = () => {
    setState('idle');
    setResultUrl(null);
    setErrorMsg(null);
    setHandPreview(null);
    setHandFile(null);
  };

  const availableTextures = nailType === 'press_on_nails' ? PRESS_ON_TEXTURES : POLISH_TEXTURES;

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
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">AI Nail Studio</h1>
            <p className="text-xs text-white/50 mt-0.5">Powered by YouCam AI Nail Virtual Try-On v1.0</p>
          </div>
          <div
            className="ml-auto w-10 h-10 rounded-xl border-2 border-white/20 shadow-md flex-shrink-0 transition-colors duration-200"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
        </header>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT — controls */}
          <div className="space-y-5">

            {/* Step 1 — Nail type */}
            <section className="p-5 rounded-3xl border border-white/10 space-y-3" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
              <StepLabel n={1} text="Nail type" />
              <div className="grid grid-cols-2 gap-3">
                {(['nail_polish', 'press_on_nails'] as NailType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleNailTypeChange(t)}
                    aria-pressed={nailType === t}
                    className={clsx(
                      'py-3 rounded-2xl border-2 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[var(--sky-400)]',
                      nailType === t
                        ? 'border-[var(--sky-400)] bg-white/10 text-white shadow-[0_0_12px_rgba(234,56,77,0.22)]'
                        : 'border-white/10 text-white/60 hover:border-white/30 hover:text-white'
                    )}
                  >
                    {t === 'nail_polish' ? 'Nail Polish' : 'Press-On Nails'}
                  </button>
                ))}
              </div>
            </section>

            {/* Step 2 — Colour */}
            <section className="p-5 rounded-3xl border border-white/10 space-y-3" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
              <div className="flex items-center justify-between">
                <StepLabel n={2} text="Colour" />
                <span className="text-xs font-mono text-white/40 uppercase">{color}</span>
              </div>
              <div className="grid grid-cols-8 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    title={preset.name}
                    aria-label={`${preset.name} (${preset.hex})`}
                    onClick={() => setColor(preset.hex)}
                    className={clsx(
                      'w-full aspect-square rounded-xl border-2 transition-all focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--sky-400)]',
                      color === preset.hex
                        ? 'border-[var(--sky-400)] scale-110 shadow-[0_0_8px_rgba(234,56,77,0.3)]'
                        : 'border-white/20 shadow-sm hover:scale-105'
                    )}
                    style={{ backgroundColor: preset.hex }}
                  >
                    {color === preset.hex && (
                      <Check size={10} className="text-white mx-auto drop-shadow" />
                    )}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
                <span className="w-6 h-6 rounded-lg border border-white/20 shadow-sm overflow-hidden" style={{ backgroundColor: color }} />
                Custom colour
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                  className="sr-only" aria-label="Custom nail colour" />
              </label>
            </section>

            {/* Step 3 — Texture */}
            <section className="p-5 rounded-3xl border border-white/10 space-y-3" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
              <StepLabel n={3} text="Texture" />
              <div className="flex flex-wrap gap-2">
                {availableTextures.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTexture(t.id)}
                    aria-pressed={texture === t.id}
                    title={'hint' in t ? (t as { hint: string }).hint : undefined}
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all focus-visible:ring-2 focus-visible:ring-[var(--sky-400)]',
                      texture === t.id
                        ? 'border-[var(--sky-400)] bg-white/10 text-white shadow-[0_0_8px_rgba(234,56,77,0.22)]'
                        : 'border-white/10 text-white/60 hover:border-white/30 hover:text-white'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Step 4 — Shape + Length (press-on only) */}
            {nailType === 'press_on_nails' && (
              <section className="p-5 rounded-3xl border border-white/10 space-y-4" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
                <div className="space-y-2">
                  <StepLabel n={4} text="Shape" />
                  <div className="grid grid-cols-3 gap-2">
                    {SHAPES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setShape(s.id)}
                        aria-pressed={shape === s.id}
                        className={clsx(
                          'p-2 rounded-xl border-2 text-center text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-[var(--sky-400)]',
                          shape === s.id
                            ? 'border-[var(--sky-400)] bg-white/10 text-white'
                            : 'border-white/10 text-white/60 hover:border-white/30 hover:text-white'
                        )}
                      >
                        <span className="block text-lg mb-0.5">{s.emoji}</span>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="length-slider" className="text-xs font-semibold text-white/70">Length</label>
                    <span className="text-xs font-mono text-white/50">{length.toFixed(2)}×</span>
                  </div>
                  <input id="length-slider" type="range" min={0.8} max={2.15} step={0.05} value={length}
                    onChange={(e) => setLength(parseFloat(e.target.value))}
                    className="w-full accent-[var(--sky-400)]" aria-label="Nail length" />
                  <div className="flex justify-between text-[10px] text-white/30">
                    <span>Short</span><span>Medium</span><span>Extra long</span>
                  </div>
                </div>
              </section>
            )}

            {/* Step 5 — Hand photo */}
            <section className="p-5 rounded-3xl border border-white/10 space-y-3" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
              <StepLabel n={nailType === 'press_on_nails' ? 5 : 4} text="Your hand photo" />
              <p className="text-xs text-white/40">Back of hand · nails clearly visible · long side ≤ 2048 px · JPG/PNG</p>
              {handPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-square max-h-52">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={handPreview} alt="Hand photo preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setHandPreview(null); setHandFile(null); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full text-white flex items-center justify-center hover:bg-black/80"
                    aria-label="Remove photo"
                  >×</button>
                </div>
              ) : (
                <Dropzone
                  onFileSelect={handleHand}
                  accept="image/jpeg,image/png"
                  maxSizeMb={10}
                  label="Drop your hand photo here"
                  hint="Back of hand, nails facing camera"
                  variant="light"
                />
              )}
              {!handPreview && (
                <button type="button" onClick={handleSampleHand}
                  className="flex w-full items-center gap-3 rounded-2xl border border-[var(--line)] bg-white/75 p-2 text-left transition hover:border-[var(--blue-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-600)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={SAMPLE_HAND_PHOTO} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  <span><span className="block text-xs font-semibold text-[var(--ink-900)]">Use sample hand photo</span><span className="mt-0.5 block text-[10px] text-[var(--ink-500)]">Preview the finish without uploading</span></span>
                </button>
              )}
            </section>

            {/* Apply button */}
            <Button variant="primary" size="lg" className="w-full" onClick={handleApply}
              disabled={state === 'loading'} leftIcon={<Sparkles size={18} />}>
              {state === 'loading' ? 'Applying nail look…' : 'Apply nail look'}
            </Button>

            {/* Error */}
            {state === 'error' && errorMsg && (
              <div role="alert" className="p-4 rounded-2xl border border-[var(--danger)]/30 text-sm text-[var(--danger)]" style={{ background: 'rgba(229,72,77,0.1)' }}>
                <p className="font-semibold">Something went wrong</p>
                <p className="text-xs mt-1">{errorMsg}</p>
                <button onClick={() => { setState('idle'); setErrorMsg(null); }}
                  className="text-xs font-semibold underline mt-2">Dismiss</button>
              </div>
            )}
          </div>

          {/* RIGHT — result */}
          <div ref={resultRef} className="space-y-4">
            {/* Live preview strip */}
            <div className="rounded-2xl overflow-hidden border border-white/10">
              <div className="h-14 w-full transition-colors duration-300" style={{ backgroundColor: color }} aria-hidden="true" />
              <div className="px-4 py-2 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div>
                  <p className="text-xs font-semibold text-white">
                    {COLOR_PRESETS.find((p) => p.hex === color)?.name ?? 'Custom colour'}
                  </p>
                  <p className="text-[10px] text-white/50">
                    {nailType === 'nail_polish' ? 'Nail Polish' : 'Press-On'} · {texture.replace(/_/g, ' ')}
                    {nailType === 'press_on_nails' && ` · ${SHAPES.find(s=>s.id===shape)?.label}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  {FINGERS.map((f) => (
                    <div key={f} title={f} className="w-4 h-7 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--sky-400)] text-[var(--navy-950)] text-xs font-bold flex items-center justify-center">
                {nailType === 'press_on_nails' ? 6 : 5}
              </span>
              <span className="font-semibold text-white text-sm">Result</span>
            </div>

            {state === 'loading' && (
              <div className="aspect-square max-h-[480px] rounded-3xl overflow-hidden bg-[var(--navy-950)]">
                <FX5WeavingLoader />
              </div>
            )}

            {state === 'success' && resultUrl && (
              <div className="space-y-3">
                {isMockResult && <DemoPreviewNotice />}
                <div className="aspect-square max-h-[480px] rounded-3xl overflow-hidden border border-white/10">
                  <FX6CurtainReveal>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resultUrl} alt="Nail try-on result" className="w-full h-full object-cover" />
                  </FX6CurtainReveal>
                </div>
                <p className="text-[11px] text-center text-white/30">A vibe check, not a guarantee — lighting and skin tone affect results.</p>
                <div className="flex gap-3">
                  <a href={resultUrl} download="nail_look.jpg" className="flex-1">
                    <Button variant="primary" size="md" className="w-full" leftIcon={<Download size={16}/>}>Save look</Button>
                  </a>
                  <Button variant="secondary" size="md" onClick={handleReset} leftIcon={<RotateCcw size={16}/>}>Try another</Button>
                </div>
              </div>
            )}

            {(state === 'idle' || state === 'error') && (
              <div className="aspect-square max-h-[480px] rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 p-8" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Sparkles size={28} className="text-[var(--sky-400)]" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-white/70 text-sm">Your nail look appears here</p>
                  <p className="text-xs text-white/40 mt-1">Pick a colour · choose a texture · hit Apply</p>
                </div>
                <button onClick={handleSampleHand} className="text-xs font-semibold text-[var(--sky-400)] underline underline-offset-2 hover:text-white">
                  <Upload size={12} className="inline mr-1" />
                  Use the sample hand photo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────
function StepLabel({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-[var(--sky-400)] text-[var(--navy-950)] text-xs font-bold flex items-center justify-center flex-shrink-0">
        {n}
      </span>
      <h2 className="font-semibold text-sm text-white">{text}</h2>
    </div>
  );
}
