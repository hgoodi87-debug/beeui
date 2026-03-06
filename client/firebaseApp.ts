import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFunctions } from "firebase/functions";

const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "beeliber-main.firebasestorage.app";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
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
export const ensureAuth = async (): Promise<any> => {
    if (auth.currentUser) return auth.currentUser;

    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("인증 시간이 초가되었습니다. 보안 연결(HTTPS)이나 승인된 도메인 설정을 확인해주세요.")), 10000)
    );

    try {
        console.log("[Firebase] Attempting to ensure auth...");
        const authPromise = new Promise((resolve, reject) => {
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                if (user) resolve(user);
                else {
                    signInAnonymously(auth)
                        .then(cred => resolve(cred.user))
                        .catch(reject);
                }
            }, reject);
        });

        return await Promise.race([authPromise, timeoutPromise]);
    } catch (error) {
        console.error("[Firebase] ensureAuth Failed:", error);
        throw error;
    }
};

// [스봉이] 부팅 시 즉시 인증 시도하는 대신, 필요한 시점에 ensureAuth를 호출하세요! 🛡️
// signInAnonymously(auth).then((user) => {
//     console.log("[Firebase] Anonymous Auth Success:", user.user.uid);
// }).catch((error) => {
//     console.error("Firebase Anonymous Auth Failed:", error);
// });

export { app, db, storage, auth, functions };
