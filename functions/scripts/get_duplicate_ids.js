/**
 * 🔍 [스봉이] 중복 ID 추출기 v1
 */
const admin = require("firebase-admin");

admin.initializeApp({
  projectId: "clean-bee-main-20240428"
});

const db = admin.firestore();

async function getDuplicateIds() {
  try {
    const snapshot = await db.collection("admins").get();
    const admins = [];
    snapshot.forEach(doc => {
      admins.push({ id: doc.id, ...doc.data() });
    });

    const groups = {};
    admins.forEach(admin => {
        const name = (admin.name || '').trim();
        if (!groups[name]) groups[name] = [];
        groups[name].push(admin);
    });

    const idsToDelete = [];
    for (const name in groups) {
        const group = groups[name];
        if (group.length > 1) {
            group.sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt || 0);
                const dateB = new Date(b.updatedAt || b.createdAt || 0);
                return dateB - dateA;
            });
            const toDelete = group.slice(1);
            toDelete.forEach(a => idsToDelete.push(a.id));
        }
    }

    // [스봉이] ID를 표준 출력으로 내보내서 쉘에서 쓸 수 있게 합니다 💅
    console.log(idsToDelete.join('\n'));

  } catch (error) {
    process.exit(1);
  }
}

getDuplicateIds().then(() => process.exit(0));
