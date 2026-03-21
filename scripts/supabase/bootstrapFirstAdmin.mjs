const requiredEnv = [
  'SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
  'FIRST_ADMIN_EMAIL',
  'FIRST_ADMIN_PASSWORD',
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`[bootstrapFirstAdmin] Missing environment variable: ${key}`);
    process.exit(1);
  }
}

const supabaseUrl = process.env.SUPABASE_URL.replace(/\/+$/, '');
const secretKey = process.env.SUPABASE_SECRET_KEY;

const config = {
  email: process.env.FIRST_ADMIN_EMAIL,
  password: process.env.FIRST_ADMIN_PASSWORD,
  displayName: process.env.FIRST_ADMIN_DISPLAY_NAME || '본사 관리자',
  employeeName: process.env.FIRST_ADMIN_EMPLOYEE_NAME || process.env.FIRST_ADMIN_DISPLAY_NAME || '본사 관리자',
  employeeCode: process.env.FIRST_ADMIN_EMPLOYEE_CODE || 'EMP-HQ-0001',
  branchCode: process.env.FIRST_ADMIN_BRANCH_CODE || 'HQ-SEOUL',
  branchName: process.env.FIRST_ADMIN_BRANCH_NAME || 'Beeliber HQ',
  branchType: process.env.FIRST_ADMIN_BRANCH_TYPE || 'HQ',
  jobTitle: process.env.FIRST_ADMIN_JOB_TITLE || 'CEO',
};

const headers = {
  apikey: secretKey,
  Authorization: `Bearer ${secretKey}`,
  'Content-Type': 'application/json',
};

const parseBody = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

const assertOk = async (response, label) => {
  const body = await parseBody(response);
  if (!response.ok) {
    console.error(`[bootstrapFirstAdmin] ${label} failed`, {
      status: response.status,
      body,
    });
    process.exit(1);
  }
  return body;
};

const getJson = async (url, label) => {
  const response = await fetch(url, { headers });
  return await assertOk(response, label);
};

const postJson = async (url, payload, label, extraHeaders = {}) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...headers,
      ...extraHeaders,
    },
    body: JSON.stringify(payload),
  });
  return await assertOk(response, label);
};

const patchJson = async (url, payload, label, extraHeaders = {}) => {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...headers,
      ...extraHeaders,
    },
    body: JSON.stringify(payload),
  });
  return await assertOk(response, label);
};

const failIfMissingTable = (rows, label) => {
  if (rows && rows.code === 'PGRST205') {
    console.error(`[bootstrapFirstAdmin] ${label} table is missing. Run Phase 1 SQL migration first.`);
    process.exit(1);
  }
};

const ensureAuthUser = async () => {
  const usersBody = await getJson(`${supabaseUrl}/auth/v1/admin/users`, 'list auth users');
  const users = Array.isArray(usersBody?.users) ? usersBody.users : [];
  const existing = users.find((user) => String(user.email || '').toLowerCase() === config.email.toLowerCase());
  if (existing) {
    return existing;
  }

  return await postJson(
    `${supabaseUrl}/auth/v1/admin/users`,
    {
      email: config.email,
      password: config.password,
      email_confirm: true,
      user_metadata: {
        display_name: config.displayName,
      },
    },
    'create auth user'
  );
};

const ensureProfile = async (userId) => {
  const rows = await getJson(
    `${supabaseUrl}/rest/v1/profiles?select=id,email,display_name&id=eq.${userId}`,
    'select profiles'
  );
  failIfMissingTable(rows, 'profiles');

  const payload = {
    id: userId,
    email: config.email,
    display_name: config.displayName,
    account_type: 'employee',
    is_active: true,
  };

  if (Array.isArray(rows) && rows.length > 0) {
    await patchJson(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
      payload,
      'update profile',
      { Prefer: 'return=representation' }
    );
    return userId;
  }

  const created = await postJson(
    `${supabaseUrl}/rest/v1/profiles`,
    payload,
    'insert profile',
    { Prefer: 'return=representation' }
  );
  return Array.isArray(created) && created[0] ? created[0].id : userId;
};

const ensureBranch = async () => {
  const rows = await getJson(
    `${supabaseUrl}/rest/v1/branches?select=id,branch_code&branch_code=eq.${encodeURIComponent(config.branchCode)}`,
    'select branches'
  );
  failIfMissingTable(rows, 'branches');

  if (Array.isArray(rows) && rows.length > 0) {
    return rows[0].id;
  }

  const created = await postJson(
    `${supabaseUrl}/rest/v1/branches`,
    {
      branch_code: config.branchCode,
      name: config.branchName,
      branch_type: config.branchType,
      status: 'active',
      is_active: true,
    },
    'insert branch',
    { Prefer: 'return=representation' }
  );

  return created[0].id;
};

