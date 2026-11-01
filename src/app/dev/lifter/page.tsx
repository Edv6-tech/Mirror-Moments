'use client';
import { useState } from 'react';
import { useDressLifter } from '@/lib/dress-lifter';
import { Button } from '@/components/ui/Button';
import { Dropzone } from '@/components/ui/Dropzone';
import { GlassCard } from '@/components/ui/GlassCard';

export default function LifterDevPage() {
  const { lift, progress, isLifting, error } = useDressLifter();
  const [result, setResult] = useState<{
    transparentUrl: string;
    whiteUrl: string;
    coverage: number;
    wornDetected: boolean;
  } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [timing, setTiming] = useState<number | null>(null);

  const handleLift = async () => {
    if (!file) return;
    const start = Date.now();
    try {
      const r = await lift(file);
      setTiming(Date.now() - start);
      setResult(r);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--pearl-50)] p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="font-display text-4xl text-[var(--ink-900)]">Dress Lifter Dev</h1>

      <GlassCard variant="light" className="space-y-4">
        <Dropzone
          onFileSelect={setFile}
          label="Drop a dress photo"
          hint="JPG or PNG, up to 10 MB"
          accept="image/jpeg,image/png"
          maxSizeMb={10}
        />
        <Button
          onClick={handleLift}
          disabled={!file || isLifting}
          isLoading={isLifting}
          loadingText={progress?.stage ?? 'Lifting…'}
        >
          Lift Dress
        </Button>

        {/* Progress bar */}
        {isLifting && progress && (
          <div
            className="w-full bg-[var(--line)] rounded-full h-2"
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={progress.stage}
          >
            <div
              className="bg-[var(--blue-600)] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        )}

        {error && (
          <p role="alert" className="text-[var(--danger)] text-sm">
            {error}
          </p>
        )}
      </GlassCard>

      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <GlassCard variant="light">
            <p className="text-sm font-semibold mb-2 text-[var(--ink-900)]">Transparent PNG</p>
            {/* Checkerboard background shows transparency */}
            <img
              src={result.transparentUrl}
              alt="Lifted dress with transparent background"
              className="w-full rounded-xl"
              style={{
                background:
                  'repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 0 0 / 20px 20px',
              }}
            />
          </GlassCard>

          <GlassCard variant="light">
            <p className="text-sm font-semibold mb-2 text-[var(--ink-900)]">White background</p>
            <img
              src={result.whiteUrl}
              alt="Lifted dress on white background"
              className="w-full rounded-xl"
            />
          </GlassCard>

          <GlassCard variant="light" className="sm:col-span-2">
            <dl className="text-sm font-mono space-y-1 text-[var(--ink-900)]">
              <div>
                <dt className="inline font-semibold">Coverage: </dt>
                <dd className="inline">{(result.coverage * 100).toFixed(1)}%</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Worn detected: </dt>
                <dd className="inline">{String(result.wornDetected)}</dd>
              </div>
              {timing !== null && (
                <div>
                  <dt className="inline font-semibold">Time: </dt>
                  <dd className="inline">{(timing / 1000).toFixed(1)}s</dd>
                </div>
              )}
              {result.coverage < 0.08 && (
                <div className="text-[var(--danger)]">
                  ⚠ Low coverage — fallback mode would activate
                </div>
              )}
            </dl>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
