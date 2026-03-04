
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-adminsdk.json"); // I don't know where this is, let's look for any key file.

// or try to use default credentials if available
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: "beeliber-main"
});

const db = admin.firestore();

async function checkAdmins() {
    const snapshot = await db.collection('admins').get();
    if (snapshot.empty) {
        console.log("No admins found in Firestore.");
        return;
    }
    snapshot.forEach(doc => {
        console.log(`Admin ID: ${doc.id}, Name: "${doc.data().name}", Job: ${doc.data().jobTitle}, Password: "${doc.data().password}"`);
    });
}

checkAdmins().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
