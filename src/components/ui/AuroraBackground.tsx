'use client';

import React from 'react';
import clsx from 'clsx';

export interface AuroraBackgroundProps {
  variant?: 'light' | 'dark';
  children?: React.ReactNode;
  className?: string;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  variant = 'light',
  children,
  className,
}) => {
  const isDark = variant === 'dark';

  return (
    <div
      className={clsx(
        'relative w-full min-h-screen overflow-hidden',
        isDark ? 'bg-[var(--navy-950)] text-white' : 'bg-[var(--pearl-50)] text-[var(--ink-900)]',
        className
      )}
    >
      {/* Aurora Silk Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-75">
        {/* Blob 1: Sky 400 */}
        <div
          className={clsx(
            'absolute w-[500px] h-[500px] rounded-full blur-[100px] -top-20 -left-20 animate-pulse',
            isDark ? 'bg-[var(--sky-400)]/15' : 'bg-[var(--sky-400)]/20'
          )}
          style={{ animationDuration: '30s' }}
        />

        {/* Blob 2: Blue 600 */}
        <div
          className={clsx(
            'absolute w-[600px] h-[600px] rounded-full blur-[120px] top-1/3 -right-32',
            isDark ? 'bg-[var(--blue-700)]/25' : 'bg-[var(--blue-500)]/15'
          )}
          style={{ animationDuration: '35s' }}
        />

        {/* Blob 3: Soft Pearl / Ice */}
        <div
          className={clsx(
            'absolute w-[450px] h-[450px] rounded-full blur-[90px] -bottom-20 left-1/4',
            isDark ? 'bg-[var(--sky-400)]/10' : 'bg-[var(--ice-100)]'
          )}
          style={{ animationDuration: '28s' }}
        />
      </div>

      {/* Subtle Noise / Film Grain Texture Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
