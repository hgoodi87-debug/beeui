/**
 * kioskDb — 키오스크 전용 DB 유틸
 * 메인 Supabase(xpnf...) 연동 + 오프라인 큐
 */
import { supabaseGet, supabaseMutate } from './supabaseClient';
import { getSupabaseConfig } from './supabaseRuntime';

// 키오스크는 인증 불필요 — anon key로 직접 접근 (관리자 JWT 우회)
const _ANON = getSupabaseConfig().anonKey;

// ─── 테이블 이름 ──────────────────────────────────────────────────────────
export const KIOSK_TABLES = {
  branches: 'kiosk_branches',
  settings: 'kiosk_settings',
  log: 'kiosk_storage_log',
} as const;

// ─── 타입 ─────────────────────────────────────────────────────────────────
export interface KioskBranch {
  id: string;
  slug: string;
  branch_id: string | null;
  branch_name: string;
  branch_name_en: string | null;
  is_active: boolean;
  created_at: string;
}

export interface KioskStorageLog {
  id: number;
  branch_id: string;
  date: string;
  tag: number;
  small_qty: number;
  carrier_qty: number;
  start_time: string;
  pickup_time: string;
  pickup_ts: number;
  duration: number;
  original_price: number;
  discount: number;
  payment: string;
  done: boolean;
  memo: string;
  row_label: string;
  source: string;
  commission_rate: number;
  created_at: string;
}

export interface KioskRowRule {
  label: string;
  start: string;
  end: string;
  max: number;
}

export interface KioskCfg {
  prices: {
    small_4h: number;
    carrier_2h: number;
    carrier_4h: number;
    extra_per_hour: number;
  };
  operations: {
    max_bags: number;
    close_hour: number;
    duration_options: number[];
  };
  notices: { ko: string[]; en: string[]; zh: string[] };
  discount: { unit: number; allow_free: boolean };
  admin_password: string;
  row_rules: { rows: KioskRowRule[] };
}

export const DEFAULT_CFG: KioskCfg = {
  prices: { small_4h: 4000, carrier_2h: 3000, carrier_4h: 5000, extra_per_hour: 1000 },
  operations: { max_bags: 6, close_hour: 21, duration_options: [2, 4, 5, 6, 7, 8] },
  notices: {
    ko: ['저희 매장은 오후 9시까지 운영합니다.', '현금 결제만 가능합니다.'],
    en: ['We operate until 9PM.', 'Cash payment only.'],
    zh: ['营业至晚上9点。', '仅接受现金支付。'],
  },
  discount: { unit: 1000, allow_free: true },
  admin_password: '0000',
  row_rules: {
    rows: [
      { label: 'A', start: '09:00', end: '12:00', max: 4 },
      { label: 'B', start: '12:00', end: '13:00', max: 5 },
      { label: 'C', start: '13:00', end: '14:00', max: 5 },
      { label: 'D', start: '14:00', end: '15:30', max: 5 },
      { label: 'E', start: '15:30', end: '17:00', max: 5 },
      { label: 'F', start: '17:00', end: '19:00', max: 5 },
      { label: 'G', start: '19:00', end: '21:00', max: 6 },
    ],
  },
};

// ─── 오프라인 큐 ──────────────────────────────────────────────────────────
const OFFLINE_KEY = 'kiosk_offline_queue';

interface OfflineEntry {
  ts: number;
  payload: Omit<KioskStorageLog, 'id' | 'created_at'>;
}

export const enqueueOffline = (payload: Omit<KioskStorageLog, 'id' | 'created_at'>): void => {
  try {
    const existing: OfflineEntry[] = JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]');
    existing.push({ ts: Date.now(), payload });
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(existing));
  } catch {
    // localStorage unavailable — silently ignore
  }
};

export const getOfflineQueueSize = (): number => {
  try {
    const q: OfflineEntry[] = JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]');
    return q.length;
  } catch {
    return 0;
  }
};

// concurrent flush 방지 guard
let _isFlushing = false;

