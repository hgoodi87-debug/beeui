import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const config = {
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'beeliber-main',
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
  supabaseUrl: (process.env.SUPABASE_URL || '').trim(),
  supabaseSecretKey: (process.env.SUPABASE_SECRET_KEY || '').trim(),
  apply: process.env.SUPABASE_APPLY === 'true',
  allowSyntheticEmail: process.env.SUPABASE_ALLOW_SYNTHETIC_EMAIL === 'true',
  syntheticEmailDomain: normalizeDomain(process.env.SUPABASE_SYNTHETIC_EMAIL_DOMAIN || 'staff.bee-liber.invalid'),
  defaultHqBranchCode: (process.env.SUPABASE_DEFAULT_HQ_BRANCH_CODE || 'HQ-SEOUL').trim(),
  maxPreviewRows: Number(process.env.SUPABASE_SYNC_PREVIEW_LIMIT || 20)
};

const usage = `
[스봉이] Supabase Phase 1 HR/지점 동기화기

필수 env
- SUPABASE_URL
- SUPABASE_SECRET_KEY

선택 env
- FIREBASE_PROJECT_ID (기본값: beeliber-main)
- FIREBASE_SERVICE_ACCOUNT_PATH 또는 GOOGLE_APPLICATION_CREDENTIALS
- FIREBASE_SERVICE_ACCOUNT_JSON
- SUPABASE_APPLY=true  (없으면 dry-run)
- SUPABASE_ALLOW_SYNTHETIC_EMAIL=true
- SUPABASE_SYNTHETIC_EMAIL_DOMAIN=staff.bee-liber.invalid
- SUPABASE_DEFAULT_HQ_BRANCH_CODE=HQ-SEOUL
- SUPABASE_SYNC_PREVIEW_LIMIT=20
`.trim();

const printHelpAndExit = (code = 0) => {
  console.log(usage);
  process.exit(code);
};

if (process.argv.includes('--help')) {
  printHelpAndExit(0);
}

if (!config.supabaseUrl || !config.supabaseSecretKey) {
  console.error('SUPABASE_URL 과 SUPABASE_SECRET_KEY 는 꼭 넣어주세요.');
  printHelpAndExit(1);
}

const normalizeText = (value) => String(value || '').trim();
const normalizeLower = (value) => normalizeText(value).toLowerCase();
function normalizeDomain(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^\.+|\.+$/g, '');
}
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

const buildSyntheticEmail = (admin) => {
  const docToken = sanitizeAsciiToken(admin.id || 'legacy-admin') || 'legacy-admin';
  const readableToken =
    sanitizeAsciiToken(admin.loginId)
    || sanitizeAsciiToken(admin.name)
    || sanitizeAsciiToken(admin.branchId)
    || 'staff';
  const hash = createHash('sha1').update(String(admin.id || readableToken)).digest('hex').slice(0, 10);
  const local = `legacy-${readableToken.slice(0, 20)}-${docToken.slice(0, 20)}-${hash}`.slice(0, 64);
  return `${local}@${config.syntheticEmailDomain}`;
};

const resolveAdminEmail = (admin) => {
  const email = normalizeEmail(admin.email);
  if (email) {
    return { email, synthetic: false };
  }

  if (!config.allowSyntheticEmail) {
    return { email: '', synthetic: false };
  }

  return {
    email: buildSyntheticEmail(admin),
    synthetic: true
  };
};
const normalizeCode = (value) =>
  normalizeText(value)
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase();

const toIsoString = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') {
    return value.toDate().toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const sanitizeJson = (value) => JSON.parse(JSON.stringify(value));

const hasPassword = (admin) => normalizeText(admin.password).length > 0;
const isUidMappedRecord = (admin) => Boolean(admin.uid && admin.uid === admin.id);
const getFreshness = (admin) => new Date(admin.updatedAt || admin.createdAt || 0).getTime();
const getCompleteness = (admin) =>
  [
    admin.email,
    admin.loginId,
    hasPassword(admin) ? 'password' : '',
    admin.phone,
    admin.branchId,
    admin.role,
    admin.orgType,
    admin.memo,
    admin.updatedAt,
    Array.isArray(admin.permissions) && admin.permissions.length > 0 ? 'permissions' : ''
  ].filter(Boolean).length;

