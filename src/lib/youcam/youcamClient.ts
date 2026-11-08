import crypto from 'node:crypto';
import { getPrivateAssetUrl, hasCloudPrivateStorage, storePrivateAsset } from '@/lib/privateAssets';
import { validateImageBuffer } from '@/lib/imageValidation';
import { createAdminClient } from '@/lib/supabase/admin';

export interface YouCamResponse<T = any> {
  status: number;
  data: {
    task_id?: string;
    task_status?: 'pending' | 'processing' | 'success' | 'error';
    results?: {
      url?: string;
      [key: string]: any;
    };
    error?: {
      code?: string;
      message?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

const DEFAULT_BASE_URL = 'https://yce-api-01.makeupar.com';

export function isMockMode(): boolean {
  if (process.env.YOUCAM_MOCK === 'true') return true;
  if (!process.env.YOUCAM_API_KEY) return true;
  return false;
}

function getApiKey(): string {
  return process.env.YOUCAM_API_KEY || '';
}

function getBaseUrl(): string {
  return (process.env.YOUCAM_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

/**
 * 1. Upload file to YouCam via File API.
 * @param buffer   Raw bytes
 * @param mimeType MIME type (default image/jpeg)
 * @param fileName File name sent to API
 * @param endpoint Override the registration path (default /s2s/v2.0/file).
 *                 Use e.g. '/s2s/v2.0/file/eye-color-vto' for lens images.
 * Returns file_id
 */
export async function uploadFile(
  buffer: Buffer,
  mimeType: string = 'image/jpeg',
  fileName: string = 'upload.jpg',
  endpoint: string = '/s2s/v2.0/file'
): Promise<string> {
  if (isMockMode()) {
    return `mock_file_${crypto.randomUUID()}`;
  }

  const apiKey = getApiKey();
  const baseUrl = getBaseUrl();

  // Step 1: Register file with YouCam File API
  const registerEndpoint = `${baseUrl}${endpoint}`;
  const registerRes = await fetch(registerEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: [
        {
          file_name: fileName,
          content_type: mimeType,
          file_size: buffer.length,
        },
      ],
    }),
  });

  const regData = await registerRes.json().catch(() => ({}));
  if (!registerRes.ok || !regData?.data?.files?.[0]) {
    if (registerRes.status === 401) {
      throw new Error('Server key problem, contact the admin');
    }
    if (registerRes.status === 400) {
      throw new Error(regData?.error?.message || 'Invalid parameters, please check your photo size and format.');
    }
    throw new Error(
      `File API registration failed (${registerRes.status}): ${JSON.stringify(regData)}`
    );
  }

  const fileMeta = regData.data.files[0];
  const fileId = fileMeta.file_id;
  const reqObj = Array.isArray(fileMeta.requests) ? fileMeta.requests[0] : fileMeta.requests;
  const putUrl = reqObj?.url;

  if (!putUrl) {
    throw new Error(`Upload url missing in YouCam File API response: ${JSON.stringify(regData)}`);
  }

  const putHeaders: Record<string, string> = {
    'Content-Type': mimeType,
    ...(reqObj.headers || {}),
  };

  // Step 2: PUT binary bytes to presigned URL
  const uploadRes = await fetch(putUrl, {
    method: 'PUT',
    headers: putHeaders,
    body: new Uint8Array(buffer),
  });

  if (!uploadRes.ok) {
    throw new Error(`Direct image upload to presigned S3 URL failed: ${uploadRes.status}`);
  }

  return fileId;
}

/**
 * 2. Create task at given path (e.g. /s2s/v2.0/task/cloth-v4)
 * Returns taskId
 */
export async function createTask(pathRoute: string, body: Record<string, any>): Promise<string> {
  if (isMockMode()) {
    return `mock_task_${crypto.randomUUID()}`;
  }

  const apiKey = getApiKey();
  const baseUrl = getBaseUrl();
  const cleanPath = pathRoute.startsWith('/') ? pathRoute : `/${pathRoute}`;
  const endpoint = `${baseUrl}${cleanPath}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || !data?.data?.task_id) {
    throw new Error(`Task creation at ${cleanPath} failed (${res.status}): ${JSON.stringify(data)}`);
  }

  return data.data.task_id;
}

/**
 * 3. Poll task status every 2s for up to 60s
 */
export async function pollTask(
  pathRoute: string,
  taskId: string,
  maxPolls: number = 30,
  intervalMs: number = 2000
): Promise<any> {
  if (isMockMode() || taskId.startsWith('mock_task_')) {
    // Wait 2 seconds per mock specifications
    await new Promise((r) => setTimeout(r, 2000));
    return {
      status: 'success',
      url: '/sample_face_valid.jpg',
      mock: true,
    };
  }

  const apiKey = getApiKey();
  const baseUrl = getBaseUrl();
  const cleanPath = pathRoute.startsWith('/') ? pathRoute : `/${pathRoute}`;
  const pollEndpoint = `${baseUrl}${cleanPath}/${taskId}`;

  for (let i = 0; i < maxPolls; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    let res;
    try {
      res = await fetch(pollEndpoint, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
    } catch (err: any) {
      console.warn(`Polling ${taskId} attempt ${i + 1} fetch warning:`, err.message);
      continue;
    }

    const json = await res.json();
    const taskStatus = json?.data?.task_status || json?.task_status;

    if (taskStatus === 'success') {
      const url = json?.data?.results?.url || json?.data?.result?.image_url || json?.results?.url;
      return {
        status: 'success',
        url,
        data: json.data,
      };
    }

    if (taskStatus === 'error') {
      const errDetail = json?.data?.error || json?.error || 'YouCam task error';
      throw new Error(`YouCam task ${taskId} reported error: ${JSON.stringify(errDetail)}`);
    }
  }

  throw new Error(`Task ${taskId} timed out after ${maxPolls * (intervalMs / 1000)} seconds.`);
}

/**
 * Persist generated results privately when storage is configured and issue an
 * expiring URL. If storage is unavailable in local development, retain YouCam's
 * own temporary URL rather than creating a permanent public copy.
 */
export async function saveResult(
  remoteUrl: string,
  prefix: string = 'result',
  look?: { userId: string | null; category: string },
): Promise<string> {
  // If it's already a local url or mock, return as-is
  if (!remoteUrl || remoteUrl.startsWith('/')) {
    return remoteUrl || '/sample_face_valid.jpg';
  }

  // Guests can download the provider's temporary result. Signed-in accounts
  // receive durable private storage and a persisted Looks record.
  if (!look?.userId || !hasCloudPrivateStorage()) return remoteUrl;

  try {
    const response = await fetch(remoteUrl);
    if (!response.ok) throw new Error('Provider result could not be downloaded for private storage.');
    const contentType = response.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) throw new Error('Provider result has an unsupported image format.');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 20 * 1024 * 1024) throw new Error('Provider result exceeds the private image size limit.');
    if (validateImageBuffer(bytes, contentType, { maxBytes: 20 * 1024 * 1024, allowedMimes: ['image/jpeg', 'image/png', 'image/webp'] })) throw new Error('Provider result is not a valid image.');
    const owner = look.userId;
    const asset = await storePrivateAsset(owner, 'results', bytes, contentType);
    const supabase = createAdminClient();
    const { error } = await supabase.from('generated_looks').insert({
      user_id: owner,
      category: look.category,
      name: `${prefix.replace(/[_-]+/g, ' ')} try-on`,
      result_path: asset.key,
    });
    if (error) throw new Error(`Private look could not be saved: ${error.message}`);
    return await getPrivateAssetUrl(owner, asset);
  } catch (error) {
    throw new Error('Your try-on finished, but the private result could not be saved. Check storage setup and try again.');
  }
}

/** Download a YouCam result on the server so the browser can safely composite it. */
export async function getResultImageDataUrl(remoteUrl: string): Promise<string> {
  const parsed = new URL(remoteUrl);
  if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.s3-accelerate.amazonaws.com')) {
    throw new Error('The try-on result came from an unsupported image host.');
  }

  const response = await fetch(parsed, { cache: 'no-store' });
  if (!response.ok) throw new Error('The try-on result image could not be prepared.');
  const mime = response.headers.get('content-type')?.split(';')[0] ?? '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
    throw new Error('The try-on result has an unsupported image format.');
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > 12 * 1024 * 1024) {
    throw new Error('The try-on result is too large to combine.');
  }
  if (validateImageBuffer(bytes, mime, { maxBytes: 12 * 1024 * 1024, allowedMimes: ['image/jpeg', 'image/png', 'image/webp'] })) {
    throw new Error('The try-on result image could not be validated.');
  }
  return `data:${mime};base64,${bytes.toString('base64')}`;
}

export const youcamClient = {
  uploadFile,
  createTask,
  pollTask,
  saveResult,
  getResultImageDataUrl,
  isMockMode,
};

export default youcamClient;
