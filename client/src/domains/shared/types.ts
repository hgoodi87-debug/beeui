export enum ServiceType {
    STORAGE = 'STORAGE',
    DELIVERY = 'DELIVERY',
}

export enum SnsType {
    LINE = 'Line',
    INSTAGRAM = 'Instagram',
    KAKAOTALK = 'KakaoTalk',
    WHATSAPP = 'WhatsApp',
    WECHAT = 'WeChat',
    THREADS = 'Threads',
    NONE = 'None'
}

export interface BagSizes {
    handBag: number;
    carrier: number;
    strollerBicycle: number;
}

export interface PriceSettings {
    handBag: number;
    carrier: number;
    strollerBicycle: number;
}

export interface RoutePrice {
    id: string;
    originId: string;
    destinationId: string;
    prices: PriceSettings;
}

export interface StorageTier {
    id: string;
    label: string;
    prices: PriceSettings;
}

export interface SystemNotice {
    id?: string;
    title: string;
    category: 'NOTICE'|'NEWS'|'EVENT'|'FAQ';
    isActive: boolean;
    imageUrl: string;
    content: string;
    linkUrl?: string;
    startDate?: string;
    endDate?: string;
    createdAt?: string;
}

export interface HeroConfig {
    imageUrl: string;
    mobileImageUrl?: string;
    videoUrl?: string;
    reviewCount?: number;
}

export interface GoogleCloudConfig {
    apiKey: string;
    isActive: boolean;
    enableWorkspaceAutomation?: boolean;
    enableGeminiAutomation?: boolean;
    measurementId?: string;
    mapId?: string;
    mapSecret?: string;
}

export interface PrivacyArticle {
    title: string;
    text: string;
}

export interface PrivacyPolicyData {
    title: string;
    last_updated: string;
    intro: string;
    content: PrivacyArticle[];
}

export interface TermsArticle {
    title: string;
    text: string;
}

export interface TermsPolicyData {
    title: string;
    last_updated: string;
    intro: string;
    content: TermsArticle[];
}

export interface QnaItem {
    question: string;
    answer: string;
    category: string;
}

export interface QnaData {
    title: string;
    subtitle: string;
    categories: { [key: string]: string };
    items: QnaItem[];
}

export type AdminTab = 
    | 'OVERVIEW' 
    | 'OPERATIONS' 
    | 'DELIVERY_BOOKINGS' 
    | 'STORAGE_BOOKINGS' 
    | 'LOCATIONS' 
    | 'DISCOUNTS' 
    | 'SYSTEM' 
    | 'HR' 
    | 'PARTNERSHIP_INQUIRIES' 
    | 'NOTICE' 
    | 'HERO' 
    | 'CLOUD' 
    | 'ROADMAP' 
    | 'CHATS' 
    | 'DAILY_SETTLEMENT'
    | 'ACCOUNTING'
    | 'MONTHLY_SETTLEMENT'
    | 'REPORTS'
    | 'PRIVACY_EDITOR'
    | 'TERMS_EDITOR'
    | 'QNA_EDITOR'
    | 'TRASH'
    | 'AI_REVIEW'
    | 'KIOSK'
    | 'CHANNEL_ANALYTICS'
    | 'GOOGLE_ANALYTICS'
    | 'UTM_BUILDER';

export interface TranslatedLocationData {
    name_en: string;
    name_ja: string;
    name_zh: string;
    name_zh_tw: string;
    name_zh_hk: string;
    address_en: string;
    address_ja: string;
    address_zh: string;
    address_zh_tw: string;
    address_zh_hk: string;
    pickupGuide_en: string;
    pickupGuide_ja: string;
    pickupGuide_zh: string;
    pickupGuide_zh_tw: string;
    pickupGuide_zh_hk: string;
    description_en: string;
    description_ja: string;
    description_zh: string;
    description_zh_tw: string;
    description_zh_hk: string;
}

