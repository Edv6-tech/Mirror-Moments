'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon,
  Heart,
  Download,
  Plus,
  Sparkles,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import clsx from 'clsx';
import { Button, Chip } from '@/components/ui';
import FX7TiltCard from '@/components/effects/FX7TiltCard';

interface LookItem {
  id: string;
  category: string;
  name: string;
  resultImage: string;
  date: string;
  isFavourite: boolean;
}

export default function LooksPage() {
  const [looks, setLooks] = useState<LookItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'favourites'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingFavourite, setSavingFavourite] = useState<string | null>(null);
  const [deletingLook, setDeletingLook] = useState<string | null>(null);

  const loadLooks = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/looks', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.ok || !Array.isArray(data.looks)) throw new Error(data.message || 'Saved looks could not be loaded.');
      setLooks(data.looks);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Saved looks could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => { void loadLooks(); }, [loadLooks]);

  const toggleFavourite = async (look: LookItem) => {
    setSavingFavourite(look.id);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/looks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: look.id, isFavourite: !look.isFavourite }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'Favourite could not be saved.');
      setLooks((previous) => previous.map((item) => item.id === look.id ? { ...item, isFavourite: !item.isFavourite } : item));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Favourite could not be saved.');
    } finally {
      setSavingFavourite(null);
    }
  };

  const deleteLook = async (look: LookItem) => {
    if (!window.confirm(`Delete “${look.name}” from your Looks Gallery?`)) return;
    setDeletingLook(look.id);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/looks?id=${encodeURIComponent(look.id)}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'Saved look could not be deleted.');
      setLooks((previous) => previous.filter((item) => item.id !== look.id));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Saved look could not be deleted.');
    } finally {
      setDeletingLook(null);
    }
  };

  const filtered = looks.filter((l) =>
    filter === 'favourites' ? l.isFavourite : true
  );

  return (
    <div className="app-page-atmosphere max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
        <div>
          <p className="app-page-kicker mb-2"><Sparkles size={13} /> Your style archive</p>
          <h1 className="app-page-title font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--ink-900)]">
            Looks Gallery
          </h1>
          <p className="text-sm text-[var(--ink-500)] mt-1">
            Generated try-on looks, occasion shortlists and style experiments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/app/studio">
            <Button variant="primary" size="md" leftIcon={<Plus size={16} />}>
              Create Look
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={clsx(
              'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
              filter === 'all'
                ? 'bg-dashboard-gradient text-white shadow-sm'
                : 'bg-white text-[var(--ink-500)] border border-[var(--line)] hover:text-[var(--ink-900)]'
            )}
            aria-pressed={filter === 'all'}
          >
            All Looks ({looks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('favourites')}
            className={clsx(
              'px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5',
              filter === 'favourites'
                ? 'bg-dashboard-gradient text-white shadow-sm'
                : 'bg-white text-[var(--ink-500)] border border-[var(--line)] hover:text-[var(--ink-900)]'
            )}
            aria-pressed={filter === 'favourites'}
          >
            <Heart size={13} className={filter === 'favourites' ? 'fill-white' : ''} />
            <span>Favourites</span>
          </button>
        </div>

        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 border border-[var(--line)] text-xs text-[var(--ink-500)] font-semibold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[var(--blue-600)]" />
          Showing {filtered.length} {filtered.length === 1 ? 'look' : 'looks'}
        </span>
      </div>

      {errorMessage && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-[var(--danger)]/30 bg-white p-4 text-sm text-[var(--danger)] sm:flex-row sm:items-center sm:justify-between">
          <span>{errorMessage}</span>
          <Button variant="secondary" size="sm" onClick={() => void loadLooks()} leftIcon={<RefreshCw size={14} />}>Try again</Button>
        </div>
      )}

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Loading saved looks" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => <div key={index} className="aspect-[3/4] rounded-3xl bg-[var(--ice-100)] animate-pulse" />)}
        </div>
      ) : errorMessage && looks.length === 0 ? null : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((look) => (
            <FX7TiltCard key={look.id} maxDeg={6} className="h-full">
              <div
                className="app-lift-card group relative h-full rounded-3xl glass-surface-light border border-white/80 overflow-hidden shadow-sm flex flex-col"
              >
                {/* 3:4 Aspect Image Ratio */}
                <div className="relative aspect-[3/4] bg-[var(--pearl-50)] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={look.resultImage}
                    alt={look.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Top Right: Favourite Toggle */}
                  <button
                    type="button"
                    onClick={() => void toggleFavourite(look)}
                    title={look.isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                    aria-label={look.isFavourite ? `Remove ${look.name} from favourites` : `Add ${look.name} to favourites`}
                    disabled={savingFavourite === look.id}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full glass-surface-light border border-white/80 flex items-center justify-center text-[var(--ink-900)] hover:scale-110 active:scale-95 transition-all shadow-sm"
                  >
                    <Heart
                      size={18}
                      className={clsx(
                        look.isFavourite
                          ? 'fill-[var(--danger)] text-[var(--danger)]'
                          : 'text-[var(--ink-900)]'
                      )}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => void deleteLook(look)}
                    title="Delete look"
                    aria-label={`Delete ${look.name}`}
                    disabled={deletingLook === look.id}
                    className="absolute top-3 left-3 w-9 h-9 rounded-full glass-surface-light border border-white/80 flex items-center justify-center text-[var(--danger)] hover:scale-110 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* Look label */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white/90 text-[var(--ink-900)] shadow-sm backdrop-blur">
                      {look.name} · {look.category}
                    </span>
                  </div>

                  {/* Hover Download Button */}
                  <a
                    href={look.resultImage}
                    download="mirror-moment-look.jpg"
                    title="Download look"
                    className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-dashboard-gradient text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 shadow-md"
                  >
                    <Download size={16} />
                  </a>
                </div>
              </div>
            </FX7TiltCard>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="app-empty-state py-20 text-center space-y-4 rounded-3xl glass-surface-light border border-white">
          <div className="app-empty-icon w-16 h-16 mx-auto rounded-2xl bg-[var(--ice-100)] text-[var(--blue-600)] flex items-center justify-center shadow-sm">
            <ImageIcon size={32} />
          </div>
          <h2 className="font-display text-2xl text-[var(--ink-900)]">
            No looks saved yet
          </h2>
          <p className="text-sm text-[var(--ink-500)] max-w-sm mx-auto">
            Try on any dress in the Studio to generate your first occasion look.
          </p>
          <div className="pt-2">
            <Link href="/app/studio">
              <Button variant="primary" size="md" leftIcon={<Sparkles size={16} />}>
                Open the Studio
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
