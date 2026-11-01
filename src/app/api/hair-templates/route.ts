import { NextRequest, NextResponse } from 'next/server';
import { isMockMode } from '@/lib/youcam/youcamClient';

// In-memory 1-hour cache
let templateCache: { timestamp: number; data: unknown[]; key: string } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const FALLBACK_TEMPLATES = [
  { id: 'template_bob_01', name: 'Chic Parisian Bob', category: 'Short', thumbnail: '/garments/garment_rose_knit.jpg' },
  { id: 'template_curls_02', name: 'Voluminous Mermaid Waves', category: 'Long', thumbnail: '/garments/garment_gold_gown.jpg' },
  { id: 'template_pixie_03', name: 'Textured Modern Pixie', category: 'Short', thumbnail: '/garments/garment_navy_crew.jpg' },
  { id: 'template_bangs_04', name: 'Wispy Curtain Bangs & Layers', category: 'Medium', thumbnail: '/garments/garment_emerald_slip.jpg' },
  { id: 'template_sleek_05', name: 'Glass Hair Blunt Cut', category: 'Medium', thumbnail: '/garments/garment_burgundy_blazer.jpg' },
  { id: 'template_afro_06', name: 'Sculpted Halo Afro', category: 'Textured', thumbnail: '/garments/garment_terracotta_linen.jpg' },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedPageSize = Number(searchParams.get('page_size') || 10);
    if (!Number.isInteger(requestedPageSize) || requestedPageSize < 1 || requestedPageSize > 100) {
      return NextResponse.json({ ok: false, message: 'page_size must be an integer from 1 to 100.' }, { status: 400 });
    }
    const pageSize = requestedPageSize;
    const startingToken = searchParams.get('starting_token') || '';

    // Check 1-hour cache
    const now = Date.now();
    const cacheKey = `${pageSize}:${startingToken}`;
    if (templateCache && templateCache.key === cacheKey && now - templateCache.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        ok: true,
        templates: templateCache.data,
        cached: true,
      });
    }

    if (isMockMode()) {
      return NextResponse.json({
        ok: true,
        templates: FALLBACK_TEMPLATES,
        mock: true,
      });
    }

    const apiKey = process.env.YOUCAM_API_KEY;
    const baseUrl = (process.env.YOUCAM_BASE_URL || 'https://yce-api-01.makeupar.com').replace(/\/+$/, '');
    const endpoint = `${baseUrl}/s2s/v2.1/task/template/hair-transfer?page_size=${pageSize}${
      startingToken ? `&starting_token=${encodeURIComponent(startingToken)}` : ''
    }`;

    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (res.ok) {
      const data = await res.json();
      const templates = data?.data?.templates;
      if (!Array.isArray(templates)) {
        return NextResponse.json({ ok: false, message: 'The hairstyle catalog returned an invalid response. Try again later.' }, { status: 502 });
      }
      templateCache = { timestamp: now, data: templates, key: cacheKey };
      return NextResponse.json({ ok: true, templates });
    }

    return NextResponse.json({ ok: false, message: `The hairstyle catalog is unavailable (${res.status}).` }, { status: 502 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: 'The hairstyle catalog is unavailable. Try again later.' }, { status: 502 });
  }
}
