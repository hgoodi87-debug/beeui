import { ensureAuth } from '../firebaseApp';

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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || '';
const configuredProvider = import.meta.env.VITE_ADMIN_AUTH_PROVIDER === 'supabase' ? 'supabase' : 'firebase';

const normalizeRole = (role?: string) => {
  const candidate = (role || '').trim().toLowerCase();
  if (!candidate) return 'staff';
  return candidate;
};

export const getAdminAuthProvider = (): AdminAuthProvider => {
  if (configuredProvider === 'supabase' && supabaseUrl && supabasePublishableKey) {
    return 'supabase';
  }
  return 'firebase';
};

export const isSupabaseAdminAuthEnabled = () => getAdminAuthProvider() === 'supabase';

export const warmAdminAuth = async () => {
  if (getAdminAuthProvider() === 'firebase') {
    await ensureAuth();
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
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: supabasePublishableKey,
      Authorization: `Bearer ${accessToken || supabasePublishableKey}`,
      'Content-Type': 'application/json',
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

const loginWithFirebase = async (identifier: string, password: string): Promise<AdminAuthResult> => {
  const user = await ensureAuth();
  if (!user) {
    throw new Error('익명 로그인 세션 생성에 실패했습니다.');
  }

  const { httpsCallable } = await import('firebase/functions');
  const { functions } = await import('../firebaseApp');
  const verifyAdmin = httpsCallable(functions, 'verifyAdmin');
  const result = await verifyAdmin({ name: identifier, password });
  const admin = result.data as Record<string, any> | null;

  if (!admin) {
    const error = new Error('이름 또는 비밀번호가 올바르지 않습니다.') as Error & { code?: string };
    error.code = 'functions/unauthenticated';
    throw error;
  }

  return {
    name: String(admin.name || identifier),
    jobTitle: String(admin.jobTitle || 'Staff'),
    role: normalizeRole(String(admin.role || 'staff')),
    email: admin.email ? String(admin.email) : '',
    branchId: admin.branchId ? String(admin.branchId) : '',
    provider: 'firebase',
  };
};

const loginWithSupabase = async (identifier: string, password: string): Promise<AdminAuthResult> => {
  if (!identifier.includes('@')) {
    const error = new Error('Supabase 관리자 로그인은 이메일 기준으로만 받습니다.') as Error & { code?: string };
    error.code = 'invalid-identifier';
    throw error;
  }

  const authResponse = await supabaseRequest<{
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      email?: string;
      user_metadata?: Record<string, unknown>;
    };
  }>(
    '/auth/v1/token?grant_type=password',
    {
      method: 'POST',
      body: JSON.stringify({
        email: identifier,
        password,
      }),
    }
  );

  const accessToken = authResponse.access_token;
  const user = authResponse.user;

  const profiles = await supabaseRequest<Array<{
    id: string;
    email?: string;
    display_name?: string;
  }>>(
    `/rest/v1/profiles?select=id,email,display_name&id=eq.${encodeURIComponent(user.id)}&limit=1`,
    {},
    accessToken
  );

  const employees = await supabaseRequest<Array<{
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
  );

  const employee = employees[0];
  const profile = profiles[0];

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

  const employeeRoles = await supabaseRequest<Array<{
    is_primary: boolean;
    role: {
      code?: string;
      name?: string;
    } | null;
  }>>(
    `/rest/v1/employee_roles?select=is_primary,role:roles(code,name)&employee_id=eq.${encodeURIComponent(employee.id)}&order=is_primary.desc&limit=10`,
    {},
    accessToken
  );

  const primaryRole = employeeRoles.find((entry) => entry.is_primary)?.role?.code
    || employeeRoles[0]?.role?.code
    || 'ops_staff';

  const assignments = await supabaseRequest<Array<{
    is_primary: boolean;
    branch: {
      id: string;
      branch_code?: string;
      name?: string;
    } | null;
  }>>(
    `/rest/v1/employee_branch_assignments?select=is_primary,branch:branches(id,branch_code,name)&employee_id=eq.${encodeURIComponent(employee.id)}&order=is_primary.desc&limit=10`,
    {},
    accessToken
  );

  const primaryBranch = assignments.find((entry) => entry.is_primary)?.branch || assignments[0]?.branch || null;

  sessionStorage.setItem(
    'beeliber_supabase_admin_session',
    JSON.stringify({
      accessToken,
      refreshToken: authResponse.refresh_token,
      userId: user.id,
      email: user.email || identifier,
      provider: 'supabase',
      savedAt: Date.now(),
    })
  );

  return {
    name: employee.name || profile?.display_name || user.email || identifier,
    jobTitle: employee.job_title || 'Staff',
    role: normalizeRole(primaryRole),
    email: employee.email || profile?.email || user.email || identifier,
    branchId: primaryBranch?.id || '',
    branchCode: primaryBranch?.branch_code || '',
    provider: 'supabase',
    employeeId: employee.id,
    profileId: user.id,
  };
};

export const loginAdmin = async (identifier: string, password: string): Promise<AdminAuthResult> => {
  if (getAdminAuthProvider() === 'supabase') {
    return loginWithSupabase(identifier, password);
  }
  return loginWithFirebase(identifier, password);
};
