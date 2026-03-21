import { writeFile } from 'node:fs/promises';

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY'];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`[assignBranchLoginEmails] Missing environment variable: ${key}`);
    process.exit(1);
  }
}

const supabaseUrl = process.env.SUPABASE_URL.replace(/\/+$/, '');
const secretKey = process.env.SUPABASE_SECRET_KEY;
const emailDomain = (process.env.SUPABASE_BRANCH_EMAIL_DOMAIN || 'bee-liber.com').trim().toLowerCase();
const apply = process.env.SUPABASE_APPLY === 'true';
const summaryPath =
  process.env.SUPABASE_BRANCH_EMAIL_SUMMARY_PATH
  || '/Users/cm/Desktop/beeliber/beeliber-main/docs/SUPABASE_BRANCH_EMAIL_ASSIGNMENTS.md';

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

const request = async (pathName, options = {}, label = pathName) => {
  const response = await fetch(`${supabaseUrl}${pathName}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  const body = await parseJsonResponse(response);
  if (!response.ok) {
    const error = new Error(
      `[assignBranchLoginEmails] ${label} failed (${response.status}): ${JSON.stringify(body)}`
    );
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
};

const getAuthUsers = async () => {
  const result = await request('/auth/v1/admin/users?page=1&per_page=1000', {}, 'list auth users');
  return Array.isArray(result?.users) ? result.users : [];
};

const getEmployees = async () => {
  const select = encodeURIComponent(
    'id,name,email,profile_id,legacy_admin_doc_id,org_type,employment_status,security,employee_roles(is_primary,role:roles(code)),employee_branch_assignments(is_primary,branch:branches(id,branch_code,name))'
  );
  return await request(`/rest/v1/employees?select=${select}&limit=500`, {}, 'list employees');
};

const choosePrimary = (rows) => rows?.find((entry) => entry?.is_primary) || rows?.[0] || null;

const patchTable = async (table, filters, payload, label) =>
  request(`/rest/v1/${table}?${filters}`, {
    method: 'PATCH',
    headers: {
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  }, label);

const updateAuthUserEmail = async (user, email) => {
  const payload = {
    email,
    email_confirm: true,
    user_metadata: user.user_metadata || {},
    app_metadata: user.app_metadata || {},
  };

  return await request(`/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, `update auth user ${user.id}`);
};

const buildSummary = (rows, skipped, duplicates) => {
  const lines = [
    '# Supabase 지점 로그인 이메일 매핑',
    '',
    `- 생성 시각(UTC): ${new Date().toISOString()}`,
    `- 실행 모드: ${apply ? 'APPLY' : 'DRY_RUN'}`,
    `- 대상 도메인: ${emailDomain}`,
    `- 변경 대상 수: ${rows.length}`,
    `- 보류 수: ${skipped.length}`,
    `- 중복 충돌 수: ${duplicates.length}`,
    '',
    '## 반영 대상',
    '',
    '| 지점 코드 | 지점명 | 이름 | 이전 이메일 | 새 이메일 | legacy_admin_doc_id |',
    '| --- | --- | --- | --- | --- | --- |',
    ...rows.map((row) =>
      `| ${row.branchCode} | ${row.branchName || '-'} | ${row.name || '-'} | ${row.currentEmail || '-'} | ${row.targetEmail} | ${row.legacyAdminDocId || '-'} |`
    ),
    '',
    '## 보류 대상',
    '',
    '| 지점 코드 | 이름 | 현재 이메일 | 사유 | legacy_admin_doc_id |',
    '| --- | --- | --- | --- | --- |',
    ...skipped.map((row) =>
      `| ${row.branchCode || '-'} | ${row.name || '-'} | ${row.currentEmail || '-'} | ${row.reason} | ${row.legacyAdminDocId || '-'} |`
    ),
    '',
    '## 중복 충돌',
    '',
    '| 이메일 | 사유 |',
    '| --- | --- |',
    ...duplicates.map((row) => `| ${row.email} | ${row.reason} |`),
    '',
  ];

  return lines.join('\n');
};

