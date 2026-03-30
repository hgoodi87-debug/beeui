const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { calculateBookingStoragePrice } = require('./src/shared/pricing');
const { processVoucherEmail } = require("./src/domains/notification/voucherService");
const { processArrivalEmail } = require("./src/domains/notification/arrivalService");
const { processRefundEmail } = require("./src/domains/notification/refundService");
const { sendMail } = require("./src/domains/notification/mailer");
const { handleSignedUploadRequest, isSignedUploadHttpError } = require("./src/domains/storage/signedUploadService");
const { createTossPaymentSession, confirmTossPaymentSession } = require("./src/domains/payments/tossPaymentsService");
const { upsertAdminAccount, deleteAdminAccount } = require("./src/domains/admin/upsertAdminAccountService");

admin.initializeApp();

const ADMIN_ROLES = new Set(['super', 'hq', 'branch', 'staff', 'partner', 'driver', 'finance', 'cs']);
const MAILER_SECRETS = ['SMTP_PASS', 'INTERNAL_MAIL_KEY'];
const NOTIFICATION_SECRETS = ['SMTP_PASS', 'GOOGLE_CHAT_WEBHOOK_URL'];
const SUPABASE_ROLE_TO_LEGACY_ROLE = {
    super_admin: 'super',
    hq_admin: 'hq',
    hub_manager: 'branch',
    partner_manager: 'partner',
    finance_staff: 'finance',
    cs_staff: 'cs',
    driver: 'driver',
    ops_staff: 'staff',
    marketing: 'hq',
    content_manager: 'hq',
};

const normalizeText = (value) => String(value || '').trim();
const normalizeLower = (value) => normalizeText(value).toLowerCase();
const mailSecretMatches = (value) => normalizeText(value) && normalizeText(value) === normalizeText(process.env.INTERNAL_MAIL_KEY);

const createHttpRequestError = (status, message, logMessage) => {
    const error = new Error(message);
    error.status = status;
    error.logMessage = logMessage || message;
    return error;
};

const parseJsonResponse = async (response) => {
    const text = await response.text();
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return text;
    }
};

const sendJson = (res, status, body) => {
    res.status(status);
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'content-type, x-beeliber-mail-key');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.json(body);
};

