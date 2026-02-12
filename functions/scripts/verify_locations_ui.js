const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const claudeAgent = require('../agent/claudeAgent');
const fs = require('fs');

async function verifyByClubbang() {
    console.log("🐣 클빵이: 실장님! 제가 UI 수정 상태 꼼꼼하게 확인해볼게요! ✨");

    const filePath = path.join(__dirname, '../../client/components/LocationsPage.tsx');
    const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : "[File Missing]";

    const task = `
최근 LocationsPage.tsx에 적용된 UI 변경 사항을 검증해 주세요.

[중점 검증 사항]
1. 모바일 버전에서 검색창 아래의 서비스 선택 버튼(배송/보관)이 맨 앞으로 오고 중앙 정렬되었는지 확인.
2. 지도상의 지점 마커 배지와 내 위치 마커가 빨간색(#FF0000)으로 정확히 변경되었는지 확인.
3. 코드 구조상 결함이 없는지, 주니어 개발자의 시각에서 실장님께 보고하세요.

**IMPORTANT: Respond ENTIRELY in KOREAN (한국어).**
클빵이 특유의 귀여운 톤을 유지하세요. ✨🐣
`;

    try {
        const result = await claudeAgent.runAgent({
            task: task,
            context: {
                fileName: "LocationsPage.tsx",
                contentSummary: content.slice(0, 2000) // Truncated for safety
            },
            agentName: 'clubbang-i'
        });

        if (result.status === 'success') {
            const reportPath = path.join(__dirname, 'clubbang_ui_check_report.md');
            fs.writeFileSync(reportPath, result.data.plan);
            console.log("✅ 클빵이의 검증 완료! 보고서 확인하세요: clubbang_ui_check_report.md");
        } else {
            console.error("❌ 클빵이가 긴장했나봐요... 교육 실패:", result.error);
        }
    } catch (e) {
        console.error("💥 예외 발생:", e.message);
    }
}

verifyByClubbang();
