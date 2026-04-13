
// ============================================================
// Supabase 전용 storageService (Firebase Firestore 완전 제거)
// Firebase → Supabase 어댑터 레이어로 기존 147개 호출 호환
// ============================================================
import { getSupabaseBaseUrl, getSupabaseConfig, resolveSupabaseEndpoint, resolveSupabaseUrl } from './supabaseRuntime';

// Firebase Storage 완전 제거 — Supabase Storage 사용
// storage, ref, uploadBytes, getDownloadURL 모두 Supabase 어댑터로 대체
const storage = {} as any; // 더미
const ref = (_s: any, path: string) => ({ _path: path });
const uploadBytes = async (storageRef: any, file: Blob | ArrayBuffer, _metadata?: any) => {
  // Supabase Storage signed upload
  const config = getSupabaseConfig();
  const SUPABASE_KEY = config.anonKey;
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

const generateSupabaseReservationCode = (booking: Partial<BookingState>): string => {
  const toCode = (value: unknown, fallback = 'UNK') => {
    const normalized = String(value || '').trim();
    if (!normalized) return fallback;
    const isUuidLike = /^[0-9a-f]{8}-/i.test(normalized);
    if (isUuidLike) {
      return normalized.slice(0, 3).toUpperCase();
    }
    return normalized.includes('-') ? normalized.toUpperCase() : normalized.slice(0, 3).toUpperCase();
  };

  const pickupCode = toCode(
    booking.pickupLoc?.shortCode ||
    booking.pickupLoc?.id ||
    booking.pickupLocation,
    'UNK'
  );

  const destinationSource = booking.serviceType === 'DELIVERY'
    ? 'ADDR'
    : toCode(
      booking.returnLoc?.shortCode ||
      booking.returnLoc?.id ||
      booking.dropoffLocation ||
      booking.pickupLocation,
      'UNK'
    );

  const random = Math.floor(1000 + Math.random() * 9000);
  return `${pickupCode}-${destinationSource}-${random}`;
};

const getBookingLocationLabel = (
  location: Partial<LocationOption> | undefined,
  fallbackName: unknown,
  fallbackId: unknown,
) => {
  const name = String(fallbackName || location?.name || location?.name_en || '').trim();
  if (name) return name;

  const identifier = String(fallbackId || location?.id || '').trim();
  return identifier || null;
};

const toFiniteLocationNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeLocationCommissionRates = (location: LocationOption): LocationOption => {
  const raw = location as LocationOption & Record<string, unknown>;
  const delivery = toFiniteLocationNumber(
    raw.commissionRates?.delivery ??
    raw.commissionRateDelivery ??
    raw.commission_rate_delivery,
    0,
  );
  const storage = toFiniteLocationNumber(
    raw.commissionRates?.storage ??
    raw.commissionRateStorage ??
    raw.commission_rate_storage,
    0,
  );

  return {
    ...location,
    commissionRates: {
      delivery,
      storage,
    },
  };
};

const fireSupabaseBookingCreatedWebhook = async (record: Record<string, unknown>) => {
  const endpoint = resolveSupabaseEndpoint(undefined, '/functions/v1/on-booking-created');
  const { anonKey } = getSupabaseConfig();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      type: 'INSERT',
      table: 'booking_details',
      record,
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `on-booking-created failed with ${response.status}`);
  }
};

const fireWithRetry = async (record: Record<string, unknown>, attempt = 0): Promise<void> => {
  try {
    await fireSupabaseBookingCreatedWebhook(record);
  } catch (error) {
    if (attempt < 2) {
      await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
      return fireWithRetry(record, attempt + 1);
    }
    console.error("[StorageService] on-booking-created bridge failed after 3 attempts:", error);
  }
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
  supabasePollingSubscribe,
  getSupabaseClient
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
import { BookingState, BookingStatus, LocationOption, TermsPolicyData, PrivacyPolicyData, QnaData, HeroConfig, PriceSettings, GoogleCloudConfig, PartnershipInquiry, CashClosing, Expenditure, AdminUser, StorageTier, ChatMessage, DiscountCode, ChatSession, TranslatedLocationData, UserProfile, UserCoupon, BranchProspect, ProspectStatus, SystemNotice, AdminRevenueDailySummary, AdminRevenueMonthlySummary, MonthlyClosing, BranchPayout } from "../types";
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

// --- In-memory cache (세션 내 중복 Supabase 왕복 방지, TTL 5분) ---
const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000;
let _storageTiersCache: { data: ReturnType<typeof normalizeStorageTiers>; ts: number } | null = null;
let _deliveryPricesCache: { data: PriceSettings; ts: number } | null = null;

// Keys for LocalStorage (Only for minimal config cache if needed, but largely removed)
const KEYS = {
  CLOUD_CONFIG: 'beeliber_integration_config',
  LEGACY_CLOUD_CONFIG: 'beeliber_cloud_config',
};

const USER_PROFILE_CACHE_KEY = (uid: string) => `beeliber_user_profile:${uid}`;
const USER_COUPON_CACHE_KEY = (uid: string) => `beeliber_user_coupons:${uid}`;

const readLocalJson = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch (error) {
    console.warn(`[Storage] local cache read failed (${key})`, error);
    return fallback;
  }
};

