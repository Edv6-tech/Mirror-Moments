import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';

export interface SkinAnalysisResult {
  task_id: string;
  task_status: string;
  results?: {
    url?: string;
    [key: string]: any;
  };
  report?: {
    skin_age?: number;
    skin_type?: any;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ClothTryOnResult {
  task_id: string;
  task_status: string;
  result?: {
    image_url?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export class YouCamClient {
  private apiKey: string;
  private baseUrl: string;
  private cacheDir: string;
  private logDir: string;

  constructor() {
    this.apiKey = process.env.YOUCAM_API_KEY || '';
    this.baseUrl = (process.env.YOUCAM_BASE_URL || 'https://yce-api-01.makeupar.com').replace(/\/+$/, '');
    this.cacheDir = path.resolve(process.cwd(), process.env.CACHE_DIR || './data/fixtures');
    this.logDir = path.resolve(process.cwd(), './evidence/api-log');

    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private logUsage(route: string, status: number, durationMs: number, details: Record<string, any> = {}) {
    try {
      const entry = {
        timestamp: new Date().toISOString(),
        route,
        status,
        durationMs,
        ...details,
      };
      const logFile = path.join(this.logDir, `api-log-${new Date().toISOString().slice(0, 10)}.jsonl`);
      fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
    } catch (err) {
      console.error('Failed to log API usage:', err);
    }
  }

  /**
   * Upload an image buffer via YouCam File API to get a file_id
   */
  async uploadFile(buffer: Buffer, fileName: string, contentType: string = 'image/jpeg'): Promise<string> {
    const startTime = Date.now();
    const endpoint = `${this.baseUrl}/s2s/v2.0/file`;

    const registerRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: [
          {
            file_name: fileName,
            content_type: contentType,
            file_size: buffer.length,
          },
        ],
      }),
    });

    const regData = await registerRes.json();
    if (!registerRes.ok || !regData?.data?.files?.[0]) {
      this.logUsage('/s2s/v2.0/file', registerRes.status, Date.now() - startTime, { error: regData });
      throw new Error(`File upload registration failed (${registerRes.status}): ${JSON.stringify(regData)}`);
    }

    const fileMeta = regData.data.files[0];
    const fileId = fileMeta.file_id;
    const reqObj = Array.isArray(fileMeta.requests) ? fileMeta.requests[0] : fileMeta.requests;
    const putUrl = reqObj?.url;

    if (!putUrl) {
      throw new Error(`Upload url missing in response: ${JSON.stringify(regData)}`);
    }

    const putHeaders: Record<string, string> = {
      'Content-Type': contentType,
      ...(reqObj.headers || {}),
    };

    // Direct PUT binary to S3 presigned URL
    const uploadRes = await fetch(putUrl, {
      method: 'PUT',
      headers: putHeaders,
      body: new Uint8Array(buffer),
    });

    if (!uploadRes.ok) {
      this.logUsage('PUT_S3_PRESIGNED', uploadRes.status, Date.now() - startTime, { fileId });
      throw new Error(`Direct upload failed with status ${uploadRes.status}`);
    }

    this.logUsage('/s2s/v2.0/file', 200, Date.now() - startTime, { fileId, size: buffer.length });
    return fileId;
  }

  /**
   * Submit and poll Skin Analysis
   */
  async analyzeSkin(fileId: string, maxPolls = 30, intervalMs = 2000): Promise<SkinAnalysisResult> {
    const startTime = Date.now();
    const taskEndpoint = `${this.baseUrl}/s2s/v2.0/task/skin-analysis`;

    const createRes = await fetch(taskEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        src_file_id: fileId,
        dst_actions: [
          'wrinkle',
          'pore',
          'texture',
          'acne',
          'age_spot',
          'redness',
          'oiliness',
          'moisture',
          'dark_circle_v2',
          'skin_type',
        ],
      }),
    });

    const createData = await createRes.json();
    if (!createRes.ok || !createData?.data?.task_id) {
      this.logUsage('/s2s/v2.0/task/skin-analysis', createRes.status, Date.now() - startTime, { error: createData });
      throw new Error(`Skin analysis task creation failed (${createRes.status}): ${JSON.stringify(createData)}`);
    }

    const taskId = createData.data.task_id;

    // Poll task
    for (let i = 0; i < maxPolls; i++) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      const pollEndpoint = `${this.baseUrl}/s2s/v2.0/task/skin-analysis/${taskId}`;
      
      let pollRes;
      try {
        pollRes = await fetch(pollEndpoint, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });
      } catch (err: any) {
        console.warn(`Polling attempt ${i + 1} fetch warning:`, err.message, err.cause);
        continue;
      }

      const pollData = await pollRes.json();
      const status = pollData?.data?.task_status || pollData?.task_status;

      if (status === 'success') {
        this.logUsage('/s2s/v2.0/task/skin-analysis', 200, Date.now() - startTime, { taskId });
        let reportData = null;
        const zipUrl = pollData?.data?.results?.url;
        if (zipUrl) {
          try {
            const zipRes = await fetch(zipUrl);
            const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
            const zip = new AdmZip(zipBuffer);
            const scoreEntry = zip.getEntry('skinanalysisResult/score_info.json');
            if (scoreEntry) {
              reportData = JSON.parse(scoreEntry.getData().toString('utf-8'));
              this.saveFixture('skin-analysis-report.json', reportData);
            }
          } catch (zipErr) {
            console.error('Failed to unpack zip report:', zipErr);
          }
        }
        this.saveFixture('skin-analysis-sample.json', pollData);
        return {
          ...pollData.data,
          report: reportData,
        };
      }

      if (status === 'error' || status === 'failed') {
        this.logUsage('/s2s/v2.0/task/skin-analysis', 500, Date.now() - startTime, { taskId, error: pollData });
        throw new Error(`Skin analysis failed: ${JSON.stringify(pollData)}`);
      }
    }

    throw new Error(`Skin analysis timed out after ${maxPolls * intervalMs / 1000}s`);
  }

  /**
   * Submit and poll Apparel Virtual Try-On
   */
  async tryOnCloth(srcFileId: string, refFileId: string, maxPolls = 30, intervalMs = 2000): Promise<ClothTryOnResult> {
    const startTime = Date.now();
    const taskEndpoint = `${this.baseUrl}/s2s/v2.0/task/cloth`;

    const createRes = await fetch(taskEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        src_file_id: srcFileId,
        ref_file_id: refFileId,
        garment_category: 'auto',
      }),
    });

    const createData = await createRes.json();
    if (!createRes.ok || !createData?.data?.task_id) {
      this.logUsage('/s2s/v2.0/task/cloth', createRes.status, Date.now() - startTime, { error: createData });
      throw new Error(`Cloth try-on task creation failed (${createRes.status}): ${JSON.stringify(createData)}`);
    }

    const taskId = createData.data.task_id;

    // Poll task
    for (let i = 0; i < maxPolls; i++) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      const pollEndpoint = `${this.baseUrl}/s2s/v2.0/task/cloth/${taskId}`;
      let pollRes;
      try {
        pollRes = await fetch(pollEndpoint, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });
      } catch (err: any) {
        console.warn(`Cloth polling attempt ${i + 1} fetch warning:`, err.message, err.cause);
        continue;
      }

      const pollData = await pollRes.json();
      const status = pollData?.data?.task_status || pollData?.task_status;

      if (status === 'success') {
        this.logUsage('/s2s/v2.0/task/cloth', 200, Date.now() - startTime, { taskId });
        this.saveFixture('cloth-tryon-sample.json', pollData);
        return pollData.data;
      }

      if (status === 'error' || status === 'failed') {
        this.logUsage('/s2s/v2.0/task/cloth', 500, Date.now() - startTime, { taskId, error: pollData });
        throw new Error(`Cloth try-on failed: ${JSON.stringify(pollData)}`);
      }
    }

    throw new Error(`Cloth try-on timed out after ${maxPolls * intervalMs / 1000}s`);
  }

  saveFixture(filename: string, data: any) {
    try {
      const sanitized = JSON.parse(JSON.stringify(data));
      // Remove any sensitive authorization or user tokens
      delete sanitized.api_key;
      delete sanitized.token;
      fs.writeFileSync(path.join(this.cacheDir, filename), JSON.stringify(sanitized, null, 2));
    } catch (err) {
      console.error('Failed to save fixture:', err);
    }
  }

  loadFixture(filename: string) {
    const filePath = path.join(this.cacheDir, filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    return null;
  }
}