const initFirebase = async () => {
  if (!getApps().length) {
    if (config.firebaseServiceAccountJson) {
      initializeApp({
        credential: cert(JSON.parse(config.firebaseServiceAccountJson)),
        projectId: config.firebaseProjectId
      });
    } else if (config.firebaseServiceAccountPath) {
      const raw = await readFile(config.firebaseServiceAccountPath, 'utf8');
      initializeApp({
        credential: cert(JSON.parse(raw)),
        projectId: config.firebaseProjectId
      });
    } else {
      initializeApp({
        credential: applicationDefault(),
        projectId: config.firebaseProjectId
      });
    }
  }

  return getFirestore();
};

const parseJsonResponse = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

const supabaseRequest = async (path, options = {}) => {
  const isRestRequest = path.startsWith('/rest/v1/');
  const response = await fetch(`${config.supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: config.supabaseSecretKey,
      Authorization: `Bearer ${config.supabaseSecretKey}`,
      'Content-Type': 'application/json',
      ...(isRestRequest ? {
        'Accept-Profile': 'public',
        'Content-Profile': 'public',
      } : {}),
      ...(options.headers || {})
    }
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

const fetchAllAuthUsers = async () => {
  const result = await supabaseRequest('/auth/v1/admin/users?page=1&per_page=1000');
  return Array.isArray(result?.users) ? result.users : [];
};

const fetchTable = async (table, select = '*') => {
  return supabaseRequest(`/rest/v1/${table}?select=${encodeURIComponent(select)}&limit=1000`);
};

const patchTableRow = async (table, filters, payload) => {
  return supabaseRequest(`/rest/v1/${table}?${filters}`, {
    method: 'PATCH',
    headers: {
      Prefer: 'return=representation'
    },
    body: JSON.stringify(sanitizeJson(payload))
  });
};

const clearPrimaryFlag = async (table, employeeId) => {
  return patchTableRow(table, `employee_id=eq.${employeeId}&is_primary=is.true`, {
    is_primary: false
  });
};

const insertTableRow = async (table, payload) => {
  return supabaseRequest(`/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      Prefer: 'return=representation'
    },
    body: JSON.stringify(sanitizeJson(payload))
  });
};

const fetchSingleEmployeeByCode = async (employeeCode) => {
  if (!normalizeText(employeeCode)) return null;

  const rows = await supabaseRequest(
    `/rest/v1/employees?select=id,profile_id,legacy_admin_doc_id,email,name,employee_code,login_id&employee_code=eq.${encodeURIComponent(employeeCode)}&limit=1`
  );

  return Array.isArray(rows) && rows[0] ? rows[0] : null;
};

const canonicalizeAdmins = (admins) => {
  const groups = new Map();
  const ungrouped = [];

  admins.forEach((admin) => {
    const name = normalizeLower(admin.name);
    const email = normalizeEmail(admin.email);
    const loginId = normalizeLower(admin.loginId);

    if (!name && !email && !loginId) {
      ungrouped.push(admin);
      return;
    }

    const key = [
      name,
      email,
      loginId,
      normalizeLower(admin.role),
      normalizeLower(admin.jobTitle),
      normalizeLower(admin.branchId),
      normalizeLower(admin.orgType)
    ].join('|');

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(admin);
  });

  const canonicalAdmins = [];
  const duplicateDocs = [];

  for (const group of groups.values()) {
    group.sort((a, b) => {
      const credentialDiff = Number(hasPassword(b)) - Number(hasPassword(a));
      if (credentialDiff !== 0) return credentialDiff;

      const canonicalDiff = Number(isUidMappedRecord(a)) - Number(isUidMappedRecord(b));
      if (canonicalDiff !== 0) return canonicalDiff;

      const completenessDiff = getCompleteness(b) - getCompleteness(a);
      if (completenessDiff !== 0) return completenessDiff;

      return getFreshness(b) - getFreshness(a);
    });

    canonicalAdmins.push(group[0]);
    duplicateDocs.push(...group.slice(1));
  }

  return {
    canonicalAdmins,
    duplicateDocs,
    ungrouped
  };
};

const inferBranchType = (source) => {
  const orgType = normalizeText(source.orgType || source.branch_type).toUpperCase();
  const locationType = normalizeText(source.type).toUpperCase();
  const code = normalizeLower(source.branchCode || source.branch_code || source.shortCode || source.id);

  if (orgType === 'HQ' || code.includes('hq') || code.includes('head')) return 'HQ';
  if (orgType === 'DRIVER_GROUP') return 'DRIVER_GROUP';
  if (orgType === 'PARTNER' || locationType === 'PARTNER' || source.isPartner) return 'PARTNER';
  if (orgType === 'HUB') return 'HUB';
  return 'HUB';
};

