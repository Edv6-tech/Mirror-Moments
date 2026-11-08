'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface FX4DissolveExtractionProps {
  originalSrc: string;
  liftedSrc?: string;
  originalFallback?: boolean;
  onComplete?: () => void;
}

export default function FX4DissolveExtraction({
  originalSrc,
  liftedSrc,
  originalFallback = false,
  onComplete,
}: FX4DissolveExtractionProps) {
  const [stage, setStage] = useState<'scanning' | 'lifted'>('scanning');

  useEffect(() => {
    const timer = setTimeout(() => {
      setStage('lifted');
      onComplete?.();
    }, 2800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="relative w-full h-full min-h-[440px] flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-[var(--navy-950)] p-6 select-none">
      {/* Background soft pedestal spotlight */}
      <div
        aria-hidden="true"
        className="absolute bottom-6 w-72 h-16 rounded-[100%] bg-[var(--sky-400)]/20 blur-xl pointer-events-none"
      />

      {/* Main Image Container */}
      <div className="relative w-64 h-80 sm:w-72 sm:h-96 rounded-2xl overflow-hidden flex items-center justify-center">
        {stage === 'scanning' ? (
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={originalSrc}
              alt="Original garment"
              className="w-full h-full object-contain filter contrast-105"
            />

            {/* Luminous Scan line sweeping down */}
            <motion.div
              className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-[var(--sky-400)] to-transparent shadow-[0_0_20px_#38BDF8]"
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            />

            {/* Drifting blue/white particles simulation */}
            {Array.from({ length: 16 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-[var(--sky-400)] shadow-[0_0_6px_#38BDF8]"
                style={{
                  left: `${(i * 19) % 90 + 5}%`,
                  bottom: '10%',
                }}
                animate={{
                  y: [-10, -120],
                  opacity: [0, 0.8, 0],
                  scale: [0.5, 1.2, 0.2],
                }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  delay: (i * 0.15) % 1.2,
                }}
              />
            ))}
          </div>
        ) : (
          /* Isolated dress on pedestal */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative w-full h-full flex flex-col items-center justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={liftedSrc || originalSrc}
              alt={originalFallback ? 'Original shoe product photo' : 'Isolated garment'}
              className="max-w-full max-h-full object-contain drop-shadow-[0_10px_25px_rgba(56,189,248,0.4)]"
            />
          </motion.div>
        )}
      </div>

      {/* Caption under pedestal */}
      <div className="mt-4 text-center">
        <span className="text-xs font-semibold tracking-wider uppercase text-[var(--sky-400)]">
          {stage === 'scanning' ? 'Dissolving background…' : originalFallback ? 'Original photo ready' : 'Isolated garment ready'}
        </span>
      </div>
    </div>
  );
}
