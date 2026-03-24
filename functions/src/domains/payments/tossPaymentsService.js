const crypto = require('node:crypto');
const { HttpsError } = require('firebase-functions/v2/https');
const { STORAGE_RATES, calculateBookingStoragePrice } = require('../../shared/pricing');

const DEFAULT_DELIVERY_PRICES = { handBag: 10000, carrier: 25000, strollerBicycle: 0 };
const PAYMENT_SESSION_COLLECTION = 'payment_sessions';
const PAYMENT_SESSION_TTL_MS = 10 * 60 * 1000;

const normalizeText = (value) => String(value || '').trim();
const normalizeUpper = (value) => normalizeText(value).toUpperCase();
const normalizeEmail = (value) => normalizeText(value).toLowerCase();
const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const sanitizeBagSizes = (bagSizes = {}) => ({
    handBag: Math.max(0, Math.floor(toNumber(bagSizes.handBag ?? bagSizes.S))),
    carrier: Math.max(0, Math.floor(
        toNumber(
            bagSizes.carrier ??
            (toNumber(bagSizes.M) + toNumber(bagSizes.L))
        )
    )),
    strollerBicycle: Math.max(0, Math.floor(toNumber(bagSizes.strollerBicycle ?? bagSizes.XL))),
});

const sanitizeDeliveryBagSizes = (bagSizes = {}) => ({
    ...sanitizeBagSizes(bagSizes),
    strollerBicycle: 0,
});

const getTotalBags = (bagSizes) =>
    Object.values(bagSizes).reduce((sum, count) => sum + toNumber(count), 0);

const sanitizeBookingPayload = (input = {}) => {
    const serviceType = normalizeUpper(input.serviceType);
    const bagSizes = serviceType === 'DELIVERY'
        ? sanitizeDeliveryBagSizes(input.bagSizes)
        : sanitizeBagSizes(input.bagSizes);
    const normalized = {
        id: normalizeText(input.id),
        reservationCode: normalizeText(input.reservationCode),
        userName: normalizeText(input.userName).slice(0, 100),
        userEmail: normalizeEmail(input.userEmail).slice(0, 100),
        snsChannel: normalizeText(input.snsChannel).slice(0, 50),
        snsId: normalizeText(input.snsId).slice(0, 200),
        serviceType,
        pickupLocation: normalizeText(input.pickupLocation).slice(0, 80),
        dropoffLocation: normalizeText(input.dropoffLocation).slice(0, 80),
        pickupDate: normalizeText(input.pickupDate).slice(0, 20),
        pickupTime: normalizeText(input.pickupTime).slice(0, 10),
        dropoffDate: normalizeText(input.dropoffDate).slice(0, 20),
        deliveryTime: normalizeText(input.deliveryTime).slice(0, 10),
        returnDate: normalizeText(input.returnDate).slice(0, 20),
        returnTime: normalizeText(input.returnTime).slice(0, 10),
        language: normalizeText(input.language || 'ko').slice(0, 10),
        country: normalizeText(input.country).slice(0, 10),
        pickupAddress: normalizeText(input.pickupAddress).slice(0, 300),
        pickupAddressDetail: normalizeText(input.pickupAddressDetail).slice(0, 300),
        dropoffAddress: normalizeText(input.dropoffAddress).slice(0, 300),
        dropoffAddressDetail: normalizeText(input.dropoffAddressDetail).slice(0, 300),
        selectedStorageTierId: normalizeText(input.selectedStorageTierId).slice(0, 100),
        discountCode: normalizeUpper(input.discountCode || input.promoCode).slice(0, 40),
        agreedToTerms: Boolean(input.agreedToTerms),
        agreedToPrivacy: Boolean(input.agreedToPrivacy),
        agreedToHighValue: Boolean(input.agreedToHighValue),
        agreedToPremium: Boolean(input.agreedToPremium),
        insuranceLevel: Math.min(3, Math.max(1, Math.floor(toNumber(input.insuranceLevel || 1)))),
        branchId: normalizeText(input.branchId).slice(0, 80),
        branchCommissionRates: {
            delivery: toNumber(input.branchCommissionRates?.delivery),
            storage: toNumber(input.branchCommissionRates?.storage),
        },
        bagSizes,
        bags: getTotalBags(bagSizes),
    };

    return normalized;
};

