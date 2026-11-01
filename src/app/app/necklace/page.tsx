'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  RotateCcw,
  Sparkles,
  Gem,
} from 'lucide-react';
import clsx from 'clsx';
import { Button, Dropzone, ImageInput, DemoPreviewNotice } from '@/components/ui';
import FX6CurtainReveal from '@/components/effects/FX6CurtainReveal';
import FX5WeavingLoader from '@/components/effects/FX5WeavingLoader';
import FX7TiltCard from '@/components/effects/FX7TiltCard';

type AsyncState = 'idle' | 'loading' | 'success' | 'error';

// ── Necklace sample looks ─────────────────────────────────────────────────────
const NECKLACE_PRESETS = [
  {
    id:      'delicate_gold',
    name:    'Delicate Gold Chain',
    thumb:   '/samples/necklace-gold.jpg',
    refUrl:  '/samples/necklace-gold.jpg',
  },
  {
    id:      'pearl_strand',
    name:    'Pearl Strand',
    thumb:   '/samples/necklace-pearl.jpg',
    refUrl:  '/samples/necklace-pearl.jpg',
  },
  {
    id:      'diamond_pendant',
    name:    'Diamond Pendant',
    thumb:   '/samples/necklace-pendant.jpg',
    refUrl:  '/samples/necklace-pendant.jpg',
  },
  {
    id:      'silver_choker',
    name:    'Silver Choker',
    thumb:   '/samples/necklace-choker.jpg',
    refUrl:  '/samples/necklace-choker.jpg',
  },
] as const;

type NecklacePresetId = typeof NECKLACE_PRESETS[number]['id'];

