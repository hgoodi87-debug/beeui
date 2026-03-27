export class EdgeHttpError extends Error {
  status: number;
  logMessage: string;

  constructor(status: number, message: string, logMessage?: string) {
    super(message);
    this.name = "EdgeHttpError";
    this.status = status;
    this.logMessage = logMessage || message;
  }
}

const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  || Deno.env.get("SUPABASE_SECRET_KEY")
  || "";
const SUPABASE_AUTH_VERIFY_KEY =
  Deno.env.get("SB_PUBLISHABLE_KEY")
  || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")
  || Deno.env.get("SUPABASE_ANON_KEY")
  || "";
const SUPABASE_DATA_SCHEMA = "public";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-access-token, x-admin-auth-provider",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
};

export interface AuthenticatedAdminContext {
  uid: string;
  provider: "supabase";
  user: {
    id: string;
    email?: string;
  };
  adminContext: {
    uid: string;
    profileId: string;
    employeeId: string;
    email: string;
    name: string;
    jobTitle: string;
    role: string;
    loginId: string;
    branchId: string;
    branchCode: string;
  };
}

export const normalizeText = (value: unknown) => String(value || "").trim();
export const normalizeLower = (value: unknown) => normalizeText(value).toLowerCase();
export const normalizeUpper = (value: unknown) => normalizeText(value).toUpperCase();

export const sanitizeSegment = (value: unknown) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const isUuid = (value: unknown) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    normalizeText(value),
  );

const assertConfigured = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new EdgeHttpError(
      503,
      "Supabase Edge Function 설정이 아직 준비되지 않았습니다.",
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return {
    supabaseUrl: SUPABASE_URL,
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
  };
};

const assertAuthVerifyConfigured = () => {
  if (!SUPABASE_URL || !SUPABASE_AUTH_VERIFY_KEY) {
    throw new EdgeHttpError(
      503,
      "Supabase Edge Function 인증 검증 키가 준비되지 않았습니다.",
      "Missing SUPABASE_URL or auth verify key.",
    );
  }

  return {
    supabaseUrl: SUPABASE_URL,
    authVerifyKey: SUPABASE_AUTH_VERIFY_KEY,
  };
};

const parseResponse = async (response: Response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

export const jsonResponse = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      ...headers,
    },
  });

export const requestSupabase = async <T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> => {
  const { supabaseUrl, serviceRoleKey } = assertConfigured();
  const isRestRequest = path.startsWith("/rest/v1/");
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${accessToken || serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(isRestRequest
        ? {
          "Accept-Profile": SUPABASE_DATA_SCHEMA,
          "Content-Profile": SUPABASE_DATA_SCHEMA,
        }
        : {}),
      ...(options.headers || {}),
    },
  });

  const body = await parseResponse(response);
  if (!response.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message?: string }).message)
        : typeof body === "object" && body && "msg" in body
          ? String((body as { msg?: string }).msg)
          : typeof body === "string" && body
            ? body
            : `Supabase request failed (${response.status})`;
    throw new EdgeHttpError(response.status, message, `${path} -> ${message}`);
  }

  return body as T;
};

export const requestSupabaseTable = async <T>(
  table: string,
  query: string,
  accessToken?: string,
) =>
  await requestSupabase<T[]>(`/rest/v1/${table}?${query}`, {}, accessToken);

export const requestEmployeeAssignmentsWithBranch = async (employeeId: string) => {
  const assignments = await requestSupabaseTable<Array<{
    is_primary?: boolean;
    branch_id?: string | null;
  }>[number]>(
    "employee_branch_assignments",
    `select=is_primary,branch_id&employee_id=eq.${encodeURIComponent(employeeId)}&order=is_primary.desc&limit=10`,
  );

  const branchIds = Array.from(
    new Set(
      assignments
        .map((entry) => normalizeText(entry?.branch_id))
        .filter(Boolean),
    ),
  );

  const branches = branchIds.length > 0
    ? await requestSupabaseTable<Array<{
      id?: string;
      branch_code?: string;
      name?: string;
    }>[number]>(
      "branches",
      `select=id,branch_code,name&id=in.(${branchIds.map((id) => encodeURIComponent(id)).join(",")})&limit=${branchIds.length}`,
    )
    : [];

  const branchById = new Map(
    branches.map((branch) => [
      normalizeText(branch.id),
      {
        id: normalizeText(branch.id),
        branch_code: normalizeText(branch.branch_code) || undefined,
        name: normalizeText(branch.name) || undefined,
      },
    ]),
  );

  return assignments.map((entry) => {
    const branchId = normalizeText(entry?.branch_id);
    return {
      is_primary: Boolean(entry?.is_primary),
      branch_id: branchId || undefined,
      branch: branchById.get(branchId) || null,
    };
  });
};

