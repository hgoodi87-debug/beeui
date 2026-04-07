/**
 * 기존 Supabase → 새 Supabase 데이터 복사 스크립트
 *
 * 사용법:
 *   OLD_URL=https://fzvfyeskdivulazjjpgr.supabase.co \
 *   OLD_KEY=서비스롤키 \
 *   NEW_URL=https://xpnfjolqiffduedwtxey.supabase.co \
 *   NEW_KEY=sb_secret_k7VagSRifOE3sbikrvu-zQ_XdzaT5Sl \
 *   node scripts/supabase/copyToNewProject.mjs
 */

const OLD_URL = process.env.OLD_URL?.trim();
const OLD_KEY = process.env.OLD_KEY?.trim();
const NEW_URL = process.env.NEW_URL?.trim();
const NEW_KEY = process.env.NEW_KEY?.trim();

if (!OLD_URL || !OLD_KEY || !NEW_URL || !NEW_KEY) {
  console.error('❌ OLD_URL, OLD_KEY, NEW_URL, NEW_KEY 필수');
  process.exit(1);
}

const TABLES = [
  'branch_types', 'services', 'baggage_types', 'roles',
  'branches', 'profiles', 'employees', 'employee_roles', 'employee_branch_assignments',
  'service_rules', 'locations', 'app_settings', 'discount_codes',
  'expenditures', 'daily_closings', 'chat_sessions',
  'google_reviews', 'google_review_summary',
];

async function fetchAll(table) {
  const res = await fetch(`${OLD_URL}/rest/v1/${table}?select=*&limit=5000`, {
    headers: { 'apikey': OLD_KEY, 'Authorization': `Bearer ${OLD_KEY}` }
  });
  if (!res.ok) throw new Error(`GET ${table} failed [${res.status}]`);
  return res.json();
}

async function insertAll(table, rows) {
  if (!rows.length) return 0;
  // 50개씩 배치
  let total = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const res = await fetch(`${NEW_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': NEW_KEY,
        'Authorization': `Bearer ${NEW_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`  ❌ INSERT ${table} batch ${i} failed: ${err.substring(0, 200)}`);
    } else {
      total += batch.length;
    }
  }
  return total;
}

async function main() {
  console.log('🐝 Supabase 프로젝트 간 데이터 복사');
  console.log(`  FROM: ${OLD_URL}`);
  console.log(`  TO:   ${NEW_URL}\n`);

  const results = [];
  for (const table of TABLES) {
    try {
      process.stdout.write(`📦 ${table}... `);
      const rows = await fetchAll(table);
      if (!rows.length) {
        console.log(`0 rows (empty)`);
        results.push({ table, read: 0, written: 0 });
        continue;
      }
      const written = await insertAll(table, rows);
      console.log(`${rows.length} read → ${written} written ✅`);
      results.push({ table, read: rows.length, written });
    } catch (e) {
      console.log(`❌ ${e.message}`);
      results.push({ table, read: 0, written: 0, error: e.message });
    }
  }

  console.log('\n📊 결과:');
  console.table(results);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