const buildVoucherEmailHtml = (booking) => {
    const code = normalizeText(booking.reservation_code || booking.reservationCode || booking.id);
    const userName = normalizeText(booking.user_name || booking.userName);
    const serviceType = normalizeText(booking.service_type || booking.serviceType) === 'DELIVERY' ? '배송' : '보관';
    const pickupLabel = normalizeText(booking.pickup_label || booking.pickup_location || booking.pickupLocation) || '주소 직접 입력';
    const dropoffLabel = normalizeText(booking.dropoff_label || booking.dropoff_location || booking.dropoffLocation);
    const pickupDate = normalizeText(booking.pickup_date || booking.pickupDate);
    const pickupTime = normalizeText(booking.pickup_time || booking.pickupTime);
    const dropoffDate = normalizeText(booking.dropoff_date || booking.dropoffDate);
    const deliveryTime = normalizeText(booking.delivery_time || booking.deliveryTime);
    const finalPrice = Number(booking.final_price || booking.finalPrice || 0);
    const nametagNumber = normalizeText(booking.nametag_number || booking.nametagNumber || '');

    // QR Code URL (points to admin scan page)
    const qrData = encodeURIComponent(`https://bee-liber.com/admin/scan?id=${code}`);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&color=111827&bgcolor=FFFFFF`;

    return `
      <div style="font-family:'Pretendard', 'Apple SD Gothic Neo', Arial, sans-serif;line-height:1.6;color:#111827;background-color:#f9fafb;padding:40px 20px;max-width:600px;margin:0 auto;">
        <div style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);">
          
          <!-- Header (Black & Gold/Yellow) -->
          <div style="background-color:#111827;color:#ffffff;padding:32px 24px;text-align:center;border-bottom:4px solid #FBBF24;">
            <h1 style="margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
              <span style="color:#FBBF24;">Beeliber</span> 예약 확정
            </h1>
            <p style="margin:8px 0 0;color:#9CA3AF;font-size:15px;">예약이 성공적으로 확정되었습니다.</p>
          </div>

          <!-- Content -->
          <div style="padding:32px 24px;">
            
            <!-- Reservation Code & Nametag -->
            <div style="background-color:#FEF3C7;border-radius:12px;padding:20px;margin-bottom:28px;text-align:center;border:1px solid #FDE68A;">
              <p style="margin:0;font-size:13px;color:#92400E;font-weight:600;text-transform:uppercase;letter-spacing:1px;">예약번호 (Booking Code)</p>
              <p style="margin:4px 0 0;font-size:28px;font-weight:800;color:#111827;letter-spacing:2px;">${code}</p>
              ${nametagNumber ? `
              <div style="margin-top:16px;padding-top:16px;border-top:1px dashed #FCD34D;">
                <p style="margin:0;font-size:12px;color:#92400E;font-weight:600;">수하물 태그 번호 (Tag Number)</p>
                <div style="display:inline-block;background-color:#111827;color:#FBBF24;font-size:24px;font-weight:800;padding:8px 24px;border-radius:8px;margin-top:8px;">
                  #${nametagNumber}
                </div>
              </div>` : ''}
            </div>

            <!-- QR Code Section -->
            <div style="text-align:center;margin-bottom:32px;">
              <p style="margin:0 0 12px;font-size:14px;color:#4B5563;font-weight:600;">직원 확인용 QR 코드</p>
              <div style="display:inline-block;padding:12px;background-color:#ffffff;border:2px solid #E5E7EB;border-radius:12px;">
                <img src="${qrCodeUrl}" alt="Booking QR Code" style="width:160px;height:160px;display:block;" />
              </div>
              <p style="margin:12px 0 0;font-size:13px;color:#6B7280;">수하물 위탁/수령 시 직원에게 위 QR코드를 보여주세요.</p>
            </div>

            <!-- Booking Details -->
            <h3 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">예약 상세 정보</h3>
            <table style="width:100%;border-collapse:collapse;font-size:15px;margin-bottom:24px;">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6B7280;width:35%;">고객명</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-weight:500;text-align:right;">${userName}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6B7280;">서비스 유형</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-weight:500;text-align:right;">
                  <span style="background-color:#F3F4F6;padding:4px 10px;border-radius:6px;font-size:13px;">${serviceType}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6B7280;">픽업 지점</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-weight:500;text-align:right;">${pickupLabel}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6B7280;">이용 시작</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-weight:500;text-align:right;">${pickupDate} ${pickupTime}</td>
              </tr>
              ${serviceType === '배송' ? `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6B7280;">도착 지점</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-weight:500;text-align:right;">${dropoffLabel || '주소 직접 입력'}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6B7280;">도착 예정</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-weight:500;text-align:right;">${dropoffDate} ${deliveryTime}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding:12px 0 4px;color:#6B7280;font-weight:600;">최종 결제 금액</td>
                <td style="padding:12px 0 4px;color:#F59E0B;font-weight:700;text-align:right;font-size:18px;">₩${finalPrice.toLocaleString()}</td>
              </tr>
            </table>

          </div>

          <!-- Footer -->
          <div style="background-color:#F9FAFB;padding:24px;text-align:center;border-top:1px solid #E5E7EB;">
            <p style="margin:0;font-size:14px;color:#4B5563;font-weight:500;">프리미엄 수하물 서비스, 빌리버와 함께 가벼운 여행 되세요.</p>
            <p style="margin:12px 0 0;font-size:12px;color:#9CA3AF;">© Beeliber. All rights reserved.<br/>bee-liber.com</p>
          </div>
          
        </div>
      </div>
    `;
};

const buildArrivalEmailHtml = (booking) => {
    const code = normalizeText(booking.reservation_code || booking.reservationCode || booking.id);
    return `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;padding:24px">
        <h2 style="margin:0 0 16px">🐝 짐이 목적지에 도착했습니다</h2>
        <p><strong>예약코드:</strong> ${code}</p>
        <p>짐이 목적지에 안전하게 도착했습니다. 현장에서 바우처를 제시해 주세요.</p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb" />
        <p style="margin:0">가벼운 여행 되세요.</p>
        <p style="margin:4px 0 0">beeliber · bee-liber.com</p>
      </div>
    `;
};