const buildBranchCandidates = (locations, branches) => {
  const candidates = new Map();
  const legacyLocationToCode = new Map();
  const legacyBranchDocToCode = new Map();

  const mergeCandidate = (incoming) => {
    const key = normalizeLower(incoming.branch_code);
    const current = candidates.get(key);
    if (!current) {
      candidates.set(key, incoming);
      return;
    }

    candidates.set(key, {
      ...current,
      ...incoming,
      name: incoming.name || current.name,
      address: incoming.address || current.address,
      phone: incoming.phone || current.phone,
      email: incoming.email || current.email,
      lat: incoming.lat ?? current.lat,
      lng: incoming.lng ?? current.lng,
      is_active: incoming.is_active ?? current.is_active,
      metadata: sanitizeJson({
        ...(current.metadata || {}),
        ...(incoming.metadata || {}),
        legacy_location_ids: Array.from(
          new Set([
            ...((current.metadata || {}).legacy_location_ids || []),
            ...((incoming.metadata || {}).legacy_location_ids || [])
          ])
        ),
        legacy_branch_doc_ids: Array.from(
          new Set([
            ...((current.metadata || {}).legacy_branch_doc_ids || []),
            ...((incoming.metadata || {}).legacy_branch_doc_ids || [])
          ])
        )
      })
    });
  };

  mergeCandidate({
    branch_code: config.defaultHqBranchCode,
    name: 'Beeliber HQ',
    branch_type: 'HQ',
    status: 'active',
    is_active: true,
    metadata: {
      source: 'system_seed',
      legacy_location_ids: ['hq', 'HEADQUARTERS'],
      legacy_branch_doc_ids: []
    }
  });

  locations.forEach((location) => {
    const branchCode = normalizeCode(location.branchCode || location.shortCode || location.id);
    if (!branchCode) return;

    legacyLocationToCode.set(location.id, branchCode);

    mergeCandidate({
      branch_code: branchCode,
      name: normalizeText(location.name) || branchCode,
      branch_type: inferBranchType(location),
      status: location.isActive === false ? 'inactive' : 'active',
      is_active: location.isActive !== false,
      address: normalizeText(location.address) || null,
      phone: normalizeText(location.phone || location.contactNumber) || null,
      lat: toNumber(location.lat),
      lng: toNumber(location.lng),
      metadata: {
        source: 'locations',
        short_code: normalizeText(location.shortCode) || null,
        owner_name: normalizeText(location.ownerName) || null,
        legacy_location_ids: [location.id],
        legacy_branch_doc_ids: [],
        raw_location: sanitizeJson({
          id: location.id,
          type: location.type,
          supportsDelivery: location.supportsDelivery,
          supportsStorage: location.supportsStorage,
          branchCode: location.branchCode || null
        })
      }
    });
  });

  branches.forEach((branch) => {
    const branchCode = normalizeCode(branch.branchCode || branch.branch_code || branch.id);
    if (!branchCode) return;

    legacyBranchDocToCode.set(branch.id, branchCode);

    mergeCandidate({
      branch_code: branchCode,
      name: normalizeText(branch.name) || branchCode,
      branch_type: inferBranchType(branch),
      status: branch.isActive === false ? 'inactive' : 'active',
      is_active: branch.isActive !== false,
      address: normalizeText(branch.address) || null,
      phone: normalizeText(branch.phone || branch.contactNumber) || null,
      lat: toNumber(branch.lat),
      lng: toNumber(branch.lng),
      metadata: {
        source: 'branches',
        legacy_location_ids: [],
        legacy_branch_doc_ids: [branch.id],
        raw_branch: sanitizeJson({
          id: branch.id,
          ownerName: branch.ownerName || null,
          city: branch.city || null,
          region: branch.region || null,
          branchCode: branch.branchCode || null
        })
      }
    });
  });

  return {
    branchCandidates: Array.from(candidates.values()).sort((a, b) => a.branch_code.localeCompare(b.branch_code)),
    legacyLocationToCode,
    legacyBranchDocToCode
  };
};

