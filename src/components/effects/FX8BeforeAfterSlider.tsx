'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import clsx from 'clsx';

export interface FX8BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  className?: string;
}

export default function FX8BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  className,
}: FX8BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50); // 0–100
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Check reduced motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const clampedPos = Math.min(100, Math.max(0, position));
  const beforeImageWidth = `${10000 / Math.max(clampedPos, 1)}%`;

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }, []);

  // Mouse
  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    e.preventDefault();
  };
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      updatePosition(e.clientX);
    };
    const onMouseUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [updatePosition]);

  // Touch
  const onTouchStart = () => { dragging.current = true; };
  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      updatePosition(e.touches[0].clientX);
    };
    const onTouchEnd = () => { dragging.current = false; };
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [updatePosition]);

  // Keyboard: arrow keys move 1%
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setPosition((p) => Math.max(0, p - 1));
    if (e.key === 'ArrowRight') setPosition((p) => Math.min(100, p + 1));
  };

  // Reduced motion: side by side
  if (reducedMotion) {
    return (
      <div className={clsx('flex gap-2 rounded-[24px] overflow-hidden', className)}>
        <div className="relative flex-1 aspect-[3/4] bg-[var(--ice-100)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={beforeSrc} alt={beforeAlt} className="w-full h-full object-cover" />
          <span className="absolute bottom-3 left-3 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full font-semibold">Before</span>
        </div>
        <div className="relative flex-1 aspect-[3/4] bg-[var(--ice-100)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={afterSrc} alt={afterAlt} className="w-full h-full object-cover" />
          <span className="absolute bottom-3 right-3 bg-[var(--blue-600)]/80 text-white text-xs px-2 py-0.5 rounded-full font-semibold">After</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative select-none overflow-hidden rounded-[24px] aspect-[3/4] bg-[var(--ice-100)] cursor-ew-resize',
        className
      )}
      aria-label="Before and after comparison slider"
    >
      {/* Generated try-on result */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={afterSrc} alt={afterAlt} className="h-full w-full object-cover" draggable={false} />
      </div>

      {/* Before (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${clampedPos}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeSrc}
          alt={beforeAlt}
          className="absolute inset-y-0 left-0 h-full object-cover object-center"
          style={{ width: beforeImageWidth, maxWidth: 'none' }}
          draggable={false}
        />
      </div>

      {/* Divider */}
      <div
        className="absolute top-0 bottom-0 w-[3px] bg-white shadow-[0_0_0_1px_rgba(56,189,248,0.5),0_0_20px_rgba(56,189,248,0.6)]"
        style={{ left: `calc(${clampedPos}% - 1.5px)` }}
      >
        {/* Handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-[0_0_0_3px_rgba(56,189,248,0.6),0_0_20px_rgba(56,189,248,0.8)] flex items-center justify-center cursor-ew-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sky-400)]"
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onKeyDown={onKeyDown}
          tabIndex={0}
          role="slider"
          aria-label="Drag to compare before and after"
          aria-valuenow={Math.round(clampedPos)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M5 4L1 8L5 12" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11 4L15 8L11 12" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <span className="absolute bottom-3 left-3 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full font-semibold pointer-events-none">Before</span>
      <span className="absolute bottom-3 right-3 bg-[var(--blue-600)]/80 text-white text-xs px-2 py-0.5 rounded-full font-semibold pointer-events-none">After</span>

      {/* Invisible range input overlay for additional accessibility */}
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(clampedPos)}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
