
export enum ServiceType {
  STORAGE = 'STORAGE',
  DELIVERY = 'DELIVERY',
}

export enum LocationType {
  AIRPORT = 'AIRPORT',
  HOTEL = 'HOTEL',
  STATION = 'STATION',
  PARTNER = 'PARTNER',
  LOCAL_HOME = 'LOCAL_HOME',
  AIRBNB = 'AIRBNB',
  GUESTHOUSE = 'GUESTHOUSE',
  OTHER = 'OTHER'
}

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

export enum SnsType {
  LINE = 'Line',
  INSTAGRAM = 'Instagram',
  KAKAOTALK = 'KakaoTalk',
  WHATSAPP = 'WhatsApp',
  WECHAT = 'WeChat',
  NONE = 'None'
}

export interface LocationOption {
  id: string;
  shortCode: string;
  name: string;
  type: LocationType;
  address?: string;
  description: string;
  supportsDelivery: boolean;
  supportsStorage: boolean;
  isOrigin?: boolean;
  isDestination?: boolean;
  lat?: number;
  lng?: number;
  originSurcharge?: number;      // 출발지일 때 추가되는 금액
  destinationSurcharge?: number; // 목적지일 때 추가되는 금액
  pickupGuide?: string;          // 수화물 수령 위치 안내 (상세)
  pickupImageUrl?: string;       // 수화물 수령 위치 안내 사진 URL
  // Multilingual support
  name_en?: string;
  name_ja?: string;
  name_zh?: string;
  name_zh_tw?: string;
  name_zh_hk?: string;
  description_en?: string;
  description_ja?: string;
  description_zh?: string;
  description_zh_tw?: string;
  description_zh_hk?: string;
  pickupGuide_en?: string;
  pickupGuide_ja?: string;
  pickupGuide_zh?: string;
  pickupGuide_zh_tw?: string;
  pickupGuide_zh_hk?: string;
  address_en?: string;
  address_ja?: string;
  address_zh?: string;
  address_zh_tw?: string;
  address_zh_hk?: string;
  imageUrl?: string;             // Representative shop image
  businessHours?: string;        // Operating hours (KR)
  businessHours_en?: string;
  businessHours_ja?: string;
  businessHours_zh?: string;
  businessHours_zh_tw?: string;
  businessHours_zh_hk?: string;
  isActive?: boolean;
  isPartner?: boolean;
  availableServices?: string[];
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

export interface ReservationInfo {
  userName: string;
  userEmail: string;
  snsChannel: string;
  snsId: string;
  agreedToHighValue?: boolean;
}

export interface BookingState {
  id?: string;
  serviceType: ServiceType;
  pickupLoc?: LocationOption; // Full object (Optional for backward compatibility)
  returnLoc?: LocationOption; // Full object
  pickupLocation: string;     // ID as string (Used in most components)
  dropoffLocation: string;    // ID as string
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;        // Added
  deliveryTime: string;       // Added
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
  discountCode?: string;      // Added for compatibility with some components
  discountAmount?: number;
  discountApplied?: number;
  finalPrice?: number;
  snsType?: SnsType;
  paymentMethod?: 'card' | 'cash' | 'apple' | 'samsung' | 'wechat' | 'alipay' | 'naver' | 'kakao' | 'paypal';
  paymentStatus?: 'pending' | 'paid' | 'cancelled';
  // Additional Address Fields
  pickupAddress?: string;
  pickupAddressDetail?: string;
  dropoffAddress?: string;
  dropoffAddressDetail?: string;
  selectedStorageTierId?: string; // Added for storage bookings
  // Automation fields
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
  isDeleted?: boolean; // Soft Delete Flag
  recaptchaToken?: string;
  weightSurcharge5kg?: number;
  weightSurcharge10kg?: number;
  imageUrl?: string;
  pickupImageUrl?: string;
  reservationCode?: string; // Custom Reservation Code (e.g. MYN-IN1T-1234)
}

export interface CashClosing {
  id?: string;
  date: string; // YYYY-MM-DD
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
  date: string; // YYYY-MM-DD
  category: string;
  amount: number;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface PartnershipInquiry {
  id: string;
  companyName: string;
  contactName?: string; // Optional to prevent breaking changes
  position?: string;
  phone?: string;
  email?: string;
  contact?: string;      // Keeping for backward compatibility
  location: string;
  businessType: string;
  message: string;
  createdAt: string;
}

export interface DiscountCode {
  id?: string;
  code: string;
  amountPerBag: number;
  description: string;
  isActive: boolean;
  allowedService?: 'DELIVERY' | 'STORAGE' | 'ALL';
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'model' | 'admin';
  text: string;
  timestamp: string;
  sessionId: string;
  userName?: string;
  userEmail?: string;
  isRead?: boolean;
}

export interface ChatSession {
  id?: string;
  sessionId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  timestamp: string;
  isBotDisabled?: boolean;
  unreadCount?: number;
}

export interface AdminUser {
  id: string;
  name: string;
  jobTitle: string;
  password: string;
  role?: 'super' | 'staff';
  createdAt: string;
}

export interface SystemNotice {
  isActive: boolean;
  imageUrl: string;
  content: string;
  linkUrl?: string; // Optional: if clicking the image should take user somewhere
}

export interface HeroConfig {
  imageUrl: string;       // Desktop Image
  mobileImageUrl?: string; // Mobile Image (Optional)
  videoUrl?: string;      // Video Background URL (Optional)
  reviewCount?: number;   // Review count display (Optional)
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
  googleChatWebhookUrl?: string; // New field for Google Chat integration
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
  content: PrivacyArticle[]; // Replaces fixed translation content
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

export type AdminTab = 'OVERVIEW' | 'DELIVERY_BOOKINGS' | 'STORAGE_BOOKINGS' | 'LOCATIONS' | 'DISCOUNTS' | 'SYSTEM' | 'HR' | 'PARTNERSHIP_INQUIRIES' | 'NOTICE' | 'HERO' | 'CLOUD' | 'PRIVACY_EDITOR' | 'TERMS_EDITOR' | 'ACCOUNTING' | 'TRASH' | 'DAILY_SETTLEMENT' | 'CHATS' | 'REPORTS';
