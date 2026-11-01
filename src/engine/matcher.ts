import { ParsedIngredient } from './parser.ts';
import { UserSkinProfile } from '../agents/profiler.ts';
import rulesJson from '../../data/rules.json';

export interface Finding {
  ruleId: string;
  type: 'benefit' | 'caution' | 'conflict';
  ingredient: string;
  inciName: string;
  concern: string;
  direction: 'helps' | 'caution';
  weight: number;
  reason: string;
  citation: string;
  severityLevel?: 'Mild' | 'Moderate' | 'High';
}

export interface ConflictWarning {
  conflictId: string;
  ingredientA: string;
  ingredientB: string;
  severity: 'medium' | 'high';
  warning: string;
  recommendation: string;
}

export interface MatchResult {
  findings: Finding[];
  conflicts: ConflictWarning[];
  benefitScore: number;
  cautionScore: number;
  triggeredConcerns: string[];
}

const rulesData = rulesJson as { concern_rules: any[]; conflict_rules: any[] };

export function matchIngredients(
  ingredients: ParsedIngredient[],
  profile: UserSkinProfile
): MatchResult {

  const findings: Finding[] = [];
  const conflicts: ConflictWarning[] = [];
  let benefitScore = 0;
  let cautionScore = 0;
  const triggeredConcernsSet = new Set<string>();

  // Map of user's active concern actionTags
  const userConcernTags = new Set(profile.topConcerns.map((c) => c.actionTag));
  const concernByTag = new Map(profile.topConcerns.map((c) => [c.actionTag, c]));

  // 1. Evaluate concern rules against each parsed ingredient
  for (const ing of ingredients) {
    if (!ing.isKnown || !ing.tags) continue;

    // Check "helps_for" tags
    for (const tag of ing.tags.helps_for) {
      if (userConcernTags.has(tag)) {
        const concernObj = concernByTag.get(tag);
        // Find matching rule in rules.json
        const rule = rulesData.concern_rules.find(
          (r) => (r.ingredient_tag === ing.category || r.ingredient_tag === ing.knownId) && r.concern === tag && r.direction === 'helps'
        ) || {
          id: `rule_helps_${ing.knownId}_${tag}`,
          weight: 2,
          reason: `Contains ${ing.normalized}, known to support skin with ${concernObj?.label || tag}.`,
          citation: ing.source || 'CosIng Cosmetic Ingredient Database (European Commission).',
        };

        benefitScore += rule.weight;
        triggeredConcernsSet.add(tag);

        findings.push({
          ruleId: rule.id,
          type: 'benefit',
          ingredient: ing.raw,
          inciName: ing.normalized,
          concern: concernObj?.label || tag,
          direction: 'helps',
          weight: rule.weight,
          reason: rule.reason,
          citation: rule.citation,
          severityLevel: concernObj?.severityLevel,
        });
      }
    }

    // Check "caution_for" tags
    for (const tag of ing.tags.caution_for) {
      if (userConcernTags.has(tag)) {
        const concernObj = concernByTag.get(tag);
        const rule = rulesData.concern_rules.find(
          (r) => (r.ingredient_tag === ing.category || r.ingredient_tag === ing.knownId) && r.concern === tag && r.direction === 'caution'
        ) || {
          id: `rule_caution_${ing.knownId}_${tag}`,
          weight: -3,
          reason: `${ing.raw} may aggravate ${concernObj?.label || tag} or provoke cutaneous irritation.`,
          citation: ing.source || 'SCCS Safety Evaluation / Dermatology Reference Guidelines.',
        };

        cautionScore += Math.abs(rule.weight);
        triggeredConcernsSet.add(tag);

        findings.push({
          ruleId: rule.id,
          type: 'caution',
          ingredient: ing.raw,
          inciName: ing.normalized,
          concern: concernObj?.label || tag,
          direction: 'caution',
          weight: rule.weight,
          reason: rule.reason,
          citation: rule.citation,
          severityLevel: concernObj?.severityLevel,
        });
      }
    }
  }

  // 2. Evaluate conflict rules between ingredients inside this product
  const categoriesPresent = new Map<string, ParsedIngredient>();
  for (const ing of ingredients) {
    if (ing.category) {
      categoriesPresent.set(ing.category, ing);
    }
    if (ing.knownId) {
      categoriesPresent.set(ing.knownId, ing);
    }
  }

  for (const cRule of rulesData.conflict_rules) {
    if (categoriesPresent.has(cRule.tag_a) && categoriesPresent.has(cRule.tag_b)) {
      const ingA = categoriesPresent.get(cRule.tag_a)!;
      const ingB = categoriesPresent.get(cRule.tag_b)!;

      conflicts.push({
        conflictId: cRule.id,
        ingredientA: ingA.raw,
        ingredientB: ingB.raw,
        severity: cRule.severity,
        warning: cRule.warning,
        recommendation: cRule.recommendation,
      });

      findings.push({
        ruleId: cRule.id,
        type: 'conflict',
        ingredient: `${ingA.raw} + ${ingB.raw}`,
        inciName: `${ingA.normalized} + ${ingB.normalized}`,
        concern: 'Routine Formula Conflict',
        direction: 'caution',
        weight: -4,
        reason: cRule.warning,
        citation: 'International Journal of Cosmetic Science / American Academy of Dermatology guidelines.',
      });
      cautionScore += 4;
    }
  }

  return {
    findings,
    conflicts,
    benefitScore,
    cautionScore,
    triggeredConcerns: Array.from(triggeredConcernsSet),
  };
}
