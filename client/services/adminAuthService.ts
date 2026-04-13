import { getSupabaseConfig } from './supabaseRuntime';

export type AdminAuthProvider = 'firebase' | 'supabase';

export interface AdminAuthResult {
  name: string;
  jobTitle: string;
  role: string;
  email?: string;
  branchId?: string;
  provider: AdminAuthProvider;
  employeeId?: string;
  profileId?: string;
  branchCode?: string;
}

interface SupabaseAdminSession {
  accessToken: string;
  refreshToken?: string;
  userId: string;
  email: string;
  provider: 'supabase';
  savedAt: number;
  expiresAt?: number;
}

interface SupabaseAuthUser {
  id?: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

interface SupabaseAuthTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: SupabaseAuthUser;
  session?: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: SupabaseAuthUser;
  };
}

const config = getSupabaseConfig();
const supabaseUrl = config.url;
const supabasePublishableKey = config.anonKey;
const configuredProvider = import.meta.env.VITE_ADMIN_AUTH_PROVIDER === 'supabase' ? 'supabase' : 'firebase';
const SUPABASE_ADMIN_SESSION_KEY = 'beeliber_supabase_admin_session';
const ADMIN_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일 (롤링)
const ACCESS_TOKEN_FALLBACK_TTL_MS = 55 * 60 * 1000;
const ACCESS_TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const SUPABASE_DATA_SCHEMA = 'public';
const SUPABASE_PUBLIC_ADMIN_DIRECTORY_SELECT = 'select=id,name,email,login_id,employee_code,employment_status';

const ADMIN_IDENTIFIER_EMAIL_FALLBACKS: Record<string, string> = {
  'admin': 'ceo@bee-liber.com',
  'ags': 'ags@bee-liber.com',
  'bpy': 'bpy@bee-liber.com',
  'bsn': 'bsn@bee-liber.com',
  'cmr': 'cmr@bee-liber.com',
  'cwn': 'cwn@bee-liber.com',
  'dbcjsaud': 'dbcjsaud@gmail.com',
  'ddp': 'ddp@bee-liber.com',
  'dgu': 'dgu@bee-liber.com',
  'gal': 'gal@bee-liber.com',
  'ghe': 'ghe@bee-liber.com',
  'gju': 'gju@bee-liber.com',
  'gmp': 'gmp@bee-liber.com',
  'hbo': 'hbo@bee-liber.com',
  'hda': 'hda@bee-liber.com',
  'hde': 'hde@bee-liber.com',
  'in1t': 'in1t@bee-liber.com',
  'in2t': 'in2t@bee-liber.com',
  'isd': 'isd@bee-liber.com',
  'jdm': 'jdm@bee-liber.com',
  'jej': 'jej@bee-liber.com',
  'jno': 'jno@bee-liber.com',
  'md2': 'md2@bee-liber.com',
  'mdd': 'mdd@bee-liber.com',
  'mdm': 'mdm@bee-liber.com',
  'mec': 'mec@bee-liber.com',
  'mgh': 'mgh@bee-liber.com',
  'mgn': 'mgn@bee-liber.com',
  'miw': 'miw@bee-liber.com',
  'mmp': 'mmp@bee-liber.com',
  'msis': 'msis@bee-liber.com',
  'msus': 'msus@bee-liber.com',
  'mys': 'mys@bee-liber.com',
  'ndm': 'ndm@bee-liber.com',
  'npo': 'npo@bee-liber.com',
  'ptk': 'ptk@bee-liber.com',
  'rlaxowl98': 'rlaxowl98@gmail.com',
  'sdo': 'sdo@bee-liber.com',
  'srk': 'srk@bee-liber.com',
  'swn': 'swn@bee-liber.com',
  'uso': 'uso@bee-liber.com',
  'uss': 'uss@bee-liber.com',
  'ydo': 'ydo@bee-liber.com',
  'yoo': 'yoo0912345@gmail.com',
  '강남 신사점': 'msis@bee-liber.com',
  '강남역점': 'mgn@bee-liber.com',
  '광안리지점': 'gal@bee-liber.com',
  '광장시장점': 'mgh@bee-liber.com',
  '광주지점': 'gju@bee-liber.com',
  '김포공항': 'gmp@bee-liber.com',
  '김해공항지점': 'ghe@bee-liber.com',
  '남대문지점': 'ndm@bee-liber.com',
  '남포지점': 'npo@bee-liber.com',
  '대구지점': 'dgu@bee-liber.com',
  '동대문': 'mdd@bee-liber.com',
  '동대문ddp점': 'ddp@bee-liber.com',
  '동대문지점': 'mdm@bee-liber.com',
  '마포지점': 'mmp@bee-liber.com',
  '머니박스제일환전센터': 'mec@bee-liber.com',
  '명동2호점': 'md2@bee-liber.com',
  '바오': 'hbo@bee-liber.com',
  '부산역지점': 'bsn@bee-liber.com',
  '부평지점': 'bpy@bee-liber.com',
  '서울역지점': 'srk@bee-liber.com',
  '성수역점': 'msus@bee-liber.com',
  '송도지점': 'sdo@bee-liber.com',
  '수원지점': 'swn@bee-liber.com',
  '안국역지점': 'ags@bee-liber.com',
  '여의도지점': 'ydo@bee-liber.com',
  '용산': 'mys@bee-liber.com',
  '운서역지점': 'uso@bee-liber.com',
  '울산삼산지점': 'uss@bee-liber.com',
  '이태원지점': 'miw@bee-liber.com',
  '인사동지점': 'isd@bee-liber.com',
  '인천공항 t1': 'in1t@bee-liber.com',
  '인천공항 t2': 'in2t@bee-liber.com',
  '제주동문시장점': 'jdm@bee-liber.com',
  '제주지점': 'jej@bee-liber.com',
  '종로지점': 'jno@bee-liber.com',
  '진호': 'rlaxowl98@gmail.com',
  '창원지점': 'cwn@bee-liber.com',
  '천명': 'dbcjsaud@gmail.com',
  '충무로지점': 'cmr@bee-liber.com',
  '평택지점': 'ptk@bee-liber.com',
  '해운대지점': 'hde@bee-liber.com',
  '현정': 'yoo0912345@gmail.com',
  '홍대지점': 'hda@bee-liber.com',
};

