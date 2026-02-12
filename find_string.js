const fs = require('fs');
const path = require('path');

const distDir = path.join('client', 'dist', 'assets');
const files = fs.readdirSync(distDir);
const jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));

if (!jsFile) {
    console.log("No JS file found");
    process.exit(1);
}

const content = fs.readFileSync(path.join(distDir, jsFile), 'utf8');

function printContext(term) {
    const idx = content.indexOf(term);
    if (idx === -1) {
        console.log(`Term '${term}' NOT found.`);
        // Try to find parts?
        return;
    }
    console.log(`Term '${term}' FOUND at index ${idx}.`);
    const start = Math.max(0, idx - 100);
    const end = Math.min(content.length, idx + 100);
    console.log("Context:");
    console.log(content.substring(start, end));
    console.log("---");
}

printContext("Dev Access");
printContext("개발자");
printContext("머니박스"); // Should be NOT found if replaced
printContext("파트너지점"); // Should be FOUND if replaced
