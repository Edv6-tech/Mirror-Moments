'use client';

import React, { useRef, useState, useCallback } from 'react';
import clsx from 'clsx';
import { Upload, Link as LinkIcon, X, RefreshCw, Image as ImageIcon } from 'lucide-react';

export interface ImageInputProps {
  /** Called when a File is chosen */
  onFileSelect?: (file: File) => void;
  /** Called when a URL is confirmed */
  onUrlSelect?: (url: string) => void;
  /** Called when the user clears the input */
  onClear?: () => void;
  accept?: string;
  maxSizeMb?: number;
  label?: string;
  hint?: string;
  /** Show URL tab by default? */
  defaultMode?: 'upload' | 'url';
  className?: string;
}

/**
 * Dual-mode image input: file upload (drag & drop / browse) OR paste a URL.
 * Replaces the old Dropzone for all reference-image fields.
 */
export const ImageInput: React.FC<ImageInputProps> = ({
  onFileSelect,
  onUrlSelect,
  onClear,
  accept = 'image/jpeg,image/png',
  maxSizeMb = 10,
  label = 'Drop a photo or paste a URL',
  hint = 'JPG or PNG · up to 10 MB',
  defaultMode = 'upload',
  className,
}) => {
  const [mode,        setMode]        = useState<'upload' | 'url'>(defaultMode);
  const [isDragOver,  setIsDragOver]  = useState(false);
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);
  const [fileName,    setFileName]    = useState<string | null>(null);
  const [urlDraft,    setUrlDraft]    = useState('');
  const [urlError,    setUrlError]    = useState<string | null>(null);
  const [fileError,   setFileError]   = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const clear = useCallback(() => {
    setPreviewUrl(null);
    setFileName(null);
    setUrlDraft('');
    setUrlError(null);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = '';
    onClear?.();
  }, [onClear]);

  const processFile = useCallback((file: File) => {
    setFileError(null);
    const acceptedTypes = accept.split(',').map((type) => type.trim().toLowerCase()).filter(Boolean);
    const matchesAccept = acceptedTypes.some((type) =>
      type.endsWith('/*') ? file.type.toLowerCase().startsWith(type.slice(0, -1)) : file.type.toLowerCase() === type
    );
    if (!matchesAccept) {
      const acceptedLabels = acceptedTypes.map((type) => type.replace('image/', '').toUpperCase()).join(' or ');
      setFileError(`Please choose a supported image format${acceptedLabels ? ` (${acceptedLabels})` : ''}.`);
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setFileError(`File exceeds ${maxSizeMb} MB limit.`);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setFileName(file.name);
    onFileSelect?.(file);
  }, [accept, maxSizeMb, onFileSelect]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const confirmUrl = () => {
    const trimmed = urlDraft.trim();
    setUrlError(null);
    if (!trimmed) { setUrlError('Please enter a URL.'); return; }
    let parsedUrl: URL;
    try { parsedUrl = new URL(trimmed); } catch {
      setUrlError('That doesn\'t look like a valid URL.');
      return;
    }
    if (parsedUrl.protocol !== 'https:' || parsedUrl.username || parsedUrl.password) {
      setUrlError('Use a secure HTTPS link to an image.');
      return;
    }
    setPreviewUrl(trimmed);
    setFileName(null);
    onUrlSelect?.(trimmed);
  };

  // ── Committed state (file or URL chosen) ──────────────────────────────────
  if (previewUrl) {
    return (
      <div className={clsx('w-full', className)}>
        <div className="relative rounded-2xl overflow-hidden border border-[var(--line)] bg-[var(--pearl-50)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Selected image preview"
            className="w-full max-h-64 object-contain bg-[var(--ice-100)]"
          />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button
              onClick={() => { setPreviewUrl(null); setFileName(null); inputRef.current?.click(); }}
              aria-label="Replace image"
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
            >
              <RefreshCw size={13} />
            </button>
            <button
              onClick={clear}
              aria-label="Remove image"
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </div>
        {fileName && (
          <p className="mt-1.5 text-[11px] text-[var(--ink-500)] truncate px-1">{fileName}</p>
        )}
        {!fileName && (
          <p className="mt-1.5 text-[11px] text-[var(--ink-500)] truncate px-1">URL image loaded</p>
        )}
        {/* Hidden file input for replace */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
        />
      </div>
    );
  }

  // ── Empty state — tabs ─────────────────────────────────────────────────────
  return (
    <div className={clsx('w-full space-y-2', className)}>
      {/* Mode tabs */}
      <div className="flex rounded-xl overflow-hidden border border-[var(--line)] divide-x divide-[var(--line)] text-xs font-semibold">
        <button
          onClick={() => setMode('upload')}
          aria-pressed={mode === 'upload'}
          className={clsx(
            'flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors',
            mode === 'upload'
              ? 'bg-[var(--blue-600)] text-white'
              : 'bg-white text-[var(--ink-500)] hover:bg-[var(--ice-100)]'
          )}
        >
          <Upload size={13} /> Upload file
        </button>
        <button
          onClick={() => setMode('url')}
          aria-pressed={mode === 'url'}
          className={clsx(
            'flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors',
            mode === 'url'
              ? 'bg-[var(--blue-600)] text-white'
              : 'bg-white text-[var(--ink-500)] hover:bg-[var(--ice-100)]'
          )}
        >
          <LinkIcon size={13} /> Paste URL
        </button>
      </div>

      {/* Upload tab */}
      {mode === 'upload' && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
          />
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            tabIndex={0}
            role="button"
            aria-label={label}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
            className={clsx(
              'relative w-full min-h-[160px] rounded-[20px] flex flex-col items-center justify-center p-5 text-center cursor-pointer transition-all duration-200 select-none',
              'border-2 border-dashed',
              isDragOver
                ? 'border-[var(--blue-500)] bg-[var(--ice-100)]'
                : 'border-[var(--blue-500)]/40 bg-[var(--ice-100)]/50 hover:border-[var(--blue-500)] hover:bg-[var(--ice-100)]/80',
              'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sky-400)]/30'
            )}
          >
            <div className={clsx(
              'w-12 h-12 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm transition-transform',
              isDragOver && 'scale-110'
            )}>
              <Upload size={22} className="text-[var(--blue-600)]" />
            </div>
            <p className="font-semibold text-sm text-[var(--ink-900)]">{label}</p>
            <p className="text-xs text-[var(--ink-500)] mt-0.5">{hint}</p>
          </div>
          {fileError && <p className="text-xs text-[var(--danger)] px-1">{fileError}</p>}
        </>
      )}

      {/* URL tab */}
      {mode === 'url' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <ImageIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-500)]" />
              <input
                type="url"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmUrl(); }}
                placeholder="https://example.com/image.jpg"
                aria-label="Image URL"
                className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border border-[var(--line)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)] text-[var(--ink-900)] placeholder:text-[var(--ink-500)]/60"
              />
            </div>
            <button
              onClick={confirmUrl}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-[var(--blue-600)] text-white hover:bg-[var(--blue-700)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--blue-500)]"
            >
              Load
            </button>
          </div>
          {urlError && <p className="text-xs text-[var(--danger)] px-1">{urlError}</p>}
          <p className="text-xs text-[var(--ink-500)] px-1">
            Paste a direct link to any publicly accessible image. The URL is sent to our server — never the browser.
          </p>
        </div>
      )}
    </div>
  );
};