export default function NecklaceVTOPage() {
  const [selfieFile,      setSelfieFile]      = useState<File | null>(null);
  const [selfieUrl,       setSelfieUrl]       = useState<string | null>(null);
  const [selfiePreview,   setSelfiePreview]   = useState<string | null>(null);
  const [necklaceFile,    setNecklaceFile]    = useState<File | null>(null);
  const [necklacePreview, setNecklacePreview] = useState<string | null>(null);
  const [necklaceUrlCustom, setNecklaceUrlCustom] = useState<string | null>(null);
  const [selectedPreset,  setSelectedPreset]  = useState<NecklacePresetId | 'custom'>('delicate_gold');
  const [shadowIntensity, setShadowIntensity] = useState(0.15);
  const [ambientLight,    setAmbientLight]    = useState(1.0);
  const [state,           setState]           = useState<AsyncState>('idle');
  const [resultUrl,       setResultUrl]       = useState<string | null>(null);
  const [isMockResult, setIsMockResult] = useState(false);
  const [errorMsg,        setErrorMsg]        = useState<string | null>(null);

  const handleSelfie = useCallback((file: File) => {
    setSelfieFile(file);
    setSelfieUrl(null);
    setSelfiePreview(URL.createObjectURL(file));
    setResultUrl(null);
    setState('idle');
  }, []);

  const handleSelfieUrl = useCallback((url: string) => {
    setSelfieUrl(url);
    setSelfieFile(null);
    setSelfiePreview(url);
    setResultUrl(null);
    setState('idle');
  }, []);

  const handleNecklace = useCallback((file: File) => {
    setNecklaceFile(file);
    setNecklacePreview(URL.createObjectURL(file));
    setSelectedPreset('custom');
    setResultUrl(null);
    setState('idle');
  }, []);

  const reset = () => {
    setSelfieFile(null);
    setSelfieUrl(null);
    setSelfiePreview(null);
    setNecklaceFile(null);
    setNecklacePreview(null);
    setSelectedPreset('delicate_gold');
    setShadowIntensity(0.15);
    setAmbientLight(1.0);
    setResultUrl(null);
    setErrorMsg(null);
    setState('idle');
  };

  const handleApply = async () => {
    setState('loading');
    setErrorMsg(null);

    try {
      const form = new FormData();

      if (selfieFile) {
        form.append('selfiePhoto', selfieFile);
      } else if (selfieUrl) {
        form.append('selfieUrl', selfieUrl);
      }
      form.append('shadowIntensity', String(shadowIntensity));
      form.append('ambientLightIntensity', String(ambientLight));

      if (selectedPreset === 'custom' && necklaceFile) {
        form.append('necklacePhoto', necklaceFile);
      } else if (selectedPreset === 'custom' && necklaceUrlCustom) {
        form.append('necklaceUrl', necklaceUrlCustom);
      } else if (selectedPreset !== 'custom') {
        const preset = NECKLACE_PRESETS.find((p) => p.id === selectedPreset);
        if (!preset) throw new Error('No necklace selected.');
        form.append('necklaceUrl', preset.refUrl);
      } else {
        throw new Error('Please select or upload a necklace.');
      }

      const res  = await fetch('/api/necklace-vto', { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok || !data.ok) throw new Error(data.message ?? 'Necklace VTO failed.');
      if (typeof data.resultUrl !== 'string' || !data.resultUrl) throw new Error('Necklace try-on finished without returning a preview. Please try again.');
      setResultUrl(data.resultUrl as string);
      setIsMockResult(Boolean(data.mock));
      setState('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setErrorMsg(msg);
      setState('error');
    }
  };

  const activePreset = selectedPreset !== 'custom'
    ? NECKLACE_PRESETS.find((p) => p.id === selectedPreset)
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
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white">AI Necklace Try-On</h1>
            <p className="text-sm text-white/50 mt-0.5">Virtually wear any necklace before you buy it</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Controls ── */}
          <div className="space-y-5">
            <section className="p-5 rounded-3xl border border-white/10 space-y-3" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-white/50">Step 1 — Your Photo</p>
              <p className="text-xs text-white/40 leading-relaxed">Neck must be fully visible. Face forward (head rotation ≤ 20°). Upload a file or paste a direct HTTPS image link — skipping uses a sample.</p>
              <ImageInput
                onFileSelect={handleSelfie}
                onUrlSelect={handleSelfieUrl}
                onClear={() => { setSelfieFile(null); setSelfieUrl(null); setSelfiePreview(null); }}
                label="Upload selfie or paste an image link"
                hint="JPG / PNG · neck visible · max 10 MB"
              />
            </section>

            <section className="p-5 rounded-3xl border border-white/10 space-y-4" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-white/50">Step 2 — Choose Necklace</p>
              <div className="grid grid-cols-2 gap-3">
                {NECKLACE_PRESETS.map((preset) => (
                  <FX7TiltCard key={preset.id} maxDeg={8} className="cursor-pointer">
                    <button
                      onClick={() => { setSelectedPreset(preset.id); setNecklaceFile(null); setNecklacePreview(null); }}
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
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/80 bg-white/75 text-[var(--blue-600)] shadow-[var(--shadow-soft)]">
                          <Gem size={28} strokeWidth={1.5} />
                        </div>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preset.thumb} alt={preset.name} className="relative z-10 w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <span className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-semibold text-white px-1 leading-tight">{preset.name}</span>
                      {selectedPreset === preset.id && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[var(--sky-400)] flex items-center justify-center">
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4L3 6L7 2" stroke="#050B1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                      )}
                    </button>
                  </FX7TiltCard>
                ))}
              </div>
              <div className="border-t border-white/10 pt-3 space-y-2">
                <p className="text-xs font-semibold text-white/50">Or upload your own image / paste a direct HTTPS image link:</p>
                <ImageInput
                  onFileSelect={handleNecklace}
                  onUrlSelect={(url) => { setNecklaceFile(null); setNecklacePreview(url); setNecklaceUrlCustom(url); setSelectedPreset('custom'); }}
                  onClear={() => { setNecklaceFile(null); setNecklacePreview(null); setNecklaceUrlCustom(null); setSelectedPreset('delicate_gold'); }}
                  label="Necklace photo or direct image link"
                  hint="Front-facing, background removed preferred"
                />
              </div>
            </section>

            <section className="p-5 rounded-3xl border border-white/10 space-y-4" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-white/50">Step 3 — Lighting (optional)</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="shadowSlider" className="text-xs font-semibold text-white/70">Shadow intensity</label>
                    <span className="text-xs tabular-nums text-white/50">{shadowIntensity.toFixed(2)}</span>
                  </div>
                  <input id="shadowSlider" type="range" min={0} max={1} step={0.05} value={shadowIntensity}
                    onChange={(e) => setShadowIntensity(parseFloat(e.target.value))}
                    className="w-full accent-[var(--sky-400)]" aria-label="Shadow intensity" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="ambientSlider" className="text-xs font-semibold text-white/70">Ambient light</label>
                    <span className="text-xs tabular-nums text-white/50">{ambientLight.toFixed(2)}</span>
                  </div>
                  <input id="ambientSlider" type="range" min={0} max={1} step={0.05} value={ambientLight}
                    onChange={(e) => setAmbientLight(parseFloat(e.target.value))}
                    className="w-full accent-[var(--sky-400)]" aria-label="Ambient light intensity" />
                </div>
              </div>
            </section>

            <Button variant="primary" size="lg" leftIcon={<Sparkles size={18} />} onClick={handleApply} disabled={state === 'loading'} className="w-full">
              {state === 'loading' ? 'Placing necklace…' : 'Try On Necklace'}
            </Button>
            {state === 'error' && errorMsg && (
              <div role="alert" className="p-4 rounded-2xl border border-[var(--danger)]/30 text-sm text-[var(--danger)]" style={{ background: 'rgba(229,72,77,0.1)' }}>{errorMsg}</div>
            )}
          </div>

          {/* ── Result ── */}
          <div className="space-y-4">
            {state === 'loading' && (
              <div className="rounded-3xl overflow-hidden aspect-[3/4] bg-[var(--navy-950)] flex items-center justify-center">
                <FX5WeavingLoader personUrl={selfiePreview ?? undefined} />
              </div>
            )}
            {state === 'success' && resultUrl && (
              <div className="space-y-3">
              {isMockResult && <DemoPreviewNotice />}
              <FX6CurtainReveal>
                <div className="rounded-3xl overflow-hidden aspect-[3/4]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resultUrl} alt="Necklace try-on result" className="w-full h-full object-cover" />
                </div>
              </FX6CurtainReveal>
              </div>
            )}
            {(state === 'idle' || state === 'error') && (
              <div className="rounded-3xl border-2 border-dashed border-white/10 aspect-[3/4] flex flex-col items-center justify-center gap-3 text-center p-6">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Gem size={30} className="text-[var(--blue-600)]" />
                </div>
                <p className="text-sm font-semibold text-white/70">Result appears here</p>
                <p className="text-xs text-white/40 max-w-xs">Select a necklace and tap <strong>Try On Necklace</strong> to see it on you.</p>
                {activePreset && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-white/10 border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activePreset.thumb} alt={activePreset.name} className="w-8 h-8 rounded-lg object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }} />
                    <span className="text-xs font-semibold text-white">{activePreset.name}</span>
                  </div>
                )}
              </div>
            )}
            {state === 'success' && resultUrl && (
              <div className="flex gap-3">
                <a href={resultUrl} download="mirror_moment_necklace.jpg" className="flex-1">
                  <Button variant="primary" size="md" leftIcon={<Download size={16} />} className="w-full">Download</Button>
                </a>
                <Button variant="secondary" size="md" leftIcon={<RotateCcw size={16} />} onClick={reset}>Reset</Button>
              </div>
            )}
            <div className="p-3 rounded-2xl border border-white/10 text-xs text-white/40 leading-relaxed space-y-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p><strong className="text-white/70">Best selfie tips:</strong></p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Neck fully visible and clear of hair or clothing</li>
                <li>Face forward — head rotation within 20°</li>
                <li>Neck width at least 15% of total image width</li>
                <li>Even lighting, no strong shadows on neck area</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
