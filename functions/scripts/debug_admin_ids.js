const admin = require('firebase-admin');

admin.initializeApp({
  projectId: "beeliber-main" // [주의] 실제 프로젝트 ID가 다를 경우 여기서 수정하세요. 💅
});

const db = admin.firestore();

async function run() {
  const snap = await db.collection('admins').get();
  console.log('--- Admins Collection IDs ---');
  snap.forEach(doc => {
    console.log(`ID: ${doc.id} | Name: ${doc.data().name} | Role: ${doc.data().role}`);
  });
}

run().catch(console.error);
