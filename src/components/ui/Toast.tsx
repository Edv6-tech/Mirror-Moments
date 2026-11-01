'use client';

import React, { useEffect } from 'react';
import clsx from 'clsx';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id?: string;
  message: string;
  type?: ToastType;
  isOpen: boolean;
  onClose: () => void;
  durationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  isOpen,
  onClose,
  durationMs = 5000,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [isOpen, durationMs, onClose]);

  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle2 size={16} className="text-[var(--success)]" />,
    error: <AlertCircle size={16} className="text-[var(--danger)]" />,
    info: <Info size={16} className="text-[var(--blue-600)]" />,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        'fixed top-6 left-1/2 -translate-x-1/2 z-50',
        'glass-surface-light rounded-full px-5 py-2.5',
        'flex items-center gap-2.5 shadow-[var(--shadow-lifted)]',
        'animate-in fade-in slide-in-from-top-4 duration-300'
      )}
    >
      {icons[type]}
      <span className="text-[14px] font-semibold text-[var(--ink-900)] whitespace-nowrap">
        {message}
      </span>
      <button
        onClick={onClose}
        aria-label="Dismiss toast"
        className="ml-2 text-[var(--ink-500)] hover:text-[var(--ink-900)] transition-colors p-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sky-400)]"
      >
        <X size={14} />
      </button>
    </div>
  );
};
