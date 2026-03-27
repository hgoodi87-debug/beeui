const { createHash } = require('node:crypto');

const DEFAULT_HQ_BRANCH_CODE = 'HQ-SEOUL';
const DEFAULT_SYNTHETIC_EMAIL_DOMAIN = 'staff.bee-liber.invalid';
const HQ_BRANCH_ALIASES = new Set(['', 'HQ', 'HEADQUARTERS', 'HQ-SEOUL']);
const VALID_LEGACY_ROLES = new Set(['super', 'hq', 'branch', 'staff', 'partner', 'driver', 'finance', 'cs']);
const VALID_STATUSES = new Set(['invited', 'active', 'suspended', 'resigned', 'locked']);
const VALID_ORG_TYPES = new Set(['HQ', 'HUB', 'PARTNER', 'DRIVER_GROUP']);

const normalizeText = (value) => String(value || '').trim();
const normalizeLower = (value) => normalizeText(value).toLowerCase();
const normalizeUpper = (value) => normalizeText(value).toUpperCase();
const normalizeEmail = (value) => {
  const email = normalizeLower(value);
  if (!email || !email.includes('@')) return '';
  return email;
};

const sanitizeAsciiToken = (value) =>
  normalizeText(value)
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

const normalizeCode = (value) =>
  normalizeText(value)
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase();

const sanitizeJson = (value) => JSON.parse(JSON.stringify(value));

const parseJsonResponse = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

