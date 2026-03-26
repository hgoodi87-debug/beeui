/**
 * Supabase REST 클라이언트 유틸
 * storageService.ts에서 Firebase 폴백과 함께 사용
 */

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
// anon key 우선, publishable key 폴백
const SUPABASE_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ''
).trim();

export const isSupabaseDataEnabled = (): boolean =>
  Boolean(SUPABASE_URL) && Boolean(SUPABASE_KEY);

/**
 * Supabase REST API GET 요청
 * snake_case 응답을 그대로 반환 (호출측에서 변환)
 */
export async function supabaseGet<T>(path: string, accessToken?: string): Promise<T> {
  const headers: Record<string, string> = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${accessToken || SUPABASE_KEY}`,
    'Accept': 'application/json',
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!res.ok) {
    throw new Error(`Supabase GET /${path} failed [${res.status}]`);
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
  const headers: Record<string, string> = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${accessToken || SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`Supabase ${method} /${path} failed [${res.status}]`);
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