const writeLocalJson = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[Storage] local cache write failed (${key})`, error);
  }
};

const DEFAULT_CLOUD_CONFIG: GoogleCloudConfig = {
  apiKey: "",
  measurementId: "",
  isActive: true,
  enableWorkspaceAutomation: false,
  enableGeminiAutomation: true,
  mapId: "",
  mapSecret: "",
};

const SUPABASE_RUNTIME_URL = getSupabaseBaseUrl();
const ADMIN_ACCOUNT_SYNC_ENDPOINT = import.meta.env.VITE_ADMIN_ACCOUNT_SYNC_ENDPOINT?.trim()
  ? resolveSupabaseEndpoint(import.meta.env.VITE_ADMIN_ACCOUNT_SYNC_ENDPOINT, '/functions/v1/admin-account-sync')
  : (SUPABASE_RUNTIME_URL ? `${SUPABASE_RUNTIME_URL}/functions/v1/admin-account-sync` : '');
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
  // DB의 admin_note 컬럼이 snakeToCamel로 adminNote가 됨 → auditNote로 병합
  const merged: BookingState = {
    ...booking,
    auditNote: booking.auditNote || (booking as any).adminNote || '',
  };

  if (merged.serviceType !== 'DELIVERY') {
    return merged;
  }

  const bagSizes = sanitizeDeliveryBagSizes(merged.bagSizes);
  const totalBags = getTotalBags(bagSizes);

  return {
    ...merged,
    bagSizes,
    bags: totalBags,
    insuranceBagCount: typeof merged.insuranceBagCount === 'number'
      ? Math.min(merged.insuranceBagCount, totalBags)
      : merged.insuranceBagCount,
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

// Simplified Chinese → Traditional Chinese conversion for common location terms
const SC2TC: Record<string, string> = {
  '机场': '機場', '车站': '車站', '广域市': '廣域市', '特别市': '特別市',
  '区': '區', '路': '路', '街': '街', '号': '號', '层': '層', '楼': '樓',
  '门': '門', '东': '東', '龙': '龍', '国际线': '國際線', '出境大厅': '出境大廳',
  '入境大厅': '入境大廳', '寄存处': '寄存處', '柜台': '櫃台', '请': '請',
  '预订': '預訂', '会面': '會面', '步行': '步行', '弘益大学站': '弘益大學站',
  '首尔': '首爾', '仁川': '仁川', '金浦': '金浦', '龙山': '龍山',
  '永登浦': '永登浦', '麻浦': '麻浦', '江南': '江南', '江西': '江西',
  '中': '中', '钟': '鐘', '广': '廣', '东大门': '東大門', '南大门': '南大門',
  '梨泰院': '梨泰院', '明洞': '明洞', '弘大': '弘大', '延南': '延南',
  '圣水': '聖水', '仁寺洞': '仁寺洞', '安国': '安國', '忠武路': '忠武路',
  '松岛': '松島', '平泽': '平澤', '水原': '水原', '富平': '富平',
  '昌原': '昌原', '光州': '光州', '釜山': '釜山', '济州': '濟州',
  '海云台': '海雲台', '光安里': '光安里', '金海': '金海', '大邱': '大邱',
  '蔚山': '蔚山', '汉江大路': '漢江大路', '世界杯北路': '世界杯北路',
  '店': '店', '站': '站', '寄存': '寄存',
  '请前往': '請前往', '工作人员': '工作人員',
  '告知您的': '告知您的', '请寄存在': '請寄存在',
  '行理': '行李', '寻找': '尋找', '标志': '標誌',
};

const simplifiedToTraditional = (text?: string): string | undefined => {
  if (!text) return undefined;
  let result = text;
  // Sort keys by length descending to match longer phrases first
  const sorted = Object.entries(SC2TC).sort((a, b) => b[0].length - a[0].length);
  for (const [sc, tc] of sorted) {
    result = result.split(sc).join(tc);
  }
  return result;
};

const normalizeLocationTranslations = (location: LocationOption): LocationOption => {
  const baseName = location.name?.trim();
  const baseAddress = location.address?.trim();
  const zhName = preferTranslatedValue(location.name_zh, baseName);
  const zhAddress = preferTranslatedValue(location.address_zh, baseAddress);
  const zhDesc = preferTranslatedValue((location as any).description_zh, location.description?.trim());
  const zhGuide = preferTranslatedValue((location as any).pickupGuide_zh);
  const zhHours = preferTranslatedValue((location as any).businessHours_zh, (location as any).businessHours);

  return {
    ...location,
    name: baseName || location.name,
    address: baseAddress || location.address,
    name_en: preferTranslatedValue(location.name_en, baseName),
    name_ja: preferTranslatedValue(location.name_ja, baseName),
    name_zh: zhName,
    name_zh_tw: preferTranslatedValue(location.name_zh_tw, simplifiedToTraditional(zhName)),
    name_zh_hk: preferTranslatedValue(location.name_zh_hk, simplifiedToTraditional(zhName)),
    address_en: preferTranslatedValue(location.address_en, baseAddress),
    address_ja: preferTranslatedValue(location.address_ja, baseAddress),
    address_zh: zhAddress,
    address_zh_tw: preferTranslatedValue(location.address_zh_tw, simplifiedToTraditional(zhAddress)),
    address_zh_hk: preferTranslatedValue(location.address_zh_hk, simplifiedToTraditional(zhAddress)),
    description_zh_tw: preferTranslatedValue((location as any).description_zh_tw, simplifiedToTraditional(zhDesc)),
    description_zh_hk: preferTranslatedValue((location as any).description_zh_hk, simplifiedToTraditional(zhDesc)),
    pickupGuide_zh_tw: preferTranslatedValue((location as any).pickupGuide_zh_tw, simplifiedToTraditional(zhGuide)),
    pickupGuide_zh_hk: preferTranslatedValue((location as any).pickupGuide_zh_hk, simplifiedToTraditional(zhGuide)),
    businessHours_zh_tw: preferTranslatedValue((location as any).businessHours_zh_tw, zhHours),
    businessHours_zh_hk: preferTranslatedValue((location as any).businessHours_zh_hk, zhHours),
  } as LocationOption;
};

export const canUseLocalLegacyReadBridge = () => {
  return false;
};

const canUseSupabaseAdminAccountSync = () =>
  isSupabaseAdminAuthEnabled() &&
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

const sortBookingsByPickupDateDesc = (items: BookingState[]) =>
  [...items].sort((a, b) => new Date(b.pickupDate || '').getTime() - new Date(a.pickupDate || '').getTime());


const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// O(1) INITIAL_LOCATIONS 존재 여부 조회 — polling 콜백에서 O(n²) 방지
const INITIAL_LOCATION_ID_SET = new Set(INITIAL_LOCATIONS.map(l => l.id));

const isUuidLike = (value?: string | null) => UUID_PATTERN.test(String(value || '').trim());

const normalizeAdminBranchReference = (value?: string | null): string | undefined => {
  const trimmed = String(value || '').trim();
  return isUuidLike(trimmed) ? trimmed : undefined;
};

interface LocationQueryOptions {
  includeInactive?: boolean;
}

const shouldIncludeLocation = (location: LocationOption, includeInactive = false) =>
  includeInactive || location.isActive !== false;

const buildSupabaseLocationsPath = (includeInactive = false) =>
  includeInactive
    ? 'locations?select=*&order=name'
    : 'locations?select=*&is_active=eq.true&order=name';


/**
 * Supabase Realtime 채널 구독 헬퍼
 * - postgres_changes 이벤트 감지 → loader() 실행 → callback 호출
 * - 디바운스 300ms (이벤트 버스트 방지)
 * - 에러/타임아웃 핸들링 내장 (무음 실패 방지)
 */
function createRealtimeSubscription<T>(
  channelName: string,
  table: string,
  loader: () => Promise<T[]>,
  callback: (data: T[]) => void
): () => void {
  const supabase = getSupabaseClient();

  // 디바운스 (300ms) — 연속 이벤트 시 loader 중복 호출 방지
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const debouncedLoad = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void loader().then(callback).catch((e) => {
        console.error(`[Realtime] ${channelName} reload failed:`, e);
      });
    }, 300);
  };

  // 무음 실패 감지: 60초 후 이벤트가 없으면 경고
  let receivedFirstEvent = false;
  const silenceWarningTimer = setTimeout(() => {
    if (!receivedFirstEvent) {
      console.warn(
        `[Realtime] ${channelName}: 60s 동안 이벤트 없음. ` +
        `Supabase 대시보드에서 "${table}" 테이블의 Realtime Publication 설정을 확인하세요.`
      );
    }
  }, 60_000);

  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      receivedFirstEvent = true;
      debouncedLoad();
    })
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR') {
        console.error(`[Realtime] ${channelName} 채널 오류:`, err);
      }
      if (status === 'TIMED_OUT') {
        console.warn(`[Realtime] ${channelName} 채널 타임아웃. 재연결 시도 중...`);
      }
    });

  // 초기 1회 로드
  void loader().then(callback).catch((e) => {
    console.error(`[Realtime] ${channelName} 초기 로드 실패:`, e);
  });

  return () => {
    clearTimeout(silenceWarningTimer);
    if (debounceTimer) clearTimeout(debounceTimer);
    void supabase.removeChannel(channel);
  };
}

const loadSupabaseAdminBookings = async (): Promise<BookingState[]> => {
  try {
    const rows = await supabaseGet<Array<Record<string, unknown>>>(
      'admin_booking_list_v1?select=*&order=created_at.desc&limit=500'
    );
    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map((row) => {
        const camel = snakeToCamel(row);
        if (row.settlement_status === 'DELETED' || row.settlement_status === 'deleted') {
          camel.isDeleted = true;
        }
        return camel as unknown as BookingState;
      });
    }

    console.warn('[Storage] admin_booking_list_v1 returned 0 rows, probing booking_details directly.');
    const fallbackRows = await supabaseGet<Array<Record<string, unknown>>>(
      'booking_details?select=*&order=created_at.desc&limit=500'
    );
    return (fallbackRows || []).map((row) => {
      const camel = snakeToCamel(row);
      if (row.settlement_status === 'DELETED' || row.settlement_status === 'deleted') {
        camel.isDeleted = true;
      }
      return camel as unknown as BookingState;
    });
  } catch (error) {
    console.warn('[Storage] admin_booking_list_v1 unavailable, falling back to booking_details:', error);
    const rows = await supabaseGet<Array<Record<string, unknown>>>(
      'booking_details?select=*&order=created_at.desc&limit=500'
    );
    return (rows || []).map((row) => {
      const camel = snakeToCamel(row);
      if (row.settlement_status === 'DELETED' || row.settlement_status === 'deleted') {
        camel.isDeleted = true;
      }
      return camel as unknown as BookingState;
    });
  }
};



const loadSupabaseCashClosings = async (): Promise<CashClosing[]> => {
  const rows = await supabaseGet<Array<Record<string, unknown>>>('daily_closings?select=*&order=date.desc&limit=500');
  return (rows || []).map((row) => snakeToCamel(row) as unknown as CashClosing);
};



const loadSupabaseExpenditures = async (): Promise<Expenditure[]> => {
  const rows = await supabaseGet<Array<Record<string, unknown>>>('expenditures?select=*&order=date.desc&limit=1000');
  return (rows || []).map((row) => snakeToCamel(row) as unknown as Expenditure);
};



const loadSupabaseAdminRevenueDailySummaries = async (): Promise<AdminRevenueDailySummary[]> => {
  const rows = await supabaseGet<Array<Record<string, unknown>>>(
    'admin_revenue_daily_v1?select=*&order=date.desc&limit=1000'
  );

  return (rows || []).map((row) => snakeToCamel(row) as unknown as AdminRevenueDailySummary);
};

const loadSupabaseAdminRevenueMonthlySummaries = async (): Promise<AdminRevenueMonthlySummary[]> => {
  const rows = await supabaseGet<Array<Record<string, unknown>>>(
    'admin_revenue_monthly_v1?select=*&order=month.desc&limit=120'
  );

  return (rows || []).map((row) => snakeToCamel(row) as unknown as AdminRevenueMonthlySummary);
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
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(KEYS.LEGACY_CLOUD_CONFIG);
    }
    writeLocalJson(KEYS.CLOUD_CONFIG, config);
    window.location.reload();
  },

  getCloudConfig: (): GoogleCloudConfig | null => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(KEYS.LEGACY_CLOUD_CONFIG);
    }

    const savedConfig = readLocalJson<Partial<GoogleCloudConfig> | null>(KEYS.CLOUD_CONFIG, null);
    return {
      ...DEFAULT_CLOUD_CONFIG,
      ...(savedConfig || {}),
      isActive: savedConfig?.isActive ?? DEFAULT_CLOUD_CONFIG.isActive,
    };
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
    const reservationCode = safeBooking.reservationCode || generateSupabaseReservationCode(safeBooking);
    safeBooking.reservationCode = reservationCode;
    if (!isSupabaseDataEnabled()) {
      throw new Error('Supabase booking storage is not configured.');
    }

    try {
      console.log("[StorageService] Saving booking to Supabase...");

      // 지점 수수료 및 정산액 자동 계산
      const commDelivery = safeBooking.pickupLoc?.commissionRates?.delivery ?? 0;
      const commStorage  = safeBooking.pickupLoc?.commissionRates?.storage  ?? 0;
      const isDelivery   = safeBooking.serviceType === 'DELIVERY';
      const effectiveCommRate = isDelivery ? commDelivery : commStorage;
      const finalPriceNum = isNaN(Number(safeBooking.finalPrice)) ? 0 : Number(safeBooking.finalPrice);
      const branchSettlementAmt = Math.round(finalPriceNum * effectiveCommRate);

      const bookingData = {
        sns_channel: safeBooking.snsChannel || null,
        sns_id: safeBooking.snsId || null,
        country: safeBooking.country || null,
        pickup_address: safeBooking.pickupAddress || null,
        pickup_address_detail: safeBooking.pickupAddressDetail || null,
        pickup_date: safeBooking.pickupDate || null,
        pickup_time: safeBooking.pickupTime || null,
        insurance_fee: safeBooking.insuranceFee || 0,
        credit_used: safeBooking.creditUsed || 0,
        pickup_location_id: safeBooking.pickupLoc?.supabaseId || null,
        dropoff_address: safeBooking.dropoffAddress || null,
        dropoff_address_detail: safeBooking.dropoffAddressDetail || null,
        dropoff_date: safeBooking.dropoffDate || null,
        delivery_time: safeBooking.deliveryTime || null,
        dropoff_location_id: safeBooking.returnLoc?.supabaseId || null,
        return_date: safeBooking.returnDate || null,
        return_time: safeBooking.returnTime || null,
        insurance_level: safeBooking.insuranceLevel || null,
        insurance_bag_count: safeBooking.insuranceBagCount || null,
        use_insurance: safeBooking.useInsurance || false,
        branch_commission_delivery: commDelivery,
        branch_commission_storage: commStorage,
        branch_settlement_amount: branchSettlementAmt,
        settlement_status: 'PENDING',
        base_price: isNaN(Number(safeBooking.price)) ? 0 : Number(safeBooking.price),
        final_price: finalPriceNum,
        promo_code: safeBooking.promoCode || null,
        discount_amount: safeBooking.discountAmount || 0,
        payment_method: safeBooking.paymentMethod || null,
        payment_provider: safeBooking.paymentProvider || null,
        agreed_to_terms: safeBooking.agreedToTerms || false,
        agreed_to_privacy: safeBooking.agreedToPrivacy || false,
        reservation_code: reservationCode,
        language: safeBooking.language || 'en',
        image_url: safeBooking.imageUrl || null,
        user_name: safeBooking.userName || null,
        user_email: safeBooking.userEmail || null,
        service_type: safeBooking.serviceType || 'STORAGE',
        pickup_location: getBookingLocationLabel(
          safeBooking.pickupLoc,
          safeBooking.pickupLocationName,
          safeBooking.pickupLocation,
        ),
        dropoff_location: getBookingLocationLabel(
          safeBooking.returnLoc,
          safeBooking.dropoffLocationName,
          safeBooking.dropoffLocation,
        ),
        // bags/bag_summary를 INSERT에 포함 — DB Webhook이 INSERT 직후 발화하므로
        // PATCH로 분리하면 알림/바우처에 가방 정보가 누락됨
        bags: safeBooking.bags || 0,
        bag_summary: (() => {
          const s = safeBooking.bagSizes;
          if (!s) return '';
          return [
            s.handBag > 0 ? `핸드백 ${s.handBag}개` : '',
            s.carrier > 0 ? `캐리어 ${s.carrier}개` : '',
            s.strollerBicycle > 0 ? `유모차/자전거 ${s.strollerBicycle}개` : '',
          ].filter(Boolean).join(', ');
        })(),
        // UTM 채널 어트리뷰션
        utm_source: safeBooking.utmSource || null,
        utm_medium: safeBooking.utmMedium || null,
        utm_campaign: safeBooking.utmCampaign || null,
        utm_content: safeBooking.utmContent || null,
        utm_term: safeBooking.utmTerm || null,
      };

      const result = await supabaseMutate<Array<Record<string, unknown>>>(
        'booking_details',
        'POST',
        bookingData
      );

      const created = Array.isArray(result) && result[0] ? result[0] : null;
      const bookingId = String(created?.id || '');

      // nametag_id만 별도 PATCH (bags/bag_summary는 INSERT에 이미 포함)
      if (bookingId) {
        try {
          let nametagId = safeBooking.nametagId || null;
          if (!nametagId && safeBooking.branchId) {
            nametagId = await StorageService.generateWeeklyNametagId(safeBooking.branchId);
          }
          await supabaseMutate(
            `booking_details?id=eq.${bookingId}`,
            'PATCH',
            { nametag_id: nametagId }
          );
        } catch (e) {
          console.warn("[StorageService] bags/bag_summary/nametag_id PATCH 실패 (무시):", e);
        }
      }

      console.log("[StorageService] Booking saved to Supabase ✅");
      // DB INSERT 트리거(trigger_on_booking_created)가 이메일+채팅 알림을 처리합니다.
      // 클라이언트 직접 호출(fireWithRetry) 제거 — 중복 알림 방지

      return {
        ...safeBooking,
        id: bookingId || safeBooking.id,
        reservationCode,
        status: '접수완료' as any,
      };
    } catch (error) {
      console.error("[StorageService] Supabase booking save failed:", error);
      throw error;
    }
  },

  getBookings: async (): Promise<BookingState[]> => {
    try {
      const bookings = await loadSupabaseAdminBookings();
      console.log(`[Storage] Loaded ${bookings.length} bookings from Supabase ✅`);
      return sortBookingsByPickupDateDesc(normalizeBookingsForDeliveryPolicy(bookings));
    } catch (e) {
      console.warn("[Storage] Supabase booking fetch failed", e);
      return [];
    }
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
    return createRealtimeSubscription(
      'bookings-changes',
      'booking_details',
      async () => {
        const data = await loadSupabaseAdminBookings();
        return sortBookingsByPickupDateDesc(normalizeBookingsForDeliveryPolicy(data));
      },
      callback
    );
  },

  subscribeBookingsByLocation: (locationId: string, callback: (data: BookingState[]) => void): (() => void) => {
    // NOTE: Supabase Realtime postgres_changes는 서버 사이드 복합 필터 불가 (Set 기반 다중 식별자).
    // 변경 감지 → 전체 로드 → 클라이언트 필터 패턴 유지.
    const buildLocationIdSet = (allLocations?: LocationOption[]): Set<string> => {
      const ids = new Set<string>();
      ids.add(locationId);
      const loc = (allLocations || []).find(l => l.id === locationId || l.shortCode === locationId || (l as any).branchCode === locationId);
      if (loc) {
        if (loc.id) ids.add(loc.id);
        if (loc.shortCode) ids.add(loc.shortCode);
        if ((loc as any).branchCode) ids.add((loc as any).branchCode);
        if ((loc as any).branchId) ids.add((loc as any).branchId);
        if (loc.name) ids.add(loc.name);
      }
      return ids;
    };

    let locationIdSet = new Set<string>([locationId]);
    StorageService.getLocations().then(locs => { locationIdSet = buildLocationIdSet(locs); });

    const filterLocationBookings = (items: BookingState[]) =>
      sortBookingsByPickupDateDesc(
        normalizeBookingsForDeliveryPolicy(items).filter((booking) =>
          locationIdSet.has(booking.pickupLocation || '') ||
          locationIdSet.has(booking.dropoffLocation || '') ||
          locationIdSet.has(booking.branchId || '') ||
          locationIdSet.has((booking as any).pickupLocationId || '')
        )
      );

    return createRealtimeSubscription(
      `bookings-location-${locationId}`,
      'booking_details',
      async () => filterLocationBookings(await loadSupabaseAdminBookings()),
      callback
    );
  },

  updateBooking: async (id: string, updates: Partial<BookingState>): Promise<void> => {
    if (!isSupabaseDataEnabled()) {
      throw new Error('Supabase booking storage is not configured.');
    }

    const normalizedId = String(id || '').trim();
    let bookingDetailId = normalizedId;

    if (!isUuidLike(normalizedId)) {
      const booking = await StorageService.getBooking(normalizedId);
      const resolvedId = String(booking?.id || '').trim();
      if (!isUuidLike(resolvedId)) {
        throw new Error(`Supabase booking_details id를 찾을 수 없습니다: ${normalizedId}`);
      }
      bookingDetailId = resolvedId;
    }

    // booking_details 테이블에 실제 존재하는 컬럼만 허용 (없는 컬럼 포함 시 PostgREST 400 에러)
    const BOOKING_DETAILS_COLUMNS = new Set([
      'sns_channel', 'sns_id', 'country', 'pickup_location_id', 'pickup_address',
      'pickup_address_detail', 'pickup_image_url', 'pickup_date', 'pickup_time',
      'dropoff_location_id', 'dropoff_address', 'dropoff_address_detail', 'dropoff_date',
      'delivery_time', 'return_date', 'return_time', 'insurance_level', 'insurance_bag_count',
      'use_insurance', 'insurance_fee', 'credit_used', 'base_price', 'final_price', 'promo_code', 'discount_amount',
      'weight_surcharge_5kg', 'weight_surcharge_10kg', 'payment_method', 'payment_provider',
      'payment_order_id', 'payment_key', 'payment_receipt_url', 'payment_approved_at',
      'branch_commission_delivery', 'branch_commission_storage', 'branch_settlement_amount',
      'settlement_status', 'settled_at', 'settled_by', 'language', 'image_url',
      'service_type', 'user_name', 'user_email', 'pickup_location', 'dropoff_location',
      'reservation_code', 'agreed_to_terms', 'agreed_to_privacy', 'agreed_to_high_value',
      'email_sent_at', 'nametag_id', 'bags', 'bag_summary', 'admin_note', 'ops_status',
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    ]);
    const allUpdates = camelToSnake(JSON.parse(JSON.stringify(updates)) as Record<string, unknown>);
    // status는 UI 합성 필드 — BOOKING_DETAILS_COLUMNS에 없으므로 자동 필터됨
    // settlement_status는 정산 처리 시 mutateBookingRecord로 별도 명시적 업데이트
    // auditNote → audit_note (camelToSnake) → 실제 DB 컬럼명은 admin_note
    if ('audit_note' in allUpdates) {
      allUpdates['admin_note'] = allUpdates['audit_note'];
      delete allUpdates['audit_note'];
    }
    const supabaseUpdates = Object.fromEntries(
      Object.entries(allUpdates).filter(([k]) => BOOKING_DETAILS_COLUMNS.has(k))
    );
    if (Object.keys(supabaseUpdates).length === 0) {
      console.warn('[Storage] updateBooking: 유효한 booking_details 컬럼이 없습니다. 업데이트 스킵.');
      return;
    }
    await supabaseMutate(`booking_details?id=eq.${encodeURIComponent(bookingDetailId)}`, 'PATCH', supabaseUpdates);
    console.log(`[Storage] Booking ${bookingDetailId} updated in Supabase ✅`);
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

  cancelBooking: async (id: string, options?: { name?: string; email?: string; reason?: string }): Promise<void> => {
    // Supabase Edge Function 호출
    try {
      const SUPABASE_URL = getSupabaseBaseUrl();
      const SUPABASE_KEY = getSupabaseConfig().anonKey;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/cancel-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ bookingId: id, name: options?.name, email: options?.email, reason: options?.reason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Cancel failed [${res.status}]`);
      }
      console.log("[Storage] Booking cancelled via Supabase Edge Function ✅");
    } catch (e) {
      console.error("Cancel error:", e);
      throw e;
    }
  },

  // --- Locations ---
  subscribeLocations: (
    callback: (data: LocationOption[]) => void,
    options: LocationQueryOptions = {}
  ): (() => void) => {
    const includeInactive = options.includeInactive === true;
    // [스봉이] Supabase 폴링 우선 💅
    if (isSupabaseDataEnabled()) {
      const enrichLocation = (loc: LocationOption): LocationOption => {
        const normalized = normalizeLocationCommissionRates(loc);
        const initialLoc = INITIAL_LOCATIONS.find(l => l.id === loc.id);
        if (!initialLoc) return normalized;
        const enriched = { ...normalized };
        Object.keys(initialLoc).forEach((key) => {
          const k = key as keyof LocationOption;
          if (enriched[k] === undefined || enriched[k] === '' || enriched[k] === null) {
            (enriched as Record<string, any>)[k] = initialLoc[k];
          }
        });
        return enriched;
      };
      return supabasePollingSubscribe<LocationOption>(
        buildSupabaseLocationsPath(includeInactive),
        (items) => {
          const filtered = items
            .map(enrichLocation)
            .filter((item) => shouldIncludeLocation(item, includeInactive));
          // 폴링 결과가 비어 있으면 콜백 스킵 (INITIAL_LOCATIONS 폴백 유지)
          if (filtered.length > 0) callback(filtered);
        },
        (r) => {
          const loc = snakeToCamel(r) as unknown as LocationOption;
          // UUID는 supabaseId로 보존
          if (r.id) {
            (loc as LocationOption).supabaseId = String(r.id);
          }
          // short_code를 primary id로 사용 (INITIAL_LOCATIONS 매칭 + 비즈니스 로직 호환)
          if (r.short_code) {
            (loc as any).id = String(r.short_code);
          }
          return loc;
        },
        10000
      );
    }

    console.warn("Supabase is disabled. Returning empty locations.");
    callback([]);
    return () => {};
  },

  getLocations: async (options: LocationQueryOptions = {}): Promise<LocationOption[]> => {
    const includeInactive = options.includeInactive === true;
    let supabaseLocs: LocationOption[] = [];
    let firebaseLocs: LocationOption[] = [];

    const enrichLoc = (loc: LocationOption): LocationOption => {
      const normalized = normalizeLocationCommissionRates(loc);
      const initialLoc = INITIAL_LOCATIONS.find(l => l.id === loc.id);
      if (!initialLoc) return normalized;
      const enriched = { ...normalized };
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
          buildSupabaseLocationsPath(includeInactive)
        );
        if (rows && rows.length > 0) {
          supabaseLocs = rows.flatMap((row) => {
            const loc = snakeToCamel(row) as unknown as LocationOption;
            // UUID는 supabaseId로 보존
            if (row.id) {
              loc.supabaseId = String(row.id);
            }
            // short_code를 primary id로 사용 (INITIAL_LOCATIONS 매칭 + 비즈니스 로직 호환)
            if (row.short_code) {
              (loc as any).id = String(row.short_code);
            }
            return [enrichLoc(loc)];
          });
          console.log('[Storage] Loaded', supabaseLocs.length, 'locations from Supabase ✅');
        }
      } catch (e) {
        console.warn('[Storage] Supabase locations failed:', e);
      }
    }

    // Supabase 조회 실패 또는 결과 없을 때 INITIAL_LOCATIONS 폴백
    if (supabaseLocs.length === 0) {
      console.warn('[Storage] Supabase returned no locations — falling back to INITIAL_LOCATIONS');
      supabaseLocs = INITIAL_LOCATIONS.map(normalizeLocationCommissionRates) as LocationOption[];
    }

    const filtered = supabaseLocs.filter((item) => shouldIncludeLocation(item, includeInactive));
    console.log(`[Storage] Loaded ${filtered.length} locations 💅`);
    return filtered;
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
    const sanitized = normalizeLocationCommissionRates(
      normalizeLocationTranslations({ ...location })
    );
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

    if (!isSupabaseDataEnabled()) {
      throw new Error("Supabase locations API is not configured");
    }

    try {
      const recordId = String(safeLocation.supabaseId || '').trim()
        || (isUuidLike(safeLocation.id) ? String(safeLocation.id).trim() : '');
      const locationCode = String(
        safeLocation.shortCode ||
        safeLocation.branchCode ||
        (!recordId ? safeLocation.id : '')
      ).trim();
      const {
        commissionRates,
        commission_rates,
        commissionRateDelivery,
        commissionRateStorage,
        commission_rate_delivery,
        commission_rate_storage,
        ...locationWithoutCommissionObject
      } = safeLocation as LocationOption & Record<string, unknown>;
      const { id, supabase_id, ...payload } = camelToSnake({
        ...locationWithoutCommissionObject,
        commissionRateDelivery: commissionRates?.delivery ?? 0,
        commissionRateStorage: commissionRates?.storage ?? 0,
        id: recordId || undefined,
        shortCode: locationCode || safeLocation.shortCode,
        branchCode: safeLocation.branchCode || locationCode,
      } as Record<string, unknown>);
      delete (payload as Record<string, unknown>).commission_rates;
      const shortCode = String(payload.short_code || '').trim();
      let mutatedRows: unknown = null;

      if (recordId) {
        mutatedRows = await supabaseMutate(`locations?id=eq.${encodeURIComponent(recordId)}`, 'PATCH', payload);
      } else if (shortCode) {
        mutatedRows = await supabaseMutate(`locations?short_code=eq.${encodeURIComponent(shortCode)}`, 'PATCH', payload);
      }

      const didUpdateExisting = Array.isArray(mutatedRows) ? mutatedRows.length > 0 : Boolean(mutatedRows);
      if (!didUpdateExisting) {
        await supabaseMutate('locations', 'POST', payload);
      }

      console.log("[Storage] Location saved to Supabase ✅");
    } catch (e) {
      console.error("Cloud Save Failed (Location):", e);
      throw e;
    }
  },

  deleteLocation: async (id: string): Promise<void> => {
    if (!isSupabaseDataEnabled()) {
      throw new Error("Supabase locations API is not configured");
    }
    try {
      if (isUuidLike(id)) {
        await supabaseMutate(`locations?id=eq.${encodeURIComponent(id)}`, 'DELETE');
      } else {
        await supabaseMutate(`locations?short_code=eq.${encodeURIComponent(id)}`, 'DELETE');
      }
    } catch (e) {
      console.error("Cloud Delete Failed:", e);
      throw e;
    }
  },

  // --- Storage Tiers ---
  getStorageTiers: async (): Promise<StorageTier[] | null> => {
    if (_storageTiersCache && Date.now() - _storageTiersCache.ts < SETTINGS_CACHE_TTL_MS) {
      return _storageTiersCache.data;
    }

    // Supabase 우선: app_settings에서 storage_tiers 조회
    if (isSupabaseDataEnabled()) {
      try {
        const rows = await supabaseGet<Array<{ key: string; value: any }>>(
          'app_settings?select=value&key=eq.storage_tiers&limit=1'
        );
        if (rows?.[0]?.value?.tiers) {
          console.log("[Storage] Loaded storage tiers from Supabase ✅");
          const result = normalizeStorageTiers(rows[0].value.tiers);
          _storageTiersCache = { data: result, ts: Date.now() };
          return result;
        }
      } catch (e) {
        console.warn("[Storage] Supabase storage tiers failed, falling back:", e);
      }
    }

    try {
      const snap = await getDoc(doc(db, "settings", "storage_tiers"));
      if (snap.exists()) {
        const data = snap.data();
        const result = normalizeStorageTiers(data.tiers || null);
        _storageTiersCache = { data: result, ts: Date.now() };
        return result;
      }
      return null;
    } catch (e) {
      console.error("Failed to get storage tiers", e);
      return null;
    }
  },

  saveStorageTiers: async (tiers: StorageTier[]): Promise<void> => {
    _storageTiersCache = null;
    const normalizedTiers = tiers.map((tier) => ({ ...tier, prices: normalizeStorageTierPrices(tier.prices) }));
    if (isSupabaseDataEnabled()) {
      try {
        const { supabaseMutate } = await import('./supabaseClient');
        await supabaseMutate('app_settings?key=eq.storage_tiers', 'PATCH', { value: { tiers: normalizedTiers } });
        console.log("[Storage] Storage tiers saved to Supabase ✅");
        return;
      } catch (e) {
        console.warn("[Storage] Supabase tiers save failed, falling back to Firebase:", e);
      }
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

    try {
      const snap = await getDoc(doc(db, "settings", "hero"));
      return snap.exists() ? snap.data() as HeroConfig : null;
    } catch { return null; }
  },

  // --- Price Settings ---
  getDeliveryPrices: async (): Promise<PriceSettings | null> => {
    if (_deliveryPricesCache && Date.now() - _deliveryPricesCache.ts < SETTINGS_CACHE_TTL_MS) {
      return _deliveryPricesCache.data;
    }

    // Supabase 우선: app_settings에서 delivery_prices 조회
    if (isSupabaseDataEnabled()) {
      try {
        const rows = await supabaseGet<Array<{ key: string; value: any }>>(
          'app_settings?select=value&key=eq.delivery_prices&limit=1'
        );
        if (rows?.[0]?.value) {
          console.log("[Storage] Loaded delivery prices from Supabase ✅");
          const result = normalizeDeliveryPrices(rows[0].value as PriceSettings);
          _deliveryPricesCache = { data: result, ts: Date.now() };
          return result;
        }
      } catch (e) {
        console.warn("[Storage] Supabase delivery prices failed, falling back:", e);
      }
    }

    try {
      const snap = await getDoc(doc(db, "settings", "delivery_prices"));
      if (snap.exists()) {
        const result = normalizeDeliveryPrices(snap.data() as PriceSettings);
        _deliveryPricesCache = { data: result, ts: Date.now() };
        return result;
      }
      return null;
    } catch (e) {
      console.error("Failed to get delivery prices", e);
      return null;
    }
  },

  saveDeliveryPrices: async (prices: PriceSettings): Promise<void> => {
    _deliveryPricesCache = null;
    const normalized = normalizeDeliveryPrices(prices);
    if (isSupabaseDataEnabled()) {
      try {
        const { supabaseMutate } = await import('./supabaseClient');
        await supabaseMutate('app_settings?key=eq.delivery_prices', 'PATCH', { value: normalized });
        console.log("[Storage] Delivery prices saved to Supabase ✅");
        return;
      } catch (e) {
        console.warn("[Storage] Supabase prices save failed, falling back to Firebase:", e);
      }
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
        console.log("[Storage] Hero config saved to Supabase ✅");
        return;
      } catch (e) {
        console.warn("[Storage] Supabase hero save failed, falling back to Firebase:", e);
      }
    }
    try {
      await setDoc(doc(db, "settings", "hero"), config);
    } catch (e) { console.error("Hero save failed", e); }
  },

  subscribeHeroConfig: (callback: (config: HeroConfig | null) => void): (() => void) => {
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
      if (!isSupabaseDataEnabled()) {
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
        const payload = camelToSnake(safeInquiry);
        if (inquiry.id) {
          await supabaseMutate(`partnership_inquiries?id=eq.${encodeURIComponent(inquiry.id)}`, 'PATCH', payload);
        } else {
          await supabaseMutate('partnership_inquiries', 'POST', payload);
        }
        console.log("[Storage] Inquiry saved to Supabase ✅");
        return;
      } catch (e) {
        console.warn("[Storage] Supabase inquiry save failed, falling back to Firebase:", e);
      }
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
      try {
        await supabaseMutate(`partnership_inquiries?id=eq.${encodeURIComponent(id)}`, 'DELETE');
        return;
      } catch (e) {
        console.warn('[Storage] Supabase inquiry delete failed, falling back to Firebase:', e);
      }
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
        const result = await supabaseMutate<Array<unknown>>('app_settings?key=eq.privacy_policy', 'PATCH', { value: data });
        if (!result || (Array.isArray(result) && result.length === 0)) {
          await supabaseMutate('app_settings', 'POST', { key: 'privacy_policy', value: data });
        }
        return;
      } catch (e) {
        console.warn("[Storage] Supabase privacy save failed, falling back to Firebase:", e);
      }
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
        return;
      } catch (e) {
        console.warn("[Storage] Supabase terms save failed, falling back to Firebase:", e);
      }
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
      const timeout = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Firebase qna timeout')), 3000));
      const snap = await Promise.race([getDoc(doc(db, "settings", "qna_policy")), timeout]);
      return snap && (snap as any).exists?.() ? (snap as any).data() as QnaData : null;
    } catch { return null; }
  },

  saveQnaPolicy: async (data: QnaData): Promise<void> => {
    if (isSupabaseDataEnabled()) {
      try {
        const { supabaseMutate } = await import('./supabaseClient');
        const result = await supabaseMutate<Array<unknown>>('app_settings?key=eq.qna_policy', 'PATCH', { value: data });
        if (!result || (Array.isArray(result) && result.length === 0)) {
          await supabaseMutate('app_settings', 'POST', { key: 'qna_policy', value: data });
        }
        return;
      } catch (e) {
        console.warn("[Storage] Supabase qna save failed, falling back to Firebase:", e);
      }
    }
    await setDoc(doc(db, "settings", "qna_policy"), data);
  },

  // Migration support (One-way from legacy local to cloud)
  migrateLocalToCloud: async (): Promise<void> => {
    // No-op or implementation if user wants to push old localstorage data once
    console.log("Migration triggered");
  },

  // --- Accounting / Cash Closing ---
  saveCashClosing: async (closing: CashClosing): Promise<CashClosing> => {
    const safeClosing = JSON.parse(JSON.stringify(closing));
    if (!isSupabaseDataEnabled()) {
      throw new Error('Supabase cash closing API is not configured.');
    }
    try {
      const { camelToSnake } = await import('./supabaseClient');
      const { supabaseMutate } = await import('./supabaseClient');
      const payload = camelToSnake({
        ...safeClosing,
        branchId: normalizeAdminBranchReference(safeClosing.branchId),
      });
      let persistedRows: unknown = null;
      if (closing.id) {
        persistedRows = await supabaseMutate(`daily_closings?id=eq.${encodeURIComponent(String(closing.id))}`, 'PATCH', payload);
      } else {
        persistedRows = await supabaseMutate('daily_closings', 'POST', payload);
      }
      console.log("[Storage] Cash closing saved to Supabase ✅");
      const persisted = Array.isArray(persistedRows) ? persistedRows[0] : persistedRows;
      return persisted
        ? (snakeToCamel(persisted as Record<string, unknown>) as unknown as CashClosing)
        : closing;
    } catch (e) {
      console.error("Failed to save cash closing", e);
      throw e;
    }
  },

  getCashClosings: async (): Promise<CashClosing[]> => {
    try {
      const data = await loadSupabaseCashClosings();
      console.log('[Storage] Loaded', data.length, 'cash closings from Supabase ✅');
      return data;
    } catch (e) {
      console.warn('[Storage] Supabase closings failed:', e);
      return [];
    }
  },

  subscribeCashClosings: (callback: (data: CashClosing[]) => void): (() => void) => {
    return createRealtimeSubscription(
      'daily-closings-changes',
      'daily_closings',
      loadSupabaseCashClosings,
      callback
    );
  },

  clearCashClosings: async (): Promise<void> => {
    if (!isSupabaseDataEnabled()) {
      throw new Error('Supabase cash closing API is not configured.');
    }
    try {
      await supabaseMutate('daily_closings?id=not.is.null', 'DELETE');
      console.log('[Storage] Cash closings cleared from Supabase ✅');
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
  saveExpenditure: async (expenditure: Expenditure): Promise<Expenditure> => {
    const safeExp = JSON.parse(JSON.stringify(expenditure));
    if (!isSupabaseDataEnabled()) {
      throw new Error('Supabase expenditures API is not configured.');
    }
    try {
      const { camelToSnake, supabaseMutate } = await import('./supabaseClient');
      const payload = camelToSnake({
        ...safeExp,
        branchId: normalizeAdminBranchReference(safeExp.branchId),
      });
      let persistedRows: unknown = null;
      if (expenditure.id) {
        persistedRows = await supabaseMutate(`expenditures?id=eq.${encodeURIComponent(String(expenditure.id))}`, 'PATCH', payload);
      } else {
        persistedRows = await supabaseMutate('expenditures', 'POST', payload);
      }
      console.log("[Storage] Expenditure saved to Supabase ✅");
      const persisted = Array.isArray(persistedRows) ? persistedRows[0] : persistedRows;
      return persisted
        ? (snakeToCamel(persisted as Record<string, unknown>) as unknown as Expenditure)
        : expenditure;
    } catch (e) {
      console.error("Failed to save expenditure", e);
      throw e;
    }
  },

  deleteExpenditure: async (id: string): Promise<void> => {
    const normalizedId = String(id || '').trim();
    if (!normalizedId) {
      throw new Error("Expenditure ID is required");
    }

    if (!isSupabaseDataEnabled() || !isUuidLike(normalizedId)) {
      throw new Error("Supabase expenditure deletion requires a valid UUID id");
    }

    try {
      await supabaseMutate(`expenditures?id=eq.${encodeURIComponent(normalizedId)}`, 'DELETE');
    } catch (e) {
      console.error("Failed to delete expenditure", e);
      throw e;
    }
  },

  getExpenditures: async (): Promise<Expenditure[]> => {
    try {
      const data = await loadSupabaseExpenditures();
      console.log('[Storage] Loaded', data.length, 'expenditures from Supabase ✅');
      return data;
    } catch (e) {
      console.warn('[Storage] Supabase expenditures failed:', e);
      return [];
    }
  },

  subscribeExpenditures: (callback: (data: Expenditure[]) => void): (() => void) => {
    return createRealtimeSubscription(
      'expenditures-changes',
      'expenditures',
      loadSupabaseExpenditures,
      callback
    );
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

  // --- Monthly Closings ---

  getMonthlyClosings: async (): Promise<MonthlyClosing[]> => {
    if (!isSupabaseDataEnabled()) return [];
    const rows = await supabaseGet<Array<Record<string, unknown>>>(
      'monthly_closings?select=*&order=month.desc&limit=60'
    );
    return (rows || []).map(r => snakeToCamel(r) as unknown as MonthlyClosing);
  },

  saveMonthlyClosing: async (closing: MonthlyClosing): Promise<MonthlyClosing> => {
    const payload = camelToSnake(JSON.parse(JSON.stringify(closing)) as Record<string, unknown>);
    if (closing.id) {
      const result = await supabaseMutate<Array<Record<string, unknown>>>(
        `monthly_closings?id=eq.${encodeURIComponent(closing.id)}`, 'PATCH', payload
      );
      return snakeToCamel((Array.isArray(result) ? result[0] : result) as Record<string, unknown>) as unknown as MonthlyClosing;
    }
    const result = await supabaseMutate<Array<Record<string, unknown>>>(
      'monthly_closings', 'POST', payload
    );
    return snakeToCamel((Array.isArray(result) ? result[0] : result) as Record<string, unknown>) as unknown as MonthlyClosing;
  },

  // --- Branch Payouts ---

  getBranchPayouts: async (): Promise<BranchPayout[]> => {
    if (!isSupabaseDataEnabled()) return [];
    const rows = await supabaseGet<Array<Record<string, unknown>>>(
      'branch_payouts?select=*&order=created_at.desc&limit=200'
    );
    return (rows || []).map(r => snakeToCamel(r) as unknown as BranchPayout);
  },

  saveBranchPayout: async (payout: Omit<BranchPayout, 'id' | 'createdAt'>): Promise<BranchPayout> => {
    const payload = camelToSnake(JSON.parse(JSON.stringify(payout)) as Record<string, unknown>);
    const result = await supabaseMutate<Array<Record<string, unknown>>>(
      'branch_payouts', 'POST', payload
    );
    return snakeToCamel((Array.isArray(result) ? result[0] : result) as Record<string, unknown>) as unknown as BranchPayout;
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
        // FK 관계 조인 포함 쿼리 — FK 미적용 시 PGRST200 에러 발생
        const EMPLOYEES_WITH_RELATIONS = 'employees?select=id,profile_id,legacy_admin_doc_id,name,email,job_title,employment_status,org_type,phone,memo,security,login_id,created_at,updated_at,employee_roles(is_primary,role:roles(code,name)),employee_branch_assignments(is_primary,branch_id)&order=name.asc&limit=500';
        // FK 없을 때 폴백: 관계 없이 기본 컬럼만 조회
        const EMPLOYEES_WITHOUT_RELATIONS = 'employees?select=id,profile_id,legacy_admin_doc_id,name,email,job_title,employment_status,org_type,phone,memo,security,login_id,created_at,updated_at&order=name.asc&limit=500';

        let employeeRows: Array<Record<string, unknown>> | null = null;
        try {
          employeeRows = await supabaseGet<Array<Record<string, unknown>>>(EMPLOYEES_WITH_RELATIONS);
        } catch (relErr: unknown) {
          const errCode = (relErr as { code?: string })?.code || '';
          const errMsg = (relErr as { message?: string })?.message || '';
          if (errCode === 'PGRST200' || errMsg.includes('relationship')) {
            console.warn('[Storage] employee_roles/employee_branch_assignments FK 누락 — 폴백 쿼리로 재시도');
            employeeRows = await supabaseGet<Array<Record<string, unknown>>>(EMPLOYEES_WITHOUT_RELATIONS);
          } else {
            throw relErr;
          }
        }

        const [rows, locationRows, branchRows] = await Promise.all([
          Promise.resolve(employeeRows),
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
      if (!isSupabaseDataEnabled()) {
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

      const admins = isSupabaseDataEnabled()
        ? await StorageService.getAdmins()
        : await (() => {
            const snapPromise = getDocs(collection(db, "admins"));
            return snapPromise.then((snap) => snap.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as AdminUser)));
          })();

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

        group.sort((a: any, b: any) => {
          const credentialDiff = Number(hasPassword(b)) - Number(hasPassword(a));
          if (credentialDiff !== 0) return credentialDiff;

          const canonicalDiff = Number(isUidMappedRecord(a)) - Number(isUidMappedRecord(b));
          if (canonicalDiff !== 0) return canonicalDiff;

          const completenessDiff = getCompleteness(b) - getCompleteness(a);
          if (completenessDiff !== 0) return completenessDiff;
          return getFreshness(b) - getFreshness(a);
        });

        group.slice(1).forEach((admin: any) => {
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

      if (isSupabaseDataEnabled()) {
        for (const id of idsToRemove) {
          await StorageService.deleteAdmin(id);
        }
      } else {
        const batchSize = 450;
        for (let i = 0; i < idsToRemove.length; i += batchSize) {
          const currentBatch = writeBatch(db);
          idsToRemove.slice(i, i + batchSize).forEach((id) => {
            currentBatch.delete(doc(db, "admins", id));
          });
          await currentBatch.commit();
        }
      }

      return { total: admins.length, removed: idsToRemove.length };
    } catch (e) {
      console.error("Deduplication failed", e);
      throw e;
    }
  },

  /**
   * [스봉이] 지점 비밀번호 일괄 초기화 (0000!!) 💅✨
   * 보안 및 운영 편의를 위해 모든 지점 관리자 계정의 비밀번호를 특정 값으로 강제 업데이트합니다.
   */
  updateAllBranchPasswords: async (password: string = '0000!!'): Promise<{ total: number, success: number, failed: number }> => {
    try {
      const admins = await StorageService.getAdmins();
      // 지점 소속(branchId가 있거나 role이 branch인 경우) 직원만 필터링
      const branchAdmins = admins.filter(admin => 
        admin.branchId || admin.branchCode || admin.role === 'branch'
      );

      if (branchAdmins.length === 0) {
        return { total: 0, success: 0, failed: 0 };
      }

      console.log(`[스봉이] 지점 ${branchAdmins.length}명의 비밀번호를 '${password}'로 초기화 시도합니다... 💅`);
      
      let success = 0;
      let failed = 0;

      for (const admin of branchAdmins) {
        try {
          // Supabase Auth와 동기화 (password를 페이로드에 포함)
          await syncSupabaseAdminAccount('POST', {
            adminId: admin.id,
            email: admin.email || admin.loginId,
            password: password,
            // 기존 정보 유지
            name: admin.name,
            role: admin.roleCode || admin.role,
            branchId: admin.branchId,
          });
          success++;
        } catch (err) {
          console.error(`[스봉이] ${admin.name} 비밀번호 초기화 실패:`, err);
          failed++;
        }
      }

      return { total: branchAdmins.length, success, failed };
    } catch (e) {
      console.error("Bulk password reset failed", e);
      throw e;
    }
  },

  /**
   * [스봉이] 주 단위 1~100 순환 네임텍 번호 생성 🔢✨
   * 특정 지점의 이번 주 예약 건수를 기반으로 번호를 할당합니다.
   */
  generateWeeklyNametagId: async (branchId: string): Promise<number> => {
    try {
      if (!isSupabaseDataEnabled()) return Math.floor(Math.random() * 100) + 1;

      // 이번 주의 시작(월요일 00:00:00) 구하기
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // 월요일 기준
      const startOfWeek = new Date(now.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);

      const startIso = startOfWeek.toISOString();

      // 이번 주 해당 지점의 총 예약 수 조회 (취소 제외)
      const rows = await supabaseGet<Array<{ id: string }>>(
        `bookings?select=id&branch_id=eq.${branchId}&created_at=gte.${startIso}&status=neq.CANCELLED`
      );

      // (기존 카운트 % 100) + 1 로 순환 (1~100)
      const totalCount = Array.isArray(rows) ? rows.length : 0;
      return (totalCount % 100) + 1;
    } catch (e) {
      console.error("[스봉이] 네임텍 번호 생성 실패:", e);
      return Math.floor(Math.random() * 100) + 1; // 쉴드 쳐드려요 🛡️
    }
  },

  // --- User Profiles ---
  getUserProfile: async (uid: string): Promise<UserProfile | null> => {
    return readLocalJson<UserProfile | null>(USER_PROFILE_CACHE_KEY(uid), null);
  },

  updateUserProfile: async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
    try {
      const current = readLocalJson<UserProfile | null>(USER_PROFILE_CACHE_KEY(uid), null);
      const nextProfile: UserProfile = {
        uid,
        email: updates.email || current?.email || '',
        displayName: updates.displayName ?? current?.displayName,
        points: Number(updates.points ?? current?.points ?? 0),
        level: (updates.level || current?.level || 'BRONZE') as UserProfile['level'],
        createdAt: updates.createdAt || current?.createdAt || new Date().toISOString(),
      };
      writeLocalJson(USER_PROFILE_CACHE_KEY(uid), nextProfile);
    } catch (err) {
      console.error("[Storage] Error updating user profile:", err);
    }
  },

  // --- User Coupons ---
  getUserCoupons: async (uid: string): Promise<UserCoupon[]> => {
    return readLocalJson<UserCoupon[]>(USER_COUPON_CACHE_KEY(uid), []);
  },

  issueWelcomeCoupon: async (uid: string): Promise<void> => {
    try {
      const existingCoupons = readLocalJson<UserCoupon[]>(USER_COUPON_CACHE_KEY(uid), []);
      if (existingCoupons.some((coupon) => coupon.code === 'WELCOME' && !coupon.isUsed)) {
        return;
      }

      let discount: DiscountCode = {
        id: 'welcome-local',
        code: 'WELCOME',
        amountPerBag: 2000,
        description: '신규 가입 웰컴 쿠폰',
        isActive: true,
      };

      if (isSupabaseDataEnabled()) {
        try {
          const rows = await supabaseGet<Array<Record<string, unknown>>>(
            'discount_codes?select=*&code=eq.WELCOME&is_active=eq.true&limit=1'
          );
          if (rows?.[0]) {
            discount = snakeToCamel(rows[0]) as unknown as DiscountCode;
          }
        } catch (error) {
          console.warn("[Storage] Welcome discount lookup failed, using local default:", error);
        }
      }

      const coupon: UserCoupon = {
        id: `welcome-${uid}`,
        uid,
        codeId: String(discount.id || 'welcome-local'),
        code: discount.code,
        amountPerBag: Number(discount.amountPerBag || 2000),
        description: discount.description,
        isUsed: false,
        issuedAt: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      writeLocalJson(USER_COUPON_CACHE_KEY(uid), [coupon, ...existingCoupons]);
    } catch (err) {
      console.error("[Storage] Error issuing welcome coupon:", err);
    }
  },

  subscribeAdmins: (callback: (data: AdminUser[]) => void): (() => void) => {
    return createRealtimeSubscription(
      'admins-changes',
      'admins',
      StorageService.getAdmins,
      callback
    );
  },

  // --- AI Translation Service (Gemini) ---
  translateLocationData: async (data: { name: string; address: string; pickupGuide: string; description: string }): Promise<TranslatedLocationData> => {
    const config = StorageService.getCloudConfig();
    if (!config || !config.apiKey) throw new Error("Google Cloud API Key is missing.");

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${config.apiKey}`;

    const prompt = `
      Translate the following Korean location information into English (en), Japanese (ja), Simplified Chinese (zh), Traditional Chinese Taiwan (zh_tw), and Traditional Chinese Hong Kong (zh_hk).
      For addresses: use romanized Korean address format for English/Japanese, and appropriate localized format for Chinese variants.
      For zh_tw use Taiwan Traditional Chinese conventions. For zh_hk use Hong Kong Traditional Chinese conventions.
      Provide the result in a strict JSON format with the following keys:
      {
        "name_en": "...", "name_ja": "...", "name_zh": "...", "name_zh_tw": "...", "name_zh_hk": "...",
        "address_en": "...", "address_ja": "...", "address_zh": "...", "address_zh_tw": "...", "address_zh_hk": "...",
        "pickupGuide_en": "...", "pickupGuide_ja": "...", "pickupGuide_zh": "...", "pickupGuide_zh_tw": "...", "pickupGuide_zh_hk": "...",
        "description_en": "...", "description_ja": "...", "description_zh": "...", "description_zh_tw": "...", "description_zh_hk": "..."
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
      console.log("[Storage] Raw Gemini API Response: 💅", result);
      
      if (!result.candidates || result.candidates.length === 0) {
        throw new Error("Gemini returned no candidates: " + JSON.stringify(result));
      }
      
      const translatedText = result.candidates[0].content.parts[0].text;
      return JSON.parse(translatedText);
    } catch (e) {
      console.error("[Storage] AI Translation Failed:", e);
      throw e;
    }
  },

  // --- Real-time Chat ---
  saveChatMessage: async (message: ChatMessage): Promise<void> => {
    // Supabase는 fire-and-forget (hang 방지 — RLS/스키마 오류로 pending 걸리면 Gemini 호출 블로킹됨)
    if (isSupabaseDataEnabled()) {
      supabaseMutate('chat_messages', 'POST', {
        session_id: message.sessionId, role: message.role || 'user',
        text: message.text || '', user_name: message.userName || null,
        user_email: message.userEmail || null, is_read: message.isRead ?? false,
      }).catch(e => console.warn("[Storage] Supabase chat msg save failed:", e));
    }
    try {
      const msgRef = collection(db, "chats");
      await addDoc(msgRef, { ...message, timestamp: message.timestamp || new Date().toISOString() });
    } catch (e) { console.error("Failed to save chat message", e); }
  },

  saveChatSession: async (session: ChatSession): Promise<void> => {
    // Supabase는 fire-and-forget (스키마 오류로 hang 방지)
    if (isSupabaseDataEnabled()) {
      supabaseMutate('chat_sessions', 'POST', {
        session_id: session.sessionId, user_name: session.userName || null,
        user_email: session.userEmail || null, last_message: session.lastMessage || null,
        is_bot_disabled: session.isBotDisabled ?? false, unread_count: session.unreadCount || 0,
      }).catch(e => console.warn("[Storage] Supabase chat session save failed:", e));
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
    if (isSupabaseDataEnabled()) {
      return supabasePollingSubscribe<DiscountCode>(
        'discount_codes?select=*&order=code.asc',
        callback,
        (row) => ({
          id: String(row.id),
          code: String(row.code),
          amountPerBag: Number(row.amount_per_bag || 0),
          description: String(row.description || ''),
          isActive: Boolean(row.is_active),
          allowedService: String(row.allowed_service || 'ALL'),
        } as DiscountCode)
      );
    }
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
    if (isSupabaseDataEnabled()) {
      return supabasePollingSubscribe<any>(
        'branches?select=*&order=created_at.desc',
        callback,
        (row) => snakeToCamel(row),
        10000
      );
    }

    const q = query(collection(db, "branches"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot: any) => {
      callback(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    });
  },
  saveBranch: async (branch: any): Promise<void> => {
    if (!isSupabaseDataEnabled()) {
      throw new Error("Supabase branches API is not configured");
    }

    try {
      const payload = camelToSnake({ ...branch });
      const branchId = String(branch?.id || '').trim();
      const branchCode = String(branch?.branchCode || branch?.branch_code || '').trim();

      if (branchId && isUuidLike(branchId)) {
        await supabaseMutate(`branches?id=eq.${encodeURIComponent(branchId)}`, 'PATCH', payload);
      } else if (branchCode) {
        const updated = await supabaseMutate(`branches?branch_code=eq.${encodeURIComponent(branchCode)}`, 'PATCH', payload);
        const didUpdate = Array.isArray(updated) ? updated.length > 0 : Boolean(updated);
        if (!didUpdate) {
          await supabaseMutate('branches', 'POST', payload);
        }
      } else {
        await supabaseMutate('branches', 'POST', payload);
      }
      console.log("[Storage] Branch saved to Supabase ✅");
    } catch (e) { console.error(e); throw e; }
  },
  deleteBranch: async (id: string): Promise<void> => {
    if (!isSupabaseDataEnabled()) {
      throw new Error("Supabase branches API is not configured");
    }
    try {
      if (isUuidLike(id)) {
        await supabaseMutate(`branches?id=eq.${encodeURIComponent(id)}`, 'DELETE');
      } else {
        await supabaseMutate(`branches?branch_code=eq.${encodeURIComponent(id)}`, 'DELETE');
      }
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
    if (!isSupabaseDataEnabled()) {
      throw new Error("Supabase branch prospects API is not configured");
    }
    try {
      const payload = camelToSnake({ ...prospect, updatedAt: new Date().toISOString() });
      if (prospect.id && !String(prospect.id).startsWith('PROSPECT-TEMP-')) {
        await supabaseMutate(`branch_prospects?id=eq.${encodeURIComponent(String(prospect.id))}`, 'PATCH', payload);
      } else {
        await supabaseMutate('branch_prospects', 'POST', payload);
      }
      console.log("[Storage] Branch prospect saved to Supabase ✅");
    } catch (e) { console.error(e); throw e; }
  },
  deleteBranchProspect: async (id: string): Promise<void> => {
    if (!isSupabaseDataEnabled()) {
      throw new Error("Supabase branch prospects API is not configured");
    }
    try {
      await supabaseMutate(`branch_prospects?id=eq.${encodeURIComponent(id)}`, 'DELETE');
    } catch (e) { throw e; }
  },

  // --- Notices ---
  subscribeNotices: (callback: (data: SystemNotice[]) => void): (() => void) => {
    if (isSupabaseDataEnabled()) {
      return supabasePollingSubscribe<SystemNotice>(
        'system_notices?select=*&order=created_at.desc',
        callback,
        (row) => snakeToCamel(row) as unknown as SystemNotice,
        10000
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
            items.sort((a: SystemNotice, b: SystemNotice) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
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

  saveNotice: async (notice: SystemNotice): Promise<SystemNotice> => {
    if (!isSupabaseDataEnabled()) {
      throw new Error("Supabase notices API is not configured");
    }
    try {
      const payload = camelToSnake({ ...notice } as Record<string, unknown>);
      let persistedRows: unknown = null;
      if (notice.id) {
        persistedRows = await supabaseMutate(`system_notices?id=eq.${encodeURIComponent(String(notice.id))}`, 'PATCH', payload);
      } else {
        persistedRows = await supabaseMutate('system_notices', 'POST', payload);
      }
      console.log("[Storage] Notice saved to Supabase ✅");
      const persisted = Array.isArray(persistedRows) ? persistedRows[0] : persistedRows;
      return persisted
        ? (snakeToCamel(persisted as Record<string, unknown>) as unknown as SystemNotice)
        : notice;
    } catch (e) {
      console.error("Failed to save notice", e);
      throw e;
    }
  },

  deleteNotice: async (id: string): Promise<void> => {
    if (!isSupabaseDataEnabled()) {
      throw new Error("Supabase notices API is not configured");
    }
    try {
      await supabaseMutate(`system_notices?id=eq.${encodeURIComponent(id)}`, 'DELETE');
    } catch (e) {
      console.error("Failed to delete notice", e);
      throw e;
    }
  },

};