const assertValidBookingPayload = (booking) => {
    if (!booking.userName || !booking.userEmail) {
        throw new HttpsError('invalid-argument', '예약자 이름과 이메일이 필요합니다.');
    }

    if (!['DELIVERY', 'STORAGE'].includes(booking.serviceType)) {
        throw new HttpsError('invalid-argument', '지원하지 않는 예약 서비스입니다.');
    }

    if (!booking.pickupLocation || !booking.pickupDate || !booking.pickupTime) {
        throw new HttpsError('invalid-argument', '출발 지점과 일정 정보가 필요합니다.');
    }

    if (booking.serviceType === 'DELIVERY' && !booking.dropoffLocation) {
        throw new HttpsError('invalid-argument', '배송 예약은 도착 지점이 필요합니다.');
    }

    if (booking.bags <= 0) {
        throw new HttpsError('invalid-argument', '가방 수량이 1개 이상이어야 합니다.');
    }

    if (!booking.agreedToTerms || !booking.agreedToPrivacy || !booking.agreedToHighValue) {
        throw new HttpsError('failed-precondition', '필수 약관 동의가 필요합니다.');
    }
};

const getDeliveryPriceSettings = async (db) => {
    const snap = await db.collection('settings').doc('delivery_prices').get();
    if (!snap.exists) {
        return DEFAULT_DELIVERY_PRICES;
    }

    const data = snap.data() || {};
    const carrierPrice = toNumber(data.carrier) || toNumber(data.M) || toNumber(data.L) || DEFAULT_DELIVERY_PRICES.carrier;
    return {
        handBag: toNumber(data.handBag) || toNumber(data.S) || DEFAULT_DELIVERY_PRICES.handBag,
        carrier: carrierPrice,
        strollerBicycle: 0,
    };
};

const getLocation = async (db, locationId) => {
    if (!locationId || locationId === 'custom') {
        return null;
    }

    const snap = await db.collection('locations').doc(locationId).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
};

const applyCouponDiscount = (code, subtotal) => {
    const normalizedCode = normalizeUpper(code);
    if (!normalizedCode) {
        return { discountCode: '', discountAmount: 0 };
    }

    if (normalizedCode === 'PROMO2026') {
        return { discountCode: normalizedCode, discountAmount: Math.min(2026, subtotal) };
    }

    if (normalizedCode === 'WELCOME5000') {
        return { discountCode: normalizedCode, discountAmount: Math.min(5000, subtotal) };
    }

    if (normalizedCode === 'BEE10') {
        return { discountCode: normalizedCode, discountAmount: Math.min(Math.floor(subtotal * 0.1), subtotal) };
    }

    return { discountCode: '', discountAmount: 0 };
};

const buildReservationCode = ({ booking, pickupLoc, dropoffLoc }) => {
    if (booking.reservationCode) {
        return booking.reservationCode;
    }

    const random4 = Math.floor(1000 + Math.random() * 9000).toString();
    const pickupCode = pickupLoc?.shortCode || booking.pickupLocation || 'UNK';

    if (booking.serviceType === 'DELIVERY') {
        const dropoffCode = dropoffLoc?.shortCode || booking.dropoffLocation || 'ADDR';
        return `${pickupCode}-${dropoffCode}-${random4}`;
    }

    return `${pickupCode}-${random4}`;
};

const buildBookingDocumentId = (booking, reservationCode) => {
    if (booking.id) {
        return booking.id;
    }

    return reservationCode;
};

const buildOrderId = () => {
    const timePart = Date.now().toString(36).toUpperCase();
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `BEEPAY_${timePart}_${randomPart}`;
};

const buildCustomerKey = (uid, orderId) => {
    const digest = crypto
        .createHash('sha256')
        .update(`${uid}:${orderId}`)
        .digest('hex')
        .slice(0, 24);

    return `bee_${digest}`;
};

const buildOrderName = (booking) => {
    const bagLabel = booking.bags > 1 ? `${booking.bags}개` : '1개';
    return booking.serviceType === 'DELIVERY'
        ? `비리버 배송 예약 ${bagLabel}`
        : `비리버 보관 예약 ${bagLabel}`;
};

const calculateInsuranceFee = (booking) => {
    if (!booking.agreedToPremium) {
        return 0;
    }

    return 5000 * Math.max(1, booking.insuranceLevel || 1) * Math.max(1, booking.bags);
};

const getCalendarDiffDays = (startDate, endDate) => {
    const start = Date.parse(`${startDate}T00:00:00+09:00`);
    const end = Date.parse(`${endDate}T00:00:00+09:00`);

    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return 0;
    }

    return Math.max(0, Math.floor((end - start) / (24 * 60 * 60 * 1000)));
};

const calculateDeliveryPrice = ({ booking, pickupLoc, dropoffLoc, deliveryPrices }) => {
    const bagSizes = booking.bagSizes;
    const deliveryBase =
        (bagSizes.handBag * deliveryPrices.handBag) +
        (bagSizes.carrier * deliveryPrices.carrier);

    const diffDays = getCalendarDiffDays(booking.pickupDate, booking.dropoffDate || booking.pickupDate);
    const overnightStorage =
        diffDays > 0
            ? (
                bagSizes.handBag * STORAGE_RATES.handBag.extraDay +
                bagSizes.carrier * STORAGE_RATES.carrier.extraDay
            ) * diffDays
            : 0;

    return {
        basePrice: deliveryBase + overnightStorage,
        originSurcharge: toNumber(pickupLoc?.originSurcharge),
        destinationSurcharge: toNumber(dropoffLoc?.destinationSurcharge),
    };
};

