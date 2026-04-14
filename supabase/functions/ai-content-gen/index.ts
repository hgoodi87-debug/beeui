import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateAdminRequest, CORS_HEADERS, EdgeHttpError } from "../_shared/admin-auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";

const RATE_LIMIT_PER_MINUTE = 10;

// 빌리버 브랜드 금지어 (beeliber_master 기준)
const FORBIDDEN_TERMS = [
  "저렴한", "싼", "할인", "힘들다", "무겁다", "택배", "물류",
  "AI기반솔루션", "호텔픽업", "공항→호텔배송",
  "24시간 이용 가능", "거점 수 1위", "보험 완전", "무한정 보상",
];
const FORBIDDEN_SERVICES = ["Instagram", "Phase 2", "B2B 제안서"];

function policyCheck(content: string): { passed: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const term of [...FORBIDDEN_TERMS, ...FORBIDDEN_SERVICES]) {
    if (content.includes(term)) violations.push(term);
  }
  return { passed: violations.length === 0, violations };
}

async function checkRateLimit(supabase: ReturnType<typeof createClient>, uid: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("ai_outputs")
    .select("id", { count: "exact", head: true })
    .eq("created_by", uid)
    .gte("created_at", new Date(Date.now() - 60_000).toISOString());
  // DB 장애 시 rate limit 무력화 방지: 에러 시 차단
  if (error) return false;
  return (count ?? 0) < RATE_LIMIT_PER_MINUTE;
}

// 지점 번역 생성 (use_case: 'translation')
async function generateTranslations(locationData: {
  name: string;
  address: string;
  pickupGuide?: string;
  description?: string;
}): Promise<Record<string, string>> {
  if (!ANTHROPIC_API_KEY) throw new EdgeHttpError(503, "ANTHROPIC_API_KEY not configured");

  const systemPrompt = `You are a professional translator for Beeliber, a premium luggage storage and delivery service in Seoul targeting Taiwanese, Hong Kong, and Japanese travelers.

Brand voice: Premium, warm, trustworthy. Never use: cheap, discount, heavy, logistics.
Translate all fields accurately and naturally for each locale.

Return ONLY valid JSON with these exact keys:
name_en, name_ja, name_zh, name_zh_tw, name_zh_hk,
address_en, address_ja, address_zh, address_zh_tw, address_zh_hk,
pickupGuide_en, pickupGuide_ja, pickupGuide_zh, pickupGuide_zh_tw, pickupGuide_zh_hk,
description_en, description_ja, description_zh, description_zh_tw, description_zh_hk`;

  // 입력값 길이 제한 (프롬프트 인젝션 완화)
  const safeName = String(locationData.name || "").slice(0, 200);
  const safeAddress = String(locationData.address || "").slice(0, 400);
  const safeGuide = String(locationData.pickupGuide || "").slice(0, 800);
  const safeDesc = String(locationData.description || "").slice(0, 400);

  const userPrompt = `Translate this Korean location info:
Name: ${safeName}
Address: ${safeAddress}
Pickup Guide: ${safeGuide}
Description: ${safeDesc}`;

  return await callClaude(systemPrompt, userPrompt);
}

// CS 응답 초안 생성 (use_case: 'cs_reply')
async function generateCsReply(inquiryBody: string, customerLang: string): Promise<Record<string, string>> {
  if (!ANTHROPIC_API_KEY) throw new EdgeHttpError(503, "ANTHROPIC_API_KEY not configured");

  const langMap: Record<string, string> = {
    "zh-TW": "Traditional Chinese (Taiwan)", "zh-HK": "Traditional Chinese (Hong Kong)",
    "ja": "Japanese", "en": "English", "ko": "Korean",
  };
  const targetLang = langMap[customerLang] || "Korean";

  const systemPrompt = `You are a customer service representative for Beeliber, a premium luggage storage and delivery service in Seoul.

Brand voice: Warm, professional, reassuring. Address the customer's concern directly and helpfully.
NEVER use: 저렴한, 싼, 할인, 힘들다, 무겁다, 택배, 물류, 24시간 이용 가능, Instagram.

Generate a response in ${targetLang} that:
1. Acknowledges the customer's concern
2. Provides a clear, helpful answer
3. Offers next steps if needed
4. Ends with a warm closing

Return ONLY valid JSON: {"reply": "the response text"}`;

  // 입력값 길이 제한
  const safeInquiry = String(inquiryBody || "").slice(0, 1000);
  const userPrompt = `Customer inquiry: ${safeInquiry}`;

  const result = await callClaude(systemPrompt, userPrompt);
  return result;
}

