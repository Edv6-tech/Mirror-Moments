import { ParseResult } from './parser.ts';
import { MatchResult, Finding, ConflictWarning } from './matcher.ts';
import { UserSkinProfile } from '../agents/profiler.ts';

export type VerdictDecision = 'BUY' | 'PATCH-TEST FIRST' | 'SKIP';

export interface VerdictResult {
  decision: VerdictDecision;
  badgeColor: string;
  headline: string;
  summary: string;
  findings: Finding[];
  conflicts: ConflictWarning[];
  unknownsCount: number;
  cappedByUnknowns: boolean;
  blockedByCaution: boolean;
  notMedicalAdviceNotice: string;
  testedAt: string;
}

export function computeVerdict(
  parseResult: ParseResult,
  matchResult: MatchResult,
  profile: UserSkinProfile
): VerdictResult {
  const { findings, conflicts, benefitScore, cautionScore } = matchResult;
  const topConcernTag = profile.topConcerns[0]?.actionTag;

  // Rule 1: Check if any caution finding matches user's TOP concern
  const topConcernCaution = findings.some(
    (f) => f.direction === 'caution' && f.ruleId.includes(topConcernTag || '')
  );

  const hasHighConflicts = conflicts.some((c) => c.severity === 'high');
  const hasAnyCaution = findings.some((f) => f.direction === 'caution');
  const hasUnknowns = parseResult.hasUnknowns;

  let decision: VerdictDecision;
  let headline = '';
  let summary = '';
  let blockedByCaution = false;
  let cappedByUnknowns = false;

  // 1. High Conflict or Severe Caution on Top Concern -> SKIP
  if (hasHighConflicts || (topConcernCaution && cautionScore >= 3) || cautionScore >= 5) {
    decision = 'SKIP';
    blockedByCaution = true;
    headline = 'Formula Not Recommended for Current Skin Condition';
    summary = hasHighConflicts
      ? 'Critical ingredient conflict detected that can severely compromise your skin barrier.'
      : `Contains ingredients documented to provoke irritation or aggravate your primary concern (${profile.topConcerns[0]?.label}).`;
  }
  // 2. Moderate cautions, lower cautions, or unknown ingredients -> PATCH-TEST FIRST
  else if (hasAnyCaution || cautionScore > 0) {
    decision = 'PATCH-TEST FIRST';
    blockedByCaution = true;
    headline = 'Proceed with Caution: Patch-Test First';
    summary = 'Active or sensitizing ingredients detected. Test behind the ear or on inner wrist for 24 hours before facial use.';
  }
  // 3. Unknown ingredients cap at PATCH-TEST FIRST
  else if (hasUnknowns) {
    decision = 'PATCH-TEST FIRST';
    cappedByUnknowns = true;
    headline = 'Unverified Ingredients: Patch-Test First';
    summary = `${parseResult.unknownCount} uncataloged botanical or proprietary ingredient(s) detected. A 24-hour patch-test is strongly advised.`;
  }
  // 4. Good benefit match and clean profile -> BUY
  else if (benefitScore >= 2 && cautionScore === 0) {
    decision = 'BUY';
    headline = 'Excellent Fit for Your Skin Priorities';
    summary = `Well-formulated product featuring active ingredients that directly support your skin priorities (${profile.topConcerns.map((c) => c.label).slice(0, 2).join(' and ')}).`;
  }
  // 5. Neutral / gentle base formula with no specific active hits
  else {
    decision = 'PATCH-TEST FIRST';
    headline = 'Gentle Formula: Standard Patch-Test';
    summary = 'No strong cautions detected, but active alignment with your top priorities is minimal.';
  }

  // Double-check hard safety constraint: NEVER ALLOW A BUY IF CAUTION PRESENT
  if (decision === 'BUY' && (hasAnyCaution || hasUnknowns || conflicts.length > 0)) {
    decision = 'PATCH-TEST FIRST';
    blockedByCaution = true;
  }

  const badgeColor =
    decision === 'BUY' ? '#10B981' : decision === 'PATCH-TEST FIRST' ? '#F59E0B' : '#F43F5E';

  return {
    decision,
    badgeColor,
    headline,
    summary,
    findings,
    conflicts,
    unknownsCount: parseResult.unknownCount,
    cappedByUnknowns,
    blockedByCaution,
    notMedicalAdviceNotice: 'Not medical advice. If you have a skin condition, ask a dermatologist.',
    testedAt: new Date().toISOString(),
  };
}
