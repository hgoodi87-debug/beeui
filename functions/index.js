const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const QRCode = require("qrcode");

// Explicitly set project ID for environments where it might not be auto-detected
const projectId = "beeliber-main";
admin.initializeApp({
    projectId: projectId
});

console.log(`Functions starting up for project: ${projectId} 💅`);

// Configure Transporter
// TODO: User must replace this with an App Password
const SMTP_USER = "ceo@bee-liber.com";
const SMTP_PASS = "labi qzqv qaxh nxgk";
const ADMIN_EMAIL = "bee@bee-liber.com";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

// Helper: Simple Translations
const getTranslations = (lang) => {
    const l = lang || 'ko';
    const isKo = l === 'ko';
    const isJa = l === 'ja';
    const isZh = l === 'zh';

    return {
        voucherSubject: isKo ? '예약 확정 바우처' : (isJa ? '予約確定バウチャー' : (isZh ? '预订确认凭证' : 'Booking Confirmation Voucher')),
        arrivalSubject: isKo ? '목적지 도착 완료' : (isJa ? '目的地到着完了' : (isZh ? '行李已到达目的地' : 'Arrival at Destination')),
        arrivalTitle: isKo ? '짐이 도착했습니다!' : (isJa ? '荷物が到着しました！' : (isZh ? '行李已送达！' : 'Your bags have arrived!')),
        arrivalDesc: isKo ? '고객님의 소중한 짐이 목적지에 안전하게 도착하였습니다.<br/>짐을 찾으실 때 직원에게 바우처(QR)를 제시해주세요.' :
            (isJa ? 'お客様の大切な荷물이目的地に無事到着しました。<br/>荷物を受け取られる際、スタッフにバウチャー(QR)をご提示ください。' :
                (isZh ? '您的贵重行李已安全送达目的地。<br/>领取行李时，请向工作人员出示凭证(QR码)。' :
                    'Your luggage has arrived safely at the destination.<br/>Please present your voucher (QR) to the staff when picking up.')),
        detailsTitle: isKo ? '상세 정보' : (isJa ? '詳細情報' : (isZh ? '详细信息' : 'Details')),
        mapBtn: isKo ? '지도에서 위치 보기' : (isJa ? '地図で場所を確認' : (isZh ? '在地图上查看' : 'View on Map')),
        pickupGuideTitle: isKo ? '상세 수령 안내' : (isJa ? '受け取り詳細案内' : (isZh ? '领取详细指南' : 'Pickup Instructions')),
        thanks: isKo ? '감사합니다. 즐거운 여행 되세요! 🐝' : (isJa ? 'ありがとうございます。良い旅を！ 🐝' : (isZh ? '谢谢。祝您旅途愉快！ 🐝' : 'Thank you. Have a great trip! 🐝')),
        refundSubject: isKo ? '[Beeliber] 반품/환불 처리가 완료되었습니다' : (isJa ? '[Beeliber] 返品・返金処理が完了しました' : (isZh ? '[Beeliber] 退货/退款处理已完成' : '[Beeliber] Return/Refund Processed')),
        refundTitle: isKo ? '반품(환불) 완료 안내' : (isJa ? '返品（返金）完了の案内' : (isZh ? '退货（退款）完成通知' : 'Return/Refund Confirmation')),
        greeting: isKo ? '안녕하세요' : (isJa ? 'こんにちは' : (isZh ? '你好' : 'Hello')),
        refundDesc: isKo ? '고객님의 요청에 따라 반품 및 환불 처리가 완료되었습니다.' : (isJa ? 'お客様の要請に従い、返品および返金処理が完了しました。' : (isZh ? '根据您的请求，退货及退款处理已完成。' : 'Your return/refund request has been processed successfully.')),
        refundNote: isKo ? '카드사 사정에 따라 실제 환불까지 영업일 기준 3~5일이 소요될 수 있습니다.' : (isJa ? 'カード会社の事情により、実際の返金まで営業日基準で3〜5日かかる場合があります。' : (isZh ? '视卡片公司情况而定，实际退款可能需要 3-5 个工作日。' : 'Please allow 3-5 business days for the refund to appear on your statement.')),
        statusLabel: isKo ? '처리 상태' : (isJa ? '処理状態' : (isZh ? '处理状态' : 'Status')),
        refundAmountLabel: isKo ? '환불 금액' : (isJa ? '返金金額' : (isZh ? '退款金额' : 'Refund Amount')),

        // Additional Labels
        routeLabel: isKo ? '배송 경로' : (isJa ? '配送ルート' : (isZh ? '配送路线' : 'Route')),
        nameLabel: isKo ? '이름' : (isJa ? '氏名' : (isZh ? '姓名' : 'Name')),
        departureLabel: isKo ? '출발지 정보' : (isJa ? '出発地情報' : (isZh ? '出发地信息' : 'Departure Info')),
        arrivalLabel: isKo ? '도착지 정보' : (isJa ? '到着地情報' : (isZh ? '目的地信息' : 'Arrival Info')),
        addressLabel: isKo ? '주소' : (isJa ? '住所' : (isZh ? '地址' : 'Address')),
        pickupTimeLabel: isKo ? '수령 시간' : (isJa ? '受け取り時間' : (isZh ? '领取时间' : 'Pickup Time')),
        arrivalTimeLabel: isKo ? '도착 시간' : (isJa ? '到着時間' : (isZh ? '送达时间' : 'Arrival Time')),
        bagsLabel: isKo ? '가방' : (isJa ? '荷物' : (isZh ? '行李' : 'Bags')),
        paymentLabel: isKo ? '결제 금액' : (isJa ? '決済金額' : (isZh ? '支付金额' : 'Total Payment')),
        footerNote: isKo ? '본 바우처를 서비스 지점 직원에게 제시해주시기 바랍니다.' : (isJa ? 'このバウチャーをサービス地点のスタッフにご提示ください。' : (isZh ? '请向服务点工作人员出示此凭证。' : 'Please show this voucher to the Beeliber staff.')),
        mapDeparture: isKo ? '출발지 지도' : (isJa ? '出発地地図' : (isZh ? '出发地地图' : 'Departure Map')),
        mapArrival: isKo ? '도착지 지도' : (isJa ? '目的地地図' : (isZh ? '目的地地图' : 'Arrival Map')),
        branchStore: isKo ? '지점 수령' : (isJa ? '支店受け取り' : (isZh ? '分店领取' : 'Branch Pickup')),
        storageLabel: isKo ? '보관' : (isJa ? '保管' : (isZh ? '保管' : 'Storage')),
        voucherLabel: isKo ? '바우처' : (isJa ? 'バウチャー' : (isZh ? '凭证' : 'Voucher')),
        snsIdLabel: isKo ? 'SNS ID' : (isJa ? 'SNS ID' : (isZh ? 'SNS ID' : 'SNS ID')),
        infoLabel: isKo ? '정보' : (isJa ? '情報' : (isZh ? '信息' : 'Info')),
        timeLabel: isKo ? '시간' : (isJa ? '時間' : (isZh ? '时间' : 'Time')),
        agreeHighValueLabel: isKo ? '고가 물품 관리 정책 동의' : (isJa ? '高価品管理政策への同意' : (isZh ? '高价物品管理政策同意' : 'Agreement to High Value Items Policy')),
        agreedCompleted: isKo ? '동의 완료' : (isJa ? '同意済み' : (isZh ? '已同意' : 'Agreed'))
    };
};

