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

export interface LocationOption {
    id: string;
    supabaseId?: string;
    shortCode: string;
    branchId?: string;
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
    originSurcharge?: number;
    destinationSurcharge?: number;
    pickupGuide?: string;
    pickupImageUrl?: string;
    name_en?: string;
    name_ja?: string;
    name_zh?: string;
    name_zh_tw?: string;
    name_zh_hk?: string;
    nameEn?: string;
    nameJa?: string;
    nameZh?: string;
    nameZhTw?: string;
    nameZhHk?: string;
    description_en?: string;
    description_ja?: string;
    description_zh?: string;
    description_zh_tw?: string;
    description_zh_hk?: string;
    descriptionEn?: string;
    descriptionJa?: string;
    descriptionZh?: string;
    descriptionZhTw?: string;
    descriptionZhHk?: string;
    pickupGuide_en?: string;
    pickupGuide_ja?: string;
    pickupGuide_zh?: string;
    pickupGuide_zh_tw?: string;
    pickupGuide_zh_hk?: string;
    pickupGuideEn?: string;
    pickupGuideJa?: string;
    pickupGuideZh?: string;
    pickupGuideZhTw?: string;
    pickupGuideZhHk?: string;
    address_en?: string;
    address_ja?: string;
    address_zh?: string;
    address_zh_tw?: string;
    address_zh_hk?: string;
    addressEn?: string;
    addressJa?: string;
    addressZh?: string;
    addressZhTw?: string;
    addressZhHk?: string;
    imageUrl?: string;
    businessHours?: string;
    businessHours_en?: string;
    businessHours_ja?: string;
    businessHours_zh?: string;
    businessHours_zh_tw?: string;
    businessHours_zh_hk?: string;
    businessHoursEn?: string;
    businessHoursJa?: string;
    businessHoursZh?: string;
    businessHoursZhTw?: string;
    businessHoursZhHk?: string;
    isActive?: boolean;
    isPartner?: boolean;
    availableServices?: string[];
    branchCode?: string;
    ownerName?: string;
    phone?: string;
    contactNumber?: string;
    commissionRates?: {
        delivery: number;
        storage: number;
    };
    distance?: number; // [스봉이] 사용자 위치로부터의 거리 (정렬용) 🛰️✨
}

export interface Branch {
    id: string;
    name: string;
    branchCode: string;
    address?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    ownerName?: string;
    phone?: string;
    contactNumber?: string;
    operatingHours?: {
        start: string;
        end: string;
    };
    isActive: boolean;
    commissionRates: {
        delivery: number;
        storage: number;
    };
    createdAt: string;
}

export interface PartnershipInquiry {
    id: string;
    companyName: string;
    contactName?: string;
    position?: string;
    phone?: string;
    email?: string;
    contact?: string;
    location: string;
    businessType: string;
    message: string;
    status?: 'NEW' | 'CONTACTED' | 'NEGOTIATING' | 'CONVERTED' | 'REJECTED';
    assignedAdminId?: string;
    notes?: string;
    createdAt: string;
}

export type ProspectStatus = 'PROSPECTING' | 'NEGOTIATING' | 'READY' | 'ACTIVE' | 'ON_HOLD';

export interface BranchProspect {
    id: string;
    name: string;
    address: string;
    lat?: number;
    lng?: number;
    contactPerson: string;
    phone: string;
    email: string;
    status: ProspectStatus;
    potentialScore: number;
    notes: string;
    partnershipInquiryId?: string;
    expectedOpenDate?: string;
    createdAt: string;
    updatedAt: string;
}
