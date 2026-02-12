const fs = require('fs');
const path = require('path');

const validFiles = ['client/dist/index.html', 'client/dist/assets/index.html']; // Check both just in case
let targetFile = null;

for (const f of validFiles) {
    if (fs.existsSync(f)) {
        targetFile = f;
        break;
    }
}

if (!targetFile) {
    console.error("Could not find index.html in dist!");
    process.exit(1);
}

console.log(`Injecting CSS into ${targetFile}...`);
let content = fs.readFileSync(targetFile, 'utf8');

const css = `<style>button:has(.fa-bolt){display:none!important;}</style>`;

if (content.includes("button:has(.fa-bolt)")) {
    console.log("CSS already injected.");
} else {
    // Inject before </head>
    content = content.replace('</head>', `${css}</head>`);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log("CSS injected successfully.");
}
