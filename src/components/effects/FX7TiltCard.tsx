'use client';

import React, { useRef, useCallback } from 'react';
import clsx from 'clsx';

/**
 * FX-7 Tilt Card
 * BUILD_GUIDE §B8: 6° tilt with moving specular highlight.
 * Respects prefers-reduced-motion — falls back to a simple hover lift.
 */
interface FX7TiltCardProps {
  children: React.ReactNode;
  className?: string;
  /** Max rotation degrees (default 6) */
  maxDeg?: number;
  /** Whether to show the moving gloss highlight (default true) */
  gloss?: boolean;
  /** Perspective depth in px (default 900) */
  perspective?: number;
}

export default function FX7TiltCard({
  children,
  className,
  maxDeg = 6,
  gloss = true,
  perspective = 900,
}: FX7TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glossRef = useRef<HTMLDivElement>(null);

  // Check reduced-motion once (SSR-safe)
  const prefersReduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReduced) return;
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      const rotateY = ((x - cx) / cx) * maxDeg;
      const rotateX = -((y - cy) / cy) * maxDeg;

      card.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;

      if (gloss && glossRef.current) {
        // Gloss moves opposite to cursor — like a real specular reflection
        const glossX = 50 + (rotateY / maxDeg) * -25;
        const glossY = 50 + (rotateX / maxDeg) * 25;
        glossRef.current.style.background = `radial-gradient(circle at ${glossX}% ${glossY}%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 60%)`;
        glossRef.current.style.opacity = '1';
      }
    },
    [maxDeg, perspective, gloss, prefersReduced]
  );

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    if (gloss && glossRef.current) {
      glossRef.current.style.opacity = '0';
    }
  }, [gloss]);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={clsx('relative transition-transform duration-100 ease-out will-change-transform', className)}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
      {/* Moving gloss highlight */}
      {gloss && (
        <div
          ref={glossRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-200"
          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 60%)' }}
        />
      )}
    </div>
  );
}
