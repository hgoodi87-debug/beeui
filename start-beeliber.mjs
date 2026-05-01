#!/usr/bin/env node
/**
 * beeliber 작업 시작 스크립트
 * 실행: node start-beeliber.mjs
 * 역할: beeliber_zip → beeliber_ui 파일 동기화 + dev 서버 실행
 */
import { execSync, spawn } from 'child_process';
import { existsSync, copyFileSync, statSync } from 'fs';
import { join } from 'path';

const SRC = 'C:/Users/hyunjung/Documents/beeliber_zip/beeliber--/client';
const DST = 'C:/Users/hyunjung/Documents/beeliber_ui/client';
const REPO = 'C:/Users/hyunjung/Documents/beeliber_ui';

// beeliber_zip에서 추가/수정된 컴포넌트 목록
const SYNC_FILES = [
  'components/MockupBookingFlow.tsx',
  'components/BookingFlowModal.tsx',
  'components/DwMiniMap.tsx',
  'components/landing/LandingHero.tsx',
  'index.css',
];

console.log('🔄 파일 동기화 중...');
const changed = [];
for (const f of SYNC_FILES) {
  const src = join(SRC, f);
  const dst = join(DST, f);
  if (!existsSync(src)) { console.log(`  ⚠️  소스 없음: ${f}`); continue; }
  const srcMtime = statSync(src).mtimeMs;
  const dstMtime = existsSync(dst) ? statSync(dst).mtimeMs : 0;
  if (srcMtime > dstMtime) {
    copyFileSync(src, dst);
    changed.push(f);
    console.log(`  ✅ 복사: ${f}`);
  } else {
    console.log(`  ✔  최신: ${f}`);
  }
}

if (changed.length > 0) {
  console.log('\n📦 git 커밋 & 푸시 (동교)...');
  try {
    execSync(`cd "${REPO}" && git add ${changed.map(f => `client/${f}`).join(' ')}`, { stdio: 'inherit' });
    execSync(`cd "${REPO}" && git commit -m "sync: beeliber_zip → beeliber_ui 자동 동기화"`, { stdio: 'inherit' });
    execSync(`cd "${REPO}" && git push origin 동교`, { stdio: 'inherit' });
  } catch(e) { console.log('  ⚠️  커밋 건너뜀 (변경 없거나 오류)'); }
} else {
  console.log('\n✔  동기화 불필요 — 모든 파일 최신');
}

console.log('\n🚀 dev 서버 시작 (http://localhost:5173)...');
const dev = spawn('npm', ['run', 'dev', '--', '--port', '5173'], {
  cwd: join(REPO, 'client'),
  stdio: 'inherit',
  shell: true,
});
dev.on('error', (e) => console.error('dev 서버 오류:', e));
