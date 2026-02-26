// functions/src/domains/notification/refundService.js
const { sendMail } = require("./mailer");
const { getTranslations } = require("../../shared/translations");

const processRefundEmail = async (bookingId, booking) => {
    const userEmail = booking.userEmail;
    if (!userEmail) return { success: false, error: "No email" };

    const lang = (booking.language || 'ko').split('-')[0];
    const t = getTranslations(lang);

    const mailOptions = {
        to: userEmail,
        bcc: "bee@bee-liber.com",
        subject: `[Beeliber] ${t.refundSubject} (${bookingId})`,
        html: `
        <!DOCTYPE html>
        <html lang="${lang}">
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

module.exports = { processRefundEmail };