const supabaseRequest = async ({ supabaseUrl, serviceRoleKey, path, options = {} }) => {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const body = await parseJsonResponse(response);
  if (!response.ok) {
    const message =
      typeof body === 'object' && body && 'message' in body
        ? String(body.message)
        : typeof body === 'object' && body && 'msg' in body
          ? String(body.msg)
          : `Supabase request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
};

const fetchAllAuthUsers = async ({ supabaseUrl, serviceRoleKey }) => {
  const result = await supabaseRequest({
    supabaseUrl,
    serviceRoleKey,
    path: '/auth/v1/admin/users?page=1&per_page=1000',
  });
  return Array.isArray(result?.users) ? result.users : [];
};

const fetchTable = async ({ supabaseUrl, serviceRoleKey, table, query }) =>
  supabaseRequest({
    supabaseUrl,
    serviceRoleKey,
    path: `/rest/v1/${table}?${query}`,
  });

const patchTableRow = async ({ supabaseUrl, serviceRoleKey, table, filters, payload }) =>
  supabaseRequest({
    supabaseUrl,
    serviceRoleKey,
    path: `/rest/v1/${table}?${filters}`,
    options: {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify(sanitizeJson(payload)),
    },
  });

const insertTableRow = async ({ supabaseUrl, serviceRoleKey, table, payload, onConflict }) =>
  supabaseRequest({
    supabaseUrl,
    serviceRoleKey,
    path: `/rest/v1/${table}${onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : ''}`,
    options: {
      method: 'POST',
      headers: {
        Prefer: 'return=representation,resolution=merge-duplicates',
      },
      body: JSON.stringify(Array.isArray(payload) ? sanitizeJson(payload) : [sanitizeJson(payload)]),
    },
  });

const clearPrimaryFlag = async ({ supabaseUrl, serviceRoleKey, table, employeeId }) =>
  supabaseRequest({
    supabaseUrl,
    serviceRoleKey,
    path: `/rest/v1/${table}?employee_id=eq.${encodeURIComponent(employeeId)}&is_primary=eq.true`,
    options: {
      method: 'PATCH',
      headers: {
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ is_primary: false }),
    },
  });

const hasPassword = (admin) => normalizeText(admin?.password).length > 0;

const inferLegacyRole = (admin) => {
  const explicitRole = normalizeLower(admin?.role);
  if (VALID_LEGACY_ROLES.has(explicitRole)) {
    return explicitRole;
  }

  const title = normalizeUpper(admin?.jobTitle);
  if (title.includes('CEO') || title.includes('MASTER') || title.includes('GENERAL MANAGER')) {
    return 'super';
  }

  if (normalizeText(admin?.branchId)) {
    return normalizeUpper(admin?.orgType) === 'PARTNER' ? 'partner' : 'branch';
  }

  return 'staff';
};

const mapEmploymentStatus = (status) => {
  const normalized = normalizeLower(status);
  switch (normalized) {
    case 'active':
      return 'active';
    case 'invited':
      return 'inactive';
    case 'locked':
    case 'suspended':
      return 'suspended';
    case 'resigned':
      return 'resigned';
    default:
      return 'active';
  }
};

const resolveOrgType = (admin, resolvedBranchType) => {
  const direct = normalizeUpper(admin?.orgType);
  if (VALID_ORG_TYPES.has(direct)) {
    return direct;
  }

  const role = inferLegacyRole(admin);
  const jobTitle = normalizeLower(admin?.jobTitle);

  if (role === 'partner' || resolvedBranchType === 'PARTNER') return 'PARTNER';
  if (role === 'driver' || jobTitle.includes('driver') || jobTitle.includes('기사')) return 'DRIVER_GROUP';
  if (!normalizeText(admin?.branchId)) return 'HQ';
  return resolvedBranchType || 'HUB';
};

const mapLegacyRoleToSupabaseRole = (admin, resolvedBranchType) => {
  const role = inferLegacyRole(admin);
  const orgType = resolveOrgType(admin, resolvedBranchType);

  switch (role) {
    case 'super':
      return 'super_admin';
    case 'hq':
      return 'hq_admin';
    case 'finance':
      return 'finance_staff';
    case 'cs':
      return 'cs_staff';
    case 'driver':
      return 'driver';
    case 'marketing':
      return 'marketing';
    case 'content':
      return 'content_manager';
    case 'partner':
      return 'partner_manager';
    case 'branch':
      return orgType === 'PARTNER' ? 'partner_manager' : 'hub_manager';
    default:
      return 'ops_staff';
  }
};

const makeEmployeeCode = (admin, resolvedBranchCode) => {
  const baseBranch = normalizeCode(resolvedBranchCode || DEFAULT_HQ_BRANCH_CODE).slice(0, 8) || 'HQ';
  const direct = normalizeCode(admin.loginId || admin.id || '');
  if (direct) {
    return `EMP-${baseBranch}-${direct}`.slice(0, 40);
  }
  return `EMP-${baseBranch}-${Date.now().toString().slice(-6)}`;
};

const buildSyntheticEmail = (admin) => {
  const docToken = sanitizeAsciiToken(admin.id || 'legacy-admin') || 'legacy-admin';
  const readableToken =
    sanitizeAsciiToken(admin.loginId)
    || sanitizeAsciiToken(admin.name)
    || sanitizeAsciiToken(admin.branchId)
    || 'staff';
  const hash = createHash('sha1').update(String(admin.id || readableToken)).digest('hex').slice(0, 10);
  const local = `admin-${readableToken.slice(0, 20)}-${docToken.slice(0, 20)}-${hash}`.slice(0, 64);
  return `${local}@${DEFAULT_SYNTHETIC_EMAIL_DOMAIN}`;
};

const resolveBranchType = (source, admin) => {
  const explicit = normalizeUpper(source?.branch_type || source?.branchType);
  if (['HQ', 'HUB', 'PARTNER', 'DRIVER_GROUP'].includes(explicit)) {
    return explicit === 'DRIVER_GROUP' ? 'HUB' : explicit;
  }

  const locationType = normalizeUpper(source?.type);
  if (locationType === 'PARTNER') return 'PARTNER';
  if (resolveOrgType(admin, '') === 'PARTNER') return 'PARTNER';
  return normalizeText(admin?.branchId) ? 'HUB' : 'HQ';
};

const buildBranchPayload = (source, branchCode, admin) => ({
  branch_code: branchCode,
  name: normalizeText(source?.name) || branchCode,
  branch_type: resolveBranchType(source, admin),
  status: normalizeText(source?.status) || 'active',
  is_active: source?.isActive !== false,
  address: normalizeText(source?.address) || null,
  phone: normalizeText(source?.phone) || null,
  email: normalizeEmail(source?.email) || null,
  lat: typeof source?.lat === 'number' ? source.lat : null,
  lng: typeof source?.lng === 'number' ? source.lng : null,
  metadata: sanitizeJson({
    source: 'firebase_admin_runtime_sync',
    legacy_location_id: normalizeText(source?.id) || null,
    location_type: normalizeText(source?.type) || null,
  }),
});

const resolveBranchContext = async ({ firestore, branchId, admin }) => {
  const normalizedBranchId = normalizeUpper(branchId);
  if (HQ_BRANCH_ALIASES.has(normalizedBranchId)) {
    return {
      branchCode: DEFAULT_HQ_BRANCH_CODE,
      branchPayload: {
        branch_code: DEFAULT_HQ_BRANCH_CODE,
        name: '본사',
        branch_type: 'HQ',
        status: 'active',
        is_active: true,
        address: null,
        phone: null,
        email: null,
        lat: null,
        lng: null,
        metadata: { source: 'firebase_admin_runtime_sync', legacy_location_id: null },
      },
      branchType: 'HQ',
    };
  }

  const directLocation = await firestore.collection('locations').doc(branchId).get();
  if (directLocation.exists) {
    const source = { id: directLocation.id, ...directLocation.data() };
    const branchCode = normalizeCode(source.branchCode || source.branch_code || source.shortCode || source.id);
    return {
      branchCode,
      branchPayload: buildBranchPayload(source, branchCode, admin),
      branchType: resolveBranchType(source, admin),
    };
  }

  const directBranch = await firestore.collection('branches').doc(branchId).get();
  if (directBranch.exists) {
    const source = { id: directBranch.id, ...directBranch.data() };
    const branchCode = normalizeCode(source.branchCode || source.branch_code || source.shortCode || source.id);
    return {
      branchCode,
      branchPayload: buildBranchPayload(source, branchCode, admin),
      branchType: resolveBranchType(source, admin),
    };
  }

  const fallbackCode = normalizeCode(branchId);
  return {
    branchCode: fallbackCode,
    branchPayload: buildBranchPayload({ id: branchId, name: branchId }, fallbackCode, admin),
    branchType: resolveOrgType(admin, '') === 'PARTNER' ? 'PARTNER' : 'HUB',
  };
};

const validateInput = (input) => {
  const name = normalizeText(input?.name);
  const jobTitle = normalizeText(input?.jobTitle);
  if (!name) {
    throw new Error('이름은 필수입니다.');
  }
  if (!jobTitle) {
    throw new Error('직책은 필수입니다.');
  }
  if (name.length > 80 || jobTitle.length > 120) {
    throw new Error('입력 길이가 너무 깁니다.');
  }
  if (input?.email && !normalizeEmail(input.email)) {
    throw new Error('내부 인증 이메일 형식이 올바르지 않습니다.');
  }
  if (input?.status && !VALID_STATUSES.has(normalizeLower(input.status))) {
    throw new Error('계정 상태 값이 올바르지 않습니다.');
  }
};

const assertConfigured = () => {
  const supabaseUrl = normalizeText(process.env.SUPABASE_URL);
  const serviceRoleKey =
    normalizeText(process.env.SUPABASE_SERVICE_ROLE_KEY)
    || normalizeText(process.env.SUPABASE_SECRET_KEY);

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 설정이 누락되었습니다.');
  }

  return { supabaseUrl, serviceRoleKey };
};

const findAuthUser = ({ users, adminId, resolvedEmail, previousEmail }) => {
  const emailMap = new Map(
    users
      .map((user) => [normalizeEmail(user.email), user])
      .filter(([email]) => email)
  );

  const byLegacy = users.find((user) => normalizeText(user?.app_metadata?.legacy_admin_doc_id) === adminId) || null;
  const byResolvedEmail = resolvedEmail ? emailMap.get(resolvedEmail) || null : null;
  const byPreviousEmail = previousEmail ? emailMap.get(previousEmail) || null : null;

  const candidates = [byLegacy, byResolvedEmail, byPreviousEmail].filter(Boolean);
  const unique = Array.from(new Map(candidates.map((user) => [user.id, user])).values());

  if (unique.length > 1) {
    throw new Error('같은 직원으로 해석되는 Supabase 인증 계정이 여러 개라 정리가 필요합니다.');
  }

  const conflicting = resolvedEmail && byResolvedEmail && byLegacy && byResolvedEmail.id !== byLegacy.id;
  if (conflicting) {
    throw new Error('이미 다른 계정이 같은 내부 인증 이메일을 사용 중입니다.');
  }

  return unique[0] || null;
};

const upsertAuthUser = async ({ supabaseUrl, serviceRoleKey, user, admin, resolvedEmail, syntheticEmail, roleCode, orgType }) => {
  const payload = {
    email: resolvedEmail,
    email_confirm: true,
    user_metadata: {
      display_name: normalizeText(admin.name) || resolvedEmail,
      login_id: normalizeText(admin.loginId) || null,
      job_title: normalizeText(admin.jobTitle) || null,
      branch_id: normalizeText(admin.branchId) || null,
      synthetic_email: syntheticEmail,
    },
    app_metadata: {
      source: 'firebase_admin_runtime_sync',
      legacy_admin_doc_id: admin.id,
      role_code: roleCode,
      org_type: orgType,
      synthetic_email: syntheticEmail,
    },
  };

  if (hasPassword(admin)) {
    payload.password = normalizeText(admin.password);
  }

  if (user) {
    return supabaseRequest({
      supabaseUrl,
      serviceRoleKey,
      path: `/auth/v1/admin/users/${user.id}`,
      options: {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
    });
  }

  return supabaseRequest({
    supabaseUrl,
    serviceRoleKey,
    path: '/auth/v1/admin/users',
    options: {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  });
};

const upsertProfile = async ({ supabaseUrl, serviceRoleKey, authUser, admin, resolvedEmail, syntheticEmail }) => {
  const existing = await fetchTable({
    supabaseUrl,
    serviceRoleKey,
    table: 'profiles',
    query: `select=id&id=eq.${encodeURIComponent(authUser.id)}&limit=1`,
  });

  const payload = {
    id: authUser.id,
    email: resolvedEmail,
    display_name: normalizeText(admin.name) || resolvedEmail,
    account_type: 'employee',
    phone: normalizeText(admin.phone) || null,
    last_login_at: null,
    is_active: mapEmploymentStatus(admin.status) === 'active',
    metadata: {
      migrated_from: 'firebase_admin_runtime_sync',
      legacy_admin_doc_id: admin.id,
      legacy_role: admin.role || null,
      synthetic_email: syntheticEmail,
    },
  };

  if (Array.isArray(existing) && existing.length > 0) {
    await patchTableRow({
      supabaseUrl,
      serviceRoleKey,
      table: 'profiles',
      filters: `id=eq.${encodeURIComponent(authUser.id)}`,
      payload,
    });
    return;
  }

  await insertTableRow({
    supabaseUrl,
    serviceRoleKey,
    table: 'profiles',
    payload,
  });
};

const upsertBranch = async ({ supabaseUrl, serviceRoleKey, branchCode, branchPayload }) => {
  const existing = await fetchTable({
    supabaseUrl,
    serviceRoleKey,
    table: 'branches',
    query: `select=id,branch_code&branch_code=eq.${encodeURIComponent(branchCode)}&limit=1`,
  });

  if (Array.isArray(existing) && existing[0]?.id) {
    const [updated] = await patchTableRow({
      supabaseUrl,
      serviceRoleKey,
      table: 'branches',
      filters: `id=eq.${existing[0].id}`,
      payload: branchPayload,
    });
    return updated || existing[0];
  }

  const [inserted] = await insertTableRow({
    supabaseUrl,
    serviceRoleKey,
    table: 'branches',
    payload: branchPayload,
  });
  return inserted;
};

const upsertEmployee = async ({
  supabaseUrl,
  serviceRoleKey,
  authUser,
  admin,
  resolvedEmail,
  branchCode,
  branchType,
  syntheticEmail,
}) => {
  const byLegacy = await fetchTable({
    supabaseUrl,
    serviceRoleKey,
    table: 'employees',
    query: `select=id,profile_id&legacy_admin_doc_id=eq.${encodeURIComponent(admin.id)}&limit=1`,
  });
  const byProfile =
    Array.isArray(byLegacy) && byLegacy.length > 0
      ? []
      : await fetchTable({
          supabaseUrl,
          serviceRoleKey,
          table: 'employees',
          query: `select=id,profile_id&profile_id=eq.${encodeURIComponent(authUser.id)}&limit=1`,
        });

  const existing = (Array.isArray(byLegacy) && byLegacy[0]) || (Array.isArray(byProfile) && byProfile[0]) || null;

  const payload = {
    profile_id: authUser.id,
    employee_code: makeEmployeeCode(admin, branchCode),
    legacy_admin_doc_id: admin.id,
    name: normalizeText(admin.name) || resolvedEmail,
    email: resolvedEmail,
    login_id: normalizeText(admin.loginId) || null,
    phone: normalizeText(admin.phone) || null,
    job_title: normalizeText(admin.jobTitle) || null,
    org_type: resolveOrgType(admin, branchType),
    employment_status: mapEmploymentStatus(admin.status),
    security: sanitizeJson({
      ...(admin.security || {}),
      synthetic_email: syntheticEmail,
    }),
    memo: normalizeText(admin.memo) || null,
  };

  if (existing?.id) {
    const [updated] = await patchTableRow({
      supabaseUrl,
      serviceRoleKey,
      table: 'employees',
      filters: `id=eq.${existing.id}`,
      payload,
    });
    return updated || { id: existing.id, ...payload };
  }

  const [inserted] = await insertTableRow({
    supabaseUrl,
    serviceRoleKey,
    table: 'employees',
    payload,
  });
  return inserted;
};

const upsertEmployeeRole = async ({ supabaseUrl, serviceRoleKey, employeeId, roleCode }) => {
  const roles = await fetchTable({
    supabaseUrl,
    serviceRoleKey,
    table: 'roles',
    query: `select=id,code&code=eq.${encodeURIComponent(roleCode)}&limit=1`,
  });
  const role = Array.isArray(roles) ? roles[0] : null;
  if (!role?.id) {
    throw new Error(`Supabase roles 테이블에 "${roleCode}" 권한이 없습니다.`);
  }

  await clearPrimaryFlag({ supabaseUrl, serviceRoleKey, table: 'employee_roles', employeeId });
  await insertTableRow({
    supabaseUrl,
    serviceRoleKey,
    table: 'employee_roles',
    onConflict: 'employee_id,role_id',
    payload: {
      employee_id: employeeId,
      role_id: role.id,
      is_primary: true,
    },
  });
};

const upsertEmployeeBranchAssignment = async ({ supabaseUrl, serviceRoleKey, employeeId, branchId }) => {
  if (!branchId) return;

  await clearPrimaryFlag({ supabaseUrl, serviceRoleKey, table: 'employee_branch_assignments', employeeId });
  await insertTableRow({
    supabaseUrl,
    serviceRoleKey,
    table: 'employee_branch_assignments',
    onConflict: 'employee_id,branch_id',
    payload: {
      employee_id: employeeId,
      branch_id: branchId,
      assignment_type: 'primary',
      is_primary: true,
    },
  });
};

const buildMergedAdmin = ({ input, existingAdmin }) => {
  validateInput(input);

  const finalId =
    normalizeText(input.id)
    || normalizeText(existingAdmin?.id)
    || normalizeText(input.loginId)
    || normalizeText(input.branchId)
    || `admin-${Date.now()}`;
  const now = new Date().toISOString();
  const nextAdmin = {
    ...(existingAdmin || {}),
    ...sanitizeJson(input),
    id: finalId,
    name: normalizeText(input.name || existingAdmin?.name),
    jobTitle: normalizeText(input.jobTitle || existingAdmin?.jobTitle),
    loginId: normalizeText(input.loginId || existingAdmin?.loginId || input.branchId || existingAdmin?.branchId) || undefined,
    branchId: normalizeText(input.branchId || existingAdmin?.branchId) || undefined,
    phone: normalizeText(input.phone || existingAdmin?.phone) || undefined,
    memo: normalizeText(input.memo || existingAdmin?.memo) || undefined,
    role: inferLegacyRole({ ...(existingAdmin || {}), ...(input || {}) }),
    status: VALID_STATUSES.has(normalizeLower(input.status))
      ? normalizeLower(input.status)
      : normalizeLower(existingAdmin?.status) || 'active',
    orgType: VALID_ORG_TYPES.has(normalizeUpper(input.orgType))
      ? normalizeUpper(input.orgType)
      : VALID_ORG_TYPES.has(normalizeUpper(existingAdmin?.orgType))
        ? normalizeUpper(existingAdmin?.orgType)
        : undefined,
    permissions: Array.isArray(input.permissions)
      ? [...new Set(input.permissions.map((entry) => normalizeText(entry)).filter(Boolean))]
      : Array.isArray(existingAdmin?.permissions)
        ? existingAdmin.permissions
        : [],
    createdAt: normalizeText(existingAdmin?.createdAt || input.createdAt) || now,
    updatedAt: now,
  };

  const nextPassword = normalizeText(input.password);
  if (nextPassword) {
    nextAdmin.password = nextPassword;
  } else if (hasPassword(existingAdmin)) {
    nextAdmin.password = existingAdmin.password;
  } else {
    delete nextAdmin.password;
  }

  const explicitEmail = normalizeEmail(input.email || existingAdmin?.email);
  nextAdmin.email = explicitEmail || buildSyntheticEmail(nextAdmin);

  if (!hasPassword(nextAdmin)) {
    throw new Error('비밀번호는 필수입니다.');
  }

  return nextAdmin;
};

const isSelfMutation = (actor, targetAdmin) => {
  const actorUid = normalizeText(actor?.uid);
  const actorEmail = normalizeEmail(actor?.email);
  const actorLoginId = normalizeLower(actor?.loginId);

  return Boolean(
    (actorUid && actorUid === normalizeText(targetAdmin?.id)) ||
    (actorEmail && actorEmail === normalizeEmail(targetAdmin?.email)) ||
    (actorLoginId && actorLoginId === normalizeLower(targetAdmin?.loginId))
  );
};

const assertCanManageAdminAccount = ({ actor, targetAdmin, isDelete = false }) => {
  const actorRole = normalizeLower(actor?.role);
  const targetRole = inferLegacyRole(targetAdmin);
  const actorBranchId = normalizeText(actor?.branchId);
  const actorBranchCode = normalizeText(actor?.branchCode);
  const targetBranchId = normalizeText(targetAdmin?.branchId);

  if (isDelete && isSelfMutation(actor, targetAdmin)) {
    throw new Error('본인 계정은 여기서 삭제할 수 없습니다.');
  }

  if (actorRole === 'super') {
    return;
  }

  if (actorRole === 'hq') {
    if (targetRole === 'super') {
      throw new Error('슈퍼관리자 계정은 본사운영팀에서 수정/삭제할 수 없습니다.');
    }
    return;
  }

  if (actorRole === 'branch' || actorRole === 'partner') {
    if (targetRole !== 'staff') {
      throw new Error('지점 계정에서는 일반 스태프만 관리할 수 있습니다.');
    }
    const sameBranch = Boolean(
      targetBranchId &&
      (
        (actorBranchId && actorBranchId === targetBranchId) ||
        (actorBranchCode && actorBranchCode === targetBranchId)
      )
    );

    if (!sameBranch) {
      throw new Error('다른 지점 직원은 관리할 수 없습니다.');
    }
    return;
  }

  throw new Error('이 계정을 관리할 권한이 없습니다.');
};

const upsertAdminAccount = async ({ firestore, actor, input }) => {
  const { supabaseUrl, serviceRoleKey } = assertConfigured();
  const existingSnap = normalizeText(input?.id)
    ? await firestore.collection('admins').doc(normalizeText(input.id)).get()
    : null;
  const existingAdmin = existingSnap?.exists ? { id: existingSnap.id, ...existingSnap.data() } : null;
  const nextAdmin = buildMergedAdmin({ input, existingAdmin });
  assertCanManageAdminAccount({ actor, targetAdmin: nextAdmin });
  const previousEmail = normalizeEmail(existingAdmin?.email);
  const syntheticEmail = normalizeEmail(input?.email || existingAdmin?.email) ? false : true;

  const authUsers = await fetchAllAuthUsers({ supabaseUrl, serviceRoleKey });
  const existingAuthUser = findAuthUser({
    users: authUsers,
    adminId: nextAdmin.id,
    resolvedEmail: nextAdmin.email,
    previousEmail,
  });

  const branchContext = await resolveBranchContext({
    firestore,
    branchId: nextAdmin.branchId || '',
    admin: nextAdmin,
  });
  const roleCode = mapLegacyRoleToSupabaseRole(nextAdmin, branchContext.branchType);
  const orgType = resolveOrgType(nextAdmin, branchContext.branchType);

  const authUser = await upsertAuthUser({
    supabaseUrl,
    serviceRoleKey,
    user: existingAuthUser,
    admin: nextAdmin,
    resolvedEmail: nextAdmin.email,
    syntheticEmail,
    roleCode,
    orgType,
  });

  await upsertProfile({
    supabaseUrl,
    serviceRoleKey,
    authUser,
    admin: nextAdmin,
    resolvedEmail: nextAdmin.email,
    syntheticEmail,
  });

  const branchRow = branchContext.branchCode
    ? await upsertBranch({
        supabaseUrl,
        serviceRoleKey,
        branchCode: branchContext.branchCode,
        branchPayload: branchContext.branchPayload,
      })
    : null;

  const employeeRow = await upsertEmployee({
    supabaseUrl,
    serviceRoleKey,
    authUser,
    admin: nextAdmin,
    resolvedEmail: nextAdmin.email,
    branchCode: branchContext.branchCode || DEFAULT_HQ_BRANCH_CODE,
    branchType: branchContext.branchType,
    syntheticEmail,
  });

  if (!employeeRow?.id) {
    throw new Error('직원 테이블 동기화에 실패했습니다.');
  }

  await upsertEmployeeRole({
    supabaseUrl,
    serviceRoleKey,
    employeeId: employeeRow.id,
    roleCode,
  });

  await upsertEmployeeBranchAssignment({
    supabaseUrl,
    serviceRoleKey,
    employeeId: employeeRow.id,
    branchId: branchRow?.id || null,
  });

  await firestore.collection('admins').doc(nextAdmin.id).set(
    {
      ...nextAdmin,
      email: nextAdmin.email,
      syncStatus: {
        provider: 'supabase',
        status: 'synced',
        syncedAt: new Date().toISOString(),
        profileId: authUser.id,
        employeeId: employeeRow.id,
        authEmail: nextAdmin.email,
        branchCode: branchContext.branchCode || '',
        syntheticEmail,
      },
      updatedBy: normalizeText(actor?.uid) || null,
      updatedByRole: normalizeText(actor?.role) || null,
    },
    { merge: true }
  );

  return {
    id: nextAdmin.id,
    email: nextAdmin.email,
    role: nextAdmin.role,
    status: nextAdmin.status,
    branchId: nextAdmin.branchId || '',
    branchCode: branchContext.branchCode || '',
    profileId: authUser.id,
    employeeId: employeeRow.id,
    syntheticEmail,
  };
};

const findShadowAdminDocIds = async ({ firestore, targetAdmin, authUserId }) => {
  const candidates = new Set();
  const queries = [];

  const loginId = normalizeText(targetAdmin?.loginId);
  const email = normalizeEmail(targetAdmin?.email);

  if (loginId) {
    queries.push(firestore.collection('admins').where('loginId', '==', loginId).get());
  }
  if (email) {
    queries.push(firestore.collection('admins').where('email', '==', email).get());
  }

  const snapshots = await Promise.all(queries);
  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const isUidShadow = normalizeText(data?.uid) === docSnap.id;
      if (docSnap.id !== targetAdmin.id && isUidShadow) {
        candidates.add(docSnap.id);
      }
    });
  });

  return Array.from(candidates);
};

const deleteAuthUser = async ({ supabaseUrl, serviceRoleKey, authUserId }) => {
  if (!authUserId) return;

  try {
    await supabaseRequest({
      supabaseUrl,
      serviceRoleKey,
      path: `/auth/v1/admin/users/${authUserId}`,
      options: {
        method: 'DELETE',
      },
    });
  } catch (error) {
    if (error?.status === 404) {
      return;
    }
    throw error;
  }
};

const deleteAdminAccount = async ({ firestore, actor, adminId }) => {
  const normalizedId = normalizeText(adminId);
  if (!normalizedId) {
    throw new Error('삭제할 직원 ID가 없습니다.');
  }

  const targetSnap = await firestore.collection('admins').doc(normalizedId).get();
  if (!targetSnap.exists) {
    throw new Error('삭제할 직원 문서를 찾지 못했습니다.');
  }

  const targetAdmin = { id: targetSnap.id, ...targetSnap.data() };
  assertCanManageAdminAccount({ actor, targetAdmin, isDelete: true });

  const { supabaseUrl, serviceRoleKey } = assertConfigured();
  const authUsers = await fetchAllAuthUsers({ supabaseUrl, serviceRoleKey });
  const authUser = findAuthUser({
    users: authUsers,
    adminId: targetAdmin.id,
    resolvedEmail: normalizeEmail(targetAdmin.email),
    previousEmail: '',
  });

  const shadowIds = await findShadowAdminDocIds({
    firestore,
    targetAdmin,
    authUserId: authUser?.id || '',
  });

  await deleteAuthUser({
    supabaseUrl,
    serviceRoleKey,
    authUserId: authUser?.id || '',
  });

  const deleteTargets = Array.from(new Set([targetAdmin.id, ...shadowIds])).filter(Boolean);
  const batch = firestore.batch();
  deleteTargets.forEach((id) => {
    batch.delete(firestore.collection('admins').doc(id));
  });
  await batch.commit();

  return {
    deletedId: targetAdmin.id,
    deletedShadowCount: shadowIds.length,
    deletedAuthUserId: authUser?.id || '',
  };
};

module.exports = {
  upsertAdminAccount,
  deleteAdminAccount,
};
