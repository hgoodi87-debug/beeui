const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'translations_split');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

const requiredKeys = ['pain:', 'howitworks:', 'trust:', 'pricing:', 'reviews_section:', 'final_cta:'];

files.forEach(file => {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const missing = requiredKeys.filter(key => {
        // Find if the key exists at the top level or object level (usually indented with 4 spaces)
        return !content.includes(`    ${key}`);
    });

    if (missing.length > 0) {
        console.log(`[!] ${file} is missing:`, missing);
    } else {
        console.log(`[OK] ${file}`);
    }
});
