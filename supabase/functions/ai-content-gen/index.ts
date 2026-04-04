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

// 미운영 서비스 언급 금지
const FORBIDDEN_SERVICES = [
  "Instagram", "Phase 2", "B2B 제안서",
];

function policyCheck(content: string): { passed: boolean; violations: string[] } {
  const violations: string[] = [];
  const all = [...FORBIDDEN_TERMS, ...FORBIDDEN_SERVICES];
  for (const term of all) {
    if (content.includes(term)) violations.push(term);
  }
  return { passed: violations.length === 0, violations };
}

async function checkRateLimit(supabase: ReturnType<typeof createClient>, uid: string): Promise<boolean> {
  const { count } = await supabase
    .from("ai_outputs")
    .select("id", { count: "exact", head: true })
    .eq("created_by", uid)
    .gte("created_at", new Date(Date.now() - 60_000).toISOString());

  return (count ?? 0) < RATE_LIMIT_PER_MINUTE;
}

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

Return ONLY valid JSON with these keys:
en, ja, zh, zh_tw, zh_hk,
address_en, address_ja, address_zh, address_zh_tw, address_zh_hk,
pickupGuide_en, pickupGuide_ja, pickupGuide_zh, pickupGuide_zh_tw, pickupGuide_zh_hk,
description_en, description_ja, description_zh, description_zh_tw, description_zh_hk`;

  const userPrompt = `Translate this Korean location info:
Name: ${locationData.name}
Address: ${locationData.address}
Pickup Guide: ${locationData.pickupGuide || ""}
Description: ${locationData.description || ""}`;

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
    const err = await response.text();
    throw new EdgeHttpError(502, `Claude API error [${response.status}]: ${err}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "";

  // JSON 블록 파싱
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new EdgeHttpError(502, "Claude returned non-JSON response");

  return JSON.parse(jsonMatch[0]);
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

    // Rate limit 체크
    const allowed = await checkRateLimit(supabase, uid);
    if (!allowed) {
      throw new EdgeHttpError(429, "분당 요청 한도(10회)를 초과했습니다. 잠시 후 다시 시도해 주세요.");
    }

    const body = await req.json();
    const { use_case, entity_id, location_data } = body;

    if (!use_case || !location_data) {
      throw new EdgeHttpError(400, "use_case와 location_data는 필수입니다.");
    }

    // Claude로 번역 생성
    const generated = await generateTranslations(location_data);

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
        prompt_snapshot: { location_name: location_data.name, location_address: location_data.address },
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
