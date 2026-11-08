'use client';

import { useRef, useState, useCallback } from 'react';

export type LifterProgress = { stage: string; percent: number };
export type LifterResult = {
  transparentUrl: string;
  previewUrl: string;
  whiteUrl: string;
  coverage: number;
  maskReliable: boolean;
  wornDetected: boolean;
  width: number;
  height: number;
};

function createTightPreview(
  source: HTMLCanvasElement,
  mask: Uint8Array,
  width: number,
  height: number,
): Promise<string> {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      if (mask[row + x] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) {
    return new Promise((resolve, reject) => {
      source.toBlob((blob) => blob ? resolve(URL.createObjectURL(blob)) : reject(new Error('Could not prepare item preview.')), 'image/png');
    });
  }

  const paddingX = Math.max(8, Math.round((right - left + 1) * 0.08));
  const paddingY = Math.max(8, Math.round((bottom - top + 1) * 0.08));
  left = Math.max(0, left - paddingX);
  top = Math.max(0, top - paddingY);
  right = Math.min(width - 1, right + paddingX);
  bottom = Math.min(height - 1, bottom + paddingY);

  const cropWidth = right - left + 1;
  const cropHeight = bottom - top + 1;
  const preview = document.createElement('canvas');
  preview.width = cropWidth;
  preview.height = cropHeight;
  const context = preview.getContext('2d');
  if (!context) return Promise.reject(new Error('Could not prepare item preview.'));
  context.drawImage(source, left, top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  return new Promise((resolve, reject) => {
    preview.toBlob((blob) => blob ? resolve(URL.createObjectURL(blob)) : reject(new Error('Could not prepare item preview.')), 'image/png');
  });
}

function getMaskBoundsDensity(mask: Uint8Array, width: number, height: number): number {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  let pixels = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] < 128) continue;
      pixels++;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) return 0;
  return pixels / ((right - left + 1) * (bottom - top + 1));
}

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

        worker.onmessage = async (ev) => {
          const msg = ev.data;
          if (msg.id !== id) return;

          if (msg.type === 'PROGRESS') {
            setProgress({ stage: msg.stage, percent: msg.percent });
          } else if (msg.type === 'DONE') {
            const { transparentData, whiteData, maskData, width, height, coverage, wornDetected } =
              msg.result;
            // Shoe segmentation can return a few scattered pixels for product photos.
            // Below this threshold, keep the original full photo as the visual preview.
            const maskBoundsDensity = getMaskBoundsDensity(maskData, width, height);
            const maskReliable = mode !== 'shoes' || (coverage >= 0.01 && maskBoundsDensity >= 0.08);

            // Render transparent PNG to a Blob URL
            const tc = document.createElement('canvas');
            tc.width = width;
            tc.height = height;
            tc.getContext('2d')!.putImageData(
              new ImageData(new Uint8ClampedArray(transparentData), width, height),
              0,
              0
            );
            let previewUrl: string;
            try {
              if (maskReliable) {
                previewUrl = await createTightPreview(tc, maskData, width, height);
              } else {
                const originalPreview = document.createElement('canvas');
                originalPreview.width = width;
                originalPreview.height = height;
                originalPreview.getContext('2d')!.drawImage(img, 0, 0, width, height);
                previewUrl = await new Promise((resolve, reject) => {
                  originalPreview.toBlob((blob) => blob
                    ? resolve(URL.createObjectURL(blob))
                    : reject(new Error('Could not prepare the original shoe photo.')), 'image/png');
                });
              }
            } catch (error) {
              setIsLifting(false);
              setProgress(null);
              reject(error);
              return;
            }
            tc.toBlob((tb) => {
              if (!tb) {
                reject(new Error('Could not prepare the transparent item image.'));
                setIsLifting(false);
                setProgress(null);
                return;
              }
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
                if (!wb) {
                  reject(new Error('Could not prepare the item image for try-on.'));
                  setIsLifting(false);
                  setProgress(null);
                  return;
                }
                const whiteUrl = URL.createObjectURL(wb!);
                setIsLifting(false);
                setProgress(null);
                resolve({ transparentUrl, previewUrl, whiteUrl, coverage, maskReliable, wornDetected, width, height });
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
