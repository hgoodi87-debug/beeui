import { getSupabaseConfig } from './services/supabaseRuntime';

export interface CustomerAuthUser {
  id: string;
  uid: string;
  email: string;
  displayName?: string;
  isAnonymous: boolean;
}

interface StoredCustomerSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  user: CustomerAuthUser;
}

interface SupabaseAuthUserPayload {
  id?: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

interface SupabaseAuthTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  user?: SupabaseAuthUserPayload;
  session?: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: SupabaseAuthUserPayload;
  };
}

const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = getSupabaseConfig();
const CUSTOMER_SESSION_KEY = 'beeliber_supabase_customer_session';
const REFRESH_BUFFER_MS = 60 * 1000;
const listeners = new Set<(user: CustomerAuthUser | null) => void>();

let currentSession: StoredCustomerSession | null = null;
let currentUser: CustomerAuthUser | null = null;
let initPromise: Promise<void> | null = null;

const normalizeText = (value: unknown) => String(value || '').trim();

const notifyAuthListeners = () => {
  listeners.forEach((listener) => {
    try {
      listener(currentUser);
    } catch (error) {
      console.error('[CustomerAuth] listener failed:', error);
    }
  });
};

const persistCustomerSession = (session: StoredCustomerSession | null) => {
  if (!session) {
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
    sessionStorage.removeItem(CUSTOMER_SESSION_KEY);
    return;
  }

  const serialized = JSON.stringify(session);
  localStorage.setItem(CUSTOMER_SESSION_KEY, serialized);
  sessionStorage.setItem(CUSTOMER_SESSION_KEY, serialized);
};

const readPersistedCustomerSession = (): StoredCustomerSession | null => {
  const raw =
    localStorage.getItem(CUSTOMER_SESSION_KEY)
    || sessionStorage.getItem(CUSTOMER_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredCustomerSession>;
    const accessToken = normalizeText(parsed.accessToken);
    const uid = normalizeText(parsed.user?.uid || parsed.user?.id);
    const email = normalizeText(parsed.user?.email);

    if (!accessToken || !uid || !email) {
      persistCustomerSession(null);
      return null;
    }

    const session: StoredCustomerSession = {
      accessToken,
      refreshToken: normalizeText(parsed.refreshToken) || undefined,
      expiresAt: Number(parsed.expiresAt || 0) || undefined,
      user: {
        id: uid,
        uid,
        email,
        displayName: normalizeText(parsed.user?.displayName) || undefined,
        isAnonymous: false,
      },
    };

    persistCustomerSession(session);
    return session;
  } catch (error) {
    console.warn('[CustomerAuth] persisted session parse failed:', error);
    persistCustomerSession(null);
    return null;
  }
};

const toAuthUser = (user: SupabaseAuthUserPayload | null | undefined): CustomerAuthUser | null => {
  const id = normalizeText(user?.id);
  const email = normalizeText(user?.email);

  if (!id || !email) {
    return null;
  }

  const metadata = user?.user_metadata || {};
  const displayName =
    normalizeText(metadata.display_name)
    || normalizeText(metadata.name)
    || undefined;

  return {
    id,
    uid: id,
    email,
    displayName,
    isAnonymous: false,
  };
};

const resolveAuthErrorMessage = async (response: Response) => {
  const text = await response.text();
  try {
    const parsed = text ? JSON.parse(text) : null;
    if (typeof parsed === 'object' && parsed && 'msg' in parsed) {
      return String((parsed as { msg?: string }).msg);
    }
    if (typeof parsed === 'object' && parsed && 'message' in parsed) {
      return String((parsed as { message?: string }).message);
    }
    if (typeof parsed === 'object' && parsed && 'error_description' in parsed) {
      return String((parsed as { error_description?: string }).error_description);
    }
    if (typeof parsed === 'object' && parsed && 'error' in parsed) {
      return String((parsed as { error?: string }).error);
    }
  } catch {
    // noop
  }
  return text || `Supabase auth request failed (${response.status})`;
};

const requestSupabaseAuth = async <T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> => {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = new Error(await resolveAuthErrorMessage(response)) as Error & {
      code?: string;
      status?: number;
    };
    error.status = response.status;
    error.code = `supabase/${response.status}`;
    throw error;
  }

  return response.json() as Promise<T>;
};

const normalizeSupabaseAuthPayload = async (authResponse: SupabaseAuthTokenResponse) => {
  const accessToken = normalizeText(
    authResponse.access_token
    || authResponse.session?.access_token,
  );
  const refreshToken = normalizeText(
    authResponse.refresh_token
    || authResponse.session?.refresh_token,
  );
  const expiresIn = Number(
    authResponse.expires_in
    || authResponse.session?.expires_in
    || 0,
  ) || undefined;
  const expiresAt = Number(authResponse.expires_at || 0) || undefined;

  let user = toAuthUser(authResponse.user || authResponse.session?.user);
  if (!user && accessToken) {
    const fallbackUser = await requestSupabaseAuth<SupabaseAuthUserPayload>('/auth/v1/user', {}, accessToken);
    user = toAuthUser(fallbackUser);
  }

  return {
    accessToken,
    refreshToken: refreshToken || undefined,
    expiresAt: expiresAt ? expiresAt * 1000 : (expiresIn ? Date.now() + expiresIn * 1000 : undefined),
    user,
  };
};

