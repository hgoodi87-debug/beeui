/**
 * 빌드 전 환경변수 검증
 * - VITE_SUPABASE_URL이 dev proxy 경로(/supabase)이면 프로덕션 빌드를 막음
 * - 필수 환경변수 누락 시 경고
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

function loadEnvFile(filename) {
  const filePath = resolve(rootDir, filename);
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, 'utf-8');
  const vars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    vars[key] = val;
  }
  return vars;
}

// Vite env loading order for production build
const env = {
  ...loadEnvFile('.env'),
  ...loadEnvFile('.env.local'),       // .env.local overrides .env (빌드 시에도 적용됨)
  ...loadEnvFile('.env.production'),  // .env.production overrides both
  ...loadEnvFile('.env.production.local'),
};

let hasError = false;
let hasWarning = false;

const supabaseUrl = env['VITE_SUPABASE_URL'] || '';
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'] || env['VITE_SUPABASE_PUBLISHABLE_KEY'] || '';

// 핵심 체크: dev proxy 경로가 프로덕션 빌드에 들어가는지 확인
if (supabaseUrl.startsWith('/')) {
  console.error('\n[validate-env] FAIL: VITE_SUPABASE_URL이 상대경로입니다.');
  console.error(`  현재값: "${supabaseUrl}"`);
  console.error('  이 값은 Vite dev 프록시 전용입니다. 프로덕션 빌드에 들어가면 Supabase 연결이 실패합니다.');
  console.error('  .env.production 파일에 실제 URL을 설정하세요:');
  console.error('  VITE_SUPABASE_URL=https://xpnfjolqiffduedwtxey.supabase.co\n');
  hasError = true;
}

if (!supabaseKey) {
  console.error('[validate-env] FAIL: VITE_SUPABASE_ANON_KEY (또는 VITE_SUPABASE_PUBLISHABLE_KEY)가 없습니다.');
  hasError = true;
}

if (!env['VITE_ADMIN_AUTH_PROVIDER']) {
  console.warn('[validate-env] WARN: VITE_ADMIN_AUTH_PROVIDER가 설정되지 않았습니다. (기본값: firebase)');
  hasWarning = true;
}

if (hasError) {
  console.error('[validate-env] 빌드를 중단합니다. 환경변수를 확인하세요.\n');
  process.exit(1);
}

if (hasWarning) {
  console.warn('[validate-env] 경고가 있지만 빌드를 계속합니다.\n');
}

console.log('[validate-env] OK: 환경변수 검증 통과');
console.log(`  VITE_SUPABASE_URL = ${supabaseUrl || '(없음 — 하드코딩 폴백 사용)'}`);
