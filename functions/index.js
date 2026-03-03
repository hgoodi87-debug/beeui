const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const googleChatWebhookSecret = defineSecret("GOOGLE_CHAT_WEBHOOK_URL");
const smtpPassSecret = defineSecret("SMTP_PASS");
const { onDocumentCreated, onDocumentUpdated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { calculateBookingStoragePrice } = require('./src/shared/pricing');
const { processVoucherEmail } = require("./src/domains/notification/voucherService");
const { processArrivalEmail } = require("./src/domains/notification/arrivalService");
const { processRefundEmail } = require("./src/domains/notification/refundService");

admin.initializeApp();

/**
 * 💅 Beeliber Backend v2 Engine
 * Hyper-Gap Innovation Roadmap Implementation
 */

// --- HTTPS Callables (v2) ---

// 1. Resend Voucher
exports.resendBookingVoucher = onCall({ secrets: [smtpPassSecret] }, async (request) => {
    const { bookingId } = request.data;
    if (!bookingId) throw new HttpsError('invalid-argument', 'bookingId is required.');

    try {
        const snap = await admin.firestore().collection('bookings').doc(bookingId).get();
        if (!snap.exists) throw new HttpsError('not-found', 'Booking not found');

        return await processVoucherEmail(bookingId, snap.data(), admin);
    } catch (error) {
        throw new HttpsError('internal', error.message);
    }
});

// 2. Process Refund
exports.processBookingRefund = onCall(async (request) => {
    const { bookingId } = request.data;
    if (!bookingId) throw new HttpsError('invalid-argument', 'bookingId is required.');

    const ref = admin.firestore().collection('bookings').doc(bookingId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError('not-found', 'Booking not found');

    await ref.update({
        status: '환불완료',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return await processRefundEmail(bookingId, snap.data());
});

// 3. Cancel Booking
exports.cancelBooking = onCall(async (request) => {
    const { bookingId } = request.data;
    if (!bookingId) throw new HttpsError('invalid-argument', 'bookingId is required.');

    const ref = admin.firestore().collection('bookings').doc(bookingId);
    try {
        const snap = await ref.get();
        if (!snap.exists) throw new HttpsError('not-found', 'Booking not found');

        const booking = snap.data();
        if (booking.status === '취소됨' || booking.status === '환불완료') {
            return { success: true, message: 'Already cancelled.' };
        }

        await ref.update({
            status: '취소됨',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, bookingId };
    } catch (error) {
        throw new HttpsError('internal', error.message);
    }
});

// 4. Claude Agent Proxy
const claudeAgent = require('./agent/claudeAgent');
exports.runClaudeAgent = onCall({ timeoutSeconds: 540, memory: "1GiB" }, async (request) => {
    console.log("Starting Claude Agent via v2...");
    return await claudeAgent.runAgent(request.data);
});

// 4-1. Secure Admin Verification (Full CORS Permitted) 🛡️💅
exports.verifyAdmin = onCall({ cors: true, invoker: 'public' }, async (request) => {
    const { name, password } = request.data;
    if (!name || !password) throw new HttpsError('invalid-argument', 'Name and password required.');

    const normalize = (str) => (str || '').replace(/\s+/g, '').toLowerCase().normalize('NFC');
    const inputName = normalize(name);
    const inputPassword = password.trim();

    try {
        const db = admin.firestore();

        // [스봉이] 전체를 다 가져오지 않고, 일단 쿼리 시도! 💅
        const quickSnap = await db.collection('admins').where('name', '==', name.trim()).get();
        let adminDoc = quickSnap.docs[0];

        // 만약 단순 쿼리로 못 찾으면 전체 검색 (정규화된 이름 매칭용)
        if (!adminDoc) {
            console.log("Quick lookup failed, performing full scan for normalized match...");
            const allAdminsSnap = await db.collection('admins').get();
            adminDoc = allAdminsSnap.docs.find(doc => {
                const data = doc.data();
                return normalize(data.name) === inputName && (data.password || '').trim() === inputPassword;
            });
        }

        // [스봉이] 데이터가 아예 없으면 초기 데이터 심기
        if (!adminDoc && (await db.collection('admins').limit(1).get()).empty) {
            console.log("No admins found in cloud. Seeding initial data...");
            const initialAdmins = [
                { id: 'admin-001', name: '천명', jobTitle: 'CEO', password: '8684', createdAt: new Date().toISOString() },
                { id: 'admin-002', name: '매니저', jobTitle: 'General Manager', password: '1234', createdAt: new Date().toISOString() },
                { id: 'admin-003', name: '스태프', jobTitle: 'Staff', password: '0000', createdAt: new Date().toISOString() },
                { id: 'admin-004', name: '진호', jobTitle: 'Master', password: '4608', createdAt: new Date().toISOString() }
            ];
            const batch = db.batch();
            initialAdmins.forEach(adm => batch.set(db.collection('admins').doc(adm.id), adm));
            await batch.commit();

            // Re-check after seeding
            const reSnap = await db.collection('admins').get();
            adminDoc = reSnap.docs.find(doc => normalize(doc.data().name) === inputName);
        }

        if (!adminDoc || (adminDoc.data().password || '').trim() !== inputPassword) {
            console.warn(`Login failed for name: ${name}`);
            throw new HttpsError('unauthenticated', 'Invalid credentials');
        }

        const adminData = adminDoc.data();
        const { password: _, ...safeAdminData } = adminData;

        // UID 매핑은 백그라운드에서 처리하면 더 빠르겠지만, 안정성을 위해 유지 (단, 비동기 처리는 시점 조정 가능)
        if (request.auth && request.auth.uid) {
            db.collection('admins').doc(request.auth.uid).set({
                ...safeAdminData,
                uid: request.auth.uid,
                lastLogin: new Date().toISOString()
            }, { merge: true }).catch(err => console.error("UID mapping failed:", err));
        }

        return { ...safeAdminData, id: adminDoc.id };
    } catch (e) {
        console.error("verifyAdmin ERROR:", e);
        if (e.code && (typeof e.code === 'string')) throw e;
        throw new HttpsError('internal', e.message);
    }
});

// --- HTTP Requests (v2) ---

// 5. Partner API
exports.partnerApi = onRequest(async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ error: "Missing API Key" });

    try {
        const keysSnap = await admin.firestore().collection('settings').doc('api_keys').get();
        const validKeys = keysSnap.exists ? keysSnap.data().partnerKeys || [] : [];
        if (!validKeys.includes(apiKey)) return res.status(403).json({ error: "Invalid API Key" });

        const pathParts = req.path.split('/').filter(p => p !== '');
        const resource = pathParts[1];
        const resourceId = pathParts[2];

        if (req.method === 'GET' && resource === 'locations') {
            const snap = await admin.firestore().collection('locations').get();
            return res.status(200).json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }

        if (req.method === 'POST' && resource === 'bookings') {
            const data = req.body;
            const snapshot = await admin.firestore().collection("bookings").get();
            const seqStr = String(snapshot.size + 1).padStart(4, '0');
            const newId = `PARTNER-${Date.now().toString().slice(-4)}-${seqStr}`;

            const newBooking = { ...data, id: newId, status: '접수완료', createdAt: new Date().toISOString(), source: 'partner_api' };
            await admin.firestore().collection('bookings').doc(newId).set(newBooking);
            return res.status(201).json({ id: newId, message: "Booking created" });
        }

        return res.status(404).json({ error: "Not found" });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// 6. Google Chat Notifier (CORS Proxy)
exports.notifyGoogleChat = onRequest({ secrets: [googleChatWebhookSecret] }, async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
    }

    const { text, sessionId, senderName, senderEmail, role } = req.body;
    try {
        const configSnap = await admin.firestore().collection('settings').doc('cloud_config').get();
        const webhook = configSnap.exists ? configSnap.data().googleChatWebhookUrl : googleChatWebhookSecret.value();

        const displayRole = role === 'user' ? `👤 ${senderName || 'Guest'}` : '🐝 BeeBot';
        const payload = { text: `*${displayRole}*: ${text}`, thread: { threadKey: sessionId } };

        await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        return res.status(200).send('Sent');
    } catch (e) {
        return res.status(500).send(e.message);
    }
});

// --- Firestore Triggers (v2) ---

// 7. On Booking Created (Voucher + Validation + Notifier)
exports.onBookingCreated = onDocumentCreated({ document: "bookings/{bookingId}", secrets: [googleChatWebhookSecret, smtpPassSecret] }, async (event) => {
    const bookingId = event.params.bookingId;
    const booking = event.data.data();

    // 1. Server Validation & reservationCode Generation (if needed)
    if (booking.status === 'SERVER_VALIDATION_PENDING') {
        try {
            const db = admin.firestore();
            let finalPrice = booking.finalPrice;

            if (booking.serviceType === 'STORAGE') {
                const start = new Date(`${booking.pickupDate}T${booking.pickupTime || "00:00"}+09:00`);
                const end = new Date(`${booking.dropoffDate || booking.pickupDate}T${booking.deliveryTime || "23:59"}+09:00`);
                const serverPrice = calculateBookingStoragePrice(start, end, booking.bagSizes || {}, booking.language);
                finalPrice = serverPrice.total;
            }

            // Generate reservationCode (origin-dest-random)
            const getShort = async (id) => {
                if (!id || id === 'custom') return 'UNK';
                const s = await db.collection('locations').doc(id).get();
                return s.exists ? (s.data().shortCode || id.substring(0, 3).toUpperCase()) : id.substring(0, 3).toUpperCase();
            };
            const originCode = await getShort(booking.pickupLocation);
            const destCode = await getShort(booking.dropoffLocation || booking.destinationLocation);
            const reservationCode = `${originCode}-${destCode}-${Math.floor(1000 + Math.random() * 9000)}`;

            await event.data.ref.update({
                finalPrice,
                reservationCode: booking.reservationCode || reservationCode,
                status: '접수완료'
            });

            // Re-fetch updated booking for email/chat
            booking.reservationCode = reservationCode;
            booking.finalPrice = finalPrice;
            booking.status = '접수완료';
        } catch (e) {
            console.error("Validation failed:", e);
            await event.data.ref.update({ status: '예약실패', error: e.message });
            return;
        }
    }

    // 2. Send Initial Voucher
    try {
        await processVoucherEmail(bookingId, booking, admin);
    } catch (e) {
        console.error("Voucher failed:", e);
    }

    // 3. Google Chat Notification
    try {
        const configSnap = await admin.firestore().collection('settings').doc('cloud_config').get();
        const webhook = configSnap.exists ? configSnap.data().googleChatWebhookUrl : googleChatWebhookSecret.value();

        const text = `*🚨 신규 예약 알림 (${bookingId})*\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `📦 *서비스*: ${booking.serviceType}\n` +
            `👤 *고객*: ${booking.userName}\n` +
            `📍 *출발*: ${booking.pickupLocation}\n` +
            `🏁 *도착*: ${booking.dropoffLocation || '주소지'}\n` +
            `💰 *금액*: ₩${(booking.finalPrice || 0).toLocaleString()}\n` +
            `━━━━━━━━━━━━━━━━━━━━`;

        await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    } catch (e) {
        console.error("Chat notify failed:", e);
    }
});

// 8. On Booking Updated (Arrival + Commission)
exports.onBookingUpdated = onDocumentUpdated("bookings/{bookingId}", async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    const bookingId = event.params.bookingId;

    // 1. Arrival Notification
    if (before?.status !== '목적지도착' && after?.status === '목적지도착') {
        await processArrivalEmail(bookingId, after, admin);
    }

    // 2. Settlement Calculation
    if (after.branchId && after.branchCommissionRates) {
        const rate = after.serviceType === 'DELIVERY' ? (after.branchCommissionRates.delivery || 0) : (after.branchCommissionRates.storage || 0);
        let settlement = Math.round((after.finalPrice || 0) * (rate / 100));
        if (after.status === '취소됨' || after.status === '환불완료') settlement = 0;

        if (before.branchSettlementAmount !== settlement) {
            await event.data.after.ref.update({ branchSettlementAmount: settlement });
        }
    }
});
