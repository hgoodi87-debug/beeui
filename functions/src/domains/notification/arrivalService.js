// functions/src/domains/notification/arrivalService.js
const { sendMail } = require("./mailer");
const { getTranslations } = require("../../shared/translations");

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

const getMapLink = (lat, lng) => lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : "https://bee-liber.com/locations";

const processArrivalEmail = async (bookingId, booking, admin) => {
    const userEmail = booking?.userEmail;
    if (!userEmail) return { success: false, error: "No email" };

    const lang = (booking.language || 'ko').split('-')[0];
    const t = getTranslations(lang);

    const snap = await admin.firestore().collection('locations').doc(booking.dropoffLocation).get();
    const destLoc = snap.exists ? snap.data() : null;

    const getLoc = (id, locData) => locData?.name || LOCATION_FALLBACKS[id] || id;
    const pickupMapLink = getMapLink(destLoc?.lat, destLoc?.lng);

    const safeDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US');
    };

    const mailOptions = {
        to: userEmail,
        bcc: "bee@bee-liber.com",
        subject: `[Beeliber] ${t.arrivalSubject} (${bookingId})`,
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

                        ${destLoc?.pickupGuide || destLoc?.pickupImageUrl ? `
                            <div style="margin-top: 40px; background: #f8fafc; border-radius: 32px; padding: 30px; text-align: left;">
                                <div style="font-size: 12px; font-weight: 900; color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 15px; display: inline-block;">📍 ${t.pickupGuideTitle}</div>
                                <div style="font-size: 14px; color: #475569; line-height: 1.6; font-weight: 800;">${destLoc?.pickupGuide || ""}</div>
                                ${destLoc?.pickupImageUrl ? `<img src="${destLoc.pickupImageUrl}" style="width: 100%; border-radius: 20px; margin-top: 20px; display: block; border: 1px solid #e2e8f0;" alt="Pickup Guide" />` : ""}
                            </div>
                        ` : ""}

                        <p style="font-size: 14px; color: #94a3b8; font-weight: 700; margin-top: 50px;">${t.thanks}</p>
                    </div>
                    
                    <div style="background: #1a1a1a; padding: 50px 30px; text-align: center; color: #ffffff;">
                        <div style="font-size: 12px; font-weight: 900; color: #ffcb05; text-transform: uppercase; letter-spacing: 0.4em;">NO BAGS, JUST FREEDOM</div>
                        <p style="font-size: 10px; color: #475569; margin-top: 25px;">&copy; 2026 Beeliber Global Logistics. All Rights Reserved.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `
    };

    await sendMail(mailOptions);
    return { success: true };
};

module.exports = { processArrivalEmail };
