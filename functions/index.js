const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { calculateBookingStoragePrice } = require('./src/shared/pricing');
const { processVoucherEmail } = require("./src/domains/notification/voucherService");
const { processArrivalEmail } = require("./src/domains/notification/arrivalService");
const { processRefundEmail } = require("./src/domains/notification/refundService");

admin.initializeApp();

const ADMIN_ROLES = new Set(['super', 'branch', 'staff', 'partner', 'driver', 'finance', 'cs']);
const MAILER_SECRETS = ['SMTP_PASS'];
const NOTIFICATION_SECRETS = ['SMTP_PASS', 'GOOGLE_CHAT_WEBHOOK_URL'];

const assertAuthenticated = (request) => {
    const uid = request.auth && request.auth.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    return uid;
};

const getAdminContext = async (uid) => {
    if (!uid) {
        return null;
    }

    const snap = await admin.firestore().collection('admins').doc(uid).get();
    if (!snap.exists) {
        return null;
    }

    const data = snap.data() || {};
    if (!ADMIN_ROLES.has(data.role)) {
        return null;
    }

    return { id: snap.id, ...data };
};

const assertAdmin = async (request) => {
    const uid = assertAuthenticated(request);
    const adminContext = await getAdminContext(uid);
    if (!adminContext) {
        throw new HttpsError('permission-denied', 'Admin access required.');
    }
    return { uid, adminContext };
};

const assertSuperAdmin = async (request) => {
    const { adminContext } = await assertAdmin(request);
    if (adminContext.role !== 'super') {
        throw new HttpsError('permission-denied', 'Super admin access required.');
    }
    return adminContext;
};

/**
 * 💅 Beeliber Backend v2 Engine
 * Hyper-Gap Innovation Roadmap Implementation
 */

// --- HTTPS Callables (v2) ---