const applySession = (session: StoredCustomerSession | null) => {
  currentSession = session;
  currentUser = session?.user || null;
  persistCustomerSession(session);
  notifyAuthListeners();
};

const parseOAuthHashSession = async (): Promise<StoredCustomerSession | null> => {
  if (typeof window === 'undefined' || !window.location.hash.startsWith('#')) {
    return null;
  }

  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = normalizeText(params.get('access_token'));
  if (!accessToken) {
    const authError = normalizeText(params.get('error_description') || params.get('error'));
    if (authError) {
      console.warn('[CustomerAuth] OAuth redirect error:', authError);
      window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
    }
    return null;
  }

  const refreshToken = normalizeText(params.get('refresh_token')) || undefined;
  const expiresAt = Number(params.get('expires_at') || 0) || undefined;
  const userPayload = await requestSupabaseAuth<SupabaseAuthUserPayload>('/auth/v1/user', {}, accessToken);
  const user = toAuthUser(userPayload);
  window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);

  if (!user) {
    throw new Error('OAuth redirect did not return a valid user.');
  }

  return {
    accessToken,
    refreshToken,
    expiresAt: expiresAt ? expiresAt * 1000 : undefined,
    user,
  };
};

const refreshCustomerSession = async (session: StoredCustomerSession) => {
  if (!session.refreshToken) {
    return session;
  }

  const response = await requestSupabaseAuth<SupabaseAuthTokenResponse>(
    '/auth/v1/token?grant_type=refresh_token',
    {
      method: 'POST',
      body: JSON.stringify({
        refresh_token: session.refreshToken,
      }),
    },
  );

  const normalized = await normalizeSupabaseAuthPayload(response);
  if (!normalized.accessToken || !normalized.user) {
    throw new Error('Supabase refresh response did not include a valid session.');
  }

  return {
    accessToken: normalized.accessToken,
    refreshToken: normalized.refreshToken || session.refreshToken,
    expiresAt: normalized.expiresAt,
    user: normalized.user,
  } satisfies StoredCustomerSession;
};

const shouldRefreshSession = (session: StoredCustomerSession | null) => {
  if (!session?.expiresAt || !session.refreshToken) {
    return false;
  }
  return session.expiresAt - Date.now() <= REFRESH_BUFFER_MS;
};

const initializeCustomerAuth = async () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const oauthSession = await parseOAuthHashSession();
    if (oauthSession) {
      applySession(oauthSession);
      return;
    }

    const persistedSession = readPersistedCustomerSession();
    if (!persistedSession) {
      applySession(null);
      return;
    }

    if (shouldRefreshSession(persistedSession)) {
      const refreshedSession = await refreshCustomerSession(persistedSession);
      applySession(refreshedSession);
      return;
    }

    applySession(persistedSession);
  } catch (error) {
    console.warn('[CustomerAuth] initialization failed:', error);
    applySession(null);
  }
};

const ensureCustomerAuthInitialized = async () => {
  if (!initPromise) {
    initPromise = initializeCustomerAuth();
  }
  await initPromise;
};

void ensureCustomerAuthInitialized();

// 다른 탭에서 로그인 완료 시 현재 탭도 자동 반영 (magic link cross-tab 동기화)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === CUSTOMER_SESSION_KEY && e.newValue && !currentSession) {
      const session = readPersistedCustomerSession();
      if (session) applySession(session);
    }
  });
}

export const getActiveCustomerAccessToken = async () => {
  await ensureCustomerAuthInitialized();
  if (shouldRefreshSession(currentSession)) {
    try {
      const refreshedSession = await refreshCustomerSession(currentSession as StoredCustomerSession);
      applySession(refreshedSession);
    } catch (error) {
      console.warn('[CustomerAuth] session refresh failed:', error);
      applySession(null);
      return '';
    }
  }
  return currentSession?.accessToken || '';
};

export const ensureAuth = async (): Promise<CustomerAuthUser | null> => {
  await ensureCustomerAuthInitialized();
  return currentUser;
};

/**
 * 매직링크(OTP) 이메일 전송
 * 사용자가 링크를 클릭하면 #access_token 해시와 함께 redirectTo URL로 이동,
 * parseOAuthHashSession이 자동으로 세션을 복원합니다.
 */
export const signInWithMagicLink = async (email: string, redirectTo: string): Promise<void> => {
  await requestSupabaseAuth<unknown>(
    '/auth/v1/otp',
    {
      method: 'POST',
      body: JSON.stringify({
        email: normalizeText(email),
        create_user: true,
        options: { emailRedirectTo: redirectTo },
      }),
    },
  );
};