const calculateStorageBookingPrice = (booking) => {
    const start = `${booking.pickupDate}T${booking.pickupTime || '00:00'}+09:00`;
    const end = `${booking.dropoffDate || booking.pickupDate}T${booking.deliveryTime || '23:59'}+09:00`;
    const result = calculateBookingStoragePrice(start, end, booking.bagSizes, booking.language || 'ko');

    return {
        basePrice: toNumber(result.total),
        originSurcharge: 0,
        destinationSurcharge: 0,
    };
};

const buildConfirmedBooking = ({ bookingDraft, paymentSummary }) => {
    const finalPrice = toNumber(bookingDraft.finalPrice);
    const rate = bookingDraft.branchId && bookingDraft.branchCommissionRates
        ? toNumber(
            bookingDraft.serviceType === 'DELIVERY'
                ? bookingDraft.branchCommissionRates.delivery
                : bookingDraft.branchCommissionRates.storage
        )
        : 0;

    return {
        ...bookingDraft,
        status: '접수완료',
        paymentMethod: 'card',
        paymentStatus: 'paid',
        paymentProvider: 'toss',
        paymentOrderId: paymentSummary.orderId,
        paymentKey: paymentSummary.paymentKey,
        paymentReceiptUrl: paymentSummary.receiptUrl || '',
        paymentApprovedAt: paymentSummary.approvedAt || new Date().toISOString(),
        branchSettlementAmount: rate > 0 ? Math.round(finalPrice * (rate / 100)) : undefined,
        updatedAt: new Date().toISOString(),
    };
};

const sanitizePaymentSummary = (payment) => ({
    paymentKey: normalizeText(payment?.paymentKey),
    orderId: normalizeText(payment?.orderId),
    approvedAt: normalizeText(payment?.approvedAt),
    receiptUrl: normalizeText(payment?.receipt?.url || payment?.receiptUrl),
    method: normalizeText(payment?.method || payment?.type || 'CARD'),
});

const fetchTossPaymentConfirm = async ({ secretKey, paymentKey, orderId, amount }) => {
    const authHeader = Buffer.from(`${secretKey}:`).toString('base64');
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': orderId,
        },
        body: JSON.stringify({
            paymentKey,
            orderId,
            amount,
        }),
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
        const message = normalizeText(body?.message) || '토스 결제 승인에 실패했습니다.';
        throw new HttpsError('internal', message);
    }

    return body;
};

const createTossPaymentSession = async ({ admin, uid, bookingInput }) => {
    const db = admin.firestore();
    const booking = sanitizeBookingPayload(bookingInput);
    assertValidBookingPayload(booking);

    const [pickupLoc, dropoffLoc, deliveryPrices] = await Promise.all([
        getLocation(db, booking.pickupLocation),
        booking.serviceType === 'DELIVERY' ? getLocation(db, booking.dropoffLocation) : Promise.resolve(null),
        getDeliveryPriceSettings(db),
    ]);

    const priceDetails = booking.serviceType === 'DELIVERY'
        ? calculateDeliveryPrice({ booking, pickupLoc, dropoffLoc, deliveryPrices })
        : calculateStorageBookingPrice(booking);
    const insuranceFee = calculateInsuranceFee(booking);
    const subtotal = priceDetails.basePrice + priceDetails.originSurcharge + priceDetails.destinationSurcharge + insuranceFee;
    const coupon = applyCouponDiscount(booking.discountCode, subtotal);
    const finalPrice = Math.max(0, subtotal - coupon.discountAmount);
    const reservationCode = buildReservationCode({ booking, pickupLoc, dropoffLoc });
    const bookingId = buildBookingDocumentId(booking, reservationCode);
    const orderId = buildOrderId();
    const customerKey = buildCustomerKey(uid, orderId);
    const orderName = buildOrderName(booking);

    const bookingDraft = {
        ...booking,
        id: bookingId,
        reservationCode,
        userId: uid,
        status: '접수완료',
        price: subtotal,
        discountCode: coupon.discountCode || undefined,
        discountAmount: coupon.discountAmount,
        finalPrice,
        paymentMethod: 'card',
        paymentStatus: finalPrice > 0 ? 'pending' : 'paid',
        createdAt: new Date().toISOString(),
        source: 'toss_payments',
    };

    if (finalPrice <= 0) {
        return {
            requiresPayment: false,
            amount: 0,
            booking: bookingDraft,
        };
    }

    await db.collection(PAYMENT_SESSION_COLLECTION).doc(orderId).set({
        orderId,
        customerKey,
        orderName,
        createdByUid: uid,
        expectedAmount: finalPrice,
        status: 'READY',
        paymentStatus: 'pending',
        bookingDraft,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + PAYMENT_SESSION_TTL_MS).toISOString(),
    });

    return {
        requiresPayment: true,
        orderId,
        amount: finalPrice,
        orderName,
        customerKey,
        booking: bookingDraft,
    };
};