export interface CashClosing {
    id?: string;
    date: string;
    branchId?: string; // [스봉이] 지점별 시재 관리를 위한 필수 낙인! 💅
    totalRevenue: number;
    cashRevenue: number;
    cardRevenue: number;
    appleRevenue?: number;
    samsungRevenue?: number;
    wechatRevenue?: number;
    alipayRevenue?: number;
    naverRevenue?: number;
    kakaoRevenue?: number;
    paypalRevenue?: number;
    actualCashOnHand: number;
    difference: number;
    notes?: string;
    closedBy: string;
    createdAt: string;
}

export type ExpenditureCostType = 'fixed' | 'variable';    // 고정비 | 유동비
export type ExpenditurePaymentType = 'corporate_card' | 'personal'; // 법인카드 | 개인비용

export interface Expenditure {
    id?: string;
    date: string;
    branchId?: string; // [스봉이] 지점별 지출 추적! 🛡️
    category: string;
    amount: number;
    description: string;
    costType?: ExpenditureCostType;     // 고정비 / 유동비
    paymentType?: ExpenditurePaymentType; // 법인카드 / 개인비용
    receiptUrl?: string;
    createdBy: string;
    createdAt: string;
}

export type BankTxType = 'deposit' | 'withdrawal'; // 입금 | 출금

export interface BankTransaction {
    id?: string;
    date: string;               // 거래일 YYYY-MM-DD
    bankName: string;           // 은행명
    accountAlias?: string;      // 계좌 별칭 (예: 국민-운영)
    txType: BankTxType;         // 입금 / 출금
    amount: number;             // 거래금액
    balance: number;            // 거래 후 잔액
    description: string;        // 적요
    createdBy: string;
    createdAt: string;
}

export interface AdminRevenueDailySummary {
    date: string;
    branchId?: string;
    branchCode?: string;
    branchName?: string;
    bookingCount: number;
    activeBookingCount: number;
    deliveryCount: number;
    storageCount: number;
    bagCount: number;
    handBagCount: number;
    carrierCount: number;
    strollerBicycleCount: number;
    completedCount: number;
    cancelledCount: number;
    refundedCount: number;
    totalRevenue: number;
    cancelledTotal: number;
    refundedTotal: number;
    cashRevenue: number;
    cardRevenue: number;
    appleRevenue: number;
    samsungRevenue: number;
    wechatRevenue: number;
    alipayRevenue: number;
    naverRevenue: number;
    kakaoRevenue: number;
    paypalRevenue: number;
    confirmedAmount: number;
    unconfirmedAmount: number;
    partnerPayoutTotal: number;
}

export interface AdminRevenueMonthlySummary {
    month: string;
    branchId?: string;
    branchCode?: string;
    branchName?: string;
    bookingCount: number;
    activeBookingCount: number;
    deliveryCount: number;
    storageCount: number;
    bagCount: number;
    handBagCount: number;
    carrierCount: number;
    strollerBicycleCount: number;
    completedCount: number;
    cancelledCount: number;
    refundedCount: number;
    totalRevenue: number;
    cancelledTotal: number;
    refundedTotal: number;
    cashRevenue: number;
    cardRevenue: number;
    appleRevenue: number;
    samsungRevenue: number;
    wechatRevenue: number;
    alipayRevenue: number;
    naverRevenue: number;
    kakaoRevenue: number;
    paypalRevenue: number;
    confirmedAmount: number;
    unconfirmedAmount: number;
    partnerPayoutTotal: number;
}

export interface MonthlyClosing {
    id?: string;
    month: string;               // 'YYYY-MM-DD' (월 기준일)
    totalRevenue: number;
    confirmedAmount: number;
    unconfirmedAmount: number;
    partnerPayoutTotal: number;
    netProfit: number;
    bookingCount: number;
    isClosed: boolean;
    closedAt?: string;
    closedBy?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface BranchPayout {
    id?: string;
    branchId?: string;
    branchName?: string;
    periodStart: string;         // 'YYYY-MM-DD'
    periodEnd: string;
    totalAmount: number;
    bookingCount: number;
    paymentMethod?: 'bank_transfer' | 'cash' | 'other';
    bankAccount?: string;
    paidAt?: string;
    paidBy?: string;
    notes?: string;
    createdAt?: string;
}
