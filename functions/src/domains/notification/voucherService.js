// functions/src/domains/notification/voucherService.js
const QRCode = require("qrcode");
const { sendMail } = require("./mailer");
const { getTranslations } = require("../../shared/translations");

const processVoucherEmail = async (bookingId, booking, admin) => {
    const userEmail = booking.userEmail;
    const lang = (booking.language || 'ko').split('-')[0];
    const t = getTranslations(lang);

    // Fetch Location Data (via admin SDK passed from index.js)
    const getLocationData = async (id) => {
        if (!id || id === 'custom') return null;
        try {
            const snap = await admin.firestore().collection('locations').doc(id).get();
            return snap.exists ? snap.data() : null;
        } catch (err) {
            console.error(`⚠️ [Voucher] Failed to fetch location ${id}:`, err);
            return null;
        }
    };

    const destLoc = await getLocationData(booking.dropoffLocation);
    const pickupLoc = await getLocationData(booking.pickupLocation);

    const getLocName = (locData, fallbackId) => {
        if (!locData) return fallbackId || "";
        const n = lang === 'ko' ? locData.name :
            (lang === 'ja' ? (locData.name_ja || locData.name_en || locData.name) :
                (lang === 'zh' ? (locData.name_zh || locData.name_en || locData.name) :
                    (locData.name_en || locData.name)));
        return n || fallbackId || "";
    };

    const pickupBranchName = getLocName(pickupLoc, booking.pickupLocation);
    const destBranchName = getLocName(destLoc, booking.dropoffLocation || booking.destinationLocation);
    const displayedCode = booking.reservationCode || bookingId;

    // [스봉이] 공항 지점 여부 체크 💅
    const retrievalLoc = booking.serviceType === 'DELIVERY' ? destLoc : pickupLoc;
    const isAirport = retrievalLoc && (retrievalLoc.type === 'AIRPORT' || retrievalLoc.name?.includes('공항') || retrievalLoc.name_en?.toLowerCase().includes('airport'));

    const qrText = `https://bee-liber.com/admin?scan=${bookingId}`;
    const qrBuffer = await QRCode.toBuffer(qrText, { margin: 1, width: 400 });

    const mailOptions = {
        to: userEmail,
        bcc: "bee@bee-liber.com",
        subject: `[Beeliber] ${t.voucherSubject} (${displayedCode})`,
        attachments: [{ filename: 'qrcode.png', content: qrBuffer, cid: 'qrcode' }],
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

                        ${pickupBranchName && (pickupLoc?.pickupImageUrl || pickupLoc?.pickupGuide) ? `
                        <div style="margin-top: 30px; background: #fffbeb; border-radius: 24px; padding: 20px; border: 1px solid #fef3c7; text-align: left;">
                            <div style="font-size: 12px; font-weight: 900; color: #92400e; margin-bottom: 12px; text-transform: uppercase;">📍 ${pickupBranchName} ${lang === 'ko' ? '방문 안내' : 'Guide'}</div>
                            ${pickupLoc?.pickupImageUrl ? `<img src="${pickupLoc.pickupImageUrl}" style="width: 100%; border-radius: 12px; margin-bottom: 15px;" alt="Guide" />` : ''}
                            <p style="font-size: 13px; color: #475569; line-height: 1.6; margin: 0; font-weight: 600;">${pickupLoc?.pickupGuide || ""}</p>
                        </div>
                        ` : ''}

                        <!-- [스봉이] 공항 지각 안내 인라인 (이메일용) 💅✨ -->
                        ${isAirport ? `
                        <div style="margin-top: 20px; background: #fffbeb; border-radius: 24px; padding: 20px; border: 1.5px solid #ffcb05; text-align: left;">
                            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                                <div style="font-size: 12px; font-weight: 900; color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.05em;">📢 AIRPORT NOTICE</div>
                            </div>
                            <p style="font-size: 13px; color: #1a1a1a; line-height: 1.6; margin: 0; font-weight: 700;">
                                ${t.airportLateNotice}
                            </p>
                        </div>
                        ` : ''}

                        <a href="https://bee-liber.com/tracking?id=${bookingId}" style="display: inline-block; background: #ffcb05; color: #1a1a1a; padding: 16px 30px; border-radius: 16px; text-decoration: none; font-size: 14px; font-weight: 900; margin-top: 30px; box-shadow: 0 10px 20px rgba(255,203,5,0.2);">Track My Package</a>

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
                    </div>

                    <div style="padding: 40px 20px; text-align: center; color: #94a3b8; font-size: 11px; font-weight: 600;">
                        <p style="margin-bottom: 20px; letter-spacing: 0.3em; color: #ffcb05; font-weight: 900;">NO BAGS, JUST FREEDOM</p>
                        &copy; 2026 Beeliber Global Logistics.
                    </div>
                </div>
            </div>
        </body>
        </html>
    `,
    };

    await sendMail(mailOptions);
    return { success: true, email: userEmail };
};

module.exports = { processVoucherEmail };
