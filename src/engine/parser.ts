import ingredientsList from '../../data/ingredients.json';

export interface ParsedIngredient {
  raw: string;
  normalized: string;
  knownId?: string;
  category?: string;
  isKnown: boolean;
  tags?: {
    helps_for: string[];
    caution_for: string[];
  };
  strength_note?: string;
  source?: string;
}

export interface ParseResult {
  rawText: string;
  ingredients: ParsedIngredient[];
  knownCount: number;
  unknownCount: number;
  hasUnknowns: boolean;
}

// Synonyms map: variations -> canonical ingredient id in ingredients.json
const SYNONYMS: Record<string, string> = {
  water: 'water',
  aqua: 'water',
  'purified water': 'water',
  'eau': 'water',
  'glycerin': 'glycerin',
  'glycerol': 'glycerin',
  'parfum': 'fragrance',
  'fragrance': 'fragrance',
  'aroma': 'fragrance',
  'retinol': 'retinol',
  'vitamin a': 'retinol',
  'retinal': 'retinal',
  'retinaldehyde': 'retinal',
  'tretinoin': 'tretinoin',
  'retinoic acid': 'tretinoin',
  'all-trans retinoic acid': 'tretinoin',
  'salicylic acid': 'salicylic_acid',
  'bha': 'salicylic_acid',
  '2-hydroxybenzoic acid': 'salicylic_acid',
  'glycolic acid': 'glycolic_acid',
  'lactic acid': 'lactic_acid',
  'mandelic acid': 'mandelic_acid',
  'ascorbic acid': 'ascorbic_acid',
  'l-ascorbic acid': 'ascorbic_acid',
  'vitamin c': 'ascorbic_acid',
  'niacinamide': 'niacinamide',
  'nicotinamide': 'niacinamide',
  'vitamin b3': 'niacinamide',
  'hyaluronic acid': 'hyaluronic_acid',
  'sodium hyaluronate': 'sodium_hyaluronate',
  'ceramide np': 'ceramide_np',
  'ceramide 3': 'ceramide_np',
  'ceramide ap': 'ceramide_ap',
  'ceramide eop': 'ceramide_eop',
  'benzoyl peroxide': 'benzoyl_peroxide',
  'bpo': 'benzoyl_peroxide',
  'alcohol denat': 'alcohol_denat',
  'alcohol denat.': 'alcohol_denat',
  'denatured alcohol': 'alcohol_denat',
  'sd alcohol 40': 'alcohol_denat',
  'ethanol': 'alcohol_denat',
  'centella asiatica': 'centella_asiatica',
  'centella asiatica extract': 'centella_asiatica',
  'cica': 'centella_asiatica',
  'panthenol': 'panthenol',
  'provitamin b5': 'panthenol',
  'zinc pca': 'zinc_pca',
  'squalane': 'squalane',
  'dimethicone': 'dimethicone',
  'tocopherol': 'tocopherol',
  'vitamin e': 'tocopherol',
  'limonene': 'limonene',
  'linalool': 'linalool',
};

const ingredientsKB: Record<string, any> = {};
for (const item of (ingredientsList as any[])) {
  ingredientsKB[item.id] = item;
}

export function parseIngredients(text: string): ParseResult {

  // Strip common label prefixes e.g. "Ingredients:", "Key Ingredients:", etc.
  let cleaned = text.replace(/^(ingredients|composition|inci|contains)\s*[:\-]\s*/i, '');

  // Normalize delimiters (replace bullets, newlines, semicolons with commas)
  cleaned = cleaned.replace(/[\n\r;•\u2022]+/g, ',');

  // Split by commas outside parentheses
  const tokens: string[] = [];
  let current = '';
  let parenDepth = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (char === '(' || char === '[' || char === '{') {
      parenDepth++;
      current += char;
    } else if (char === ')' || char === ']' || char === '}') {
      parenDepth = Math.max(0, parenDepth - 1);
      current += char;
    } else if (char === ',' && parenDepth === 0) {
      if (current.trim()) tokens.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) tokens.push(current.trim());

  const parsedList: ParsedIngredient[] = [];
  let knownCount = 0;
  let unknownCount = 0;

  for (const rawToken of tokens) {
    // Normalize token
    let normalized = rawToken
      .toLowerCase()
      .replace(/\s*\(\s*[^)]*\s*\)/g, '') // remove parenthetical specs e.g. (1%) or (plant derived)
      .replace(/[.*+?^${}()|[\]\\]/g, '') // remove punctuation
      .trim();

    if (!normalized) continue;

    // Direct synonym lookup
    let matchedId = SYNONYMS[normalized];

    // Substring / alias search in KB if not found in top-level synonyms
    if (!matchedId) {
      for (const [id, item] of Object.entries(ingredientsKB)) {
        if (
          normalized === item.inci_name.toLowerCase() ||
          normalized === id.toLowerCase() ||
          item.aliases?.some((a: string) => a.toLowerCase() === normalized)
        ) {
          matchedId = id;
          break;
        }
      }
    }

    if (matchedId && ingredientsKB[matchedId]) {
      const kbItem = ingredientsKB[matchedId];
      knownCount++;
      parsedList.push({
        raw: rawToken,
        normalized,
        knownId: matchedId,
        category: kbItem.category,
        isKnown: true,
        tags: kbItem.tags,
        strength_note: kbItem.strength_note,
        source: kbItem.source,
      });
    } else {
      unknownCount++;
      parsedList.push({
        raw: rawToken,
        normalized,
        isKnown: false,
      });
    }
  }

  return {
    rawText: text,
    ingredients: parsedList,
    knownCount,
    unknownCount,
    hasUnknowns: unknownCount > 0,
  };
}
