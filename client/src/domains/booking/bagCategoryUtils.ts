import { BagSizes, PriceSettings, ServiceType, StorageTier } from '../shared/types';

export type BagCategoryId = 'HAND_BAG' | 'CARRIER' | 'STROLLER_BICYCLE';
type LegacyBagSizes = { S?: unknown; M?: unknown; L?: unknown; XL?: unknown };
type LegacyPriceSettings = { S?: unknown; M?: unknown; L?: unknown; XL?: unknown };
type RawBagSizes = Partial<BagSizes> & LegacyBagSizes;
type RawPriceSettings = Partial<PriceSettings> & LegacyPriceSettings;

export interface BagCategoryConfig {
    id: BagCategoryId;
    primaryKey: keyof BagSizes;
    allowedServices: ServiceType[];
}

export interface BagCategoryVisualMeta {
    imageSrc: string;
    accentClassName: string;
    chipClassName: string;
}

const EMPTY_BAG_SIZES: BagSizes = { handBag: 0, carrier: 0, strollerBicycle: 0 };

export const DEFAULT_DELIVERY_PRICES: PriceSettings = { handBag: 10000, carrier: 25000, strollerBicycle: 0 };

export const DEFAULT_STORAGE_TIERS: StorageTier[] = [
    { id: 'st-4h', label: '4시간 기본 (Base 4h)', prices: { handBag: 4000, carrier: 5000, strollerBicycle: 6000 } },
    { id: 'st-1d', label: '첫 1일 (24시간)', prices: { handBag: 6000, carrier: 8000, strollerBicycle: 10000 } },
    { id: 'st-week', label: '추가 1일 (Extra Day)', prices: { handBag: 4000, carrier: 6000, strollerBicycle: 8000 } }
];

const BAG_CATEGORY_CONFIGS: Record<BagCategoryId, BagCategoryConfig> = {
    HAND_BAG: {
        id: 'HAND_BAG',
        primaryKey: 'handBag',
        allowedServices: [ServiceType.STORAGE, ServiceType.DELIVERY],
    },
    CARRIER: {
        id: 'CARRIER',
        primaryKey: 'carrier',
        allowedServices: [ServiceType.STORAGE, ServiceType.DELIVERY],
    },
    STROLLER_BICYCLE: {
        id: 'STROLLER_BICYCLE',
        primaryKey: 'strollerBicycle',
        allowedServices: [ServiceType.STORAGE],
    },
};

const CATEGORY_LABELS = {
    HAND_BAG: {
        ko: '쇼핑백, 손가방',
        en: 'Shopping Bag, Handbag',
        ja: 'ショッピングバッグ・ハンドバッグ',
        zh: '購物袋、手提包',
    },
    CARRIER: {
        ko: '캐리어',
        en: 'Suitcase',
        ja: 'キャリーケース',
        zh: '行李箱',
    },
    STROLLER_BICYCLE: {
        ko: '유모차, 자전거',
        en: 'Stroller, Bicycle',
        ja: 'ベビーカー・自転車',
        zh: '嬰兒車、自行車',
    },
} as const;

const CATEGORY_DESCRIPTIONS = {
    HAND_BAG: {
        ko: {
            storage: '쇼핑백, 토트백, 작은 손가방 보관',
            delivery: '캐리어와 함께 접수하는 소형 짐',
        },
        en: {
            storage: 'Shopping bags, totes, and small handbags',
            delivery: 'Small bags accepted with at least one suitcase',
        },
        ja: {
            storage: 'ショッピングバッグ・トート・小型バッグ保管',
            delivery: 'スーツケースと一緒に預ける小型手荷物',
        },
        zh: {
            storage: '購物袋、托特包、小型手提包寄存',
            delivery: '需與至少一個行李箱一起配送的小件行李',
        },
    },
    CARRIER: {
        ko: {
            storage: '기내용, 위탁용 캐리어 모두 가능',
            delivery: '공항, 호텔, 지점 간 배송 가능',
        },
        en: {
            storage: 'Carry-on and checked suitcases supported',
            delivery: 'Available for airport, hotel, and branch delivery',
        },
        ja: {
            storage: '機内持ち込み・預け入れスーツケース対応',
            delivery: '空港・ホテル・拠点間配送に対応',
        },
        zh: {
            storage: '支援登機箱與託運行李箱',
            delivery: '支援機場、酒店與門市之間配送',
        },
    },
    STROLLER_BICYCLE: {
        ko: {
            storage: '유모차, 접이식 자전거, 대형 특수 짐',
            delivery: '배송 접수는 지원하지 않음',
        },
        en: {
            storage: 'Strollers, folding bicycles, and bulky items',
            delivery: 'Delivery is not available for this category',
        },
        ja: {
            storage: 'ベビーカー・折りたたみ自転車・大型荷물',
            delivery: '配送受付은 行っていません',
        },
        zh: {
            storage: '嬰兒車、折疊自行車及大型特殊行李',
            delivery: '此類別不支援配送',
        },
    },
} as const;

const CATEGORY_VISUALS: Record<BagCategoryId, BagCategoryVisualMeta> = {
    HAND_BAG: {
        imageSrc: '/images/bags/hand-bag-photo.png',
        accentClassName: 'from-amber-50 via-white to-orange-50',
        chipClassName: 'bg-amber-100 text-amber-700',
    },
    CARRIER: {
        imageSrc: '/images/bags/carrier-photo.png',
        accentClassName: 'from-slate-50 via-white to-zinc-100',
        chipClassName: 'bg-slate-100 text-slate-700',
    },
    STROLLER_BICYCLE: {
        imageSrc: '/images/bags/stroller-bicycle-photo.png',
        accentClassName: 'from-emerald-50 via-white to-lime-50',
        chipClassName: 'bg-emerald-100 text-emerald-700',
    },
};

