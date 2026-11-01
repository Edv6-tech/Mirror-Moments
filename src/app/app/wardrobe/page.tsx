'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shirt,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  Upload,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';
import { Button, Chip, GlassCard, Modal } from '@/components/ui';
import FX7TiltCard from '@/components/effects/FX7TiltCard';

interface WardrobeItem {
  id: string;
  name: string;
  image: string;
  date: string;
  price?: string;
  storeUrl?: string;
}

const INITIAL_WARDROBE: WardrobeItem[] = [];

export default function WardrobePage() {
  const [dresses, setDresses] = useState<WardrobeItem[]>(INITIAL_WARDROBE);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<WardrobeItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadWardrobe = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await fetch('/api/wardrobe/list');
      const data = await response.json();
      if (!response.ok || !data.ok || !Array.isArray(data.items)) {
        throw new Error(data.message || 'Your wardrobe could not be loaded.');
      }
      setDresses(data.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        image: item.whiteUrl || item.transparentUrl,
        date: new Date(item.createdAt).toLocaleDateString(),
      })));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Your wardrobe could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => { void loadWardrobe(); }, [loadWardrobe]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const res = await fetch('/api/wardrobe/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.ok && Array.isArray(data.items)) {
        const mapped = data.items.map((it: any) => ({
          id: it.id,
          name: it.name,
          image: it.whiteUrl || it.transparentUrl,
          date: 'Just added',
        }));
        setDresses((prev) => [...mapped, ...prev]);
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading garments');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filtered = dresses.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/wardrobe/delete?id=${encodeURIComponent(deleteTarget.id)}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'The wardrobe item could not be deleted.');
      setDresses((previous) => previous.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'The wardrobe item could not be deleted.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="app-page-atmosphere max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
        <div>
          <p className="app-page-kicker mb-2"><Sparkles size={13} /> Your saved pieces</p>
          <div className="flex items-center gap-3">
          <h1 className="app-page-title font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--ink-900)]">
            Wardrobe
          </h1>
          <Chip label={isLoading ? 'Loading…' : `${dresses.length} saved`} variant="ice" />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-500)]"
            />
            <input
              type="text"
              placeholder="Search wardrobe…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[44px] pl-10 pr-4 rounded-xl bg-white border border-[var(--line)] text-sm text-[var(--ink-900)] placeholder-[var(--ink-500)] focus:outline-none focus:border-[var(--blue-500)]"
            />
          </div>

          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/jpg"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <Button
            variant="secondary"
            size="md"
            isLoading={isUploading}
            loadingText="Uploading…"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Upload size={16} />}
          >
            Upload
          </Button>

          <Link href="/app/studio">
            <Button variant="primary" size="md" leftIcon={<Plus size={16} />}>
              Add Dress
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Grid of Dress Cards ── */}
      {loadError ? (
        <div role="alert" className="app-empty-state rounded-3xl border border-[var(--line)] p-10 text-center space-y-4 shadow-[var(--shadow-soft)]">
          <div className="app-empty-icon w-14 h-14 mx-auto rounded-2xl bg-[var(--ice-100)] text-[var(--danger)] flex items-center justify-center"><AlertCircle size={26} /></div>
          <h2 className="font-display text-2xl font-semibold text-[var(--ink-900)]">We couldn&apos;t open your wardrobe</h2>
          <p className="text-sm text-[var(--ink-500)] max-w-md mx-auto">{loadError}</p>
          <Button variant="secondary" size="md" onClick={() => void loadWardrobe()} leftIcon={<RefreshCw size={15} />}>Try again</Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6" aria-label="Loading wardrobe" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="rounded-3xl overflow-hidden border border-[var(--line)] bg-white shadow-[var(--shadow-soft)]">
              <div className="aspect-[4/5] bg-[var(--ice-100)] animate-pulse" />
              <div className="p-4 space-y-2"><div className="h-3 w-2/3 rounded-full bg-[var(--ice-100)] animate-pulse" /><div className="h-2 w-1/3 rounded-full bg-[var(--ice-100)] animate-pulse" /></div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((item) => (
            <FX7TiltCard key={item.id} maxDeg={6} className="h-full">
              <div
                className="app-lift-card group relative h-full rounded-3xl glass-surface-light border border-white/80 overflow-hidden shadow-sm flex flex-col justify-between"
              >
                {/* Image area with pearl pedestal */}
                <div className="relative aspect-[4/5] bg-[var(--pearl-50)] p-4 flex items-center justify-center overflow-hidden">
                  {/* Soft Pedestal Ellipse */}
                  <div
                    aria-hidden="true"
                    className="absolute bottom-4 w-3/4 h-8 rounded-[100%] bg-[var(--ice-100)] blur-sm"
                  />

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="relative z-10 max-h-full object-contain transform group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
                  />

                  {/* Hover slide-up action bar */}
                  <div className="absolute inset-x-3 bottom-3 z-20 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-between gap-1.5 p-1.5 rounded-2xl glass-surface-light border border-white/80 shadow-md">
                    <Link href={`/app/studio?dress=${item.id}`} className="flex-1">
                      <Button variant="primary" size="sm" className="w-full text-xs">
                        Try On
                      </Button>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      title="Delete dress"
                      aria-label={`Delete ${item.name} from your wardrobe`}
                      className="p-2 rounded-xl text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Card Meta Footer */}
                <div className="p-4 bg-white/50 border-t border-[var(--line)]/50">
                  <h3 className="font-semibold text-sm text-[var(--ink-900)] truncate">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between mt-1 text-xs text-[var(--ink-500)]">
                    <span>{item.date}</span>
                    {item.storeUrl && (
                      <a
                        href={item.storeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[var(--blue-600)] transition-colors flex items-center gap-0.5"
                      >
                        <span>Store</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </FX7TiltCard>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="app-empty-state py-16 text-center space-y-4 rounded-3xl glass-surface-light border border-white">
          <div className="app-empty-icon w-16 h-16 mx-auto rounded-2xl bg-[var(--ice-100)] text-[var(--blue-600)] flex items-center justify-center shadow-sm">
            <Shirt size={32} />
          </div>
          <h2 className="font-display text-2xl text-[var(--ink-900)]">
            No dresses found
          </h2>
          <p className="text-sm text-[var(--ink-500)] max-w-sm mx-auto">
            {search
              ? 'Try another search term or clear the filter.'
              : 'Lift your first dress from any photo to start your wardrobe collection.'}
          </p>
          <div className="pt-2">
            <Link href="/app/studio">
              <Button variant="primary" size="md">
                Lift Your First Dress
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete this dress?"
      >
        <div className="space-y-6">
          <p className="text-sm text-[var(--ink-500)] leading-relaxed">
            Are you sure you want to remove &quot;{deleteTarget?.name}&quot; from your wardrobe? Looks you made with it will stay in your gallery.
          </p>
          {deleteError && <p role="alert" className="text-sm text-[var(--danger)]">{deleteError}</p>}
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              size="md"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={() => void handleDelete()} isLoading={isDeleting} loadingText="Deleting…">
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
