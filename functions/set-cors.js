const admin = require('firebase-admin');
const fs = require('fs');

console.log("Initializing Firebase Admin to configure Storage CORS...");
try {
    admin.initializeApp({
        storageBucket: "beeliber-main.firebasestorage.app"
    });

    const bucket = admin.storage().bucket();
    const corsConfigPath = require('path').resolve(__dirname, '../cors.json');
    const corsConfig = JSON.parse(fs.readFileSync(corsConfigPath, 'utf8'));

    bucket.setCorsConfiguration(corsConfig)
        .then(() => {
            console.log("CORS configured successfully via Admin SDK!");
        })
        .catch((error) => {
            console.error("Could not configure CORS due to missing local GCP credentials.");
            console.error("Please run this command in GCP Cloud Shell instead:");
            console.error("gsutil cors set cors.json gs://beeliber-main.firebasestorage.app");
        });
} catch (e) {
    console.error("Script error:", e);
}