const mapEmploymentStatus = (status) => {
  const normalized = normalizeLower(status);
  switch (normalized) {
    case 'active':
      return 'active';
    case 'invited':
      return 'inactive';
    case 'locked':
      return 'suspended';
    case 'suspended':
      return 'suspended';
    case 'resigned':
      return 'resigned';
    default:
      return 'active';
  }
};

const resolveOrgType = (admin, resolvedBranchType) => {
  const direct = normalizeText(admin.orgType).toUpperCase();
  if (['HQ', 'HUB', 'PARTNER', 'DRIVER_GROUP'].includes(direct)) {
    return direct;
  }

  const role = normalizeLower(admin.role);
  const jobTitle = normalizeLower(admin.jobTitle);

  if (role === 'partner' || resolvedBranchType === 'PARTNER') return 'PARTNER';
  if (role === 'driver' || jobTitle.includes('driver') || jobTitle.includes('기사')) return 'DRIVER_GROUP';
  if (!normalizeText(admin.branchId)) return 'HQ';
  return resolvedBranchType || 'HUB';
};

const mapLegacyRoleToSupabaseRole = (admin, resolvedBranchType) => {
  const role = normalizeLower(admin.role);
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
    case 'partner':
      return 'partner_manager';
    case 'branch':
      return orgType === 'PARTNER' ? 'partner_manager' : 'hub_manager';
    case 'staff':
      return orgType === 'HQ' ? 'ops_staff' : 'ops_staff';
    default:
      return orgType === 'PARTNER' ? 'partner_manager' : 'ops_staff';
  }
};

const getRolePriority = (roleCode) => {
  switch (normalizeLower(roleCode)) {
    case 'super_admin':
      return 800;
    case 'hq_admin':
      return 700;
    case 'finance_staff':
      return 600;
    case 'partner_manager':
      return 500;
    case 'hub_manager':
      return 400;
    case 'cs_staff':
      return 300;
    case 'ops_staff':
      return 200;
    case 'driver':
      return 100;
    default:
      return 0;
  }
};

const makeEmployeeCode = (admin, resolvedBranchCode, index) => {
  const baseBranch = normalizeCode(resolvedBranchCode || config.defaultHqBranchCode || 'HQ').slice(0, 8) || 'HQ';
  const direct = normalizeCode(admin.loginId || admin.id || '');
  if (direct) {
    return `EMP-${baseBranch}-${direct}`.slice(0, 40);
  }
  return `EMP-${baseBranch}-${String(index + 1).padStart(4, '0')}`;
};

const buildEmployeeLookups = (employees) => {
  const byProfileId = new Map();
  const byLegacyAdminDocId = new Map();
  const byEmail = new Map();
  const byLoginId = new Map();
  const byEmployeeCode = new Map();

  const register = (employee) => {
    if (!employee || !employee.id) return;

    const profileId = normalizeText(employee.profile_id);
    const legacyAdminDocId = normalizeText(employee.legacy_admin_doc_id);
    const email = normalizeEmail(employee.email);
    const loginId = normalizeLower(employee.login_id);
    const employeeCode = normalizeLower(employee.employee_code);

    if (profileId) byProfileId.set(profileId, employee);
    if (legacyAdminDocId) byLegacyAdminDocId.set(legacyAdminDocId, employee);
    if (email) byEmail.set(email, employee);
    if (loginId) byLoginId.set(loginId, employee);
    if (employeeCode) byEmployeeCode.set(employeeCode, employee);
  };

  employees.forEach(register);

  return {
    byProfileId,
    byLegacyAdminDocId,
    byEmail,
    byLoginId,
    byEmployeeCode,
    register
  };
};

const resolveExistingEmployee = ({ authUserId, email, adminId, loginId, employeeCode }, lookups) =>
  lookups.byProfileId.get(normalizeText(authUserId))
  || lookups.byLegacyAdminDocId.get(normalizeText(adminId))
  || lookups.byEmail.get(normalizeEmail(email))
  || lookups.byLoginId.get(normalizeLower(loginId))
  || lookups.byEmployeeCode.get(normalizeLower(employeeCode))
  || null;

const resolveBranchCodeForAdmin = (admin, branchLookup) => {
  const legacyBranchId = normalizeText(admin.branchId);

  if (!legacyBranchId) {
    return config.defaultHqBranchCode;
  }

  if (branchLookup.legacyLocationToCode.has(legacyBranchId)) {
    return branchLookup.legacyLocationToCode.get(legacyBranchId);
  }

  if (branchLookup.legacyBranchDocToCode.has(legacyBranchId)) {
    return branchLookup.legacyBranchDocToCode.get(legacyBranchId);
  }

  const directCode = normalizeCode(legacyBranchId);
  if (branchLookup.branchCodes.has(normalizeLower(directCode))) {
    return directCode;
  }

  return '';
};

