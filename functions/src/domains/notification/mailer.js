// functions/src/domains/notification/mailer.js
const nodemailer = require("nodemailer");

// Configuration from index.js legacy
const SMTP_USER = "ceo@bee-liber.com";
const SMTP_PASS = process.env.SMTP_PASS; // Moved to env/Secret Manager 🛡️

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

const sendMail = async (options) => {
    return await transporter.sendMail({
        from: `"Beeliber Support" <${SMTP_USER}>`,
        ...options
    });
};

module.exports = { sendMail };
