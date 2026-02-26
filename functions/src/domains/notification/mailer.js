// functions/src/domains/notification/mailer.js
const nodemailer = require("nodemailer");

// Configuration from index.js legacy
const SMTP_USER = "ceo@bee-liber.com";
const SMTP_PASS = "labi qzqv qaxh nxgk"; // Should be moved to Secret Manager later 💅

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