export const flushOfflineQueue = async (): Promise<number> => {
  if (_isFlushing) return 0;
  _isFlushing = true;
  try {
    const queue: OfflineEntry[] = JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]');
    if (queue.length === 0) return 0;

    // 현재 날짜의 DB 로그를 읽어 태그 재배정에 활용
    let liveLog: KioskStorageLog[] = [];
    if (queue.length > 0) {
      const branchId = queue[0].payload.branch_id;
      const date = queue[0].payload.date;
      try {
        liveLog = await supabaseGet<KioskStorageLog[]>(
          `${KIOSK_TABLES.log}?branch_id=eq.${encodeURIComponent(branchId)}&date=eq.${date}&order=tag.asc`,
          _ANON
        );
      } catch {
        // 조회 실패 시 빈 배열로 진행 (DB가 없으면 태그 재배정 불가 — 그래도 시도)
      }
    }

    let flushed = 0;
    const remaining: OfflineEntry[] = [];

    for (const entry of queue) {
      try {
        // 태그 재배정: 오프라인 중 DB에 이미 삽입된 태그와 충돌 방지
        const usedTags = new Set(liveLog.map((e) => e.tag));
        let newTag = entry.payload.tag;
        // stale tag가 이미 사용 중이면 다음 빈 번호로 재배정
        if (usedTags.has(newTag)) {
          newTag = 1;
          while (usedTags.has(newTag)) newTag++;
        }

        const body = {
          ...entry.payload,
          tag: newTag,
          commission_rate: 0,
          source: 'kiosk',
        };
        const result = await supabaseMutate<KioskStorageLog[]>(`${KIOSK_TABLES.log}`, 'POST', body, _ANON);
        if (result?.[0]) {
          liveLog.push(result[0]); // 성공한 항목을 liveLog에 추가해 다음 항목이 피하도록
        }
        flushed++;
      } catch {
        remaining.push(entry);
      }
    }

    localStorage.setItem(OFFLINE_KEY, JSON.stringify(remaining));
    return flushed;
  } catch {
    return 0;
  } finally {
    _isFlushing = false;
  }
};

// ─── Branch 조회 ──────────────────────────────────────────────────────────
export const loadBranchBySlug = async (slug: string): Promise<KioskBranch | null> => {
  try {
    const rows = await supabaseGet<KioskBranch[]>(
      `${KIOSK_TABLES.branches}?slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&limit=1`,
      _ANON
    );
    return rows?.[0] ?? null;
  } catch (e) {
    console.error('[kioskDb] loadBranchBySlug error:', e);
    return null;
  }
};

export const loadAllActiveBranches = async (): Promise<KioskBranch[]> => {
  try {
    return await supabaseGet<KioskBranch[]>(
      `${KIOSK_TABLES.branches}?is_active=eq.true&order=branch_name.asc`,
      _ANON
    );
  } catch {
    return [];
  }
};

// ─── Settings 조회 (default fallback 포함) ───────────────────────────────
export const loadSettings = async (branchId: string): Promise<KioskCfg> => {
  try {
    // branch + default 동시 조회
    const rows = await supabaseGet<Array<{ branch_id: string; key: string; value: unknown }>>(
      `${KIOSK_TABLES.settings}?branch_id=in.(${encodeURIComponent(branchId)},default)`,
      _ANON
    );

    const merged: Record<string, unknown> = {};

    // default 먼저 (낮은 우선순위)
    for (const row of rows.filter((r) => r.branch_id === 'default')) {
      merged[row.key] = row.value;
    }
    // branch 값으로 덮어쓰기 (높은 우선순위)
    for (const row of rows.filter((r) => r.branch_id === branchId)) {
      merged[row.key] = row.value;
    }

    return {
      prices: (merged.prices as KioskCfg['prices']) ?? DEFAULT_CFG.prices,
      operations: (merged.operations as KioskCfg['operations']) ?? DEFAULT_CFG.operations,
      notices: (merged.notices as KioskCfg['notices']) ?? DEFAULT_CFG.notices,
      discount: (merged.discount as KioskCfg['discount']) ?? DEFAULT_CFG.discount,
      admin_password: typeof merged.admin_password === 'string'
        ? merged.admin_password
        : DEFAULT_CFG.admin_password,
      row_rules: (merged.row_rules as KioskCfg['row_rules']) ?? DEFAULT_CFG.row_rules,
    };
  } catch (e) {
    console.warn('[kioskDb] loadSettings failed, using defaults:', e);
    return DEFAULT_CFG;
  }
};

export const upsertSetting = async (
  branchId: string,
  key: string,
  value: unknown
): Promise<void> => {
  await supabaseMutate(
    `${KIOSK_TABLES.settings}?branch_id=eq.${encodeURIComponent(branchId)}&key=eq.${encodeURIComponent(key)}`,
    'PATCH',
    { value, updated_at: new Date().toISOString() }
  );
};

// ─── Storage Log CRUD ─────────────────────────────────────────────────────

/**
 * 태그 중복 시 자동 재배정 후 재시도 (최대 3회)
 * UNIQUE(branch_id, date, tag) 제약 위반 시 다음 빈 번호로 교체
 */
