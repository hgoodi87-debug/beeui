const admin = require("firebase-admin");
try {
  admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: "beeliber-main" });
  const db = admin.firestore();
  console.log("Success admin connect");
} catch(e) {
  console.log("Error", e.message);
}
