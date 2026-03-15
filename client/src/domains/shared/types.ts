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
    S: number;
    M: number;
    L: number;
    XL: number;
}

export interface PriceSettings {
    S: number;
    M: number;
    L: number;
    XL: number;
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
    isActive: boolean;
    imageUrl: string;
    content: string;
    linkUrl?: string;
}

export interface HeroConfig {
    imageUrl: string;
    mobileImageUrl?: string;
    videoUrl?: string;
    reviewCount?: number;
}

export interface GoogleCloudConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    isActive: boolean;
    enableWorkspaceAutomation?: boolean;
    enableGeminiAutomation?: boolean;
    googleChatWebhookUrl?: string;
    measurementId?: string;
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

export type AdminTab = 'OVERVIEW' | 'OPERATIONS' | 'DELIVERY_BOOKINGS' | 'STORAGE_BOOKINGS' | 'LOCATIONS' | 'DISCOUNTS' | 'SYSTEM' | 'HR' | 'PARTNERSHIP_INQUIRIES' | 'NOTICE' | 'HERO' | 'CLOUD' | 'PRIVACY_EDITOR' | 'TERMS_EDITOR' | 'QNA_EDITOR' | 'ACCOUNTING' | 'MONTHLY_SETTLEMENT' | 'TRASH' | 'DAILY_SETTLEMENT' | 'CHATS' | 'REPORTS' | 'ROADMAP';

export interface TranslatedLocationData {
    name_en: string;
    name_ja: string;
    name_zh: string;
    address_en: string;
    address_ja: string;
    address_zh: string;
    pickupGuide_en: string;
    pickupGuide_ja: string;
    pickupGuide_zh: string;
    description_en: string;
    description_ja: string;
    description_zh: string;
}

export interface CashClosing {
    id?: string;
    date: string;
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
    category: string;
    amount: number;
    description: string;
    createdBy: string;
    createdAt: string;
}
