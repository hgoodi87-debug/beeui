/**
 * Google Service Account JWT 인증 유틸
 * GOOGLE_SA_KEY 환경변수에 서비스 계정 JSON 전체를 저장해야 합니다.
 */

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

function base64urlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function objToBase64url(obj: unknown): string {
  return base64urlEncode(JSON.stringify(obj));
}

async function importRsaPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\r?\n/g, "");
  const der = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function signJwt(
  sa: ServiceAccountKey,
  scopes: string[],
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = objToBase64url({ alg: "RS256", typ: "JWT" });
  const payload = objToBase64url({
    iss: sa.client_email,
    sub: sa.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: scopes.join(" "),
  });
  const signingInput = `${header}.${payload}`;
  const key = await importRsaPrivateKey(sa.private_key);
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  return `${signingInput}.${sigB64}`;
}

export async function getGoogleAccessToken(scopes: string[]): Promise<string> {
  const raw = Deno.env.get("GOOGLE_SA_KEY");
  if (!raw) throw new Error("GOOGLE_SA_KEY 환경변수가 설정되지 않았습니다.");
  const sa: ServiceAccountKey = JSON.parse(raw);

  const jwt = await signJwt(sa, scopes);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google 토큰 발급 실패: ${err}`);
  }
  const { access_token } = await res.json();
  return access_token as string;
}
