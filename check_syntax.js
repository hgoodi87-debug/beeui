const fs = require('fs');
const https = require('https');
const path = require('path');
const { exec } = require('child_process');

const fileUrl = 'https://bee-liber.com/assets/index-NpHih5-E.js';
const dest = path.join('client', 'debug_live.js');

console.log(`Downloading ${fileUrl}...`);

const file = fs.createWriteStream(dest);
https.get(fileUrl, function (response) {
    response.pipe(file);
    file.on('finish', function () {
        file.close(() => {
            console.log("Download complete. Checking syntax...");
            exec(`node -c "${dest}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Syntax Error Detected:\n${stderr}`);
                } else {
                    console.log("Syntax Check Passed (File is valid JS).");
                }
            });
        });
    });
}).on('error', (err) => {
    console.error("Download failed:", err);
});
