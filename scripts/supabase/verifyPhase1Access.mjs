if (!process.env.SUPABASE_URL) {
  console.error('[verifyPhase1Access] Missing environment variable: SUPABASE_URL');
  process.exit(1);
}

const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!secretKey) {
  console.error('[verifyPhase1Access] Missing environment variable: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL.replace(/\/+$/, '');

const headers = {
  apikey: secretKey,
  Authorization: `Bearer ${secretKey}`,
  'Content-Type': 'application/json',
};

const safeRequest = async (label, url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  let body = null;
  const text = await response.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return {
    label,
    ok: response.ok,
    status: response.status,
    body,
  };
};

const results = [];

results.push(await safeRequest('auth_admin_users', `${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1000`));
results.push(await safeRequest('profiles_table', `${supabaseUrl}/rest/v1/profiles?select=id,email,metadata&limit=1000`));
results.push(await safeRequest('roles_table', `${supabaseUrl}/rest/v1/roles?select=id,code&limit=100`));
results.push(await safeRequest('branches_table', `${supabaseUrl}/rest/v1/branches?select=id,branch_code&limit=1000`));
results.push(await safeRequest('employees_table', `${supabaseUrl}/rest/v1/employees?select=id,profile_id,security&limit=1000`));
results.push(await safeRequest('employee_roles_table', `${supabaseUrl}/rest/v1/employee_roles?select=id&limit=1000`));
results.push(await safeRequest('employee_branch_assignments_table', `${supabaseUrl}/rest/v1/employee_branch_assignments?select=id&limit=1000`));

const summarize = (result) => {
  const missingTable =
    result.status === 404 &&
    result.body &&
    typeof result.body === 'object' &&
    result.body.code === 'PGRST205';

  if (missingTable) {
    return `${result.label}: MISSING_TABLE`;
  }

  if (result.status === 401 || result.status === 403) {
    return `${result.label}: AUTH_CONFIG_ERROR(${result.status})`;
  }

  if (!result.ok) {
    return `${result.label}: ERROR(${result.status})`;
  }

  if (result.label === 'auth_admin_users') {
    const userCount = Array.isArray(result.body?.users) ? result.body.users.length : 0;
    return `${result.label}: OK(users=${userCount})`;
  }

  const rowCount = Array.isArray(result.body) ? result.body.length : 0;

  if (result.label === 'profiles_table') {
    const syntheticCount = Array.isArray(result.body)
      ? result.body.filter((row) => row?.metadata?.synthetic_email === true).length
      : 0;
    return `${result.label}: OK(rows=${rowCount}, synthetic=${syntheticCount})`;
  }

  if (result.label === 'employees_table') {
    const syntheticCount = Array.isArray(result.body)
      ? result.body.filter((row) => row?.security?.synthetic_email === true).length
      : 0;
    return `${result.label}: OK(rows=${rowCount}, synthetic=${syntheticCount})`;
  }

  return `${result.label}: OK(rows=${rowCount})`;
};

console.log('=== Supabase Phase 1 Verification ===');
for (const result of results) {
  console.log(summarize(result));
}

const missingPhase1Tables = results
  .filter((result) => ['profiles_table', 'roles_table', 'branches_table', 'employees_table'].includes(result.label))
  .some(
    (result) =>
      result.status === 404 &&
      result.body &&
      typeof result.body === 'object' &&
      result.body.code === 'PGRST205'
  );

const hasAuthConfigError = results.some((result) => result.status === 401 || result.status === 403);

if (hasAuthConfigError) {
  console.log('');
  console.log('Next step: check SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY. The current server-side key could not access Supabase Auth or REST APIs.');
  process.exit(3);
}

if (missingPhase1Tables) {
  console.log('');
  console.log('Next step: run the Phase 1 SQL migration in Supabase SQL Editor first.');
  process.exit(2);
}

const authUsersResult = results.find((result) => result.label === 'auth_admin_users');
const authUserCount = Array.isArray(authUsersResult?.body?.users) ? authUsersResult.body.users.length : 0;

console.log('');
if (authUserCount > 0) {
  console.log('Phase 1 core schema와 관리자 계정이 모두 reachable 합니다. 직원 로그인 전환과 인벤토리 점검으로 넘어가세요.');
} else {
  console.log('Phase 1 core schema looks reachable. You can proceed to first-admin bootstrap.');
}
