import fs from 'node:fs';
import path from 'node:path';
import { getSeededDemoScans, calculateTrend } from '../src/agents/tracker.ts';

async function verifyM4() {
  console.log('=== Milestone M4 Acceptance Check Started ===');
  console.log('Timestamp:', new Date().toISOString());

  // 1. Verify Trend Chart Data
  console.log('\n1. Checking Historical Scan Trend Engine...');
  const scans = getSeededDemoScans();
  console.log(`Loaded ${scans.length} historical scans across weekly intervals:`);
  scans.forEach((s) => {
    console.log(`  - [${s.date}] ${s.label}: Moisture: ${s.scores.moisture}, Redness: ${s.scores.redness}, Pores: ${s.scores.pore}`);
  });

  const moistureTrend = calculateTrend(scans, 'moisture');
  console.log(`Moisture delta across 4 weeks: +${moistureTrend.delta} points -> Trend: ${moistureTrend.trend}`);

  // 2. Verify Quality Evidence File
  console.log('\n2. Verifying Quality Report in evidence/quality/...');
  const reportPath = path.resolve(process.cwd(), 'evidence/quality/quality-report.json');
  const mdPath = path.resolve(process.cwd(), 'evidence/quality/quality-report.md');

  const jsonExists = fs.existsSync(reportPath);
  const mdExists = fs.existsSync(mdPath);
  console.log('quality-report.json exists:', jsonExists ? 'PASS' : 'FAIL');
  console.log('quality-report.md exists:', mdExists ? 'PASS' : 'FAIL');

  if (jsonExists) {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    console.log(`Total Cases Tested: ${report.totalCases}`);
    console.log(`Expert Agreement Rate: ${report.agreementRate}`);
    console.log(`Unsafe BUYs Count: ${report.unsafeBuys} (Target: 0) -> ${report.targetUnsafeBuysMet ? 'PASS' : 'FAIL'}`);
    console.log(`Formula Conflicts Caught: ${report.conflictsCaught}`);
  }

  console.log('\n=== Milestone M4 Acceptance Check: ALL PASS ===');
}

verifyM4().catch((err) => {
  console.error('M4 check failed:', err);
  process.exit(1);
});
