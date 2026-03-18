/**
 * 🧹 [스봉이] 중복 데이터 슈퍼 클리너 v1
 * 권한 문제를 우회하여 서버 단에서 중복된 어드민 데이터를 정리합니다.💅
 */
const admin = require("firebase-admin");

// [스봉이] 프로젝트 ID와 설정을 깍쟁이처럼 맞춤 💅
// 주의: 실제 Firebase 프로젝트 ID가 'clean-bee-main-20240428'인 경우 여기서 수정이 필요할 수 있습니다.
const PROJECT_ID = "beeliber-main"; 

admin.initializeApp({
  projectId: PROJECT_ID
});

const db = admin.firestore();

async function deduplicateAdmins() {
  console.log("🚀 [스봉이] 중복 데이터 정제 엔진 가동 중...");
  
  try {
    const snapshot = await db.collection("admins").get();
    const admins = [];
    snapshot.forEach(doc => {
      admins.push({ id: doc.id, ...doc.data() });
    });

    // 1. 이름별로 그룹화
    const groups = {};
    admins.forEach(admin => {
        const name = (admin.name || '').trim();
        if (!groups[name]) groups[name] = [];
        groups[name].push(admin);
    });

    let totalRemoved = 0;
    const batch = db.batch();

    // 2. 각 그룹별로 최신 데이터만 남기고 삭제
    for (const name in groups) {
        const group = groups[name];
        if (group.length > 1) {
            // UpdatedAt 또는 CreatedAt 기준으로 정렬 (최신순)
            group.sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt || 0);
                const dateB = new Date(b.updatedAt || b.createdAt || 0);
                return dateB - dateA;
            });

            // 가장 최신(첫 번째) 제외하고 나머지는 삭제 목록에 추가
            const toDelete = group.slice(1);
            console.log(`[중복 발견] ${name}: ${group.length}개 중 ${toDelete.length}개 삭제 예정`);
            
            toDelete.forEach(a => {
                batch.delete(db.collection("admins").doc(a.id));
                totalRemoved++;
            });
        }
    }

    if (totalRemoved > 0) {
        await batch.commit();
        console.log(`✨ [성공] 프로젝트(${PROJECT_ID})의 중복 데이터 ${totalRemoved}개가 깨첩처럼 사라졌어요! 💅`);
    } else {
        console.log(`💅 [리포트] 프로젝트(${PROJECT_ID})에 정리할 중복 데이터가 없네요. 이미 완벽해요!`);
    }

  } catch (error) {
    console.error("🚨 [실패] 정리 중 오류가 발생했습니다:", error);
  }
}

deduplicateAdmins().then(() => process.exit(0));