const main = async () => {
  const [authUsers, employees] = await Promise.all([getAuthUsers(), getEmployees()]);

  const authUsersById = new Map(authUsers.map((user) => [user.id, user]));
  const authUsersByEmail = new Map(
    authUsers
      .filter((user) => user.email)
      .map((user) => [String(user.email).trim().toLowerCase(), user])
  );

  const prepared = [];
  const skipped = [];
  const duplicates = [];
  const claimedEmails = new Map();

  for (const employee of employees) {
    const roleEntry = choosePrimary(employee.employee_roles);
    const branchEntry = choosePrimary(employee.employee_branch_assignments);
    const roleCode = String(roleEntry?.role?.code || '').trim().toLowerCase();
    const branchCode = String(branchEntry?.branch?.branch_code || '').trim().toLowerCase();
    const branchName = String(branchEntry?.branch?.name || '');
    const legacyAdminDocId = String(employee.legacy_admin_doc_id || '');
    const currentEmail = String(employee.email || '').trim().toLowerCase();

    if (!legacyAdminDocId.startsWith('admin-branch-')) {
      continue;
    }

    if (!branchCode) {
      skipped.push({
        branchCode: '',
        branchName,
        name: employee.name,
        currentEmail,
        legacyAdminDocId,
        reason: 'branch_code missing',
      });
      continue;
    }

    if (!['partner_manager', 'ops_staff', 'hub_manager'].includes(roleCode)) {
      skipped.push({
        branchCode,
        branchName,
        name: employee.name,
        currentEmail,
        legacyAdminDocId,
        reason: `unsupported role ${roleCode || '-'}`,
      });
      continue;
    }

    const profileId = String(employee.profile_id || '');
    const authUser = authUsersById.get(profileId);
    if (!authUser) {
      skipped.push({
        branchCode,
        branchName,
        name: employee.name,
        currentEmail,
        legacyAdminDocId,
        reason: 'auth user missing',
      });
      continue;
    }

    const targetEmail = `${branchCode}@${emailDomain}`;
    const existingOwner = authUsersByEmail.get(targetEmail);
    if (existingOwner && existingOwner.id !== authUser.id) {
      duplicates.push({
        email: targetEmail,
        reason: `already used by auth user ${existingOwner.id}`,
      });
      skipped.push({
        branchCode,
        branchName,
        name: employee.name,
        currentEmail,
        legacyAdminDocId,
        reason: 'target email already used',
      });
      continue;
    }

    const priorClaim = claimedEmails.get(targetEmail);
    if (priorClaim && priorClaim !== authUser.id) {
      duplicates.push({
        email: targetEmail,
        reason: `duplicate target in current batch (${priorClaim} vs ${authUser.id})`,
      });
      skipped.push({
        branchCode,
        branchName,
        name: employee.name,
        currentEmail,
        legacyAdminDocId,
        reason: 'duplicate branch target in batch',
      });
      continue;
    }

    claimedEmails.set(targetEmail, authUser.id);
    prepared.push({
      employeeId: employee.id,
      profileId,
      authUser,
      name: employee.name || '',
      branchCode: branchCode.toUpperCase(),
      branchName,
      targetEmail,
      currentEmail,
      legacyAdminDocId,
      currentSecurity:
        employee.security && typeof employee.security === 'object' && !Array.isArray(employee.security)
          ? employee.security
          : {},
    });
  }

  console.log('[스봉이] 지점 로그인 이메일 매핑 준비 결과');
  console.log(`- 모드: ${apply ? 'APPLY' : 'DRY_RUN'}`);
  console.log(`- 대상 도메인: ${emailDomain}`);
  console.log(`- 변경 대상: ${prepared.length}`);
  console.log(`- 보류: ${skipped.length}`);
  console.log(`- 중복 충돌: ${duplicates.length}`);

  if (prepared.length > 0) {
    prepared.slice(0, 20).forEach((row) => {
      console.log(`  · ${row.branchCode}: ${row.currentEmail || '-'} -> ${row.targetEmail}`);
    });
  }

  if (skipped.length > 0) {
    console.log('[스봉이] 보류 미리보기');
    skipped.slice(0, 20).forEach((row) => {
      console.log(`  · ${row.branchCode || '-'} ${row.name || '-'}: ${row.reason}`);
    });
  }

  await writeFile(summaryPath, buildSummary(prepared, skipped, duplicates), 'utf8');

  if (!apply) {
    console.log(`[스봉이] dry-run 끝났어요. 요약 문서는 ${summaryPath} 여기요.`);
    return;
  }

  for (const row of prepared) {
    await updateAuthUserEmail(row.authUser, row.targetEmail);
    await patchTable(
      'profiles',
      `id=eq.${encodeURIComponent(row.profileId)}`,
      { email: row.targetEmail },
      `update profile ${row.profileId}`
    );
    await patchTable(
      'employees',
      `id=eq.${encodeURIComponent(row.employeeId)}`,
      {
        email: row.targetEmail,
        security: {
          ...row.currentSecurity,
          managed_branch_email: true,
          synthetic_email: false,
        },
      },
      `update employee ${row.employeeId}`
    );
  }

  console.log(`[스봉이] 지점 이메일 반영 끝났어요. 요약 문서는 ${summaryPath} 여기 남겨뒀습니다.`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