const requestSupabaseAuthUser = async (accessToken: string) => {
  const { supabaseUrl, authVerifyKey } = assertAuthVerifyConfigured();
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: authVerifyKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const body = await parseResponse(response);
  if (!response.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message?: string }).message)
        : typeof body === "object" && body && "msg" in body
          ? String((body as { msg?: string }).msg)
          : typeof body === "string" && body
            ? body
            : `Supabase auth request failed (${response.status})`;
    throw new EdgeHttpError(response.status, message, `/auth/v1/user -> ${message}`);
  }

  return body as { id: string; email?: string };
};

const parseBearerToken = (req: Request) => {
  const authorization = normalizeText(req.headers.get("authorization"));
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }
  return authorization.slice(7).trim();
};

const extractAccessToken = (req: Request) =>
  normalizeText(req.headers.get("x-supabase-access-token"))
  || parseBearerToken(req);

export const mapSupabaseRoleToLegacyRole = (roleCode?: string) => {
  switch (normalizeLower(roleCode)) {
    case "super_admin":
      return "super";
    case "hq_admin":
      return "hq";
    case "hub_manager":
      return "branch";
    case "partner_manager":
      return "partner";
    case "finance_staff":
      return "finance";
    case "cs_staff":
      return "cs";
    case "driver":
      return "driver";
    case "marketing":
    case "content_manager":
      return "hq";
    case "ops_staff":
    default:
      return "staff";
  }
};

export const resolveLegacyLocationId = async (branchCode?: string) => {
  const normalizedBranchCode = normalizeText(branchCode);
  if (!normalizedBranchCode) return "";

  const [byBranchCode, byShortCode] = await Promise.all([
    requestSupabaseTable<{ id: string }>(
      "locations",
      `select=id&branch_code=eq.${encodeURIComponent(normalizedBranchCode)}&is_active=eq.true&limit=1`,
    ),
    requestSupabaseTable<{ id: string }>(
      "locations",
      `select=id&short_code=eq.${encodeURIComponent(normalizedBranchCode)}&is_active=eq.true&limit=1`,
    ),
  ]);

  return normalizeText(byBranchCode[0]?.id || byShortCode[0]?.id);
};

export const authenticateAdminRequest = async (
  req: Request,
): Promise<AuthenticatedAdminContext> => {
  const accessToken = extractAccessToken(req);
  if (!accessToken) {
    throw new EdgeHttpError(401, "관리자 인증 토큰이 없습니다.", "Missing access token.");
  }

  const user = await requestSupabaseAuthUser(accessToken);

  const employees = await requestSupabaseTable<{
    id: string;
    name?: string;
    email?: string;
    job_title?: string;
    employment_status?: string;
    employee_code?: string;
    login_id?: string;
    profile_id?: string;
  }>(
    "employees",
    `select=id,name,email,job_title,employment_status,employee_code,login_id,profile_id&profile_id=eq.${encodeURIComponent(user.id)}&limit=1`,
  );

  const employee = employees[0];
  if (!employee) {
    throw new EdgeHttpError(403, "직원 프로필이 아직 준비되지 않았습니다.", "Employee row not found.");
  }

  if (normalizeLower(employee.employment_status) !== "active") {
    throw new EdgeHttpError(403, "비활성화된 관리자 계정입니다.", "Inactive employee attempted admin access.");
  }

  const [employeeRoles, assignments] = await Promise.all([
    requestSupabaseTable<Array<{
      is_primary?: boolean;
      role?: { code?: string; name?: string } | null;
    }>[number]>(
      "employee_roles",
      `select=is_primary,role:roles(code,name)&employee_id=eq.${encodeURIComponent(employee.id)}&order=is_primary.desc&limit=10`,
    ),
    requestEmployeeAssignmentsWithBranch(employee.id),
  ]);

  const primaryRole = employeeRoles.find((entry) => entry?.is_primary) || employeeRoles[0] || null;
  const primaryBranch = assignments.find((entry) => entry?.is_primary) || assignments[0] || null;
  const branchCode = normalizeText(primaryBranch?.branch?.branch_code);
  const legacyBranchId = await resolveLegacyLocationId(branchCode);

  return {
    uid: user.id,
    provider: "supabase",
    user,
    adminContext: {
      uid: user.id,
      profileId: user.id,
      employeeId: normalizeText(employee.id),
      email: normalizeText(employee.email || user.email),
      name: normalizeText(employee.name || user.email || user.id),
      jobTitle: normalizeText(employee.job_title || "Staff"),
      role: mapSupabaseRoleToLegacyRole(primaryRole?.role?.code),
      loginId:
        normalizeText(employee.login_id)
        || normalizeText(employee.employee_code)
        || normalizeText(employee.email || user.email || user.id),
      branchId: legacyBranchId,
      branchCode,
    },
  };
};
