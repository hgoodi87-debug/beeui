// functions/pricing.js
// Port of client/src/domains/booking/bookingService.ts for Backend Firebase Functions

const STORAGE_RATES = {
    handBag: { hours4: 4000, hourlyAfter4h: 200, day1: 8000, extraDay: 6000, day7: 44000 },
    carrier: { hours4: 5000, hourlyAfter4h: 250, day1: 10000, extraDay: 8000, day7: 58000 },
    strollerBicycle: { hours4: 10000, hourlyAfter4h: 200, day1: 14000, extraDay: 10000, day7: 74000 },
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const parseBusinessHours = (businessHours) => {
    if (!businessHours) return null;

    const compact = String(businessHours).replace(/\s+/g, '');
    const parts = compact.split('-');
    if (parts.length !== 2) return null;

    const [openHour, openMinute] = parts[0].split(':').map(Number);
    const [closeHour, closeMinute] = parts[1].split(':').map(Number);

    if ([openHour, openMinute, closeHour, closeMinute].some((value) => Number.isNaN(value))) {
        return null;
    }

    const openMinutes = (openHour * 60) + openMinute;
    const closeMinutes = (closeHour * 60) + closeMinute;

    if (closeMinutes <= openMinutes) return null;
    return { openMinutes, closeMinutes };
};

const getKstShiftedDate = (date) => new Date(date.getTime() + KST_OFFSET_MS);

const getKstDateKey = (date) => {
    const shifted = getKstShiftedDate(date);
    const year = shifted.getUTCFullYear();
    const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
    const day = String(shifted.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getKstMinutesOfDay = (date) => {
    const shifted = getKstShiftedDate(date);
    return (shifted.getUTCHours() * 60) + shifted.getUTCMinutes();
};

const hasBusinessHoursBoundaryCrossed = (start, end, businessHours) => {
    const parsed = parseBusinessHours(businessHours);
    if (!parsed) return false;

    const { openMinutes, closeMinutes } = parsed;
    const isAllDayLike = openMinutes === 0 && closeMinutes >= ((23 * 60) + 30);
    if (isAllDayLike) return false;

    if (getKstDateKey(start) !== getKstDateKey(end)) {
        return true;
    }

    const startMinutes = getKstMinutesOfDay(start);
    const endMinutes = getKstMinutesOfDay(end);
    return startMinutes < openMinutes || endMinutes > closeMinutes;
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

    return rate.day1 + ((roundedHours - 24) * rate.hourlyAfter4h);
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

    return `1${t.d} + ${roundedHours - 24}${t.h}`;
};

const calculateBookingStoragePrice = (startDate, endDate, bags, lang = 'ko', options = {}) => {
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
    const shouldChargeDayRate = diffHours > 0
        && diffHours < 24
        && hasBusinessHoursBoundaryCrossed(start, end, options.businessHours);
    const chargeableHours = shouldChargeDayRate ? 24 : diffHours;
    const roundedHours = Math.max(1, Math.ceil(chargeableHours));

    const dDays = Math.floor(chargeableHours / 24);
    const dHours = Math.ceil(chargeableHours % 24);
    const durationText = dDays > 0 ? `${dDays}${t.d} ${dHours}${t.h}` : `${dHours}${t.h}`;

    let totalPrice = 0;
    const breakdownParts = [];

    Object.keys(bags || {}).forEach((size) => {
        const count = bags[size] || 0;
        if (count === 0) return;

        const rate = STORAGE_RATES[size];
        if (!rate) return;

        const bagPrice = getSingleBagStoragePrice(chargeableHours, rate) * count;
        const explanation = `${getBagLabel(size, lang)} x ${count} (${getSingleBagBreakdown(chargeableHours, t)})`;
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
