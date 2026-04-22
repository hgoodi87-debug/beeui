/**
 * kioskDb 단위 테스트
 * 대상: calcPrice, addHours, assignTagAndRow, flushOfflineQueue
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── 모듈 모킹 (import 전에 선언) ──────────────────────────────────────────
vi.mock('./supabaseRuntime', () => ({
  getSupabaseConfig: () => ({ url: 'https://test.supabase.co', anonKey: 'test-anon-key' }),
  getSupabaseBaseUrl: () => 'https://test.supabase.co',
}));

const mockSupabaseGet = vi.fn();
const mockSupabaseMutate = vi.fn();

vi.mock('./supabaseClient', () => ({
  supabaseGet: (...args: unknown[]) => mockSupabaseGet(...args),
  supabaseMutate: (...args: unknown[]) => mockSupabaseMutate(...args),
}));

// ── 실제 import ────────────────────────────────────────────────────────────
import {
  calcPrice,
  addHours,
  assignTagAndRow,
  flushOfflineQueue,
  enqueueOffline,
  DEFAULT_CFG,
  type KioskStorageLog,
} from './kioskDb';

// ── 헬퍼 ──────────────────────────────────────────────────────────────────
const P = DEFAULT_CFG.prices; // { small_4h:4000, carrier_4h:5000, small_day:8000, carrier_day:10000, extra_per_hour:1000 }

const makeLog = (tag: number): Omit<KioskStorageLog, 'id' | 'created_at'> => ({
  branch_id: 'br-1',
  date: '2026-04-14',
  tag,
  small_qty: 1,
  carrier_qty: 0,
  start_time: '10:00',
  pickup_time: '14:00',
  pickup_ts: 0,
  duration: 4,
  original_price: 4000,
  discount: 0,
  payment: 'cash',
  done: false,
  memo: '',
  row_label: 'A',
  source: 'kiosk',
  commission_rate: 0,
});

// ── calcPrice ─────────────────────────────────────────────────────────────
describe('calcPrice', () => {
  it('소형 1개 4시간 → 기본가 4,000', () => {
    expect(calcPrice(1, 0, 4, P)).toBe(4000);
  });

  it('소형 1개 5시간 → 4,000 + 1,000 = 5,000', () => {
    expect(calcPrice(1, 0, 5, P)).toBe(5000);
  });

  it('소형 2개 6시간 → 2 × (4,000 + 2×1,000) = 12,000', () => {
    expect(calcPrice(2, 0, 6, P)).toBe(12000);
  });

  it('캐리어 1개 2시간 → 4시간가 5,000 적용 (2h ≤ 4h)', () => {
    expect(calcPrice(0, 1, 2, P)).toBe(5000);
  });

  it('캐리어 1개 3시간 → 4시간가 5,000 적용 (3h ≤ 4h)', () => {
    expect(calcPrice(0, 1, 3, P)).toBe(5000);
  });

  it('캐리어 1개 4시간 → 5,000', () => {
    expect(calcPrice(0, 1, 4, P)).toBe(5000);
  });

  it('캐리어 1개 6시간 → 5,000 + 2×1,000 = 7,000', () => {
    expect(calcPrice(0, 1, 6, P)).toBe(7000);
  });

  it('소형+캐리어 혼합 4시간 → 4,000 + 5,000 = 9,000', () => {
    expect(calcPrice(1, 1, 4, P)).toBe(9000);
  });

  it('수량 0 → 0', () => {
    expect(calcPrice(0, 0, 4, P)).toBe(0);
  });
});

// ── addHours ──────────────────────────────────────────────────────────────
describe('addHours', () => {
  it('기본 덧셈: 10:00 + 4h → 14:00', () => {
    expect(addHours('10:00', 4)).toBe('14:00');
  });

  it('자정 넘김: 22:00 + 3h → 01:00', () => {
    expect(addHours('22:00', 3)).toBe('01:00');
  });

  it('분 보존: 09:30 + 2h → 11:30', () => {
    expect(addHours('09:30', 2)).toBe('11:30');
  });

  it('정확히 자정: 21:00 + 3h → 00:00', () => {
    expect(addHours('21:00', 3)).toBe('00:00');
  });

  it('0시간 → 동일 시각', () => {
    expect(addHours('14:15', 0)).toBe('14:15');
  });
});

// ── assignTagAndRow ───────────────────────────────────────────────────────
describe('assignTagAndRow', () => {
  afterEach(() => vi.useRealTimers());

  it('빈 로그 → tag=1, 현재 시각에 맞는 row', () => {
    // 10:30 → row A (09:00~12:00)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14T10:30:00'));
    const { tag, rowLabel } = assignTagAndRow([], DEFAULT_CFG);
    expect(tag).toBe(1);
    expect(rowLabel).toBe('A');
  });

  it('태그 1,2 사용 중 → tag=3', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14T10:00:00'));
    const entries = [makeLog(1), makeLog(2)] as unknown as KioskStorageLog[];
    const { tag } = assignTagAndRow(entries, DEFAULT_CFG);
    expect(tag).toBe(3);
  });

  it('중간 태그 빈 경우 → 빈 번호 배정 (gap fill)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14T10:00:00'));
    // 1, 3 사용 → 2 배정
    const entries = [makeLog(1), makeLog(3)] as unknown as KioskStorageLog[];
    const { tag } = assignTagAndRow(entries, DEFAULT_CFG);
    expect(tag).toBe(2);
  });

  it('13:30 → row C (13:00~14:00)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14T13:30:00'));
    const { rowLabel } = assignTagAndRow([], DEFAULT_CFG);
    expect(rowLabel).toBe('C');
  });

  it('row 범위 끝 경계: 12:00 → row B (12:00~13:00)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14T12:00:00'));
    const { rowLabel } = assignTagAndRow([], DEFAULT_CFG);
    expect(rowLabel).toBe('B');
  });

  it('영업 종료 후 21:00 → row 없음 → fallback A', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14T21:30:00'));
    const { rowLabel } = assignTagAndRow([], DEFAULT_CFG);
    expect(rowLabel).toBe('A');
  });
});

// ── flushOfflineQueue ─────────────────────────────────────────────────────
describe('flushOfflineQueue', () => {
  const OFFLINE_KEY = 'kiosk_offline_queue';

  // jsdom localStorage stub (일부 환경에서 .clear()가 없음)
  let _store: Record<string, string> = {};
  const localStorageMock: Storage = {
    get length() { return Object.keys(_store).length; },
    key: (i: number) => Object.keys(_store)[i] ?? null,
    getItem: (k: string) => _store[k] ?? null,
    setItem: (k: string, v: string) => { _store[k] = v; },
    removeItem: (k: string) => { delete _store[k]; },
    clear: () => { _store = {}; },
  };

  beforeEach(() => {
    _store = {};
    vi.stubGlobal('localStorage', localStorageMock);
    mockSupabaseGet.mockReset();
    mockSupabaseMutate.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('빈 큐 → 0 반환', async () => {
    localStorage.setItem(OFFLINE_KEY, '[]');
    const flushed = await flushOfflineQueue();
    expect(flushed).toBe(0);
    expect(mockSupabaseMutate).not.toHaveBeenCalled();
  });

  it('항목 1개 flush 성공 → 1 반환, 큐 비워짐', async () => {
    const entry = makeLog(5);
    enqueueOffline(entry);

    mockSupabaseGet.mockResolvedValue([]);
    mockSupabaseMutate.mockResolvedValue([{ ...entry, id: 99, created_at: '' }]);

    const flushed = await flushOfflineQueue();
    expect(flushed).toBe(1);
    expect(JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]')).toHaveLength(0);
  });

  it('태그 충돌 시 재배정: DB에 tag=5 존재 → 1로 재배정', async () => {
    const entry = makeLog(5);
    enqueueOffline(entry);

    const existingLog = { ...entry, id: 10, tag: 5, created_at: '' } as KioskStorageLog;
    mockSupabaseGet.mockResolvedValue([existingLog]);

    let capturedTag: number | undefined;
    mockSupabaseMutate.mockImplementation(async (_table: unknown, _method: unknown, body: { tag: number }) => {
      capturedTag = body.tag;
      return [{ ...body, id: 100, created_at: '' }];
    });

    await flushOfflineQueue();
    // tag=5 충돌 → 1로 재배정
    expect(capturedTag).toBe(1);
  });

  it('네트워크 실패 → 항목이 큐에 남음', async () => {
    const entry = makeLog(3);
    enqueueOffline(entry);

    mockSupabaseGet.mockResolvedValue([]);
    mockSupabaseMutate.mockRejectedValue(new Error('network error'));

    const flushed = await flushOfflineQueue();
    expect(flushed).toBe(0);
    expect(JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]')).toHaveLength(1);
  });
});
