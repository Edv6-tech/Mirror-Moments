'use client';

import { useRef, useState, useCallback } from 'react';

export type LifterProgress = { stage: string; percent: number };
export type LifterResult = {
  transparentUrl: string;
  whiteUrl: string;
  coverage: number;
  wornDetected: boolean;
  width: number;
  height: number;
};

export function useDressLifter() {
  const workerRef = useRef<Worker | null>(null);
  const [progress, setProgress] = useState<LifterProgress | null>(null);
  const [isLifting, setIsLifting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lift = useCallback((file: File, mode: 'dress' | 'hair' | 'shoes' | 'bag' = 'dress'): Promise<LifterResult> => {
    return new Promise((resolve, reject) => {
      // Lazy-create worker
      if (!workerRef.current) {
        workerRef.current = new Worker(
          new URL('./worker.ts', import.meta.url),
          { type: 'module' }
        );
      }
      const worker = workerRef.current;
      const id = Date.now();
      setIsLifting(true);
      setError(null);

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        // Resize to max 1024 px on the longest side for the model
        const maxSide = 1024;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        URL.revokeObjectURL(objectUrl);

        worker.onmessage = (ev) => {
          const msg = ev.data;
          if (msg.id !== id) return;

          if (msg.type === 'PROGRESS') {
            setProgress({ stage: msg.stage, percent: msg.percent });
          } else if (msg.type === 'DONE') {
            const { transparentData, whiteData, width, height, coverage, wornDetected } =
              msg.result;

            // Render transparent PNG to a Blob URL
            const tc = document.createElement('canvas');
            tc.width = width;
            tc.height = height;
            tc.getContext('2d')!.putImageData(
              new ImageData(new Uint8ClampedArray(transparentData), width, height),
              0,
              0
            );
            tc.toBlob((tb) => {
              const transparentUrl = URL.createObjectURL(tb!);

              // Render white-bg PNG to a Blob URL
              const wc = document.createElement('canvas');
              wc.width = width;
              wc.height = height;
              wc.getContext('2d')!.putImageData(
                new ImageData(new Uint8ClampedArray(whiteData), width, height),
                0,
                0
              );
              wc.toBlob((wb) => {
                const whiteUrl = URL.createObjectURL(wb!);
                setIsLifting(false);
                setProgress(null);
                resolve({ transparentUrl, whiteUrl, coverage, wornDetected, width, height });
              }, 'image/png');
            }, 'image/png');
          } else if (msg.type === 'ERROR') {
            setIsLifting(false);
            setError(msg.error);
            reject(new Error(msg.error));
          }
        };

        // Transfer the ImageData buffer to avoid copying
        worker.postMessage(
          { type: 'LIFT', id, imageData, width: w, height: h, mode },
          [imageData.data.buffer]
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setIsLifting(false);
        reject(new Error('Failed to load image'));
      };

      img.src = objectUrl;
    });
  }, []);

  return { lift, progress, isLifting, error };
}
