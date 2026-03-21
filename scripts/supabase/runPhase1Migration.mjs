import { spawn } from 'node:child_process';

const usage = `
[스봉이] Supabase Phase 1 일괄 실행기

필수 사전조건
1. Supabase SQL Editor에서 Phase 1 SQL 실행 완료
2. SUPABASE_URL
3. SUPABASE_SECRET_KEY
4. Firebase 읽기 자격증명
   - FIREBASE_SERVICE_ACCOUNT_PATH 또는
   - FIREBASE_SERVICE_ACCOUNT_JSON

실행 예시
SUPABASE_URL=프로젝트_URL \\
SUPABASE_SECRET_KEY=서버_전용_secret_key \\
FIREBASE_PROJECT_ID=beeliber-main \\
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account", ... }' \\
npm run supabase:phase1-run
`.trim();

const steps = [
  {
    label: 'Phase 1 verify',
    command: 'npm',
    args: ['run', 'supabase:verify', '--silent'],
    applyEnv: false
  },
  {
    label: 'Phase 1 auth sync',
    command: 'npm',
    args: ['run', 'supabase:sync-phase1-auth'],
    applyEnv: true
  },
  {
    label: 'Phase 1 org sync',
    command: 'npm',
    args: ['run', 'supabase:sync-phase1-org'],
    applyEnv: true
  },
  {
    label: 'Phase 1 final verify',
    command: 'npm',
    args: ['run', 'supabase:verify', '--silent'],
    applyEnv: false
  }
];

if (process.argv.includes('--help')) {
  console.log(usage);
  process.exit(0);
}

const missingEnv = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY'].filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`[스봉이] 누락된 env: ${missingEnv.join(', ')}`);
  console.log(usage);
  process.exit(1);
}

if (!process.env.FIREBASE_SERVICE_ACCOUNT_PATH && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error('[스봉이] Firebase 읽기 자격증명이 없습니다. FIREBASE_SERVICE_ACCOUNT_PATH 또는 FIREBASE_SERVICE_ACCOUNT_JSON 중 하나는 있어야 해요.');
  console.log(usage);
  process.exit(1);
}

const runStep = (step) =>
  new Promise((resolve, reject) => {
    console.log(`\n[스봉이] ${step.label} 시작`);
    const child = spawn(step.command, step.args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        ...(step.applyEnv ? { SUPABASE_APPLY: 'true' } : {})
      }
    });

    child.on('exit', (code) => {
      if (code === 0) {
        console.log(`[스봉이] ${step.label} 완료`);
        resolve();
        return;
      }

      reject(new Error(`${step.label} failed with exit code ${code}`));
    });

    child.on('error', reject);
  });

const main = async () => {
  for (const step of steps) {
    await runStep(step);
  }

  console.log('\n[스봉이] Phase 1 일괄 실행 끝났어요. 이제 프론트 env 전환하고 관리자 로그인 검증만 하면 됩니다.');
};

main().catch((error) => {
  console.error(`[스봉이] Phase 1 일괄 실행 중 멈춤: ${error.message}`);
  process.exit(1);
});
