/**
 * storageService 단위 테스트
 * 대상: saveBooking — STORAGE/DELIVERY RPC 분기, storageNumbers 반환 처리
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── 모듈 모킹 ──────────────────────────────────────────────────────────────
vi.mock('./supabaseRuntime', () => ({
  getSupabaseConfig: () => ({ url: 'https://test.supabase.co', anonKey: 'test-key' }),
  getSupabaseBaseUrl: () => 'https://test.supabase.co',
  resolveSupabaseUrl: (path: string) => `https://test.supabase.co${path}`,
  resolveSupabaseEndpoint: (path: string) => `https://test.supabase.co${path}`,
}));

const mockSupabaseMutate = vi.fn();
const mockSupabaseGet = vi.fn();

vi.mock('./supabaseClient', () => ({
  isSupabaseDataEnabled: () => true,
  supabaseGet: (...args: unknown[]) => mockSupabaseGet(...args),
  supabaseMutate: (...args: unknown[]) => mockSupabaseMutate(...args),
  snakeToCamel: (obj: Record<string, unknown>) => {
    // 실제 snakeToCamel 구현과 동일한 동작
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      const camelKey = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      result[camelKey] = v;
    }
    return result;
  },
  camelToSnake: (obj: Record<string, unknown>) => obj,
  supabasePollingSubscribe: vi.fn(),
  getSupabaseClient: vi.fn(),
}));

vi.mock('./adminAuthService', () => ({
  getActiveAdminRequestHeaders: () => ({}),
  isSupabaseAdminAuthEnabled: () => false,
}));

// ── 실제 import ────────────────────────────────────────────────────────────
import { StorageService } from './storageService';

// ── 헬퍼 ──────────────────────────────────────────────────────────────────
const makeBaseBooking = (overrides = {}) => ({
  id: 'test-id',
  serviceType: 'STORAGE' as const,
  pickupDate: '2026-04-24',
  pickupTime: '10:00',
  finalPrice: 10000,
  price: 10000,
  bags: 2,
  userName: '홍길동',
  userEmail: 'test@example.com',
  language: 'ko',
  agreedToTerms: true,
  agreedToPrivacy: true,
  pickupLoc: { shortCode: 'HND', supabaseId: 'loc-1', commissionRates: { delivery: 10, storage: 15 } },
  branchId: 'branch-1',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ── STORAGE 경로 ──────────────────────────────────────────────────────────
describe('saveBooking — STORAGE 경로', () => {
  it('RPC rpc/public_create_booking_details_v1 엔드포인트를 호출한다', async () => {
    mockSupabaseMutate.mockResolvedValueOnce({
      id: 'new-id',
      reservation_code: 'HND-1234',
      storage_numbers: [5],
      nametag_id: 5,
      created_at: '2026-04-24T10:00:00Z',
    });

    await StorageService.saveBooking(makeBaseBooking({ serviceType: 'STORAGE' }));

    const [endpoint, method] = mockSupabaseMutate.mock.calls[0];
    expect(endpoint).toBe('rpc/public_create_booking_details_v1');
    expect(method).toBe('POST');
  });

  it('RPC 응답의 storage_numbers를 결과에 반환한다', async () => {
    mockSupabaseMutate.mockResolvedValueOnce({
      id: 'new-id',
      reservation_code: 'HND-5678',
      storage_numbers: [7, 8],
      nametag_id: 7,
      created_at: '2026-04-24T10:00:00Z',
    });

    const result = await StorageService.saveBooking(makeBaseBooking({ serviceType: 'STORAGE' }));
    expect(result.storageNumbers).toEqual([7, 8]);
  });

  it('RPC 응답에 storage_numbers가 없으면 원래 값을 유지한다', async () => {
    mockSupabaseMutate.mockResolvedValueOnce({
      id: 'new-id',
      reservation_code: 'HND-9999',
    });

    const result = await StorageService.saveBooking(
      makeBaseBooking({ serviceType: 'STORAGE', storageNumbers: [3] })
    );
    expect(result.storageNumbers).toEqual([3]);
  });

  it('storageNumbers가 있으면 첫 번호를 nametagId 호환값으로 세팅한다', async () => {
    mockSupabaseMutate.mockResolvedValueOnce({
      id: 'new-id',
      reservation_code: 'HND-1111',
      storage_numbers: [12],
      nametag_id: 12,
    });

    const result = await StorageService.saveBooking(makeBaseBooking({ serviceType: 'STORAGE' }));
    expect(result.nametagId).toBe(12);
  });

  it('RPC가 NaN이 되는 문자열은 필터링하고 null은 0으로 변환한다', async () => {
    // Number('bad') = NaN → 필터 제거 / Number(null) = 0 → finite이므로 유지
    mockSupabaseMutate.mockResolvedValueOnce({
      id: 'new-id',
      reservation_code: 'HND-2222',
      storage_numbers: [1, 'bad', null, 3],
    });

    const result = await StorageService.saveBooking(makeBaseBooking({ serviceType: 'STORAGE' }));
    expect(result.storageNumbers).toEqual([1, 0, 3]);
  });
});

// ── DELIVERY 경로 ─────────────────────────────────────────────────────────
describe('saveBooking — DELIVERY 경로', () => {
  it('booking_details 엔드포인트를 return=minimal로 호출한다', async () => {
    mockSupabaseGet.mockResolvedValueOnce([{ id: 'nametag-id' }]); // generateWeeklyNametagId
    mockSupabaseMutate.mockResolvedValueOnce(null); // return=minimal → HTTP 204

    await StorageService.saveBooking(
      makeBaseBooking({
        serviceType: 'DELIVERY',
        returnLoc: { shortCode: 'ICN', supabaseId: 'loc-2' },
      })
    );

    const mutateCall = mockSupabaseMutate.mock.calls.find(
      ([endpoint]: [string]) => endpoint === 'booking_details'
    );
    expect(mutateCall).toBeDefined();
    expect(mutateCall![4]).toBe('return=minimal');
  });

  it('DELIVERY 결과에는 storageNumbers가 없다', async () => {
    mockSupabaseGet.mockResolvedValueOnce([]);
    mockSupabaseMutate.mockResolvedValueOnce(null);

    const result = await StorageService.saveBooking(
      makeBaseBooking({ serviceType: 'DELIVERY' })
    );
    expect(result.storageNumbers).toBeUndefined();
  });
});

// ── settlement_status ─────────────────────────────────────────────────────
describe('saveBooking — 정산 상태', () => {
  it('INSERT payload에 settlement_status=PENDING이 포함된다', async () => {
    mockSupabaseMutate.mockResolvedValueOnce({ id: 'x', reservation_code: 'HND-0001' });

    await StorageService.saveBooking(makeBaseBooking({ serviceType: 'STORAGE' }));

    const payload = mockSupabaseMutate.mock.calls[0][2];
    const body = payload?.p_payload ?? payload;
    expect(body.settlement_status).toBe('PENDING');
  });
});
