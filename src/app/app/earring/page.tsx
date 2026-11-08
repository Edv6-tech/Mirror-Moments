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

// ── Earring sample looks ──────────────────────────────────────────────────────
// The same public product photo is used for the tile and try-on reference.
const EARRING_PRESETS = [
  {
    id:     'gold_drop',
    name:   'Gold Drop',
    thumb:  '/samples/earring-gold-drop.jpg',
    refUrl: '/samples/earring-gold-drop.jpg',
  },
  {
    id:     'pearl_studs',
    name:   'Pearl Studs',
    thumb:  '/samples/earring-pearl-studs.jpg',
    refUrl: '/samples/earring-pearl-studs.jpg',
  },
  {
    id:     'silver_hoops',
    name:   'Silver Hoops',
    thumb:  '/samples/earring-silver-hoops.jpg',
    refUrl: '/samples/earring-silver-hoops.jpg',
  },
  {
    id:     'crystal_drops',
    name:   'Crystal Drops',
    thumb:  '/samples/earring-crystal-drops.jpg',
    refUrl: '/samples/earring-crystal-drops.jpg',
  },
  {
    id:     'custom',
    name:   'Your own →',
    thumb:  '',
    refUrl: '',
  },
] as const;

type EarringPresetId = typeof EARRING_PRESETS[number]['id'];