async function callClaude(systemPrompt: string, userPrompt: string): Promise<Record<string, string>> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    // Claude API 에러 본문 클라이언트에 그대로 노출 금지
    const status = response.status;
    if (status === 529 || status === 503) {
      throw new EdgeHttpError(503, "AI 서비스가 일시적으로 바쁩니다. 잠시 후 다시 시도해 주세요.");
    }
    throw new EdgeHttpError(502, `AI API 오류 [${status}]. 잠시 후 다시 시도해 주세요.`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "";

  // 중첩 JSON 안전 파싱: 첫 { 부터 마지막 } 까지
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new EdgeHttpError(502, "AI가 올바른 형식으로 응답하지 않았습니다.");
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new EdgeHttpError(502, "AI 응답 파싱 실패. 잠시 후 다시 시도해 주세요.");
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // Admin JWT 검증
    const adminCtx = await authenticateAdminRequest(req);
    const uid = adminCtx.uid;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Rate limit 체크 (DB 장애 시 차단)
    const allowed = await checkRateLimit(supabase, uid);
    if (!allowed) {
      throw new EdgeHttpError(429, "분당 요청 한도(10회)를 초과했습니다. 잠시 후 다시 시도해 주세요.");
    }

    const body = await req.json();
    const { use_case, entity_id } = body;

    if (!use_case) {
      throw new EdgeHttpError(400, "use_case는 필수입니다. ('translation' | 'cs_reply')");
    }

    let generated: Record<string, string>;
    let promptSnapshot: Record<string, string>;

    if (use_case === "translation") {
      const { location_data } = body;
      if (!location_data?.name) {
        throw new EdgeHttpError(400, "translation use_case는 location_data.name이 필요합니다.");
      }
      generated = await generateTranslations(location_data);
      promptSnapshot = { location_name: location_data.name, location_address: location_data.address };
    } else if (use_case === "cs_reply") {
      const { inquiry_body, customer_lang } = body;
      if (!inquiry_body) {
        throw new EdgeHttpError(400, "cs_reply use_case는 inquiry_body가 필요합니다.");
      }
      generated = await generateCsReply(inquiry_body, customer_lang || "ko");
      // 감사 로그에 문의 내용 저장 (PII 주의: 내용만, 고객 식별정보 제외)
      promptSnapshot = { inquiry_preview: String(inquiry_body).slice(0, 100), customer_lang: customer_lang || "ko" };
    } else {
      throw new EdgeHttpError(400, `지원하지 않는 use_case: ${use_case}`);
    }

    // 정책 검사
    const allText = Object.values(generated).join(" ");
    const policy = policyCheck(allText);
    const status = policy.passed ? "ai_review_pending" : "ai_policy_failed";

    // DB 저장
    const { data: output, error } = await supabase
      .from("ai_outputs")
      .insert({
        use_case,
        entity_id: entity_id || null,
        prompt_snapshot: promptSnapshot,
        generated_content: generated,
        policy_check: policy,
        status,
        created_by: uid,
      })
      .select("id, status, policy_check")
      .single();

    if (error) throw new EdgeHttpError(500, `DB 저장 실패: ${error.message}`);

    return new Response(
      JSON.stringify({ data: output }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const err = e instanceof EdgeHttpError ? e : new EdgeHttpError(500, String(e));
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: err.status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});
