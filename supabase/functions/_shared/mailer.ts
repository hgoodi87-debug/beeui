import { EdgeHttpError, normalizeText } from "./admin-auth.ts";

const RESEND_API_KEY = normalizeText(Deno.env.get("INTERNAL_MAIL_KEY"));
const SMTP_FROM_NAME = normalizeText(Deno.env.get("SMTP_FROM_NAME")) || "Beeliber";
const SMTP_USER = normalizeText(Deno.env.get("SMTP_USER")) || "ceo@bee-liber.com";

export interface EdgeMailOptions {
  to: string;
  bcc?: string | string[];
  subject: string;
  html: string;
}

export const sendEdgeMail = async (options: EdgeMailOptions) => {
  const to = normalizeText(options.to);
  if (!to) {
    throw new EdgeHttpError(400, "수신 이메일 주소가 비어 있습니다.", "Missing recipient email.");
  }

  if (!RESEND_API_KEY) {
    throw new EdgeHttpError(503, "메일 전송 설정이 준비되지 않았습니다.", "Missing INTERNAL_MAIL_KEY for Resend.");
  }

  const bcc = Array.isArray(options.bcc)
    ? options.bcc
    : options.bcc
    ? [options.bcc]
    : undefined;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${SMTP_FROM_NAME} <${SMTP_USER}>`,
      to: [to],
      bcc,
      subject: options.subject,
      html: options.html,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${JSON.stringify(body)}`);
  }

  return body;
};
