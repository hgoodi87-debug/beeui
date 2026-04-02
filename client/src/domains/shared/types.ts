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
    | 'FINANCIAL_COMPARISON'
    | 'ACCOUNTING'
    | 'MONTHLY_SETTLEMENT'
    | 'REPORTS'
    | 'PRIVACY_EDITOR'
    | 'TERMS_EDITOR'
    | 'QNA_EDITOR'
    | 'TRASH';

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

export interface Expenditure {
    id?: string;
    date: string;
    branchId?: string; // [스봉이] 지점별 지출 추적! 🛡️
    category: string;
    amount: number;
    description: string;
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
