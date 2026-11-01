'use client';

import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Upload, X, RefreshCw } from 'lucide-react';
import { Chip } from './Chip';
import { Button } from './Button';

export interface DropzoneProps {
  onFileSelect?: (file: File) => void;
  variant?: 'light' | 'dark';
  accept?: string;
  maxSizeMb?: number;
  label?: string;
  hint?: string;
  className?: string;
  previewUrl?: string | null;
  onClear?: () => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFileSelect,
  variant = 'light',
  accept = 'image/jpeg,image/png,image/webp',
  maxSizeMb = 10,
  label = 'Drop a photo here or browse',
  hint = 'JPG or PNG, up to 10 MB',
  className,
  previewUrl: initialPreviewUrl,
  onClear,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl ?? null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialPreviewUrl !== undefined) setPreviewUrl(initialPreviewUrl);
  }, [initialPreviewUrl]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    const acceptedTypes = accept.split(',').map((type) => type.trim().toLowerCase()).filter(Boolean);
    const matchesAccept = acceptedTypes.some((type) =>
      type.endsWith('/*') ? file.type.toLowerCase().startsWith(type.slice(0, -1)) : file.type.toLowerCase() === type
    );
    if (!matchesAccept) {
      const acceptedLabels = acceptedTypes.map((type) => type.replace('image/', '').toUpperCase()).join(' or ');
      setErrorMsg(`Please choose a supported image format${acceptedLabels ? ` (${acceptedLabels})` : ''}.`);
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setErrorMsg(`That photo is over ${maxSizeMb} MB. Try a smaller one.`);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFileInfo({
      name: file.name,
      size: formatFileSize(file.size),
    });
    onFileSelect?.(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setFileInfo(null);
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = '';
    onClear?.();
  };

  const isDark = variant === 'dark';

  return (
    <div className={clsx('w-full flex flex-col gap-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
          }
        }}
      />

      {previewUrl ? (
        <div
          className={clsx(
            'relative w-full rounded-[28px] overflow-hidden p-4 flex flex-col items-center justify-center border transition-all duration-300',
            isDark
              ? 'bg-[var(--glass-dark-bg)] border-[var(--glass-dark-border)] text-white'
              : 'bg-[var(--pearl-50)] border-[var(--line)] text-[var(--ink-900)]'
          )}
        >
          {/* Preview Image with rounded corners */}
          <div className="relative w-full max-h-[380px] rounded-[20px] overflow-hidden flex items-center justify-center bg-black/10">
            <img src={previewUrl} alt="Upload preview" className="max-h-[360px] w-auto object-contain rounded-[20px]" />
            <button
              onClick={handleClear}
              aria-label="Remove photo"
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
            >
              <X size={18} />
            </button>
          </div>

          {/* Metadata chip & replace action */}
          <div className="flex items-center justify-between w-full mt-4 px-2">
            {fileInfo && <Chip label={`${fileInfo.name} · ${fileInfo.size}`} />}
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          tabIndex={0}
          role="button"
          aria-label={label}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={clsx(
            'relative w-full min-h-[220px] rounded-[28px] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 select-none',
            'border-2 border-dashed',
            isDark
              ? isDragOver
                ? 'border-[var(--sky-400)] bg-white/10'
                : 'border-[var(--sky-400)]/40 bg-[var(--navy-900)]/50 text-white hover:border-[var(--sky-400)] hover:bg-white/5'
              : isDragOver
              ? 'border-[var(--blue-500)] bg-[var(--ice-100)]'
              : 'border-[var(--blue-500)]/40 bg-[var(--ice-100)]/50 text-[var(--ink-900)] hover:border-[var(--blue-500)] hover:bg-[var(--ice-100)]/80',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sky-400)]/30'
          )}
        >
          {/* Centered 64px Upload Icon with breathing glow */}
          <div
            className={clsx(
              'w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-transform duration-300',
              isDark ? 'bg-white/10 text-[var(--sky-400)]' : 'bg-white text-[var(--blue-600)] shadow-[var(--shadow-soft)]',
              isDragOver && 'scale-110 shadow-[var(--shadow-glow)]'
            )}
          >
            <Upload size={28} />
          </div>

          <div className="font-semibold text-[16px] mb-1">{label}</div>
          <div className={clsx('text-[13px]', isDark ? 'text-gray-300' : 'text-[var(--ink-500)]')}>
            {hint}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="text-[13px] text-[var(--danger)] px-2 font-medium">
          {errorMsg}
        </div>
      )}
    </div>
  );
};
