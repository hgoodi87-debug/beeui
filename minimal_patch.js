const fs = require('fs');
const path = require('path');

const distDir = path.join('client', 'dist', 'assets');
const files = fs.readdirSync(distDir);
const jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));

if (!jsFile) {
    console.error("No JS file found!");
    process.exit(1);
}

const filePath = path.join(distDir, jsFile);
console.log(`Processing: ${filePath}`);

let buffer = fs.readFileSync(filePath);
let content = buffer.toString('utf8');

// ONLY Text Replacements
let modified = false;

if (content.includes("Money Box")) {
    console.log("Replacing 'Money Box'...");
    content = content.replaceAll("Money Box", "Partner Branch");
    modified = true;
}
if (content.includes("Moneybox")) {
    console.log("Replacing 'Moneybox'...");
    content = content.replaceAll("Moneybox", "Partner Branch");
    modified = true;
}
if (content.includes("머니박스")) {
    console.log("Replacing '머니박스'...");
    content = content.replaceAll("머니박스", "파트너지점");
    modified = true;
}

if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Text patched successfully.");
} else {
    console.log("No text changes needed.");
}
