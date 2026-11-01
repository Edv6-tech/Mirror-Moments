'use client';

import React, { useEffect } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop: Navy 60% with blur */}
      <div
        className="fixed inset-0 bg-[#050b1f]/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet / Dialog Container */}
      <div
        className={clsx(
          'relative w-full max-w-lg z-10',
          // Desktop: centered glass sheet, radius 28
          'sm:rounded-[28px] sm:glass-surface-light sm:shadow-[var(--shadow-lifted)] p-6',
          // Mobile: bottom sheet with rounded top corners
          'rounded-t-[28px] bg-white sm:bg-white/80 p-6 max-h-[85vh] overflow-y-auto',
          'animate-in fade-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300',
          className
        )}
      >
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--line)]/60">
          {title && (
            <h2 id="modal-title" className="text-xl font-semibold text-[var(--ink-900)]">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full text-[var(--ink-500)] hover:text-[var(--ink-900)] hover:bg-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sky-400)] ml-auto"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
};
