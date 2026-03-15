import { BookingStatus } from '../booking/types';

/**
 * [스봉이] 운영 상태 (Operating Status)
 * 기존 BookingStatus를 실무형으로 확장했습니다.
 */
export enum OperatingStatus {
    BOOKED = '예약됨',
    WAITING_IN = '입고대기',
    IN_STORAGE = '보관중',
    WAITING_OUT = '출고대기',
    IN_TRANSIT = '이동중',
    COMPLETED = '완료',
    CANCELLED = '취소',
    ISSUE = '이슈'
}

/**
 * [스봉이] 결제 상태 (Payment Status)
 * 운영 상태와 분리하여 독립적으로 관리합니다.
 */
export enum AdminPaymentStatus {
    UNPAID = '미결제',
    PAID = '결제완료',
    PARTIAL_REFUND = '부분환불',
    REFUNDED = '환불완료'
}

/**
 * [스봉이] 정산 상태 (Settlement Status)
 * 마감 업무의 핵심이 되는 상태값입니다.
 */
export enum SettlementStatus {
    NONE = '미반영',
    WAITING = '정산대기',
    CONFIRMED = '정산확정',
    ON_HOLD = '정산보류',
    MONTHLY_INCLUDED = '월정산반영',
    PAID_OUT = '지급완료'
}

export interface AdminStats {
    todayBookings: number;
    newPayments: number;
    expectedIn: number;
    expectedOut: number;
    issueCount: number;
    settledAmount: number;
    unsettledAmount: number;      // [스봉이] 정산 미확정액 추가 💰
    exceptionCount: number;       // [스봉이] 차액 발생 등 예외 건수 추가 🛡️
    branchCompletionRate: number; // [스봉이] 지점별 마감 이행률 추가 📊
}
