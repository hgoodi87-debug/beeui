import { BagSizes } from '../shared/types';
import { STORAGE_RATES, type StorageRate } from './bookingService';

export interface DeliveryStoragePriceResult {
    total: number;
    storageDays: number;
    breakdown: string;
    durationText: string;
}

const parseKstMidnight = (dateInput: string): number | null => {
    const dateOnly = String(dateInput || '').split(' ')[0];
    if (!dateOnly) return null;

    const parsed = Date.parse(`${dateOnly}T00:00:00+09:00`);
    return Number.isFinite(parsed) ? parsed : null;
};

const getDeliveryStorageDayCharge = (storageDays: number, rate: StorageRate): number => {
    if (storageDays <= 0) return 0;
    if (storageDays === 1) return rate.day1;
    return rate.day1 + ((storageDays - 1) * rate.extraDay);
};

const getBagLabel = (size: keyof BagSizes, lang: string): string => {
    if (lang.startsWith('ko')) {
        if (size === 'handBag') return '쇼핑백, 손가방';
        if (size === 'carrier') return '캐리어';
        return '유모차, 자전거';
    }

    if (lang.startsWith('ja')) {
        if (size === 'handBag') return 'ショッピングバッグ・ハンドバッグ';
        if (size === 'carrier') return 'キャリーケース';
        return 'ベビーカー・自転車';
    }

    if (lang.startsWith('zh')) {
        if (size === 'handBag') return '购物袋、手提包';
        if (size === 'carrier') return '行李箱';
        return '婴儿车、自行车';
    }

    if (size === 'handBag') return 'Shopping Bag, Handbag';
    if (size === 'carrier') return 'Suitcase';
    return 'Stroller, Bicycle';
};

export const getDeliveryStorageDays = (pickupDate: string, deliveryDate: string): number => {
    const pickupMidnight = parseKstMidnight(pickupDate);
    const deliveryMidnight = parseKstMidnight(deliveryDate);

    if (pickupMidnight === null || deliveryMidnight === null || deliveryMidnight <= pickupMidnight) {
        return 0;
    }

    return Math.max(0, Math.floor((deliveryMidnight - pickupMidnight) / (24 * 60 * 60 * 1000)));
};

export const calculateDeliveryStoragePrice = (
    pickupDate: string,
    deliveryDate: string,
    bags: BagSizes,
    lang: string = 'ko'
): DeliveryStoragePriceResult => {
    const storageDays = getDeliveryStorageDays(pickupDate, deliveryDate);

    if (storageDays <= 0) {
        return {
            total: 0,
            storageDays: 0,
            breakdown: '',
            durationText: ''
        };
    }

    const t = {
        d: lang.startsWith('ko') ? '일' : (lang.startsWith('ja') ? '日' : (lang === 'zh-TW' || lang === 'zh-HK' ? '天' : lang.startsWith('zh') ? '天' : 'd')),
    };

    let totalPrice = 0;
    const breakdownParts: string[] = [];

    (Object.keys(bags) as Array<keyof BagSizes>).forEach((size) => {
        const count = bags[size];
        if (!count) return;

        const rate = STORAGE_RATES[size];
        const bagPrice = getDeliveryStorageDayCharge(storageDays, rate) * count;
        totalPrice += bagPrice;
        breakdownParts.push(`${getBagLabel(size, lang)} x ${count} (${storageDays}${t.d})`);
    });

    const durationText = lang.startsWith('ko')
        ? `선보관 ${storageDays}일 (배송일 제외)`
        : `${storageDays}${t.d} pre-delivery storage (delivery day excluded)`;

    return {
        total: totalPrice,
        storageDays,
        breakdown: breakdownParts.join(', '),
        durationText
    };
};