type PublicAdminDirectoryRow = {
  id: string;
  name?: string;
  email?: string;
  login_id?: string;
  employee_code?: string;
  employment_status?: string;
};

type RankedAdminDirectoryCandidate = {
  row: PublicAdminDirectoryRow;
  rank: number;
};

type EmployeeRoleLookupRow = {
  is_primary: boolean;
  role_id?: string;
  role?: {
    code?: string;
    name?: string;
  } | null;
};

type EmployeeBranchAssignmentLookupRow = {
  is_primary: boolean;
  branch_id?: string;
  branch?: {
    id: string;
    branch_code?: string;
    name?: string;
  } | null;
};

type RoleRow = {
  id: string;
  code?: string;
  name?: string;
};

type BranchRow = {
  id: string;
  branch_code?: string;
  name?: string;
};

const clearStoredSupabaseAdminSession = () => {
  localStorage.removeItem(SUPABASE_ADMIN_SESSION_KEY);
  sessionStorage.removeItem(SUPABASE_ADMIN_SESSION_KEY);
};

const getFirebaseAppModule = () => import('../firebaseApp');

const persistSupabaseAdminSession = (session: SupabaseAdminSession) => {
  const serialized = JSON.stringify(session);
  localStorage.setItem(SUPABASE_ADMIN_SESSION_KEY, serialized);
  sessionStorage.setItem(SUPABASE_ADMIN_SESSION_KEY, serialized);
};

const resolveSessionExpiry = (savedAt: number, expiresAt?: number) => {
  if (typeof expiresAt === 'number' && Number.isFinite(expiresAt) && expiresAt > 0) {
    return expiresAt;
  }

  return savedAt + ACCESS_TOKEN_FALLBACK_TTL_MS;
};

