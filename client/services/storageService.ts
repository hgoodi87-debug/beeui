
// ============================================================
// Supabase 전용 storageService (Firebase Firestore 완전 제거)
// Firebase → Supabase 어댑터 레이어로 기존 147개 호출 호환
// ============================================================
import { getSupabaseBaseUrl, resolveSupabaseEndpoint, resolveSupabaseUrl } from './supabaseRuntime';

// Firebase Storage 완전 제거 — Supabase Storage 사용
// storage, ref, uploadBytes, getDownloadURL 모두 Supabase 어댑터로 대체
const storage = {} as any; // 더미
const ref = (_s: any, path: string) => ({ _path: path });
const uploadBytes = async (storageRef: any, file: Blob | ArrayBuffer, _metadata?: any) => {
  // Supabase Storage signed upload
  const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
  const bucket = 'brand-public';
  const path = storageRef._path;
  const res = await fetch(resolveSupabaseUrl(`/storage/v1/object/${bucket}/${path}`), {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': (file as File).type || 'application/octet-stream',
    },
    body: file,
  });
  if (!res.ok) throw new Error(`Supabase Storage upload failed [${res.status}]`);
  return res;
};
const getDownloadURL = async (storageRef: any): Promise<string> => {
  const bucket = 'brand-public';
  return resolveSupabaseUrl(`/storage/v1/object/public/${bucket}/${storageRef._path}`);
};

// Firebase Firestore 어댑터 — 기존 코드의 147개 호출을 Supabase로 라우팅
import { 
  isSupabaseDataEnabled as _sbEnabled, 
  supabaseGet as _sbGet, 
  supabaseMutate as _sbMutate, 
  snakeToCamel, 
  camelToSnake,
  isSupabaseDataEnabled,
  supabaseGet,
  supabaseMutate,
  supabasePollingSubscribe
} from './supabaseClient';
import { getActiveAdminRequestHeaders, isSupabaseAdminAuthEnabled } from './adminAuthService';

// Firestore 컬렉션 → Supabase 테이블 매핑
const COLLECTION_MAP: Record<string, string> = {
  'bookings': 'booking_details',
  'archived_bookings': 'booking_details',
  'locations': 'locations',
  'admins': 'employees',
  'daily_closings': 'daily_closings',
  'expenditures': 'expenditures',
  'inquiries': 'partnership_inquiries',
  'branch_prospects': 'branch_prospects',
  'notices': 'system_notices',
  'promo_codes': 'discount_codes',
  'chat_sessions': 'chat_sessions',
  'chats': 'chat_messages',
  'branches': 'branches',
  'users': 'customers',
  'userCoupons': 'user_coupons',
  'tips_areas': 'cms_areas',
  'tips_themes': 'cms_themes',
  'tips_contents': 'cms_contents',
  'settings': 'app_settings',
};

// settings 컬렉션은 key 기반 조회 (id가 아님)
const KEY_BASED_TABLES = new Set(['app_settings']);

const _mapTable = (col: string): string => COLLECTION_MAP[col] || col;

// Supabase 어댑터: Firestore API 시뮬레이션
const db = {} as any; // 더미 — doc(db, ...) 호출에서 첫 인자로만 사용

type DocRef = { _table: string; _id: string; id: string };
type CollRef = { _table: string };
type QueryRef = { _table: string; _filters: string; _orderBy: string; _limit: number };
type SnapDoc = { id: string; data: () => any; ref: DocRef };
type QuerySnap = { docs: SnapDoc[]; empty: boolean; size: number };

const doc = (_db: any, colName: string, docId?: string): DocRef => ({
  _table: _mapTable(colName),
  _id: docId || '',
  id: docId || '',
});

const collection = (_db: any, colName: string): CollRef => ({
  _table: _mapTable(colName),
});

const query = (colRef: CollRef | any, ...constraints: any[]): QueryRef => {
  let filters = '';
  let ob = 'created_at.desc';
  let lim = 1000;
  for (const c of constraints) {
    if (c?._type === 'where') filters += `&${c._field}=${c._op}.${encodeURIComponent(c._value)}`;
    if (c?._type === 'orderBy') ob = `${c._field}.${c._dir}`;
    if (c?._type === 'limit') lim = c._n;
  }
  return { _table: colRef._table, _filters: filters, _orderBy: ob, _limit: lim };
};

const where = (field: string, op: string, value: any) => {
  const opMap: Record<string, string> = { '==': 'eq', '!=': 'neq', '>': 'gt', '>=': 'gte', '<': 'lt', '<=': 'lte' };
  return { _type: 'where', _field: camelToSnakeField(field), _op: opMap[op] || 'eq', _value: value };
};

const orderBy = (field: string, dir: string = 'asc') => ({ _type: 'orderBy', _field: camelToSnakeField(field), _dir: dir });
const limit = (n: number) => ({ _type: 'limit', _n: n });
const or = (...args: any[]) => args[0]; // 간소화

const camelToSnakeField = (f: string) => f.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);

const _rowToSnapDoc = (table: string, row: Record<string, unknown>): SnapDoc => ({
  id: String(row.id || row.short_code || ''),
  data: () => snakeToCamel(row),
  ref: { _table: table, _id: String(row.id || ''), id: String(row.id || '') },
});

const getDocs = async (ref: CollRef | QueryRef): Promise<QuerySnap> => {
  const table = ref._table;
  const qr = ref as QueryRef;
  const path = `${table}?select=*${qr._filters || ''}&order=${qr._orderBy || 'created_at.desc'}&limit=${qr._limit || 1000}`;
  try {
    const rows = await _sbGet<Array<Record<string, unknown>>>(path);
    const docs = (rows || []).map(r => _rowToSnapDoc(table, r));
    return { docs, empty: docs.length === 0, size: docs.length };
  } catch (e) {
    console.warn(`[Adapter] getDocs ${table} failed:`, e);
    return { docs: [], empty: true, size: 0 };
  }
};

const getDoc = async (ref: DocRef): Promise<{ exists: () => boolean; data: () => any; id: string }> => {
  try {
    // key 기반 테이블 (app_settings) → key 컬럼으로 조회
    const isKeyBased = KEY_BASED_TABLES.has(ref._table);
    const filterCol = isKeyBased ? 'key' : 'id';
    const rows = await _sbGet<Array<Record<string, unknown>>>(
      `${ref._table}?select=*&${filterCol}=eq.${encodeURIComponent(ref._id)}&limit=1`
    );
    if (rows?.[0]) {
      // app_settings는 value jsonb를 바로 반환
      if (isKeyBased && rows[0].value && typeof rows[0].value === 'object') {
        return { exists: () => true, data: () => rows[0].value, id: String(rows[0].key || ref._id) };
      }
      return { exists: () => true, data: () => snakeToCamel(rows[0]), id: String(rows[0].id) };
    }
  } catch (e) { console.warn(`[Adapter] getDoc ${ref._table} failed:`, e); }
  return { exists: () => false, data: () => null, id: '' };
};

const setDoc = async (ref: DocRef, data: any, options?: any) => {
  try {
    const isKeyBased = KEY_BASED_TABLES.has(ref._table);
    if (isKeyBased && ref._id) {
      // app_settings → key 기반 upsert, value에 jsonb 저장
      await _sbMutate(`${ref._table}?key=eq.${encodeURIComponent(ref._id)}`, 'PATCH', { value: data });
    } else if (ref._id) {
      const snakeData = camelToSnake(JSON.parse(JSON.stringify(data)));
      await _sbMutate(`${ref._table}?id=eq.${ref._id}`, 'PATCH', snakeData);
    } else {
      const snakeData = camelToSnake(JSON.parse(JSON.stringify(data)));
      await _sbMutate(ref._table, 'POST', snakeData);
    }
  } catch (e) { console.warn(`[Adapter] setDoc ${ref._table} failed:`, e); }
};

const addDoc = async (colRef: CollRef, data: any) => {
  try {
    const snakeData = camelToSnake(JSON.parse(JSON.stringify(data)));
    const result = await _sbMutate<Array<Record<string, unknown>>>(colRef._table, 'POST', snakeData);
    const id = Array.isArray(result) && result[0] ? String(result[0].id) : '';
    return { id };
  } catch (e) {
    console.warn(`[Adapter] addDoc ${colRef._table} failed:`, e);
    return { id: '' };
  }
};

const updateDoc = async (ref: DocRef, data: any) => {
  try {
    const snakeData = camelToSnake(JSON.parse(JSON.stringify(data)));
    await _sbMutate(`${ref._table}?id=eq.${ref._id}`, 'PATCH', snakeData);
  } catch (e) { console.warn(`[Adapter] updateDoc ${ref._table} failed:`, e); }
};

const deleteDoc = async (ref: DocRef) => {
  try {
    await _sbMutate(`${ref._table}?id=eq.${ref._id}`, 'DELETE');
  } catch (e) { console.warn(`[Adapter] deleteDoc ${ref._table} failed:`, e); }
};

const onSnapshot = (ref: any, callback: (snap: any) => void, errorCb?: (err: any) => void): (() => void) => {
  // Supabase polling으로 대체
  const table = ref._table;
  const qr = ref as QueryRef;

  // DocRef인 경우 (단일 문서 구독 — heroConfig 등)
  if (ref._id) {
    let active = true;
    const isKeyBased = KEY_BASED_TABLES.has(table);
    const filterCol = isKeyBased ? 'key' : 'id';
    const pollDoc = async () => {
      if (!active) return;
      try {
        const rows = await _sbGet<Array<Record<string, unknown>>>(
          `${table}?select=*&${filterCol}=eq.${encodeURIComponent(ref._id)}&limit=1`
        );
        if (active && rows?.[0]) {
          const docData = isKeyBased && rows[0].value ? rows[0].value : snakeToCamel(rows[0]);
          callback({ exists: () => true, data: () => docData, id: ref._id });
        }
      } catch (e) { if (errorCb) errorCb(e); }
    };
    pollDoc();
    const timer = setInterval(pollDoc, 10000);
    return () => { active = false; clearInterval(timer); };
  }

  const path = `${table}?select=*${qr._filters || ''}&order=${qr._orderBy || 'created_at.desc'}&limit=${qr._limit || 500}`;

  let active = true;
  const poll = async () => {
    if (!active) return;
    try {
      const rows = await _sbGet<Array<Record<string, unknown>>>(path);
      if (active && rows) {
        const snap = {
          docs: rows.map(r => _rowToSnapDoc(table, r)),
          empty: rows.length === 0,
          size: rows.length,
        };
        callback(snap);
      }
    } catch (e) {
      if (errorCb) errorCb(e);
    }
  };
  poll();
  const timer = setInterval(poll, 10000);
  return () => { active = false; clearInterval(timer); };
};

const writeBatch = (_db: any) => {
  const ops: Array<() => Promise<void>> = [];
  return {
    set: (ref: DocRef, data: any, opts?: any) => { ops.push(() => setDoc(ref, data, opts)); },
    delete: (ref: DocRef) => { ops.push(() => deleteDoc(ref)); },
    update: (ref: DocRef, data: any) => { ops.push(() => updateDoc(ref, data)); },
    commit: async () => { await Promise.allSettled(ops.map(op => op())); },
  };
};
import { BookingState, BookingStatus, LocationOption, TermsPolicyData, PrivacyPolicyData, QnaData, HeroConfig, PriceSettings, GoogleCloudConfig, PartnershipInquiry, CashClosing, Expenditure, AdminUser, StorageTier, ChatMessage, DiscountCode, ChatSession, TranslatedLocationData, UserProfile, UserCoupon, BranchProspect, ProspectStatus, SystemNotice, AdminRevenueDailySummary, AdminRevenueMonthlySummary } from "../types";
import { LOCATIONS as INITIAL_LOCATIONS } from "../constants";
// (Duplicate imports removed successfully 💅)
import {
  DEFAULT_DELIVERY_PRICES as PRICING_DEFAULT_DELIVERY_PRICES,
  DEFAULT_STORAGE_TIERS as PRICING_DEFAULT_STORAGE_TIERS,
  getTotalBags,
  normalizeDeliveryPrices as normalizeDeliveryPriceSettings,
  normalizeStorageTierPrices,
  sanitizeDeliveryBagSizes
} from '../src/domains/booking/bagCategoryUtils';

// Keys for LocalStorage (Only for minimal config cache if needed, but largely removed)
const KEYS = {
  CLOUD_CONFIG: 'beeliber_cloud_config',
};

const DEFAULT_CLOUD_CONFIG: GoogleCloudConfig = {
  apiKey: "AIzaSyCWCnernI5QA1UGRI080vjlzBEVpevAzt0",
  authDomain: "beeliber-main.firebaseapp.com",
  projectId: "beeliber-main", // [주의] 프로젝트 ID가 불일치할 경우 이 부분을 수정하세요. 💅
  storageBucket: "beeliber-main.firebasestorage.app",
  messagingSenderId: "591358308612",
  appId: "1:591358308612:web:fb3928d12b0e1bb000a051",
  measurementId: "G-PQBL1SG842",
  isActive: true, // Force Active
  enableGeminiAutomation: true,
  // [보안] 클라이언트 웹훅 노출 금지! 🛡️ 세팅은 DB 또는 환경변수(Server)에서 관리합니다.
  googleChatWebhookUrl: ""
};

const LOCAL_ADMIN_DATA_BRIDGE_URL = import.meta.env.VITE_LOCAL_ADMIN_DATA_BRIDGE_URL?.trim() || '';
const LOCAL_ADMIN_DATA_BRIDGE_POLL_MS = 10000;
const SUPABASE_RUNTIME_URL = getSupabaseBaseUrl();
const ADMIN_ACCOUNT_SYNC_ENDPOINT = import.meta.env.VITE_ADMIN_ACCOUNT_SYNC_ENDPOINT?.trim()
  ? resolveSupabaseEndpoint(import.meta.env.VITE_ADMIN_ACCOUNT_SYNC_ENDPOINT, '/functions/v1/admin-account-sync')
  : (SUPABASE_RUNTIME_URL ? `${SUPABASE_RUNTIME_URL}/functions/v1/admin-account-sync` : '');
let localAdminDataBridgeDisabled = false;
const DEFAULT_DELIVERY_PRICES: PriceSettings = PRICING_DEFAULT_DELIVERY_PRICES;
const DEFAULT_STORAGE_TIERS: StorageTier[] = PRICING_DEFAULT_STORAGE_TIERS;

const normalizeDeliveryPrices = (prices: PriceSettings | null | undefined): PriceSettings | null => {
  if (!prices) return null;
  return normalizeDeliveryPriceSettings(prices);
};

