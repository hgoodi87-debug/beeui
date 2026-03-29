import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously, setPersistence, browserLocalPersistence } from "firebase/auth";

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
const db = {} as any; // Firebase Firestore retired: runtime에서는 더 이상 DB를 초기화하지 않아요.
const storage = getStorage(app);
const auth = getAuth(app);

// Enable persistence so users don't have to log in every time
setPersistence(auth, browserLocalPersistence).catch(console.error);

// 2026-01-23: Enable anonymous auth to allow Storage uploads without explicit login
console.log("[Firebase] Initializing with Bucket:", firebaseConfig.storageBucket);

/**
 * Guarantees that the user is authenticated (anonymously) before proceeding.
 * Returns a promise that resolves once auth is ready.
 */
let _authReady: Promise<any> | null = null;
const waitForAuthInit = async (): Promise<any> => {
    if (_authReady) return _authReady;
    _authReady = (async () => {
        const { onAuthStateChanged } = await import('firebase/auth');
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user: any) => {
                unsubscribe();
                resolve(user);
            });
            // [스봉이] 2초 안에 안 오면 null로 진행 — 무한 대기 방지 💅
            setTimeout(() => resolve(null), 2000);
        });
    })();
    return _authReady;
};

export const ensureAuth = async (): Promise<any> => {
    // [스봉이] auth 초기화가 끝날 때까지 기다려야 기존 세션을 놓치지 않아요 💅
    const existingUser = await waitForAuthInit();

    // 이미 번듯하게 로그인되어 있다면 바로 보내주고요 💅
    const current = auth.currentUser || existingUser;
    if (current) {
        console.log("[Firebase] Existing user found:", current.uid);
        try {
            await current.getIdToken();
        } catch (tokenError) {
            console.warn("[Firebase] Existing user token refresh skipped:", tokenError);
        }
        return current;
    }

    try {
        console.log("[Firebase] No user found. Attempting Anonymous Sign-in... ☕");
        const cred = await signInAnonymously(auth);
        console.log("[Firebase] Anonymous Auth Success! Welcome, UID:", cred.user.uid);

        // [스봉이] 토큰이 준비되기 전에 후속 요청을 보내면 괜히 권한에 삐끗하거든요. 여기서 끝까지 받아옵니다. 💅
        await cred.user.getIdToken(true);
        await new Promise(r => setTimeout(r, 500));
        return cred.user;
    } catch (error: any) {
        console.error("[Firebase] Anonymous Authentication Failed! 🚨", error);
        if (error.code === 'auth/operation-not-allowed') {
            throw new Error("파이어베이스 콘솔에서 '익명 로그인(Anonymous Auth)'을 활성화해야 합니다! 💅");
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

export { app, db, storage, auth };