const isSessionPastKstWindow = (savedAt: number) => {
  if (!savedAt) return true;
  return Date.now() - savedAt > ADMIN_SESSION_TTL_MS;
};

const shouldRefreshSession = (session: SupabaseAdminSession) => {
  if (!session.refreshToken || !session.expiresAt) return false;
  return session.expiresAt - Date.now() <= ACCESS_TOKEN_REFRESH_BUFFER_MS;
};

const normalizeRole = (role?: string) => {
  const candidate = (role || '').trim().toLowerCase();
  if (!candidate) return 'staff';
  return candidate;
};

const normalizeAdminIdentifier = (value: unknown) => String(value || '').trim().normalize('NFC');
const normalizeAdminIdentifierLower = (value: unknown) => normalizeAdminIdentifier(value).toLowerCase();
const isSyntheticAdminEmail = (value?: string) => normalizeAdminIdentifierLower(value).endsWith('@staff.bee-liber.invalid');

const preferAdminEmail = (...emails: Array<string | undefined>) => {
  const candidates = emails
    .map((email) => normalizeAdminIdentifier(email))
    .filter(Boolean);

  if (!candidates.length) return '';

  candidates.sort((left, right) => {
    const syntheticDiff = Number(isSyntheticAdminEmail(left)) - Number(isSyntheticAdminEmail(right));
    if (syntheticDiff !== 0) return syntheticDiff;
    return 0;
  });

  return candidates[0] || '';
};

const buildInFilter = (values: Array<string | undefined>) => {
  const normalizedValues = Array.from(new Set(
    values
      .map((value) => String(value || '').trim())
      .filter(Boolean)
  ));

  if (!normalizedValues.length) {
    return '';
  }

  return encodeURIComponent(`in.(${normalizedValues.join(',')})`);
};

const isLocalPreviewHost = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

const isFirebaseRefererBlockedError = (error: unknown) => {
  const details = [
    error instanceof Error ? error.message : '',
    typeof (error as { code?: unknown })?.code === 'string' ? String((error as { code?: string }).code) : '',
    error && typeof error === 'object' && 'cause' in error && (error as { cause?: unknown }).cause instanceof Error
      ? (error as { cause: Error }).cause.message
      : '',
    error && typeof error === 'object' && 'cause' in error && typeof ((error as { cause?: { code?: unknown } }).cause?.code) === 'string'
      ? String((error as { cause?: { code?: string } }).cause?.code)
      : '',
  ].join(' ').toLowerCase();

  return details.includes('requests-from-referer') || details.includes('unauthorized-domain') || details.includes('referer');
};

const mapSupabaseRoleToLegacyRole = (roleCode?: string) => {
  const normalized = (roleCode || '').trim().toLowerCase();

  switch (normalized) {
    case 'super_admin':
      return 'super';
    case 'hq_admin':
      return 'hq';
    case 'hub_manager':
      return 'branch';
    case 'partner_manager':
      return 'partner';
    case 'finance_staff':
      return 'finance';
    case 'cs_staff':
      return 'cs';
    case 'driver':
      return 'driver';
    case 'ops_staff':
      return 'staff';
    case 'marketing':
      return 'hq';
    case 'content_manager':
      return 'hq';
    default:
      return normalizeRole(normalized);
  }
};

