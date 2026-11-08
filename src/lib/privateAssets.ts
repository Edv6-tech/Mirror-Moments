import 'server-only';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getLocalUser } from '@/lib/sqliteAuth';

const MAX_SIGNED_URL_AGE_SECONDS = 10 * 60;
const LOCAL_ROOT = path.resolve(process.cwd(), 'data/private-assets');

export function hasCloudPrivateStorage(): boolean {
  return Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

export interface PrivateAsset {
  bucket: 'dresses' | 'bodies' | 'results';
  key: string;
}

export async function resolvePrivateAssetOwner(): Promise<string> {
  const user = await getLocalUser();
  if (user) return user.id;
  if (process.env.NODE_ENV !== 'production') return 'local-demo';
  throw new Error('Sign in to access your private collection.');
}

function adminStorage() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createSupabaseClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } }).storage;
}

function extensionForMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

export async function storePrivateAsset(
  owner: string,
  bucket: PrivateAsset['bucket'],
  bytes: Buffer,
  mime: string,
): Promise<PrivateAsset> {
  const key = `${owner}/${crypto.randomUUID()}.${extensionForMime(mime)}`;
  const storage = adminStorage();
  if (storage) {
    const { error } = await storage.from(bucket).upload(key, bytes, { contentType: mime, upsert: false });
    if (error) throw new Error(`Private image storage failed: ${error.message}`);
  } else {
    if (process.env.NODE_ENV === 'production') throw new Error('Private object storage is required in production.');
    const destination = path.resolve(LOCAL_ROOT, bucket, key);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, bytes, { flag: 'wx', mode: 0o600 });
  }
  return { bucket, key };
}

export async function downloadPrivateAsset(asset: PrivateAsset): Promise<Buffer | null> {
  const storage = adminStorage();
  if (storage) {
    const { data, error } = await storage.from(asset.bucket).download(asset.key);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  }
  try {
    return await fs.readFile(path.resolve(LOCAL_ROOT, asset.bucket, asset.key));
  } catch { return null; }
}

export async function deletePrivateAssets(assets: PrivateAsset[]): Promise<void> {
  if (!assets.length) return;
  const storage = adminStorage();
  if (storage) {
    for (const bucket of [...new Set(assets.map((asset) => asset.bucket))]) {
      const keys = assets.filter((asset) => asset.bucket === bucket).map((asset) => asset.key);
      const { error } = await storage.from(bucket).remove(keys);
      if (error) throw new Error(`Private image deletion failed: ${error.message}`);
    }
    return;
  }
  for (const asset of assets) {
    const absolute = path.resolve(LOCAL_ROOT, asset.bucket, asset.key);
    if (!absolute.startsWith(`${path.resolve(LOCAL_ROOT)}${path.sep}`)) throw new Error('Invalid private image path.');
    await fs.rm(absolute, { force: true });
  }
}

export async function deleteOwnerPrivateAssets(ownerId: string): Promise<void> {
  const storage = adminStorage();
  if (storage) {
    for (const bucket of ['dresses', 'bodies', 'results'] as const) {
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await storage.from(bucket).list(ownerId, { limit: 1000, offset });
        if (error) throw new Error(`Could not list private ${bucket} images: ${error.message}`);
        const page = (data ?? []).filter((item) => item.id).map((item) => `${ownerId}/${item.name}`);
        if (page.length) {
          const { error: removeError } = await storage.from(bucket).remove(page);
          if (removeError) throw new Error(`Could not delete private ${bucket} images: ${removeError.message}`);
        }
        if ((data ?? []).length < 1000) break;
      }
    }
    return;
  }
  for (const bucket of ['dresses', 'bodies', 'results'] as const) {
    const directory = path.resolve(LOCAL_ROOT, bucket, ownerId);
    if (!directory.startsWith(`${LOCAL_ROOT}${path.sep}`)) throw new Error('Invalid private image owner.');
    await fs.rm(directory, { recursive: true, force: true });
  }
}

async function getLocalSigningKey(): Promise<Buffer> {
  const configured = process.env.PRIVATE_ASSET_SIGNING_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (configured) return Buffer.from(configured, 'utf8');
  await fs.mkdir(LOCAL_ROOT, { recursive: true });
  const keyPath = path.join(LOCAL_ROOT, '.signing-key');
  try {
    return await fs.readFile(keyPath);
  } catch {
    const key = crypto.randomBytes(32);
    try { await fs.writeFile(keyPath, key, { flag: 'wx', mode: 0o600 }); } catch {}
    return fs.readFile(keyPath);
  }
}

export async function getPrivateAssetUrl(owner: string, asset: PrivateAsset): Promise<string> {
  const storage = adminStorage();
  if (storage) {
    const { data, error } = await storage.from(asset.bucket).createSignedUrl(asset.key, MAX_SIGNED_URL_AGE_SECONDS);
    if (error || !data?.signedUrl) throw new Error('Could not create a temporary private image link.');
    return data.signedUrl;
  }
  const expires = Math.floor(Date.now() / 1000) + MAX_SIGNED_URL_AGE_SECONDS;
  const key = await getLocalSigningKey();
  const message = `${owner}:${asset.bucket}:${asset.key}:${expires}`;
  const signature = crypto.createHmac('sha256', key).update(message).digest('hex');
  const query = new URLSearchParams({ bucket: asset.bucket, key: asset.key, expires: String(expires), signature });
  return `/api/private-assets?${query.toString()}`;
}

export async function readSignedLocalAsset(bucket: string, key: string, expires: number, signature: string): Promise<Buffer | null> {
  if (!['dresses', 'bodies', 'results'].includes(bucket)) return null;
  if (!Number.isInteger(expires) || expires < Math.floor(Date.now() / 1000) || expires > Math.floor(Date.now() / 1000) + MAX_SIGNED_URL_AGE_SECONDS + 30) return null;
  const [owner, filename, ...extra] = key.split('/');
  if (extra.length || !owner || !/^(local-demo|[0-9a-f-]{36})$/i.test(owner) || !/^[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(filename ?? '')) return null;
  const signingKey = await getLocalSigningKey();
  const expected = crypto.createHmac('sha256', signingKey).update(`${owner}:${bucket}:${key}:${expires}`).digest();
  let actual: Buffer;
  try { actual = Buffer.from(signature, 'hex'); } catch { return null; }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const absolute = path.resolve(LOCAL_ROOT, bucket, key);
    if (!absolute.startsWith(`${path.resolve(LOCAL_ROOT)}${path.sep}`)) return null;
    return await fs.readFile(absolute);
  } catch { return null; }
}

export function mimeFromAssetKey(key: string): string {
  const extension = key.split('.').pop()?.toLowerCase();
  return extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
}
