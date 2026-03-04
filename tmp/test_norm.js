
const normalize = (str) => (str || '').replace(/\s+/g, '').toLowerCase().normalize('NFC');

const dbName = "천명";
const inputName = "천명";

console.log("DB Name:", dbName, Buffer.from(dbName, 'utf8'));
console.log("Input Name:", inputName, Buffer.from(inputName, 'utf8'));
console.log("Normalized DB:", normalize(dbName), Buffer.from(normalize(dbName), 'utf8'));
console.log("Normalized Input:", normalize(inputName), Buffer.from(normalize(inputName), 'utf8'));
console.log("Match:", normalize(dbName) === normalize(inputName));

const dbPass = "8684";
const inputPass = "8684";
console.log("Pass Match:", String(dbPass).trim() === String(inputPass).trim());