const ensureEmployee = async (profileId) => {
  const rows = await getJson(
    `${supabaseUrl}/rest/v1/employees?select=id,profile_id&profile_id=eq.${profileId}`,
    'select employees'
  );
  failIfMissingTable(rows, 'employees');

  const payload = {
    profile_id: profileId,
    employee_code: config.employeeCode,
    name: config.employeeName,
    email: config.email,
    job_title: config.jobTitle,
    org_type: config.branchType,
    employment_status: 'active',
  };

  if (Array.isArray(rows) && rows.length > 0) {
    await patchJson(
      `${supabaseUrl}/rest/v1/employees?profile_id=eq.${profileId}`,
      payload,
      'update employee',
      { Prefer: 'return=representation' }
    );
    return rows[0].id;
  }

  const created = await postJson(
    `${supabaseUrl}/rest/v1/employees`,
    payload,
    'insert employee',
    { Prefer: 'return=representation' }
  );
  return created[0].id;
};

const ensureRoleId = async (roleCode) => {
  const rows = await getJson(
    `${supabaseUrl}/rest/v1/roles?select=id,code&code=eq.${encodeURIComponent(roleCode)}`,
    'select roles'
  );
  failIfMissingTable(rows, 'roles');

  if (!Array.isArray(rows) || rows.length === 0) {
    console.error(`[bootstrapFirstAdmin] role "${roleCode}" not found. Check the Phase 1 SQL seed.`);
    process.exit(1);
  }

  return rows[0].id;
};

const ensureEmployeeRole = async (employeeId, roleId) => {
  const rows = await getJson(
    `${supabaseUrl}/rest/v1/employee_roles?select=id&employee_id=eq.${employeeId}&role_id=eq.${roleId}`,
    'select employee_roles'
  );
  failIfMissingTable(rows, 'employee_roles');

  const payload = {
    employee_id: employeeId,
    role_id: roleId,
    is_primary: true,
  };

  if (Array.isArray(rows) && rows.length > 0) {
    await patchJson(
      `${supabaseUrl}/rest/v1/employee_roles?employee_id=eq.${employeeId}&role_id=eq.${roleId}`,
      payload,
      'update employee_roles',
      { Prefer: 'return=representation' }
    );
    return;
  }

  await postJson(
    `${supabaseUrl}/rest/v1/employee_roles`,
    payload,
    'insert employee_roles',
    { Prefer: 'return=representation' }
  );
};

const ensureAssignment = async (employeeId, branchId) => {
  const rows = await getJson(
    `${supabaseUrl}/rest/v1/employee_branch_assignments?select=id&employee_id=eq.${employeeId}&branch_id=eq.${branchId}`,
    'select employee_branch_assignments'
  );
  failIfMissingTable(rows, 'employee_branch_assignments');

  const payload = {
    employee_id: employeeId,
    branch_id: branchId,
    assignment_type: 'primary',
    is_primary: true,
  };

  if (Array.isArray(rows) && rows.length > 0) {
    await patchJson(
      `${supabaseUrl}/rest/v1/employee_branch_assignments?employee_id=eq.${employeeId}&branch_id=eq.${branchId}`,
      payload,
      'update employee_branch_assignments',
      { Prefer: 'return=representation' }
    );
    return;
  }

  await postJson(
    `${supabaseUrl}/rest/v1/employee_branch_assignments`,
    payload,
    'insert employee_branch_assignments',
    { Prefer: 'return=representation' }
  );
};

const main = async () => {
  const authUser = await ensureAuthUser();
  const profileId = await ensureProfile(authUser.id);
  const branchId = await ensureBranch();
  const employeeId = await ensureEmployee(profileId);
  const superAdminRoleId = await ensureRoleId('super_admin');
  await ensureEmployeeRole(employeeId, superAdminRoleId);
  await ensureAssignment(employeeId, branchId);

  console.log('=== Supabase First Admin Bootstrap Complete ===');
  console.log(`auth_user_id=${authUser.id}`);
  console.log(`profile_id=${profileId}`);
  console.log(`employee_id=${employeeId}`);
  console.log(`branch_id=${branchId}`);
  console.log(`role=super_admin`);
};

main().catch((error) => {
  console.error('[bootstrapFirstAdmin] Unexpected error:', error);
  process.exit(1);
});
