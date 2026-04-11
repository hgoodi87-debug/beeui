import { ServiceType, SnsType, BagSizes } from '../shared/types';
import { LocationOption } from '../location/types';

export enum BookingStatus {
    PENDING = '접수완료',
    CONFIRMED = '예약완료',
    STORAGE = '보관중',
    TRANSIT = '이동중',
    ARRIVED = '목적지도착',
    COMPLETED = '완료',
    CANCELLED = '취소됨',
    REFUNDED = '환불완료'
}

export interface ReservationInfo {
    userName: string;
    userEmail: string;
    snsChannel: string;
    snsId: string;
    country?: string; 
    agreedToHighValue?: boolean;
}

export interface BookingState {
    id?: string;
    userId?: string; // 🛡️ [스봉이] 주인님 ID 자리를 마련했습니다!
    serviceType: ServiceType;
    pickupLoc?: LocationOption;
    returnLoc?: LocationOption;
    pickupLocation: string;
    dropoffLocation: string;
    pickupDate: string;
    pickupTime: string;
    dropoffDate: string;
    deliveryTime: string;
    returnDate?: string;
    returnTime?: string;
    bags: number;
    bagSizes: BagSizes;
    price: number;
    userName: string;
    userEmail: string;
    snsChannel: string;
    snsId: string;
    status: BookingStatus;
    country?: string;
    createdAt: string;
    promoCode?: string;
    discountCode?: string;
    discountAmount?: number;
    discountApplied?: number;
    finalPrice?: number;
    snsType?: SnsType;
    paymentMethod?: 'card' | 'cash' | 'apple' | 'samsung' | 'wechat' | 'alipay' | 'naver' | 'kakao' | 'paypal';
    paymentStatus?: 'pending' | 'paid' | 'cancelled';
    paymentProvider?: 'toss' | 'manual' | 'other';
    paymentOrderId?: string;
    paymentKey?: string;
    paymentReceiptUrl?: string;
    paymentApprovedAt?: string;
    pickupAddress?: string;
    pickupAddressDetail?: string;
    dropoffAddress?: string;
    dropoffAddressDetail?: string;
    selectedStorageTierId?: string;
    aiAnalysis?: string;
    workspaceSynced?: boolean;
    language?: string;
    agreedToTerms?: boolean;
    agreedToPrivacy?: boolean;
    agreedToHighValue?: boolean;
    agreedToPremium?: boolean;
    insuranceLevel?: 1 | 2 | 3;
    insuranceBagCount?: number;
    useInsurance?: boolean;
    insuranceFee?: number;        // 보험료 확정액 (DB insurance_fee 컬럼)
    creditUsed?: number;          // 예약 시 사용된 크레딧 금액 (DB credit_used 컬럼)
    isDeleted?: boolean;
    recaptchaToken?: string;
    weightSurcharge5kg?: number;
    weightSurcharge10kg?: number;
    imageUrl?: string;
    pickupImageUrl?: string;
    reservationCode?: string;
    branchId?: string;
    branchCode?: string;
    branchName?: string;
    pickupLocationName?: string;
    dropoffLocationName?: string;
    branchCommissionRates?: {
        delivery: number;
        storage: number;
    };
    branchSettlementAmount?: number;
    settlementHardCopyAmount?: number; // [스봉이] 주문 시점 확정 정산금 💰
    settlementStatus?: string;         // [스봉이] 정산 상태 (미반영, 확정 등) 💅
    settledAt?: string;                // [스봉이] 정산 확정 일시 🕰️
    settledBy?: string;                // [스봉이] 정산 참여자 👤
    statusVersion?: number;            // [스봉이] 낙관적 락을 위한 버전 🔒
    auditNote?: string;                // [스봉이] 상태 변경 사유 (감사 로그용) 🛡️
    nametagId?: number;                // [스봉이] 주 단위 1~100 순환 네임텍 번호 1~100 🔢✨
    updatedAt?: string;                // [스봉이] 마지막 업데이트 일시 🕰️
    // UTM 채널 어트리뷰션 (어느 SNS/광고에서 왔는지)
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
}