const normalizeStorageTiers = (tiers: StorageTier[] | null | undefined): StorageTier[] | null => {
  if (!Array.isArray(tiers) || tiers.length === 0) return null;

  const weeklyTier = tiers.find((tier) => tier.id === 'st-week');
  const weeklyMax = weeklyTier ? Math.max(...Object.values(weeklyTier.prices || { handBag: 0, carrier: 0, strollerBicycle: 0 })) : 0;

  if (weeklyMax > 20000) {
    return DEFAULT_STORAGE_TIERS;
  }

  return tiers.map((tier) => {
    const normalizedPrices = normalizeStorageTierPrices(tier.prices);
    if (tier.id === 'st-4h') return { ...tier, label: '4시간 기본 (Base 4h)', prices: normalizedPrices };
    if (tier.id === 'st-1d') return { ...tier, label: '첫 1일 (24시간)', prices: normalizedPrices };
    if (tier.id === 'st-week') return { ...tier, label: '추가 1일 (Extra Day)', prices: normalizedPrices };
    return tier;
  });
};

const normalizeBookingForDeliveryPolicy = (booking: BookingState): BookingState => {
  if (booking.serviceType !== 'DELIVERY') {
    return booking;
  }

  const bagSizes = sanitizeDeliveryBagSizes(booking.bagSizes);
  const totalBags = getTotalBags(bagSizes);

  return {
    ...booking,
    bagSizes,
    bags: totalBags,
    insuranceBagCount: typeof booking.insuranceBagCount === 'number'
      ? Math.min(booking.insuranceBagCount, totalBags)
      : booking.insuranceBagCount,
  };
};

const normalizeBookingsForDeliveryPolicy = (bookings: BookingState[]): BookingState[] =>
  bookings.map((booking) => normalizeBookingForDeliveryPolicy(booking));

const preferTranslatedValue = (value?: string, fallback?: string) => {
  const trimmedValue = value?.trim();
  if (trimmedValue) return trimmedValue;
  const trimmedFallback = fallback?.trim();
  return trimmedFallback || undefined;
};

const normalizeLocationTranslations = (location: LocationOption): LocationOption => {
  const baseName = location.name?.trim();
  const baseAddress = location.address?.trim();
  const zhName = preferTranslatedValue(location.name_zh, baseName);
  const zhAddress = preferTranslatedValue(location.address_zh, baseAddress);

  return {
    ...location,
    name: baseName || location.name,
    address: baseAddress || location.address,
    name_en: preferTranslatedValue(location.name_en, baseName),
    name_ja: preferTranslatedValue(location.name_ja, baseName),
    name_zh: zhName,
    name_zh_tw: preferTranslatedValue(location.name_zh_tw, zhName),
    name_zh_hk: preferTranslatedValue(location.name_zh_hk, zhName),
    address_en: preferTranslatedValue(location.address_en, baseAddress),
    address_ja: preferTranslatedValue(location.address_ja, baseAddress),
    address_zh: zhAddress,
    address_zh_tw: preferTranslatedValue(location.address_zh_tw, zhAddress),
    address_zh_hk: preferTranslatedValue(location.address_zh_hk, zhAddress),
  };
};

export const canUseLocalLegacyReadBridge = () => {
  if (typeof window === 'undefined') return false;
  if (import.meta.env.MODE === 'test' || import.meta.env.VITEST) return false;
  if (localAdminDataBridgeDisabled) return false;
  const hostname = window.location.hostname;
  return Boolean(LOCAL_ADMIN_DATA_BRIDGE_URL) && (hostname === 'localhost' || hostname === '127.0.0.1');
};

const canUseLocalAdminDataBridge = () => {
  if (!canUseLocalLegacyReadBridge()) return false;
  if (isSupabaseAdminAuthEnabled()) return false;
  return true;
};

const shouldDisableLocalAdminDataBridge = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || '');
  const normalized = message.toLowerCase();

  return (
    normalized.includes('failed to fetch')
    || normalized.includes('networkerror')
    || normalized.includes('err_connection_refused')
    || normalized.includes('fetch failed')
  );
};

const canUseSupabaseAdminAccountSync = () =>
  isSupabaseAdminAuthEnabled() &&
  !canUseLocalAdminDataBridge() &&
  import.meta.env.MODE !== 'test' &&
  !import.meta.env.VITEST;

const parseHttpJson = async (response: Response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

const syncSupabaseAdminAccount = async (
  method: 'POST' | 'DELETE',
  payload: Record<string, unknown>
) => {
  if (!ADMIN_ACCOUNT_SYNC_ENDPOINT) {
    throw new Error('Supabase admin account sync endpoint is not configured.');
  }
  const authHeaders = await getActiveAdminRequestHeaders();
  const response = await fetch(ADMIN_ACCOUNT_SYNC_ENDPOINT, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  });

  const body = await parseHttpJson(response);
  if (!response.ok) {
    const message =
      typeof body === 'object' && body && 'message' in body
        ? String((body as { message?: string }).message)
        : typeof body === 'object' && body && 'error' in body
          ? String((body as { error?: string }).error)
        : '관리자 계정 동기화 요청에 실패했습니다.';
    throw new Error(message);
  }

  return body;
};