const resolveLegacyLocationId = async (
  accessToken: string,
  branchCode?: string,
  fallbackBranchId?: string,
  preferredLocationId?: string,
  branchUuid?: string  // branches.id — branchCode가 없을 때 locations.branch_id로 조회
) => {
  const normalizedPreferredLocationId = String(preferredLocationId || '').trim();
  if (normalizedPreferredLocationId) {
    return normalizedPreferredLocationId;
  }

  const normalizedBranchCode = String(branchCode || '').trim();

  try {
    const queries: Promise<Array<{ id: string }>>[] = [];

    if (normalizedBranchCode) {
      queries.push(
        supabaseRequest<Array<{ id: string }>>(
          `/rest/v1/locations?select=id&branch_code=eq.${encodeURIComponent(normalizedBranchCode)}&is_active=eq.true&limit=1`,
          {},
          accessToken
        ),
        supabaseRequest<Array<{ id: string }>>(
          `/rest/v1/locations?select=id&short_code=eq.${encodeURIComponent(normalizedBranchCode)}&is_active=eq.true&limit=1`,
          {},
          accessToken
        )
      );
    }

    // branchUuid(branches.id)로 locations.branch_id 조회
    if (branchUuid) {
      queries.push(
        supabaseRequest<Array<{ id: string }>>(
          `/rest/v1/locations?select=id&branch_id=eq.${encodeURIComponent(branchUuid)}&is_active=eq.true&limit=1`,
          {},
          accessToken
        )
      );
    }

    if (queries.length === 0) return String(fallbackBranchId || '').trim();

    const results = await Promise.all(queries);
    const found = results.flatMap(r => r).find(r => r?.id);
    return String(found?.id || fallbackBranchId || branchUuid || '').trim();
  } catch (error) {
    console.warn('[AdminAuth] legacy location id lookup failed:', error);
    return String(fallbackBranchId || branchUuid || '').trim();
  }
};

export const getAdminAuthProvider = (): AdminAuthProvider => {
  if (!supabaseUrl || !supabasePublishableKey) {
    console.warn('[AdminAuth] Supabase 관리자 인증 설정이 누락되어 있습니다.');
  }
  return 'supabase';
};

export const isSupabaseAdminAuthEnabled = () => getAdminAuthProvider() === 'supabase';

export const warmAdminAuth = async () => {
  return;
};

const readSupabaseAdminSession = (): SupabaseAdminSession | null => {
  if (getAdminAuthProvider() !== 'supabase') return null;

  const raw =
    localStorage.getItem(SUPABASE_ADMIN_SESSION_KEY)
    || sessionStorage.getItem(SUPABASE_ADMIN_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<SupabaseAdminSession>;
    const savedAt = Number(parsed.savedAt || 0);
    const isExpired = isSessionPastKstWindow(savedAt);

    if (!parsed.accessToken || !parsed.userId || !parsed.email || isExpired) {
      clearStoredSupabaseAdminSession();
      return null;
    }

    const session: SupabaseAdminSession = {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      userId: parsed.userId,
      email: parsed.email,
      provider: 'supabase',
      savedAt,
      expiresAt: resolveSessionExpiry(savedAt, Number(parsed.expiresAt || 0)),
    };

    // 새 탭이나 웹뷰에서도 같은 24시간 세션을 붙잡도록 두 저장소를 동기화합니다.
    persistSupabaseAdminSession(session);

    return session;
  } catch (error) {
    console.warn('[AdminAuth] Supabase 관리자 세션 파싱 실패:', error);
    clearStoredSupabaseAdminSession();
    return null;
  }
};

export const hasActiveAdminSession = () => {
  if (getAdminAuthProvider() !== 'supabase') {
    return true;
  }
  return Boolean(readSupabaseAdminSession());
};

export const getActiveAdminAccessToken = () => {
  if (getAdminAuthProvider() !== 'supabase') {
    return '';
  }
  return readSupabaseAdminSession()?.accessToken || '';
};

export const getActiveAdminUserId = () => {
  return readSupabaseAdminSession()?.userId || '';
};

export const ensureActiveAdminSession = async () => {
  if (getAdminAuthProvider() !== 'supabase') {
    return null;
  }

  const currentSession = readSupabaseAdminSession();
  if (!currentSession) {
    return null;
  }

  if (!shouldRefreshSession(currentSession)) {
    return currentSession;
  }

  try {
    const authResponse = await supabaseRequest<{
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      user?: {
        id?: string;
        email?: string;
      };
    }>(
      '/auth/v1/token?grant_type=refresh_token',
      {
        method: 'POST',
        body: JSON.stringify({
          refresh_token: currentSession.refreshToken,
        }),
      }
    );

    const refreshedSession: SupabaseAdminSession = {
      accessToken: authResponse.access_token,
      refreshToken: authResponse.refresh_token || currentSession.refreshToken,
      userId: authResponse.user?.id || currentSession.userId,
      email: authResponse.user?.email || currentSession.email,
      provider: 'supabase',
      savedAt: Date.now(), // 갱신 성공 시 TTL 윈도우 초기화 (롤링 세션)
      expiresAt: resolveSessionExpiry(
        Date.now(),
        authResponse.expires_in ? Date.now() + authResponse.expires_in * 1000 : undefined
      ),
    };

    persistSupabaseAdminSession(refreshedSession);
    return refreshedSession;
  } catch (error) {
    console.warn('[AdminAuth] Supabase 관리자 세션 갱신 실패:', error);

    if (isSessionPastKstWindow(currentSession.savedAt)) {
      clearStoredSupabaseAdminSession();
      return null;
    }

    return currentSession;
  }
};

