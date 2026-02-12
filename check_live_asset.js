const fs = require('fs');
const https = require('https');
const path = require('path');

const fileUrl = 'https://bee-liber.com/assets/index-NpHih5-E.js';
const dest = path.join('client', 'downloaded_index.js');

console.log(`Downloading ${fileUrl}...`);

const file = fs.createWriteStream(dest);
https.get(fileUrl, function (response) {
    response.pipe(file);
    file.on('finish', function () {
        file.close(() => {
            console.log("Download complete.");
            const content = fs.readFileSync(dest, 'utf8');

            const hasMoneybox = content.includes("Moneybox") || content.includes("머니박스");
            const hasPartner = content.includes("Partner Branch") || content.includes("파트너지점");
            const hasDevBtn = content.includes("Dev Access");

            console.log(`Analyzing downloaded file (${content.length} bytes):`);
            console.log(`- Has 'Moneybox': ${hasMoneybox}`);
            console.log(`- Has 'Partner Branch': ${hasPartner}`);
            console.log(`- Has 'Dev Access': ${hasDevBtn}`);

            if (hasMoneybox && !hasPartner) {
                console.log("STATUS: CLEAN_OLD_VERSION (Safe to patch)");
            } else if (hasPartner && !hasMoneybox) {
                console.log("STATUS: PATCHED_VERSION (Likely corrupted or from my deployment)");
            } else {
                console.log("STATUS: UNKNOWN/MIXED");
            }
        });
    });
}).on('error', function (err) {
    fs.unlink(dest);
    console.error("Download failed:", err.message);
});
