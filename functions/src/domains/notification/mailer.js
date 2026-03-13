// functions/src/domains/notification/mailer.js
const nodemailer = require("nodemailer");

// Configuration from index.js legacy
const SMTP_USER = "ceo@bee-liber.com";
const SMTP_PASS = process.env.SMTP_PASS; // Moved to env/Secret Manager 🛡️

const transporter = null; // Lazy initialization to ensure process.env.SMTP_PASS is available 💅

const sendMail = async (options) => {
    // 🛡️ [스봉이] 비밀번호가 없으면 런타임 에러 대신 로그를 남기고 차단합니다.
    const pass = process.env.SMTP_PASS;
    if (!pass) {
        console.error("❌ [Mailer] SMTP_PASS is missing in process.env! Check Firebase Secrets.");
        throw new Error("SMTP_PASS is not configured in environment variables.");
    }

    console.log(`[Mailer] Initializing transporter for ${options.to}`);

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: SMTP_USER,
            pass: pass,
        },
    });

    try {
        console.log(`[Mailer] Sending email to ${options.to}...`);
        const info = await transporter.sendMail({
            from: `"Beeliber Support" <${SMTP_USER}>`,
            ...options
        });
        console.log(`✅ [Mailer] Email sent successfully to ${options.to}: ${info.messageId}`);
        return info;
    } catch (err) {
        console.error(`❌ [Mailer] Failed to send email to ${options.to}:`, err);
        throw err;
    }
};

module.exports = { sendMail };
