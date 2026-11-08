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

function keepPrimaryGarmentCluster(mask: Uint8Array, width: number, height: number): void {
  const labels = new Int32Array(mask.length);
  const queue = new Int32Array(mask.length);
  const components: Array<{ id: number; area: number; minX: number; maxX: number; minY: number; maxY: number }> = [];
  const minArea = Math.max(12, Math.floor(mask.length * 0.00005));
  let nextId = 0;

  for (let start = 0; start < mask.length; start++) {
    if (mask[start] === 0 || labels[start] !== 0) continue;
    const id = ++nextId;
    let head = 0;
    let tail = 0;
    let area = 0;
    let minX = width;
    let maxX = -1;
    let minY = height;
    let maxY = -1;
    labels[start] = id;
    queue[tail++] = start;

    while (head < tail) {
      const index = queue[head++];
      const x = index % width;
      const y = Math.floor(index / width);
      area++;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      const left = index - 1;
      if (x > 0 && mask[left] > 0 && labels[left] === 0) { labels[left] = id; queue[tail++] = left; }
      const right = index + 1;
      if (x < width - 1 && mask[right] > 0 && labels[right] === 0) { labels[right] = id; queue[tail++] = right; }
      const above = index - width;
      if (above >= 0 && mask[above] > 0 && labels[above] === 0) { labels[above] = id; queue[tail++] = above; }
      const below = index + width;
      if (below < mask.length && mask[below] > 0 && labels[below] === 0) { labels[below] = id; queue[tail++] = below; }
    }

    if (area >= minArea) components.push({ id, area, minX, maxX, minY, maxY });
  }

  if (components.length < 2) return;
  const largest = components.reduce((best, component) => component.area > best.area ? component : best);
  // Keep the main item and only fragments that touch its nearby bounding box.
  // A horizontal-only grouping can accidentally retain an entire row of repeated
  // catalog poses, making the preview/API input look like several tiny items.
  const padX = Math.max(2, Math.round((largest.maxX - largest.minX + 1) * 0.06));
  const padY = Math.max(2, Math.round((largest.maxY - largest.minY + 1) * 0.06));
  const keptIds = new Set(components.filter((component) => {
    const overlapsExpandedBounds =
      component.maxX >= largest.minX - padX && component.minX <= largest.maxX + padX &&
      component.maxY >= largest.minY - padY && component.minY <= largest.maxY + padY;
    return overlapsExpandedBounds;
  }).map((component) => component.id));

  for (let index = 0; index < mask.length; index++) {
    if (labels[index] !== 0 && !keptIds.has(labels[index])) mask[index] = 0;
  }
}

function softenMaskEdges(mask: Uint8Array, width: number, height: number): Uint8Array {
  const softened = new Uint8Array(mask.length);
  const kernel = [1, 4, 6, 4, 1];
  const radius = 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let weighted = 0;
      for (let ky = -radius; ky <= radius; ky++) {
        const sampleY = y + ky;
        if (sampleY < 0 || sampleY >= height) continue;
        for (let kx = -radius; kx <= radius; kx++) {
          const sampleX = x + kx;
          if (sampleX < 0 || sampleX >= width) continue;
          weighted += mask[sampleY * width + sampleX] * kernel[ky + radius] * kernel[kx + radius];
        }
      }
      softened[y * width + x] = Math.round(weighted / 256);
    }
  }

  return softened;
}

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
  const results: Array<{
    label: string;
    mask: { data: Uint8Array; width: number; height: number; channels?: number };
    score: number;
  }> = await seg(url) as any;
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
    const maskWidth = s.mask.width;
    const maskHeight = s.mask.height;
    const channels = s.mask.channels ?? Math.max(1, Math.floor(maskData.length / (maskWidth * maskHeight)));
    for (let i = 0; i < w * h; i++) {
      const x = i % w;
      const y = Math.floor(i / w);
      const maskX = Math.min(maskWidth - 1, Math.floor((x / w) * maskWidth));
      const maskY = Math.min(maskHeight - 1, Math.floor((y / h) * maskHeight));
      const maskIndex = (maskY * maskWidth + maskX) * channels;
      if (maskData[maskIndex] > 120) combinedMask[i] = 255;
    }
  }

  // If a reference contains several people/items, retain the primary item and nearby fragments.
  // Shoes are kept intact because a valid pair naturally forms two separate components.
  if (mode !== 'shoes') keepPrimaryGarmentCluster(combinedMask, w, h);
  const displayMask = softenMaskEdges(combinedMask, w, h);

  // Coverage
  let maskPixels = 0;
  for (let i = 0; i < displayMask.length; i++) {
    if (displayMask[i] > 127) maskPixels++;
  }
  const coverage = maskPixels / (w * h);

  // Build transparent PNG pixel buffer (Person and background completely removed)
  const transparentData = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const src = i * 4;
    transparentData[src] = imageData.data[src];
    transparentData[src + 1] = imageData.data[src + 1];
    transparentData[src + 2] = imageData.data[src + 2];
    transparentData[src + 3] = displayMask[i];
  }

  // Build white-background pixel buffer for YouCam AI API
  const whiteData = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const src = i * 4;
    const alpha = displayMask[i] / 255;
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
    maskData: displayMask,
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
