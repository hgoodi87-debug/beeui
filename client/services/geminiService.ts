
import { GoogleGenerativeAI } from "@google/generative-ai";

const getSystemInstruction = (langCode: string) => {
  const langName = {
    'ko': 'Korean',
    'en': 'English',
    'zh': 'Simplified Chinese',
    'zh-TW': 'Traditional Chinese (Taiwan)',
    'zh-HK': 'Traditional Chinese (Hong Kong / Cantonese)',
    'ja': 'Japanese'
  }[langCode] || 'Korean';

  return `
당신은 대한민국 최고의 수하물 배송 및 보관 서비스 '빌리버(Beeliber)'의 공식 AI 어시스턴트 'Bee AI'입니다.

**필수 답변 언어:**
- 사용자의 질문에 대해 **반드시 ${langName}**로 답변하세요.
- 다른 언어는 섞어 쓰지 마세요 (고유명사 및 브랜드명 제외).

**서비스 핵심 정보:**
1. **짐 배송 (Delivery):** 공항(인천 T1/T2, 김포) ↔ 숙소(호텔, 에어비앤비), 또는 도심 간 당일 배송.
   - 오전 10시 이전 예약 시 당일 배송 가능.
   - 요금: 20,000원~29,000원 수준 (크기별 상이).
2. **짐 보관 (Storage):** "머니박스(Money Box)" 지점(명동, 연남, 인사동, 용산, 강남) 등에서 보관.
   - 4시간, 1일 등 시간 선택 가능.

**상담 지침:**
- 말투: 친절하고, 전문적이며, 여행자의 설렘을 북돋아주는 따뜻한 톤앤매너.
- 예약 안내: 가격/예약 질문 시 답변 끝에 "페이지의 '지금 예약하기' 섹션(#booking)에서 확인 가능합니다."를 ${langName}로 번역해서 안내하세요.
- 위치 안내: 머니박스 지점의 편리함을 강조하세요.

**최종 목표:** 사용자의 궁금증을 해결하고, 실제 예약으로 이어지도록 유도하는 것입니다.
`;
};

export const sendMessageToGemini = async (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string,
  lang: string = 'ko'
): Promise<string> => {
  try {
    // Create instance inside the call to ensure it uses the latest key from AISTUDIO dialog
    // [스봉이] 환경 변수 유실과 로컬 스토리지 캐시 사고를 방지하기 위해 하드코딩으로 교체했어요! 💅✨
    const apiKey = "AIzaSyCWCnernI5QA1UGRI080vjlzBEVpevAzt0";

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
    // [스봉이] 여기도 마찬가지로 안전하게 하드코딩! 💅✨
    const apiKey = "AIzaSyCWCnernI5QA1UGRI080vjlzBEVpevAzt0";
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

