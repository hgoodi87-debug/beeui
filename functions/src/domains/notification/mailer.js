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
        console.error("❌ [Mailer] SMTP_PASS is missing! Check Firebase Secrets.");
        throw new Error("Email configuration error");
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: SMTP_USER,
            pass: pass,
        },
    });

    return await transporter.sendMail({
        from: `"Beeliber Support" <${SMTP_USER}>`,
        ...options
    });
};

module.exports = { sendMail };
