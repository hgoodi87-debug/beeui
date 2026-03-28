const { STORAGE_RATES } = require('./pricing');

const parseKstMidnight = (dateInput) => {
    const dateOnly = String(dateInput || '').split(' ')[0];
    if (!dateOnly) return null;

    const parsed = Date.parse(`${dateOnly}T00:00:00+09:00`);
    return Number.isFinite(parsed) ? parsed : null;
};

const getDeliveryStorageDayCharge = (storageDays, rate) => {
    if (storageDays <= 0) return 0;
    if (storageDays === 1) return rate.day1;
    return rate.day1 + ((storageDays - 1) * rate.extraDay);
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

const getDeliveryStorageDays = (pickupDate, deliveryDate) => {
    const pickupMidnight = parseKstMidnight(pickupDate);
    const deliveryMidnight = parseKstMidnight(deliveryDate);

    if (pickupMidnight === null || deliveryMidnight === null || deliveryMidnight <= pickupMidnight) {
        return 0;
    }

    return Math.max(0, Math.floor((deliveryMidnight - pickupMidnight) / (24 * 60 * 60 * 1000)));
};

const calculateDeliveryStoragePrice = (pickupDate, deliveryDate, bags, lang = 'ko') => {
    const storageDays = getDeliveryStorageDays(pickupDate, deliveryDate);
    if (storageDays <= 0) {
        return { total: 0, storageDays: 0, breakdown: '', durationText: '' };
    }

    const t = {
        d: lang.startsWith('ko') ? '일' : (lang.startsWith('ja') ? '日' : (lang.startsWith('zh') ? '天' : 'd')),
    };

    let totalPrice = 0;
    const breakdownParts = [];

    Object.keys(bags || {}).forEach((size) => {
        const count = bags[size] || 0;
        if (count === 0) return;

        const rate = STORAGE_RATES[size];
        if (!rate) return;

        const bagPrice = getDeliveryStorageDayCharge(storageDays, rate) * count;
        totalPrice += bagPrice;
        breakdownParts.push(`${getBagLabel(size, lang)} x ${count} (${storageDays}${t.d})`);
    });

    return {
        total: totalPrice,
        storageDays,
        breakdown: breakdownParts.join(', '),
        durationText: lang.startsWith('ko')
            ? `선보관 ${storageDays}일 (배송일 제외)`
            : `${storageDays}${t.d} pre-delivery storage (delivery day excluded)`
    };
};

module.exports = {
    getDeliveryStorageDays,
    calculateDeliveryStoragePrice
};
