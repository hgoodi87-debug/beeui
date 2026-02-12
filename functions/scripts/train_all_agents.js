require('dotenv').config();
const claudeAgent = require('../agent/claudeAgent');
const fs = require('fs');
const path = require('path');

// Helper to get file content limited by lines
function readFile(filePath, maxLines = 150) {
    try {
        const fullPath = path.join(__dirname, '../../client', filePath);
        if (!fs.existsSync(fullPath)) return `[File not found: ${filePath}]`;
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        return lines.slice(0, maxLines).join('\n') + (lines.length > maxLines ? '\n... (truncated)' : '');
    } catch (e) {
        return `[Error reading ${filePath}: ${e.message}]`;
    }
}

const commonContext = {
    name: "Beeliber (Global Logistics & Travel Service)",
    stack: "React, Firebase, TypeScript, TailwindCSS",
    keyFiles: {
        "App.tsx": readFile('App.tsx'),
        "BookingPage.tsx": readFile('components/BookingPage.tsx'),
        "LocationsPage.tsx": readFile('components/LocationsPage.tsx'),
        "constants.ts": readFile('constants.ts')
    }
};

const curricula = {
    'lending-i': {
        focusFiles: ["LandingPage.tsx", "Hero.tsx", "MarketingConfig.ts"],
        mission: `랜딩페이지 전문가로서, 현재 페이지의 '전환율'과 '고객 유입 논리'를 분석하세요. 
        사용자가 '예약하기' 버튼을 누르고 싶게 만드는 핵심 소구점이 무엇인지, 마케팅 관점에서 개선할 점은 없는지 정리해서 보고하세요.`
    },
    'fe-i': {
        focusFiles: ["LocationsPage.tsx", "GlobalStyles.css", "BookingWidget.tsx"],
        mission: `프론트엔드 장인으로서, UI의 일관성과 반응형 구현 상태를 분석하세요. 
        컴포넌트의 재사용성이나 CSS 구조에서 '프엔이' 눈에 거슬리는(픽셀이 어긋나거나 비효율적인) 부분을 찾아내고 개선 방향을 제시하세요.`
    },
    'pay-i': {
        focusFiles: ["BookingPage.tsx", "PaymentService.ts", "ValidationUtils.ts"],
        mission: `결제/보안관으로서, 예약 데이터의 흐름과 결제 보안 로직을 분석하세요. 
        데이터 누락이나 결제 시 발생할 수 있는 에러 핸들링이 원칙대로 처리되고 있는지, 취약점은 없는지 매우 엄격하게 체크하여 보고하세요.`
    },
    'clubbang-i': {
        focusFiles: ["App.tsx", "utils.ts"],
        mission: `귀여운 주니어로서, 전체적인 프로젝트 구조를 파악하고 실장님이 시키는 일을 얼마나 잘 보조할 수 있는지 본인의 의지를 보여주세요. 
        가장 흥미로운 코드 한 조각을 찾아서 감상평을 남기세요.`
    }
};

async function trainAll() {
    console.log("🏙️ 스봉이 실장: 자! 신입들 다 모여봐. 교육 시작한다. (Sbong-i starting education...)\n");

    const agents = Object.keys(curricula);

    for (const agentName of agents) {
        console.log(`----------------------------------------------------------------`);
        console.log(`👨‍🏫 교육 중: ${agentName}...`);
        console.log(`----------------------------------------------------------------`);

        const curriculum = curricula[agentName];

        const taskDescription = `
[Position Education Mission]
이미 주어진 프로젝트 문맥을 분석하여, 본인의 포지션에 특화된 '학습 보고서'를 작성하세요.

본인의 역할: ${agentName}
중점 학습 과제: ${curriculum.mission}

보고서 포함 내용:
1. 본인 소개 및 포지션 선서 (실장님께 드리는 인사)
2. 담당 영역 코드 분석 결과
3. 본인 눈에 띄는 기술적 개선점 (포지션 특화 관점)
4. 앞으로의 각오

**IMPORTANT: Respond ENTIRELY in KOREAN (한국어).**
Use your assigned persona tone exactly.
`;

        try {
            const result = await claudeAgent.runAgent({
                task: taskDescription,
                context: commonContext,
                agentName: agentName
            });

            console.log(`[DEBUG] ${agentName} Response Status: ${result.status}`);

            if (result.status === 'success') {
                const reportPath = path.join(__dirname, `${agentName}_report.md`);
                // result.data.plan이 있으면 쓰고, 없으면 result.data 자체를 씀 (Mock 대응)
                const content = (result.data && result.data.plan) ? result.data.plan : JSON.stringify(result.data || result);
                fs.writeFileSync(reportPath, content);
                console.log(`✅ ${agentName} 교육 완료. 보고서: ${agentName}_report.md`);
            } else {
                console.error(`❌ ${agentName} 교육 실패:`, result.error || '알 수 없는 오류');
            }
        } catch (e) {
            console.error(`❌ ${agentName} 예외 발생:`, e.message);
        }
        console.log("\n");
    }

    console.log("✨ 훈화 말씀: 교육 끝! 다들 제자리로 가서 일해! (Education Finished!)");
}

trainAll();
