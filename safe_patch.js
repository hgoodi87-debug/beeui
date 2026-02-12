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

// Read as buffer to preserve encoding perfectly
let buffer = fs.readFileSync(filePath);
let content = buffer.toString('utf8');

// 1. Additional Moneybox replacements (English)
if (content.includes("Money Box")) {
    console.log("Replacing 'Money Box' with 'Partner Branch'...");
    content = content.replaceAll("Money Box", "Partner Branch");
}
if (content.includes("Moneybox")) {
    console.log("Replacing 'Moneybox' with 'Partner Branch'...");
    content = content.replaceAll("Moneybox", "Partner Branch");
}
if (content.includes("머니박스")) {
    console.log("Replacing '머니박스' with '파트너지점'...");
    content = content.replaceAll("머니박스", "파트너지점");
}

// 2. Hide Developer Button
// Target suffix of the class string + start of children with specific icon
// Use the exact string found in the file investigation
const targetSig = 'justify-center gap-2",children:[v.jsx("i",{className:"fa-solid fa-bolt';
const replaceSig = 'justify-center gap-2 hidden",children:[v.jsx("i",{className:"fa-solid fa-bolt';

if (content.includes(targetSig)) {
    console.log("Hiding Developer Button (injecting hidden class)...");
    content = content.replace(targetSig, replaceSig);
} else {
    if (content.includes('justify-center gap-2 hidden",children:[v.jsx("i",{className:"fa-solid fa-bolt')) {
        console.log("Developer Button already hidden.");
    } else {
        console.warn("Could not find Developer Button signature!");
        // Fallback: try to just empty the text
        if (content.includes(" (Dev Access)")) {
            console.log("Fallback: Removing '(Dev Access)' text...");
            content = content.replace(" (Dev Access)", "");
        }
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Patch applied successfully.");
