/** HTTP 헤더에 사용 가능하도록 비 ASCII / 비가시 문자를 제거 */
export const sanitizeForHeader = (value: string): string =>
  value.replace(/[^\x20-\x7E]/g, '').trim();

/** Supabase 키를 안전하게 읽기 (비 ASCII 제거) */
export const getSupabasePublishableKey = (): string =>
  sanitizeForHeader(
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    ''
  );

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const configuredHostedUrl = import.meta.env.VITE_SUPABASE_PUBLIC_URL?.trim() || '';

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
    if (!normalizedHosted) {
      console.error(
        '[Supabase] VITE_SUPABASE_URL 환경변수가 설정되지 않았습니다. ' +
        'GitHub Secrets 또는 .env 파일을 확인하세요.'
      );
    }
    return normalizedHosted;
  }

  if (normalizedRaw.startsWith('/')) {
    return isLocalProxyHost() ? normalizedRaw : normalizedHosted;
  }

  return normalizedRaw;
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
