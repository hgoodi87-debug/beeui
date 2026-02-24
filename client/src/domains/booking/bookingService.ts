import { BagSizes } from '../shared/types';

export interface StorageRate {
    hours4: number; // 4 Hours
    day1: number;   // 1 Day (Discounted)
    day7: number;   // 7 Days (Weekly Discount)
}

// Hardcoded Rates - In DDD, this could be injected via a repository or remote config
export const STORAGE_RATES: Record<keyof BagSizes, StorageRate> = {
    S: { hours4: 3000, day1: 8000, day7: 40000 },
    M: { hours4: 4000, day1: 10000, day7: 50000 },
    L: { hours4: 5000, day1: 12000, day7: 60000 },
    XL: { hours4: 6000, day1: 15000, day7: 75000 },
};

export interface PriceResult {
    total: number;
    breakdown: string; // User-facing explanation
    durationText: string;
}

/**
 * Domain Service: Calculate Storage Price
 * Encapsulates the core business logic of how storage prices are calculated based on duration and bag sizes.
 * Pure functional approach (Value Object pattern for result).
 */
export const calculateBookingStoragePrice = (
    start: Date,
    end: Date,
    bags: BagSizes,
    lang: string = 'ko'
): PriceResult => {
    // Language Map
    const t = {
        d: lang.startsWith('ko') ? '일' : (lang.startsWith('ja') ? '日' : (lang === 'zh-TW' || lang === 'zh-HK' ? '天' : lang.startsWith('zh') ? '天' : 'd')),
        h: lang.startsWith('ko') ? '시간' : (lang.startsWith('ja') ? '時間' : (lang === 'zh-TW' || lang === 'zh-HK' ? '小時' : lang.startsWith('zh') ? '小时' : 'h')),
        w: lang.startsWith('ko') ? '주' : (lang.startsWith('ja') ? '週' : (lang === 'zh-TW' || lang === 'zh-HK' ? '週' : lang.startsWith('zh') ? '周' : 'w')),
    };

    if (start >= end) {
        return { total: 0, breakdown: '', durationText: `0${t.h}` };
    }

    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    const dDays = Math.floor(diffHours / 24);
    const dHours = Math.ceil(diffHours % 24);
    const durationText = dDays > 0 ? `${dDays}${t.d} ${dHours}${t.h}` : `${dHours}${t.h}`;

    let totalPrice = 0;
    const breakdownParts: string[] = [];

    (Object.keys(bags) as Array<keyof BagSizes>).forEach((size) => {
        const count = bags[size];
        if (count === 0) return;

        const rate = STORAGE_RATES[size];
        let bagPrice = 0;
        let explanation = '';

        const weeks = Math.floor(diffHours / (24 * 7));
        let remainingHours = diffHours % (24 * 7);

        const days = Math.floor(remainingHours / 24);
        remainingHours = remainingHours % 24;

        let finalDays = days;
        let finalBlocks = Math.ceil(remainingHours / 4);

        if (finalBlocks > 3) {
            finalDays += 1;
            finalBlocks = 0;
        }

        const costWeeks = weeks * rate.day7;
        const costDays = finalDays * rate.day1;
        const costBlocks = finalBlocks * rate.hours4;

        bagPrice = (costWeeks + costDays + costBlocks) * count;

        const parts = [];
        if (weeks > 0) parts.push(`${weeks}${t.w}`);
        if (finalDays > 0) parts.push(`${finalDays}${t.d}`);
        if (finalBlocks > 0) parts.push(`${finalBlocks * 4}${t.h}`);

        explanation = `${size}x${count} (${parts.join(' + ')})`;
        breakdownParts.push(explanation);

        totalPrice += bagPrice;
    });

    return {
        total: totalPrice,
        breakdown: breakdownParts.join(', '),
        durationText
    };
};
