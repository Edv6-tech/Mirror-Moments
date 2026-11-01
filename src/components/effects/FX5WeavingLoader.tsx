'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const STATUS_LINES = [
  'Measuring the drape…',
  'Matching the light…',
  'Fitting the seams…',
  'Aligning silk folds…',
  'Almost there…',
];

export interface FX5WeavingLoaderProps {
  personUrl?: string;
  onCancel?: () => void;
}

export default function FX5WeavingLoader({ personUrl }: FX5WeavingLoaderProps) {
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % STATUS_LINES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[480px] flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-[var(--navy-950)] text-white p-6 select-none">
      {/* Background ambient weave threads */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="threadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#2563EB" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1E3FB8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Converging animated wave paths */}
        <motion.path
          d="M 0,240 Q 200,100 400,240 T 800,240"
          fill="none"
          stroke="url(#threadGrad)"
          strokeWidth="1.5"
          animate={{
            d: [
              'M 0,240 Q 200,100 400,240 T 800,240',
              'M 0,240 Q 200,380 400,240 T 800,240',
              'M 0,240 Q 200,100 400,240 T 800,240',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d="M 200,0 Q 300,300 200,600"
          fill="none"
          stroke="url(#threadGrad)"
          strokeWidth="1.5"
          animate={{
            d: [
              'M 200,0 Q 100,300 200,600',
              'M 200,0 Q 350,300 200,600',
              'M 200,0 Q 100,300 200,600',
            ],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>

      {/* Center avatar or silhouette with converging pulse */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative w-40 h-52 sm:w-48 sm:h-64 rounded-2xl overflow-hidden border border-[var(--sky-400)]/40 shadow-[0_0_30px_rgba(56,189,248,0.3)] bg-white/5 flex items-center justify-center">
          {personUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={personUrl}
              alt="Fitting model"
              className="w-full h-full object-cover opacity-60 filter blur-[0.5px]"
            />
          ) : (
            <div className="w-16 h-32 rounded-full border border-dashed border-white/20 flex items-center justify-center">
              <span className="text-white/40 text-xs">Fitting</span>
            </div>
          )}

          {/* Scanning Weave beam */}
          <motion.div
            className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--sky-400)] to-transparent shadow-[0_0_15px_#38BDF8]"
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Dynamic status line (rotates every 2.5s) */}
        <div className="mt-8 text-center space-y-2">
          <motion.p
            key={statusIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="font-display text-xl sm:text-2xl text-white font-medium tracking-wide"
          >
            {STATUS_LINES[statusIdx]}
          </motion.p>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-[var(--sky-400)] pulse-dot-1" />
            <span className="w-2 h-2 rounded-full bg-[var(--sky-400)] pulse-dot-2" />
            <span className="w-2 h-2 rounded-full bg-[var(--sky-400)] pulse-dot-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
