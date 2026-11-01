import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const shouldEmptyTrash = args.includes('--empty-trash');
const isLiveRun = args.includes('--apply') || shouldEmptyTrash;

const wardrobeDir = path.resolve(process.cwd(), 'public/uploads/wardrobe');
const trashDir = path.resolve(process.cwd(), '_trash_review');
const reportPath = path.resolve(process.cwd(), '_trash_review/report.csv');

if (!fs.existsSync(trashDir)) {
  fs.mkdirSync(trashDir, { recursive: true });
}

if (shouldEmptyTrash) {
  console.log('🚨 Emptying _trash_review folder...');
  const files = fs.readdirSync(trashDir);
  for (const f of files) {
    if (f !== 'report.csv') {
      fs.unlinkSync(path.join(trashDir, f));
    }
  }
  console.log(`✅ Emptied ${files.length} items from trash review.`);
  process.exit(0);
}

console.log(`\n🧹 Wardrobe Cleanup Scan (${isLiveRun ? 'LIVE' : 'DRY RUN'})`);
console.log(`Scanning: ${wardrobeDir}`);

if (!fs.existsSync(wardrobeDir)) {
  console.log('No uploads in wardrobe directory.');
  process.exit(0);
}

const files = fs.readdirSync(wardrobeDir);
const reportRows: string[] = ['filename,size_bytes,status,reason'];

let movedCount = 0;
for (const file of files) {
  const filePath = path.join(wardrobeDir, file);
  const stat = fs.statSync(filePath);

  // If file is very small (< 1KB) or non-image, flag it
  const isInvalid = stat.size < 1024 || (!file.endsWith('.jpg') && !file.endsWith('.png'));

  if (isInvalid) {
    reportRows.push(`${file},${stat.size},FLAGGED,suspicious_file`);
    if (isLiveRun) {
      const dest = path.join(trashDir, file);
      fs.renameSync(filePath, dest);
      movedCount++;
    }
  } else {
    reportRows.push(`${file},${stat.size},KEPT,valid_garment_format`);
  }
}

fs.writeFileSync(reportPath, reportRows.join('\n'));
console.log(`Scan complete. Report written to ${reportPath}`);
if (!isLiveRun) {
  console.log('Dry run complete. Run with --apply to move non-dress files to _trash_review/');
} else {
  console.log(`Moved ${movedCount} flagged items to _trash_review/.`);
}
