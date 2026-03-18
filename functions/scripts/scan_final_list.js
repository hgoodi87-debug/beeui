/**
 * 🔍 [스봉이] 최종 명단 스캐너 v1
 */
const admin = require("firebase-admin");

admin.initializeApp({
  projectId: "clean-bee-main-20240428"
});

const db = admin.firestore();

async function scanAdmins() {
  try {
    const snapshot = await db.collection("admins").get();
    console.log(`📊 [리포트] 현재 총 ${snapshot.size}명의 관리자가 등록되어 있습니다. 💅`);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.name || '이름없음'} (${data.role || '권한없음'}) / ID: ${doc.id}`);
    });

  } catch (error) {
    console.error("🚨 [실패] 스캔 중 오류 발생:", error);
  }
}

scanAdmins().then(() => process.exit(0));
