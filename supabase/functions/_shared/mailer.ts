import nodemailer from "npm:nodemailer@6.10.1";

import { EdgeHttpError, normalizeText } from "./admin-auth.ts";

const SMTP_USER = normalizeText(Deno.env.get("SMTP_USER")) || "ceo@bee-liber.com";
const SMTP_PASS = normalizeText(Deno.env.get("SMTP_PASS"));
const SMTP_HOST = normalizeText(Deno.env.get("SMTP_HOST"));
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") || 0) || undefined;
const SMTP_SECURE = normalizeText(Deno.env.get("SMTP_SECURE")).toLowerCase() === "true";
const SMTP_FROM_NAME = normalizeText(Deno.env.get("SMTP_FROM_NAME")) || "Beeliber Support";

export interface EdgeMailOptions {
  to: string;
  bcc?: string | string[];
  subject: string;
  html: string;
}

const createTransport = () => {
  if (!SMTP_PASS) {
    throw new EdgeHttpError(
      503,
      "메일 전송 설정이 아직 준비되지 않았습니다.",
      "Missing SMTP_PASS for edge mailer.",
    );
  }

  if (SMTP_HOST) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT || (SMTP_SECURE ? 465 : 587),
      secure: SMTP_SECURE || (SMTP_PORT === 465),
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

export const sendEdgeMail = async (options: EdgeMailOptions) => {
  const transporter = createTransport();
  const to = normalizeText(options.to);
  if (!to) {
    throw new EdgeHttpError(400, "수신 이메일 주소가 비어 있습니다.", "Missing recipient email.");
  }

  return await transporter.sendMail({
    from: `"${SMTP_FROM_NAME}" <${SMTP_USER}>`,
    to,
    bcc: options.bcc,
    subject: options.subject,
    html: options.html,
  });
};
