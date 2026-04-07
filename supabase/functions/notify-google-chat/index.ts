import { CORS_HEADERS, EdgeHttpError, jsonResponse, normalizeText } from "../_shared/admin-auth.ts";

const GOOGLE_CHAT_WEBHOOK_URL = normalizeText(Deno.env.get("GOOGLE_CHAT_WEBHOOK_URL"));

const ALLOWED_HOSTS = new Set([
  "bee-liber.com",
  "www.bee-liber.com",
  "beeliber-main.web.app",
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
]);

const sanitizeText = (value: unknown, maxLength: number) =>
  normalizeText(value)
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/[^\P{C}\r\n\t]/gu, "")
    .slice(0, maxLength);

const assertAllowedOrigin = (origin: string) => {
  if (!origin) {
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    throw new EdgeHttpError(403, "허용되지 않은 요청 출처입니다.", `Invalid origin header: ${origin}`);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    ALLOWED_HOSTS.has(hostname) ||
    hostname.endsWith(".bee-liber.com") ||
    hostname.endsWith(".web.app") ||
    /^192\.168\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  ) {
    return;
  }

  throw new EdgeHttpError(403, "허용되지 않은 요청 출처입니다.", `Blocked origin: ${origin}`);
};

const buildDisplayRole = (
  role: string,
  senderName: string,
  senderEmail: string,
) => {
  if (role === "user") {
    const safeName = senderName || "Guest";
    return senderEmail ? `👤 ${safeName} (${senderEmail})` : `👤 ${safeName}`;
  }

  return "🐝 Bee AI";
};

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: CORS_HEADERS });
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "method_not_allowed" }, 405);
    }

    if (!GOOGLE_CHAT_WEBHOOK_URL) {
      throw new EdgeHttpError(
        503,
        "Google Chat 알림 설정이 아직 준비되지 않았습니다.",
        "Missing GOOGLE_CHAT_WEBHOOK_URL.",
      );
    }

    assertAllowedOrigin(normalizeText(req.headers.get("origin")));

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new EdgeHttpError(400, "요청 본문 형식이 올바르지 않습니다.", "Invalid JSON body.");
    }

    const role = sanitizeText(body.role, 16).toLowerCase();
    if (role !== "user" && role !== "model") {
      throw new EdgeHttpError(400, "메시지 역할이 올바르지 않습니다.", `Invalid role: ${body.role}`);
    }

    const text = sanitizeText(body.text, 4000);
    const sessionId = sanitizeText(body.sessionId, 120);
    const senderName = sanitizeText(body.senderName, 80);
    const senderEmail = sanitizeText(body.senderEmail, 160);

    if (!text || !sessionId) {
      throw new EdgeHttpError(400, "메시지와 세션 정보가 필요합니다.", "Missing text or sessionId.");
    }

    const response = await fetch(GOOGLE_CHAT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `*${buildDisplayRole(role, senderName, senderEmail)}*: ${text}`,
        thread: { threadKey: sessionId },
      }),
    });

    const responseText = await response.text().catch(() => "");
    if (!response.ok) {
      throw new EdgeHttpError(
        502,
        "Google Chat 알림 전송에 실패했습니다.",
        `[notify-google-chat] upstream ${response.status}: ${responseText}`,
      );
    }

    return jsonResponse({ ok: true, sessionId });
  } catch (error) {
    if (error instanceof EdgeHttpError) {
      console.error("[notify-google-chat]", error.logMessage);
      return jsonResponse({ error: error.message }, error.status);
    }

    console.error("[notify-google-chat] Unexpected error:", error);
    return jsonResponse({ error: "알림 전송 중 오류가 발생했습니다." }, 500);
  }
});
