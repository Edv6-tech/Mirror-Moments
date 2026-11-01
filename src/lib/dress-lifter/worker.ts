import { pipeline, env } from '@huggingface/transformers';

// Use browser cache API for model caching
env.useBrowserCache = true;
env.allowLocalModels = false;

type ProgressCallback = (progress: { stage: string; percent: number }) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let segmenter: any = null;

async function loadModel(onProgress: ProgressCallback) {
  if (segmenter) return segmenter;
  onProgress({ stage: 'Downloading model...', percent: 0 });
  segmenter = await pipeline(
    'image-segmentation',
    'Xenova/segformer_b2_clothes',
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      progress_callback: (info: any) => {
        const p = typeof info?.progress === 'number' ? info.progress : 0;
        onProgress({ stage: 'Preparing dress lifter…', percent: Math.round(p) });
      },
    }
  );
  onProgress({ stage: 'Ready', percent: 100 });
  return segmenter;
}

// Classes to KEEP for dress mode
const DRESS_KEEP_CLASSES = new Set([
  'Dress', 'Upper-clothes', 'Skirt', 'Pants', 'Belt', 'Scarf',
  'dress', 'upper_clothes', 'skirt', 'pants', 'belt', 'scarf',
]);

// Classes to KEEP for hair mode
const HAIR_KEEP_CLASSES = new Set([
  'Hair', 'hair', 'Hat', 'hat',
]);

// Classes to KEEP for shoes mode (segformer_b2_clothes labels 9, 10)
const SHOES_KEEP_CLASSES = new Set([
  'Left-shoe', 'Right-shoe', 'left_shoe', 'right_shoe', 'shoe', 'shoes',
]);

// Classes to KEEP for bag mode (segformer_b2_clothes label 16)
const BAG_KEEP_CLASSES = new Set([
  'Bag', 'bag',
]);

// Classes that represent human person body / face
const PERSON_BODY_CLASSES = new Set([
  'Face', 'Left-arm', 'Right-arm', 'Left-leg', 'Right-leg',
  'face', 'left_arm', 'right_arm', 'left_leg', 'right_leg',
]);

async function liftItem(
  imageData: ImageData,
  mode: 'dress' | 'hair' | 'shoes' | 'bag',
  onProgress: ProgressCallback
) {
  onProgress({ stage: 'Analysing image…', percent: 10 });
  const seg = await loadModel(onProgress);

  // Convert ImageData → Blob → object URL for the model
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  const url = URL.createObjectURL(blob);

  onProgress({ stage: mode === 'hair' ? 'Isolating hairstyle…' : mode === 'shoes' ? 'Isolating shoes…' : mode === 'bag' ? 'Isolating bag…' : 'Lifting the dress…', percent: 30 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: Array<{ label: string; mask: ImageData; score: number }> = await seg(url) as any;
  URL.revokeObjectURL(url);

  onProgress({ stage: 'Cropping person out & cleaning edges…', percent: 70 });

  const targetKeep =
    mode === 'hair' ? HAIR_KEEP_CLASSES :
    mode === 'shoes' ? SHOES_KEEP_CLASSES :
    mode === 'bag' ? BAG_KEEP_CLASSES :
    DRESS_KEEP_CLASSES;
  let matchingSegments = results.filter((r) => targetKeep.has(r.label));

  // If specific labels weren't tagged, discard background and human body parts
  if (matchingSegments.length === 0) {
    matchingSegments = results.filter(
      (r) => !PERSON_BODY_CLASSES.has(r.label) && r.label.toLowerCase() !== 'background'
    );
  }

  const wornDetected = results.some((r) => PERSON_BODY_CLASSES.has(r.label));

  // Merge target masks
  const w = imageData.width;
  const h = imageData.height;
  const combinedMask = new Uint8Array(w * h);

  for (const s of matchingSegments) {
    const maskData = s.mask.data;
    for (let i = 0; i < w * h; i++) {
      if (maskData[i * 4] > 120) combinedMask[i] = 255;
    }
  }

  // Coverage
  let maskPixels = 0;
  for (let i = 0; i < combinedMask.length; i++) {
    if (combinedMask[i] > 0) maskPixels++;
  }
  const coverage = maskPixels / (w * h);

  // Build transparent PNG pixel buffer (Person and background completely removed)
  const transparentData = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const src = i * 4;
    transparentData[src] = imageData.data[src];
    transparentData[src + 1] = imageData.data[src + 1];
    transparentData[src + 2] = imageData.data[src + 2];
    transparentData[src + 3] = combinedMask[i] > 0 ? 255 : 0;
  }

  // Build white-background pixel buffer for YouCam AI API
  const whiteData = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const src = i * 4;
    const alpha = combinedMask[i] > 0 ? 1 : 0;
    whiteData[src] = Math.round(imageData.data[src] * alpha + 255 * (1 - alpha));
    whiteData[src + 1] = Math.round(imageData.data[src + 1] * alpha + 255 * (1 - alpha));
    whiteData[src + 2] = Math.round(imageData.data[src + 2] * alpha + 255 * (1 - alpha));
    whiteData[src + 3] = 255;
  }

  onProgress({ stage: 'Done', percent: 100 });

  return {
    transparentData,
    whiteData,
    width: w,
    height: h,
    coverage,
    wornDetected,
    maskData: combinedMask,
  };
}

// ── Worker message handler ───────────────────────────────────────────────────
self.onmessage = async (e: MessageEvent) => {
  const { type, imageData, id, mode = 'dress' } = e.data;

  if (type === 'LIFT') {
    try {
      const result = await liftItem(
        imageData,
        mode,
        (progress) => {
          self.postMessage({ type: 'PROGRESS', id, ...progress });
        }
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (self as any).postMessage(
        { type: 'DONE', id, result },
        // Transfer ownership of large buffers to avoid copying
        [result.transparentData.buffer, result.whiteData.buffer, result.maskData.buffer]
      );
    } catch (err) {
      self.postMessage({ type: 'ERROR', id, error: String(err) });
    }
  }
};
