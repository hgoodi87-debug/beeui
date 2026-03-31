/**
 * Supabase REST 클라이언트 유틸
 * storageService.ts에서 Firebase 폴백과 함께 사용
 */
import { getSupabaseBaseUrl, getSupabasePublishableKey } from './supabaseRuntime';

const SUPABASE_URL = getSupabaseBaseUrl();
const SUPABASE_KEY = getSupabasePublishableKey();
const SUPABASE_DATA_SCHEMA = 'public';

export const isSupabaseDataEnabled = (): boolean =>
  Boolean(SUPABASE_URL) && Boolean(SUPABASE_KEY);

if (!isSupabaseDataEnabled() && typeof window !== 'undefined') {
  console.error(
    '[Supabase] DB 연결 불가: VITE_SUPABASE_URL 또는 VITE_SUPABASE_PUBLISHABLE_KEY가 없습니다.\n' +
    `  URL: ${SUPABASE_URL || '(없음)'}\n` +
    `  KEY: ${SUPABASE_KEY ? '설정됨' : '(없음)'}`
  );
}

const buildSupabaseHttpError = async (response: Response, label: string) => {
  const text = await response.text();
  let details: unknown = text;

  try {
    details = text ? JSON.parse(text) : null;
  } catch {
    details = text;
  }

  const error = new Error(
    typeof details === 'object' && details && 'message' in details
      ? String((details as { message?: string }).message)
      : `${label} failed [${response.status}]`
  ) as Error & { status?: number; code?: string; details?: unknown };

  error.status = response.status;
  error.code =
    typeof details === 'object' && details && 'code' in details
      ? String((details as { code?: string }).code)
      : `supabase/${response.status}`;
  error.details = details;
  return error;
};

const resolveAccessToken = async (accessToken?: string) => {
  const explicitToken = (accessToken || '').trim();
  if (explicitToken) {
    return explicitToken;
  }

  try {
    const {
      isSupabaseAdminAuthEnabled,
      ensureActiveAdminSession,
      getActiveAdminAccessToken,
    } = await import('./adminAuthService');

    if (!isSupabaseAdminAuthEnabled()) {
      return '';
    }

    const activeSession = await ensureActiveAdminSession();
    return activeSession?.accessToken || getActiveAdminAccessToken();
  } catch (error) {
    console.warn('[SupabaseClient] 관리자 세션 토큰 확인 실패:', error);
    return '';
  }
};

/**
 * Supabase REST API GET 요청
 * snake_case 응답을 그대로 반환 (호출측에서 변환)
 */
export async function supabaseGet<T>(path: string, accessToken?: string): Promise<T> {
  const resolvedAccessToken = await resolveAccessToken(accessToken);
  const headers: Record<string, string> = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${resolvedAccessToken || SUPABASE_KEY}`,
    'Accept': 'application/json',
    'Accept-Profile': SUPABASE_DATA_SCHEMA,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!res.ok) {
    throw await buildSupabaseHttpError(res, `Supabase GET /${path}`);
  }
  return res.json();
}

/**
 * Supabase REST API POST/PATCH/DELETE
 */
export async function supabaseMutate<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
  accessToken?: string
): Promise<T | null> {
  const resolvedAccessToken = await resolveAccessToken(accessToken);
  const headers: Record<string, string> = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${resolvedAccessToken || SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Accept-Profile': SUPABASE_DATA_SCHEMA,
    'Content-Profile': SUPABASE_DATA_SCHEMA,
    'Prefer': 'return=representation',
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw await buildSupabaseHttpError(res, `Supabase ${method} /${path}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/**
 * snake_case → camelCase 변환 유틸
 */
export function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

/**
 * camelCase → snake_case 변환 유틸
 */
export function camelToSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

/**
 * Supabase polling subscribe — Realtime 대체
 * 주기적으로 GET 요청 후 콜백 호출, unsubscribe 함수 반환
 */
export function supabasePollingSubscribe<T>(
  path: string,
  callback: (data: T[]) => void,
  transform: (row: Record<string, unknown>) => T,
  intervalMs = 10000
): () => void {
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      const rows = await supabaseGet<Array<Record<string, unknown>>>(path);
      if (active && rows) {
        callback(rows.map(transform));
      }
    } catch (e) {
      console.warn(`[Supabase Poll] ${path} failed:`, e);
    }
  };

  poll(); // 즉시 1회
  const timer = setInterval(poll, intervalMs);

  return () => {
    active = false;
    clearInterval(timer);
  };
}