const confirmTossPaymentSession = async ({ admin, uid, secretKey, paymentKey, orderId, amount }) => {
    const db = admin.firestore();
    const sessionRef = db.collection(PAYMENT_SESSION_COLLECTION).doc(orderId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
        throw new HttpsError('not-found', '결제 세션을 찾지 못했습니다.');
    }

    const session = sessionSnap.data() || {};
    if (normalizeText(session.createdByUid) !== normalizeText(uid)) {
        throw new HttpsError('permission-denied', '본인 결제 세션만 승인할 수 있습니다.');
    }

    const expectedAmount = toNumber(session.expectedAmount);
    if (expectedAmount <= 0) {
        throw new HttpsError('failed-precondition', '유효한 결제 금액이 없습니다.');
    }

    if (toNumber(amount) !== expectedAmount) {
        throw new HttpsError('failed-precondition', '리다이렉트 금액이 서버 금액과 일치하지 않습니다.');
    }

    const expiresAt = Date.parse(normalizeText(session.expiresAt));
    if (Number.isFinite(expiresAt) && Date.now() > expiresAt) {
        throw new HttpsError('deadline-exceeded', '결제 승인 가능 시간이 만료되었습니다.');
    }

    if (normalizeUpper(session.status) === 'CONFIRMED') {
        const storedPayment = sanitizePaymentSummary(session.payment);
        if (storedPayment.paymentKey && storedPayment.paymentKey !== normalizeText(paymentKey)) {
            throw new HttpsError('already-exists', '이미 다른 결제 키로 승인된 주문입니다.');
        }

        return {
            booking: buildConfirmedBooking({
                bookingDraft: session.bookingDraft || {},
                paymentSummary: storedPayment,
            }),
            payment: storedPayment,
        };
    }

    const payment = await fetchTossPaymentConfirm({
        secretKey,
        paymentKey,
        orderId,
        amount: expectedAmount,
    });
    const paymentSummary = sanitizePaymentSummary(payment);
    const confirmedBooking = buildConfirmedBooking({
        bookingDraft: session.bookingDraft || {},
        paymentSummary,
    });

    await db.collection('bookings').doc(confirmedBooking.id).set(confirmedBooking, { merge: true });
    
    // [스봉이] 메타 광고 트래킹: 서버 사이드 전환 전송 (CAPI) 💅✨
    // 백그라운드에서 실행되도록 await 하지 않습니다.
    sendMetaCAPI(confirmedBooking).catch(err => console.error('[스봉이] CAPI 에러 무시:', err));

    await sessionRef.set({
        status: 'CONFIRMED',
        paymentStatus: 'paid',
        payment: paymentSummary,
        bookingId: confirmedBooking.id,
        confirmedAt: new Date().toISOString(),
    }, { merge: true });

    return {
        booking: confirmedBooking,
        payment: paymentSummary,
    };
};

const sendMetaCAPI = async (booking) => {
    const PIXEL_ID = process.env.META_PIXEL_ID || '2813327635677634';
    const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;

    if (!ACCESS_TOKEN) {
        console.warn('[스봉이 알림] Meta CAPI 액세스 토큰이 없어 서버 전송을 건너뜁니다. 💅');
        return;
    }

    const hash = (val) => crypto.createHash('sha256').update(normalizeText(val).toLowerCase()).digest('hex');

    const eventData = {
        data: [{
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            event_id: booking.id || booking.reservationCode,
            user_data: {
                em: [hash(booking.userEmail)],
                fn: [hash(booking.userName)]
            },
            custom_data: {
                value: toNumber(booking.finalPrice),
                currency: 'KRW',
                content_ids: [booking.serviceType],
                content_type: 'product'
            }
        }]
    };

    try {
        await fetch(`https://graph.facebook.com/v17.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
        console.log(`[스봉이] Meta CAPI Purchase 이벤트 전송 완료! (ID: ${booking.id}) 💅✨`);
    } catch (err) {
        console.error('[스봉이 사고] Meta Capi 전송 중 에러 발생:', err);
    }
};

module.exports = {
    createTossPaymentSession,
    confirmTossPaymentSession,
};
