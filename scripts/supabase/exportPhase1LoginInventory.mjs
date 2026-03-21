import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY'];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`[exportPhase1LoginInventory] Missing environment variable: ${key}`);
    process.exit(1);
  }
}

const supabaseUrl = process.env.SUPABASE_URL.replace(/\/+$/, '');
const secretKey = process.env.SUPABASE_SECRET_KEY;
const markdownPath = process.env.SUPABASE_INVENTORY_MD_PATH
  || '/Users/cm/Desktop/beeliber/beeliber-main/docs/SUPABASE_PHASE1_LOGIN_INVENTORY.md';
const csvPath = process.env.SUPABASE_INVENTORY_CSV_PATH
  || '/Users/cm/Desktop/beeliber/beeliber-main/docs/SUPABASE_PHASE1_LOGIN_INVENTORY.csv';

const headers = {
  apikey: secretKey,
  Authorization: `Bearer ${secretKey}`,
  'Content-Type': 'application/json',
};

const parseJsonResponse = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

const request = async (pathName) => {
  const response = await fetch(`${supabaseUrl}${pathName}`, { headers });
  const body = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      `[exportPhase1LoginInventory] ${pathName} failed (${response.status}): ${JSON.stringify(body)}`
    );
  }

  return body;
};

const escapeCell = (value) => {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const main = async () => {
  const select = encodeURIComponent(
    'id,name,email,legacy_admin_doc_id,org_type,employment_status,security,employee_roles(is_primary,role:roles(code)),employee_branch_assignments(is_primary,branch:branches(branch_code,name))'
  );
  const employees = await request(`/rest/v1/employees?select=${select}&order=name.asc&limit=500`);

  const rows = employees.map((employee) => {
    const primaryRoleEntry =
      employee.employee_roles?.find((entry) => entry?.is_primary)
      || employee.employee_roles?.[0]
      || null;
    const primaryBranchEntry =
      employee.employee_branch_assignments?.find((entry) => entry?.is_primary)
      || employee.employee_branch_assignments?.[0]
      || null;

    return {
      name: employee.name || '',
      loginEmail: employee.email || '',
      synthetic: employee.security?.synthetic_email === true,
      roleCode: primaryRoleEntry?.role?.code || '',
      branchCode: primaryBranchEntry?.branch?.branch_code || '',
      branchName: primaryBranchEntry?.branch?.name || '',
      orgType: employee.org_type || '',
      employmentStatus: employee.employment_status || '',
      legacyAdminDocId: employee.legacy_admin_doc_id || '',
    };
  });

  const syntheticRows = rows.filter((row) => row.synthetic);
  const generatedAt = new Date().toISOString();

  const markdown = [
    '# Supabase Phase 1 로그인 인벤토리',
    '',
    '이 문서는 Supabase Phase 1 전환 후 관리자/직원 로그인용 계정 목록을 정리한 결과물이다.',
    '',
    `- 생성 시각(UTC): ${generatedAt}`,
    `- 전체 직원 수: ${rows.length}`,
    `- synthetic 이메일 계정 수: ${syntheticRows.length}`,
    '',
    '## 사용 규칙',
    '',
    '- `@staff.bee-liber.invalid` 로 끝나는 이메일은 임시 synthetic 로그인 주소다.',
    '- 이 주소는 실제 메일 수신용이 아니라 전환 기간 로그인 식별자다.',
    '- 실제 이메일을 확보하면 HQ에서 Supabase 계정 이메일을 교체해야 한다.',
    '',
    '## 계정 목록',
    '',
    '| 이름 | 로그인 이메일 | synthetic | 역할 | 지점 코드 | 지점명 | 조직 | 상태 | legacy_admin_doc_id |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map((row) =>
      `| ${row.name || '-'} | ${row.loginEmail || '-'} | ${row.synthetic ? 'yes' : 'no'} | ${row.roleCode || '-'} | ${row.branchCode || '-'} | ${row.branchName || '-'} | ${row.orgType || '-'} | ${row.employmentStatus || '-'} | ${row.legacyAdminDocId || '-'} |`
    ),
    '',
  ].join('\n');

  const csv = [
    [
      'name',
      'login_email',
      'synthetic',
      'role_code',
      'branch_code',
      'branch_name',
      'org_type',
      'employment_status',
      'legacy_admin_doc_id',
    ].join(','),
    ...rows.map((row) =>
      [
        row.name,
        row.loginEmail,
        row.synthetic ? 'yes' : 'no',
        row.roleCode,
        row.branchCode,
        row.branchName,
        row.orgType,
        row.employmentStatus,
        row.legacyAdminDocId,
      ].map(escapeCell).join(',')
    ),
    '',
  ].join('\n');

  await writeFile(markdownPath, markdown, 'utf8');
  await writeFile(csvPath, csv, 'utf8');

  console.log(
    JSON.stringify(
      {
        markdownPath: path.resolve(markdownPath),
        csvPath: path.resolve(csvPath),
        totalEmployees: rows.length,
        syntheticEmployees: syntheticRows.length,
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