// Helper Function: Get Location Data from Firestore
async function getLocationData(id) {
    if (!id) return null;
    try {
        const snap = await admin.firestore().collection('locations').doc(id).get();
        return snap.exists ? snap.data() : null;
    } catch (e) {
        console.error("Error fetching location data:", e);
        return null;
    }
}

// Helper: Generate Map Link
function getMapLink(lat, lng) {
    if (!lat || !lng) return "#";
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

// Helper Function: Send Voucher Email
async function processVoucherEmail(bookingId, booking) {
    const userEmail = booking.userEmail;
    const lang = (booking.language || 'ko').split('-')[0]; // 'ko-KR' -> 'ko'

    if (!userEmail) {
        console.log("No user email found for booking:", bookingId);
        throw new Error("No user email");
    }

    const t = getTranslations(lang);

    // Fetch Destination Data for Pickup Info
    const destLoc = await getLocationData(booking.dropoffLocation);
    const pickupLoc = await getLocationData(booking.pickupLocation);

    // 💅 Improved localized name helper
    const getLocName = (locData, fallbackId) => {
        if (!locData) {
            // Hardcoded fallback for known branches if DB is missing
            const fallbackMap = {
                'IN1T': { ko: '인천공항 T1', en: 'Incheon Airport T1', ja: '仁川空港 T1', zh: '仁川机场 T1' },
                'IN2T': { ko: '인천공항 T2', en: 'Incheon Airport T2', ja: '仁川空港 T2', zh: '仁川机场 T2' },
                'GMP': { ko: '김포공항', en: 'Gimpo Airport', ja: '金浦空港', zh: '金浦机场' },
                'MYN': { ko: '연남점 (머니박스)', en: 'Yeonnam Branch', ja: '延南店', zh: '延南店' },
                'HBO': { ko: '홍대 바오점', en: 'Hongdae Bao Branch', ja: '弘大バオ店', zh: '弘大Bao店' }
            };
            const fb = fallbackMap[fallbackId];
            if (fb) return fb[lang] || fb['en'];
            return fallbackId || "";
        }

        const n = lang === 'ko' ? locData.name :
            (lang === 'ja' ? (locData.name_ja || locData.name_en || locData.name) :
                (lang === 'zh' ? (locData.name_zh || locData.name_en || locData.name) :
                    (locData.name_en || locData.name)));
        return n || fallbackId || "";
    };

    const pickupBranchName = getLocName(pickupLoc, booking.pickupLocation);
    const destBranchName = getLocName(destLoc, booking.dropoffLocation || booking.destinationLocation);

    const pickupGuide = pickupLoc?.pickupGuide || (lang === 'ko' ? "지점 카운터에서 빌리버 서비스를 말씀해주세요." : "Please mention Beeliber at the counter.");
    const pickupImageUrl = pickupLoc?.pickupImageUrl || "";

    // 💅 Use reservationCode if available, fallback to bookingId
    const displayedCode = booking.reservationCode || bookingId;

    console.log(`Processing voucher for ${displayedCode} (ID: ${bookingId}) to ${userEmail} (${lang})`);

    // QR Code content: URL to admin status management
    const qrText = `https://beeliber-main.web.app/admin?scan=${bookingId}`;
    const qrBuffer = await QRCode.toBuffer(qrText, { margin: 1, width: 400 });

    const mailOptions = {
        from: `"Beeliber Support" <${SMTP_USER}>`,
        to: userEmail,
        bcc: ADMIN_EMAIL,
        subject: `[Beeliber] ${t.voucherSubject} (${displayedCode})`,
        attachments: [
            {
                filename: 'qrcode.png',
                content: qrBuffer,
                cid: 'qrcode'
            }
        ],
        html: `
        <!DOCTYPE html>
        <html lang="${lang}">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
            <div style="width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px;">
                <div style="width: 100%; max-width: 600px; margin: 40px auto 0; background-color: #ffffff; border-radius: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.05); overflow: hidden;">
                    <div style="background-color: #1a1a1a; padding: 40px 20px; text-align: center;">
                        <div style="font-size: 32px; font-weight: 900; color: #ffcb05; letter-spacing: -1.5px; font-style: italic;">bee<span style="color: #ffffff; font-style: normal;">liber</span></div>
                    </div>
                    
                    <div style="padding: 30px 20px; text-align: center;">
                        <div style="display: inline-block; background-color: #ffcb05; color: #1a1a1a; padding: 8px 20px; border-radius: 100px; font-size: 13px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 0.05em;">${t.voucherLabel} CONFIRMED</div>
                        
                        <div style="background: #1a1a1a; border-radius: 20px; padding: 25px; margin-bottom: 30px; color: #ffffff;">
                            <div style="font-size: 11px; font-weight: 900; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">DELIVERY CODE</div>
                            <div style="font-size: 28px; font-weight: 900; color: #ffcb05; letter-spacing: 0.05em; word-break: break-all;">${displayedCode}</div>
                        </div>

                        <div style="margin-bottom: 35px;">
                            <img src="cid:qrcode" style="width: 180px; height: 180px; border-radius: 24px; padding: 15px; background: #ffffff; border: 1.5px solid #f1f5f9; box-shadow: 0 10px 25px rgba(0,0,0,0.03);" alt="Scan QR" />
                            <p style="font-size: 12px; color: #64748b; font-weight: 700; margin-top: 15px;">${t.footerNote}</p>
                        </div>

                        <div style="background: #ffffff; border: 1.5px solid #f1f5f9; border-radius: 32px; padding: 25px; text-align: left;">
                            <div style="font-size: 15px; font-weight: 900; color: #1a1a1a; margin-bottom: 20px; display: flex; align-items: center;">${t.detailsTitle}</div>
                            
                            <!-- Pickup -->
                            <div style="padding-left: 25px; margin-bottom: 25px; border-left: 3px solid #ffcb05;">
                                <span style="font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; display: block;">${t.departureLabel}</span>
                                <span style="font-size: 18px; font-weight: 900; color: #1a1a1a; line-height: 1.3;">${pickupBranchName} <span style="font-size: 9px; font-weight: 900; background: #f1f5f9; color: #64748b; padding: 2px 6px; border-radius: 4px; margin-left: 6px; vertical-align: middle;">${pickupLoc?.shortCode || booking.pickupLocation}</span></span>
                                <span style="font-size: 13px; font-weight: 700; color: #64748b; margin-top: 6px; display: block;">🕒 ${booking.pickupDate} | ${booking.pickupTime}</span>
                            </div>

                            <!-- Dropoff -->
                            <div style="padding-left: 25px; margin-bottom: 5px; border-left: 3px solid #e2e8f0;">
                                <span style="font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; display: block;">${t.arrivalLabel}</span>
                                <span style="font-size: 18px; font-weight: 900; color: #1a1a1a; line-height: 1.3;">
                                    ${destBranchName || booking.dropoffLocation || booking.destinationLocation || (booking.serviceType === 'STORAGE' ? t.storageLabel : 'Address Specified')}
                                    ${destLoc ? `<span style="font-size: 9px; font-weight: 900; background: #f1f5f9; color: #64748b; padding: 2px 6px; border-radius: 4px; margin-left: 6px; vertical-align: middle;">${destLoc.shortCode}</span>` : (booking.serviceType === 'DELIVERY' ? `<span style="font-size: 9px; font-weight: 900; background: #f1f5f9; color: #64748b; padding: 2px 6px; border-radius: 4px; margin-left: 6px; vertical-align: middle;">ADDR</span>` : '')}
                                </span>
                                <span style="font-size: 13px; font-weight: 700; color: #64748b; margin-top: 6px; display: block;">🏁 ${booking.dropoffDate || booking.returnDate || 'N/A'} | ${booking.deliveryTime || booking.returnTime || booking.pickupTime || 'N/A'}</span>
                            </div>

                            <div style="width: 100%; border-top: 1px dashed #e2e8f0; margin-top: 25px; padding-top: 25px;">
                                <div style="margin-bottom: 12px;">
                                    <span style="font-size: 12px; font-weight: 800; color: #94a3b8; display: inline-block; width: 45%;">${t.nameLabel}</span>
                                    <span style="font-size: 12px; font-weight: 800; color: #1a1a1a; display: inline-block; width: 50%; text-align: right;">${booking.userName}</span>
                                </div>
                                <div style="margin-bottom: 12px;">
                                    <span style="font-size: 12px; font-weight: 800; color: #94a3b8; display: inline-block; width: 45%;">${t.bagsLabel}</span>
                                    <span style="font-size: 12px; font-weight: 800; color: #1a1a1a; display: inline-block; width: 50%; text-align: right;">${booking.bags} EA (${Object.entries(booking.bagSizes || {}).filter(([_, c]) => c > 0).map(([s, c]) => `${s}:${c}`).join('/')})</span>
                                </div>
                                <div style="margin-top: 20px; padding-top: 20px; border-top: 1.5px solid #f1f5f9;">
                                    <span style="font-size: 14px; font-weight: 800; color: #1a1a1a; display: inline-block; width: 45%;">${t.paymentLabel}</span>
                                    <span style="font-size: 24px; font-weight: 950; color: #1a1a1a; display: inline-block; width: 50%; text-align: right;">₩${(booking.finalPrice || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        ${pickupBranchName && (pickupImageUrl || pickupGuide) ? `
                        <div style="margin-top: 30px; background: #fffbeb; border-radius: 24px; padding: 20px; border: 1px solid #fef3c7; text-align: left;">
                            <div style="font-size: 12px; font-weight: 900; color: #92400e; margin-bottom: 12px; text-transform: uppercase;">📍 ${pickupBranchName} ${lang === 'ko' ? '방문 안내' : 'Guide'}</div>
                            ${pickupImageUrl ? `<img src="${pickupImageUrl}" style="width: 100%; border-radius: 12px; margin-bottom: 15px;" alt="Guide" />` : ''}
                            <p style="font-size: 13px; color: #475569; line-height: 1.6; margin: 0; font-weight: 600;">${pickupGuide}</p>
                        </div>
                        ` : ''}


                        <a href="https://bee-liber.com/tracking?id=${bookingId}" style="display: inline-block; background: #ffcb05; color: #1a1a1a; padding: 16px 30px; border-radius: 16px; text-decoration: none; font-size: 14px; font-weight: 900; margin-top: 30px; box-shadow: 0 10px 20px rgba(255,203,5,0.2);">Track My Package</a>

                        <!-- 💅 Action Buttons -->
                        <div style="margin-top: 20px; text-align: center;">
                            <a href="https://bee-liber.com/tracking?id=${bookingId}&action=save-qr" 
                               style="display: inline-block; padding: 12px 20px; background-color: #ffffff; color: #1a1a1a; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 13px; border: 1.5px solid #e2e8f0; margin: 5px;">
                                📸 Save QR Image
                            </a>
                            <a href="https://bee-liber.com/tracking?id=${bookingId}&action=save-voucher" 
                               style="display: inline-block; padding: 12px 20px; background-color: #ffcb05; color: #1a1a1a; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 13px; margin: 5px;">
                                📄 Save Voucher
                            </a>
                        </div>

                        <!-- 💅 VIP Coupon -->
                        <div style="margin-top: 40px; background: linear-gradient(145deg, #1e293b, #0f172a); border-radius: 32px; padding: 30px; color: #ffffff; text-align: center; border: 1px solid #ffcb05;">
                            <div style="display: inline-block; background: #ffcb05; color: #1a1a1a; padding: 4px 12px; border-radius: 100px; font-size: 10px; font-weight: 950; text-transform: uppercase; margin-bottom: 20px;">Partner Benefit</div>
                            <div style="font-size: 20px; font-weight: 900; color: #ffcb05; font-style: italic; margin-bottom: 5px;">moneybox</div>
                            <div style="font-size: 18px; font-weight: 900; margin-bottom: 15px;">SPECIAL VIP COUPON</div>
                            <div style="font-size: 12px; font-weight: 700; color: #64748b; line-height: 1.6;">
                                Show this email at <b style="color: #ffffff;">Moneybox Yeonnam</b><br/>to get the best currency exchange rates!
                            </div>
                        </div>
                    </div>

                    <div style="padding: 40px 20px; text-align: center; color: #94a3b8; font-size: 11px; font-weight: 600;">
                        <p style="margin-bottom: 20px; letter-spacing: 0.3em; color: #ffcb05; font-weight: 900;">NO BAGS, JUST FREEDOM</p>
                        &copy; 2025 Beeliber Global Logistics.
                    </div>
                </div>
            </div>
        </body>
        </html>
    `,

    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", userEmail);
    return { success: true, email: userEmail };
}


// Trigger: On New Booking (Firestore)
exports.sendBookingVoucherFinal = functions.region("us-central1").firestore
    .document("bookings/{bookingId}")
    .onCreate(async (snap, context) => {
        const booking = snap.data();
        try {
            await processVoucherEmail(context.params.bookingId, booking);
        } catch (error) {
            console.error("Error in sendBookingVoucherFinal:", error);
        }

        // --- Enhanced Google Chat Notification ---
        try {
            console.log(`Starting Google Chat notification for booking: ${booking.id}`);
            const configSnap = await admin.firestore().collection('settings').doc('cloud_config').get();
            let webhook = configSnap.exists ? configSnap.data().googleChatWebhookUrl : null;

            // Hardcoded fallback
            if (!webhook) {
                webhook = 'https://chat.googleapis.com/v1/spaces/AAQAYv-uO-w/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=PvUyJgNn0B7fB4AYJ-TLq18cSTnl3qykj3YshKpj-_Y';
            }

            if (webhook) {
                const serviceLabel = booking.serviceType === 'DELIVERY' ? '📦 배송 (Delivery)' : '🔒 보관 (Storage)';
                const pickupLoc = await getLocationData(booking.pickupLocation);
                const dropoffLoc = await getLocationData(booking.dropoffLocation);

                const getLoc = (id, locData) => {
                    if (!locData) return id || 'N/A';
                    return `${locData.name} (${id})`;
                };

                const bookingUrl = `https://bee-liber.com/admin?scan=${booking.id}`;

                const textParts = [
                    `*🆕 새 예약 알림 (${booking.id})*`,
                    `──────────────────`,
                    `• *서비스*: ${serviceLabel}`,
                    `• *고객*: ${booking.userName || 'Unknown'} (${booking.userEmail || 'N/A'})`,
                    `• *SNS*: ${booking.snsChannel || 'N/A'} - ${booking.snsId || 'N/A'}`,
                    `• *출발/위치*: ${getLoc(booking.pickupLocation, pickupLoc)}`,
                    `• *날짜/시간*: ${booking.pickupDate} ${booking.pickupTime}`,
                    booking.serviceType === 'DELIVERY'
                        ? `• *도착*: ${getLoc(booking.dropoffLocation, dropoffLoc)} (${booking.deliveryTime})`
                        : `• *종료*: ${booking.dropoffDate} ${booking.deliveryTime}`,
                    `• *가방*: ${booking.bags || 0}개 (${Object.entries(booking.bagSizes || {}).filter(([_, c]) => c > 0).map(([s, c]) => `${s}:${c}`).join(', ')})`,
                    `• *금액*: ₩${(booking.finalPrice || 0).toLocaleString()}`,
                    `• *언어*: ${booking.language || 'ko'}`,
                    `──────────────────`,
                    `🔗 *관리자 링크*: <${bookingUrl}|직접 확인하기>`
                ];

                const text = textParts.join('\n');

                const response = await fetch(webhook, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });

                if (response.ok) {
                    console.log(`Google Chat notification sent for ${booking.id}`);
                } else {
                    const err = await response.text();
                    console.error(`Google Chat API error for ${booking.id}:`, err);
                }
            } else {
                console.warn("No Google Chat Webhook URL found (even fallback).");
            }
        } catch (notifierError) {
            console.error("Critical failure in Google Chat notifier:", notifierError);
        }
    });


// HTTPS Callable: Manual Resend (Triggered from Admin Dashboard)
// Helper Function: Send Arrival Email
async function processArrivalEmail(bookingId, booking) {
    const userEmail = booking?.userEmail;
    if (!userEmail) {
        console.log("No user email found for arrival notification");
        return;
    }

    // Fetch Destination Data for Pickup Info
    const destLoc = await getLocationData(booking.dropoffLocation);
    const pickupGuide = destLoc?.pickupGuide || "";
    const pickupImageUrl = destLoc?.pickupImageUrl || "";
    const pickupMapLink = getMapLink(destLoc?.lat, destLoc?.lng);

    // Use Firestore name if available, fallback to hardcoded list for common points, then ID
    const LOCATION_FALLBACKS = {
        'IN1T': '인천공항 T1 (Incheon T1)',
        'IN2T': '인천공항 T2 (Incheon T2)',
        'GMP': '김포공항 (Gimpo Airport)',
        'SST': '서울역 (Seoul Station)',
        'MYN': '연남점 (Yeonnam Branch)',
        'MYD': '명동점 (Myeongdong Branch)',
        'INS': '인사동점 (Insadong Branch)',
        'YS': '용산점 (Yongsan Branch)',
        'GN': '강남점 (Gangnam Branch)'
    };

    const getLoc = (id, locData) => locData?.name || LOCATION_FALLBACKS[id] || id;

    const lang = (booking.language || 'ko').split('-')[0];
    const t = getTranslations(lang);
    const safeDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US');
    };

    const mailOptions = {
        from: `"Beeliber Support" <${SMTP_USER}>`,
        to: userEmail,
        bcc: ADMIN_EMAIL,
        subject: `[Beeliber] ${t.arrivalSubject} (${t.bookingLabel}: ${bookingId})`,
        attachments: [],
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a;">
            <div style="padding: 40px 10px;">
                <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 48px; overflow: hidden; box-shadow: 0 40px 80px rgba(0,0,0,0.12); border: 1px solid rgba(0,0,0,0.05);">
                    <div style="background-color: #1a1a1a; padding: 60px 20px; text-align: center; border-bottom: 8px solid #ffcb05;">
                        <h1 style="font-size: 38px; font-weight: 900; color: #ffcb05; letter-spacing: -2px; margin: 0; font-style: italic;">bee<span style="color: #ffffff; font-style: normal;">liber</span></h1>
                    </div>
                    
                    <div style="padding: 50px 40px; text-align: center;">
                        <div style="width: 80px; height: 80px; background-color: #ffcb05; border-radius: 30px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 30px; font-size: 40px; color: #1a1a1a;">🚚</div>
                        <h2 style="font-size: 28px; font-weight: 900; color: #1a1a1a; margin-bottom: 15px; font-style: italic;">${t.arrivalTitle}</h2>
                        <div style="font-size: 15px; color: #64748b; line-height: 1.6; margin-bottom: 40px; font-weight: 600;">${t.arrivalDesc}</div>
 
                        <div style="text-align: left; background: #ffffff; border-radius: 32px; padding: 30px; border: 1.5px solid #f1f5f9;">
                            <div style="font-size: 12px; font-weight: 900; color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px; border-bottom: 2px solid #ffcb05; padding-bottom: 10px; display: inline-block;">${t.detailsTitle}</div>
                            <div style="margin-bottom: 20px;">
                                <span style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">${t.arrivalLabel}</span>
                                <span style="font-size: 16px; font-weight: 800; color: #1a1a1a;"><strong>${getLoc(booking.dropoffLocation, destLoc)}</strong></span>
                            </div>
                            <div style="margin-bottom: 20px;">
                                <span style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">${t.arrivalTimeLabel}</span>
                                <span style="font-size: 16px; font-weight: 800; color: #1a1a1a;"><span style="background: #1a1a1a; color: #ffcb05; padding: 4px 12px; border-radius: 8px; font-size: 13px; margin-top: 6px; display: inline-block;">🏁 ${safeDate(booking.dropoffDate)} | ${booking.deliveryTime || 'N/A'}</span></span>
                            </div>
                            <div style="margin-bottom: 0;">
                                <span style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">Reservation ID</span>
                                <span style="font-size: 16px; font-weight: 800; color: #1a1a1a;">${bookingId}</span>
                            </div>
                        </div>

                        <a href="${pickupMapLink}" style="display: block; background: #ffcb05; color: #1a1a1a; padding: 18px 20px; border-radius: 20px; font-size: 14px; font-weight: 900; text-decoration: none; text-align: center; margin-top: 40px; transition: all 0.3s;">📍 ${t.mapBtn}</a>

                        ${pickupGuide || pickupImageUrl ? `
                            <div style="margin-top: 40px; background: #f8fafc; border-radius: 32px; padding: 30px; text-align: left;">
                                <div style="font-size: 12px; font-weight: 900; color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 15px; display: inline-block;">📍 ${t.pickupGuideTitle}</div>
                                <div style="font-size: 14px; color: #475569; line-height: 1.6; font-weight: 800;">${pickupGuide}</div>
                                ${pickupImageUrl ? `<img src="${pickupImageUrl}" style="width: 100%; border-radius: 20px; margin-top: 20px; display: block; border: 1px solid #e2e8f0;" alt="Pickup Guide" />` : ""}
                            </div>
                        ` : ""}

                        <p style="font-size: 14px; color: #94a3b8; font-weight: 700; margin-top: 50px;">${t.thanks}</p>
                    </div>
                    
                    <div style="background: #1a1a1a; padding: 50px 30px; text-align: center; color: #ffffff;">
                        <div style="font-size: 12px; font-weight: 900; color: #ffcb05; text-transform: uppercase; letter-spacing: 0.4em;">NO BAGS, JUST FREEDOM</div>
                        <p style="font-size: 10px; color: #475569; margin-top: 25px;">&copy; 2025 Beeliber Global Logistics. All Rights Reserved.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Arrival email sent for booking ${bookingId}`);
}

// HTTPS Callable: Manual Resend (Triggered from Admin Dashboard)
exports.resendBookingVoucher = functions.region("us-central1").https.onCall(async (data, context) => {
    const bookingId = data.bookingId;
    if (!bookingId) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "bookingId".');
    }

    try {
        const bookingSnap = await admin.firestore().collection('bookings').doc(bookingId).get();
        if (!bookingSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'Booking not found');
        }

        const result = await processVoucherEmail(bookingId, bookingSnap.data());
        return result;
    } catch (error) {
        console.error("Error in resendBookingVoucher:", error);
        // Include more details in the error message for debugging
        throw new functions.https.HttpsError('internal', `[Firestore Error] ${error.message}`);
    }
});

// Trigger: On Booking Update (Detect Status Change to ARRIVED)
exports.handleBookingUpdate = functions.region("us-central1").firestore
    .document("bookings/{bookingId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        if (!after) return;
        // Check if status changed to '목적지도착'
        if (before?.status !== '목적지도착' && after.status === '목적지도착') {
            try {
                await processArrivalEmail(context.params.bookingId, after);
            } catch (error) {
                console.error("Error in handleBookingUpdate (Arrival Email):", error);
            }
        }
    });

// HTTPS Callable: Process Refund (Manual)
exports.processBookingRefund = functions.region("us-central1").https.onCall(async (data, context) => {
    const bookingId = data.bookingId;
    if (!bookingId) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "bookingId".');
    }

    try {
        const bookingRef = admin.firestore().collection('bookings').doc(bookingId);
        const bookingSnap = await bookingRef.get();

        if (!bookingSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'Booking not found');
        }

        const booking = bookingSnap.data();

        await bookingRef.update({
            status: '환불완료',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const userEmail = booking.userEmail;
        if (userEmail) {
            const t = getTranslations(booking.language);

            const mailOptions = {
                from: `"Beeliber Support" <${SMTP_USER}>`,
                to: userEmail,
                bcc: ADMIN_EMAIL,
                subject: `[Beeliber] ${t.refundSubject} (${bookingId})`,
                html: `
                <!DOCTYPE html>
                <html lang="${booking.language || 'ko'}">
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a;">
                    <div style="padding: 40px 10px;">
                        <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 48px; overflow: hidden; box-shadow: 0 40px 80px rgba(0,0,0,0.12); border: 1px solid rgba(0,0,0,0.05);">
                            <div style="background-color: #1a1a1a; padding: 60px 20px; text-align: center; border-bottom: 8px solid #ef4444;">
                                <h1 style="font-size: 38px; font-weight: 900; color: #ffffff; letter-spacing: -2px; margin: 0; font-style: italic;">bee<span style="color: #ef4444; font-style: normal;">liber</span></h1>
                            </div>
                            
                            <div style="padding: 50px 40px; text-align: center;">
                                <div style="width: 80px; height: 80px; background-color: #fee2e2; border-radius: 30px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 30px; font-size: 40px; color: #ef4444;">💸</div>
                                <h2 style="font-size: 28px; font-weight: 900; color: #1a1a1a; margin-bottom: 15px; font-style: italic;">${t.refundTitle}</h2>
                                <div style="font-size: 15px; color: #64748b; line-height: 1.6; margin-bottom: 40px; font-weight: 600;">
                                    ${t.greeting}, <strong>${booking.userName || 'Guest'}</strong><br/>
                                    ${t.refundDesc}<br/>
                                    <span style="font-size: 13px; color: #94a3b8;">${t.refundNote}</span>
                                </div>
                                
                                <div style="text-align: left; background: #ffffff; border-radius: 32px; padding: 30px; border: 1.5px solid #f1f5f9;">
                                    <div style="font-size: 12px; font-weight: 900; color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px; border-bottom: 2px solid #ef4444; padding-bottom: 10px; display: inline-block;">Refund Details</div>
                                    <div style="margin-bottom: 20px;">
                                        <span style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">${t.statusLabel}</span>
                                        <span style="font-size: 16px; font-weight: 800; color: #ef4444;">Refunded Successfully</span>
                                    </div>
                                    <div style="margin-bottom: 20px;">
                                        <span style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">${t.refundAmountLabel}</span>
                                        <span style="font-size: 24px; font-weight: 950; color: #ef4444; font-style: italic;">₩${(booking.finalPrice || 0).toLocaleString()}</span>
                                    </div>
                                    <div style="margin-bottom: 0;">
                                        <span style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">Reservation ID</span>
                                        <span style="font-size: 16px; font-weight: 800; color: #1a1a1a;">${bookingId}</span>
                                    </div>
                                </div>

                                <p style="font-size: 14px; color: #94a3b8; font-weight: 700; margin-top: 50px;">${t.thanks}</p>
                            </div>
                            
                            <div style="background: #1a1a1a; padding: 50px 30px; text-align: center; color: #ffffff;">
                                <div style="font-size: 12px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.4em;">NO BAGS, JUST FREEDOM</div>
                                <p style="font-size: 10px; color: #475569; margin-top: 25px;">&copy; 2025 Beeliber Global Logistics. All Rights Reserved.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                `,
            };
            await transporter.sendMail(mailOptions);
            console.log(`Refund email sent to ${userEmail}`);
        }
        return { success: true, message: 'Refund processed successfully' };
    } catch (error) {
        console.error("Error in processBookingRefund:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Partner API (REST)
 * 
 * Headers:
 * - x-api-key: The secret key for authentication
 * 
 * Routes:
 * - POST /v1/bookings: Create a new booking
 * - GET /v1/bookings/:id: Get booking status
 * - GET /v1/locations: List operative locations
 */
exports.partnerApi = functions.region("us-central1").https.onRequest(async (req, res) => {
    // 1. Basic Auth Check
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({ error: "Missing API Key" });
    }

    try {
        // Fetch valid keys from Firestore
        const keysSnap = await admin.firestore().collection('settings').doc('api_keys').get();
        const validKeys = keysSnap.exists ? keysSnap.data().partnerKeys || [] : [];

        if (!validKeys.includes(apiKey)) {
            return res.status(403).json({ error: "Invalid API Key" });
        }

        const pathParts = req.path.split('/').filter(p => p !== '');
        const version = pathParts[0]; // v1
        const resource = pathParts[1]; // bookings | locations
        const resourceId = pathParts[2]; // booking ID

        // --- Routing ---

        // GET /v1/locations
        if (req.method === 'GET' && resource === 'locations') {
            const locsSnap = await admin.firestore().collection('locations').get();
            const locs = locsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return res.status(200).json(locs);
        }

        // GET /v1/bookings/:id
        if (req.method === 'GET' && resource === 'bookings' && resourceId) {
            const bookingSnap = await admin.firestore().collection('bookings').doc(resourceId).get();
            if (!bookingSnap.exists) {
                return res.status(404).json({ error: "Booking not found" });
            }
            const data = bookingSnap.data();
            return res.status(200).json({
                id: resourceId,
                status: data.status,
                pickupDate: data.pickupDate,
                userName: data.userName,
                serviceType: data.serviceType
            });
        }

        // POST /v1/bookings
        if (req.method === 'POST' && resource === 'bookings') {
            const bookingData = req.body;
            if (!bookingData || Object.keys(bookingData).length === 0) {
                return res.status(400).json({ error: "Missing booking data" });
            }

            // Generate ID logic (minimal copy from StorageService logic)
            const snapshot = await admin.firestore().collection("bookings").get();
            const seq = snapshot.size + 1;
            const seqStr = String(seq).padStart(4, '0');
            const newId = `PARTNER-${Date.now().toString().slice(-4)}-${seqStr}`;

            const newBooking = {
                ...bookingData,
                id: newId,
                status: '접수완료',
                isDeleted: false,
                createdAt: new Date().toISOString(),
                source: 'partner_api'
            };

            await admin.firestore().collection('bookings').doc(newId).set(newBooking);
            return res.status(201).json({ id: newId, message: "Booking created successfully" });
        }

        return res.status(404).json({ error: "Endpoint not found or method not allowed" });

    } catch (error) {
        console.error("Partner API Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// HTTPS Function: Proxy for Google Chat Webhook (to avoid CORS)
exports.notifyGoogleChat = functions.region("us-central1").https.onRequest(async (req, res) => {
    // CORS adjustment
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        return res.status(204).send('');
    }

    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { text, sessionId, senderName, senderEmail, role } = req.body;

    try {
        const configSnap = await admin.firestore().collection('settings').doc('cloud_config').get();
        let webhook = configSnap.exists ? configSnap.data().googleChatWebhookUrl : null;

        // Hardcoded fallback
        if (!webhook) {
            webhook = 'https://chat.googleapis.com/v1/spaces/AAQAYv-uO-w/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=PvUyJgNn0B7fB4AYJ-TLq18cSTnl3qykj3YshKpj-_Y';
        }

        if (!webhook) {
            return res.status(400).send('Webhook URL not configured');
        }

        const { snsChannel, snsId } = req.body;
        const snsInfo = (snsChannel && snsId) ? `\n[${snsChannel}: ${snsId}]` : '';

        const displayRole = role === 'user' ? `👤 ${senderName || 'Customer'} (${senderEmail || 'N/A'})${snsInfo}` : '🤖 BeeBot';
        const payload = {
            text: `*${displayRole}*: ${text}`,
            thread: { threadKey: sessionId }
        };

        const response = await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Google Chat API Error:', errorText);
            return res.status(response.status).send(errorText);
        }

        return res.status(200).send('Notification sent');
    } catch (e) {
        console.error('Function execution error:', e);
        return res.status(500).send(e.message);
    }
});


// --- CLAUDE SUB-AGENT ---
const claudeAgent = require('./agent/claudeAgent');

exports.runClaudeAgent = functions.region("us-central1").runWith({
    timeoutSeconds: 540, // Extended timeout for long agent chains
    memory: "1GB"
}).https.onCall(async (data, context) => {
    // Optional: Add Auth Check
    // if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

    console.log("Starting Claude Agent with task:", data.task);
    return await claudeAgent.runAgent(data);
});

// --- SETTLEMENT ENGINE ---
// Trigger: On Booking Write (Calculate Commission)
exports.calculateCommission = functions.region("us-central1").firestore
    .document("bookings/{bookingId}")
    .onWrite(async (change, context) => {
        // Exit if document is deleted
        if (!change.after.exists) return null;

        const booking = change.after.data();
        const before = change.before.exists ? change.before.data() : null;

        // Only calculate if branchId exists and rates are attached
        if (!booking.branchId || !booking.branchCommissionRates) return null;

        // Skip if settlement amount already matches to avoid infinite loops
        const rate = booking.serviceType === 'DELIVERY'
            ? (booking.branchCommissionRates.delivery || 0)
            : (booking.branchCommissionRates.storage || 0);

        // Calculate base commission
        let settlementAmount = Math.round((booking.finalPrice || 0) * (rate / 100));

        // Adjust for cancellations/refunds
        if (booking.status === '취소됨' || booking.status === '환불완료') {
            settlementAmount = 0; // Or keep negative if needed, but 0 means no settlement
        }

        // Avoid infinite loop if no change
        if (before && before.branchSettlementAmount === settlementAmount) {
            return null;
        }

        return change.after.ref.update({
            branchSettlementAmount: settlementAmount
        });
    });


