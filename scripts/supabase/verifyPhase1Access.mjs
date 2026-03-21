const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY'];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`[verifyPhase1Access] Missing environment variable: ${key}`);
    process.exit(1);
  }
}

const supabaseUrl = process.env.SUPABASE_URL.replace(/\/+$/, '');
const secretKey = process.env.SUPABASE_SECRET_KEY;

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

results.push(
  await safeRequest(
    'auth_admin_users',
    `${supabaseUrl}/auth/v1/admin/users`
  )
);

results.push(
  await safeRequest(
    'profiles_table',
    `${supabaseUrl}/rest/v1/profiles?select=id&limit=1`
  )
);

results.push(
  await safeRequest(
    'roles_table',
    `${supabaseUrl}/rest/v1/roles?select=id,code&limit=1`
  )
);

results.push(
  await safeRequest(
    'branches_table',
    `${supabaseUrl}/rest/v1/branches?select=id,branch_code&limit=1`
  )
);

results.push(
  await safeRequest(
    'employees_table',
    `${supabaseUrl}/rest/v1/employees?select=id,profile_id&limit=1`
  )
);

const summarize = (result) => {
  const missingTable =
    result.status === 404 &&
    result.body &&
    typeof result.body === 'object' &&
    result.body.code === 'PGRST205';

  if (missingTable) {
    return `${result.label}: MISSING_TABLE`;
  }

  if (!result.ok) {
    return `${result.label}: ERROR(${result.status})`;
  }

  if (result.label === 'auth_admin_users') {
    const userCount = Array.isArray(result.body?.users) ? result.body.users.length : 0;
    return `${result.label}: OK(users=${userCount})`;
  }

  const rowCount = Array.isArray(result.body) ? result.body.length : 0;
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

if (missingPhase1Tables) {
  console.log('');
  console.log('Next step: run the Phase 1 SQL migration in Supabase SQL Editor first.');
  process.exit(2);
}

console.log('');
console.log('Phase 1 core schema looks reachable. You can proceed to first-admin bootstrap.');
