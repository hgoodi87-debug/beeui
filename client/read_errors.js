const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/dbcjs/Desktop/beeliber/beeliber/beeliber-main-main/beeliber-main/client/tsc_errors.txt';
try {
    const content = fs.readFileSync(filePath, 'utf16le');
    console.log('--- TSC ERRORS ---');
    console.log(content);
    console.log('-------------------');
} catch (e) {
    console.error('Failed to read file:', e);
}
