import fs from 'node:fs';
import path from 'node:path';

export function readLocalSampleImage(url: string): { buffer: Buffer; mime: string } | null {
  if (!/^\/samples\/[a-zA-Z0-9._-]+\.(?:jpe?g|png|webp)$/i.test(url)) return null;
  const root = path.resolve(process.cwd(), 'public/samples');
  const absolute = path.resolve(process.cwd(), 'public', url.slice(1));
  if (!absolute.startsWith(`${root}${path.sep}`) || !fs.existsSync(absolute)) return null;
  const extension = path.extname(absolute).toLowerCase();
  return {
    buffer: fs.readFileSync(absolute),
    mime: extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg',
  };
}

export function readLocalPublicImage(url: string): { buffer: Buffer; mime: string } | null {
  if (!url.startsWith('/') || url.startsWith('//') || url.includes('\\') || url.includes('\0') || /%2f|%5c/i.test(url)) return null;
  let decoded: string;
  try { decoded = decodeURIComponent(url); } catch { return null; }
  const root = path.resolve(process.cwd(), 'public');
  const absolute = path.resolve(root, `.${decoded}`);
  if (!absolute.startsWith(`${root}${path.sep}`) || !/\.(?:jpe?g|png|webp)$/i.test(absolute) || !fs.existsSync(absolute)) return null;
  const stat = fs.statSync(absolute);
  if (!stat.isFile() || stat.size > 10 * 1024 * 1024) return null;
  const extension = path.extname(absolute).toLowerCase();
  return {
    buffer: fs.readFileSync(absolute),
    mime: extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg',
  };
}

export function isSafePublicHttpsImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return false;
    if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(host)) return false;
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return false;
    if (['nip.io', 'sslip.io', 'xip.io', 'localtest.me', 'lvh.me'].some((suffix) => host === suffix || host.endsWith(`.${suffix}`))) return false;
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(':')) return false;
    if (host === 'metadata.google.internal' || host.endsWith('.metadata.google.internal')) return false;
    return true;
  } catch { return false; }
}
