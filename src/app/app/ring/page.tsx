'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, RotateCcw, Sparkles, Check, Gem } from 'lucide-react';
import clsx from 'clsx';
import { Button, ImageInput, DemoPreviewNotice } from '@/components/ui';
import FX6CurtainReveal from '@/components/effects/FX6CurtainReveal';
import FX5WeavingLoader from '@/components/effects/FX5WeavingLoader';
import FX7TiltCard from '@/components/effects/FX7TiltCard';

type AsyncState = 'idle' | 'loading' | 'success' | 'error';

// ── Ring sample looks ─────────────────────────────────────────────────────────
const RING_PRESETS = [
  {
    id:     'solitaire_diamond',
    name:   'Solitaire Diamond',
    thumb:  '/samples/ring-solitaire.jpg',
    refUrl: '/samples/ring-solitaire.jpg',
  },
  {
    id:     'gold_band',
    name:   'Gold Band',
    thumb:  '/samples/ring-gold-band.jpg',
    refUrl: '/samples/ring-gold-band.jpg',
  },
  {
    id:     'emerald_cut',
    name:   'Emerald Cut',
    thumb:  '/samples/ring-emerald-cut.jpg',
    refUrl: '/samples/ring-emerald-cut.jpg',
  },
  {
    id:     'pearl_ring',
    name:   'Pearl Ring',
    thumb:  '/samples/ring-pearl.jpg',
    refUrl: '/samples/ring-pearl.jpg',
  },
  {
    id:     'silver_band',
    name:   'Silver Band',
    thumb:  '/samples/ring-silver.jpg',
    refUrl: '/samples/ring-silver.jpg',
  },
  {
    id:     'vintage_cocktail',
    name:   'Vintage Cocktail',
    thumb:  '/samples/ring-gold-band.jpg',
    refUrl: '/samples/ring-gold-band.jpg',
  },
] as const;

type RingPresetId = typeof RING_PRESETS[number]['id'];

