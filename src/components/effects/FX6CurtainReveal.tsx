'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FX6CurtainRevealProps {
  children: React.ReactNode;
  onComplete?: () => void;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  color: string;
}

export default function FX6CurtainReveal({ children, onComplete }: FX6CurtainRevealProps) {
  const [wiping, setWiping] = useState(true);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    // Generate ~40 sparkles for post-wipe burst
    const generated: Sparkle[] = Array.from({ length: 36 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 3,
      delay: Math.random() * 0.4 + 0.6,
      color: Math.random() > 0.5 ? '#38BDF8' : '#FFFFFF',
    }));
    setSparkles(generated);

    const timer = setTimeout(() => {
      setWiping(false);
      onComplete?.();
    }, 1400);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl">
      {/* Target Content */}
      <div className="w-full h-full">{children}</div>

      {/* Light Curtain Wipe Overlay */}
      <AnimatePresence>
        {wiping && (
          <motion.div
            initial={{ left: '0%' }}
            animate={{ left: '100%' }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-y-0 w-24 -ml-12 pointer-events-none z-30 flex items-center justify-center"
          >
            {/* Vertical bright light blade */}
            <div className="w-1.5 h-full bg-white shadow-[0_0_30px_#FFFFFF,0_0_60px_#38BDF8]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sparkles Burst */}
      {wiping &&
        sparkles.map((sp) => (
          <motion.div
            key={sp.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0.4], y: [-10, -30] }}
            transition={{ duration: 0.8, delay: sp.delay }}
            style={{
              position: 'absolute',
              left: `${sp.x}%`,
              top: `${sp.y}%`,
              width: sp.size,
              height: sp.size,
              backgroundColor: sp.color,
              boxShadow: `0 0 10px ${sp.color}`,
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: 35,
            }}
          />
        ))}
    </div>
  );
}
