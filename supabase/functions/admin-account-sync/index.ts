import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  authenticateAdminRequest,
  CORS_HEADERS,
  EdgeHttpError,
  jsonResponse,
  isUuid,
  mapSupabaseRoleToLegacyRole,
  normalizeLower,
  normalizeText,
  normalizeUpper,
  requestEmployeeAssignmentsWithBranch,
  requestSupabase,
  requestSupabaseTable,
  resolveLegacyLocationId,
} from "../_shared/admin-auth.ts";

const DEFAULT_HQ_BRANCH_CODE = "HQ-SEOUL";
const DEFAULT_SYNTHETIC_EMAIL_DOMAIN = "staff.bee-liber.invalid";
const HQ_BRANCH_ALIASES = new Set(["", "HQ", "HEADQUARTERS", "HQ-SEOUL"]);
const VALID_LEGACY_ROLES = new Set(["super", "hq", "branch", "staff", "partner", "driver", "finance", "cs"]);
const VALID_STATUSES = new Set(["invited", "active", "suspended", "resigned", "locked"]);
const VALID_ORG_TYPES = new Set(["HQ", "HUB", "PARTNER", "DRIVER_GROUP"]);

type AdminPayload = {
  id?: string;
  employeeId?: string;
  profileId?: string;
  name?: string;
  email?: string;
  loginId?: string;
  password?: string;
  phone?: string;
  jobTitle?: string;
  role?: string;
  branchId?: string;
  branchCode?: string;
  status?: string;
  orgType?: string;
  memo?: string;
  permissions?: string[];
  security?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

const normalizeEmail = (value: unknown) => {
  const email = normalizeLower(value);
  if (!email || !email.includes("@")) return "";
  return email;
};

const sanitizeAsciiToken = (value: unknown) =>
  normalizeText(value)
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

const normalizeCode = (value: unknown) =>
  normalizeText(value)
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase();

const sanitizeJson = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const mapEmploymentStatus = (status?: string) => {
  switch (normalizeLower(status)) {
    case "invited":
      return "inactive";
    case "locked":
    case "suspended":
      return "suspended";
    case "resigned":
      return "resigned";
    default:
      return "active";
  }
};

const mapSupabaseEmploymentStatusToAdminStatus = (status?: string) => {
  switch (normalizeLower(status)) {
    case "inactive":
      return "invited";
    case "suspended":
      return "suspended";
    case "resigned":
    case "merged":
      return "resigned";
    default:
      return "active";
  }
};

const inferLegacyRole = (admin: Partial<AdminPayload>) => {
  const explicitRole = normalizeLower(admin.role);
  if (VALID_LEGACY_ROLES.has(explicitRole)) {
    return explicitRole;
  }

  const title = normalizeUpper(admin.jobTitle);
  if (title.includes("CEO") || title.includes("MASTER") || title.includes("GENERAL MANAGER")) {
    return "super";
  }

  if (normalizeText(admin.branchId || admin.branchCode)) {
    return normalizeUpper(admin.orgType) === "PARTNER" ? "partner" : "branch";
  }

  return "staff";
};

const resolveBranchType = (source: Record<string, unknown> | null, admin: Partial<AdminPayload>) => {
  const explicit = normalizeUpper(source?.branch_type || source?.branchType);
  if (["HQ", "HUB", "PARTNER", "DRIVER_GROUP"].includes(explicit)) {
    return explicit === "DRIVER_GROUP" ? "HUB" : explicit;
  }

  const locationType = normalizeUpper(source?.type);
  if (locationType === "PARTNER") return "PARTNER";
  if (normalizeUpper(admin.orgType) === "PARTNER") return "PARTNER";
  return normalizeText(admin.branchId || admin.branchCode) ? "HUB" : "HQ";
};

const resolveOrgType = (admin: Partial<AdminPayload>, resolvedBranchType: string) => {
  const explicit = normalizeUpper(admin.orgType);
  if (VALID_ORG_TYPES.has(explicit)) {
    return explicit;
  }

  const role = inferLegacyRole(admin);
  const jobTitle = normalizeLower(admin.jobTitle);

  if (role === "partner" || resolvedBranchType === "PARTNER") return "PARTNER";
  if (role === "driver" || jobTitle.includes("driver") || jobTitle.includes("기사")) return "DRIVER_GROUP";
  if (!normalizeText(admin.branchId || admin.branchCode)) return "HQ";
  return resolvedBranchType || "HUB";
};

const mapLegacyRoleToSupabaseRole = (admin: Partial<AdminPayload>, resolvedBranchType: string) => {
  const role = inferLegacyRole(admin);
  const orgType = resolveOrgType(admin, resolvedBranchType);

  switch (role) {
    case "super":
      return "super_admin";
    case "hq":
      return "hq_admin";
    case "finance":
      return "finance_staff";
    case "cs":
      return "cs_staff";
    case "driver":
      return "driver";
    case "partner":
      return "partner_manager";
    case "branch":
      return orgType === "PARTNER" ? "partner_manager" : "hub_manager";
    default:
      return "ops_staff";
  }
};

const makeEmployeeCode = (admin: Partial<AdminPayload>, resolvedBranchCode: string) => {
  const baseBranch = normalizeCode(resolvedBranchCode || DEFAULT_HQ_BRANCH_CODE).slice(0, 8) || "HQ";
  const direct = normalizeCode(admin.loginId || admin.id || "");
  if (direct) {
    return `EMP-${baseBranch}-${direct}`.slice(0, 40);
  }
  return `EMP-${baseBranch}-${Date.now().toString().slice(-6)}`;
};

const buildSyntheticEmail = (admin: Partial<AdminPayload>) => {
  const readableToken =
    sanitizeAsciiToken(admin.loginId)
    || sanitizeAsciiToken(admin.name)
    || sanitizeAsciiToken(admin.branchCode)
    || sanitizeAsciiToken(admin.branchId)
    || "staff";
  const docToken =
    sanitizeAsciiToken(admin.id)
    || crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const localPart = `admin-${readableToken.slice(0, 20)}-${docToken.slice(0, 20)}`.slice(0, 64);
  return `${localPart}@${DEFAULT_SYNTHETIC_EMAIL_DOMAIN}`;
};

const buildBranchPayload = (
  source: Record<string, unknown> | null,
  branchCode: string,
  admin: Partial<AdminPayload>,
) => ({
  branch_code: branchCode,
  name: normalizeText(source?.name) || branchCode,
  branch_type: resolveBranchType(source, admin),
  status: normalizeText(source?.status) || "active",
  is_active: source?.is_active !== false,
  address: normalizeText(source?.address) || null,
  phone: normalizeText(source?.phone) || null,
  email: normalizeEmail(source?.email) || null,
  lat: typeof source?.lat === "number" ? source.lat : null,
  lng: typeof source?.lng === "number" ? source.lng : null,
  metadata: sanitizeJson({
    source: "supabase_edge_admin_sync",
    legacy_location_id: normalizeText(source?.id) || null,
    location_type: normalizeText(source?.type) || null,
  }),
});

const validateInput = (input: Partial<AdminPayload>) => {
  const name = normalizeText(input.name);
  const jobTitle = normalizeText(input.jobTitle);
  if (!name) throw new EdgeHttpError(400, "이름은 필수입니다.");
  if (!jobTitle) throw new EdgeHttpError(400, "직책은 필수입니다.");
  if (name.length > 80 || jobTitle.length > 120) {
    throw new EdgeHttpError(400, "입력 길이가 너무 깁니다.");
  }
  if (input.email && !normalizeEmail(input.email)) {
    throw new EdgeHttpError(400, "내부 인증 이메일 형식이 올바르지 않습니다.");
  }
  if (input.status && !VALID_STATUSES.has(normalizeLower(input.status))) {
    throw new EdgeHttpError(400, "계정 상태 값이 올바르지 않습니다.");
  }
};

const fetchAllAuthUsers = async () => {
  const result = await requestSupabase<{ users?: Array<Record<string, unknown>> }>(
    "/auth/v1/admin/users?page=1&per_page=1000",
  );
  return Array.isArray(result.users) ? result.users : [];
};

const findAuthUser = ({
  users,
  adminId,
  resolvedEmail,
  profileId,
}: {
  users: Array<Record<string, unknown>>;
  adminId: string;
  resolvedEmail: string;
  profileId?: string;
}) => {
  const emailMap = new Map(
    users
      .map((user) => [normalizeEmail(user.email), user] as const)
      .filter(([email]) => email),
  );

  const byLegacy = users.find((user) =>
    normalizeText((user.app_metadata as Record<string, unknown> | undefined)?.legacy_admin_doc_id) === adminId
  ) || null;
  const byProfile = profileId ? users.find((user) => normalizeText(user.id) === profileId) || null : null;
  const byEmail = resolvedEmail ? emailMap.get(resolvedEmail) || null : null;

  const unique = Array.from(new Map([byLegacy, byProfile, byEmail].filter(Boolean).map((user) => [
    normalizeText(user?.id),
    user!,
  ])).values());

  if (unique.length > 1) {
    throw new EdgeHttpError(409, "같은 직원으로 해석되는 Supabase 인증 계정이 여러 개라 정리가 필요합니다.");
  }

  return unique[0] || null;
};

const patchTableRow = async (
  table: string,
  filters: string,
  payload: Record<string, unknown>,
) =>
  await requestSupabase<Array<Record<string, unknown>>>(
    `/rest/v1/${table}?${filters}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(sanitizeJson(payload)),
    },
  );

const insertTableRow = async (
  table: string,
  payload: Record<string, unknown> | Array<Record<string, unknown>>,
  onConflict?: string,
) =>
  await requestSupabase<Array<Record<string, unknown>>>(
    `/rest/v1/${table}${onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : ""}`,
    {
      method: "POST",
      headers: {
        Prefer: "return=representation,resolution=merge-duplicates",
      },
      body: JSON.stringify(Array.isArray(payload) ? sanitizeJson(payload) : [sanitizeJson(payload)]),
    },
  );

const clearPrimaryFlag = async (table: string, employeeId: string) => {
  await requestSupabase(
    `/rest/v1/${table}?employee_id=eq.${encodeURIComponent(employeeId)}&is_primary=eq.true`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ is_primary: false }),
    },
  );
};

const deleteRows = async (table: string, filters: string) => {
  await requestSupabase(
    `/rest/v1/${table}?${filters}`,
    {
      method: "DELETE",
      headers: {
        Prefer: "return=minimal",
      },
    },
  );
};

const lookupLocation = async (identifier: string) => {
  const normalized = normalizeText(identifier);
  if (!normalized) return null;

  if (isUuid(normalized)) {
    const byId = await requestSupabaseTable<Record<string, unknown>>(
      "locations",
      `select=id,name,type,address,phone,lat,lng,branch_code,short_code,branch_id,is_active&id=eq.${encodeURIComponent(normalized)}&limit=1`,
    );
    if (byId[0]) return byId[0];
  }

  const [byBranchCode, byShortCode] = await Promise.all([
    requestSupabaseTable<Record<string, unknown>>(
      "locations",
      `select=id,name,type,address,phone,lat,lng,branch_code,short_code,branch_id,is_active&branch_code=eq.${encodeURIComponent(normalized)}&is_active=eq.true&limit=1`,
    ),
    requestSupabaseTable<Record<string, unknown>>(
      "locations",
      `select=id,name,type,address,phone,lat,lng,branch_code,short_code,branch_id,is_active&short_code=eq.${encodeURIComponent(normalized)}&is_active=eq.true&limit=1`,
    ),
  ]);

  return byBranchCode[0] || byShortCode[0] || null;
};

const resolveBranchContext = async (admin: Partial<AdminPayload>) => {
  const normalizedBranchToken = normalizeText(admin.branchId || admin.branchCode);
  if (HQ_BRANCH_ALIASES.has(normalizeUpper(normalizedBranchToken))) {
    return {
      branchCode: DEFAULT_HQ_BRANCH_CODE,
      branchType: "HQ",
      branchPayload: {
        branch_code: DEFAULT_HQ_BRANCH_CODE,
        name: "본사",
        branch_type: "HQ",
        status: "active",
        is_active: true,
        address: null,
        phone: null,
        email: null,
        lat: null,
        lng: null,
        metadata: { source: "supabase_edge_admin_sync", legacy_location_id: null },
      },
      locationId: "",
    };
  }

  const location =
    await lookupLocation(normalizeText(admin.branchId))
    || await lookupLocation(normalizeText(admin.branchCode));
  const branchCode = normalizeCode(
    location?.branch_code || location?.short_code || admin.branchCode || admin.branchId,
  );

  const existingBranches = branchCode
    ? await requestSupabaseTable<Record<string, unknown>>(
      "branches",
      `select=id,branch_code,name,branch_type,status,address,phone,email,is_active&branch_code=eq.${encodeURIComponent(branchCode)}&limit=1`,
    )
    : [];
  const existingBranch = existingBranches[0] || null;
  const source = location || existingBranch || { id: admin.branchId, name: admin.branchCode || admin.branchId };

  if (!branchCode) {
    throw new EdgeHttpError(400, "지점 코드를 확인할 수 없습니다.");
  }

  return {
    branchCode,
    branchType: resolveBranchType(source, admin),
    branchPayload: buildBranchPayload(source, branchCode, admin),
    locationId: normalizeText(location?.id),
  };
};

const upsertBranch = async ({
  branchCode,
  branchPayload,
  locationId,
}: {
  branchCode: string;
  branchPayload: Record<string, unknown>;
  locationId?: string;
}) => {
  const existing = await requestSupabaseTable<Record<string, unknown>>(
    "branches",
    `select=id,branch_code&branch_code=eq.${encodeURIComponent(branchCode)}&limit=1`,
  );

  const branchRow = existing[0]?.id
    ? (await patchTableRow("branches", `id=eq.${existing[0].id}`, branchPayload))[0] || existing[0]
    : (await insertTableRow("branches", branchPayload))[0];

  if (locationId && branchRow?.id) {
    await patchTableRow("locations", `id=eq.${encodeURIComponent(locationId)}`, {
      branch_id: branchRow.id,
      branch_code: branchCode,
    });
  }

  return branchRow;
};

const upsertAuthUser = async ({
  user,
  admin,
  resolvedEmail,
  syntheticEmail,
  roleCode,
  orgType,
}: {
  user: Record<string, unknown> | null;
  admin: Partial<AdminPayload>;
  resolvedEmail: string;
  syntheticEmail: boolean;
  roleCode: string;
  orgType: string;
}) => {
  const payload: Record<string, unknown> = {
    email: resolvedEmail,
    email_confirm: true,
    user_metadata: {
      display_name: normalizeText(admin.name) || resolvedEmail,
      login_id: normalizeText(admin.loginId) || null,
      job_title: normalizeText(admin.jobTitle) || null,
      branch_id: normalizeText(admin.branchId) || null,
      branch_code: normalizeText(admin.branchCode) || null,
      synthetic_email: syntheticEmail,
    },
    app_metadata: {
      source: "supabase_edge_admin_sync",
      legacy_admin_doc_id: admin.id,
      role_code: roleCode,
      org_type: orgType,
      synthetic_email: syntheticEmail,
    },
  };

  if (normalizeText(admin.password)) {
    payload.password = normalizeText(admin.password);
  }

  if (user?.id) {
    return await requestSupabase<Record<string, unknown>>(`/auth/v1/admin/users/${user.id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  return await requestSupabase<Record<string, unknown>>("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

const upsertProfile = async ({
  authUserId,
  admin,
  resolvedEmail,
  syntheticEmail,
}: {
  authUserId: string;
  admin: Partial<AdminPayload>;
  resolvedEmail: string;
  syntheticEmail: boolean;
}) => {
  const existing = await requestSupabaseTable<Record<string, unknown>>(
    "profiles",
    `select=id&id=eq.${encodeURIComponent(authUserId)}&limit=1`,
  );

  const payload = {
    id: authUserId,
    email: resolvedEmail,
    display_name: normalizeText(admin.name) || resolvedEmail,
    account_type: "employee",
    phone: normalizeText(admin.phone) || null,
    last_login_at: null,
    is_active: mapEmploymentStatus(admin.status) === "active",
    metadata: {
      migrated_from: "supabase_edge_admin_sync",
      legacy_admin_doc_id: admin.id,
      legacy_role: admin.role || null,
      synthetic_email: syntheticEmail,
    },
  };

  if (existing[0]?.id) {
    await patchTableRow("profiles", `id=eq.${encodeURIComponent(authUserId)}`, payload);
    return;
  }

  await insertTableRow("profiles", payload);
};

const upsertEmployee = async ({
  authUserId,
  admin,
  resolvedEmail,
  branchCode,
  branchType,
  syntheticEmail,
}: {
  authUserId: string;
  admin: Partial<AdminPayload>;
  resolvedEmail: string;
  branchCode: string;
  branchType: string;
  syntheticEmail: boolean;
}) => {
  const byLegacy = normalizeText(admin.id)
    ? await requestSupabaseTable<Record<string, unknown>>(
      "employees",
      `select=id,profile_id&legacy_admin_doc_id=eq.${encodeURIComponent(normalizeText(admin.id))}&limit=1`,
    )
    : [];
  const byProfile = byLegacy[0]?.id
    ? []
    : await requestSupabaseTable<Record<string, unknown>>(
      "employees",
      `select=id,profile_id&profile_id=eq.${encodeURIComponent(authUserId)}&limit=1`,
    );
  const existing = byLegacy[0] || byProfile[0] || null;

  const payload = {
    profile_id: authUserId,
    employee_code: makeEmployeeCode(admin, branchCode),
    legacy_admin_doc_id: normalizeText(admin.id) || null,
    name: normalizeText(admin.name) || resolvedEmail,
    email: resolvedEmail,
    login_id: normalizeText(admin.loginId) || null,
    phone: normalizeText(admin.phone) || null,
    job_title: normalizeText(admin.jobTitle) || null,
    org_type: resolveOrgType(admin, branchType),
    employment_status: mapEmploymentStatus(admin.status),
    security: sanitizeJson({
      ...(admin.security || {}),
      // permissions 배열을 security JSONB에 저장 — employees 테이블에 별도 컬럼 없음
      permissions: Array.isArray(admin.permissions) ? admin.permissions : undefined,
      synthetic_email: syntheticEmail,
    }),
    memo: normalizeText(admin.memo) || null,
  };

  if (existing?.id) {
    return (await patchTableRow("employees", `id=eq.${existing.id}`, payload))[0] || { id: existing.id, ...payload };
  }

  return (await insertTableRow("employees", payload))[0];
};

const upsertEmployeeRole = async (employeeId: string, roleCode: string) => {
  const roles = await requestSupabaseTable<Record<string, unknown>>(
    "roles",
    `select=id,code&code=eq.${encodeURIComponent(roleCode)}&limit=1`,
  );
  const role = roles[0];
  if (!role?.id) {
    throw new EdgeHttpError(500, `Supabase roles 테이블에 "${roleCode}" 권한이 없습니다.`);
  }

  await clearPrimaryFlag("employee_roles", employeeId);
  await insertTableRow("employee_roles", {
    employee_id: employeeId,
    role_id: role.id,
    is_primary: true,
  }, "employee_id,role_id");
};

const upsertEmployeeBranchAssignment = async (employeeId: string, branchId?: string) => {
  if (!branchId) return;
  await clearPrimaryFlag("employee_branch_assignments", employeeId);
  await insertTableRow("employee_branch_assignments", {
    employee_id: employeeId,
    branch_id: branchId,
    assignment_type: "primary",
    is_primary: true,
  }, "employee_id,branch_id");
};

const buildMergedAdmin = ({
  input,
  existingAdmin,
}: {
  input: Partial<AdminPayload>;
  existingAdmin: Partial<AdminPayload> | null;
}) => {
  validateInput(input);

  const finalId =
    normalizeText(input.id)
    || normalizeText(existingAdmin?.id)
    || normalizeText(input.loginId)
    || normalizeText(input.branchCode)
    || normalizeText(input.branchId)
    || `admin-${Date.now()}`;
  const now = new Date().toISOString();
  const nextAdmin: Partial<AdminPayload> = {
    ...(existingAdmin || {}),
    ...sanitizeJson(input),
    id: finalId,
    name: normalizeText(input.name || existingAdmin?.name),
    jobTitle: normalizeText(input.jobTitle || existingAdmin?.jobTitle),
    loginId:
      normalizeText(input.loginId || existingAdmin?.loginId || input.branchCode || existingAdmin?.branchCode)
      || undefined,
    // branchId = '' (본사 명시 선택) → branchCode도 함께 초기화. JSON 직렬화로 branchCode는 undefined로 제거되므로 || 폴백 금지
    ...(input.branchId === '' ? {
      branchId: undefined,
      branchCode: undefined,
    } : {
      branchId: input.branchId != null
        ? (normalizeText(input.branchId) || undefined)
        : (normalizeText(existingAdmin?.branchId) || undefined),
      branchCode: input.branchCode != null
        ? (normalizeText(input.branchCode) || undefined)
        : (normalizeText(existingAdmin?.branchCode) || undefined),
    }),
    phone: normalizeText(input.phone || existingAdmin?.phone) || undefined,
    memo: normalizeText(input.memo || existingAdmin?.memo) || undefined,
    role: inferLegacyRole({ ...(existingAdmin || {}), ...(input || {}) }),
    status: VALID_STATUSES.has(normalizeLower(input.status))
      ? normalizeLower(input.status)
      : normalizeLower(existingAdmin?.status) || "active",
    orgType: VALID_ORG_TYPES.has(normalizeUpper(input.orgType))
      ? normalizeUpper(input.orgType)
      : VALID_ORG_TYPES.has(normalizeUpper(existingAdmin?.orgType))
        ? normalizeUpper(existingAdmin?.orgType)
        : undefined,
    email: normalizeEmail(input.email || existingAdmin?.email) || undefined,
    permissions: Array.isArray(input.permissions)
      ? [...new Set(input.permissions.map((entry) => normalizeText(entry)).filter(Boolean))]
      : existingAdmin?.permissions || [],
    security: {
      ...(existingAdmin?.security || {}),
      ...(input.security || {}),
    },
    createdAt: normalizeText(existingAdmin?.createdAt || input.createdAt) || now,
    updatedAt: now,
    profileId: normalizeText(existingAdmin?.profileId) || undefined,
    employeeId: normalizeText(existingAdmin?.employeeId) || undefined,
  };

  const nextPassword = normalizeText(input.password);
  if (nextPassword) {
    nextAdmin.password = nextPassword;
  }

  return nextAdmin;
};

const isSelfMutation = (actor: Record<string, unknown>, targetAdmin: Partial<AdminPayload>) => {
  const actorUid = normalizeText(actor.uid);
  const actorEmail = normalizeEmail(actor.email);
  const actorLoginId = normalizeLower(actor.loginId);

  return Boolean(
    (actorUid && actorUid === normalizeText(targetAdmin.profileId)) ||
    (actorEmail && actorEmail === normalizeEmail(targetAdmin.email)) ||
    (actorLoginId && actorLoginId === normalizeLower(targetAdmin.loginId))
  );
};

const assertCanManageAdminAccount = ({
  actor,
  targetAdmin,
  isDelete = false,
}: {
  actor: Record<string, unknown>;
  targetAdmin: Partial<AdminPayload>;
  isDelete?: boolean;
}) => {
  const actorRole = normalizeLower(actor.role);
  const targetRole = inferLegacyRole(targetAdmin);
  const actorBranchId = normalizeText(actor.branchId);
  const actorBranchCode = normalizeText(actor.branchCode);
  const targetBranchId = normalizeText(targetAdmin.branchId);
  const targetBranchCode = normalizeText(targetAdmin.branchCode);

  if (isDelete && isSelfMutation(actor, targetAdmin)) {
    throw new EdgeHttpError(403, "본인 계정은 여기서 삭제할 수 없습니다.");
  }

  if (actorRole === "super") return;

  if (actorRole === "hq") {
    if (targetRole === "super") {
      throw new EdgeHttpError(403, "슈퍼관리자 계정은 본사운영팀에서 수정/삭제할 수 없습니다.");
    }
    return;
  }

  if (actorRole === "branch" || actorRole === "partner") {
    if (targetRole !== "staff") {
      throw new EdgeHttpError(403, "지점 계정에서는 일반 스태프만 관리할 수 있습니다.");
    }

    const sameBranch = Boolean(
      targetBranchId && (
        (actorBranchId && actorBranchId === targetBranchId) ||
        (actorBranchCode && actorBranchCode === targetBranchId) ||
        (actorBranchCode && targetBranchCode && actorBranchCode === targetBranchCode)
      ),
    );

    if (!sameBranch) {
      throw new EdgeHttpError(403, "다른 지점 직원은 관리할 수 없습니다.");
    }
    return;
  }

  throw new EdgeHttpError(403, "이 계정을 관리할 권한이 없습니다.");
};

const loadAdminFromSupabase = async (adminId: string): Promise<Partial<AdminPayload> | null> => {
  const normalizedId = normalizeText(adminId);
  if (!normalizedId) return null;

  const queries = [
    requestSupabaseTable<Record<string, unknown>>(
      "employees",
      `select=id,profile_id,legacy_admin_doc_id,name,email,login_id,job_title,org_type,employment_status,security,memo&legacy_admin_doc_id=eq.${encodeURIComponent(normalizedId)}&limit=1`,
    ),
  ];

  if (isUuid(normalizedId)) {
    queries.push(
      requestSupabaseTable<Record<string, unknown>>(
        "employees",
        `select=id,profile_id,legacy_admin_doc_id,name,email,login_id,job_title,org_type,employment_status,security,memo&id=eq.${encodeURIComponent(normalizedId)}&limit=1`,
      ),
    );
  } else {
    queries.push(
      requestSupabaseTable<Record<string, unknown>>(
        "employees",
        `select=id,profile_id,legacy_admin_doc_id,name,email,login_id,job_title,org_type,employment_status,security,memo&login_id=eq.${encodeURIComponent(normalizedId)}&limit=1`,
      ),
    );
  }

  const [byLegacy, byAlt] = await Promise.all(queries);
  const employee = byLegacy[0] || byAlt[0];
  if (!employee?.id) return null;

  const [roles, assignments] = await Promise.all([
    requestSupabaseTable<Array<{
      is_primary?: boolean;
      role?: { code?: string; name?: string } | null;
    }>[number]>(
      "employee_roles",
      `select=is_primary,role:roles(code,name)&employee_id=eq.${encodeURIComponent(normalizeText(employee.id))}&order=is_primary.desc&limit=10`,
    ),
    requestEmployeeAssignmentsWithBranch(normalizeText(employee.id)),
  ]);

  const primaryRole = roles.find((entry) => entry?.is_primary) || roles[0] || null;
  const primaryBranch = assignments.find((entry) => entry?.is_primary) || assignments[0] || null;
  const branchCode = normalizeText(primaryBranch?.branch?.branch_code);
  const legacyBranchId = await resolveLegacyLocationId(branchCode);

  const securityJson = employee.security && typeof employee.security === "object"
    ? employee.security as Record<string, unknown>
    : {};

  return {
    id: normalizeText(employee.legacy_admin_doc_id || employee.id),
    employeeId: normalizeText(employee.id),
    profileId: normalizeText(employee.profile_id),
    name: normalizeText(employee.name),
    email: normalizeEmail(employee.email),
    loginId: normalizeText(employee.login_id) || undefined,
    jobTitle: normalizeText(employee.job_title) || "Staff",
    orgType: normalizeUpper(employee.org_type) || undefined,
    status: mapSupabaseEmploymentStatusToAdminStatus(String(employee.employment_status || "")),
    memo: normalizeText(employee.memo) || undefined,
    role: mapSupabaseRoleToLegacyRole(normalizeText(primaryRole?.role?.code)),
    branchId: legacyBranchId || undefined,
    branchCode: branchCode || undefined,
    permissions: Array.isArray(securityJson.permissions) ? securityJson.permissions as string[] : [],
    security: securityJson,
  };
};

const deleteAuthUser = async (authUserId?: string) => {
  const normalizedAuthUserId = normalizeText(authUserId);
  if (!normalizedAuthUserId) return;

  try {
    await requestSupabase(`/auth/v1/admin/users/${normalizedAuthUserId}`, {
      method: "DELETE",
    });
  } catch (error) {
    if (error instanceof EdgeHttpError && error.status === 404) {
      return;
    }
    throw error;
  }
};

const handleUpsert = async (req: Request) => {
  const auth = await authenticateAdminRequest(req);
  const body = await req.json();
  const input = body?.admin as Partial<AdminPayload> | undefined;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new EdgeHttpError(400, "admin payload가 필요합니다.");
  }

  const existingAdmin = normalizeText(input.id) ? await loadAdminFromSupabase(normalizeText(input.id)) : null;
  const nextAdmin = buildMergedAdmin({ input, existingAdmin });
  assertCanManageAdminAccount({
    actor: auth.adminContext,
    targetAdmin: nextAdmin,
  });

  const branchContext = await resolveBranchContext(nextAdmin);
  const roleCode = mapLegacyRoleToSupabaseRole(nextAdmin, branchContext.branchType);
  const orgType = resolveOrgType(nextAdmin, branchContext.branchType);
  const authUsers = await fetchAllAuthUsers();
  const existingAuthUser = findAuthUser({
    users: authUsers,
    adminId: normalizeText(nextAdmin.id),
    resolvedEmail: normalizeEmail(nextAdmin.email),
    profileId: normalizeText(existingAdmin?.profileId),
  });

  const resolvedEmail =
    normalizeEmail(nextAdmin.email)
    || normalizeEmail(existingAuthUser?.email)
    || buildSyntheticEmail(nextAdmin);
  const syntheticEmail =
    !normalizeEmail(nextAdmin.email)
    && !normalizeEmail(existingAuthUser?.email);

  if (!existingAuthUser?.id && !normalizeText(nextAdmin.password)) {
    throw new EdgeHttpError(400, "신규 직원 계정은 비밀번호가 필요합니다.");
  }

  const authUser = await upsertAuthUser({
    user: existingAuthUser,
    admin: nextAdmin,
    resolvedEmail,
    syntheticEmail,
    roleCode,
    orgType,
  });

  const authUserId = normalizeText(authUser.id);
  if (!authUserId) {
    throw new EdgeHttpError(500, "Supabase Auth 계정 동기화에 실패했습니다.");
  }

  await upsertProfile({
    authUserId,
    admin: nextAdmin,
    resolvedEmail,
    syntheticEmail,
  });

  const branchRow = await upsertBranch({
    branchCode: branchContext.branchCode,
    branchPayload: branchContext.branchPayload,
    locationId: branchContext.locationId,
  });

  const employeeRow = await upsertEmployee({
    authUserId,
    admin: nextAdmin,
    resolvedEmail,
    branchCode: branchContext.branchCode || DEFAULT_HQ_BRANCH_CODE,
    branchType: branchContext.branchType,
    syntheticEmail,
  });

  const employeeId = normalizeText(employeeRow?.id);
  if (!employeeId) {
    throw new EdgeHttpError(500, "직원 테이블 동기화에 실패했습니다.");
  }

  await upsertEmployeeRole(employeeId, roleCode);
  await upsertEmployeeBranchAssignment(employeeId, normalizeText(branchRow?.id) || undefined);

  return jsonResponse({
    success: true,
    data: {
      id: normalizeText(nextAdmin.id),
      email: resolvedEmail,
      role: nextAdmin.role,
      status: nextAdmin.status,
      branchId: nextAdmin.branchId || "",
      branchCode: branchContext.branchCode || "",
      profileId: authUserId,
      employeeId,
      syntheticEmail,
    },
  });
};

const handleDelete = async (req: Request) => {
  const auth = await authenticateAdminRequest(req);
  const body = await req.json();
  const adminId = normalizeText(body?.adminId);
  if (!adminId) {
    throw new EdgeHttpError(400, "삭제할 직원 ID가 없습니다.");
  }

  const targetAdmin = await loadAdminFromSupabase(adminId);
  if (!targetAdmin) {
    throw new EdgeHttpError(404, "삭제할 직원 문서를 찾지 못했습니다.");
  }

  assertCanManageAdminAccount({
    actor: auth.adminContext,
    targetAdmin,
    isDelete: true,
  });

  const authUsers = await fetchAllAuthUsers();
  const authUser = findAuthUser({
    users: authUsers,
    adminId: normalizeText(targetAdmin.id),
    resolvedEmail: normalizeEmail(targetAdmin.email),
    profileId: normalizeText(targetAdmin.profileId),
  });

  await deleteAuthUser(normalizeText(authUser?.id) || normalizeText(targetAdmin.profileId));

  if (normalizeText(targetAdmin.employeeId)) {
    await deleteRows("employees", `id=eq.${encodeURIComponent(normalizeText(targetAdmin.employeeId))}`);
  }

  if (!authUser?.id && normalizeText(targetAdmin.profileId)) {
    await deleteRows("profiles", `id=eq.${encodeURIComponent(normalizeText(targetAdmin.profileId))}`);
  }

  return jsonResponse({
    success: true,
    data: {
      deletedId: normalizeText(targetAdmin.id),
      deletedAuthUserId: normalizeText(authUser?.id),
    },
  });
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    if (req.method === "POST") {
      return await handleUpsert(req);
    }
    if (req.method === "DELETE") {
      return await handleDelete(req);
    }
    throw new EdgeHttpError(405, "POST 또는 DELETE 요청만 허용됩니다.");
  } catch (error) {
    if (error instanceof EdgeHttpError) {
      console.warn("[admin-account-sync]", error.logMessage);
      return jsonResponse({ message: error.message, error: error.message }, error.status);
    }

    console.error("[admin-account-sync] unexpected error:", error);
    return jsonResponse({
      message: "관리자 계정 동기화 요청에 실패했습니다.",
      error: "관리자 계정 동기화 요청에 실패했습니다.",
    }, 500);
  }
});
