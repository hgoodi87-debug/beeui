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
    | 'TIPS_CMS'
    | 'DAILY_SETTLEMENT'
    | 'ACCOUNTING'
    | 'MONTHLY_SETTLEMENT'
    | 'REPORTS'
    | 'PRIVACY_EDITOR'
    | 'TERMS_EDITOR'
    | 'QNA_EDITOR'
    | 'TRASH';

// --- TIPS CMS Types ---
export type TipContentType = 'landmark' | 'hotplace' | 'attraction' | 'event';
export type TipPublishStatus = 
    | 'draft' 
    | 'review_requested' 
    | 'in_review' 
    | 'approved' 
    | 'scheduled' 
    | 'published' 
    | 'hidden' 
    | 'archived' 
    | 'rejected';

export interface TipI18nString {
    ko: string;
    en: string;
    ja?: string;
    zh?: string;
    [key: string]: string | undefined;
}

export interface TipContent {
    id?: string;
    slug: string;
    title: TipI18nString;
    content_type: TipContentType;
    area_slug: string;
    summary: TipI18nString;
    body: TipI18nString;
    cover_image_url: string;
    recommended_time?: string;
    audience_tags: string[];
    theme_tags: string[];
    official_url?: string;
    source_name?: string;
    start_date?: string;
    end_date?: string;
    publish_status: TipPublishStatus;
    language_available: string[];
    author_id?: string;
    reviewer_id?: string;
    review_comment?: string;
    quality_score?: number;
    priority_score?: number;
    is_foreigner_friendly?: boolean;
    forbidden_word_detected?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface TipAreaInfo {
    id?: string;
    area_slug: string;
    area_name: TipI18nString;
    headline: TipI18nString;
    intro_text: TipI18nString;
    cover_image_url: string;
    is_priority_area: boolean;
    relatedBranchIds: string[];
    order?: number;
    created_at?: string;
    updated_at?: string;
}

export interface TipThemeInfo {
    id?: string;
    theme_slug: string;
    theme_name: TipI18nString;
    description: TipI18nString;
    icon?: string;
    order?: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

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
