import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE", // 보안을 위해 환경변수나 관리자 콘솔에서 확인하세요. 💅
    authDomain: "bee-liber.com",
    projectId: "beeliber-main",
    storageBucket: "beeliber-main.firebasestorage.app",
    messagingSenderId: "591358308612",
    appId: "1:591358308612:web:fb3928d12b0e1bb000a051"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateBranchIds() {
    console.log("Starting branch ID migration: MBX-* to abbreviations...");

    const querySnapshot = await getDocs(collection(db, "locations"));
    const batch = writeBatch(db);

    const mapping = {
        'MBX-001': 'AGS', 'MBX-002': 'DDP', 'MBX-003': 'JNO', 'MBX-004': 'CMR',
        'MBX-005': 'SSU', 'MBX-006': 'GGS', 'MBX-007': 'MEC', 'MBX-008': 'YDO',
        'MBX-009': 'MD2', 'MBX-010': 'ITW', 'MBX-011': 'SRK', 'MBX-012': 'GNM',
        'MBX-013': 'NDM', 'MBX-014': 'ISD', 'MBX-015': 'HDA', 'MBX-016': 'MDD',
        'MBX-017': 'PTK', 'MBX-018': 'SDO', 'MBX-019': 'SWN', 'MBX-020': 'USO',
        'MBX-021': 'BPY', 'MBX-022': 'GPA', 'MBX-023': 'CWN', 'MBX-024': 'USS',
        'MBX-025': 'GAL', 'MBX-026': 'BSN', 'MBX-027': 'DGU', 'MBX-028': 'GHE',
        'MBX-029': 'NPO', 'MBX-030': 'HDE', 'MBX-031': 'JDM', 'MBX-032': 'JEJ',
        'MBX-033': 'GJU'
    };

    let count = 0;
    for (const snap of querySnapshot.docs) {
        const data = snap.data();
        const oldId = snap.id;

        if (mapping[oldId]) {
            const newId = mapping[oldId];
            console.log(`Migrating: ${oldId} (${data.name}) -> ${newId}`);

            const newDocRef = doc(db, "locations", newId);
            const oldDocRef = doc(db, "locations", oldId);

            const newData = { ...data, id: newId, shortCode: newId };
            batch.set(newDocRef, newData);
            batch.delete(oldDocRef);
            count++;
        }
    }

    if (count > 0) {
        await batch.commit();
        console.log(`Migration finished! Moved ${count} locations. ✨`);
    } else {
        console.log("No MBX locations found to migrate. 🙄");
    }
}

migrateBranchIds().catch(console.error);