const getLangBucket = (lang: string = 'ko'): 'ko' | 'en' | 'ja' | 'zh' => {
    if (lang.startsWith('ko')) return 'ko';
    if (lang.startsWith('ja')) return 'ja';
    if (lang.startsWith('zh')) return 'zh';
    return 'en';
};

const toSafeNumber = (value: unknown): number => Math.max(0, Number(value || 0));

export const createEmptyBagSizes = (): BagSizes => ({ ...EMPTY_BAG_SIZES });

export const sanitizeBagSizes = (bagSizes?: RawBagSizes): BagSizes => ({
    handBag: toSafeNumber(bagSizes?.handBag ?? bagSizes?.S),
    carrier: toSafeNumber(bagSizes?.carrier ?? (toSafeNumber(bagSizes?.M) + toSafeNumber(bagSizes?.L))),
    strollerBicycle: toSafeNumber(bagSizes?.strollerBicycle ?? bagSizes?.XL),
});

export const sanitizeDeliveryBagSizes = (bagSizes?: RawBagSizes): BagSizes => {
    const normalized = sanitizeBagSizes(bagSizes);
    return { ...normalized, strollerBicycle: 0 };
};

export const getTotalBags = (bagSizes?: RawBagSizes): number =>
    Object.values(sanitizeBagSizes(bagSizes)).reduce((sum, count) => sum + count, 0);

export const hasStandaloneHandBagDeliverySelection = (bagSizes?: RawBagSizes): boolean => {
    const normalized = sanitizeDeliveryBagSizes(bagSizes);
    return normalized.handBag > 0 && normalized.carrier === 0;
};

export const getBagCategoriesForService = (serviceType: ServiceType): BagCategoryConfig[] =>
    Object.values(BAG_CATEGORY_CONFIGS).filter((category) => category.allowedServices.includes(serviceType));

export const getBagCategoryLabel = (categoryId: BagCategoryId, lang: string = 'ko'): string =>
    CATEGORY_LABELS[categoryId][getLangBucket(lang)];

export const getBagCategoryDescription = (
    categoryId: BagCategoryId,
    lang: string = 'ko',
    serviceType: ServiceType = ServiceType.STORAGE
): string => {
    const langBucket = getLangBucket(lang);
    const serviceBucket = serviceType === ServiceType.DELIVERY ? 'delivery' : 'storage';
    return CATEGORY_DESCRIPTIONS[categoryId][langBucket][serviceBucket];
};

export const getBagCategoryVisualMeta = (categoryId: BagCategoryId): BagCategoryVisualMeta =>
    CATEGORY_VISUALS[categoryId];

export const getBagCategoryCount = (bagSizes: RawBagSizes | undefined, categoryId: BagCategoryId): number => {
    const normalized = sanitizeBagSizes(bagSizes);
    return normalized[BAG_CATEGORY_CONFIGS[categoryId].primaryKey];
};

export const setBagCategoryCount = (
    bagSizes: RawBagSizes | undefined,
    categoryId: BagCategoryId,
    count: number
): BagSizes => {
    const normalized = sanitizeBagSizes(bagSizes);
    const nextCount = Math.max(0, Number(count || 0));
    return { ...normalized, [BAG_CATEGORY_CONFIGS[categoryId].primaryKey]: nextCount };
};

export const updateBagCategoryCount = (
    bagSizes: RawBagSizes | undefined,
    categoryId: BagCategoryId,
    delta: number
): BagSizes => {
    const current = getBagCategoryCount(bagSizes, categoryId);
    return setBagCategoryCount(bagSizes, categoryId, current + delta);
};

export const buildCategoryBagSizes = (categoryId: BagCategoryId, count: number): BagSizes =>
    setBagCategoryCount(EMPTY_BAG_SIZES, categoryId, count);

export const getStoragePriceForCategory = (prices: PriceSettings, categoryId: BagCategoryId): number => {
    if (categoryId === 'HAND_BAG') return Number(prices.handBag || 0);
    if (categoryId === 'CARRIER') return Number(prices.carrier || 0);
    return Number(prices.strollerBicycle || 0);
};

export const normalizeDeliveryPrices = (prices?: RawPriceSettings | null): PriceSettings => {
    if (!prices) return { ...DEFAULT_DELIVERY_PRICES };

    return {
        handBag: Number(prices.handBag ?? prices.S ?? DEFAULT_DELIVERY_PRICES.handBag) || DEFAULT_DELIVERY_PRICES.handBag,
        carrier: Number(prices.carrier ?? prices.M ?? prices.L ?? DEFAULT_DELIVERY_PRICES.carrier) || DEFAULT_DELIVERY_PRICES.carrier,
        strollerBicycle: 0,
    };
};

export const normalizeStorageTierPrices = (prices?: RawPriceSettings | null): PriceSettings => {
    const fallback = DEFAULT_STORAGE_TIERS[0].prices;

    return {
        handBag: Number(prices?.handBag ?? prices?.S ?? fallback.handBag) || fallback.handBag,
        carrier: Number(prices?.carrier ?? prices?.M ?? prices?.L ?? fallback.carrier) || fallback.carrier,
        strollerBicycle: Number(prices?.strollerBicycle ?? prices?.XL ?? fallback.strollerBicycle) || fallback.strollerBicycle,
    };
};
