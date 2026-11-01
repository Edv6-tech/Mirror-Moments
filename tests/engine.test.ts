import { describe, it, expect } from 'vitest';
import { parseIngredients } from '../src/engine/parser.ts';
import { matchIngredients } from '../src/engine/matcher.ts';
import { computeVerdict } from '../src/engine/scorer.ts';
import { UserSkinProfile } from '../src/agents/profiler.ts';

// Sample mock skin profile for test suite
const mockSensitiveProfile: UserSkinProfile = {
  skinAge: 26,
  vitalityScore: 82,
  skinType: 'Sensitive',
  topConcerns: [
    {
      key: 'redness',
      label: 'Redness & Sensitivity',
      actionTag: 'redness',
      score: 55,
      severity: 45,
      severityLevel: 'High',
      description: 'Prone to erythema and reactive flushing.',
    },
    {
      key: 'moisture',
      label: 'Moisture Dehydration',
      actionTag: 'moisture',
      score: 65,
      severity: 35,
      severityLevel: 'Moderate',
      description: 'Barrier dryness.',
    },
    {
      key: 'texture',
      label: 'Uneven Texture',
      actionTag: 'texture',
      score: 75,
      severity: 25,
      severityLevel: 'Mild',
      description: 'Minor roughness.',
    },
  ],
  allConcerns: [],
  scannedAt: new Date().toISOString(),
};

const mockAcneProfile: UserSkinProfile = {
  skinAge: 24,
  vitalityScore: 85,
  skinType: 'Oily',
  topConcerns: [
    {
      key: 'acne',
      label: 'Acne & Blemishes',
      actionTag: 'acne',
      score: 50,
      severity: 50,
      severityLevel: 'High',
      description: 'Active breakout tendencies.',
    },
    {
      key: 'oiliness',
      label: 'Excess Oiliness',
      actionTag: 'oiliness',
      score: 60,
      severity: 40,
      severityLevel: 'Moderate',
      description: 'High sebum excretion.',
    },
    {
      key: 'texture',
      label: 'Enlarged Pores',
      actionTag: 'texture',
      score: 70,
      severity: 30,
      severityLevel: 'Mild',
      description: 'Sebum congestion.',
    },
  ],
  allConcerns: [],
  scannedAt: new Date().toISOString(),
};

describe('Milestone M2: Local Verdict Engine Acceptance Checks', () => {
  // Test 1: Known caution ingredient blocks BUY
  it('known caution ingredient blocks BUY on sensitive profile', () => {
    // Contains Alcohol Denat and Parfum (known irritants for redness/sensitivity)
    const formula = 'Aqua, Alcohol Denat., Parfum, Glycerin';
    const parsed = parseIngredients(formula);
    const matched = matchIngredients(parsed.ingredients, mockSensitiveProfile);
    const verdict = computeVerdict(parsed, matched, mockSensitiveProfile);

    expect(verdict.decision).not.toBe('BUY');
    expect(['SKIP', 'PATCH-TEST FIRST']).toContain(verdict.decision);
    expect(verdict.blockedByCaution).toBe(true);
    expect(verdict.findings.some((f) => f.direction === 'caution')).toBe(true);
  });

  // Test 2: Conflict pair is flagged
  it('conflict pair (Retinoid + AHA) is flagged as severe conflict', () => {
    const formula = 'Aqua, Glycolic Acid, Retinol, Glycerin';
    const parsed = parseIngredients(formula);
    const matched = matchIngredients(parsed.ingredients, mockSensitiveProfile);
    const verdict = computeVerdict(parsed, matched, mockSensitiveProfile);

    expect(matched.conflicts.length).toBeGreaterThan(0);
    expect(matched.conflicts[0].conflictId).toBe('conflict_retinoid_aha');
    expect(verdict.decision).toBe('SKIP');
  });

  // Test 3: Unknown ingredient caps verdict at PATCH-TEST FIRST
  it('unknown ingredient caps a beneficial formula at PATCH-TEST FIRST', () => {
    // Has Ceramide NP (benefit for dehydration), but also an unknown exotic herb
    const formula = 'Aqua, Ceramide NP, Squalane, MysticalRareHerbExtract';
    const parsed = parseIngredients(formula);
    const matched = matchIngredients(parsed.ingredients, mockSensitiveProfile);
    const verdict = computeVerdict(parsed, matched, mockSensitiveProfile);

    expect(parsed.hasUnknowns).toBe(true);
    expect(verdict.decision).toBe('PATCH-TEST FIRST');
    expect(verdict.cappedByUnknowns).toBe(true);
  });

  // Test 4: Good fit returns BUY
  it('a good clean fit with matching active ingredients returns BUY', () => {
    // Ceramide NP + Hyaluronic Acid + Squalane directly target moisture dehydration
    const formula = 'Aqua, Glycerin, Ceramide NP, Hyaluronic Acid, Squalane';
    const parsed = parseIngredients(formula);
    const matched = matchIngredients(parsed.ingredients, mockSensitiveProfile);
    const verdict = computeVerdict(parsed, matched, mockSensitiveProfile);

    expect(parsed.hasUnknowns).toBe(false);
    expect(matched.cautionScore).toBe(0);
    expect(matched.benefitScore).toBeGreaterThanOrEqual(2);
    expect(verdict.decision).toBe('BUY');
  });

  // Test 5: Three sample products give three sensible verdicts
  it('evaluates three realistic sample products accurately', () => {
    // 1. Barrier cream -> BUY for dehydration
    const barrierCream = 'Aqua, Glycerin, Ceramide NP, Hyaluronic Acid, Squalane, Dimethicone';
    const v1 = computeVerdict(
      parseIngredients(barrierCream),
      matchIngredients(parseIngredients(barrierCream).ingredients, mockSensitiveProfile),
      mockSensitiveProfile
    );
    expect(v1.decision).toBe('BUY');

    // 2. High alcohol astringent -> SKIP for sensitive/redness
    const astringent = 'Aqua, Alcohol Denat., Hamamelis Virginiana (Witch Hazel) Water, Parfum, Menthol';
    const v2 = computeVerdict(
      parseIngredients(astringent),
      matchIngredients(parseIngredients(astringent).ingredients, mockSensitiveProfile),
      mockSensitiveProfile
    );
    expect(v2.decision).toBe('SKIP');

    // 3. Unknown botanical herbal elixir -> PATCH-TEST FIRST
    const herbalOil = 'Aqua, Glycerin, Tanacetum Annuum Flower Oil, Calophyllum Inophyllum Seed Oil';
    const v3 = computeVerdict(
      parseIngredients(herbalOil),
      matchIngredients(parseIngredients(herbalOil).ingredients, mockSensitiveProfile),
      mockSensitiveProfile
    );
    expect(v3.decision).toBe('PATCH-TEST FIRST');
  });

  // Test 6: Salicylic acid + Niacinamide formula is approved for acne profile
  it('salicylic acid serum benefits oily acne-prone profile', () => {
    const bhaSerum = 'Aqua, Glycerin, Salicylic Acid, Niacinamide, Zinc PCA';
    const parsed = parseIngredients(bhaSerum);
    const matched = matchIngredients(parsed.ingredients, mockAcneProfile);
    const verdict = computeVerdict(parsed, matched, mockAcneProfile);

    expect(parsed.hasUnknowns).toBe(false);
    expect(matched.benefitScore).toBeGreaterThanOrEqual(2);
    expect(verdict.decision).toBe('BUY');
  });
});
