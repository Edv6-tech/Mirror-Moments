/**
 * generate-lenses.mjs
 * Generates 400×400 RGBA lens PNGs for public/lenses/
 * Pure Node.js — no dependencies.
 * Run: node scripts/generate-lenses.mjs
 */
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR   = join(__dirname, '..', 'public', 'lenses');
mkdirSync(OUT_DIR, { recursive: true });

// ── CRC-32 table ──────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

/**
 * Write a minimal PNG file.
 * getPixel(x, y) → [r, g, b, a]  (0-255 each)
 */
function writePng(filePath, size, getPixel) {
  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.allocUnsafe(13);
  ihdrData.writeUInt32BE(size, 0);   // width
  ihdrData.writeUInt32BE(size, 4);   // height
  ihdrData[8]  = 8;  // bit depth
  ihdrData[9]  = 6;  // RGBA
  ihdrData[10] = 0;  // compression
  ihdrData[11] = 0;  // filter
  ihdrData[12] = 0;  // interlace

  // Scanlines: 1 filter byte + RGBA bytes per row
  const stride = size * 4 + 1;
  const raw    = Buffer.allocUnsafe(size * stride);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = getPixel(x, y);
      const off = y * stride + 1 + x * 4;
      raw[off]     = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      raw[off + 3] = a;
    }
  }

  const idat = pngChunk('IDAT', deflateSync(raw, { level: 6 }));
  const iend = pngChunk('IEND', Buffer.alloc(0));

  writeFileSync(filePath, Buffer.concat([sig, pngChunk('IHDR', ihdrData), idat, iend]));
}

// ── Lens pixel function ────────────────────────────────────────────────────────
function makeLensPixel(r, g, b, opacity = 235) {
  return (x, y) => {
    const SIZE   = 400;
    const cx     = SIZE / 2;
    const cy     = SIZE / 2;
    const radius = SIZE / 2 - 2;            // iris outer edge
    const pupilR = SIZE / 5;               // pupil radius (transparent)
    const limbalR = radius - SIZE * 0.06;  // limbal ring inner edge
    const limbalW = SIZE * 0.04;           // limbal ring width

    const dx  = x - cx;
    const dy  = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Outside iris → fully transparent
    if (dist > radius) return [0, 0, 0, 0];

    // Pupil area → transparent (simulates real contact lens cutout)
    if (dist < pupilR) return [0, 0, 0, 0];

    // Limbal ring — dark edge that makes the iris look more realistic
    if (dist > limbalR) {
      const t = (dist - limbalR) / limbalW;
      const rr = Math.round(r * (1 - t) * 0.3);
      const gg = Math.round(g * (1 - t) * 0.3);
      const bb = Math.round(b * (1 - t) * 0.3);
      return [rr, gg, bb, Math.round(opacity * (0.6 + t * 0.4))];
    }

    // Main iris — add subtle radiating texture using angle + distance
    const angle   = Math.atan2(dy, dx);
    const texture = 0.85 + 0.15 * Math.sin(angle * 12 + dist * 0.15);
    return [
      Math.round(r * texture),
      Math.round(g * texture),
      Math.round(b * texture),
      opacity,
    ];
  };
}

// ── Lens definitions ───────────────────────────────────────────────────────────
const LENSES = [
  { id: 'natural_hazel', r: 139, g: 105, b:  20 },
  { id: 'honey_brown',   r: 198, g: 139, b:  55 },
  { id: 'ocean_blue',    r:  21, g: 101, b: 192 },
  { id: 'forest_green',  r:  46, g: 125, b:  50 },
  { id: 'violet',        r: 106, g:  27, b: 154 },
  { id: 'storm_grey',    r:  84, g: 110, b: 122 },
  { id: 'icy_blue',      r:  79, g: 195, b: 247 },
  { id: 'amethyst',      r: 156, g:  39, b: 176 },
];

for (const lens of LENSES) {
  const filePath = join(OUT_DIR, `${lens.id}.png`);
  writePng(filePath, 400, makeLensPixel(lens.r, lens.g, lens.b));
  console.log(`✓  ${lens.id}.png`);
}

console.log(`\nAll ${LENSES.length} lens PNGs written to public/lenses/`);
