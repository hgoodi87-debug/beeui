const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "beeliber-main"
});

const db = admin.firestore();
const API_KEY = "AIzaSyCWCnernI5QA1UGRI080vjlzBEVpevAzt0";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

async function translateLocationData(data) {
  const prompt = `
    Translate the following Korean location information into English (en), Japanese (ja), and Simplified Chinese (zh).
    Provide the result in a strict JSON format with the following keys:
    {
      "name_en": "...", "name_ja": "...", "name_zh": "...",
      "address_en": "...", "address_ja": "...", "address_zh": "...",
      "pickupGuide_en": "...", "pickupGuide_ja": "...", "pickupGuide_zh": "...",
      "description_en": "...", "description_ja": "...", "description_zh": "..."
    }

    Korean Data:
    Name: ${data.name || ''}
    Address: ${data.address || ''}
    Pickup Guide: ${data.pickupGuide || ''}
    Description: ${data.description || ''}
  `;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const result = await response.json();
    if (!result.candidates || !result.candidates[0]) {
      throw new Error("Invalid response from Gemini API");
    }
    const translatedText = result.candidates[0].content.parts[0].text;
    return JSON.parse(translatedText);
  } catch (e) {
    console.error(`[Storage] AI Translation Failed for ${data.name}:`, e);
    throw e;
  }
}

async function main() {
  console.log("Fetching locations from Firestore...");
  const snapshot = await db.collection("locations").get();
  let count = 0;

  for (const doc of snapshot.docs) {
    const loc = doc.data();

    // Check if it has an address but missing translations
    if (loc.address && (!loc.address_en || !loc.address_ja || !loc.address_zh)) {
      console.log(`[스봉이] '${loc.name}' 데이터 분석 및 번역 요청... ✨`);
      try {
        const result = await translateLocationData({
          name: loc.name,
          address: loc.address,
          pickupGuide: loc.pickupGuide || "",
          description: loc.description || ""
        });

        console.log(`[스봉이] '${loc.name}' 번역 완료, Firestore 저장 중... 💅`);
        await db.collection("locations").doc(doc.id).update({
          address_en: loc.address_en || result.address_en || "",
          address_ja: loc.address_ja || result.address_ja || "",
          address_zh: loc.address_zh || result.address_zh || "",
          name_en: loc.name_en || result.name_en || "",
          name_ja: loc.name_ja || result.name_ja || "",
          name_zh: loc.name_zh || result.name_zh || "",
          description_en: loc.description_en || result.description_en || "",
          description_ja: loc.description_ja || result.description_ja || "",
          description_zh: loc.description_zh || result.description_zh || "",
          pickupGuide_en: loc.pickupGuide_en || result.pickupGuide_en || "",
          pickupGuide_ja: loc.pickupGuide_ja || result.pickupGuide_ja || "",
          pickupGuide_zh: loc.pickupGuide_zh || result.pickupGuide_zh || "",
        });
        count++;
      } catch (e) {
        console.error(`[스봉이] 실패: ${loc.name} ->`, e.message);
      }
      
      // small delay to prevent rate limit
      await new Promise(r => setTimeout(r, 1000));
    } else {
       // console.log(`[스봉이] '${loc.name}' 이미 번역 완료됨. 패스~ 🍷`);
    }
  }

  console.log(`\n총 ${count}개 지점의 다국어 정보 보완이 완료되었습니다! 💅✨`);
}

main().catch(console.error);