export default function RingVTOPage() {
  const [handFile,    setHandFile]    = useState<File | null>(null);
  const [handUrl,     setHandUrl]     = useState<string | null>(null);
  const [handPreview, setHandPreview] = useState<string | null>(null);
  const [ringFile,    setRingFile]    = useState<File | null>(null);
  const [ringUrl,     setRingUrl]     = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<RingPresetId>('solitaire_diamond');
  const [asyncState, setAsyncState] = useState<AsyncState>('idle');
  const [resultUrl,  setResultUrl]  = useState<string | null>(null);
  const [isMockResult, setIsMockResult] = useState(false);
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null);

  const handleHandFile = useCallback((file: File) => {
    setHandFile(file); setHandUrl(null);
    setHandPreview(URL.createObjectURL(file));
    setResultUrl(null); setAsyncState('idle');
  }, []);
  const handleHandUrl = useCallback((url: string) => {
    setHandUrl(url); setHandFile(null); setHandPreview(url);
    setResultUrl(null); setAsyncState('idle');
  }, []);

  const handleRingFile = useCallback((file: File) => {
    setRingFile(file); setRingUrl(null);
    setSelectedPreset('solitaire_diamond');
    setResultUrl(null); setAsyncState('idle');
  }, []);
  const handleRingUrl = useCallback((url: string) => {
    setRingUrl(url); setRingFile(null);
    setSelectedPreset('solitaire_diamond');
    setResultUrl(null); setAsyncState('idle');
  }, []);

  const reset = () => {
    setHandFile(null); setHandUrl(null); setHandPreview(null);
    setRingFile(null); setRingUrl(null);
    setSelectedPreset('solitaire_diamond');
    setResultUrl(null); setErrorMsg(null); setAsyncState('idle');
  };

  const handleApply = async () => {
    setAsyncState('loading'); setErrorMsg(null);
    try {
      const form = new FormData();
      if (handFile)      form.append('handPhoto', handFile);
      else if (handUrl)  form.append('handUrl', handUrl);

      if (ringFile) {
        form.append('ringPhoto', ringFile);
      } else if (ringUrl) {
        form.append('ringUrl', ringUrl);
      } else {
        const preset = RING_PRESETS.find((p) => p.id === selectedPreset);
        if (preset) form.append('ringUrl', preset.refUrl);
        else throw new Error('Please select or upload a ring image.');
      }

      const res  = await fetch('/api/ring-vto', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message ?? 'Ring VTO failed.');
      if (typeof data.resultUrl !== 'string' || !data.resultUrl) throw new Error('Ring try-on finished without returning a preview. Please try again.');
      setResultUrl(data.resultUrl as string);
      setIsMockResult(Boolean(data.mock));
      setAsyncState('success');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setAsyncState('error');
    }
  };

  const activePreset = RING_PRESETS.find((p) => p.id === selectedPreset);

  return (
    <div
      className="min-h-screen py-8 mirror-studio"
      style={{ background: 'var(--grad-silk-light)' }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Link href="/app" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        <header className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-dashboard-gradient text-white flex items-center justify-center shadow-xl">
            <Gem size={22} />
          </div>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">AI Ring Try-On</h1>
            <p className="text-sm text-white/50 mt-0.5">See any ring on your hand — upload a file or paste a direct HTTPS image link</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Controls ── */}
          <div className="space-y-5">
            <section className="p-5 rounded-3xl border border-white/10 space-y-3" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-white/50">Step 1 — Your Hand Photo</p>
              <p className="text-xs text-white/40">Palm facing up or sideways, fingers extended. Upload a file or paste a direct HTTPS image link. Skipping uses a sample.</p>
              <ImageInput
                onFileSelect={handleHandFile}
                onUrlSelect={handleHandUrl}
                onClear={() => { setHandFile(null); setHandUrl(null); setHandPreview(null); }}
                label="Upload hand photo or paste an image link"
                hint="JPG / PNG · max 10 MB"
              />
            </section>

            <section className="p-5 rounded-3xl border border-white/10 space-y-4" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-white/50">Step 2 — Choose a Ring</p>

              <div className="grid grid-cols-3 gap-3">
                {RING_PRESETS.map((preset) => (
                  <FX7TiltCard key={preset.id} maxDeg={10} className="cursor-pointer">
                    <button
                      onClick={() => { setSelectedPreset(preset.id); setRingFile(null); setRingUrl(null); }}
                      aria-pressed={selectedPreset === preset.id}
                      aria-label={preset.name}
                      className={clsx(
                        'relative w-full rounded-2xl overflow-hidden aspect-square border-2 transition-all focus-visible:ring-2 focus-visible:ring-[var(--sky-400)]',
                        selectedPreset === preset.id
                          ? 'border-[var(--sky-400)] shadow-[0_0_16px_rgba(234,56,77,0.3)]'
                          : 'border-white/10 hover:border-white/30'
                      )}
                    >
                      <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#fff8f8] via-[#ffe5e9] to-[#f8d7dc]">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/80 bg-white/75 text-[var(--blue-600)] shadow-[var(--shadow-soft)]"><Gem size={28} strokeWidth={1.5} /></div>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preset.thumb} alt={preset.name} className="relative z-10 w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <span className="absolute bottom-1.5 left-0 right-0 text-center text-[9px] font-semibold text-white px-1 leading-tight">{preset.name}</span>
                      {selectedPreset === preset.id && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[var(--sky-400)] flex items-center justify-center">
                          <Check size={10} className="text-[var(--navy-950)]" />
                        </div>
                      )}
                    </button>
                  </FX7TiltCard>
                ))}
              </div>

              <div className="border-t border-white/10 pt-3 space-y-2">
                <p className="text-xs font-semibold text-white/50">Or upload your own image / paste a direct HTTPS image link:</p>
                <ImageInput
                  onFileSelect={handleRingFile}
                  onUrlSelect={handleRingUrl}
                  onClear={() => { setRingFile(null); setRingUrl(null); }}
                  label="Ring photo or direct image link"
                  hint="Front-facing, background removed preferred"
                />
              </div>
            </section>

            <Button variant="primary" size="lg" leftIcon={<Sparkles size={18} />} onClick={handleApply} disabled={asyncState === 'loading'} className="w-full">
              {asyncState === 'loading' ? 'Placing ring…' : 'Try On Ring'}
            </Button>
            {asyncState === 'error' && errorMsg && (
              <div role="alert" className="p-4 rounded-2xl border border-[var(--danger)]/30 text-sm text-[var(--danger)]" style={{ background: 'rgba(229,72,77,0.1)' }}>{errorMsg}</div>
            )}
          </div>

          {/* ── Result ── */}
          <div className="space-y-4">
            {asyncState === 'loading' && (
              <div className="rounded-3xl overflow-hidden aspect-[3/4] bg-[var(--navy-950)] flex items-center justify-center">
                <FX5WeavingLoader personUrl={handPreview ?? undefined} />
              </div>
            )}
            {asyncState === 'success' && resultUrl && (
              <div className="space-y-3">
              {isMockResult && <DemoPreviewNotice />}
              <FX6CurtainReveal>
                <div className="rounded-3xl overflow-hidden aspect-[3/4]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resultUrl} alt="Ring try-on result" className="w-full h-full object-cover" />
                </div>
              </FX6CurtainReveal>
              </div>
            )}
            {(asyncState === 'idle' || asyncState === 'error') && (
              <div className="rounded-3xl border-2 border-dashed border-white/10 aspect-[3/4] flex flex-col items-center justify-center gap-3 text-center p-6">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Gem size={30} className="text-[var(--blue-600)]" />
                </div>
                <p className="text-sm font-semibold text-white/70">Result appears here</p>
                <p className="text-xs text-white/40 max-w-xs">Choose a ring and tap <strong>Try On</strong> to see it on your hand.</p>
                {activePreset && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activePreset.thumb} alt={activePreset.name} className="w-8 h-8 rounded-lg object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    <span className="text-xs font-semibold text-white">{activePreset.name}</span>
                  </div>
                )}
              </div>
            )}
            {asyncState === 'success' && resultUrl && (
              <div className="flex gap-3">
                <a href={resultUrl} download="mirror_moment_ring.jpg" className="flex-1">
                  <Button variant="primary" size="md" leftIcon={<Download size={16} />} className="w-full">Download</Button>
                </a>
                <Button variant="secondary" size="md" leftIcon={<RotateCcw size={16} />} onClick={reset}>Reset</Button>
              </div>
            )}
            <div className="p-3 rounded-2xl border border-white/10 text-xs text-white/40 leading-relaxed" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <strong className="text-white/70">Best results:</strong> Palm facing up or sideways, fingers extended and relaxed. Even, bright lighting for the hand photo.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
