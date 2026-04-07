/**
 * 빌드 전 환경변수 검증 스크립트
 * CI/CD에서 잘못된 Supabase URL로 배포되는 것을 방지
 */

const required = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
];

const errors = [];

for (const key of required) {
  const value = (process.env[key] || '').trim();
  if (!value) {
    errors.push(`  - ${key}: 값이 비어있음`);
  }
}

const supabaseUrl = (process.env.VITE_SUPABASE_URL || '').trim();
if (supabaseUrl && !/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(supabaseUrl)) {
  errors.push(`  - VITE_SUPABASE_URL: 올바른 Supabase URL 형식이 아님 (${supabaseUrl})`);
}

if (errors.length > 0) {
  console.error('\n[validate-env] 필수 환경변수 검증 실패:\n');
  console.error(errors.join('\n'));
  console.error('\nGitHub Secrets 또는 .env 파일을 확인하세요.\n');
  process.exit(1);
}

console.log(`[validate-env] 환경변수 검증 통과 (SUPABASE_URL: ${supabaseUrl})`);
