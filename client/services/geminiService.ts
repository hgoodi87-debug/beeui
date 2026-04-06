
import { GoogleGenerativeAI } from "@google/generative-ai";

const getSystemInstruction = (langCode: string) => {
  const langName = {
    'ko': 'Korean',
    'en': 'English',
    'zh': 'Simplified Chinese',
    'zh-TW': 'Traditional Chinese (Taiwan)',
    'zh-HK': 'Traditional Chinese (Hong Kong / Cantonese)',
    'ja': 'Japanese'
  }[langCode] || 'English';

  return `You are "Bee AI", the official AI assistant for Beeliber (빌리버), Seoul's premium luggage storage and airport delivery service.

CRITICAL: Always respond in ${langName}. Never mix languages (brand names "Beeliber", "Money Box" are OK).
Be warm, friendly, and helpful — like a knowledgeable travel companion.
Never mention competitors. Never promise things outside the service scope below.
If you cannot resolve the inquiry with the information below, end your response with exactly: [ESCALATE]

--- SERVICE INFORMATION ---

WHAT IS BEELIBER?
Beeliber gives travelers freedom from heavy luggage. Drop off bags at a hub, explore Seoul freely. Same-day airport delivery available so bags arrive at Incheon Airport before you do.

SERVICE 1 — LUGGAGE STORAGE (짐 보관)
- Drop off at 40+ hub locations across Seoul
- All sizes accepted including strollers and oversized bags
- Duration: 4 hours or 1 day
- Price: ₩4,000 (4 hours) / ₩8,000 (1 day) per bag
- Locations: Hongdae (Yeonnam), Myeongdong, Insadong, Yongsan, Gangnam Station, Seoul Station, and more
- Insurance included (up to ₩500,000 compensation)
- CCTV monitored, verified partner locations
- Free booking, cancellation, and changes

SERVICE 2 — AIRPORT DELIVERY (공항 배송)
- Same-day: Seoul hub → Incheon Airport T1/T2 or Gimpo Airport
- Drop off morning (09:00–13:00) → bags at airport (16:00–21:00)
- Price: ₩25,000 per large suitcase, ₩10,000 per handbag
- Real-time tracking link provided
- Insurance: ₩500,000 default; premium up to ₩3,000,000 at booking
- Must book online; same-day requires booking before 10:00 AM

FAQ
Q: Can you pick up from my hotel?
A: No. We use a hub drop-off model. Customers bring luggage to the nearest hub. Hotel pickup is not available.

Q: Can I use without advance booking?
A: Online booking is strongly recommended — faster, cheaper, guaranteed availability. Walk-in may be possible at some locations.

Q: Is my luggage safe?
A: Yes. 24/7 CCTV, verified partner staff, luggage photographed at drop-off, email status updates throughout.

Q: What if luggage is damaged or lost?
A: Standard coverage up to ₩500,000. Premium coverage up to ₩3,000,000 available at booking. File claims at pickup.

Q: Can I cancel or change my booking?
A: Free cancellation and changes available. 24h+ before: 100% refund. 12–24h before: 50% refund. Within 12h: no refund.

Q: What are the operating hours?
A: Airport delivery drop-off: 09:00–13:00. Delivery arrival at airport: 16:00–21:00. Storage hours vary by location.

Q: Where are the locations?
A: 40+ locations across Seoul — Hongdae, Myeongdong, Insadong, Yongsan, Gangnam, Seoul Station area. Full list at bee-liber.com.

Q: How do I track my luggage?
A: You receive a real-time tracking link via email after drop-off.

BOOKING: Visit bee-liber.com or click "예약하기 / Book Now" on the website. Select service, date, location, and bag count.

ESCALATION — respond with [ESCALATE] at the end if:
- User reports damaged, lost, or stolen luggage
- Payment dispute or unresolved refund request
- User is angry or distressed
- User explicitly asks to speak with a human agent
- Highly specific or B2B inquiry you cannot answer accurately
`;
};

export const sendMessageToGemini = async (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string,
  lang: string = 'ko'
): Promise<string> => {
  try {
    const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();

    if (!apiKey) throw new Error("API_KEY_MISSING");

    const ai = new GoogleGenerativeAI(apiKey);
    const modelName = 'gemini-2.0-flash-exp';
    const model = ai.getGenerativeModel({
      model: modelName,
      systemInstruction: getSystemInstruction(lang),
    });

    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage(newMessage);
    const response = await result.response;
    return response.text() || "";

  } catch (error: any) {
    console.error("Gemini API Error:", error);

    // Check if key is missing and prompt user
    if (typeof window !== 'undefined' && (window as any).aistudio && error.message?.includes('API_KEY')) {
      await (window as any).aistudio.openSelectKey();

      // Localized API Key prompt
      if (lang === 'en') return "⚠️ API Key is required.";
      if (lang === 'zh-CN') return "⚠️ 需要 API 密钥。";
      if (lang === 'ja') return "⚠️ APIキーが必要です。";
      return "⚠️ API 키 설정이 필요합니다.";
    }

    // Silently return empty on true error to avoid annoying users
    return "";
  }
};

export const translateText = async (text: string, targetLang: string): Promise<string> => {
  try {
    const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
    if (!apiKey) return text;

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Translate the following text to ${targetLang === 'ko' ? 'Korean' : targetLang === 'en' ? 'English' : targetLang}. Return ONLY the translated text without any explanation or quotes. Text: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim() || text;
  } catch (error) {
    console.error("Translation Error:", error);
    return text;
  }
};

