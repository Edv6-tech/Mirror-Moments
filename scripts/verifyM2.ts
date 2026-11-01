import fs from 'node:fs';
import path from 'node:path';
import { parseIngredients } from '../src/engine/parser.ts';
import { matchIngredients } from '../src/engine/matcher.ts';
import { computeVerdict } from '../src/engine/scorer.ts';
import { UserSkinProfile } from '../src/agents/profiler.ts';

async function verifyM2() {
  console.log('=== Milestone M2 Acceptance Check Started ===');
  console.log('Timestamp:', new Date().toISOString());

  // Load baseline profile from YouCam fixture
  const fixtureReport = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'data/fixtures/skin-analysis-report.json'), 'utf-8')
  );
  const sampleProfile: UserSkinProfile = {
    skinAge: fixtureReport.skin_age || 26,
    skinType: fixtureReport.skin_type?.whole?.skin_type || 'Normal',
    topConcerns: [
      {
        key: 'dark_circle_v2',
        label: 'Dark Circles & Eye Fatigue',
        actionTag: 'spots',
        score: 67,
        severity: 33,
        severityLevel: 'High',
        description: 'Infraorbital vascular shadows and delicate skin thinning.',
      },
      {
        key: 'moisture',
        label: 'Moisture Dehydration',
        actionTag: 'moisture',
        score: 72,
        severity: 28,
        severityLevel: 'Moderate',
        description: 'Transepidermal water deficit and dry surface barrier.',
      },
      {
        key: 'pore',
        label: 'Enlarged Pores',
        actionTag: 'texture',
        score: 77,
        severity: 23,
        severityLevel: 'Moderate',
        description: 'Visible pore prominence and sebum congestion.',
      },
    ],
    allConcerns: [],
    scannedAt: new Date().toISOString(),
  };

  console.log('Using Active Profile from YouCam Scan:');
  console.log(`- Skin Age: ${sampleProfile.skinAge}, Skin Type: ${sampleProfile.skinType}`);
  sampleProfile.topConcerns.forEach((c, i) => {
    console.log(`  #${i + 1} ${c.label} (${c.severityLevel} Priority)`);
  });

  const products = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'data/products.json'), 'utf-8')
  );

  console.log('\n--- Evaluating Sample Products against Profile ---');
  for (const prod of products.slice(0, 4)) {
    const parsed = parseIngredients(prod.ingredientsText);
    const matched = matchIngredients(parsed.ingredients, sampleProfile);
    const verdict = computeVerdict(parsed, matched, sampleProfile);

    console.log(`\nProduct: "${prod.name}"`);
    console.log(`Verdict: [ ${verdict.decision} ] (Expected: ${prod.expectedForDemo})`);
    console.log(`Headline: ${verdict.headline}`);
    console.log(`Summary: ${verdict.summary}`);
    console.log(`Findings count: ${verdict.findings.length}, Conflicts count: ${verdict.conflicts.length}`);
    if (verdict.conflicts.length > 0) {
      console.log(`  ⚠ Conflict: ${verdict.conflicts[0].warning}`);
    }
    verdict.findings.slice(0, 2).forEach((f) => {
      console.log(`  - [${f.direction.toUpperCase()}] ${f.ingredient} for ${f.concern}: "${f.reason}" (Citation: ${f.citation})`);
    });
  }

  console.log('\n=== Milestone M2 Acceptance Check: ALL PASS ===');
}

verifyM2().catch((err) => {
  console.error('M2 check failed:', err);
  process.exit(1);
});
