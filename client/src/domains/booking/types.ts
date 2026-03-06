import { ServiceType, SnsType } from '../shared/types';
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
    bagSizes: {
        S: number;
        M: number;
        L: number;
        XL: number;
    };
    price: number;
    userName: string;
    userEmail: string;
    snsChannel: string;
    snsId: string;
    status: BookingStatus;
    createdAt: string;
    promoCode?: string;
    discountCode?: string;
    discountAmount?: number;
    discountApplied?: number;
    finalPrice?: number;
    snsType?: SnsType;
    paymentMethod?: 'card' | 'cash' | 'apple' | 'samsung' | 'wechat' | 'alipay' | 'naver' | 'kakao' | 'paypal';
    paymentStatus?: 'pending' | 'paid' | 'cancelled';
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
    isDeleted?: boolean;
    recaptchaToken?: string;
    weightSurcharge5kg?: number;
    weightSurcharge10kg?: number;
    imageUrl?: string;
    pickupImageUrl?: string;
    reservationCode?: string;
    branchId?: string;
    branchCommissionRates?: {
        delivery: number;
        storage: number;
    };
    branchSettlementAmount?: number;
}
