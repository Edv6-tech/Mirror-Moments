'use client';

export type NormalizedCrop = { x: number; y: number; width: number; height: number };

export type PreparedFullLookPhoto = {
  full: File;
};

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not prepare this photo. Please choose another image.')), 'image/jpeg', 0.94);
  });
}

async function fileFromCanvas(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new File([await canvasBlob(canvas)], name, { type: 'image/jpeg' });
}

function normalizedCrop(x: number, y: number, width: number, height: number, sourceWidth: number, sourceHeight: number): NormalizedCrop {
  return { x: x / sourceWidth, y: y / sourceHeight, width: width / sourceWidth, height: height / sourceHeight };
}

function drawCrop(source: ImageBitmap, x: number, y: number, width: number, height: number, name: string): Promise<File> {
  const scale = 1024 / Math.max(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d');
  if (!context) return Promise.reject(new Error('Could not prepare the photo crop.'));
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, x, y, width, height, 0, 0, canvas.width, canvas.height);
  return fileFromCanvas(canvas, name);
}

export async function prepareFullLookPhoto(file: File): Promise<PreparedFullLookPhoto> {
  const source = await createImageBitmap(file);
  try {
    const minSide = Math.min(source.width, source.height);
    const maxSide = Math.max(source.width, source.height);
    const scale = Math.min(Math.max(1, 512 / minSide), 4096 / maxSide);
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = Math.max(1, Math.round(source.width * scale));
    fullCanvas.height = Math.max(1, Math.round(source.height * scale));
    const fullContext = fullCanvas.getContext('2d');
    if (!fullContext) throw new Error('Could not prepare the full-body photo.');
    fullContext.fillStyle = '#ffffff';
    fullContext.fillRect(0, 0, fullCanvas.width, fullCanvas.height);
    fullContext.imageSmoothingEnabled = true;
    fullContext.imageSmoothingQuality = 'high';
    fullContext.drawImage(source, 0, 0, fullCanvas.width, fullCanvas.height);
    const full = await fileFromCanvas(fullCanvas, 'full-look-person.jpg');
    return { full };
  } finally {
    source.close();
  }
}

async function bitmapFromDataUrl(dataUrl: string): Promise<ImageBitmap> {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error('A try-on image could not be opened for combining.');
  return createImageBitmap(await response.blob());
}

export async function prepareLookCrops(image: string | File, makeupZoom: number): Promise<{
  bag: File;
  makeup: File;
  bagCrop: NormalizedCrop;
  makeupCrop: NormalizedCrop;
}> {
  const source = typeof image === 'string' ? await bitmapFromDataUrl(image) : await createImageBitmap(image);
  try {
    const width = source.width;
    const height = source.height;

    // YouCam asks for a clear head-to-chest view and prefers half-body. Keep a
    // centered head-to-waist frame at 3:4; this is also the exact region used
    // when blending the bag result back into the current full-look image.
    const bagHeight = Math.min(Math.round(height * 0.56), Math.round(width / 0.75));
    const bagWidth = Math.min(width, Math.round(bagHeight * 0.75));
    const bagX = Math.round((width - bagWidth) / 2);
    const bagY = 0;
    const bag = await drawCrop(source, bagX, bagY, bagWidth, bagHeight, 'full-look-bag-person.jpg');

    const safeZoom = Math.max(1, Math.min(3, makeupZoom));
    const portrait = height / width > 1.15;
    const makeupWidth = Math.max(1, Math.round(width / safeZoom));
    const makeupHeight = portrait
      ? Math.min(height, Math.max(1, Math.round(makeupWidth * 1.1)))
      : Math.max(1, Math.round(height / safeZoom));
    const makeupX = Math.round((width - makeupWidth) / 2);
    const makeupY = portrait ? 0 : Math.round((height - makeupHeight) / 2);
    const makeup = await drawCrop(source, makeupX, makeupY, makeupWidth, makeupHeight, 'full-look-makeup-person.jpg');

    return {
      bag,
      makeup,
      bagCrop: normalizedCrop(bagX, bagY, bagWidth, bagHeight, width, height),
      makeupCrop: normalizedCrop(makeupX, makeupY, makeupWidth, makeupHeight, width, height),
    };
  } finally {
    source.close();
  }
}

async function featheredPatch(dataUrl: string, width: number, height: number): Promise<HTMLCanvasElement> {
  const image = await bitmapFromDataUrl(dataUrl);
  try {
    const patch = document.createElement('canvas');
    patch.width = Math.max(1, Math.round(width));
    patch.height = Math.max(1, Math.round(height));
    const context = patch.getContext('2d');
    if (!context) throw new Error('Could not combine the try-on images.');
    context.drawImage(image, 0, 0, patch.width, patch.height);
    const pixels = context.getImageData(0, 0, patch.width, patch.height);
    const feather = Math.max(2, Math.round(Math.min(patch.width, patch.height) * 0.035));
    for (let y = 0; y < patch.height; y++) {
      for (let x = 0; x < patch.width; x++) {
        const fade = Math.min(1, x / feather, y / feather, (patch.width - 1 - x) / feather, (patch.height - 1 - y) / feather);
        const alphaIndex = (y * patch.width + x) * 4 + 3;
        pixels.data[alphaIndex] = Math.round(pixels.data[alphaIndex] * Math.max(0, fade));
      }
    }
    context.putImageData(pixels, 0, 0);
    return patch;
  } finally {
    image.close();
  }
}

export async function composeFullLook(
  baseImage: string | File,
  overlays: Array<{ image: string; crop: NormalizedCrop }>,
): Promise<Blob> {
  const base = typeof baseImage === 'string'
    ? await bitmapFromDataUrl(baseImage)
    : await createImageBitmap(baseImage);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = base.width;
    canvas.height = base.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not combine the selected look.');
    context.drawImage(base, 0, 0);

    for (const overlay of overlays) {
      const x = Math.round(overlay.crop.x * canvas.width);
      const y = Math.round(overlay.crop.y * canvas.height);
      const width = Math.round(overlay.crop.width * canvas.width);
      const height = Math.round(overlay.crop.height * canvas.height);
      const patch = await featheredPatch(overlay.image, width, height);
      context.drawImage(patch, x, y, width, height);
    }

    return await canvasBlob(canvas);
  } finally {
    base.close();
  }
}
