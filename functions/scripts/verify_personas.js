const claudeAgent = require('../agent/claudeAgent');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const agents = ['clubbang-i', 'lending-i', 'fe-i', 'pay-i'];
const task = "User wants to implement a 'Quick Payment' button on the checkout page.";

async function run() {
    console.log("🚀 Starting Persona Verification Test...\n");

    for (const agent of agents) {
        console.log(`----------------------------------------------------------------`);
        console.log(`🤖 Testing Agent: ${agent}`);
        console.log(`----------------------------------------------------------------`);

        try {
            const start = Date.now();
            const result = await claudeAgent.runAgent({
                task,
                context: { description: "A simple e-commerce checkout flow." },
                agentName: agent
            });
            const duration = ((Date.now() - start) / 1000).toFixed(1);

            if (result.status === 'success') {
                console.log(`✅ Success (${duration}s)`);
                console.log(`\n[Plan Preview - Check Tone]`);
                // Extract first few lines of the plan to verify tone
                const preview = result.data.plan.split('\n').filter(line => line.trim().length > 0).slice(0, 5).join('\n');
                console.log(preview);
            } else {
                console.error(`❌ Failed:`, result.error);
            }
            console.log("\n");
        } catch (e) {
            console.error(`❌ Exception for ${agent}:`, e.message);
        }
    }
}

run();
