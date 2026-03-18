// Script to "Train" Clubbang-i on the current project context
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const claudeAgent = require('../agent/claudeAgent');
const fs = require('fs');
const path = require('path');

// Helper to get file content limited by lines
function readFile(filePath, maxLines = 100) {
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

async function trainAgent() {
    console.log("🏫 스봉이: 자, 클빵아. 우리 프로젝트 공부 좀 하자. (Scanning Project...)");

    try {
        // 1. Collect Project Context
        const projectStructure = {
            name: "Beeliber (Global Logistics & Travel Service)",
            stack: "React, Firebase, TypeScript, Ant Design",
            docs: [
                "User wants all output in Korean.",
                "Persona: Clubbang-i (Cute Junior Developer)",
                "Chief: Sbong-i (You report to him)"
            ],
            keyFiles: {
                "package.json": readFile('../package.json', 50),
                "App.tsx": readFile('App.tsx', 100),
                "BookingPage.tsx": readFile('components/BookingPage.tsx', 100),
                "LocationsPage.tsx": readFile('components/LocationsPage.tsx', 100),
                "constants.ts": readFile('constants.ts', 100)
            }
        };

        const taskDescription = `
[Training Mission]
Analyze the provided project structure and key files.
1. Identify the core business logic (what does this app do?).
2. Understand the tech stack and key components.
3. Introduce yourself as "Clubbang-i" and summarize what you've learned to Sbong-i (Chief).
4. Point out one cool feature you found in the code.

**IMPORTANT: Respond ENTIRELY in KOREAN (한국어).**
Use your persona (Junior, Energetic, Emoji-loving).

Output Format:
- Greeting (실장님! 저 왔어요! 🐣)
- Project Summary (Core Features)
- Tech Stack Analysis
- "My Favorite Code Part"
`;


        const result = await claudeAgent.runAgent({
            task: taskDescription,
            context: projectStructure
        });

        if (!result || !result.data || !result.data.plan) {
          console.error("🚨 [스봉이] 클빵이가 분석 결과를 제대로 안 가져왔네요! (Result missing data.plan)");
          console.log("Full Result:", JSON.stringify(result, null, 2));
          throw new Error("Analysis failed: No plan generated.");
        }

        const reportPath = path.join(__dirname, 'clubbang_report.md');
        const reportContent = result.data.plan;

        fs.writeFileSync(reportPath, reportContent);
        console.log(`\n✅ Report saved to ${reportPath}`);

    } catch (error) {
        const errorPath = path.join(__dirname, 'error.log');
        const errorMsg = `[Timestamp: ${new Date().toISOString()}] Training Failed:\n${error.stack || error.message}\n`;
        fs.writeFileSync(errorPath, errorMsg);
        console.error("Training Failed. Check error.log");
        process.exit(1);
    }
}

trainAgent();