const resolveSupabaseRuntimeConfig = () => {
    const supabaseUrl = normalizeText(process.env.SUPABASE_URL);
    const serviceRoleKey = normalizeText(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY);

    if (!supabaseUrl || !serviceRoleKey) {
        throw createHttpRequestError(
            503,
            'Supabase 서버 설정이 아직 준비되지 않았습니다.',
            'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.'
        );
    }

    return { supabaseUrl, serviceRoleKey };
};

const fetchSupabaseJson = async ({ path, accessToken, fallbackMessage }) => {
    const { supabaseUrl, serviceRoleKey } = resolveSupabaseRuntimeConfig();
    const response = await fetch(`${supabaseUrl}${path}`, {
        headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${accessToken || serviceRoleKey}`,
            'Content-Type': 'application/json',
        },
    });
    const body = await parseJsonResponse(response);

    if (!response.ok) {
        const detail =
            typeof body === 'object' && body && 'message' in body
                ? String(body.message)
                : typeof body === 'object' && body && 'msg' in body
                    ? String(body.msg)
                    : typeof body === 'object' && body && 'error_description' in body
                        ? String(body.error_description)
                        : typeof body === 'object' && body && 'error' in body
                            ? String(body.error)
                            : typeof body === 'string' && body
                                ? body
                                : fallbackMessage;

        throw createHttpRequestError(
            response.status === 401 ? 401 : response.status === 403 ? 403 : 502,
            response.status === 401
                ? '관리자 인증이 만료되었거나 올바르지 않습니다.'
                : fallbackMessage,
            `${fallbackMessage}: ${detail}`
        );
    }

    return body;
};

const fetchSupabaseTable = async (table, query) =>
    fetchSupabaseJson({
        path: `/rest/v1/${table}?${query}`,
        fallbackMessage: `${table} 조회에 실패했습니다.`,
    });

const mapSupabaseRoleToLegacyRole = (roleCode) => {
    const normalized = normalizeLower(roleCode);
    return SUPABASE_ROLE_TO_LEGACY_ROLE[normalized] || normalized || 'staff';
};

const parseBearerToken = (req) => {
    const authHeader = normalizeText(req.headers.authorization);
    if (!authHeader.startsWith('Bearer ')) {
        throw createHttpRequestError(401, '관리자 인증이 필요합니다.', 'Missing bearer token.');
    }

    const token = normalizeText(authHeader.slice(7));
    if (!token) {
        throw createHttpRequestError(401, '관리자 인증이 필요합니다.', 'Empty bearer token.');
    }

    return token;
};

const resolveLegacyBranchId = async ({ branchId, branchCode }) => {
    const normalizedBranchId = normalizeText(branchId);
    const normalizedBranchCode = normalizeText(branchCode);
    const db = admin.firestore();

    for (const candidate of [normalizedBranchId, normalizedBranchCode]) {
        if (!candidate) continue;

        const [locationSnap, branchSnap] = await Promise.all([
            db.collection('locations').doc(candidate).get(),
            db.collection('branches').doc(candidate).get(),
        ]);

        if (locationSnap.exists) {
            return locationSnap.id;
        }
        if (branchSnap.exists) {
            return branchSnap.id;
        }
    }

    if (normalizedBranchCode) {
        const querySnapshots = await Promise.all([
            db.collection('locations').where('shortCode', '==', normalizedBranchCode).limit(1).get(),
            db.collection('locations').where('branchCode', '==', normalizedBranchCode).limit(1).get(),
            db.collection('branches').where('branchCode', '==', normalizedBranchCode).limit(1).get(),
            db.collection('branches').where('branch_code', '==', normalizedBranchCode).limit(1).get(),
        ]);

        for (const snapshot of querySnapshots) {
            if (!snapshot.empty) {
                return snapshot.docs[0].id;
            }
        }
    }

    return normalizedBranchId || normalizedBranchCode;
};

const loadSupabaseAdminContextFromAccessToken = async (accessToken) => {
    const user = await fetchSupabaseJson({
        path: '/auth/v1/user',
        accessToken,
        fallbackMessage: 'Supabase 관리자 인증 조회에 실패했습니다.',
    });
    const userId = normalizeText(user?.id);

    if (!userId) {
        throw createHttpRequestError(401, '관리자 인증이 만료되었거나 올바르지 않습니다.', 'Supabase auth user response is missing id.');
    }

    const employees = await fetchSupabaseTable(
        'employees',
        `select=id,name,email,job_title,employment_status,employee_code,profile_id&profile_id=eq.${encodeURIComponent(userId)}&limit=1`
    );
    const employee = Array.isArray(employees) ? employees[0] : null;

    if (!employee?.id) {
        throw createHttpRequestError(403, '관리자 권한이 필요합니다.', `Missing employee row for profile ${userId}.`);
    }

    if (normalizeLower(employee.employment_status) && normalizeLower(employee.employment_status) !== 'active') {
        throw createHttpRequestError(403, '비활성화된 관리자 계정입니다.', `Inactive employee attempted access: ${employee.id}`);
    }

    const [employeeRoles, assignments] = await Promise.all([
        fetchSupabaseTable(
            'employee_roles',
            `select=role_id,is_primary&employee_id=eq.${encodeURIComponent(employee.id)}&order=is_primary.desc&limit=20`
        ),
        fetchSupabaseTable(
            'employee_branch_assignments',
            `select=branch_id,is_primary&employee_id=eq.${encodeURIComponent(employee.id)}&order=is_primary.desc&limit=20`
        ),
    ]);

    const roleIds = Array.from(new Set(
        (Array.isArray(employeeRoles) ? employeeRoles : [])
            .map((entry) => normalizeText(entry?.role_id))
            .filter(Boolean)
    ));
    const branchIds = Array.from(new Set(
        (Array.isArray(assignments) ? assignments : [])
            .map((entry) => normalizeText(entry?.branch_id))
            .filter(Boolean)
    ));

    const [roles, branches] = await Promise.all([
        roleIds.length > 0
            ? fetchSupabaseTable(
                'roles',
                `select=id,code,name&id=in.(${roleIds.map((id) => encodeURIComponent(id)).join(',')})`
            )
            : [],
        branchIds.length > 0
            ? fetchSupabaseTable(
                'branches',
                `select=id,branch_code,name&id=in.(${branchIds.map((id) => encodeURIComponent(id)).join(',')})`
            )
            : [],
    ]);

    const roleMap = new Map((Array.isArray(roles) ? roles : []).map((role) => [normalizeText(role.id), role]));
    const branchMap = new Map((Array.isArray(branches) ? branches : []).map((branch) => [normalizeText(branch.id), branch]));
    const primaryRoleLink = (Array.isArray(employeeRoles) ? employeeRoles : []).find((entry) => entry?.is_primary) || (Array.isArray(employeeRoles) ? employeeRoles[0] : null);
    const primaryBranchLink = (Array.isArray(assignments) ? assignments : []).find((entry) => entry?.is_primary) || (Array.isArray(assignments) ? assignments[0] : null);
    const primaryRole = roleMap.get(normalizeText(primaryRoleLink?.role_id));
    const primaryBranch = branchMap.get(normalizeText(primaryBranchLink?.branch_id));
    const legacyRole = mapSupabaseRoleToLegacyRole(primaryRole?.code);
    const branchCode = normalizeText(primaryBranch?.branch_code);
    const legacyBranchId = await resolveLegacyBranchId({
        branchId: primaryBranch?.id,
        branchCode,
    });

    if (!ADMIN_ROLES.has(legacyRole)) {
        throw createHttpRequestError(403, '관리자 권한이 필요합니다.', `Role ${legacyRole || 'unknown'} is not allowed.`);
    }

    return {
        uid: userId,
        provider: 'supabase',
        adminContext: {
            id: employee.id,
            name: normalizeText(employee.name) || normalizeText(user?.email),
            email: normalizeText(employee.email) || normalizeText(user?.email),
            loginId: normalizeText(employee.employee_code) || normalizeText(employee.email) || normalizeText(user?.email),
            role: legacyRole,
            branchId: legacyBranchId,
            branchCode,
            employeeId: employee.id,
            profileId: userId,
        },
    };
};

const authenticateHttpAdminRequest = async (req) => {
    const provider = normalizeLower(req.headers['x-admin-auth-provider']);
    const supabaseAccessToken = normalizeText(req.headers['x-supabase-access-token']);

    if (supabaseAccessToken || provider === 'supabase') {
        if (!supabaseAccessToken) {
            throw createHttpRequestError(401, '관리자 인증이 필요합니다.', 'Missing Supabase access token.');
        }
        return loadSupabaseAdminContextFromAccessToken(supabaseAccessToken);
    }

    const bearerToken = parseBearerToken(req);
    let decodedToken;

    try {
        decodedToken = await admin.auth().verifyIdToken(bearerToken);
    } catch (error) {
        throw createHttpRequestError(401, '관리자 인증이 만료되었거나 올바르지 않습니다.', `Firebase token verification failed: ${error.message}`);
    }

    const adminContext = await getAdminContext(decodedToken.uid);
    if (!adminContext) {
        throw createHttpRequestError(403, '관리자 권한이 필요합니다.', `Missing adminContext for uid ${decodedToken.uid}`);
    }

    return {
        uid: decodedToken.uid,
        provider: 'firebase',
        adminContext,
    };
};

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

const assertHqLevelAdmin = async (request) => {
    const { uid, adminContext } = await assertAdmin(request);
    if (!['super', 'hq'].includes(adminContext.role)) {
        throw new HttpsError('permission-denied', 'HQ admin access required.');
    }
    return { uid, adminContext };
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

// 4-1. Toss Payment Session
exports.createTossPaymentSession = onCall(async (request) => {
    const uid = assertAuthenticated(request);
    const payload = request.data && typeof request.data === 'object' ? request.data : {};

    return await createTossPaymentSession({
        admin,
        uid,
        bookingInput: payload.booking,
    });
});

exports.confirmTossPayment = onCall(async (request) => {
    const uid = assertAuthenticated(request);
    const payload = request.data && typeof request.data === 'object' ? request.data : {};
    const paymentKey = typeof payload.paymentKey === 'string' ? payload.paymentKey.trim() : '';
    const orderId = typeof payload.orderId === 'string' ? payload.orderId.trim() : '';
    const amount = Number(payload.amount || 0);

    if (!paymentKey || !orderId || !Number.isFinite(amount) || amount < 0) {
        throw new HttpsError('invalid-argument', 'paymentKey, orderId, amount가 필요합니다.');
    }

    const secretKey = String(process.env.TOSS_PAYMENTS_SECRET_KEY || '').trim();
    if (!secretKey) {
        throw new HttpsError('failed-precondition', '토스페이먼츠 시크릿 키가 아직 설정되지 않았습니다.');
    }

    return await confirmTossPaymentSession({
        admin,
        uid,
        secretKey,
        paymentKey,
        orderId,
        amount,
    });
});

// 4-2. HR Admin Account Sync
exports.upsertAdminAccount = onCall(async (request) => {
    const { uid, adminContext } = await assertAdmin(request);
    const payload = request.data && typeof request.data === 'object' ? request.data : {};
    const adminInput = payload.admin && typeof payload.admin === 'object' ? payload.admin : null;

    if (!adminInput) {
        throw new HttpsError('invalid-argument', 'admin payload is required.');
    }

    try {
        return await upsertAdminAccount({
            firestore: admin.firestore(),
            actor: {
                uid,
                role: adminContext.role,
                name: adminContext.name || '',
                email: adminContext.email || '',
                loginId: adminContext.loginId || '',
                branchId: adminContext.branchId || '',
            },
            input: adminInput,
        });
    } catch (error) {
        console.error('[upsertAdminAccount] sync failed:', error);

        const candidateId =
            String(adminInput?.id || adminInput?.loginId || adminInput?.branchId || '').trim();
        if (candidateId) {
            try {
                const candidateRef = admin.firestore().collection('admins').doc(candidateId);
                const candidateSnap = await candidateRef.get();
                if (candidateSnap.exists) {
                    await candidateRef.set({
                        syncStatus: {
                            provider: 'supabase',
                            status: 'error',
                            lastError: typeof error?.message === 'string' ? error.message : '직원 계정 동기화에 실패했습니다.',
                            syncedAt: new Date().toISOString(),
                        },
                        updatedAt: new Date().toISOString(),
                        updatedBy: uid,
                        updatedByRole: adminContext.role || '',
                    }, { merge: true });
                }
            } catch (syncError) {
                console.error('[upsertAdminAccount] failed to persist sync error state:', syncError);
            }
        }

        if (error instanceof HttpsError) {
            throw error;
        }

        const message = typeof error?.message === 'string' ? error.message : '직원 계정 동기화에 실패했습니다.';
        throw new HttpsError('internal', message);
    }
});

exports.deleteAdminAccount = onCall(async (request) => {
    const { uid, adminContext } = await assertAdmin(request);
    const payload = request.data && typeof request.data === 'object' ? request.data : {};
    const adminId = typeof payload.adminId === 'string' ? payload.adminId.trim() : '';

    if (!adminId) {
        throw new HttpsError('invalid-argument', 'adminId is required.');
    }

    try {
        return await deleteAdminAccount({
            firestore: admin.firestore(),
            actor: {
                uid,
                role: adminContext.role,
                name: adminContext.name || '',
                email: adminContext.email || '',
                loginId: adminContext.loginId || '',
                branchId: adminContext.branchId || '',
            },
            adminId,
        });
    } catch (error) {
        console.error('[deleteAdminAccount] sync failed:', error);

        if (error instanceof HttpsError) {
            throw error;
        }

        const message = typeof error?.message === 'string' ? error.message : '직원 삭제 동기화에 실패했습니다.';
        throw new HttpsError('internal', message);
    }
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
    const getIdentifiers = (docId, data) => {
        const inferredRole = inferRole(docId, data);
        const allowBranchIdLogin = Boolean(data?.branchId) && !['super', 'hq', 'finance', 'cs'].includes(inferredRole);

        return new Set([
            docId,
            data?.name,
            data?.loginId,
            data?.email,
            allowBranchIdLogin ? data?.branchId : ''
        ].map(normalize).filter(Boolean));
    };
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
    const rawInputName = String(name || '').trim();
    const exactLookupCandidates = Array.from(new Set([
        rawInputName,
        rawInputName.toLowerCase(),
        rawInputName.toUpperCase()
    ].filter(Boolean)));

    try {
        const db = admin.firestore();

        console.log(`[AdminVerify] Attempting login for: ${name} (Normalized: ${inputName})`);

        const fastLookups = await Promise.allSettled([
            ...exactLookupCandidates.map((candidate) => db.collection('admins').doc(candidate).get()),
            db.collection('admins').where('loginId', '==', rawInputName).limit(5).get(),
            db.collection('admins').where('email', '==', rawInputName).limit(5).get(),
            db.collection('admins').where('name', '==', rawInputName).limit(5).get(),
            db.collection('admins').where('branchId', '==', rawInputName.toUpperCase()).limit(5).get(),
        ]);

        const candidateDocsById = new Map();
        for (const result of fastLookups) {
            if (result.status !== 'fulfilled') continue;
            const value = result.value;

            if (typeof value.exists === 'boolean') {
                if (value.exists) {
                    candidateDocsById.set(value.id, value);
                }
                continue;
            }

            if (Array.isArray(value.docs)) {
                value.docs.forEach((doc) => candidateDocsById.set(doc.id, doc));
            }
        }

        let allAdminDocs = [...candidateDocsById.values()];
        let hasCredentialedAdmin = allAdminDocs.some((doc) => hasPassword(doc.data()));
        let matchingDocs = allAdminDocs
            .filter((doc) => getIdentifiers(doc.id, doc.data()).has(inputName))
            .sort(sortAdminDocs);
        let adminDoc = matchingDocs.find((doc) => String(doc.data().password || '').trim() === inputPassword) || null;

        if (!adminDoc) {
            const allAdminsSnap = await db.collection('admins').get();
            allAdminDocs = [...allAdminsSnap.docs];
            hasCredentialedAdmin = allAdminDocs.some((doc) => hasPassword(doc.data()));
            matchingDocs = allAdminDocs
                .filter((doc) => getIdentifiers(doc.id, doc.data()).has(inputName))
                .sort(sortAdminDocs);
            adminDoc = matchingDocs.find((doc) => String(doc.data().password || '').trim() === inputPassword) || null;
        }

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
        const webhook = String(process.env.GOOGLE_CHAT_WEBHOOK_URL || '').trim();
        if (!webhook) {
            return res.status(503).send('GOOGLE_CHAT_WEBHOOK_URL is not configured');
        }

        const displayRole = role === 'user' ? `👤 ${senderName || 'Guest'}` : '🐝 BeeBot';
        const payload = { text: `*${displayRole}*: ${text}`, thread: { threadKey: sessionId } };

        await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        return res.status(200).send('Sent');
    } catch (e) {
        return res.status(500).send(e.message);
    }
});

exports.sendBookingVoucherEmail = onRequest({ secrets: MAILER_SECRETS }, async (req, res) => {
    if (req.method === 'OPTIONS') {
        return sendJson(res, 200, { ok: true });
    }
    if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'method-not-allowed' });
    }
    if (!mailSecretMatches(req.headers['x-beeliber-mail-key'])) {
        return sendJson(res, 401, { error: 'unauthorized' });
    }

    const booking = req.body?.record || req.body?.booking || req.body || {};
    const userEmail = normalizeText(booking.user_email || booking.userEmail);
    if (!userEmail) {
        return sendJson(res, 400, { error: 'missing_email' });
    }

    const code = normalizeText(booking.reservation_code || booking.reservationCode || booking.id);

    try {
        await sendMail({
            to: userEmail,
            bcc: 'bee@bee-liber.com',
            subject: `[Beeliber] 예약 확정 바우처 (${code})`,
            html: buildVoucherEmailHtml(booking),
        });
        return sendJson(res, 200, { success: true, to: userEmail, code });
    } catch (error) {
        console.error('[sendBookingVoucherEmail] failed:', error);
        return sendJson(res, 500, {
            error: 'mail_failed',
            message: error instanceof Error ? error.message : String(error),
        });
    }
});

exports.sendBookingArrivalEmail = onRequest({ secrets: MAILER_SECRETS }, async (req, res) => {
    if (req.method === 'OPTIONS') {
        return sendJson(res, 200, { ok: true });
    }
    if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'method-not-allowed' });
    }
    if (!mailSecretMatches(req.headers['x-beeliber-mail-key'])) {
        return sendJson(res, 401, { error: 'unauthorized' });
    }

    const booking = req.body?.record || req.body?.booking || req.body || {};
    const userEmail = normalizeText(booking.user_email || booking.userEmail);
    if (!userEmail) {
        return sendJson(res, 400, { error: 'missing_email' });
    }

    const code = normalizeText(booking.reservation_code || booking.reservationCode || booking.id);

    try {
        await sendMail({
            to: userEmail,
            bcc: 'bee@bee-liber.com',
            subject: `[Beeliber] 짐이 도착했습니다 (${code})`,
            html: buildArrivalEmailHtml(booking),
        });
        return sendJson(res, 200, { success: true, to: userEmail, code });
    } catch (error) {
        console.error('[sendBookingArrivalEmail] failed:', error);
        return sendJson(res, 500, {
            error: 'mail_failed',
            message: error instanceof Error ? error.message : String(error),
        });
    }
});

// 6-1. Supabase Signed Upload URL Issuer (Draft)
exports.issueSupabaseSignedUpload = onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Supabase-Access-Token, X-Admin-Auth-Provider');

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    try {
        const response = await handleSignedUploadRequest({
            req,
            authenticateAdminRequest: authenticateHttpAdminRequest
        });
        return res.status(200).json(response);
    } catch (error) {
        if (isSignedUploadHttpError(error)) {
            console.warn('[issueSupabaseSignedUpload]', error.logMessage);
            return res.status(error.status).json({ message: error.message });
        }

        console.error('[issueSupabaseSignedUpload] unexpected error:', error);
        return res.status(500).json({ message: 'signed upload URL 발급에 실패했습니다.' });
    }
});

exports.syncSupabaseAdminAccount = onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Supabase-Access-Token, X-Admin-Auth-Provider');

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    if (!['POST', 'DELETE'].includes(req.method)) {
        return res.status(405).json({ message: 'POST 또는 DELETE 요청만 허용됩니다.' });
    }

    try {
        const { uid, adminContext } = await authenticateHttpAdminRequest(req);
        const actor = {
            uid,
            role: adminContext.role,
            name: adminContext.name || '',
            email: adminContext.email || '',
            loginId: adminContext.loginId || '',
            branchId: adminContext.branchId || '',
            branchCode: adminContext.branchCode || '',
        };

        if (req.method === 'POST') {
            const adminInput = req.body && typeof req.body === 'object' ? req.body.admin : null;
            if (!adminInput || typeof adminInput !== 'object') {
                return res.status(400).json({ message: 'admin payload is required.' });
            }

            const result = await upsertAdminAccount({
                firestore: admin.firestore(),
                actor,
                input: adminInput,
            });
            return res.status(200).json(result);
        }

        const adminId = normalizeText(req.body?.adminId || req.query?.adminId);
        if (!adminId) {
            return res.status(400).json({ message: 'adminId is required.' });
        }

        const result = await deleteAdminAccount({
            firestore: admin.firestore(),
            actor,
            adminId,
        });
        return res.status(200).json(result);
    } catch (error) {
        const status = Number(error?.status || 0);
        const message = typeof error?.message === 'string'
            ? error.message
            : '관리자 계정 동기화에 실패했습니다.';

        if ([400, 401, 403, 404, 503].includes(status)) {
            console.warn('[syncSupabaseAdminAccount]', error?.logMessage || message);
            return res.status(status).json({ message });
        }

        console.error('[syncSupabaseAdminAccount] unexpected error:', error);
        return res.status(500).json({ message: '관리자 계정 동기화에 실패했습니다.' });
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
                const serverPrice = calculateBookingStoragePrice(
                    start,
                    end,
                    booking.bagSizes || {},
                    booking.language,
                    { businessHours: booking.pickupLoc?.businessHours || booking.returnLoc?.businessHours }
                );
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

            // 주간 네임택 번호 생성 (1~100 순환, 매주 월요일 KST 기준 초기화) 💅
            const nowKST = new Date();
            nowKST.setHours(nowKST.getHours() + 9);
            const dayOfWeek = nowKST.getDay() === 0 ? 7 : nowKST.getDay(); // 1(Mon) to 7(Sun)
            const weekStartKST = new Date(nowKST);
            weekStartKST.setDate(nowKST.getDate() - dayOfWeek + 1);
            const weekId = `${weekStartKST.getFullYear()}-${String(weekStartKST.getMonth() + 1).padStart(2, '0')}-${String(weekStartKST.getDate()).padStart(2, '0')}`;
            
            const counterRef = db.collection('counters').doc('nametags');
            let nametagNumber = 1;
            
            try {
                await db.runTransaction(async (t) => {
                    const doc = await t.get(counterRef);
                    let data = doc.exists ? doc.data() : { weekId: "", current: 0 };
                    
                    if (data.weekId !== weekId) {
                        data.weekId = weekId;
                        data.current = 1;
                    } else {
                        data.current = (data.current % 100) + 1;
                    }
                    
                    nametagNumber = data.current;
                    t.set(counterRef, data);
                });
            } catch (e) {
                console.warn('[onBookingCreated] Failed to generate nametag number:', e.message);
                nametagNumber = Math.floor(Math.random() * 100) + 1; // Fallback
            }

            await event.data.ref.update({
                finalPrice,
                reservationCode: booking.reservationCode || reservationCode,
                status: '접수완료',
                nametagNumber
            });

            // Re-fetch updated booking for email/chat
            booking.reservationCode = reservationCode;
            booking.finalPrice = finalPrice;
            booking.status = '접수완료';
            booking.nametagNumber = nametagNumber;
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
        const webhook = String(process.env.GOOGLE_CHAT_WEBHOOK_URL || '').trim();
        if (!webhook) {
            console.warn('[onBookingCreated] GOOGLE_CHAT_WEBHOOK_URL is not configured.');
            return;
        }

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
