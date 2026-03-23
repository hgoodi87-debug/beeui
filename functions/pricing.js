// functions/pricing.js
// Legacy duplicate kept in sync with functions/src/shared/pricing.js

const STORAGE_RATES = {
    handBag: { hours4: 4000, hourlyAfter4h: 200, day1: 8000, extraDay: 6000, day7: 44000 },
    carrier: { hours4: 5000, hourlyAfter4h: 250, day1: 10000, extraDay: 8000, day7: 58000 },
    strollerBicycle: { hours4: 10000, hourlyAfter4h: 200, day1: 14000, extraDay: 10000, day7: 74000 },
};

const getBagLabel = (size, lang) => {
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

const getSingleBagStoragePrice = (hours, rate) => {
    const roundedHours = Math.max(1, Math.ceil(hours));

    if (roundedHours <= 4) {
        return rate.hours4;
    }

    if (roundedHours < 24) {
        return rate.hours4 + ((roundedHours - 4) * rate.hourlyAfter4h);
    }

    if (roundedHours === 24) {
        return rate.day1;
    }

    return rate.day1 + (Math.ceil((roundedHours - 24) / 24) * rate.extraDay);
};

const getSingleBagBreakdown = (hours, t) => {
    const roundedHours = Math.max(1, Math.ceil(hours));

    if (roundedHours <= 4) {
        return `4${t.h}`;
    }

    if (roundedHours < 24) {
        return `4${t.h} + ${roundedHours - 4}${t.h}`;
    }

    if (roundedHours === 24) {
        return `1${t.d}`;
    }

    const extraDays = Math.ceil((roundedHours - 24) / 24);
    return `1${t.d} + ${extraDays}${t.d}`;
};

const calculateBookingStoragePrice = (startDate, endDate, bags, lang = 'ko') => {
    const t = {
        d: lang.startsWith('ko') ? '일' : (lang.startsWith('ja') ? '日' : (lang.startsWith('zh') ? '天' : 'd')),
        h: lang.startsWith('ko') ? '시간' : (lang.startsWith('ja') ? '時間' : (lang.startsWith('zh') ? '小时' : 'h')),
    };

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
        return { total: 0, breakdown: '', durationText: `0${t.h}` };
    }

    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const roundedHours = Math.max(1, Math.ceil(diffHours));

    const dDays = Math.floor(diffHours / 24);
    const dHours = Math.ceil(diffHours % 24);
    const durationText = dDays > 0 ? `${dDays}${t.d} ${dHours}${t.h}` : `${dHours}${t.h}`;

    let totalPrice = 0;
    const breakdownParts = [];

    Object.keys(bags || {}).forEach((size) => {
        const count = bags[size] || 0;
        if (count === 0) return;

        const rate = STORAGE_RATES[size];
        if (!rate) return;

        const bagPrice = getSingleBagStoragePrice(diffHours, rate) * count;
        const explanation = `${getBagLabel(size, lang)} x ${count} (${getSingleBagBreakdown(roundedHours, t)})`;
        breakdownParts.push(explanation);

        if (!isNaN(bagPrice)) {
            totalPrice += bagPrice;
        } else {
            console.error(`❌ [Pricing] NaN detected for size ${size}. Inputs: ${diffHours}h`);
        }
    });

    return {
        total: isNaN(totalPrice) ? 0 : totalPrice,
        breakdown: breakdownParts.join(', '),
        durationText
    };
};

module.exports = {
    STORAGE_RATES,
    calculateBookingStoragePrice
};