export const insertStorageLog = async (
  payload: Omit<KioskStorageLog, 'id' | 'created_at'>
): Promise<KioskStorageLog | null> => {
  const body = { ...payload, commission_rate: 0, source: 'kiosk' };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await supabaseMutate<KioskStorageLog[]>(KIOSK_TABLES.log, 'POST', body, _ANON);
      return result?.[0] ?? null;
    } catch (e: unknown) {
      const isUniqueViolation =
        typeof e === 'object' && e !== null &&
        ('code' in e ? (e as { code?: string }).code === '23505' : false);

      if (isUniqueViolation && attempt < 2) {
        // 태그 재배정: 현재 로그 조회 후 다음 빈 번호 배정
        try {
          const current = await supabaseGet<KioskStorageLog[]>(
            `${KIOSK_TABLES.log}?branch_id=eq.${encodeURIComponent(body.branch_id)}&date=eq.${body.date}&order=tag.asc`,
            _ANON
          );
          const used = new Set(current.map((r) => r.tag));
          let nextTag = 1;
          while (used.has(nextTag)) nextTag++;
          body.tag = nextTag;
          console.warn(`[kioskDb] 태그 충돌 → ${nextTag}번으로 재배정 (시도 ${attempt + 1})`);
        } catch {
          break; // 재조회 실패 시 오프라인 큐로
        }
      } else {
        console.error('[kioskDb] insertStorageLog failed, queuing offline:', e);
        enqueueOffline(body);
        return null;
      }
    }
  }

  enqueueOffline(body);
  return null;
};

export const updateStorageLog = async (
  id: number,
  patch: Partial<KioskStorageLog>
): Promise<void> => {
  await supabaseMutate(`${KIOSK_TABLES.log}?id=eq.${id}`, 'PATCH', patch, _ANON);
};

export const loadTodayLog = async (branchId: string, date: string): Promise<KioskStorageLog[]> => {
  try {
    return await supabaseGet<KioskStorageLog[]>(
      `${KIOSK_TABLES.log}?branch_id=eq.${encodeURIComponent(branchId)}&date=eq.${date}&order=tag.asc`,
      _ANON
    );
  } catch {
    return [];
  }
};

export const loadLogById = async (id: number): Promise<KioskStorageLog | null> => {
  try {
    const rows = await supabaseGet<KioskStorageLog[]>(
      `${KIOSK_TABLES.log}?id=eq.${id}&limit=1`,
      _ANON
    );
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
};

export const loadLogRange = async (
  branchId: string,
  fromDate: string,
  toDate: string
): Promise<KioskStorageLog[]> => {
  try {
    return await supabaseGet<KioskStorageLog[]>(
      `${KIOSK_TABLES.log}?branch_id=eq.${encodeURIComponent(branchId)}&date=gte.${fromDate}&date=lte.${toDate}&order=date.desc,tag.asc`,
      _ANON
    );
  } catch {
    return [];
  }
};

// ─── 태그/구역 자동 배정 ──────────────────────────────────────────────────
export const assignTagAndRow = (
  todayEntries: KioskStorageLog[],
  cfg: KioskCfg
): { tag: number; rowLabel: string } => {
  const usedTags = new Set(todayEntries.map((e) => e.tag));
  let tag = 1;
  while (usedTags.has(tag)) tag++;

  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const rowLabel =
    cfg.row_rules.rows.find((r) => hhmm >= r.start && hhmm < r.end)?.label ?? 'A';

  return { tag, rowLabel };
};

// ─── 가격 계산 ────────────────────────────────────────────────────────────
export const calcPrice = (
  smallQty: number,
  carrierQty: number,
  duration: number,
  prices: KioskCfg['prices']
): number => {
  let total = 0;
  const { small_4h, carrier_2h, carrier_4h, extra_per_hour } = prices;

  if (smallQty > 0) {
    const extraHours = Math.max(0, duration - 4);
    total += smallQty * (small_4h + extraHours * extra_per_hour);
  }
  if (carrierQty > 0) {
    if (duration <= 2) {
      total += carrierQty * carrier_2h;
    } else {
      const extraHours = Math.max(0, duration - 4);
      total += carrierQty * (carrier_4h + extraHours * extra_per_hour);
    }
  }
  return total;
};

// ─── 날짜 유틸 ────────────────────────────────────────────────────────────
export const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const timeStr = (): string => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const addHours = (hhmm: string, hours: number): string => {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + hours * 60;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
