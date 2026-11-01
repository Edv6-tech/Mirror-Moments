import { UserSkinProfile } from './profiler.ts';

export interface ColorFamilySuggestion {
  family: string;
  badgeHex: string;
  rationale: string;
  matchingGarmentIds: string[];
}

export function recommendColorFamilies(profile: UserSkinProfile): ColorFamilySuggestion[] {
  const suggestions: ColorFamilySuggestion[] = [];

  const concernTags = new Set(profile.topConcerns.map((c) => c.actionTag));

  // 1. If redness / sensitivity is a top concern
  if (concernTags.has('redness')) {
    suggestions.push({
      family: 'Olive & Sage Green',
      badgeHex: '#4D5B43',
      rationale: 'Earthy greens and soft sage visually neutralize redness and skin flushing, creating a calm, harmonious tone.',
      matchingGarmentIds: ['garment_olive_overshirt', 'garment_sage_sweater'],
    });
    suggestions.push({
      family: 'Cool Blue & Navy',
      badgeHex: '#1E293B',
      rationale: 'Cool oceanic tones provide contrast that directs attention toward facial features rather than vascular irritation.',
      matchingGarmentIds: ['garment_navy_crew'],
    });
  }
  // 2. If hydration / glow is prioritized
  else if (concernTags.has('moisture') || concernTags.has('spots')) {
    suggestions.push({
      family: 'Cool Blue & Navy',
      badgeHex: '#1E293B',
      rationale: 'Deep rich blues offer a grounding frame that makes well-hydrated skin appear brighter and more refreshed.',
      matchingGarmentIds: ['garment_navy_crew'],
    });
    suggestions.push({
      family: 'Crisp White & Minimal',
      badgeHex: '#F8FAFC',
      rationale: 'High-luminance neutrals bounce soft light back onto the face, visually reducing eye fatigue shadows.',
      matchingGarmentIds: ['garment_white_tee', 'garment_charcoal_jacket'],
    });
  }
  // 3. General / texture / combination
  else {
    suggestions.push({
      family: 'Cool Blue & Navy',
      badgeHex: '#1E293B',
      rationale: 'Versatile deep blues offer universal flattering contrast across combination skin profiles.',
      matchingGarmentIds: ['garment_navy_crew'],
    });
    suggestions.push({
      family: 'Warm Terracotta & Sunset',
      badgeHex: '#C26247',
      rationale: 'Subtle warm tones impart a healthy sun-kissed vitality to balanced skin.',
      matchingGarmentIds: ['garment_terracotta_linen'],
    });
  }

  // Always include a secondary neutral family
  if (suggestions.length < 3) {
    suggestions.push({
      family: 'Olive & Sage Green',
      badgeHex: '#4D5B43',
      rationale: 'Gentle nature-inspired pigments that offer versatile pairing without overpowering your complexion.',
      matchingGarmentIds: ['garment_olive_overshirt', 'garment_sage_sweater'],
    });
  }

  return suggestions.slice(0, 3);
}

// Helper to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

// Convert sRGB to CIELAB (L*, a*, b*)
export function rgbToLab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  const [rL, gL, bL] = [r / 255, g / 255, b / 255].map((v) =>
    v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92
  );
  // Observer 2°, Illuminant D65
  const X = (rL * 0.4124 + gL * 0.3576 + bL * 0.1805) / 0.95047;
  const Y = (rL * 0.2126 + gL * 0.7152 + bL * 0.0722) / 1.00000;
  const Z = (rL * 0.0193 + gL * 0.1192 + bL * 0.9505) / 1.08883;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return {
    L: 116 * f(Y) - 16,
    a: 500 * (f(X) - f(Y)),
    b: 200 * (f(Y) - f(Z)),
  };
}

// Calculate CIE76 Delta E color difference
export function calculateDeltaE(hex1: string, hex2: string): number {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  const lab1 = rgbToLab(c1.r, c1.g, c1.b);
  const lab2 = rgbToLab(c2.r, c2.g, c2.b);
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

// Calculate Complexion Harmony Score (0 - 100%)
export function computeComplexionHarmony(skinHex: string, garmentHex: string): {
  score: number;
  deltaE: number;
  harmonyLevel: 'Exceptional' | 'Harmonious' | 'Moderate Contrast' | 'Muted';
  advice: string;
} {
  const deltaE = Math.round(calculateDeltaE(skinHex, garmentHex) * 10) / 10;
  // Ideal aesthetic garment-skin contrast deltaE is typically between 30 and 65
  let score = 100 - Math.min(60, Math.abs(deltaE - 45) * 1.5);
  score = Math.max(72, Math.min(98, Math.round(score)));

  let harmonyLevel: 'Exceptional' | 'Harmonious' | 'Moderate Contrast' | 'Muted' = 'Harmonious';
  if (score >= 92) harmonyLevel = 'Exceptional';
  else if (score >= 84) harmonyLevel = 'Harmonious';
  else if (score >= 76) harmonyLevel = 'Moderate Contrast';
  else harmonyLevel = 'Muted';

  return {
    score,
    deltaE,
    harmonyLevel,
    advice: `CIELAB Delta E color metric of ${deltaE} provides ${harmonyLevel.toLowerCase()} optical balance against your skin luminosity.`,
  };
}
