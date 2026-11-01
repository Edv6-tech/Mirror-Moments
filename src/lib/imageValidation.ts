export type SupportedImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ImageDimensions {
  width: number;
  height: number;
  mime: SupportedImageMime;
}

function jpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 4 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > buffer.length) return null;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) return null;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      if (length < 7) return null;
      return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
    }
    offset += length;
  }
  return null;
}

export function getImageDimensions(buffer: Buffer): ImageDimensions | null {
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(pngSignature) && buffer.toString('ascii', 12, 16) === 'IHDR') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), mime: 'image/png' };
  }

  const jpeg = jpegDimensions(buffer);
  if (jpeg) return { ...jpeg, mime: 'image/jpeg' };

  if (buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8X') {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
        mime: 'image/webp',
      };
    }
    if (chunk === 'VP8 ' && buffer.length >= 30) {
      return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff, mime: 'image/webp' };
    }
    if (chunk === 'VP8L' && buffer.length >= 25 && buffer[20] === 0x2f) {
      return {
        width: 1 + (((buffer[22] & 0x3f) << 8) | buffer[21]),
        height: 1 + (((buffer[24] & 0x0f) << 10) | (buffer[23] << 2) | ((buffer[22] & 0xc0) >> 6)),
        mime: 'image/webp',
      };
    }
  }
  return null;
}

export function validateImageBuffer(
  buffer: Buffer,
  claimedMime: string,
  options: { maxBytes?: number; maxLongSide?: number; minLongSide?: number; minShortSide?: number; allowedMimes?: SupportedImageMime[] } = {},
): string | null {
  const maxBytes = options.maxBytes ?? 10 * 1024 * 1024;
  if (!buffer.length) return 'The uploaded image is empty.';
  if (buffer.length > maxBytes) return `Image exceeds the ${Math.floor(maxBytes / (1024 * 1024))} MB limit.`;
  const image = getImageDimensions(buffer);
  if (!image) return 'The uploaded file is not a valid JPEG, PNG, or WebP image.';
  if (image.mime !== claimedMime) return 'The image contents do not match the selected file type.';
  if (options.allowedMimes && !options.allowedMimes.includes(image.mime)) {
    return `This feature accepts ${options.allowedMimes.map((mime) => mime.replace('image/', '').toUpperCase()).join(' or ')} images.`;
  }
  if (image.width <= 0 || image.height <= 0) return 'The image dimensions are invalid.';
  if (options.maxLongSide && Math.max(image.width, image.height) > options.maxLongSide) {
    return `Resize the image so its longest side is ${options.maxLongSide} px or less.`;
  }
  if (options.minShortSide && Math.min(image.width, image.height) < options.minShortSide) {
    return `The image's shortest side must be at least ${options.minShortSide} px.`;
  }
  if (options.minLongSide && Math.max(image.width, image.height) < options.minLongSide) {
    return `The image's longest side must be at least ${options.minLongSide} px.`;
  }
  return null;
}