const fetchLocalAdminBridge = async <T>(path: string): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${LOCAL_ADMIN_DATA_BRIDGE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
  } catch (error) {
    if (shouldDisableLocalAdminDataBridge(error)) {
      localAdminDataBridgeDisabled = true;
      console.warn('[StorageService] Local admin data bridge is unreachable. Disabling bridge for this session.');
    }
    throw error;
  }

  if (!response.ok) {
    throw new Error(`Local admin data bridge request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
};

const sortBookingsByPickupDateDesc = (items: BookingState[]) =>
  [...items].sort((a, b) => new Date(b.pickupDate || '').getTime() - new Date(a.pickupDate || '').getTime());

const mergeRecordsById = <T extends { id?: string }>(preferred: T[], fallback: T[]): T[] => {
  const preferredIds = new Set(
    preferred
      .map((item) => String(item.id || '').trim())
      .filter(Boolean)
  );

  return [
    ...preferred,
    ...fallback.filter((item) => {
      const itemId = String(item.id || '').trim();
      return !itemId || !preferredIds.has(itemId);
    }),
  ];
};

const subscribeMergedAdminCollection = <T extends { id?: string }>({
  loadSupabase,
  loadLegacy,
  merge,
  callback,
  label,
  intervalMs = 8000,
}: {
  loadSupabase: () => Promise<T[]>;
  loadLegacy: () => Promise<T[]>;
  merge: (supabaseData: T[], legacyData: T[]) => T[];
  callback: (data: T[]) => void;
  label: string;
  intervalMs?: number;
}) => {
  let active = true;

  const run = async () => {
    let supabaseData: T[] = [];
    let legacyData: T[] = [];

    try {
      supabaseData = await loadSupabase();
    } catch (error) {
      console.warn(`[StorageService] ${label} Supabase poll failed:`, error);
    }

    try {
      legacyData = await loadLegacy();
    } catch (error) {
      console.warn(`[StorageService] ${label} legacy poll failed:`, error);
    }

    if (!active) return;
    callback(merge(supabaseData, legacyData));
  };

  void run();
  const timer = window.setInterval(() => void run(), intervalMs);

  return () => {
    active = false;
    window.clearInterval(timer);
  };
};

const loadSupabaseAdminBookings = async (): Promise<BookingState[]> => {
  if (!isSupabaseDataEnabled()) return [];

  try {
    const rows = await supabaseGet<Array<Record<string, unknown>>>(
      'admin_booking_list_v1?select=*&order=created_at.desc&limit=500'
    );
    return (rows || []).map((row) => snakeToCamel(row) as unknown as BookingState);
  } catch (error) {
    console.warn('[Storage] admin_booking_list_v1 unavailable, falling back to booking_details:', error);
    const rows = await supabaseGet<Array<Record<string, unknown>>>(
      'booking_details?select=*&order=created_at.desc&limit=500'
    );
    return (rows || []).map((row) => snakeToCamel(row) as unknown as BookingState);
  }
};

const loadLegacyAdminBookings = async (): Promise<BookingState[]> => {
  if (canUseLocalLegacyReadBridge()) {
    return fetchLocalAdminBridge<BookingState[]>('/api/collections/bookings');
  }

  if (!isSupabaseDataEnabled()) {
    const querySnapshot = await getDocs(collection(db, "bookings"));
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as BookingState));
  }

  return [];
};

const mergeBookingSources = (supabaseBookings: BookingState[], legacyBookings: BookingState[]) =>
  sortBookingsByPickupDateDesc(
    normalizeBookingsForDeliveryPolicy(mergeRecordsById(supabaseBookings, legacyBookings))
  );

const loadSupabaseCashClosings = async (): Promise<CashClosing[]> => {
  if (!isSupabaseDataEnabled()) return [];

  const rows = await supabaseGet<Array<Record<string, unknown>>>('daily_closings?select=*&order=date.desc&limit=500');
  return (rows || []).map((row) => snakeToCamel(row) as unknown as CashClosing);
};

const loadLegacyCashClosings = async (): Promise<CashClosing[]> => {
  if (canUseLocalLegacyReadBridge()) {
    return fetchLocalAdminBridge<CashClosing[]>('/api/collections/daily_closings');
  }

  if (!isSupabaseDataEnabled()) {
    const q = query(collection(db, 'daily_closings'), orderBy('date', 'desc'), limit(500));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ ...doc.data(), id: doc.id } as CashClosing));
  }

  return [];
};

const mergeCashClosingSources = (supabaseData: CashClosing[], legacyData: CashClosing[]) =>
  mergeRecordsById(supabaseData, legacyData);

const loadSupabaseExpenditures = async (): Promise<Expenditure[]> => {
  if (!isSupabaseDataEnabled()) return [];

  const rows = await supabaseGet<Array<Record<string, unknown>>>('expenditures?select=*&order=date.desc&limit=1000');
  return (rows || []).map((row) => snakeToCamel(row) as unknown as Expenditure);
};

const loadLegacyExpenditures = async (): Promise<Expenditure[]> => {
  if (canUseLocalLegacyReadBridge()) {
    return fetchLocalAdminBridge<Expenditure[]>('/api/collections/expenditures');
  }

  if (!isSupabaseDataEnabled()) {
    const q = query(collection(db, 'expenditures'), orderBy('date', 'desc'), limit(1000));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Expenditure));
  }

  return [];
};

const mergeExpenditureSources = (supabaseData: Expenditure[], legacyData: Expenditure[]) =>
  mergeRecordsById(supabaseData, legacyData);

const loadSupabaseAdminRevenueDailySummaries = async (): Promise<AdminRevenueDailySummary[]> => {
  if (!isSupabaseDataEnabled()) return [];

  const rows = await supabaseGet<Array<Record<string, unknown>>>(
    'admin_revenue_daily_v1?select=*&order=date.desc&limit=1000'
  );

  return (rows || []).map((row) => snakeToCamel(row) as unknown as AdminRevenueDailySummary);
};

const loadSupabaseAdminRevenueMonthlySummaries = async (): Promise<AdminRevenueMonthlySummary[]> => {
  if (!isSupabaseDataEnabled()) return [];

  const rows = await supabaseGet<Array<Record<string, unknown>>>(
    'admin_revenue_monthly_v1?select=*&order=month.desc&limit=120'
  );

  return (rows || []).map((row) => snakeToCamel(row) as unknown as AdminRevenueMonthlySummary);
};

const subscribeLocalAdminBridge = <T>(
  path: string,
  callback: (data: T) => void,
  fallback: T,
  transform?: (data: T) => T,
  label?: string
): (() => void) => {
  let active = true;

  const run = async () => {
    try {
      const data = await fetchLocalAdminBridge<T>(path);
      if (!active) return;
      callback(transform ? transform(data) : data);
    } catch (error) {
      console.error(`${label || 'Local admin bridge'} fetch failed:`, error);
      if (!active) return;
      callback(fallback);
    }
  };

  void run();
  const timer = window.setInterval(() => void run(), LOCAL_ADMIN_DATA_BRIDGE_POLL_MS);

  return () => {
    active = false;
    window.clearInterval(timer);
  };
};

// Helper for safe JSON parse (utility)
const safeJsonParse = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch { return fallback; }
};

const runSnapshotFallback = async <T>({
  sourceQuery,
  parser,
  callback,
  label
}: {
  sourceQuery: any;
  parser: (snapshot: any) => T;
  callback: (data: T) => void;
  label: string;
}) => {
  try {
    const snapshot = await getDocs(sourceQuery);
    callback(parser(snapshot));
  } catch (fallbackError) {
    console.error(`${label} fallback failed:`, fallbackError);
  }
};

const normalizeAdminField = (value?: string) => value?.trim().toLowerCase() || '';

const normalizeBranchLookupToken = (value?: string) => value?.trim().toLowerCase() || '';

const mapSupabaseRoleCodeToLegacyRole = (roleCode?: string): AdminUser['role'] => {
  switch ((roleCode || '').trim().toLowerCase()) {
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
    case 'marketing':
    case 'content_manager':
      return 'hq';
    case 'ops_staff':
      return 'staff';
    default:
      return ((roleCode || '').trim().toLowerCase() as AdminUser['role']) || 'staff';
  }
};

const getAdminDirectoryFreshness = (admin: AdminUser) =>
  new Date(
    admin.updatedAt ||
    admin.lastLogin ||
    admin.createdAt ||
    admin.security?.lastLoginAt ||
    0
  ).getTime();

const hasAdminDirectoryPassword = (admin: AdminUser) => String(admin.password || '').trim().length > 0;

const isUidMappedAdminRecord = (admin: AdminUser) => Boolean(admin.uid && admin.uid === admin.id);

const getAdminDirectoryCompleteness = (admin: AdminUser) => ([
  admin.email,
  admin.loginId,
  hasAdminDirectoryPassword(admin) ? 'password' : '',
  admin.phone,
  admin.branchId,
  admin.role,
  admin.orgType,
  admin.memo,
  admin.updatedAt,
  Array.isArray(admin.permissions) && admin.permissions.length > 0 ? 'permissions' : ''
].filter(Boolean).length);

const getAdminDirectoryIdentityKey = (admin: AdminUser) => {
  const name = normalizeAdminField(admin.name);
  const email = normalizeAdminField(admin.email);
  const loginId = normalizeAdminField(admin.loginId);

  // [스봉이] 이름만 같은 애매한 사람까지 합치면 대형 사고니까, 로그인 식별자 있는 경우만 묶어요.
  if (!name || (!email && !loginId)) return '';

  return [
    name,
    email,
    loginId,
    normalizeAdminField(admin.role),
    normalizeAdminField(admin.jobTitle),
    normalizeAdminField(admin.branchId),
    normalizeAdminField(admin.orgType)
  ].join('|');
};

const sortAdminDirectoryCandidates = (left: AdminUser, right: AdminUser) => {
  const credentialDiff = Number(hasAdminDirectoryPassword(right)) - Number(hasAdminDirectoryPassword(left));
  if (credentialDiff !== 0) return credentialDiff;

  const canonicalDiff = Number(isUidMappedAdminRecord(left)) - Number(isUidMappedAdminRecord(right));
  if (canonicalDiff !== 0) return canonicalDiff;

  const completenessDiff = getAdminDirectoryCompleteness(right) - getAdminDirectoryCompleteness(left);
  if (completenessDiff !== 0) return completenessDiff;

  return getAdminDirectoryFreshness(right) - getAdminDirectoryFreshness(left);
};

const collapseAdminDirectoryEntries = (admins: AdminUser[]): AdminUser[] => {
  const grouped = new Map<string, AdminUser[]>();
  const passthrough: AdminUser[] = [];

  admins.forEach((admin) => {
    const key = getAdminDirectoryIdentityKey(admin);
    if (!key) {
      passthrough.push(admin);
      return;
    }

    const existing = grouped.get(key) || [];
    existing.push(admin);
    grouped.set(key, existing);
  });

  const collapsed = [
    ...passthrough,
    ...Array.from(grouped.values()).map((group) => {
      if (group.length === 1) return group[0];
      return [...group].sort(sortAdminDirectoryCandidates)[0];
    })
  ];

  return collapsed.sort((a, b) => getAdminDirectoryFreshness(b) - getAdminDirectoryFreshness(a));
};

export const StorageService = {
  // --- Configuration ---
  saveCloudConfig: (config: GoogleCloudConfig) => {
    localStorage.setItem(KEYS.CLOUD_CONFIG, JSON.stringify(config));
    window.location.reload();
  },

  getCloudConfig: (): GoogleCloudConfig | null => {
    // [스봉이] 로컬 스토리지의 낡은 캐시가 사고를 유발해서, 강제로 기본 설정을 쓰게 바꿨어요! 💅✨
    return { ...DEFAULT_CLOUD_CONFIG, isActive: true };
  },

  uploadFile: async (file: File | Blob, path: string): Promise<string> => {
    try {
      console.log("[Storage] Starting Supabase upload to:", path);

      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      console.log("[Storage] Supabase upload success ✅");
      return await getDownloadURL(storageRef);
    } catch (err: unknown) {
      const e = err as any; // Cast for specific properties access
      console.error("[Storage] Critical Upload Error:", e);
      // Detailed error reporting to user
      let errMsg = e.message || "Unknown error";
      if (e.code === 'storage/unauthenticated') {
        errMsg = "인증되지 않은 사용자입니다. (Anonymous Auth 확인 필요)";
      } else if (e.code === 'storage/unauthorized') {
        errMsg = "업로드 권한이 없습니다. (Storage Rules 확인 필요)";
      } else if (e.code === 'storage/retry-limit-exceeded') {
        errMsg = "업로드 시간이 초과되었습니다. 네트워크 상태를 확인하세요.";
      }

      alert(`[파일 업로드 오류]\n코드: ${e.code}\n메시지: ${errMsg}`);
      throw e;
    }
  },


  // --- Helpers ---
  generateBookingId: (booking: Partial<BookingState>): string => {
    const getCode = (id: string) => INITIAL_LOCATIONS.find(l => l.id === id)?.shortCode || id.substring(0, 3).toUpperCase();

    const originCode = getCode(booking.pickupLocation || 'UNK');
    const destCode = booking.serviceType === 'DELIVERY'
      ? (booking.dropoffLocation ? getCode(booking.dropoffLocation) : (booking.serviceType === 'DELIVERY' ? 'ADDR' : 'UNK'))
      : originCode;

    const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
    return `${originCode}-${destCode}-${randomStr}`;
  },

  // --- Bookings ---
  saveBooking: async (booking: BookingState): Promise<BookingState> => {
    const safeBooking = JSON.parse(JSON.stringify(booking));

    // Supabase 전용 예약 저장 — Edge Function 트리거 자동 발동
    if (isSupabaseDataEnabled()) {
      try {
        console.log("[StorageService] Saving booking to Supabase...");

        const bookingData = {
          sns_channel: safeBooking.snsChannel || null,
          sns_id: safeBooking.snsId || null,
          country: safeBooking.country || null,
          pickup_address: safeBooking.pickupAddress || null,
          pickup_address_detail: safeBooking.pickupAddressDetail || null,
          pickup_date: safeBooking.pickupDate || null,
          pickup_time: safeBooking.pickupTime || null,
          dropoff_address: safeBooking.dropoffAddress || null,
          dropoff_address_detail: safeBooking.dropoffAddressDetail || null,
          dropoff_date: safeBooking.dropoffDate || null,
          delivery_time: safeBooking.deliveryTime || null,
          return_date: safeBooking.returnDate || null,
          return_time: safeBooking.returnTime || null,
          insurance_level: safeBooking.insuranceLevel || null,
          insurance_bag_count: safeBooking.insuranceBagCount || null,
          use_insurance: safeBooking.useInsurance || false,
          base_price: isNaN(Number(safeBooking.price)) ? 0 : Number(safeBooking.price),
          final_price: isNaN(Number(safeBooking.finalPrice)) ? 0 : Number(safeBooking.finalPrice),
          promo_code: safeBooking.promoCode || null,
          discount_amount: safeBooking.discountAmount || 0,
          payment_method: safeBooking.paymentMethod || null,
          payment_provider: safeBooking.paymentProvider || null,
          agreed_to_terms: safeBooking.agreedToTerms || false,
          agreed_to_privacy: safeBooking.agreedToPrivacy || false,
          language: safeBooking.language || 'en',
          image_url: safeBooking.imageUrl || null,
          // Edge Function용 추가 필드
          user_name: safeBooking.userName || null,
          user_email: safeBooking.userEmail || null,
          service_type: safeBooking.serviceType || 'STORAGE',
          pickup_location: safeBooking.pickupLocation || null,
          dropoff_location: safeBooking.dropoffLocation || null,
        };

        const result = await supabaseMutate<Array<Record<string, unknown>>>(
          'booking_details',
          'POST',
          bookingData
        );

        const created = Array.isArray(result) && result[0] ? result[0] : null;
        const reservationCode = created?.reservation_code || safeBooking.reservationCode;

        console.log("[StorageService] Booking saved to Supabase ✅ Edge Function will process.");

        // 폴링: Edge Function이 reservation_code를 생성할 때까지 대기
        return new Promise((resolve, reject) => {
          let pollCount = 0;
          const bookingId = String(created?.id || '');

          const pollTimer = setInterval(async () => {
            pollCount++;
            if (pollCount > 20) {
              clearInterval(pollTimer);
              // 타임아웃이어도 예약은 저장됨 — 코드만 나중에 표시
              resolve({
                ...safeBooking,
                id: bookingId,
                reservationCode: reservationCode || bookingId.substring(0, 12),
                status: '접수완료' as any,
              });
              return;
            }
            try {
              if (!bookingId) return;
              const rows = await supabaseGet<Array<Record<string, unknown>>>(
                `booking_details?select=reservation_code&id=eq.${bookingId}&limit=1`
              );
              if (rows?.[0]?.reservation_code) {
                clearInterval(pollTimer);
                resolve({
                  ...safeBooking,
                  id: bookingId,
                  reservationCode: String(rows[0].reservation_code),
                  status: '접수완료' as any,
                });
              }
            } catch (e) {
              console.warn("[StorageService] Poll failed:", e);
            }
          }, 1000);
        });

      } catch (supabaseErr) {
        console.error("[StorageService] Supabase booking save failed, falling back to Firebase:", supabaseErr);
        // Firebase 폴백 아래로 진행
      }
    }

    // Firebase 폴백 (Supabase 실패 시에만)
    try {
      const { auth, ensureAuth, db } = await import('../firebaseApp');
      const { collection, doc, setDoc } = await import('firebase/firestore');

      let currentUser: any = null;
      let authAttempts = 0;
      while (!currentUser && authAttempts < 3) {
        authAttempts++;
        try { currentUser = await ensureAuth(); } catch (authErr: any) {
          if (authAttempts >= 3) throw authErr;
          await new Promise(r => setTimeout(r, 500 * authAttempts));
        }
      }

      const bookingOwnerUid = safeBooking.userId || auth.currentUser?.uid || currentUser?.uid;
      if (!bookingOwnerUid) throw new Error('예약 저장용 사용자 인증을 확인하지 못했습니다.');
      safeBooking.userId = bookingOwnerUid;

      const docRef = safeBooking.id ? doc(db, 'bookings', safeBooking.id) : doc(collection(db, 'bookings'));
      safeBooking.id = docRef.id;

      console.log("[StorageService] Initiating Event-Driven Booking flow... docId:", docRef.id);

      return new Promise((resolve, reject) => {
        let isResolved = false;
        let pollTimer: ReturnType<typeof setInterval> | null = null;
        let transientReadFailures = 0;
        let pollCount = 0;

        const finish = (handler: () => void) => {
          if (isResolved) return;
          isResolved = true;
          clearTimeout(timeoutId);
          if (pollTimer) clearInterval(pollTimer);
          handler();
        };

        // [스봉이] CF 미트리거 폴백: 12초 이상 SERVER_VALIDATION_PENDING 유지 시 클라이언트에서 직접 확정 💅
        const tryClientFallbackConfirm = async () => {
          try {
            const snap = await getDoc(docRef);
            if (!snap.exists()) return false;
            const data = snap.data();
            if (data.status === 'SERVER_VALIDATION_PENDING') {
              console.warn('[StorageService] Cloud Function did not trigger within expected window. Applying client fallback... 💅');
              const { updateDoc } = await import('firebase/firestore');
              await updateDoc(docRef, { status: '접수완료' });
              const updatedSnap = await getDoc(docRef as any);
              const updatedData = updatedSnap.exists() ? updatedSnap.data() : data;
              finish(() => resolve({ ...(updatedData as BookingState), id: docRef.id, status: '접수완료' as any }));
              return true;
            }
            return false;
          } catch (fallbackErr) {
            console.error('[StorageService] Client fallback confirm failed:', fallbackErr);
            return false;
          }
        };

        const inspectBookingStatus = async () => {
          pollCount++;
          try {
            const snap = await getDoc(docRef as any);
            if (!snap.exists()) return;

            const data = snap.data();
            if (data.status === '접수완료') {
              console.log("[StorageService] Backend validation successful! 🎉", data);
              finish(() => resolve({ ...(data as BookingState), id: snap.id }));
              return;
            }

            if (data.status === 'ERROR' || data.status === '예약실패') {
              console.error("[StorageService] Backend validation failed! 🚨", data);
              finish(() => reject(new Error(data.error || '예약 검증 중 오류가 발생했습니다.')));
              return;
            }

            // [스봉이] CF가 15초 이상 안 오면 클라이언트 폴백 시도 💅
            if (data.status === 'SERVER_VALIDATION_PENDING' && pollCount >= 18) {
              await tryClientFallbackConfirm();
            }
          } catch (err: any) {
            const isPermissionRace = err?.code === 'permission-denied'
              || err?.message?.includes('Missing or insufficient permissions');

            if (isPermissionRace && transientReadFailures < 10) {
              transientReadFailures += 1;
              console.warn('[StorageService] Booking confirmation read raced auth propagation. Retrying...', transientReadFailures);
              return;
            }

            // [스봉이] permission-denied가 계속 나면 토큰 리프레시 시도 후 한 번 더 💅
            if (isPermissionRace && transientReadFailures === 10) {
              try {
                const freshUser = await ensureAuth();
                if (freshUser) {
                  await freshUser.getIdToken(true);
                  transientReadFailures++; // 11 — 한 번만 추가 시도
                  console.warn('[StorageService] Token refreshed. Giving one more chance...');
                  return;
                }
              } catch (_) { /* 최후 시도 실패 */ }
            }

            finish(() => reject(err));
          }
        };

        const timeoutId = setTimeout(async () => {
          // [스봉이] 타임아웃 직전 마지막으로 클라이언트 폴백 시도 💅
          const rescued = await tryClientFallbackConfirm();
          if (!rescued) {
            finish(() => reject(new Error('예약 저장 확인이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.')));
          }
        }, 30000);

        // [스봉이] Firestore는 NaN을 보면 화를 내요. 깍쟁이처럼 깨끗하게 씻겨서 보내야죠 💅
        const cleanData = (obj: any): any => {
          const newObj = { ...obj };
          Object.keys(newObj).forEach(key => {
            if (newObj[key] === undefined) delete newObj[key];
            else if (typeof newObj[key] === 'number' && isNaN(newObj[key])) newObj[key] = 0;
            else if (newObj[key] !== null && typeof newObj[key] === 'object') newObj[key] = cleanData(newObj[key]);
          });
          return newObj;
        };

        const finalizedBooking = cleanData({
          ...safeBooking,
          status: 'SERVER_VALIDATION_PENDING',
          price: isNaN(Number(safeBooking.price)) ? 0 : Number(safeBooking.price),
          finalPrice: isNaN(Number(safeBooking.finalPrice)) ? 0 : Number(safeBooking.finalPrice),
          createdAt: new Date().toISOString()
        });

        // Write the request to trigger the backend Cloud Function
        // [스봉이] 듀얼 라이트 제거! 이 Firebase 폴백 경로는 Supabase 실패 시에만 도달하므로,
        // 또다시 Supabase에 쓰면 중복 Edge Function 트리거(바우처 2번 발송)가 됩니다. 💅
        setDoc(docRef, finalizedBooking).then(() => {
          console.log("[StorageService] Firebase booking saved. Supabase dual-write disabled to prevent duplicate vouchers.");
        }).catch(err => {
          finish(() => reject(err));
        });

        // [스봉이] 첫 폴링은 1초 뒤부터 — 쓰기가 전파되기 전에 읽으면 허탕이에요 💅
        setTimeout(() => {
          void inspectBookingStatus();
          pollTimer = setInterval(() => {
            void inspectBookingStatus();
          }, 800);
        }, 1000);
      });

    } catch (e: any) {
      console.error("Cloud Save Failed (Booking via API):", e);
      // Log more details if it's a Firebase error
      if (e.code) console.error("Firebase Error Code:", e.code);
      if (e.details) console.error("Firebase Error Details:", e.details);
      throw e;
    }
  },

  getBookings: async (): Promise<BookingState[]> => {
    let supabaseBookings: BookingState[] = [];
    let legacyBookings: BookingState[] = [];

    try {
      supabaseBookings = await loadSupabaseAdminBookings();
      if (supabaseBookings.length > 0) {
        console.log(`[Storage] Loaded ${supabaseBookings.length} bookings from Supabase admin view ✅`);
      }
    } catch (e) {
      console.warn("[Storage] Supabase booking view fetch failed", e);
    }

    try {
      legacyBookings = await loadLegacyAdminBookings();
      if (legacyBookings.length > 0) {
        console.log(`[Storage] Loaded ${legacyBookings.length} legacy bookings ✅`);
      }
    } catch (e) {
      console.error("[Storage] Legacy booking fetch failed", e);
    }

    const merged = mergeBookingSources(supabaseBookings, legacyBookings);
    console.log(`[Storage] Merged result: ${merged.length} total bookings 💅`);
    return merged;
  },

  getBookingsByDate: async (date: string): Promise<BookingState[]> => {
    try {
      const q = query(collection(db, "bookings"), where("pickupDate", "==", date));
      const querySnapshot = await getDocs(q);
      return normalizeBookingsForDeliveryPolicy(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BookingState)));
    } catch (e) {
      console.error("Error fetching bookings by date", e);
      return [];
    }
  },

  getArchivedBookings: async (): Promise<BookingState[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, "archived_bookings"));
      return normalizeBookingsForDeliveryPolicy(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BookingState)));
    } catch (e) {
      console.error("Error fetching archived bookings", e);
      return [];
    }
  },

  getBookingsByCreationDate: async (date: string): Promise<BookingState[]> => {
    try {
      const q = query(collection(db, "bookings"), where("createdAt", ">=", date), where("createdAt", "<", date + 'z'));
      const querySnapshot = await getDocs(q);
      return normalizeBookingsForDeliveryPolicy(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BookingState)));
    } catch (e) {
      console.error("Error fetching bookings by creation date", e);
      return [];
    }
  },

  getBooking: async (id: string): Promise<BookingState | null> => {
    try {
      if (!id) return null;
      if (isSupabaseDataEnabled()) {
        try {
          const byId = await supabaseGet<Array<Record<string, unknown>>>(
            `admin_booking_list_v1?select=*&id=eq.${encodeURIComponent(id)}&limit=1`
          );
          if (byId?.[0]) {
            return normalizeBookingForDeliveryPolicy(snakeToCamel(byId[0]) as unknown as BookingState);
          }

          const byReservationCode = await supabaseGet<Array<Record<string, unknown>>>(
            `admin_booking_list_v1?select=*&reservation_code=eq.${encodeURIComponent(id)}&limit=1`
          );
          if (byReservationCode?.[0]) {
            return normalizeBookingForDeliveryPolicy(snakeToCamel(byReservationCode[0]) as unknown as BookingState);
          }
        } catch (viewError) {
          console.warn('[Storage] admin_booking_list_v1 single fetch failed, falling back to booking_details:', viewError);
        }
      }

      const snap = await getDoc(doc(db, "bookings", id));
      if (snap.exists()) {
        return normalizeBookingForDeliveryPolicy({ ...snap.data(), id: snap.id } as BookingState);
      }

      // Try searching by reservationCode if direct ID fails 🛡️
      const q = query(collection(db, "bookings"), where("reservationCode", "==", id), limit(1));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const doc = querySnap.docs[0];
        return normalizeBookingForDeliveryPolicy({ ...doc.data(), id: doc.id } as BookingState);
      }

      return null;
    } catch (e) {
      console.error("Error fetching single booking:", e);
      return null;
    }
  },

  subscribeBookings: (callback: (data: BookingState[]) => void): (() => void) => {
    if (isSupabaseDataEnabled() || canUseLocalLegacyReadBridge()) {
      return subscribeMergedAdminCollection<BookingState>({
        loadSupabase: loadSupabaseAdminBookings,
        loadLegacy: loadLegacyAdminBookings,
        merge: mergeBookingSources,
        callback,
        label: 'Bookings',
        intervalMs: 8000,
      });
    }

    const q = query(collection(db, "bookings"), orderBy("pickupDate", "desc"), limit(500));
    return onSnapshot(q, (snapshot: any) => {
      const items = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as BookingState));
      callback(sortBookingsByPickupDateDesc(normalizeBookingsForDeliveryPolicy(items)));
    }, (error: any) => console.error('Bookings sub error', error));
  },

  subscribeBookingsByLocation: (locationId: string, callback: (data: BookingState[]) => void): (() => void) => {
    const filterLocationBookings = (items: BookingState[]) =>
      sortBookingsByPickupDateDesc(
        normalizeBookingsForDeliveryPolicy(items).filter((booking) =>
          booking.pickupLocation === locationId ||
          booking.dropoffLocation === locationId ||
          booking.branchId === locationId
        )
      );

    if (isSupabaseDataEnabled() || canUseLocalLegacyReadBridge()) {
      return subscribeMergedAdminCollection<BookingState>({
        loadSupabase: loadSupabaseAdminBookings,
        loadLegacy: loadLegacyAdminBookings,
        merge: (supabaseData, legacyData) => filterLocationBookings(mergeBookingSources(supabaseData, legacyData)),
        callback,
        label: `Location bookings (${locationId})`,
        intervalMs: 8000,
      });
    }

    try {
      console.log(`[Storage] Subscribing to bookings for location: ${locationId}`);
      // OR query: pickupLocation is ID OR dropoffLocation is ID
      const q = query(
        collection(db, "bookings"),
        or(
          where("pickupLocation", "==", locationId),
          where("dropoffLocation", "==", locationId),
          where("branchId", "==", locationId)
        ),
        orderBy("pickupDate", "desc"),
        limit(500)
      );

      return onSnapshot(q, (snapshot: any) => {
        const bookings = normalizeBookingsForDeliveryPolicy(snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as BookingState)));
        // Ensure strictly sorted and filtered in memory as back-up
        const filtered = bookings.filter(b => b.pickupLocation === locationId || b.dropoffLocation === locationId || b.branchId === locationId);
        filtered.sort((a, b) => new Date(b.pickupDate || '').getTime() - new Date(a.pickupDate || '').getTime());
        callback(filtered);
      }, (error) => {
        console.error("Location booking sub error, falling back to all-fetch filter:", error);
        const simpleQ = query(collection(db, "bookings"), orderBy("pickupDate", "desc"), limit(1000));
        void runSnapshotFallback({
          sourceQuery: simpleQ,
          parser: (snapshot: any) => {
            const fallbackBookings = normalizeBookingsForDeliveryPolicy(snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as BookingState)));
            const filtered = fallbackBookings.filter((b: BookingState) => b.pickupLocation === locationId || b.dropoffLocation === locationId || b.branchId === locationId);
            filtered.sort((a: any, b: any) => new Date(b.pickupDate || '').getTime() - new Date(a.pickupDate || '').getTime());
            return filtered;
          },
          callback,
          label: "Location booking subscription"
        });
      });
    } catch (e) {
      console.error("Critical failure in location subscription", e);
      return () => { };
    }
  },

  updateBooking: async (id: string, updates: Partial<BookingState>): Promise<void> => {
    // [스봉이] Supabase 우선 업데이트 — booking_details 테이블 직접 PATCH 💅
    if (isSupabaseDataEnabled()) {
      try {
        const supabaseUpdates = camelToSnake(JSON.parse(JSON.stringify(updates)) as Record<string, unknown>);
        await supabaseMutate(`booking_details?id=eq.${id}`, 'PATCH', supabaseUpdates);
        console.log(`[Storage] Booking ${id} updated in Supabase ✅`);
        return; // Supabase 성공 시 Firebase 건너뜀
      } catch (e) {
        console.warn("[Storage] Supabase booking update failed, falling back to Firebase:", e);
      }
    }
    // Firebase fallback
    const safeUpdates = JSON.parse(JSON.stringify(updates));
    const bookingRef = doc(db, "bookings", id);
    await updateDoc(bookingRef, safeUpdates);
  },

  searchBookingsByEmail: async (email: string): Promise<BookingState[]> => {
    try {
      const q = query(collection(db, "bookings"), where("userEmail", "==", email));
      const querySnapshot = await getDocs(q);
      return normalizeBookingsForDeliveryPolicy(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BookingState)));
    } catch (e) {
      console.error("Search error", e);
      return [];
    }
  },

  searchBookingsByNameAndEmail: async (name: string, email: string): Promise<BookingState[]> => {
    try {
      const q = query(
        collection(db, "bookings"),
        where("userEmail", "==", email),
        where("userName", "==", name)
      );
      const querySnapshot = await getDocs(q);
      return normalizeBookingsForDeliveryPolicy(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BookingState)));
    } catch (e) {
      console.error("Search by name/email error", e);
      return [];
    }
  },

  cancelBooking: async (id: string): Promise<void> => {
    // Supabase Edge Function 호출
    try {
      const SUPABASE_URL = getSupabaseBaseUrl();
      const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/cancel-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ bookingId: id }),
      });
      if (!res.ok) throw new Error(`Cancel failed [${res.status}]`);
      console.log("[Storage] Booking cancelled via Supabase Edge Function ✅");
    } catch (e) {
      console.error("Cancel error:", e);
      throw e;
    }
  },

  // --- Locations ---
  subscribeLocations: (callback: (data: LocationOption[]) => void): (() => void) => {
    // [스봉이] Supabase 폴링 우선 💅
    if (isSupabaseDataEnabled()) {
      const enrichLocation = (loc: LocationOption): LocationOption => {
        const initialLoc = INITIAL_LOCATIONS.find(l => l.id === loc.id);
        if (!initialLoc) return loc;
        const enriched = { ...loc };
        Object.keys(initialLoc).forEach((key) => {
          const k = key as keyof LocationOption;
          if (enriched[k] === undefined || enriched[k] === '' || enriched[k] === null) {
            (enriched as Record<string, any>)[k] = initialLoc[k];
          }
        });
        return enriched;
      };
      return supabasePollingSubscribe<LocationOption>(
        'locations?select=*&is_active=eq.true&order=name',
        (items) => callback(items.map(enrichLocation)),
        (r) => {
          const loc = snakeToCamel(r) as unknown as LocationOption;
          if (!loc.id && (r.short_code || r.id)) {
            (loc as any).id = String(r.short_code || r.id);
          }
          return loc;
        },
        10000
      );
    }

    if (canUseLocalAdminDataBridge()) {
      return subscribeLocalAdminBridge<LocationOption[]>(
        '/api/collections/locations',
        callback,
        [],
        (items) => items.map((cloudLoc) => {
          const initialLoc = INITIAL_LOCATIONS.find(l => l.id === cloudLoc.id);
          if (!initialLoc) return cloudLoc;
          const enriched = { ...cloudLoc };
          Object.keys(initialLoc).forEach((key) => {
            const k = key as keyof LocationOption;
            if (enriched[k] === undefined || enriched[k] === '' || enriched[k] === null) {
              (enriched as Record<string, any>)[k] = initialLoc[k];
            }
          });
          return enriched;
        }),
        'Locations local bridge'
      );
    }

    try {
      console.log('[Storage] Subscribing to locations real-time (Firebase)...');
      return onSnapshot(collection(db, 'locations'), (snap: any) => {
        if (snap.empty) { callback([]); return; }
        const mergedLocations = snap.docs.map((doc: any) => {
          const cloudLoc = { ...doc.data(), id: doc.id } as unknown as LocationOption;
          const initialLoc = INITIAL_LOCATIONS.find(l => l.id === cloudLoc.id);
          if (initialLoc) {
            const enriched = { ...cloudLoc };
            Object.keys(initialLoc).forEach((key) => {
              const k = key as keyof LocationOption;
              if (enriched[k] === undefined || enriched[k] === '' || enriched[k] === null) {
                (enriched as Record<string, any>)[k] = initialLoc[k];
              }
            });
            return enriched;
          }
          return cloudLoc;
        });
        callback(mergedLocations);
      });
    } catch (e) {
      console.error('Failed to subscribe locations', e);
      return () => { };
    }
  },

  getLocations: async (): Promise<LocationOption[]> => {
    let supabaseLocs: LocationOption[] = [];
    let firebaseLocs: LocationOption[] = [];

    const enrichLoc = (loc: LocationOption): LocationOption => {
      const initialLoc = INITIAL_LOCATIONS.find(l => l.id === loc.id);
      if (!initialLoc) return loc;
      const enriched = { ...loc };
      Object.keys(initialLoc).forEach((key) => {
        const k = key as keyof LocationOption;
        if (enriched[k] === undefined || enriched[k] === '' || enriched[k] === null) {
          (enriched as Record<string, any>)[k] = initialLoc[k];
        }
      });
      return enriched;
    };

    // 1. Supabase 조회
    if (isSupabaseDataEnabled()) {
      try {
        const rows = await supabaseGet<Array<Record<string, unknown>>>(
          'locations?select=*&is_active=eq.true&order=name'
        );
        if (rows && rows.length > 0) {
          supabaseLocs = rows.map((row) => {
            const loc = snakeToCamel(row) as unknown as LocationOption;
            if (!loc.id && (row.short_code || row.id)) {
              (loc as any).id = String(row.short_code || row.id);
            }
            return enrichLoc(loc);
          });
          console.log('[Storage] Loaded', supabaseLocs.length, 'locations from Supabase ✅');
        }
      } catch (e) {
        console.warn('[Storage] Supabase locations failed:', e);
      }
    }

    // 2. Firebase 조회 (로컬 브릿지 또는 Supabase 비활성 시만)
    try {
      if (canUseLocalAdminDataBridge()) {
        const items = await fetchLocalAdminBridge<LocationOption[]>('/api/collections/locations');
        firebaseLocs = items.map(enrichLoc);
      } else if (!isSupabaseDataEnabled()) {
        const querySnapshot = await getDocs(collection(db, 'locations'));
        if (!querySnapshot.empty) {
          firebaseLocs = querySnapshot.docs.map(doc => {
            const cloudLoc = { ...doc.data(), id: doc.id } as unknown as LocationOption;
            return enrichLoc(cloudLoc);
          });
        }
      }
      if (firebaseLocs.length > 0) console.log('[Storage] Loaded', firebaseLocs.length, 'locations from Firebase ✅');
    } catch (e) {
      console.error('[Storage] Firebase locations failed:', e);
    }

    // 3. 스마트 병합 (Supabase 우선)
    const supabaseIds = new Set(supabaseLocs.map(l => l.id));
    const merged = [
      ...supabaseLocs,
      ...firebaseLocs.filter(fl => !supabaseIds.has(fl.id))
    ];
    console.log(`[Storage] Merged ${merged.length} locations 💅`);
    return merged;
  },

  syncLocationsWithConstants: async (): Promise<void> => {
    try {
      console.log("[Storage] Starting Full Sync from Constants to DB...");
      const batch = writeBatch(db);

      INITIAL_LOCATIONS.forEach(loc => {
        const locRef = doc(db, "locations", loc.id);
        const dataToSave = JSON.parse(JSON.stringify(loc)); // Deep copy & sanitization

        // [스봉이] Firestore가 싫어하는 NaN, undefined 사전에 차단! 🛡️
        if (dataToSave.lat === undefined || dataToSave.lat === null || isNaN(Number(dataToSave.lat))) {
          delete dataToSave.lat;
        } else {
          dataToSave.lat = Number(dataToSave.lat);
        }

        if (dataToSave.lng === undefined || dataToSave.lng === null || isNaN(Number(dataToSave.lng))) {
          delete dataToSave.lng;
        } else {
          dataToSave.lng = Number(dataToSave.lng);
        }

        // Use setDoc with merge: true to update existing or create new
        batch.set(locRef, dataToSave, { merge: true });
      });

      await batch.commit();
      console.log("[Storage] Full Sync Completed Successfully. ✨");
    } catch (e) {
      console.error("[Storage] Full Sync Failed:", e);
      throw e;
    }
  },

  saveLocation: async (location: LocationOption): Promise<void> => {
    const sanitized = normalizeLocationTranslations({ ...location });
    // [스봉이] Firestore는 NaN을 보면 화를 내요. 깍쟁이처럼 걸러내야죠 💅
    if (sanitized.lat === undefined || sanitized.lat === null || isNaN(Number(sanitized.lat))) {
      delete sanitized.lat;
    } else {
      sanitized.lat = Number(sanitized.lat);
    }

    if (sanitized.lng === undefined || sanitized.lng === null || isNaN(Number(sanitized.lng))) {
      delete sanitized.lng;
    } else {
      sanitized.lng = Number(sanitized.lng);
    }

    const safeLocation = JSON.parse(JSON.stringify(sanitized));

    if (isSupabaseDataEnabled()) {
      try {
        const { id, ...payload } = camelToSnake({ ...safeLocation } as Record<string, unknown>);
        const shortCode = String(payload.short_code || '').trim();
        let mutatedRows: unknown = null;

        if (id) {
          mutatedRows = await supabaseMutate(`locations?id=eq.${encodeURIComponent(String(id))}`, 'PATCH', payload);
        } else if (shortCode) {
          mutatedRows = await supabaseMutate(`locations?short_code=eq.${encodeURIComponent(shortCode)}`, 'PATCH', payload);
        }

        const didUpdateExisting = Array.isArray(mutatedRows) ? mutatedRows.length > 0 : Boolean(mutatedRows);
        if (!didUpdateExisting) {
          await supabaseMutate('locations', 'POST', payload);
        }

        console.log("[Storage] Location saved to Supabase ✅");
      } catch (e) { console.warn("[Storage] Supabase location save failed:", e); }
    }

    try {
      // Allow saving with custom ID if provided, else it's a new doc if no ID? 
      // AdminDashboard usually provides ID.
      if (!safeLocation.id) throw new Error("Location ID required");
      await setDoc(doc(db, "locations", safeLocation.id), safeLocation);
    } catch (e) {
      console.error("Cloud Save Failed (Location):", e);
      throw e;
    }
  },

  deleteLocation: async (id: string): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try {
        await supabaseMutate(`locations?short_code=eq.${encodeURIComponent(id)}`, 'DELETE');
      } catch (e) { console.warn("[Storage] Supabase location delete failed:", e); }
    }
    try {
      await deleteDoc(doc(db, "locations", id));
    } catch (e) {
      console.error("Cloud Delete Failed:", e);
      throw e;
    }
  },

  // --- Storage Tiers ---
  getStorageTiers: async (): Promise<StorageTier[] | null> => {
    // Supabase 우선: app_settings에서 storage_tiers 조회
    if (isSupabaseDataEnabled()) {
      try {
        const rows = await supabaseGet<Array<{ key: string; value: any }>>(
          'app_settings?select=value&key=eq.storage_tiers&limit=1'
        );
        if (rows?.[0]?.value?.tiers) {
          console.log("[Storage] Loaded storage tiers from Supabase ✅");
          return normalizeStorageTiers(rows[0].value.tiers);
        }
      } catch (e) {
        console.warn("[Storage] Supabase storage tiers failed, falling back:", e);
      }
    }

    if (canUseLocalAdminDataBridge()) {
      try {
        return normalizeStorageTiers(await fetchLocalAdminBridge<StorageTier[] | null>('/api/settings/storage_tiers'));
      } catch (e) {
        console.error("Failed to get storage tiers from local admin bridge", e);
        return null;
      }
    }

    try {
      const snap = await getDoc(doc(db, "settings", "storage_tiers"));
      if (snap.exists()) {
        const data = snap.data();
        return normalizeStorageTiers(data.tiers || null);
      }
      return null;
    } catch (e) {
      console.error("Failed to get storage tiers", e);
      return null;
    }
  },

  saveStorageTiers: async (tiers: StorageTier[]): Promise<void> => {
    const normalizedTiers = tiers.map((tier) => ({ ...tier, prices: normalizeStorageTierPrices(tier.prices) }));
    if (isSupabaseDataEnabled()) {
      try {
        const { supabaseMutate } = await import('./supabaseClient');
        await supabaseMutate('app_settings?key=eq.storage_tiers', 'PATCH', { value: { tiers: normalizedTiers } });
        console.log("[Storage] Storage tiers saved to Supabase ✅");
      } catch (e) { console.warn("[Storage] Supabase tiers save failed:", e); }
    }
    try {
      await setDoc(doc(db, "settings", "storage_tiers"), { tiers: normalizedTiers });
    } catch (e) {
      console.error("Failed to save storage tiers", e);
      throw e;
    }
  },

  // --- Hero Config ---
  getHeroConfig: async (): Promise<HeroConfig | null> => {
    // Supabase 우선
    if (isSupabaseDataEnabled()) {
      try {
        const rows = await supabaseGet<Array<{ key: string; value: any }>>(
          'app_settings?select=value&key=eq.hero&limit=1'
        );
        if (rows?.[0]?.value) {
          console.log("[Storage] Loaded hero config from Supabase ✅");
          return rows[0].value as HeroConfig;
        }
      } catch (e) {
        console.warn("[Storage] Supabase hero config failed, falling back:", e);
      }
    }

    if (canUseLocalAdminDataBridge()) {
      try {
        return await fetchLocalAdminBridge<HeroConfig | null>('/api/settings/hero');
      } catch {
        return null;
      }
    }

    try {
      const snap = await getDoc(doc(db, "settings", "hero"));
      return snap.exists() ? snap.data() as HeroConfig : null;
    } catch { return null; }
  },

  // --- Price Settings ---
  getDeliveryPrices: async (): Promise<PriceSettings | null> => {
    // Supabase 우선: app_settings에서 delivery_prices 조회
    if (isSupabaseDataEnabled()) {
      try {
        const rows = await supabaseGet<Array<{ key: string; value: any }>>(
          'app_settings?select=value&key=eq.delivery_prices&limit=1'
        );
        if (rows?.[0]?.value) {
          console.log("[Storage] Loaded delivery prices from Supabase ✅");
          return normalizeDeliveryPrices(rows[0].value as PriceSettings);
        }
      } catch (e) {
        console.warn("[Storage] Supabase delivery prices failed, falling back:", e);
      }
    }

    if (canUseLocalAdminDataBridge()) {
      try {
        return normalizeDeliveryPrices(await fetchLocalAdminBridge<PriceSettings | null>('/api/settings/delivery_prices'));
      } catch (e) {
        console.error("Failed to get delivery prices from local admin bridge", e);
        return null;
      }
    }

    try {
      const snap = await getDoc(doc(db, "settings", "delivery_prices"));
      if (snap.exists()) {
        return normalizeDeliveryPrices(snap.data() as PriceSettings);
      }
      return null;
    } catch (e) {
      console.error("Failed to get delivery prices", e);
      return null;
    }
  },

  saveDeliveryPrices: async (prices: PriceSettings): Promise<void> => {
    const normalized = normalizeDeliveryPrices(prices);
    if (isSupabaseDataEnabled()) {
      try {
        const { supabaseMutate } = await import('./supabaseClient');
        await supabaseMutate('app_settings?key=eq.delivery_prices', 'PATCH', { value: normalized });
        console.log("[Storage] Delivery prices saved to Supabase ✅");
      } catch (e) { console.warn("[Storage] Supabase prices save failed:", e); }
    }
    try {
      await setDoc(doc(db, "settings", "delivery_prices"), normalized);
    } catch (e) {
      console.error("Failed to save delivery prices", e);
      throw e;
    }
  },

  saveHeroConfig: async (config: HeroConfig) => {
    if (isSupabaseDataEnabled()) {
      try {
        const { supabaseMutate } = await import('./supabaseClient');
        await supabaseMutate('app_settings?key=eq.hero', 'PATCH', { value: config });
      } catch (e) { console.warn("[Storage] Supabase hero save failed:", e); }
    }
    try {
      await setDoc(doc(db, "settings", "hero"), config);
    } catch (e) { console.error("Hero save failed", e); }
  },

  subscribeHeroConfig: (callback: (config: HeroConfig | null) => void): (() => void) => {
    if (canUseLocalAdminDataBridge()) {
      return subscribeLocalAdminBridge<HeroConfig | null>(
        '/api/settings/hero',
        callback,
        null,
        undefined,
        'Hero config local bridge'
      );
    }

    try {
      const heroRef = doc(db, "settings", "hero");
      return onSnapshot(heroRef, (snap) => {
        if (snap.exists()) {
          callback(snap.data() as HeroConfig);
        } else {
          callback(null);
        }
      });
    } catch (e) {
      console.error("Failed to subscribe hero config", e);
      return () => { };
    }
  },

  // --- Inquiries ---
  getInquiries: async (): Promise<PartnershipInquiry[]> => {
    let supabaseData: PartnershipInquiry[] = [];
    let firebaseData: PartnershipInquiry[] = [];

    if (isSupabaseDataEnabled()) {
      try {
        const rows = await supabaseGet<Array<Record<string, unknown>>>('partnership_inquiries?select=*&order=created_at.desc');
        if (rows) {
          supabaseData = rows.map(r => snakeToCamel(r) as unknown as PartnershipInquiry);
          console.log('[Storage] Loaded', supabaseData.length, 'inquiries from Supabase \u2705');
        }
      } catch (e) { console.warn('[Storage] Supabase inquiries failed:', e); }
    }

    try {
      if (canUseLocalAdminDataBridge()) {
        firebaseData = await fetchLocalAdminBridge<PartnershipInquiry[]>('/api/collections/inquiries');
      } else if (!isSupabaseDataEnabled()) {
        const querySnapshot = await getDocs(collection(db, 'inquiries'));
        firebaseData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PartnershipInquiry));
      }
      if (firebaseData.length > 0) console.log('[Storage] Loaded', firebaseData.length, 'inquiries from Firebase ✅');
    } catch (e) { console.error('[Storage] Firebase inquiries failed:', e); }

    const supabaseIds = new Set(supabaseData.map(i => i.id));
    const merged = [...supabaseData, ...firebaseData.filter(fi => !supabaseIds.has(fi.id))];
    console.log(`[Storage] Merged ${merged.length} inquiries \ud83d\udc85`);
    return merged;
  },

  subscribeInquiries: (callback: (data: PartnershipInquiry[]) => void): (() => void) => {
    // [스봉이] Supabase 폴링 우선 💅
    if (isSupabaseDataEnabled()) {
      return supabasePollingSubscribe<PartnershipInquiry>(
        'partnership_inquiries?select=*&order=created_at.desc',
        (items) => callback(items),
        (r) => snakeToCamel(r) as unknown as PartnershipInquiry,
        10000
      );
    }

    if (canUseLocalAdminDataBridge()) {
      return subscribeLocalAdminBridge<PartnershipInquiry[]>(
        '/api/collections/inquiries',
        callback,
        [],
        (items) => [...items].sort((a: any, b: any) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()),
        'Inquiries local bridge'
      );
    }

    try {
      const q = query(collection(db, 'inquiries'));
      return onSnapshot(q, (snapshot: any) => {
        const list = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as PartnershipInquiry));
        list.sort((a: any, b: any) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        callback(list);
      }, (error: any) => console.error(error));
    } catch (e) { return () => { }; }
  },

  saveInquiry: async (inquiry: PartnershipInquiry): Promise<void> => {
    const safeInquiry = JSON.parse(JSON.stringify(inquiry));
    if (isSupabaseDataEnabled()) {
      try {
        const { camelToSnake, supabaseMutate } = await import('./supabaseClient');
        await supabaseMutate('partnership_inquiries', 'POST', camelToSnake(safeInquiry));
        console.log("[Storage] Inquiry saved to Supabase ✅");
      } catch (e) { console.warn("[Storage] Supabase inquiry save failed:", e); }
    }
    try {
      if (inquiry.id) {
        await setDoc(doc(db, "inquiries", inquiry.id), safeInquiry);
      } else {
        await addDoc(collection(db, "inquiries"), safeInquiry);
      }
    } catch (e) { throw e; }
  },

  deleteInquiry: async (id: string): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try { await supabaseMutate(`partnership_inquiries?id=eq.${id}`, 'DELETE'); } catch (e) { console.warn(e); }
    }
    try {
      await deleteDoc(doc(db, "inquiries", id));
    } catch (e) {
      console.error("Failed to delete inquiry", e);
      throw e;
    }
  },

  // --- Privacy & Terms ---
  getPrivacyPolicy: async (): Promise<PrivacyPolicyData | null> => {
    if (isSupabaseDataEnabled()) {
      try {
        const rows = await supabaseGet<Array<{ key: string; value: any }>>('app_settings?select=value&key=eq.privacy_policy&limit=1');
        if (rows?.[0]?.value) return rows[0].value as PrivacyPolicyData;
      } catch (e) { console.warn("[Storage] Supabase privacy failed:", e); }
    }
    try {
      const snap = await getDoc(doc(db, "settings", "privacy_policy"));
      return snap.exists() ? snap.data() as PrivacyPolicyData : null;
    } catch { return null; }
  },

  savePrivacyPolicy: async (data: PrivacyPolicyData): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try {
        const { supabaseMutate } = await import('./supabaseClient');
        await supabaseMutate('app_settings?key=eq.privacy_policy', 'PATCH', { value: data });
      } catch (e) { console.warn("[Storage] Supabase privacy save failed:", e); }
    }
    await setDoc(doc(db, "settings", "privacy_policy"), data);
  },

  getTermsPolicy: async (): Promise<TermsPolicyData | null> => {
    if (isSupabaseDataEnabled()) {
      try {
        const rows = await supabaseGet<Array<{ key: string; value: any }>>('app_settings?select=value&key=eq.terms_policy&limit=1');
        if (rows?.[0]?.value) return rows[0].value as TermsPolicyData;
      } catch (e) { console.warn("[Storage] Supabase terms failed:", e); }
    }
    try {
      const snap = await getDoc(doc(db, "settings", "terms_policy"));
      return snap.exists() ? snap.data() as TermsPolicyData : null;
    } catch { return null; }
  },

  saveTermsPolicy: async (data: TermsPolicyData): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try {
        const { supabaseMutate } = await import('./supabaseClient');
        await supabaseMutate('app_settings?key=eq.terms_policy', 'PATCH', { value: data });
      } catch (e) { console.warn("[Storage] Supabase terms save failed:", e); }
    }
    await setDoc(doc(db, "settings", "terms_policy"), data);
  },

  getQnaPolicy: async (): Promise<QnaData | null> => {
    if (isSupabaseDataEnabled()) {
      try {
        const rows = await supabaseGet<Array<{ key: string; value: any }>>('app_settings?select=value&key=eq.qna_policy&limit=1');
        if (rows?.[0]?.value) return rows[0].value as QnaData;
      } catch (e) { console.warn("[Storage] Supabase qna failed:", e); }
    }
    try {
      const snap = await getDoc(doc(db, "settings", "qna_policy"));
      return snap.exists() ? snap.data() as QnaData : null;
    } catch { return null; }
  },

  saveQnaPolicy: async (data: QnaData): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try {
        const { supabaseMutate } = await import('./supabaseClient');
        await supabaseMutate('app_settings?key=eq.qna_policy', 'PATCH', { value: data });
      } catch (e) { console.warn("[Storage] Supabase qna save failed:", e); }
    }
    await setDoc(doc(db, "settings", "qna_policy"), data);
  },

  // Migration support (One-way from legacy local to cloud)
  migrateLocalToCloud: async (): Promise<void> => {
    // No-op or implementation if user wants to push old localstorage data once
    console.log("Migration triggered");
  },

  // --- Accounting / Cash Closing ---
  saveCashClosing: async (closing: CashClosing): Promise<void> => {
    const safeClosing = JSON.parse(JSON.stringify(closing));
    // Supabase 듀얼 라이트
    if (isSupabaseDataEnabled()) {
      try {
        const { camelToSnake } = await import('./supabaseClient');
        const { supabaseMutate } = await import('./supabaseClient');
        await supabaseMutate('daily_closings', 'POST', camelToSnake(safeClosing));
        console.log("[Storage] Cash closing saved to Supabase ✅");
      } catch (e) { console.warn("[Storage] Supabase cash closing save failed:", e); }
    }
    try {
      if (closing.id) {
        await setDoc(doc(db, "daily_closings", closing.id), safeClosing);
      } else {
        await addDoc(collection(db, "daily_closings"), safeClosing);
      }
    } catch (e) {
      console.error("Failed to save cash closing", e);
      throw e;
    }
  },

  getCashClosings: async (): Promise<CashClosing[]> => {
    let supabaseData: CashClosing[] = [];
    let legacyData: CashClosing[] = [];

    try {
      supabaseData = await loadSupabaseCashClosings();
      console.log('[Storage] Loaded', supabaseData.length, 'cash closings from Supabase ✅');
    } catch (e) { console.warn('[Storage] Supabase closings failed:', e); }

    try {
      legacyData = await loadLegacyCashClosings();
      if (legacyData.length > 0) console.log('[Storage] Loaded', legacyData.length, 'cash closings from legacy source ✅');
    } catch (e) { console.error('[Storage] Legacy closings failed:', e); }

    const merged = mergeCashClosingSources(supabaseData, legacyData);
    console.log(`[Storage] Merged ${merged.length} cash closings \ud83d\udc85`);
    return merged;
  },

  subscribeCashClosings: (callback: (data: CashClosing[]) => void): (() => void) => {
    if (isSupabaseDataEnabled() || canUseLocalLegacyReadBridge()) {
      return subscribeMergedAdminCollection<CashClosing>({
        loadSupabase: loadSupabaseCashClosings,
        loadLegacy: loadLegacyCashClosings,
        merge: mergeCashClosingSources,
        callback,
        label: 'Cash closings',
        intervalMs: 10000,
      });
    }

    try {
      const q = query(collection(db, 'daily_closings'), orderBy('date', 'desc'), limit(500));
      return onSnapshot(q, (snapshot: any) => {
        const items = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as CashClosing));
        callback(items);
      }, (error: any) => console.error('Closings sub error', error));
    } catch (e) {
      return () => { };
    }
  },

  clearCashClosings: async (): Promise<void> => {
    try {
      const snap = await getDocs(collection(db, "daily_closings"));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.error("Failed to clear cash closings", e);
      throw e;
    }
  },

  // --- External Notifications ---
  notifyNewBookingInChat: async (booking: BookingState): Promise<void> => {
    // [Server-Side Handled] Notification is now handled by Cloud Functions (sendBookingVoucherFinal)
    // to ensure reliability and avoid CORS issues.
    console.log(`[Storage] Notification for ${booking.id} will be handled by server-side trigger.`);
  },

  // --- Expenditures ---
  saveExpenditure: async (expenditure: Expenditure): Promise<void> => {
    const safeExp = JSON.parse(JSON.stringify(expenditure));
    if (isSupabaseDataEnabled()) {
      try {
        const { camelToSnake, supabaseMutate } = await import('./supabaseClient');
        await supabaseMutate('expenditures', 'POST', camelToSnake(safeExp));
        console.log("[Storage] Expenditure saved to Supabase ✅");
      } catch (e) { console.warn("[Storage] Supabase expenditure save failed:", e); }
    }
    try {
      if (expenditure.id) {
        await setDoc(doc(db, "expenditures", expenditure.id), safeExp);
      } else {
        await addDoc(collection(db, "expenditures"), safeExp);
      }
    } catch (e) {
      console.error("Failed to save expenditure", e);
      throw e;
    }
  },

  getExpenditures: async (): Promise<Expenditure[]> => {
    let supabaseData: Expenditure[] = [];
    let legacyData: Expenditure[] = [];

    try {
      supabaseData = await loadSupabaseExpenditures();
      console.log('[Storage] Loaded', supabaseData.length, 'expenditures from Supabase ✅');
    } catch (e) { console.warn('[Storage] Supabase expenditures failed:', e); }

    try {
      legacyData = await loadLegacyExpenditures();
      if (legacyData.length > 0) console.log('[Storage] Loaded', legacyData.length, 'expenditures from legacy source ✅');
    } catch (e) { console.error('[Storage] Legacy expenditures failed:', e); }

    const merged = mergeExpenditureSources(supabaseData, legacyData);
    console.log(`[Storage] Merged ${merged.length} expenditures \ud83d\udc85`);
    return merged;
  },

  subscribeExpenditures: (callback: (data: Expenditure[]) => void): (() => void) => {
    if (isSupabaseDataEnabled() || canUseLocalLegacyReadBridge()) {
      return subscribeMergedAdminCollection<Expenditure>({
        loadSupabase: loadSupabaseExpenditures,
        loadLegacy: loadLegacyExpenditures,
        merge: mergeExpenditureSources,
        callback,
        label: 'Expenditures',
        intervalMs: 10000,
      });
    }

    try {
      const q = query(collection(db, 'expenditures'), orderBy('date', 'desc'), limit(1000));
      return onSnapshot(q, (snapshot: any) => {
        const items = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as Expenditure));
        callback(items);
      }, (error: any) => console.error('Expenditure sub error', error));
    } catch (e) {
      return () => { };
    }
  },

  getAdminRevenueDailySummaries: async (): Promise<AdminRevenueDailySummary[]> => {
    try {
      return await loadSupabaseAdminRevenueDailySummaries();
    } catch (error) {
      console.warn('[Storage] admin_revenue_daily_v1 fetch failed:', error);
      return [];
    }
  },

  subscribeAdminRevenueDailySummaries: (callback: (data: AdminRevenueDailySummary[]) => void): (() => void) => {
    if (!isSupabaseDataEnabled()) {
      callback([]);
      return () => { };
    }

    return supabasePollingSubscribe<AdminRevenueDailySummary>(
      'admin_revenue_daily_v1?select=*&order=date.desc&limit=1000',
      callback,
      (row) => snakeToCamel(row) as unknown as AdminRevenueDailySummary,
      10000
    );
  },

  getAdminRevenueMonthlySummaries: async (): Promise<AdminRevenueMonthlySummary[]> => {
    try {
      return await loadSupabaseAdminRevenueMonthlySummaries();
    } catch (error) {
      console.warn('[Storage] admin_revenue_monthly_v1 fetch failed:', error);
      return [];
    }
  },

  subscribeAdminRevenueMonthlySummaries: (callback: (data: AdminRevenueMonthlySummary[]) => void): (() => void) => {
    if (!isSupabaseDataEnabled()) {
      callback([]);
      return () => { };
    }

    return supabasePollingSubscribe<AdminRevenueMonthlySummary>(
      'admin_revenue_monthly_v1?select=*&order=month.desc&limit=120',
      callback,
      (row) => snakeToCamel(row) as unknown as AdminRevenueMonthlySummary,
      10000
    );
  },

  // --- Admins (HR) ---
  saveAdmin: async (admin: AdminUser): Promise<void> => {
    const safeAdmin = JSON.parse(JSON.stringify(admin));
    try {
      if (canUseSupabaseAdminAccountSync()) {
        await syncSupabaseAdminAccount('POST', { admin: safeAdmin });
        return;
      }

      if (admin.id) {
        if (!String(safeAdmin.password || '').trim()) {
          delete safeAdmin.password;
        }

        await setDoc(doc(db, "admins", admin.id), safeAdmin, { merge: true });
      } else {
        await addDoc(collection(db, "admins"), safeAdmin);
      }
    } catch (e) {
      console.error("Failed to save admin", e);
      throw e;
    }
  },

  getAdmins: async (): Promise<AdminUser[]> => {
    let supabaseData: AdminUser[] = [];
    let firebaseData: AdminUser[] = [];

    if (isSupabaseDataEnabled()) {
      try {
        const [rows, locationRows, branchRows] = await Promise.all([
          supabaseGet<Array<Record<string, unknown>>>(
            'employees?select=id,profile_id,legacy_admin_doc_id,name,email,job_title,employment_status,org_type,phone,memo,security,login_id,created_at,updated_at,employee_roles(is_primary,role:roles(code,name)),employee_branch_assignments(is_primary,branch_id)&order=name.asc&limit=500'
          ),
          supabaseGet<Array<Record<string, unknown>>>(
            'locations?select=id,name,short_code,branch_code&is_active=eq.true&limit=500'
          ),
          supabaseGet<Array<Record<string, unknown>>>(
            'branches?select=id,branch_code,name&limit=500'
          ),
        ]);
        if (rows && rows.length > 0) {
          const locationByBranchToken = new Map<string, { id: string; name?: string; branchCode?: string }>();
          const branchById = new Map<string, { id: string; branchCode?: string; name?: string }>();
          locationRows.forEach((row) => {
            const id = String(row.id || '').trim();
            if (!id) return;

            const locationEntry = {
              id,
              name: String(row.name || '').trim() || undefined,
              branchCode: String(row.branch_code || row.short_code || '').trim() || undefined,
            };
            const branchCodeToken = normalizeBranchLookupToken(String(row.branch_code || ''));
            const shortCodeToken = normalizeBranchLookupToken(String(row.short_code || ''));
            if (branchCodeToken) locationByBranchToken.set(branchCodeToken, locationEntry);
            if (shortCodeToken) locationByBranchToken.set(shortCodeToken, locationEntry);
          });
          branchRows.forEach((row) => {
            const id = String(row.id || '').trim();
            if (!id) return;

            branchById.set(id, {
              id,
              branchCode: String(row.branch_code || '').trim() || undefined,
              name: String(row.name || '').trim() || undefined,
            });
          });

          supabaseData = rows.map((row) => {
            const employeeRoles = Array.isArray(row.employee_roles) ? row.employee_roles as Array<Record<string, any>> : [];
            const branchAssignments = Array.isArray(row.employee_branch_assignments) ? row.employee_branch_assignments as Array<Record<string, any>> : [];
            const primaryRole = employeeRoles.find((entry) => entry?.is_primary) || employeeRoles[0] || null;
            const primaryBranch = branchAssignments.find((entry) => entry?.is_primary) || branchAssignments[0] || null;
            const roleCode = String(primaryRole?.role?.code || '').trim();
            const assignedBranchId = String(primaryBranch?.branch_id || '').trim();
            const assignedBranch = branchById.get(assignedBranchId);
            const branchCode = String(assignedBranch?.branchCode || '').trim();
            const matchedLocation = locationByBranchToken.get(normalizeBranchLookupToken(branchCode));
            const employeeId = String(row.id || '').trim();
            const profileId = String(row.profile_id || '').trim();
            const legacyAdminDocId = String(row.legacy_admin_doc_id || '').trim();
            const authEmail = String(row.email || '').trim();
            const loginId = String(row.login_id || '').trim();
            const security = row.security && typeof row.security === 'object'
              ? snakeToCamel(row.security as Record<string, unknown>)
              : undefined;

            return {
              id: legacyAdminDocId || employeeId,
              uid: profileId || undefined,
              employeeId: employeeId || undefined,
              profileId: profileId || undefined,
              legacyAdminDocId: legacyAdminDocId || undefined,
              name: String(row.name || '').trim(),
              jobTitle: String(row.job_title || '').trim(),
              email: authEmail || undefined,
              phone: String(row.phone || '').trim() || undefined,
              loginId: loginId || undefined,
              role: mapSupabaseRoleCodeToLegacyRole(roleCode),
              roleCode: roleCode || undefined,
              roleName: String(primaryRole?.role?.name || '').trim() || undefined,
              branchId: matchedLocation?.id || assignedBranchId || undefined,
              branchCode: branchCode || matchedLocation?.branchCode || undefined,
              branchName: matchedLocation?.name || assignedBranch?.name || undefined,
              orgType: String(row.org_type || '').trim() as AdminUser['orgType'],
              status: String(row.employment_status || 'active').trim() as AdminUser['status'],
              security: security as AdminUser['security'],
              memo: String(row.memo || '').trim() || undefined,
              syncStatus: {
                provider: 'supabase',
                status: profileId && employeeId ? 'synced' : (authEmail || loginId ? 'pending' : 'error'),
                syncedAt: String(row.updated_at || row.created_at || '').trim() || undefined,
                profileId: profileId || undefined,
                employeeId: employeeId || undefined,
                authEmail: authEmail || undefined,
                branchCode: branchCode || matchedLocation?.branchCode || undefined,
                syntheticEmail: Boolean((row.security as Record<string, unknown> | undefined)?.synthetic_email),
              },
              createdAt: String(row.created_at || '').trim(),
              updatedAt: String(row.updated_at || '').trim() || undefined,
            } satisfies AdminUser;
          });
          console.log('[Storage] Loaded', supabaseData.length, 'admins from Supabase \u2705');
        }
      } catch (e) { console.warn('[Storage] Supabase admins failed:', e); }
    }

    try {
      if (canUseLocalAdminDataBridge()) {
        const items = await fetchLocalAdminBridge<AdminUser[]>('/api/collections/admins');
        firebaseData = collapseAdminDirectoryEntries(items);
      } else if (!isSupabaseDataEnabled()) {
        const snap = await getDocs(collection(db, 'admins'));
        firebaseData = collapseAdminDirectoryEntries(snap.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as AdminUser)));
      }
      if (firebaseData.length > 0) console.log('[Storage] Loaded', firebaseData.length, 'admins from Firebase ✅');
    } catch (e) { console.error('[Storage] Firebase admins failed:', e); }

    const mergedById = new Map<string, AdminUser>();
    firebaseData.forEach((admin) => {
      mergedById.set(admin.id, admin);
    });

    supabaseData.forEach((admin) => {
      const existing = mergedById.get(admin.id);
      mergedById.set(
        admin.id,
        existing
          ? {
              ...existing,
              ...admin,
              security: {
                ...(existing.security || {}),
                ...(admin.security || {}),
              },
              syncStatus: admin.syncStatus || existing.syncStatus,
            }
          : admin
      );
    });

    const merged = Array.from(mergedById.values()).sort((left, right) =>
      getAdminDirectoryFreshness(right) - getAdminDirectoryFreshness(left)
    );
    console.log(`[Storage] Merged ${merged.length} admins \ud83d\udc85`);
    return merged;
  },

  deleteAdmin: async (id: string): Promise<void> => {
    try {
      if (canUseSupabaseAdminAccountSync()) {
        await syncSupabaseAdminAccount('DELETE', { adminId: id });
        return;
      }

      await deleteDoc(doc(db, "admins", id));
    } catch (e) {
      console.error("Failed to delete admin", e);
      throw e;
    }
  },

  /**
   * [스봉이] 인사관리 중복 데이터 정제 도구 🧹💅
   * 같은 사람으로 식별 가능한 "완전 중복"만 보수적으로 정리합니다.
   */
  deduplicateAdmins: async (): Promise<{ total: number, removed: number }> => {
    try {
      const snap = await getDocs(collection(db, "admins"));
      const admins = snap.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as AdminUser));

      const normalize = (value?: string) => value?.trim().toLowerCase() || '';
      const getFreshness = (admin: AdminUser) => new Date(admin.updatedAt || admin.createdAt || 0).getTime();
      const hasPassword = (admin: AdminUser) => String(admin.password || '').trim().length > 0;
      const isUidMappedRecord = (admin: AdminUser) => Boolean(admin.uid && admin.uid === admin.id);
      const getCompleteness = (admin: AdminUser) => ([
        admin.email,
        admin.loginId,
        hasPassword(admin) ? 'password' : '',
        admin.phone,
        admin.branchId,
        admin.role,
        admin.orgType,
        admin.memo,
        admin.updatedAt,
        Array.isArray(admin.permissions) && admin.permissions.length > 0 ? 'permissions' : ''
      ].filter(Boolean).length);

      const uniqueGroups: Record<string, AdminUser[]> = {};
      admins.forEach(admin => {
        const name = normalize(admin.name);
        const email = normalize(admin.email);
        const loginId = normalize(admin.loginId);

        // [스봉이] 이름만 같거나, 연락 식별자도 없는 애매한 기록은 절대 자동 삭제하면 안 돼요.
        if (!name || (!email && !loginId)) return;

        const key = [
          name,
          email,
          loginId,
          normalize(admin.role),
          normalize(admin.jobTitle),
          normalize(admin.branchId),
          normalize(admin.orgType)
        ].join('|');

        if (!uniqueGroups[key]) uniqueGroups[key] = [];
        uniqueGroups[key].push(admin);
      });

      const idsToRemove: string[] = [];

      for (const key in uniqueGroups) {
        const group = uniqueGroups[key];
        if (group.length <= 1) continue;

        group.sort((a, b) => {
          const credentialDiff = Number(hasPassword(b)) - Number(hasPassword(a));
          if (credentialDiff !== 0) return credentialDiff;

          const canonicalDiff = Number(isUidMappedRecord(a)) - Number(isUidMappedRecord(b));
          if (canonicalDiff !== 0) return canonicalDiff;

          const completenessDiff = getCompleteness(b) - getCompleteness(a);
          if (completenessDiff !== 0) return completenessDiff;
          return getFreshness(b) - getFreshness(a);
        });

        group.slice(1).forEach(admin => {
          if (admin.id) idsToRemove.push(admin.id);
        });
      }

      // [스봉이] 혹시라도 정리 후보가 비정상적으로 많으면 자동 삭제를 막아서 전멸 사고를 차단합니다.
      const safetyThreshold = Math.max(20, Math.floor(admins.length * 0.6));
      if (idsToRemove.length > safetyThreshold) {
        throw new Error(`중복 정리 후보가 너무 많아 자동 삭제를 차단했습니다. (${idsToRemove.length}건)`);
      }

      if (idsToRemove.length === 0) {
        return { total: admins.length, removed: 0 };
      }

      const batchSize = 450;
      for (let i = 0; i < idsToRemove.length; i += batchSize) {
        const currentBatch = writeBatch(db);
        idsToRemove.slice(i, i + batchSize).forEach((id) => {
          currentBatch.delete(doc(db, "admins", id));
        });
        await currentBatch.commit();
      }

      return { total: admins.length, removed: idsToRemove.length };
    } catch (e) {
      console.error("Deduplication failed", e);
      throw e;
    }
  },

  // --- User Profiles ---
  getUserProfile: async (uid: string): Promise<UserProfile | null> => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (err) {
      console.error("[Storage] Error getting user profile:", err);
      return null;
    }
  },

  updateUserProfile: async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
    try {
      const docRef = doc(db, "users", uid);
      await setDoc(docRef, updates, { merge: true });
    } catch (err) {
      console.error("[Storage] Error updating user profile:", err);
    }
  },

  // --- User Coupons ---
  getUserCoupons: async (uid: string): Promise<UserCoupon[]> => {
    if (isSupabaseDataEnabled()) {
      try {
        const rows = await supabaseGet<Array<Record<string, unknown>>>(
          `user_coupons?select=*&user_id=eq.${encodeURIComponent(uid)}&is_used=eq.false`
        );
        if (rows) {
          return rows.map(r => snakeToCamel(r) as unknown as UserCoupon);
        }
      } catch (e) { console.warn("[Storage] Supabase coupons failed:", e); }
    }
    try {
      const q = query(collection(db, "userCoupons"), where("uid", "==", uid), where("isUsed", "==", false));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as UserCoupon));
    } catch (err) {
      console.error("[Storage] Error getting user coupons:", err);
      return [];
    }
  },

  issueWelcomeCoupon: async (uid: string): Promise<void> => {
    try {
      const q = query(collection(db, "discountCodes"), where("code", "==", "WELCOME"), where("isActive", "==", true));
      const snap = await getDocs(q);
      if (snap.empty) return;

      const discount = snap.docs[0].data() as DiscountCode;
      const coupon: Omit<UserCoupon, 'id'> = {
        uid,
        codeId: snap.docs[0].id || '',
        code: discount.code,
        amountPerBag: discount.amountPerBag,
        description: discount.description,
        isUsed: false,
        issuedAt: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      };
      await addDoc(collection(db, "userCoupons"), coupon);
    } catch (err) {
      console.error("[Storage] Error issuing welcome coupon:", err);
    }
  },

  subscribeAdmins: (callback: (data: AdminUser[]) => void): (() => void) => {
    // [스봉이] Supabase 폴링 우선 💅
    if (isSupabaseDataEnabled()) {
      let active = true;

      const run = async () => {
        try {
          const items = await StorageService.getAdmins();
          if (!active) return;
          callback(items);
        } catch (error) {
          console.error('Supabase admins polling failed:', error);
          if (!active) return;
          callback([]);
        }
      };

      void run();
      const timer = window.setInterval(() => void run(), 10000);
      return () => {
        active = false;
        window.clearInterval(timer);
      };
    }

    if (canUseLocalAdminDataBridge()) {
      return subscribeLocalAdminBridge<AdminUser[]>(
        '/api/collections/admins',
        callback,
        [],
        (items) => collapseAdminDirectoryEntries(items),
        'Admins local bridge'
      );
    }

    try {
      const dbRef = collection(db, 'admins');
      const q = query(dbRef, orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot: any) => {
        const items = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as AdminUser));
        const normalizedItems = collapseAdminDirectoryEntries(items);
        callback(normalizedItems);
      }, (error: any) => {
        console.error('Admins subscription error (likely index missing):', error);
        const simpleQ = query(dbRef, limit(100));
        void runSnapshotFallback({
          sourceQuery: simpleQ,
          parser: (snap: any) => {
            const items = snap.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as AdminUser));
            return collapseAdminDirectoryEntries(items);
          },
          callback,
          label: 'Admins subscription'
        });
      });
    } catch (e) {
      console.error('Admins subscription critical failure:', e);
      return () => { };
    }
  },

  // --- AI Translation Service (Gemini) ---
  translateLocationData: async (data: { name: string; address: string; pickupGuide: string; description: string }): Promise<TranslatedLocationData> => {
    const config = StorageService.getCloudConfig();
    if (!config || !config.apiKey) throw new Error("Google Cloud API Key is missing.");

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.apiKey}`;

    const prompt = `
      Translate the following Korean location information into English (en), Japanese (ja), and Simplified Chinese (zh).
      Provide the result in a strict JSON format with the following keys:
      {
        "name_en": "...", "name_ja": "...", "name_zh": "...",
        "address_en": "...", "address_ja": "...", "address_zh": "...",
        "pickupGuide_en": "...", "pickupGuide_ja": "...", "pickupGuide_zh": "...",
        "description_en": "...", "description_ja": "...", "description_zh": "..."
      }

      Korean Data:
      Name: ${data.name}
      Address: ${data.address}
      Pickup Guide: ${data.pickupGuide}
      Description: ${data.description}
    `;

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });

      const result = await response.json();
      const translatedText = result.candidates[0].content.parts[0].text;
      return JSON.parse(translatedText);
    } catch (e) {
      console.error("[Storage] AI Translation Failed:", e);
      throw e;
    }
  },

  // --- Real-time Chat ---
  saveChatMessage: async (message: ChatMessage): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try {
        await supabaseMutate('chat_messages', 'POST', {
          session_id: message.sessionId, role: message.role || 'user',
          text: message.text || '', user_name: message.userName || null,
          user_email: message.userEmail || null, is_read: message.isRead ?? false,
        });
      } catch (e) { console.warn("[Storage] Supabase chat msg save failed:", e); }
    }
    try {
      const msgRef = collection(db, "chats");
      await addDoc(msgRef, { ...message, timestamp: message.timestamp || new Date().toISOString() });
    } catch (e) { console.error("Failed to save chat message", e); }
  },

  saveChatSession: async (session: ChatSession): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try {
        await supabaseMutate('chat_sessions', 'POST', {
          session_id: session.sessionId, user_name: session.userName || null,
          user_email: session.userEmail || null, last_message: session.lastMessage || null,
          is_bot_disabled: session.isBotDisabled ?? false, unread_count: session.unreadCount || 0,
        });
      } catch (e) { console.warn("[Storage] Supabase chat session save failed:", e); }
    }
    try {
      const sessionRef = doc(db, "chat_sessions", session.sessionId);
      await setDoc(sessionRef, { ...session, timestamp: session.timestamp || new Date().toISOString() }, { merge: true });
    } catch (e) { console.error("Failed to save chat session", e); }
  },

  updateChatSession: async (sessionId: string, updates: Partial<ChatSession>): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try {
        await supabaseMutate(`chat_sessions?session_id=eq.${encodeURIComponent(sessionId)}`, 'PATCH', camelToSnake(updates as Record<string, unknown>));
      } catch (e) { console.warn("[Storage] Supabase chat session update failed:", e); }
    }
    try {
      const sessionRef = doc(db, "chat_sessions", sessionId);
      await updateDoc(sessionRef, updates);
    } catch (e) { console.error("Failed to update chat session", e); }
  },

  subscribeChatMessages: (sessionId: string, callback: (messages: ChatMessage[]) => void): (() => void) => {
    try {
      const q = query(
        collection(db, "chats"),
        where("sessionId", "==", sessionId)
      );
      return onSnapshot(q, (snapshot: any) => {
        const msgs = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as ChatMessage));
        // Client-side sort to avoid composite index requirement
        msgs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        callback(msgs);
      });
    } catch (e) {
      console.error("Chat sub error", e);
      return () => { };
    }
  },

  // For Admin to see all active sessions
  subscribeChatSessions: (callback: (sessions: ChatSession[]) => void): (() => void) => {
    try {
      const q = query(collection(db, "chat_sessions"), limit(100));
      return onSnapshot(q, (snapshot: any) => {
        const items = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as ChatSession));
        // Sort by timestamp descending in memory
        items.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(items);
      });
    } catch (e) {
      console.error("Chat sessions sub error", e);
      return () => { };
    }
  },

  deleteChatSession: async (sessionId: string): Promise<void> => {
    // Supabase 듀얼 삭제 (cascade로 messages도 삭제됨)
    if (isSupabaseDataEnabled()) {
      try {
        await supabaseMutate(`chat_sessions?session_id=eq.${encodeURIComponent(sessionId)}`, 'DELETE');
        console.log(`[Storage] Chat session ${sessionId} deleted from Supabase ✅`);
      } catch (e) { console.warn(e); }
    }
    try {
      // 1. Delete all messages associated with this session
      const q = query(collection(db, "chats"), where("sessionId", "==", sessionId));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // 2. Delete the session document
      await deleteDoc(doc(db, "chat_sessions", sessionId));
      console.log(`[Storage] Deleted chat session: ${sessionId} and all its messages.`);
    } catch (e) {
      console.error("Failed to delete chat session", e);
      throw e;
    }
  },

  // Legacy fallback or internal helper
  subscribeActiveChatSessions: (callback: (sessions: { sessionId: string; userName: string; userEmail: string; lastMessage: string; timestamp: string }[]) => void): (() => void) => {
    try {
      const q = query(collection(db, "chats"), orderBy("timestamp", "desc"), limit(500));
      return onSnapshot(q, (snapshot: any) => {
        const msgs = snapshot.docs.map((doc: any) => doc.data() as ChatMessage);
        const sessionMap = new Map();

        msgs.forEach((m: any) => {
          if (!sessionMap.has(m.sessionId)) {
            sessionMap.set(m.sessionId, {
              sessionId: m.sessionId,
              userName: m.userName || 'Anonymous',
              userEmail: m.userEmail || 'N/A',
              lastMessage: m.text,
              timestamp: m.timestamp
            });
          }
        });

        callback(Array.from(sessionMap.values()).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      });
    } catch (e) {
      console.error("Active sessions sub error", e);
      return () => { };
    }
  },

  // --- Discount Codes ---
  getDiscountCodes: async (): Promise<DiscountCode[]> => {
    // Supabase 우선
    if (isSupabaseDataEnabled()) {
      try {
        const rows = await supabaseGet<Array<Record<string, unknown>>>(
          'discount_codes?select=*&is_active=eq.true'
        );
        if (rows && rows.length > 0) {
          console.log("[Storage] Loaded", rows.length, "discount codes from Supabase ✅");
          return rows.map(r => ({
            id: String(r.id),
            code: String(r.code || ''),
            amountPerBag: Number(r.amount_per_bag || 0),
            description: String(r.description || ''),
            isActive: r.is_active !== false,
            allowedService: String(r.allowed_service || 'ALL'),
          })) as DiscountCode[];
        }
      } catch (e) {
        console.warn("[Storage] Supabase discount codes failed, falling back:", e);
      }
    }

    try {
      const snap = await getDocs(collection(db, "promo_codes"));
      return snap.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as DiscountCode));
    } catch (e) {
      console.error("Failed to get discount codes", e);
      return [];
    }
  },

  saveDiscountCode: async (code: DiscountCode): Promise<void> => {
    const safeData = JSON.parse(JSON.stringify(code));
    if (isSupabaseDataEnabled()) {
      try {
        const { supabaseMutate } = await import('./supabaseClient');
        await supabaseMutate('discount_codes', 'POST', {
          code: safeData.code, amount_per_bag: safeData.amountPerBag || 0,
          description: safeData.description || '', is_active: safeData.isActive !== false,
          allowed_service: safeData.allowedService || 'ALL',
        });
        console.log("[Storage] Discount code saved to Supabase ✅");
      } catch (e) { console.warn("[Storage] Supabase discount save failed:", e); }
    }
    try {
      if (code.id) {
        await setDoc(doc(db, "promo_codes", code.id), safeData);
      } else {
        await addDoc(collection(db, "promo_codes"), safeData);
      }
    } catch (e) {
      console.error("Failed to save discount code", e);
      throw e;
    }
  },

  deleteDiscountCode: async (id: string): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try { await supabaseMutate(`discount_codes?id=eq.${id}`, 'DELETE'); } catch (e) { console.warn(e); }
    }
    try {
      await deleteDoc(doc(db, "promo_codes", id));
    } catch (e) {
      console.error("Failed to delete discount code", e);
      throw e;
    }
  },

  subscribeDiscountCodes: (callback: (data: DiscountCode[]) => void): (() => void) => {
    try {
      const q = query(collection(db, "promo_codes"), orderBy("code", "asc"));
      return onSnapshot(q, (snapshot: any) => {
        const items = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as DiscountCode));
        callback(items);
      }, (error) => {
        console.error("Discount codes sub error", error);
        const simpleQ = query(collection(db, "promo_codes"));
        void runSnapshotFallback({
          sourceQuery: simpleQ,
          parser: (snap) => snap.docs.map((d: any) => ({ ...d.data(), id: d.id } as DiscountCode)),
          callback,
          label: "Discount codes subscription"
        });
      });
    } catch (e) {
      return () => { };
    }
  },

  validateDiscountCode: async (codeStr: string): Promise<DiscountCode | null> => {
    if (isSupabaseDataEnabled()) {
      try {
        const rows = await supabaseGet<Array<Record<string, unknown>>>(
          `discount_codes?select=*&code=eq.${encodeURIComponent(codeStr.toUpperCase())}&is_active=eq.true&limit=1`
        );
        if (rows?.[0]) {
          return { id: String(rows[0].id), code: String(rows[0].code), amountPerBag: Number(rows[0].amount_per_bag || 0), description: String(rows[0].description || ''), isActive: true, allowedService: String(rows[0].allowed_service || 'ALL') } as DiscountCode;
        }
      } catch (e) { console.warn("[Storage] Supabase validate code failed:", e); }
    }
    try {
      const q = query(collection(db, "promo_codes"), where("code", "==", codeStr.toUpperCase()), where("isActive", "==", true));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as DiscountCode;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  // --- Branches ---
  getBranches: async (): Promise<any[]> => {
    if (isSupabaseDataEnabled()) {
      try {
        const rows = await supabaseGet<Array<Record<string, unknown>>>('branches?select=*&is_active=eq.true&order=name');
        if (rows) {
          console.log("[Storage] Loaded", rows.length, "branches from Supabase ✅");
          return rows.map(r => snakeToCamel(r));
        }
      } catch (e) { console.warn("[Storage] Supabase branches failed:", e); }
    }
    try {
      const snap = await getDocs(collection(db, "branches"));
      return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (e) { console.error(e); return []; }
  },
  getBranchByCode: async (code: string): Promise<any | null> => {
    if (isSupabaseDataEnabled()) {
      try {
        if (!code) return null;
        const rows = await supabaseGet<Array<Record<string, unknown>>>(
          `branches?select=*&branch_code=eq.${encodeURIComponent(code)}&is_active=eq.true&limit=1`
        );
        if (rows?.[0]) return snakeToCamel(rows[0]);
      } catch (e) { console.warn("[Storage] Supabase branch by code failed:", e); }
    }
    try {
      if (!code) return null;
      const branchQuery = query(collection(db, "branches"), where("branchCode", "==", code), limit(1));
      const snap = await getDocs(branchQuery);
      if (snap.empty) return null;
      const branch = { id: snap.docs[0].id, ...snap.docs[0].data() };
      return branch.isActive === false ? null : branch;
    } catch (e) {
      console.error(e);
      return null;
    }
  },
  subscribeBranches: (callback: (data: any[]) => void) => {
    const q = query(collection(db, "branches"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot: any) => {
      callback(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    });
  },
  saveBranch: async (branch: any): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try { await supabaseMutate('branches', 'POST', camelToSnake({ ...branch })); console.log("[Storage] Branch saved to Supabase ✅"); } catch (e) { console.warn(e); }
    }
    try {
      const safeData = { ...branch };
      if (!safeData.id) {
        safeData.createdAt = new Date().toISOString();
        await addDoc(collection(db, "branches"), safeData);
      } else {
        const id = safeData.id;
        delete safeData.id;
        await updateDoc(doc(db, "branches", id), safeData);
      }
    } catch (e) { console.error(e); throw e; }
  },
  deleteBranch: async (id: string): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try { await supabaseMutate(`branches?id=eq.${id}`, 'DELETE'); } catch (e) { console.warn(e); }
    }
    try {
      await deleteDoc(doc(db, "branches", id));
    } catch (e) { throw e; }
  },

  // --- Branch Prospects (Expansion Scouts) ---
  getBranchProspects: async (): Promise<BranchProspect[]> => {
    if (isSupabaseDataEnabled()) {
      try {
        const rows = await supabaseGet<Array<Record<string, unknown>>>('branch_prospects?select=*&order=created_at.desc');
        if (rows) {
          console.log("[Storage] Loaded", rows.length, "prospects from Supabase ✅");
          return rows.map(r => snakeToCamel(r) as unknown as BranchProspect);
        }
      } catch (e) { console.warn("[Storage] Supabase prospects failed:", e); }
    }
    try {
      const snap = await getDocs(collection(db, "branch_prospects"));
      return snap.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as BranchProspect));
    } catch (e) { console.error(e); return []; }
  },
  subscribeBranchProspects: (callback: (data: BranchProspect[]) => void) => {
    // [스봉이] Supabase 폴링 우선 💅
    if (isSupabaseDataEnabled()) {
      return supabasePollingSubscribe<BranchProspect>(
        'branch_prospects?select=*&order=created_at.desc',
        callback,
        (r) => snakeToCamel(r) as unknown as BranchProspect,
        10000
      );
    }

    try {
      const q = query(collection(db, 'branch_prospects'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot: any) => {
        callback(snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as BranchProspect)));
      });
    } catch (e) {
      console.error('BranchProspects sub error', e);
      return () => {};
    }
  },
  saveBranchProspect: async (prospect: BranchProspect): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try {
        const { camelToSnake, supabaseMutate } = await import('./supabaseClient');
        await supabaseMutate('branch_prospects', 'POST', camelToSnake({ ...prospect }));
        console.log("[Storage] Branch prospect saved to Supabase ✅");
      } catch (e) { console.warn("[Storage] Supabase prospect save failed:", e); }
    }
    try {
      const safeData = { ...prospect, updatedAt: new Date().toISOString() };
      if (!safeData.id || safeData.id.startsWith('PROSPECT-TEMP-')) {
        if (safeData.id) delete (safeData as any).id;
        safeData.createdAt = new Date().toISOString();
        await addDoc(collection(db, "branch_prospects"), safeData);
      } else {
        const id = safeData.id;
        delete (safeData as any).id;
        await updateDoc(doc(db, "branch_prospects", id), safeData);
      }
    } catch (e) { console.error(e); throw e; }
  },
  deleteBranchProspect: async (id: string): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try { await supabaseMutate(`branch_prospects?id=eq.${id}`, 'DELETE'); } catch (e) { console.warn(e); }
    }
    try {
      await deleteDoc(doc(db, "branch_prospects", id));
    } catch (e) { throw e; }
  },

  // --- Notices ---
  subscribeNotices: (callback: (data: SystemNotice[]) => void): (() => void) => {
    if (canUseLocalAdminDataBridge()) {
      return subscribeLocalAdminBridge<SystemNotice[]>(
        '/api/collections/notices',
        callback,
        [],
        (items: any[]) => items.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || '')),
        'Notices local bridge'
      );
    }

    try {
      const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snapshot: any) => {
        const items = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as SystemNotice));
        callback(items);
      }, (error) => {
        console.error("Notices sub error", error);
        const simpleQ = query(collection(db, "notices"));
        void runSnapshotFallback({
          sourceQuery: simpleQ,
          parser: (snap) => {
            const items = snap.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as SystemNotice));
            items.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
            return items;
          },
          callback,
          label: "Notices subscription"
        });
      });
    } catch (e) {
      return () => { };
    }
  },

  saveNotice: async (notice: SystemNotice): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try { await supabaseMutate('system_notices', 'POST', camelToSnake({ ...notice } as Record<string, unknown>)); console.log("[Storage] Notice saved to Supabase ✅"); } catch (e) { console.warn(e); }
    }
    const safeData = JSON.parse(JSON.stringify(notice));
    try {
      if (notice.id) {
        await setDoc(doc(db, "notices", notice.id), safeData);
      } else {
        safeData.createdAt = new Date().toISOString();
        await addDoc(collection(db, "notices"), safeData);
      }
    } catch (e) {
      console.error("Failed to save notice", e);
      throw e;
    }
  },

  deleteNotice: async (id: string): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try { await supabaseMutate(`system_notices?id=eq.${id}`, 'DELETE'); } catch (e) { console.warn(e); }
    }
    try {
      await deleteDoc(doc(db, "notices", id));
    } catch (e) {
      console.error("Failed to delete notice", e);
      throw e;
    }
  },

  // --- TIPS CMS ---
  getTipsAreas: async (): Promise<any[]> => {
    if (isSupabaseDataEnabled()) {
      try {
        const rows = await supabaseGet<Array<Record<string, unknown>>>('cms_areas?select=*&order=sort_order');
        if (rows) {
          console.log("[Storage] Loaded", rows.length, "CMS areas from Supabase ✅");
          return rows.map(r => snakeToCamel(r));
        }
      } catch (e) { console.warn("[Storage] Supabase CMS areas failed:", e); }
    }
    try {
      const snap = await getDocs(collection(db, "tips_areas"));
      return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (e) { console.error(e); return []; }
  },

  subscribeTipsAreas: (callback: (data: any[]) => void) => {
    const q = query(collection(db, "tips_areas"), orderBy("order", "asc"));
    return onSnapshot(q, (snapshot: any) => {
      callback(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("Tips areas sub fallback (index?):", error);
      onSnapshot(collection(db, "tips_areas"), (snap: any) => {
        const items = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        items.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        callback(items);
      });
    });
  },

  saveTipsArea: async (area: any): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try { await supabaseMutate('cms_areas', 'POST', camelToSnake({ ...area })); } catch (e) { console.warn(e); }
    }
    try {
      const safeData = { ...area, updatedAt: new Date().toISOString() };
      const id = safeData.id;
      if (id) {
        delete safeData.id;
        await setDoc(doc(db, "tips_areas", id), safeData, { merge: true });
      } else {
        safeData.createdAt = new Date().toISOString();
        await addDoc(collection(db, "tips_areas"), safeData);
      }
    } catch (e) { console.error(e); throw e; }
  },

  deleteTipsArea: async (id: string): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try { await supabaseMutate(`cms_areas?id=eq.${id}`, 'DELETE'); } catch (e) { console.warn(e); }
    }
    await deleteDoc(doc(db, "tips_areas", id));
  },

  getTipsThemes: async (): Promise<any[]> => {
    if (isSupabaseDataEnabled()) {
      try {
        const rows = await supabaseGet<Array<Record<string, unknown>>>('cms_themes?select=*&order=sort_order');
        if (rows) {
          console.log("[Storage] Loaded", rows.length, "CMS themes from Supabase ✅");
          return rows.map(r => snakeToCamel(r));
        }
      } catch (e) { console.warn("[Storage] Supabase CMS themes failed:", e); }
    }
    try {
      const snap = await getDocs(collection(db, "tips_themes"));
      return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (e) { console.error(e); return []; }
  },

  subscribeTipsThemes: (callback: (data: any[]) => void) => {
    const q = query(collection(db, "tips_themes"), orderBy("order", "asc"));
    return onSnapshot(q, (snapshot: any) => {
      callback(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      onSnapshot(collection(db, "tips_themes"), (snap) => {
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        items.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        callback(items);
      });
    });
  },

  saveTipsTheme: async (theme: any): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try { await supabaseMutate('cms_themes', 'POST', camelToSnake({ ...theme })); } catch (e) { console.warn(e); }
    }
    try {
      const safeData = { ...theme, updatedAt: new Date().toISOString() };
      const id = safeData.id;
      if (id) {
        delete safeData.id;
        await setDoc(doc(db, "tips_themes", id), safeData, { merge: true });
      } else {
        safeData.createdAt = new Date().toISOString();
        await addDoc(collection(db, "tips_themes"), safeData);
      }
    } catch (e) { console.error(e); throw e; }
  },

  deleteTipsTheme: async (id: string): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try { await supabaseMutate(`cms_themes?id=eq.${id}`, 'DELETE'); } catch (e) { console.warn(e); }
    }
    await deleteDoc(doc(db, "tips_themes", id));
  },

  subscribeTipsContents: (filters: { area_slug?: string, theme_tag?: string, slug?: string }, callback: (data: any[]) => void) => {
    let q = query(collection(db, "tips_contents"));
    if (filters.area_slug) q = query(q, where("area_slug", "==", filters.area_slug));
    if (filters.theme_tag) q = query(q, where("theme_tags", "array-contains", filters.theme_tag));
    if (filters.slug) q = query(q, where("slug", "==", filters.slug));
    
    return onSnapshot(q, (snapshot: any) => {
      const items = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      items.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      callback(items);
    });
  },

  saveTipsContent: async (content: any): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try { await supabaseMutate('cms_contents', 'POST', camelToSnake({ ...content })); } catch (e) { console.warn(e); }
    }
    try {
      const safeData = { ...content, updatedAt: new Date().toISOString() };
      const id = safeData.id;
      if (id) {
        delete safeData.id;
        await setDoc(doc(db, "tips_contents", id), safeData, { merge: true });
      } else {
        safeData.createdAt = new Date().toISOString();
        await addDoc(collection(db, "tips_contents"), safeData);
      }
    } catch (e) { console.error(e); throw e; }
  },

  deleteTipsContent: async (id: string): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try { await supabaseMutate(`cms_contents?id=eq.${id}`, 'DELETE'); } catch (e) { console.warn(e); }
    }
    await deleteDoc(doc(db, "tips_contents", id));
  }
};
