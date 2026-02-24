// functions/pricing.js
// Port of client/src/domains/booking/bookingService.ts for Backend Firebase Functions

const STORAGE_RATES = {
    S: { hours4: 3000, day1: 8000, day7: 40000 },
    M: { hours4: 4000, day1: 10000, day7: 50000 },
    L: { hours4: 5000, day1: 12000, day7: 60000 },
    XL: { hours4: 6000, day1: 15000, day7: 75000 },
};

/**
 * Domain Service: Calculate Storage Price (Backend ver.)
 * Encapsulates the core business logic of how storage prices are calculated based on duration and bag sizes.
 */
const calculateBookingStoragePrice = (startDate, endDate, bags, lang = 'ko') => {
    const t = {
        d: lang.startsWith('ko') ? '일' : (lang.startsWith('ja') ? '日' : (lang.startsWith('zh') ? '天' : 'd')),
        h: lang.startsWith('ko') ? '시간' : (lang.startsWith('ja') ? '時間' : (lang.startsWith('zh') ? '小时' : 'h')),
        w: lang.startsWith('ko') ? '주' : (lang.startsWith('ja') ? '週' : (lang.startsWith('zh') ? '周' : 'w')),
    };

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
        return { total: 0, breakdown: '', durationText: `0${t.h}` };
    }

    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

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

        const bagPrice = (costWeeks + costDays + costBlocks) * count;

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

module.exports = {
    STORAGE_RATES,
    calculateBookingStoragePrice
};
