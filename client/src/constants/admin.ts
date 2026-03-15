import { BookingStatus } from '../../types';
import { OperatingStatus, AdminPaymentStatus, SettlementStatus } from '../domains/admin/types';

export const ADMIN_COLORS = {
    SUCCESS: '#10B981', // 초록
    WARNING: '#F59E0B', // 노랑
    ERROR: '#EF4444',   // 빨강
    INFO: '#3B82F6',    // 파랑
    NEUTRAL: '#6B7280', // 회색
    PURPLE: '#8B5CF6',  // 보라
    EMERALD: '#10B981', // 재무-수익
    SALMON: '#FB7185',  // 재무-지출
};

export const OPERATING_STATUS_CONFIG: Record<OperatingStatus, { color: string; label: string }> = {
    [OperatingStatus.BOOKED]: { color: ADMIN_COLORS.NEUTRAL, label: '예약됨' },
    [OperatingStatus.WAITING_IN]: { color: ADMIN_COLORS.WARNING, label: '입고대기' },
    [OperatingStatus.IN_STORAGE]: { color: ADMIN_COLORS.INFO, label: '보관중' },
    [OperatingStatus.WAITING_OUT]: { color: ADMIN_COLORS.WARNING, label: '출고대기' },
    [OperatingStatus.IN_TRANSIT]: { color: ADMIN_COLORS.INFO, label: '이동중' },
    [OperatingStatus.COMPLETED]: { color: ADMIN_COLORS.SUCCESS, label: '완료' },
    [OperatingStatus.CANCELLED]: { color: ADMIN_COLORS.ERROR, label: '취소' },
    [OperatingStatus.ISSUE]: { color: ADMIN_COLORS.ERROR, label: '이슈' },
};

export const BOOKING_STATUS_DISPLAY_MAP: Record<BookingStatus, OperatingStatus> = {
    [BookingStatus.PENDING]: OperatingStatus.BOOKED,
    [BookingStatus.CONFIRMED]: OperatingStatus.BOOKED,
    [BookingStatus.STORAGE]: OperatingStatus.IN_STORAGE,
    [BookingStatus.TRANSIT]: OperatingStatus.IN_TRANSIT,
    [BookingStatus.ARRIVED]: OperatingStatus.WAITING_OUT, // 도착한 것이 다음 스텝(출고) 대기일 때가 많음
    [BookingStatus.COMPLETED]: OperatingStatus.COMPLETED,
    [BookingStatus.CANCELLED]: OperatingStatus.CANCELLED,
    [BookingStatus.REFUNDED]: OperatingStatus.CANCELLED, // 환불도 취소로 간주
};

export const PAYMENT_STATUS_CONFIG: Record<AdminPaymentStatus, { color: string; label: string }> = {
    [AdminPaymentStatus.UNPAID]: { color: ADMIN_COLORS.NEUTRAL, label: '미결제' },
    [AdminPaymentStatus.PAID]: { color: ADMIN_COLORS.SUCCESS, label: '결제완료' },
    [AdminPaymentStatus.PARTIAL_REFUND]: { color: ADMIN_COLORS.WARNING, label: '부분환불' },
    [AdminPaymentStatus.REFUNDED]: { color: ADMIN_COLORS.ERROR, label: '환불완료' },
};

export const SETTLEMENT_STATUS_CONFIG: Record<SettlementStatus, { color: string; label: string }> = {
    [SettlementStatus.NONE]: { color: ADMIN_COLORS.NEUTRAL, label: '미반영' },
    [SettlementStatus.WAITING]: { color: ADMIN_COLORS.WARNING, label: '정산대기' },
    [SettlementStatus.CONFIRMED]: { color: ADMIN_COLORS.SUCCESS, label: '정산확정' },
    [SettlementStatus.ON_HOLD]: { color: ADMIN_COLORS.PURPLE, label: '정산보류' },
    [SettlementStatus.MONTHLY_INCLUDED]: { color: ADMIN_COLORS.INFO, label: '월정산반영' },
    [SettlementStatus.PAID_OUT]: { color: ADMIN_COLORS.SUCCESS, label: '지급완료' },
};

export const FINANCIAL_CONFIG = {
    VAT_RATE: 0.1,          // 부가세 10%
    VAT_DIVISOR: 11,        // 부가세 포함 금액에서 부가세 추출 시 분모 (1/11)
    CURRENCY_SYMBOL: '₩',
    DEFAULT_OPENING_CASH: 0,
};
