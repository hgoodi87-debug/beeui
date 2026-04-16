/**
 * generate-webp.mjs — PNG/JPG/JPEG → WebP 자동 변환
 * 이미 WebP가 존재하면 건너뜀
 * 사용: node scripts/generate-webp.mjs
 */
import { createRequire } from 'module';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.warn('[generate-webp] sharp 미설치 — npm install -D sharp 후 재실행');
  process.exit(0);
}

const TARGET_DIRS = [
  join(__dirname, '../public/images/reviews'),
  join(__dirname, '../public/images/operations'),
  join(__dirname, '../public/images/landing'),
  join(__dirname, '../public/images/bags'),
  join(__dirname, '../public/images'),
];

const EXTS = new Set(['.png', '.jpg', '.jpeg']);
let converted = 0;
let skipped = 0;

for (const dir of TARGET_DIRS) {
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir)) {
    const ext = extname(file).toLowerCase();
    if (!EXTS.has(ext)) continue;

    const srcPath = join(dir, file);
    if (statSync(srcPath).isDirectory()) continue;

    const webpPath = join(dir, basename(file, ext) + '.webp');
    if (existsSync(webpPath)) {
      skipped++;
      continue;
    }

    try {
      await sharp(srcPath)
        .webp({ quality: 82, effort: 4 })
        .toFile(webpPath);
      const srcKb = Math.round(statSync(srcPath).size / 1024);
      const dstKb = Math.round(statSync(webpPath).size / 1024);
      console.log(`  ✓ ${file} → .webp  (${srcKb}KB → ${dstKb}KB)`);
      converted++;
    } catch (err) {
      console.warn(`  ✗ ${file} 변환 실패:`, err.message);
    }
  }
}

console.log(`\n[generate-webp] 완료: ${converted}개 변환, ${skipped}개 이미 존재`);
