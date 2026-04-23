// Supabase Edge Function: seo-geo-audit
// Gemma4(Ollama) 기반 SEO/GEO 검수 — 페이지 콘텐츠 분석 + 개선 권고

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateAdminRequest, CORS_HEADERS, EdgeHttpError } from "../_shared/admin-auth.ts";

const OLLAMA_BASE_URL = Deno.env.get("OLLAMA_BASE_URL") || "";
const OLLAMA_MODEL = Deno.env.get("OLLAMA_MODEL") || "gemma4";

const SEO_SYSTEM_PROMPT = `You are an expert SEO and GEO (Generative Engine Optimization) auditor for Beeliber, a premium luggage storage and airport delivery service in Seoul targeting Taiwanese, Hong Kong, and Japanese travelers.

GEO (Generative Engine Optimization) means optimizing content so AI search engines (Google AI Overview, Bing Copilot, ChatGPT Search, Perplexity) can accurately answer user questions about the service.

Analyze the provided page content and return ONLY a valid JSON object with this exact structure:
{
  "score": <number 0-100>,
  "seo": {
    "title_check": "<pass|fail|missing>",
    "meta_description_check": "<pass|fail|missing>",
    "heading_structure": "<pass|warn|fail>",
    "keyword_density": "<pass|warn|low>",
    "issues": ["<issue1>", "<issue2>"],
    "recommendations": ["<rec1>", "<rec2>"]
  },
  "geo": {
    "entity_clarity": "<pass|warn|fail>",
    "factual_density": "<pass|warn|low>",
    "qa_structure": "<pass|warn|missing>",
    "multilingual_signals": "<pass|warn|missing>",
    "issues": ["<issue1>"],
    "recommendations": ["<rec1>", "<rec2>"]
  },
  "priority_fixes": ["<fix1>", "<fix2>", "<fix3>"],
  "summary": "<2-3 sentence overall assessment in Korean>"
}

Focus on:
- SEO: title/meta tags, heading hierarchy (H1→H2→H3), keyword placement, internal linking signals
- GEO: clear entity mentions (Beeliber, Seoul, Incheon Airport), factual price/hour data, FAQ-style Q&A structure, structured data hints, multilingual metadata (zh-TW, ja, en)
- Brand alignment: premium tone, no forbidden terms (저렴한/싼/할인/무겁다/택배/물류)`;

async function auditWithGemma(pageContent: string, pageType: string): Promise<Record<string, unknown>> {
  if (!OLLAMA_BASE_URL) throw new EdgeHttpError(503, "OLLAMA_BASE_URL이 설정되지 않았습니다.");

  const userPrompt = `Page type: ${pageType}

Content to audit:
---
${pageContent.slice(0, 6000)}
---

Return the JSON audit result.`;

  const response = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: "system", content: SEO_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      stream: false,
      options: { num_predict: 1500, temperature: 0.2 },
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 503) throw new EdgeHttpError(503, "Ollama 서비스가 응답하지 않습니다. 실행 중인지 확인해 주세요.");
    throw new EdgeHttpError(502, `Gemma API 오류 [${status}]`);
  }

  const data = await response.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new EdgeHttpError(502, "Gemma가 올바른 JSON을 반환하지 않았습니다.");
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new EdgeHttpError(502, "JSON 파싱 실패.");
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    await authenticateAdminRequest(req);

    const body = await req.json();
    const { content, page_type = "landing" } = body as {
      content?: string;
      page_type?: string;
    };

    if (!content || content.trim().length < 50) {
      throw new EdgeHttpError(400, "content는 최소 50자 이상이어야 합니다.");
    }

    const audit = await auditWithGemma(content, page_type);

    return new Response(
      JSON.stringify({ data: audit, model: OLLAMA_MODEL }),
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
