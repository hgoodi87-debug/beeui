// 빌리버 운영 프로젝트 (fzvfyeskdivulazjjpgr, ap-northeast-1, ACTIVE_HEALTHY)
const DEFAULT_SUPABASE_HOSTED_URL = 'https://fzvfyeskdivulazjjpgr.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dmZ5ZXNrZGl2dWxhempqcGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzc3MjcsImV4cCI6MjA4OTY1MzcyN30.K-sFDk2KXB42onDo-2gKXPIA3hWImTtfGUfB6WTC-gg';

// 구 프로젝트 ID — 환경변수에 이 값이 들어오면 현재 운영 URL로 교체
const LEGACY_PROJECT_ID = 'xpnfjolqiffduedwtxey';

export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

  // 구 프로젝트 URL이 들어오면 현재 운영 프로젝트로 교체
  const isLegacyUrl = envUrl.includes(LEGACY_PROJECT_ID);
  // 상대경로(/supabase)는 Vite 개발서버 프록시 전용 — 프로덕션 빌드에서는 하드코딩 URL로 폴백
  const isDevProxy = envUrl.startsWith('/') && import.meta.env.PROD;
  const finalUrl = (isLegacyUrl || !envUrl || isDevProxy) ? DEFAULT_SUPABASE_HOSTED_URL : envUrl;
  const finalKey = (isLegacyUrl || !envKey) ? FALLBACK_ANON_KEY : envKey;

  return {
    url: finalUrl,
    anonKey: finalKey,
    isFallback: !import.meta.env.VITE_SUPABASE_URL || isLegacyUrl,
    isLegacyBlocked: isLegacyUrl
  };
};

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const configuredHostedUrl = import.meta.env.VITE_SUPABASE_PUBLIC_URL?.trim() || DEFAULT_SUPABASE_HOSTED_URL;

const normalizeBase = (value: string) => value.replace(/\/+$/, '');

const isLocalProxyHost = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = window.location.hostname.toLowerCase();
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local') ||
    /^192\.168\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
};

const joinBaseAndPath = (base: string, path: string) => {
  const normalizedBase = normalizeBase(base);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

export const getSupabaseBaseUrl = () => {
  return getSupabaseConfig().url;
};

/**
 * [스봉이] 현재 Supabase 연결 환경 진단 정보 💅
 */
export const getSupabaseDiagnosis = () => {
  const config = getSupabaseConfig();
  const current = config.url;
  const isFallback = config.isFallback;

  return {
    url: current,
    usingFallback: isFallback,
    source: isFallback ? (config.isLegacyBlocked ? 'legacy-project-blocked' : 'hardcoded-fallback') : 'env-variable',
    isLocalProxy: isLocalProxyHost() && (import.meta.env.VITE_SUPABASE_URL || '').startsWith('/'),
    rawEnvUrl: import.meta.env.VITE_SUPABASE_URL || '(empty)',
    configuredHostedUrl: DEFAULT_SUPABASE_HOSTED_URL,
    isLegacyBlocked: config.isLegacyBlocked,
  };
};

export const resolveSupabaseUrl = (path = '') => {
  const baseUrl = getSupabaseBaseUrl();
  if (!path) {
    return baseUrl;
  }

  return joinBaseAndPath(baseUrl, path);
};

export const resolveSupabaseEndpoint = (rawEndpoint: string | undefined, fallbackPath: string) => {
  const endpoint = (rawEndpoint || '').trim();
  if (!endpoint) {
    return resolveSupabaseUrl(fallbackPath);
  }

  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  const baseUrl = getSupabaseBaseUrl();
  if (baseUrl.startsWith('/')) {
    return endpoint;
  }

  if (endpoint.startsWith('/supabase')) {
    return joinBaseAndPath(baseUrl, endpoint.replace(/^\/supabase/, ''));
  }

  if (endpoint.startsWith('/')) {
    return joinBaseAndPath(baseUrl, endpoint);
  }

  return endpoint;
};
