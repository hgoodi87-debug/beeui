/**
 * Supabase REST 클라이언트 유틸
 * storageService.ts에서 Firebase 폴백과 함께 사용
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './supabaseRuntime';

const config = getSupabaseConfig();
const SUPABASE_URL = config.url;
const SUPABASE_KEY = config.anonKey;
const SUPABASE_DATA_SCHEMA = 'public';

/**
 * Supabase JS 클라이언트 싱글턴 — Realtime 채널용
 * REST 요청은 기존 fetch 기반 supabaseGet/supabaseMutate 사용
 */
let _supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!_supabaseClient) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('[SupabaseClient] URL 또는 KEY 미설정 — Realtime 불가');
    }
    _supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return _supabaseClient;
};

export const isSupabaseDataEnabled = (): boolean =>
  Boolean(SUPABASE_URL) && Boolean(SUPABASE_KEY);

/**
 * [스봉이] Supabase 데이터 연동 상세 진단 💅
 */
export const getSupabaseDataDiagnosis = async () => {
  const { getSupabaseDiagnosis } = await import('./supabaseRuntime');
  const runtime = getSupabaseDiagnosis();
  const hasAnonKey = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY?.trim());
  const hasPublishableKey = Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim());
  const hasProvider = import.meta.env.VITE_ADMIN_AUTH_PROVIDER === 'supabase';

  return {
    ...runtime,
    hasKey: Boolean(SUPABASE_KEY),
    hasAnonKey,
    hasPublishableKey,
    hasProvider,
    isEnabled: isSupabaseDataEnabled(),
    keyPrefix: SUPABASE_KEY ? SUPABASE_KEY.substring(0, 5) + '...' : '(none)'
  };
};

const RETRY_MAX = 3;
const RETRY_BASE_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 30000;

/**
 * 지수 백오프 재시도 — 4xx는 즉시 포기, 5xx·네트워크 오류만 재시도
 */
const withRetry = async <T>(fn: () => Promise<T>): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < RETRY_MAX; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status = (error as { status?: number })?.status;
      if (status && status >= 400 && status < 500) throw error; // 클라이언트 오류 즉시 포기
      if (attempt < RETRY_MAX - 1) {
        await new Promise((r) => setTimeout(r, RETRY_BASE_DELAY_MS * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
};

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

  return withRetry(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers, signal: controller.signal });
      if (!res.ok) throw await buildSupabaseHttpError(res, `Supabase GET /${path}`);
      return res.json() as Promise<T>;
    } finally {
      clearTimeout(timer);
    }
  });
}

/**
 * Supabase REST API POST/PATCH/DELETE
 */
export async function supabaseMutate<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
  accessToken?: string,
  prefer: 'return=representation' | 'return=minimal' | 'return=minimal,resolution=merge-duplicates' = 'return=representation'
): Promise<T | null> {
  const resolvedAccessToken = await resolveAccessToken(accessToken);
  const headers: Record<string, string> = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${resolvedAccessToken || SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Accept-Profile': SUPABASE_DATA_SCHEMA,
    'Content-Profile': SUPABASE_DATA_SCHEMA,
    'Prefer': prefer,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

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