export const getActiveAdminRequestHeaders = async (): Promise<Record<string, string>> => {
  const { anonKey } = getSupabaseConfig();
  const headers: Record<string, string> = {
    'X-Admin-Auth-Provider': getAdminAuthProvider(),
    apikey: anonKey,
    // Authorization에 anon key → Supabase 게이트웨이 통과
    // (ES256 user token을 Authorization에 보내면 HS256 검증 실패로 401)
    Authorization: `Bearer ${anonKey}`,
  };

  const supabaseAccessToken = (await ensureActiveAdminSession())?.accessToken || getActiveAdminAccessToken();
  if (supabaseAccessToken) {
    // user token은 커스텀 헤더로 전달 → Edge Function이 내부에서 검증
    headers['X-Supabase-Access-Token'] = supabaseAccessToken;
  }

  return headers;
};

export const clearAdminAuthSession = async () => {
  if (getAdminAuthProvider() !== 'supabase') return;

  const session = readSupabaseAdminSession();
  clearStoredSupabaseAdminSession();

  if (!session?.accessToken) return;

  try {
    await fetch(`${supabaseUrl}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        apikey: supabasePublishableKey,
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.warn('[AdminAuth] Supabase 관리자 로그아웃 정리 실패:', error);
  }
};

const parseResponse = async (response: Response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

const supabaseRequest = async <T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<T> => {
  const isRestRequest = path.startsWith('/rest/v1/');
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: supabasePublishableKey,
      Authorization: `Bearer ${accessToken || supabasePublishableKey}`,
      'Content-Type': 'application/json',
      ...(isRestRequest ? {
        'Accept-Profile': SUPABASE_DATA_SCHEMA,
        'Content-Profile': SUPABASE_DATA_SCHEMA,
      } : {}),
      ...(options.headers || {}),
    },
  });

  const body = await parseResponse(response);
  if (!response.ok) {
    const error = new Error(
      typeof body === 'object' && body && 'msg' in body
        ? String((body as { msg?: string }).msg)
        : typeof body === 'object' && body && 'message' in body
          ? String((body as { message?: string }).message)
          : `Supabase request failed (${response.status})`
    ) as Error & { code?: string; details?: unknown; status?: number };

    error.code =
      typeof body === 'object' && body && 'code' in body
        ? String((body as { code?: string }).code)
        : `supabase/${response.status}`;
    error.details = body;
    error.status = response.status;
    throw error;
  }

  return body as T;
};

const normalizeSupabaseAuthPayload = async (authResponse: SupabaseAuthTokenResponse) => {
  const accessToken = String(
    authResponse.access_token
    || authResponse.session?.access_token
    || ''
  ).trim();
  const refreshToken = String(
    authResponse.refresh_token
    || authResponse.session?.refresh_token
    || ''
  ).trim();
  const expiresIn = Number(
    authResponse.expires_in
    || authResponse.session?.expires_in
    || 0
  ) || undefined;

  let user = authResponse.user || authResponse.session?.user || null;
  if (!user?.id && accessToken) {
    try {
      user = await supabaseRequest<SupabaseAuthUser>('/auth/v1/user', {}, accessToken);
    } catch (error) {
      console.warn('[AdminAuth] Supabase /auth/v1/user fallback failed:', error);
    }
  }

  return {
    accessToken,
    refreshToken: refreshToken || undefined,
    expiresIn,
    user,
  };
};

const fetchEmployeeRoles = async (accessToken: string, employeeId: string): Promise<EmployeeRoleLookupRow[]> => {
  const normalizedEmployeeId = String(employeeId || '').trim();
  if (!normalizedEmployeeId) {
    return [];
  }

  try {
    const embeddedRoles = await supabaseRequest<EmployeeRoleLookupRow[]>(
      `/rest/v1/employee_roles?select=is_primary,role:roles(code,name)&employee_id=eq.${encodeURIComponent(normalizedEmployeeId)}&order=is_primary.desc&limit=10`,
      {},
      accessToken
    );

    if (embeddedRoles.some((entry) => entry.role?.code || entry.role?.name)) {
      return embeddedRoles;
    }
  } catch (error) {
    console.warn('[AdminAuth] roles JOIN 조회 실패, role_id 폴백 사용:', error);
  }

  try {
    const roleLinks = await supabaseRequest<EmployeeRoleLookupRow[]>(
      `/rest/v1/employee_roles?select=is_primary,role_id&employee_id=eq.${encodeURIComponent(normalizedEmployeeId)}&order=is_primary.desc&limit=10`,
      {},
      accessToken
    );

    const roleFilter = buildInFilter(roleLinks.map((entry) => entry.role_id));
    if (!roleFilter) {
      return roleLinks.map((entry) => ({
        is_primary: entry.is_primary,
        role: null,
      }));
    }

    const roles = await supabaseRequest<RoleRow[]>(
      `/rest/v1/roles?select=id,code,name&id=${roleFilter}&limit=10`,
      {},
      accessToken
    );

    const roleMap = new Map(roles.map((role) => [role.id, role]));

    return roleLinks.map((entry) => ({
      is_primary: entry.is_primary,
      role: entry.role_id ? roleMap.get(entry.role_id) || null : null,
    }));
  } catch (error) {
    console.warn('[AdminAuth] role_id 폴백 조회 실패:', error);
    return [];
  }
};

const fetchEmployeeBranchAssignments = async (
  accessToken: string,
  employeeId: string
): Promise<EmployeeBranchAssignmentLookupRow[]> => {
  const normalizedEmployeeId = String(employeeId || '').trim();
  if (!normalizedEmployeeId) {
    return [];
  }

  try {
    const embeddedAssignments = await supabaseRequest<EmployeeBranchAssignmentLookupRow[]>(
      `/rest/v1/employee_branch_assignments?select=is_primary,branch:branches(id,branch_code,name)&employee_id=eq.${encodeURIComponent(normalizedEmployeeId)}&order=is_primary.desc&limit=10`,
      {},
      accessToken
    );

    if (embeddedAssignments.some((entry) => entry.branch?.id)) {
      return embeddedAssignments;
    }
  } catch (error) {
    console.warn('[AdminAuth] branches JOIN 조회 실패, branch_id 폴백 사용:', error);
  }

  try {
    const branchLinks = await supabaseRequest<EmployeeBranchAssignmentLookupRow[]>(
      `/rest/v1/employee_branch_assignments?select=is_primary,branch_id&employee_id=eq.${encodeURIComponent(normalizedEmployeeId)}&order=is_primary.desc&limit=10`,
      {},
      accessToken
    );

    const branchFilter = buildInFilter(branchLinks.map((entry) => entry.branch_id));
    if (!branchFilter) {
      return branchLinks.map((entry) => ({
        is_primary: entry.is_primary,
        branch: null,
      }));
    }

    const branches = await supabaseRequest<BranchRow[]>(
      `/rest/v1/branches?select=id,branch_code,name&id=${branchFilter}&limit=10`,
      {},
      accessToken
    );

    const branchMap = new Map(branches.map((branch) => [branch.id, branch]));

    return branchLinks.map((entry) => ({
      is_primary: entry.is_primary,
      branch: entry.branch_id ? branchMap.get(entry.branch_id) || null : null,
    }));
  } catch (error) {
    console.warn('[AdminAuth] branch_id 폴백 조회 실패:', error);
    return [];
  }
};

const resolveAdminEmailFromPublicDirectory = async (identifier: string) => {
  const normalizedIdentifier = normalizeAdminIdentifier(identifier);
  if (!normalizedIdentifier) return '';

  const normalizedLowerIdentifier = normalizeAdminIdentifierLower(identifier);
  const normalizedUpperIdentifier = normalizedIdentifier.toUpperCase();

  const lookups: Array<{ rank: number; path: string }> = [
    {
      rank: 0,
      path: `/rest/v1/employees?${SUPABASE_PUBLIC_ADMIN_DIRECTORY_SELECT}&login_id=eq.${encodeURIComponent(normalizedIdentifier)}&limit=10`,
    },
    {
      rank: 0,
      path: `/rest/v1/employees?${SUPABASE_PUBLIC_ADMIN_DIRECTORY_SELECT}&login_id=eq.${encodeURIComponent(normalizedLowerIdentifier)}&limit=10`,
    },
    {
      rank: 1,
      path: `/rest/v1/employees?${SUPABASE_PUBLIC_ADMIN_DIRECTORY_SELECT}&name=eq.${encodeURIComponent(normalizedIdentifier)}&limit=10`,
    },
    {
      rank: 2,
      path: `/rest/v1/employees?${SUPABASE_PUBLIC_ADMIN_DIRECTORY_SELECT}&employee_code=eq.${encodeURIComponent(normalizedUpperIdentifier)}&limit=10`,
    },
  ];

  const settled = await Promise.allSettled(
    lookups.map(({ path }) => supabaseRequest<Array<PublicAdminDirectoryRow>>(path))
  );

  const candidates: RankedAdminDirectoryCandidate[] = [];
  settled.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;
    const rank = lookups[index]?.rank ?? 99;
    const rows = Array.isArray(result.value) ? result.value : [];
    rows.forEach((row) => {
      if (!normalizeAdminIdentifier(row.email)) return;
      candidates.push({ row, rank });
    });
  });

  if (!candidates.length) {
    return '';
  }

  candidates.sort((left, right) => {
    if (left.rank !== right.rank) return left.rank - right.rank;

    const activeDiff =
      Number(normalizeAdminIdentifierLower(right.row.employment_status) === 'active')
      - Number(normalizeAdminIdentifierLower(left.row.employment_status) === 'active');
    if (activeDiff !== 0) return activeDiff;

    const syntheticDiff =
      Number(isSyntheticAdminEmail(left.row.email))
      - Number(isSyntheticAdminEmail(right.row.email));
    if (syntheticDiff !== 0) return syntheticDiff;

    return 0;
  });

  return normalizeAdminIdentifier(candidates[0]?.row.email);
};

const resolveSupabaseLoginEmail = async (identifier: string) => {
  const normalizedIdentifier = normalizeAdminIdentifier(identifier);
  if (!normalizedIdentifier) return '';

  if (normalizedIdentifier.includes('@')) {
    return normalizedIdentifier;
  }

  const fallbackEmail = ADMIN_IDENTIFIER_EMAIL_FALLBACKS[normalizeAdminIdentifierLower(normalizedIdentifier)] || '';

  try {
    const directoryEmail = await resolveAdminEmailFromPublicDirectory(normalizedIdentifier);
    return preferAdminEmail(directoryEmail, fallbackEmail);
  } catch (error) {
    console.warn('[AdminAuth] 공개 직원 디렉터리 조회 실패:', error);
    return fallbackEmail;
  }
};

const loginWithSupabase = async (identifier: string, password: string): Promise<AdminAuthResult> => {
  const directEmailInput = identifier.includes('@') ? identifier.trim() : '';
  let resolvedEmail = directEmailInput;

  if (directEmailInput) {
    console.log('[AdminAuth] 이메일 직접 입력 — Supabase 직접 로그인');
  } else {
    resolvedEmail = await resolveSupabaseLoginEmail(identifier);
  }

  if (!resolvedEmail && !directEmailInput) {
    const error = new Error('알 수 없는 관리자 ID입니다. 이메일로 직접 로그인하세요.') as Error & { code?: string };
    error.code = 'supabase/unknown-admin-identifier';
    throw error;
  }

  if (!resolvedEmail) {
    const error = new Error('Supabase 로그인에 필요한 내부 이메일이 설정되지 않았습니다.') as Error & { code?: string };
    error.code = isLocalPreviewHost()
      ? 'supabase/local-email-login-required'
      : 'supabase/missing-auth-email';
    throw error;
  }

  const authResponse = await supabaseRequest<SupabaseAuthTokenResponse>(
    '/auth/v1/token?grant_type=password',
    {
      method: 'POST',
      body: JSON.stringify({
        email: resolvedEmail,
        password,
      }),
    }
  );

  const {
    accessToken,
    refreshToken,
    expiresIn,
    user,
  } = await normalizeSupabaseAuthPayload(authResponse);

  if (!accessToken || !user || !user.id) {
    const error = new Error('로그인 응답에서 사용자 또는 세션 정보를 찾을 수 없습니다. Supabase Auth 설정을 확인해주세요.') as Error & { code?: string };
    error.code = 'supabase/invalid-auth-response';
    throw error;
  }

  const [profiles, employees] = await Promise.all([
    supabaseRequest<Array<{
    id: string;
    email?: string;
    display_name?: string;
  }>>(
    `/rest/v1/profiles?select=id,email,display_name&id=eq.${encodeURIComponent(user.id)}&limit=1`,
    {},
    accessToken
  ),
    supabaseRequest<Array<{
    id: string;
    name?: string;
    email?: string;
    job_title?: string;
    employment_status?: string;
    profile_id: string;
  }>>(
    `/rest/v1/employees?select=id,name,email,job_title,employment_status,profile_id&profile_id=eq.${encodeURIComponent(user.id)}&limit=1`,
    {},
    accessToken
  )]);

  const employee = (Array.isArray(employees) ? employees : [])[0];
  const profile = (Array.isArray(profiles) ? profiles : [])[0];

  if (!employee) {
    const error = new Error('직원 프로필이 아직 준비되지 않았습니다.') as Error & { code?: string };
    error.code = 'supabase/missing-employee';
    throw error;
  }

  if (employee.employment_status && employee.employment_status !== 'active') {
    const error = new Error('비활성화된 관리자 계정입니다.') as Error & { code?: string };
    error.code = 'supabase/inactive-admin';
    throw error;
  }

  const [employeeRoles, assignments] = await Promise.all([
    fetchEmployeeRoles(accessToken, employee.id),
    fetchEmployeeBranchAssignments(accessToken, employee.id),
  ]);

  const primaryRole = employeeRoles.find((entry) => entry.is_primary)?.role?.code
    || employeeRoles[0]?.role?.code
    || 'ops_staff';

  const primaryBranch = assignments.find((entry: any) => entry.is_primary) || assignments[0] || null;
  const branchCode = (primaryBranch as any)?.branch?.branch_code || '';
  const branchUuid = (primaryBranch as any)?.branch?.id || (primaryBranch as any)?.branch_id || '';
  const branchId = await resolveLegacyLocationId(
    accessToken,
    branchCode,
    '',
    undefined,
    branchUuid
  );

  persistSupabaseAdminSession({
    accessToken,
    refreshToken,
    userId: user.id,
    email: user.email || resolvedEmail || identifier,
    provider: 'supabase',
    savedAt: Date.now(),
    expiresAt: resolveSessionExpiry(
      Date.now(),
      expiresIn ? Date.now() + expiresIn * 1000 : undefined
    ),
  });

  return {
    name: employee.name || profile?.display_name || user.email || identifier,
    jobTitle: employee.job_title || 'Staff',
    role: mapSupabaseRoleToLegacyRole(primaryRole),
    email: employee.email || profile?.email || user.email || identifier,
    branchId: branchId || '',
    branchCode: branchCode || '',
    provider: 'supabase',
    employeeId: employee.id,
    profileId: user.id,
  };
};

export const loginAdmin = async (identifier: string, password: string): Promise<AdminAuthResult> => {
  return loginWithSupabase(identifier, password);
};
