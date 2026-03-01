import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFunctions } from "firebase/functions";

const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "beeliber-main.firebasestorage.app";

const firebaseConfig = {
    apiKey: "AIzaSyCWCnernI5QA1UGRI080vjlzBEVpevAzt0",
    authDomain: "beeliber-main.firebaseapp.com",
    projectId: "beeliber-main",
    storageBucket: storageBucket,
    messagingSenderId: "591358308612",
    appId: "1:591358308612:web:fb3928d12b0e1bb000a051"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const functions = getFunctions(app, "us-central1"); // Keep region consistent with backend

// Enable persistence so users don't have to log in every time
setPersistence(auth, browserLocalPersistence).catch(console.error);

// 2026-01-23: Enable anonymous auth to allow Storage uploads without explicit login
console.log("[Firebase] Initializing with Bucket:", firebaseConfig.storageBucket);

/**
 * Guarantees that the user is authenticated (anonymously) before proceeding.
 * Returns a promise that resolves once auth is ready.
 */
export const ensureAuth = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        if (auth.currentUser) {
            resolve(auth.currentUser);
            return;
        }

        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                unsubscribe();
                resolve(user);
            }
        }, reject);

        // Fallback: trigger sign in if nothing happens
        signInAnonymously(auth).catch(reject);
    });
};

// [스봉이] 부팅 시 즉시 인증 시도하는 대신, 필요한 시점에 ensureAuth를 호출하세요! 🛡️
// signInAnonymously(auth).then((user) => {
//     console.log("[Firebase] Anonymous Auth Success:", user.user.uid);
// }).catch((error) => {
//     console.error("Firebase Anonymous Auth Failed:", error);
// });

export { app, db, storage, auth, functions };
