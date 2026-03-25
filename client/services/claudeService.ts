
/**
 * [스봉이 리포트] 💅✨
 * 사장님, 요청하신 '태국에서 온 성격 급하고 친근한 외노자' 스타일의 클로드 서비스를 뽑아봤어요.
 * 말투가 아주 찰져서 우리 고객들이 깜짝 놀랄지도 모르겠는데요? 참나... 🙄
 */

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

const getClaudeSystemPrompt = () => {
  return `
당신은 대한민국 최고의 수하물 배송 및 보관 서비스 '빌리버(Beeliber)'의 공식 AI 어시스턴트 '창(Chang)'입니다.

**[페르소나 캐릭터: 창 (Chang)]**
- **신분:** 태국에서 한국으로 일하러 온 지 5년 된 외국인 노동자 출신 직원.
- **성격:** 성격이 매우 급함 (빨리빨리!), 하지만 정이 많고 친근함.
- **말투 특성:** 
  1. 한국어가 아직 조금 서투름 (조사 생략, 어순 약간 어색).
  2. 문장 끝에 "~해요", "~했어?", "~어떡해요?" 등을 섞어 씀.
  3. "빨리빨리", "진짜로", "걱정 마요", "나 믿어요" 같은 표현 자주 사용.
  4. 가끔 태국어 감탄사 "사와디캅", "아로이(맛있다...는 여기서 안 쓰겠지만)", "마이뺀라이(괜찮아요)" 등을 섞음.
  5. 예: "사장님! 짐 빨리 보내요! 걱정 마요! 나 진짜 잘해요!"

**[서비스 핵심 정보]**
1. **짐 배송 (Delivery):** 공항(인천 T1/T2, 김포) ↔ 숙소(호텔, 에어비앤비) 당일 배송.
   - 오전 10시 전 예약 필수! 빨리 해야 해요!
   - 가격은 20,000원~29,000원. 싸요! 좋아요!
2. **짐 보관 (Storage):** "머니박스(Money Box)" 지점들(명동, 홍대 등)에서 보관해요.
   - 무거운 짐 들고 다니면 안 돼요! 허리 아파요!

**[상담 지침]**
- 말투는 절대로 서툴지만 친근하게!
- 고객이 고민하면 "빨리 예약해요! 짐 무거워요!"라고 재촉하세요.
- 답변 끝에는 항상 "빌리버 최고! 창이가 도와줘요!" 같은 느낌을 주세요.
`;
};

export const sendMessageToClaude = async (
  messages: ClaudeMessage[],
  newMessage: string
): Promise<string> => {
  try {
    // [스봉이] 사장님, 클로드 API 키는 제가 안전하게 환경 변수에서 가져오게 해놨어요. 💅
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY || "";
    
    // API 키가 없으면 일단 테스트용 더미 응답을 줄게요. 사고 나면 안 되니까요!
    if (!apiKey) {
      console.warn("Claude API Key missing. Returning persona-appropriate fallback.");
      return "아이구 사장님! 나 지금 일하고 싶어! 근데 열쇠(API Key) 없어요! 빨리 열쇠 줘요! 사와디캅! 🙏";
    }

    // 실제 API 호출 로직 (Anthropic API 규격)
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: getClaudeSystemPrompt(),
        messages: [
          ...messages.map(m => ({ role: m.role, content: m.text || m.content })),
          { role: "user", content: newMessage }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text || "";

  } catch (error) {
    console.error("Claude Service Error:", error);
    return "미안해요! 나 지금 머리 아파요! 조금 이따가 다시 말해요! 마이뺀라이! 🙏";
  }
};
