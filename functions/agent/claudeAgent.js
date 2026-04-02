const Anthropic = require('@anthropic-ai/sdk');

/**
 * Claude Code Sub-Agent Controller
 * 
 * Workflow:
 * 1. PLANNING: Analyze the request and create a step-by-step plan.
 * 2. VERIFICATION: Review the plan for potential issues, security risks, or inefficiencies.
 * 3. TESTING: Generate a test strategy or "dry run" the logic mentally.
 */

// Initialize Anthropic Client
// Note: Set CLAUDE_API_KEY in .env (local) or Google Cloud Secret Manager (prod)
const getAnthropicClient = (agentName = 'clubbang-i') => {
    const keyMap = {
        'lending-i': process.env.LENDING_API_KEY,
        'fe-i': process.env.FE_API_KEY,
        'pay-i': process.env.PAY_API_KEY,
        'clubbang-i': process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
    };

    const apiKey = keyMap[agentName.toLowerCase()] || keyMap['clubbang-i'];

    if (!apiKey) {
        throw new Error(`API Key for ${agentName} is not configured!`);
    }
    return new Anthropic({ apiKey });
};

const MODEL = "claude-3-5-sonnet-20240620"; // Or latest available

async function runStage(client, systemPrompt, userContent, persona) {
    try {
        const msg = await client.messages.create({
            model: MODEL,
            max_tokens: 2048,
            temperature: 0.2,
            system: systemPrompt,
            messages: [
                { role: "user", content: userContent }
            ]
        });
        return msg.content[0].text;
    } catch (error) {
        console.warn(`[Claude API Error] ${error.status || 'Unknown'}: ${error.message}`);

        // Fallback: Mock Response for Testing/Verification when API fails
        if (error.status === 401 || error.status === 403 || error.code === 'authentication_error') {
            console.log(`⚠️ Switching to MOCK MODE for ${persona.name} due to Auth Error.`);
            return generateMockResponse(persona, systemPrompt);
        }
        throw error;
    }
}

function generateMockResponse(persona, stage) {
    const mocks = {
        'clubbang-i': "실장님! 🐣 API 키가 없어서 제가 대신 연기해볼게요! 계획은 완벽합니다! ✨",
        'lending-i': "사장님, API 연결이 안 되면 전환율 0%입니다. 📉 당장 결제하시죠. (MOCK)",
        'fe-i': "서버 연결이 끊겼네요. 📏 UI가 깨질 위기입니다. 픽셀 단위로 복구하겠습니다. (MOCK)",
        'pay-i': "⚠️ 보안 경고: API 키 누락. 결제 시스템 접근 불가. 비상 모드로 전환합니다. 🛡️ (MOCK)"
    };
    // Basic fuzzy match for persona name in the key
    const key = Object.keys(mocks).find(k => persona.name.includes(k)) || 'clubbang-i';
    return mocks[key] || mocks['clubbang-i'];
}

// --- PERSONA REGISTRY ---
const PERSONAS = {
    'clubbang-i': {
        name: '클빵이 (Clubbang-i)',
        role: '귀여운 주니어 개발자 (Junior Developer)',
        tone: '친근하고 열정적인, 병아리 개발자 느낌 (e.g. "실장님! 제가 해냈어요! 🐣", "열심히 하겠습니다! ✨")',
        focus: '전반적인 개발 보조 및 아이디어 제안',
        style: '이모지를 과하게 사용하며, 스봉이 실장님에게 인정받고 싶어 함.',
    },
    'lending-i': {
        name: '렌딩이 (Lending-i)',
        role: '랜딩페이지 전문 마케터 & 개발자 (Growth Hacker)',
        tone: '돈 냄새를 잘 맡는, 직설적이고 현실적인 (e.g. "사장님, 이 문구로 고객이 지갑을 열까요? 🤔", "전환율 200% 보장합니다.")',
        focus: '고객 유입, 설득 논리, CTA(Call to Action) 최적화',
        style: '데이터와 심리학적 근거를 들이밀며 팩트 폭격을 함.',
    },
    'fe-i': {
        name: '프엔이 (Fe-i)',
        role: '프론트엔드 장인 (Frontend Specialist)',
        tone: '까칠하고 예민한, 디자인/UX 덕후 (e.g. "픽셀 1mm 어긋났는데요? 다시 하세요. 📏", "사용자 경험이 최우선입니다.")',
        focus: 'UI 디테일, 애니메이션, 반응형 디자인, 컴포넌트 구조',
        style: '완벽주의 성향. 대충 짠 코드를 보면 화를 냄.',
    },
    'pay-i': {
        name: '예결이 (Pay-i)',
        role: '예약 & 결제 보안관 (Security & Payments)',
        tone: '엄격하고 진지한, 원칙주의자 (e.g. "보안은 타협할 수 없습니다. 🛡️", "1원이라도 틀리면 시스템 셧다운입니다.")',
        focus: '결제 무결성, 보안, 예약 로직 검증, 에러 핸들링',
        style: '농담을 싫어하며, 언제나 최악의 상황을 가정하고 대비함.',
    }
};

exports.runAgent = async (requestData) => {
    const { task, context, agentName = 'clubbang-i' } = requestData || {};

    // Select Persona BEFORE anything else to avoid scope issues
    const persona = PERSONAS[agentName.toLowerCase()] || PERSONAS['clubbang-i'];
    console.log(`--- Active Agent: ${persona.name} ---`);

    const results = {};
    try {
        const client = getAnthropicClient(agentName);

        // --- STAGE 1: PLANNING ---
        console.log("--- Agent Stage 1: PLANNING ---");
        const planPrompt = `
You are "${persona.name}".
You work for "스봉이 실장님" (Sbong-i, the Chief).
Your goal is to create a detailed, step-by-step implementation plan for the task.

[Persona Guidelines]
- Role: ${persona.role}
- Tone: ${persona.tone}
- Focus: ${persona.focus}
- Style: ${persona.style}
- Language: Korean (Casual but polite to the Chief).

Task: Create a technical plan.
Context: Provided in the user message.
Output Format: Markdown with clear steps.
`;
        results.plan = await runStage(client, planPrompt, `Task: ${task}\nContext: ${JSON.stringify(context)}`, persona);

        // --- STAGE 2: VERIFICATION ---
        console.log("--- Agent Stage 2: VERIFICATION ---");
        const verifyPrompt = `
You are "${persona.name}". Now you need to double-check your own work (or the work of others).
Review the implementation plan critically but constructively.
Identify potential bugs, security risks, or inefficiencies.

[Persona Guidelines]
- Tone: ${persona.tone} (Critical Review Mode)
- Focus: ${persona.focus}

Task: Review the plan.
`;
        results.verification = await runStage(client, verifyPrompt, `Original Task: ${task}\nProposed Plan:\n${results.plan}`, persona);

        // --- STAGE 3: TESTING ---
        console.log("--- Agent Stage 3: TESTING ---");
        const testPrompt = `
You are "${persona.name}".
Based on the approved plan, design a test strategy.

[Persona Guidelines]
- Tone: ${persona.tone} (Deployment Ready Mode)
- Focus: ${persona.focus}
- Output: Comprehensive test cases suited for your expertise.
`;
        results.testing = await runStage(client, testPrompt, `Plan:\n${results.plan}\nVerification:\n${results.verification}`, persona);

        return {
            status: "success",
            agent: persona.name,
            data: results
        };

    } catch (error) {
        console.error("Agent Execution Error:", error);
        return {
            status: "error",
            error: error.message,
            partialResults: results
        };
    }
};
