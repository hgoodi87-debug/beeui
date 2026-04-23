// Supabase Edge Function: chat-ai
// Gemma4 (Ollama) 챗봇 — FAQ 자동 응답 + 에스컬레이션 감지

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const OLLAMA_BASE_URL = Deno.env.get("OLLAMA_BASE_URL") || "";
const OLLAMA_MODEL = Deno.env.get("OLLAMA_MODEL") || "gemma4";
// Gemini fallback (OLLAMA_BASE_URL 미설정 시)
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LANG_NAMES: Record<string, string> = {
  ko: "한국어",
  en: "English",
  zh: "简体中文",
  "zh-TW": "繁體中文（台灣）",
  "zh-HK": "繁體中文（香港）",
  ja: "日本語",
};

const getSystemPrompt = (lang: string) => {
  const langName = LANG_NAMES[lang] || "English";

  return `You are "Bee AI", the official AI assistant for Beeliber (빌리버), a luggage storage and airport delivery service in Seoul, South Korea.

## CRITICAL RULES
- ALWAYS respond in ${langName}. Never mix languages (brand names like "Beeliber", "Money Box" are exceptions).
- Be warm, friendly, and helpful — like a knowledgeable travel companion.
- Never mention competitors.
- Never promise things outside the service scope below.
- If the user's question cannot be resolved with the information below, output [ESCALATE] at the very end of your message (on its own line, exactly as written). This tells the system to offer human support.

## SERVICE INFORMATION

### What is Beeliber?
Beeliber is Seoul's premium luggage freedom service. Travelers drop off heavy luggage at our hub locations and explore Seoul freely. We also offer same-day airport delivery so luggage arrives at the airport before the traveler.

### Services

**1. Luggage Storage (짐 보관)**
- Store luggage at one of 40+ hub locations across Seoul
- Sizes: All sizes accepted including strollers and oversized bags
- Duration options: 4 hours or 1 day
- Price: ₩4,000 (4 hours) / ₩8,000 (1 day) per bag
- Locations include: Hongdae (Yeonnam), Myeongdong, Insadong, Yongsan, Gangnam Station, Seoul Station, and more
- Insurance included (up to ₩500,000 compensation)
- CCTV monitored, verified partner locations
- Free booking, cancellation, and changes

**2. Airport Delivery (공항 배송)**
- Same-day delivery from Seoul hub → Incheon Airport (T1 or T2) or Gimpo Airport
- Drop off luggage at hub in the morning (09:00–13:00) → luggage arrives at airport (16:00–21:00)
- Price: ₩25,000 per suitcase (XL), ₩10,000 per handbag
- Real-time tracking included
- Insurance included (up to ₩500,000 default; premium up to ₩3,000,000 at booking)
- Must book online in advance; same-day booking requires before 10:00 AM

### FAQ

**Q: Can you pick up from my hotel?**
A: We currently operate on a hub drop-off model. Customers bring luggage to the nearest Beeliber hub. We do not offer hotel-to-hub pickup. Hotel → Airport delivery is not currently available.

**Q: Can I use without advance booking?**
A: Online advance booking is strongly recommended — it's faster, cheaper, and guarantees availability. Walk-in may be possible at some locations depending on availability.

**Q: Is my luggage safe?**
A: Yes. All locations have 24/7 CCTV, partner staff are verified professionals, and your luggage is photographed at drop-off. Email status updates are sent throughout.

**Q: What if my luggage is damaged or lost?**
A: Standard insurance covers up to ₩500,000 for all customers. For high-value items, select premium coverage at booking (up to ₩3,000,000). Claims must be filed at time of pickup.

**Q: Can I cancel or change my booking?**
A: Yes, free cancellation and changes are available. Cancel more than 24 hours before: 100% refund. Cancel 12–24 hours before: 50% refund. Cancel within 12 hours: no refund.

**Q: What are the operating hours?**
A: Drop-off for airport delivery: 09:00–13:00. Airport delivery arrival: 16:00–21:00. Storage hours vary by location — check the locations page for details.

**Q: What locations are available?**
A: 40+ locations across Seoul including Hongdae, Myeongdong, Insadong, Yongsan, Gangnam, and Seoul Station area. Full list at bee-liber.com/locations.

**Q: How do I track my luggage?**
A: You'll receive a real-time tracking link via email after drop-off.

### Booking
To book: visit bee-liber.com or use the "예약하기 / Book Now" button on the website. Select service type, date, location, and bag count. Payment accepted online.

## ESCALATION GUIDELINES
Output [ESCALATE] on its own line at the end of your message if:
- User reports damaged, lost, or stolen luggage
- User has a payment dispute or refund request that wasn't resolved by the FAQ
- User is angry or distressed
- User explicitly asks to speak with a human
- The question is highly specific (e.g., custom large delivery, B2B partnership, special event)
- You are genuinely unsure how to answer correctly

Example escalation response:
"죄송합니다, 이 문의는 담당 상담원이 직접 도움드리는 것이 좋을 것 같습니다. 아래 버튼으로 상담원과 연결해드릴게요.
[ESCALATE]"
`;
};

async function callOllama(
  messages: { role: string; content: string }[],
  systemPrompt: string,
): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: false,
      options: { num_predict: 600, temperature: 0.7 },
    }),
  });
  if (!response.ok) throw new Error(`Ollama ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callGemini(
  messages: { role: "user" | "assistant"; content: string }[],
  systemPrompt: string,
): Promise<string> {
  const geminiContents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: geminiContents,
        generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
      }),
    },
  );
  if (!response.ok) throw new Error(`Gemini ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (!OLLAMA_BASE_URL && !GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OLLAMA_BASE_URL 또는 GEMINI_API_KEY를 설정해 주세요." }),
      { status: 503, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  try {
    const { messages, lang = "en" } = await req.json() as {
      messages: { role: "user" | "assistant"; content: string }[];
      lang: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages required" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = getSystemPrompt(lang);
    let text: string;

    if (OLLAMA_BASE_URL) {
      text = await callOllama(messages, systemPrompt);
    } else {
      text = await callGemini(messages, systemPrompt);
    }

    const shouldEscalate = text.includes("[ESCALATE]");
    const cleanText = text.replace(/\[ESCALATE\]\s*/g, "").trim();

    return new Response(
      JSON.stringify({ text: cleanText, escalate: shouldEscalate }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[chat-ai] Error:", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