// 1. Resend Voucher
exports.resendBookingVoucher = onCall({ secrets: MAILER_SECRETS }, async (request) => {
    await assertAdmin(request);
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
exports.processBookingRefund = onCall({ secrets: MAILER_SECRETS }, async (request) => {
    await assertAdmin(request);
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
    const uid = assertAuthenticated(request);
    const { bookingId } = request.data;
    if (!bookingId) throw new HttpsError('invalid-argument', 'bookingId is required.');

    const ref = admin.firestore().collection('bookings').doc(bookingId);
    try {
        const snap = await ref.get();
        if (!snap.exists) throw new HttpsError('not-found', 'Booking not found');

        const booking = snap.data();
        const adminContext = await getAdminContext(uid);
        const isOwner = booking.userId && booking.userId === uid;
        if (!adminContext && !isOwner) {
            throw new HttpsError('permission-denied', 'You do not have access to cancel this booking.');
        }

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
    await assertSuperAdmin(request);
    console.log("Starting Claude Agent via v2...");
    const payload = request.data && typeof request.data === 'object' ? request.data : {};
    const task = typeof payload.task === 'string' ? payload.task.trim() : '';
    const agentName = typeof payload.agentName === 'string' ? payload.agentName.trim() : 'clubbang-i';

    if (!task) {
        throw new HttpsError('invalid-argument', 'task is required.');
    }

    if (task.length > 4000 || agentName.length > 64) {
        throw new HttpsError('invalid-argument', 'Request payload is too large.');
    }

    return await claudeAgent.runAgent({ ...payload, task, agentName });
});

// 4-1. Secure Admin Verification (Full CORS Permitted) 🛡️💅
exports.verifyAdmin = onCall({ cors: true, invoker: 'public' }, async (request) => {
    const requestUid = assertAuthenticated(request);
    const { name, password } = request.data || {};
    if (!name || !password) throw new HttpsError('invalid-argument', 'Name and password required.');

    const normalize = (str) => (str || '').replace(/\s+/g, '').toLowerCase().normalize('NFC');
    const inputName = normalize(name);
    const inputPassword = String(password || '').trim();
    const hasPassword = (data) => String(data?.password || '').trim().length > 0;
    const isUidMappedRecord = (docId, data) => Boolean(data?.uid && data.uid === docId);
    const getIdentifiers = (docId, data) => new Set([
        docId,
        data?.name,
        data?.loginId,
        data?.email
    ].map(normalize).filter(Boolean));
    const inferRole = (docId, data) => {
        if (ADMIN_ROLES.has(data?.role)) {
            return data.role;
        }

        const title = String(data?.jobTitle || '').toUpperCase();
        if (title.includes('CEO') || title.includes('MASTER') || title.includes('GENERAL MANAGER') || docId === 'admin-8684') {
            return 'super';
        }

        return data?.branchId ? 'branch' : 'staff';
    };
    const getRoleScore = (docId, data) => inferRole(docId, data) === 'super' ? 2 : 1;
    const getFreshness = (data) => new Date(
        data?.updatedAt ||
        data?.lastLogin ||
        data?.createdAt ||
        data?.security?.lastLoginAt ||
        0
    ).getTime();
    const getCompleteness = (data) => ([
        data?.email,
        data?.loginId,
        hasPassword(data) ? 'password' : '',
        data?.phone,
        data?.branchId,
        data?.role,
        data?.orgType,
        data?.memo,
        Array.isArray(data?.permissions) && data.permissions.length > 0 ? 'permissions' : ''
    ].filter(Boolean).length);
    const sortAdminDocs = (left, right) => {
        const leftData = left.data() || {};
        const rightData = right.data() || {};

        const credentialDiff = Number(hasPassword(rightData)) - Number(hasPassword(leftData));
        if (credentialDiff !== 0) return credentialDiff;

        const canonicalDiff = Number(isUidMappedRecord(left.id, leftData)) - Number(isUidMappedRecord(right.id, rightData));
        if (canonicalDiff !== 0) return canonicalDiff;

        const roleDiff = getRoleScore(right.id, rightData) - getRoleScore(left.id, leftData);
        if (roleDiff !== 0) return roleDiff;

        const completenessDiff = getCompleteness(rightData) - getCompleteness(leftData);
        if (completenessDiff !== 0) return completenessDiff;

        return getFreshness(rightData) - getFreshness(leftData);
    };
    const emergencyBootstrapAdmin = {
        id: 'admin-8684',
        name: 'admin',
        jobTitle: 'CEO',
        role: 'super',
        password: '8684'
    };

    try {
        const db = admin.firestore();

        console.log(`[AdminVerify] Attempting login for: ${name} (Normalized: ${inputName})`);

        // [스봉이] 전체 검색을 기본으로 하여 정규화 매칭 보장 💅
        const allAdminsSnap = await db.collection('admins').get();
        const allAdminDocs = [...allAdminsSnap.docs];
        const hasCredentialedAdmin = allAdminDocs.some((doc) => hasPassword(doc.data()));
        const matchingDocs = allAdminDocs
            .filter((doc) => getIdentifiers(doc.id, doc.data()).has(inputName))
            .sort(sortAdminDocs);
        let adminDoc = matchingDocs.find((doc) => String(doc.data().password || '').trim() === inputPassword) || null;

        let adminData = null;
        let adminId = null;

        if (adminDoc) {
            adminData = adminDoc.data();
            adminId = adminDoc.id;
        }

        const emergencyMatched =
            getIdentifiers(emergencyBootstrapAdmin.id, emergencyBootstrapAdmin).has(inputName) &&
            inputPassword === emergencyBootstrapAdmin.password;

        // [스봉이] 비밀번호가 전멸한 비상 상황이면, 이미 등록된 직원 문서를 8684 복구 비밀번호로 임시 진입시켜 문을 다시 열어줍니다.
        if (!adminData && !hasCredentialedAdmin && inputPassword === emergencyBootstrapAdmin.password && matchingDocs.length > 0) {
            adminDoc = matchingDocs[0];
            adminData = adminDoc.data();
            adminId = adminDoc.id;
            console.warn(`[AdminVerify] Recovery login granted for "${name}" because no credentialed admin record was found.`);
        }

        // [스봉이] 원본 관리자 문서가 전부 사라졌을 때만, 문서에 적힌 비상 계정으로 최소 복구를 허용합니다.
        if (!adminData && emergencyMatched && !hasCredentialedAdmin) {
            const seededAdmin = {
                ...emergencyBootstrapAdmin,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'active'
            };
            await db.collection('admins').doc(emergencyBootstrapAdmin.id).set(seededAdmin, { merge: true });
            adminData = seededAdmin;
            adminId = emergencyBootstrapAdmin.id;
            console.warn('[AdminVerify] Emergency bootstrap admin restored because no credentialed admin record was found.');
        }

        if (!adminData) {
            console.warn(`Login failed: No matching admin found for "${name}" or incorrect password.`);
            throw new HttpsError('unauthenticated', '이름 또는 비밀번호가 올바르지 않습니다.');
        }

        const { password: _, ...safeAdminData } = adminData;
        
        // [스봉이] 직함에 따른 권한 자동 부여 (DB에 role이 없어도 똑똑하게! 💅)
        if (!safeAdminData.role) {
            const title = (safeAdminData.jobTitle || '').toUpperCase();
            if (title.includes('CEO') || title.includes('MASTER') || title.includes('GENERAL MANAGER') || adminId === 'admin-8684') {
                safeAdminData.role = 'super';
            } else {
                safeAdminData.role = 'staff';
            }
        }

        // UID 매핑은 반드시 대기(await)해야 프론트엔드에서 대시보드 진입 시 권한 오류가 발생하지 않습니다. 🛡️
        try {
            await db.collection('admins').doc(requestUid).set({
                ...safeAdminData,
                uid: requestUid,
                lastLogin: new Date().toISOString()
            }, { merge: true });
            console.log(`[AdminVerify] UID Mapping success for: ${requestUid}`);
        } catch (e) {
            console.error("UID mapping failed:", e);
        }

        return { ...safeAdminData, id: adminId };
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
exports.notifyGoogleChat = onRequest({ secrets: ['GOOGLE_CHAT_WEBHOOK_URL'] }, async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
    }

    const { text, sessionId, senderName, senderEmail, role } = req.body;
    try {
        const configSnap = await admin.firestore().collection('settings').doc('cloud_config').get();
        const webhook = configSnap.exists ? configSnap.data().googleChatWebhookUrl : process.env.GOOGLE_CHAT_WEBHOOK_URL;

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
exports.onBookingCreated = onDocumentCreated({ document: "bookings/{bookingId}", secrets: NOTIFICATION_SECRETS }, async (event) => {
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

            // Generate reservationCode (origin-dest-random) - 💅 안정성 강화
            const getShort = async (locId) => {
                if (!locId || locId === 'custom') return 'ADDR';
                try {
                    const s = await db.collection('locations').doc(locId).get();
                    return s.exists ? (s.data().shortCode || locId.substring(0, 3).toUpperCase()) : locId.substring(0, 3).toUpperCase();
                } catch (e) {
                    console.warn(`[onBookingCreated] Location fetch failed for ${locId}, fallback to substring:`, e.message);
                    return locId.substring(0, 3).toUpperCase();
                }
            };
            const originCode = await getShort(booking.pickupLocation);
            const destCode = booking.serviceType === 'DELIVERY' ? 'ADDR' : await getShort(booking.dropoffLocation || booking.destinationLocation);
            const reservationCode = booking.reservationCode || `${originCode}-${destCode}-${Math.floor(1000 + Math.random() * 9000)}`;

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
        console.log(`[onBookingCreated] Attempting to send voucher email for ${bookingId}`);
        await processVoucherEmail(bookingId, booking, admin);
        console.log(`[onBookingCreated] Voucher email process triggered for ${bookingId}`);
    } catch (e) {
        console.error(`❌ [onBookingCreated] Voucher sending failed for ${bookingId}:`, e);
        // [스봉이] 이메일 실패해도 예약은 진행되어야 하니 리턴하지 않습니다. 💅
    }

    // 3. Google Chat Notification (사장님 커스텀 로직 적용 💅✨)
    try {
        const configSnap = await admin.firestore().collection('settings').doc('cloud_config').get();
        const webhook = configSnap.exists ? configSnap.data().googleChatWebhookUrl : process.env.GOOGLE_CHAT_WEBHOOK_URL;

        const displayedCode = booking.reservationCode || bookingId;
        const bagDetails = Object.entries(booking.bagSizes || {})
            .filter(([_, count]) => count > 0)
            .map(([size, count]) => `${size}(${count}개)`)
            .join(', ');

        let text = '';
        if (booking.serviceType === 'DELIVERY') {
            text = `*🚨 신규 배송 예약 알림*\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `🔖 *예약코드*: ${displayedCode}\n` +
                `👤 *이름*: ${booking.userName}\n` +
                `🚚 *서비스*: 배송\n` +
                `📍 *경로*: ${booking.pickupLocation}(${booking.pickupTime}) - ${booking.dropoffLocation || '주소지'}(${booking.deliveryTime || '당일'})\n` +
                `📦 *가방*: ${bagDetails}\n` +
                `💰 *결제금액*: ₩${(booking.finalPrice || 0).toLocaleString()}\n` +
                `━━━━━━━━━━━━━━━━━━━━`;
        } else {
            text = `*🚨 신규 보관 예약 알림*\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `🔖 *예약코드*: ${displayedCode}\n` +
                `👤 *이름*: ${booking.userName}\n` +
                `🏦 *서비스*: 보관\n` +
                `📥 *보관*: ${booking.pickupLocation} (${booking.pickupDate} ${booking.pickupTime})\n` +
                `📤 *찾는날*: ${booking.dropoffDate} ${booking.deliveryTime || booking.pickupTime}\n` +
                `📦 *가방*: ${bagDetails}\n` +
                `💰 *결제금액*: ₩${(booking.finalPrice || 0).toLocaleString()}\n` +
                `━━━━━━━━━━━━━━━━━━━━`;
        }

        await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    } catch (e) {
        console.error("Chat notify failed:", e);
    }
});

// 8. On Booking Updated (Arrival + Commission)
exports.onBookingUpdated = onDocumentUpdated({ document: "bookings/{bookingId}", secrets: MAILER_SECRETS }, async (event) => {
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