/** 이메일로 6자리 OTP 코드 전송 (팝업 내 완결 로그인용) */
export const sendEmailOtp = async (email: string): Promise<void> => {
  await requestSupabaseAuth<unknown>(
    '/auth/v1/otp',
    {
      method: 'POST',
      body: JSON.stringify({
        email: normalizeText(email),
        create_user: true,
      }),
    },
  );
};

/** 6자리 OTP 코드 검증 → 세션 적용 → CustomerAuthUser 반환 */
export const signInWithEmailOtp = async (
  email: string,
  token: string,
): Promise<{ user: CustomerAuthUser }> => {
  const response = await requestSupabaseAuth<SupabaseAuthTokenResponse>(
    '/auth/v1/verify',
    {
      method: 'POST',
      body: JSON.stringify({
        email: normalizeText(email),
        token: token.trim(),
        type: 'email',
      }),
    },
  );

  const normalized = await normalizeSupabaseAuthPayload(response);
  if (!normalized.accessToken || !normalized.user) {
    throw new Error('OTP verification did not return a valid session.');
  }

  const session: StoredCustomerSession = {
    accessToken: normalized.accessToken,
    refreshToken: normalized.refreshToken,
    expiresAt: normalized.expiresAt,
    user: normalized.user,
  };

  applySession(session);
  return { user: session.user };
};

export const signInWithEmailAndPassword = async (email: string, password: string) => {
  const response = await requestSupabaseAuth<SupabaseAuthTokenResponse>(
    '/auth/v1/token?grant_type=password',
    {
      method: 'POST',
      body: JSON.stringify({ email: normalizeText(email), password }),
    },
  );

  const normalized = await normalizeSupabaseAuthPayload(response);
  if (!normalized.accessToken || !normalized.user) {
    throw new Error('Supabase email login did not return a valid session.');
  }

  const session: StoredCustomerSession = {
    accessToken: normalized.accessToken,
    refreshToken: normalized.refreshToken,
    expiresAt: normalized.expiresAt,
    user: normalized.user,
  };

  applySession(session);
  return { user: session.user };
};

export const createUserWithEmailAndPassword = async (email: string, password: string) => {
  const response = await requestSupabaseAuth<SupabaseAuthTokenResponse>(
    '/auth/v1/signup',
    {
      method: 'POST',
      body: JSON.stringify({
        email: normalizeText(email),
        password,
      }),
    },
  );

  const normalized = await normalizeSupabaseAuthPayload(response);
  if (normalized.accessToken && normalized.user) {
    const session: StoredCustomerSession = {
      accessToken: normalized.accessToken,
      refreshToken: normalized.refreshToken,
      expiresAt: normalized.expiresAt,
      user: normalized.user,
    };
    applySession(session);
    return { user: session.user };
  }

  return await signInWithEmailAndPassword(email, password);
};

export const updateProfile = async (
  user: CustomerAuthUser,
  updates: { displayName?: string },
) => {
  const accessToken = await getActiveCustomerAccessToken();
  if (!accessToken) {
    throw new Error('No active customer session to update profile.');
  }

  const displayName = normalizeText(updates.displayName);
  const response = await requestSupabaseAuth<SupabaseAuthUserPayload>(
    '/auth/v1/user',
    {
      method: 'PUT',
      body: JSON.stringify({
        data: {
          display_name: displayName || undefined,
        },
      }),
    },
    accessToken,
  );

  const nextUser = toAuthUser(response) || {
    ...user,
    displayName: displayName || user.displayName,
  };

  applySession(
    currentSession
      ? {
          ...currentSession,
          user: nextUser,
        }
      : null,
  );

  return { user: nextUser };
};

export class GoogleAuthProvider {}

export const signInWithGoogle = async (): Promise<{ user: CustomerAuthUser }> => {
  if (typeof window === 'undefined') {
    throw new Error('Google sign-in is only available in the browser.');
  }

  const redirectUrl = new URL(window.location.href);
  redirectUrl.hash = '';

  const authorizeUrl = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
  authorizeUrl.searchParams.set('provider', 'google');
  authorizeUrl.searchParams.set('redirect_to', redirectUrl.toString());

  window.location.assign(authorizeUrl.toString());
  return new Promise<{ user: CustomerAuthUser }>(() => {});
};

export const auth = {
  get currentUser() {
    return currentUser;
  },
  onAuthStateChanged(callback: (user: CustomerAuthUser | null) => void) {
    let didEmit = false;
    const wrapped = (user: CustomerAuthUser | null) => {
      didEmit = true;
      callback(user);
    };

    listeners.add(wrapped);
    void ensureCustomerAuthInitialized().finally(() => {
      if (!didEmit && listeners.has(wrapped)) {
        wrapped(currentUser);
      }
    });

    return () => {
      listeners.delete(wrapped);
    };
  },
  async signOut() {
    const accessToken = currentSession?.accessToken;
    applySession(null);
    if (!accessToken) {
      return;
    }

    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.warn('[CustomerAuth] logout cleanup failed:', error);
    }
  },
};

export const app = { provider: 'supabase-auth' } as const;
export const db = {} as const;
export const storage = {} as const;
export const functions = {} as const;
