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
    storageBucket: "beeliber-main.firebasestorage.app",
    messagingSenderId: "591358308612",
    appId: "1:591358308612:web:fb3928d12b0e1bb000a051"
};

// [스봉이] 빌드 시점에 환경 변수가 유실되는 사고를 막기 위해 직접 박아버렸어요! 💅✨
if (typeof window !== 'undefined') {
    console.log("🚀 [스봉이 리포트] 비리버 시스템 엔진 가동 중... 💅✨");
}

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
    // [스봉이] 이미 번듯하게 로그인되어 있다면 바로 보내주고요 💅
    if (auth.currentUser) {
        console.log("[Firebase] Existing user found:", auth.currentUser.uid);
        return auth.currentUser;
    }

    try {
        console.log("[Firebase] No user found. Attempting Anonymous Sign-in... ☕");
        const cred = await signInAnonymously(auth);
        console.log("[Firebase] Anonymous Auth Success! Welcome, UID:", cred.user.uid);

        // [스봉이] 토큰이 준비될 때까지 아주 잠깐만 기다려 주는 센스! ✨
        await new Promise(r => setTimeout(r, 500));
        return cred.user;
    } catch (error: any) {
        console.error("[Firebase] Anonymous Authentication Failed! 🚨", error);
        if (error.code === 'auth/operation-not-allowed') {
            throw new Error("파이버베이스 콘솔에서 '익명 로그인(Anonymous Auth)'을 활성화해야 합니다! 💅");
        }
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
