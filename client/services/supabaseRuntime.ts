const DEFAULT_SUPABASE_HOSTED_URL = 'https://xpnfjolqiffduedwtxey.supabase.co';
const fallbackAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbmZqb2xxaWZmZHVlZHd0eGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NzEyOTQsImV4cCI6MjA5MDE0NzI5NH0.60fV5WzgBcF1WEetrBwy58yAs-lOtbPk2M57_0Lt3-E';

export const getSupabaseConfig = () => {
  return {
    url: import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_HOSTED_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || fallbackAnonKey,
    isFallback: !import.meta.env.VITE_SUPABASE_URL
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
  const normalizedRaw = normalizeBase(rawSupabaseUrl);
  const normalizedHosted = normalizeBase(configuredHostedUrl);

  if (!normalizedRaw) {
    return normalizedHosted;
  }

  if (normalizedRaw.startsWith('/')) {
    return isLocalProxyHost() ? normalizedRaw : normalizedHosted;
  }

  return normalizedRaw;
};

/**
 * [스봉이] 현재 Supabase 연결 환경 진단 정보 💅
 */
export const getSupabaseDiagnosis = () => {
  const normalizedRaw = normalizeBase(rawSupabaseUrl);
  const normalizedHosted = normalizeBase(configuredHostedUrl);
  const current = getSupabaseBaseUrl();
  const isFallback = !normalizedRaw || (normalizedRaw.startsWith('/') && !isLocalProxyHost());

  return {
    url: current,
    usingFallback: isFallback,
    source: isFallback ? 'hardcoded-fallback' : 'env-variable',
    isLocalProxy: isLocalProxyHost() && normalizedRaw.startsWith('/'),
    rawEnvUrl: rawSupabaseUrl || '(empty)',
    configuredHostedUrl: configuredHostedUrl || '(empty)',
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