const summarizePreviewRows = (rows, title) => {
  console.log(`\n[${title}]`);
  rows.slice(0, config.maxPreviewRows).forEach((row) => {
    console.log(`- ${row}`);
  });
  if (rows.length > config.maxPreviewRows) {
    console.log(`... 외 ${rows.length - config.maxPreviewRows}건`);
  }
};

const main = async () => {
  const db = await initFirebase();

  const [adminsSnap, locationsSnap, branchesSnap] = await Promise.all([
    db.collection('admins').get(),
    db.collection('locations').get(),
    db.collection('branches').get()
  ]);

  const admins = adminsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const locations = locationsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const branches = branchesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const authUsers = await fetchAllAuthUsers();
  const roles = await fetchTable('roles', 'id,code,name');
  const existingBranches = await fetchTable('branches', 'id,branch_code,name,branch_type,status,is_active');
  const existingProfiles = await fetchTable('profiles', 'id,email,display_name,is_active');
  const existingEmployees = await fetchTable('employees', 'id,profile_id,legacy_admin_doc_id,email,name,employee_code,login_id');
  const existingEmployeeRoles = await fetchTable('employee_roles', 'employee_id,is_primary,role:roles(code)');

  if (!Array.isArray(roles) || !roles.length) {
    throw new Error('Supabase roles 테이블이 비어 있습니다. Phase 1 SQL부터 먼저 실행해주세요.');
  }

  const { canonicalAdmins, duplicateDocs, ungrouped } = canonicalizeAdmins(admins);
  const branchLookup = buildBranchCandidates(locations, branches);
  branchLookup.branchCodes = new Set(branchLookup.branchCandidates.map((branch) => normalizeLower(branch.branch_code)));

  const authUsersByEmail = new Map(
    authUsers
      .map((user) => [normalizeEmail(user.email), user])
      .filter(([email]) => email)
  );

  const rolesByCode = new Map(
    roles.map((role) => [normalizeLower(role.code), role])
  );
  const branchesByCode = new Map(
    existingBranches.map((branch) => [normalizeLower(branch.branch_code), branch])
  );
  const profilesById = new Map(existingProfiles.map((profile) => [profile.id, profile]));
  const employeeLookups = buildEmployeeLookups(existingEmployees);
  const preferredRoleCodeByEmployeeId = new Map();
  existingEmployeeRoles
    .filter((entry) => entry?.employee_id && entry?.role?.code)
    .sort((a, b) => {
      const priorityDiff = getRolePriority(b?.role?.code) - getRolePriority(a?.role?.code);
      if (priorityDiff !== 0) return priorityDiff;
      return Number(b?.is_primary) - Number(a?.is_primary);
    })
    .forEach((entry) => {
      if (!preferredRoleCodeByEmployeeId.has(entry.employee_id)) {
        preferredRoleCodeByEmployeeId.set(entry.employee_id, normalizeLower(entry.role.code));
      }
    });

  const previewMatchedAdmins = [];
  const previewSkippedAdmins = [];
  const actionableAdmins = [];
  const warnings = [];
  let syntheticEmailCount = 0;

  canonicalAdmins.forEach((admin, index) => {
    const { email, synthetic } = resolveAdminEmail(admin);
    const resolvedBranchCode = resolveBranchCodeForAdmin(admin, branchLookup);
    const resolvedBranchType = resolvedBranchCode
      ? branchLookup.branchCandidates.find((branch) => normalizeLower(branch.branch_code) === normalizeLower(resolvedBranchCode))?.branch_type
      : '';
    const existingEmployee = resolveExistingEmployee(
      {
        authUserId: authUsersByEmail.get(email)?.id,
        email,
        adminId: admin.id,
        loginId: admin.loginId,
        employeeCode: makeEmployeeCode(admin, resolvedBranchCode, index)
      },
      employeeLookups
    );
    const preservedRoleCode = existingEmployee ? preferredRoleCodeByEmployeeId.get(existingEmployee.id) : '';
    const roleCode =
      !normalizeText(admin.role) && preservedRoleCode
        ? preservedRoleCode
        : mapLegacyRoleToSupabaseRole(admin, resolvedBranchType);

    if (!rolesByCode.has(normalizeLower(roleCode))) {
      warnings.push(`${admin.name || admin.id}: Supabase role "${roleCode}" 가 roles seed에 없습니다.`);
      return;
    }

    if (!email) {
      previewSkippedAdmins.push(`${admin.name || admin.id} -> email 없음, 직원 Auth 매칭 불가`);
      return;
    }

    if (synthetic) {
      syntheticEmailCount += 1;
    }

    const authUser = authUsersByEmail.get(email);
    if (!authUser) {
      previewSkippedAdmins.push(`${admin.name || admin.id} <${email}> -> Supabase Auth 미생성`);
      return;
    }

    if (!resolvedBranchCode) {
      previewSkippedAdmins.push(`${admin.name || admin.id} <${email}> -> branch 매핑 실패 (${admin.branchId || '없음'})`);
      return;
    }

    actionableAdmins.push({
      admin,
      authUser,
      email,
      syntheticEmail: synthetic,
      roleCode,
      resolvedBranchCode,
      resolvedBranchType: resolvedBranchType || 'HUB',
      employeeCode: makeEmployeeCode(admin, resolvedBranchCode, index)
    });

    previewMatchedAdmins.push(
      `${admin.name || admin.id} <${email}> -> ${roleCode} / ${resolvedBranchCode} / auth:${authUser.id}${synthetic ? ' / synthetic' : ''}`
    );
  });

  console.log('[스봉이] Firebase -> Supabase Phase 1 HR/지점 동기화 요약');
  console.log(`- 모드: ${config.apply ? 'APPLY' : 'DRY_RUN'}`);
  console.log(`- Firebase admins: ${admins.length}`);
  console.log(`- canonical admins: ${canonicalAdmins.length}`);
  console.log(`- duplicate docs ignored: ${duplicateDocs.length}`);
  console.log(`- ungrouped docs: ${ungrouped.length}`);
  console.log(`- branch candidates: ${branchLookup.branchCandidates.length}`);
  console.log(`- Supabase auth users: ${authUsers.length}`);
  console.log(`- actionable admins: ${actionableAdmins.length}`);
  console.log(`- synthetic email 매칭: ${syntheticEmailCount}`);
  console.log(`- skipped admins: ${previewSkippedAdmins.length}`);

  summarizePreviewRows(previewMatchedAdmins, '이관 가능 직원 미리보기');
  summarizePreviewRows(previewSkippedAdmins, '보류 직원 미리보기');
  summarizePreviewRows(warnings, '경고');

  if (!config.apply) {
    console.log('\n[스봉이] dry-run 끝났어요. 실제 반영은 SUPABASE_APPLY=true 를 붙이면 됩니다.');
    return;
  }

  for (const candidate of branchLookup.branchCandidates) {
    const key = normalizeLower(candidate.branch_code);
    const existing = branchesByCode.get(key);
    const payload = {
      branch_code: candidate.branch_code,
      name: candidate.name,
      branch_type: candidate.branch_type,
      status: candidate.status,
      is_active: candidate.is_active,
      address: candidate.address || null,
      phone: candidate.phone || null,
      email: candidate.email || null,
      lat: candidate.lat,
      lng: candidate.lng,
      metadata: candidate.metadata || {}
    };

    if (existing) {
      const [updated] = await patchTableRow('branches', `id=eq.${existing.id}`, payload);
      branchesByCode.set(key, updated || existing);
    } else {
      const [inserted] = await insertTableRow('branches', payload);
      if (inserted) {
        branchesByCode.set(key, inserted);
      }
    }
  }

  for (const item of actionableAdmins) {
    const role = rolesByCode.get(normalizeLower(item.roleCode));
    const branch = branchesByCode.get(normalizeLower(item.resolvedBranchCode));

    if (!role || !branch) {
      warnings.push(`${item.admin.name || item.admin.id}: role 또는 branch row 해석 실패`);
      continue;
    }

    const profilePayload = {
      id: item.authUser.id,
      email: item.email,
      display_name: item.admin.name || item.email,
      account_type: 'employee',
      phone: normalizeText(item.admin.phone) || null,
      last_login_at: toIsoString(item.admin.lastLogin),
      is_active: mapEmploymentStatus(item.admin.status) === 'active',
      metadata: {
        migrated_from: 'firebase_admins',
        legacy_admin_doc_id: item.admin.id,
        legacy_role: item.admin.role || null,
        synthetic_email: item.syntheticEmail || false
      }
    };

    if (profilesById.has(item.authUser.id)) {
      await patchTableRow('profiles', `id=eq.${item.authUser.id}`, profilePayload);
    } else {
      const [insertedProfile] = await insertTableRow('profiles', profilePayload);
      if (insertedProfile) {
        profilesById.set(insertedProfile.id, insertedProfile);
      }
    }

    const existingEmployee = resolveExistingEmployee(
      {
        authUserId: item.authUser.id,
        email: item.email,
        adminId: item.admin.id,
        loginId: item.admin.loginId,
        employeeCode: item.employeeCode
      },
      employeeLookups
    );

    const employeePayload = {
      profile_id: item.authUser.id,
      employee_code: normalizeText(existingEmployee?.employee_code) || item.employeeCode,
      legacy_admin_doc_id: normalizeText(existingEmployee?.legacy_admin_doc_id) || item.admin.id,
      name: item.admin.name || item.email,
      email: item.email,
      login_id: normalizeText(item.admin.loginId) || normalizeText(existingEmployee?.login_id) || null,
      phone: normalizeText(item.admin.phone) || null,
      job_title: normalizeText(item.admin.jobTitle) || null,
      org_type: resolveOrgType(item.admin, item.resolvedBranchType),
      employment_status: mapEmploymentStatus(item.admin.status),
      security: sanitizeJson({
        ...(item.admin.security || {}),
        synthetic_email: item.syntheticEmail || false
      }),
      memo: normalizeText(item.admin.memo) || null
    };

    let employeeId = existingEmployee?.id;
    if (employeeId) {
      const updatedEmployees = await patchTableRow('employees', `id=eq.${employeeId}`, employeePayload);
      const updatedEmployee = updatedEmployees[0] || existingEmployee;
      employeeId = updatedEmployee?.id || employeeId;
      if (updatedEmployee) {
        employeeLookups.register(updatedEmployee);
      }
    } else {
      try {
        const [insertedEmployee] = await insertTableRow('employees', employeePayload);
        employeeId = insertedEmployee?.id;
        if (insertedEmployee) {
          employeeLookups.register(insertedEmployee);
        }
      } catch (error) {
        const isDuplicateEmployeeCode =
          error?.status === 409 ||
          error?.body?.code === '23505' ||
          String(error?.message || '').includes('employees_code_lower_idx');

        if (!isDuplicateEmployeeCode) {
          throw error;
        }

        const conflictedEmployee = await fetchSingleEmployeeByCode(item.employeeCode);
        if (!conflictedEmployee?.id) {
          throw error;
        }

        const updatedEmployees = await patchTableRow('employees', `id=eq.${conflictedEmployee.id}`, employeePayload);
        const updatedEmployee = updatedEmployees[0] || conflictedEmployee;
        employeeId = updatedEmployee?.id || conflictedEmployee.id;
        employeeLookups.register(updatedEmployee);
      }
    }

    if (!employeeId) {
      warnings.push(`${item.admin.name || item.admin.id}: employee upsert 실패`);
      continue;
    }

    await clearPrimaryFlag('employee_roles', employeeId);
    await supabaseRequest('/rest/v1/employee_roles?on_conflict=employee_id,role_id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify([
        {
          employee_id: employeeId,
          role_id: role.id,
          is_primary: true
        }
      ])
    });

    await clearPrimaryFlag('employee_branch_assignments', employeeId);
    await supabaseRequest('/rest/v1/employee_branch_assignments?on_conflict=employee_id,branch_id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify([
        {
          employee_id: employeeId,
          branch_id: branch.id,
          assignment_type: 'primary',
          is_primary: true
        }
      ])
    });
  }

  console.log('\n[스봉이] apply 모드 반영 끝났어요. 다시 verify 하고 로그인 연결로 넘어가면 됩니다.');
  summarizePreviewRows(warnings, '반영 중 경고');
};

main().catch((error) => {
  const status = error?.status ? ` status=${error.status}` : '';
  const details = error?.body ? `\n${JSON.stringify(error.body, null, 2)}` : '';
  console.error(`[스봉이] Phase 1 동기화 실패${status}: ${error.message}${details}`);
  process.exit(1);
});
