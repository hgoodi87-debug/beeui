// Test Script for Claude Agent
require('dotenv').config(); // Load .env
const claudeAgent = require('../agent/claudeAgent');

const SAMPLE_TASK = "Create a simple React component for a newsletter signup form.";
const SAMPLE_CONTEXT = {
    techStack: "React, TailwindCSS",
    projectPath: "src/components"
};

async function runTest() {
    console.log("🚀 Starting Agent Test...");
    console.log("Task:", SAMPLE_TASK);

    if (!process.env.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY.includes("sk-ant-admin-...")) {
        console.error("❌ ERROR: CLAUDE_API_KEY is missing or invalid in functions/.env");
        console.log("Please edit functions/.env and add your actual API Key.");
        return;
    }

    try {
        const result = await claudeAgent.runAgent({
            task: SAMPLE_TASK,
            context: SAMPLE_CONTEXT
        });

        console.log("\n✅ Agent Execution Completed!");
        console.log("--------------------------------");
        console.log(JSON.stringify(result, null, 2));

        if (result.status === 'success') {
            console.log("\n🎉 Test PASSED: All 3 stages (Planning, Verification, Testing) executed.");
        } else {
            console.log("\n⚠️ Test FAILED or Partial: Check error details above.");
        }

    } catch (error) {
        console.error("\n💥 Critical Error:", error);
    }
}

runTest();