export default function EarringVTOPage() {
  // selfie
  const [selfieFile,    setSelfieFile]    = useState<File | null>(null);
  const [selfieUrl,     setSelfieUrl]     = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  // earring
  const [earringFile,    setEarringFile]    = useState<File | null>(null);
  const [earringUrl,     setEarringUrl]     = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<EarringPresetId>('gold_drop');
  // state
  const [asyncState, setAsyncState] = useState<AsyncState>('idle');
  const [resultUrl,  setResultUrl]  = useState<string | null>(null);
  const [isMockResult, setIsMockResult] = useState(false);
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null);

  const handleSelfieFile = useCallback((file: File) => {
    setSelfieFile(file); setSelfieUrl(null);
    setSelfiePreview(URL.createObjectURL(file));
    setResultUrl(null); setAsyncState('idle');
  }, []);
  const handleSelfieUrl = useCallback((url: string) => {
    setSelfieUrl(url); setSelfieFile(null);
    setSelfiePreview(url);
    setResultUrl(null); setAsyncState('idle');
  }, []);

  const handleEarringFile = useCallback((file: File) => {
    setEarringFile(file); setEarringUrl(null);
    setSelectedPreset('custom');
    setResultUrl(null); setAsyncState('idle');
  }, []);
  const handleEarringUrl = useCallback((url: string) => {
    setEarringUrl(url); setEarringFile(null);
    setSelectedPreset('custom');
    setResultUrl(null); setAsyncState('idle');
  }, []);

  const handlePresetSelect = (id: EarringPresetId) => {
    if (id === 'custom') return;
    setSelectedPreset(id);
    setEarringFile(null); setEarringUrl(null);
  };

  const reset = () => {
    setSelfieFile(null); setSelfieUrl(null); setSelfiePreview(null);
    setEarringFile(null); setEarringUrl(null);
    setSelectedPreset('gold_drop');
    setResultUrl(null); setErrorMsg(null); setAsyncState('idle');
  };

  const handleApply = async () => {
    setAsyncState('loading'); setErrorMsg(null);
    try {
      const form = new FormData();

      // Selfie
      if (selfieFile)      form.append('selfiePhoto', selfieFile);
      else if (selfieUrl)  form.append('selfieUrl', selfieUrl);
      // if neither — route uses sample fallback

      // Earring
      if (earringFile) {
        form.append('earringPhoto', earringFile);
      } else if (earringUrl) {
        form.append('earringUrl', earringUrl);
      } else if (selectedPreset !== 'custom') {
        const preset = EARRING_PRESETS.find((p) => p.id === selectedPreset);
        if (preset) form.append('earringUrl', preset.refUrl);
      } else {
        throw new Error('Please select or upload an earring image.');
      }

      const res  = await fetch('/api/earring-vto', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message ?? 'Earring VTO failed.');
      if (typeof data.resultUrl !== 'string' || !data.resultUrl) throw new Error('Earring try-on finished without returning a preview. Please try again.');
      setResultUrl(data.resultUrl as string);
      setIsMockResult(Boolean(data.mock));
      setAsyncState('success');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setAsyncState('error');
    }
  };

  const activePreset = selectedPreset !== 'custom'
    ? EARRING_PRESETS.find((p) => p.id === selectedPreset)
    : null;

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
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">AI Earring Try-On</h1>
            <p className="text-sm text-white/50 mt-0.5">See any earring on your photo — upload a file or paste a direct HTTPS image link</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Controls ── */}
          <div className="space-y-5">

            {/* Step 1 — selfie */}
            <section className="p-5 rounded-3xl border border-white/10 space-y-3" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-white/50">Step 1 — Your Face Photo</p>
                <p className="text-xs text-white/40">Face forward, ears visible. Upload a file or paste a direct HTTPS image link. Skipping uses a sample photo.</p>
              <ImageInput
                onFileSelect={handleSelfieFile}
                onUrlSelect={handleSelfieUrl}
                onClear={() => { setSelfieFile(null); setSelfieUrl(null); setSelfiePreview(null); }}
                  label="Upload selfie or paste an image link"
                hint="JPG / PNG · max 10 MB"
              />
            </section>

            {/* Step 2 — earring */}
            <section className="p-5 rounded-3xl border border-white/10 space-y-4" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-white/50">Step 2 — Choose Earrings</p>

              {/* 3D Tilt preset grid */}
              <div className="grid grid-cols-4 gap-3">
                {EARRING_PRESETS.filter((p) => p.id !== 'custom').map((preset) => (
                  <FX7TiltCard key={preset.id} maxDeg={10} className="cursor-pointer">
                    <button
                      onClick={() => handlePresetSelect(preset.id)}
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
                      <img
                        src={preset.thumb}
                        alt={preset.name}
                        className="relative z-10 w-full h-full object-cover scale-[1.35]"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
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

              {/* Upload / URL custom */}
              <div className="border-t border-white/10 pt-3 space-y-2">
                <p className="text-xs font-semibold text-white/50">Or upload your own image / paste a direct HTTPS image link:</p>
                <ImageInput
                  onFileSelect={handleEarringFile}
                  onUrlSelect={handleEarringUrl}
                  onClear={() => { setEarringFile(null); setEarringUrl(null); setSelectedPreset('gold_drop'); }}
                  label="Earring photo or direct image link"
                  hint="Product image, front-facing preferred"
                />
              </div>
            </section>

            <Button variant="primary" size="lg" leftIcon={<Sparkles size={18} />} onClick={handleApply} disabled={asyncState === 'loading'} className="w-full">
              {asyncState === 'loading' ? 'Trying on earrings…' : 'Try On Earrings'}
            </Button>

            {asyncState === 'error' && errorMsg && (
              <div role="alert" className="p-4 rounded-2xl border border-[var(--danger)]/30 text-sm text-[var(--danger)]" style={{ background: 'rgba(229,72,77,0.1)' }}>{errorMsg}</div>
            )}
          </div>

          {/* ── Result ── */}
          <div className="space-y-4">
            {asyncState === 'loading' && (
              <div className="rounded-3xl overflow-hidden aspect-[3/4] bg-[var(--navy-950)] flex items-center justify-center">
                <FX5WeavingLoader personUrl={selfiePreview ?? undefined} />
              </div>
            )}
            {asyncState === 'success' && resultUrl && (
              <div className="space-y-3">
              {isMockResult && <DemoPreviewNotice />}
              <FX6CurtainReveal>
                <div className="flex max-h-[78vh] min-h-64 items-center justify-center overflow-hidden rounded-3xl bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resultUrl} alt="Earring try-on result" className="block h-auto max-h-[78vh] w-full object-contain" />
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
                <p className="text-xs text-white/40 max-w-xs">Pick earrings and tap <strong>Try On</strong> to see how they look on you.</p>
                {activePreset && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activePreset.thumb} alt={activePreset.name} className="w-8 h-8 rounded-lg object-cover" />
                    <span className="text-xs font-semibold text-white">{activePreset.name}</span>
                  </div>
                )}
              </div>
            )}
            {asyncState === 'success' && resultUrl && (
              <div className="flex gap-3">
                <a href={resultUrl} download="mirror_moment_earrings.jpg" className="flex-1">
                  <Button variant="primary" size="md" leftIcon={<Download size={16} />} className="w-full">Download</Button>
                </a>
                <Button variant="secondary" size="md" leftIcon={<RotateCcw size={16} />} onClick={reset}>Reset</Button>
              </div>
            )}
            <div className="p-3 rounded-2xl border border-white/10 text-xs text-white/40 leading-relaxed" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <strong className="text-white/70">Best results:</strong> Face forward, ears clearly visible. Bright, even lighting. Use front-facing product photos.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
