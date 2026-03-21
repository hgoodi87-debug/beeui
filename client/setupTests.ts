import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Firebase Mocking
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(),
    getApps: vi.fn(() => []),
    getApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => {
    const dbMock = { type: 'firestore' };
    const queryMock = { type: 'query' };
    const collectionMock = { type: 'collection' };
    return {
        getFirestore: vi.fn(() => dbMock),
        collection: vi.fn(() => collectionMock),
        doc: vi.fn(),
        getDoc: vi.fn(),
        getDocs: vi.fn(),
        setDoc: vi.fn(),
        addDoc: vi.fn(),
        updateDoc: vi.fn(),
        deleteDoc: vi.fn(),
        query: vi.fn(() => queryMock),
        where: vi.fn(),
        writeBatch: vi.fn(() => ({
            delete: vi.fn(),
            commit: vi.fn(() => Promise.resolve()),
        })),
        orderBy: vi.fn(),
        limit: vi.fn(),
        onSnapshot: vi.fn(),
        or: vi.fn(),
    };
});

vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(),
    ref: vi.fn(),
    uploadBytes: vi.fn(),
    getDownloadURL: vi.fn(),
}));

vi.mock('firebase/functions', () => ({
    getFunctions: vi.fn(() => ({
        httpsCallable: vi.fn(),
    })),
    httpsCallable: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({
        onAuthStateChanged: vi.fn(),
        currentUser: null,
    })),
    onAuthStateChanged: vi.fn(),
    signInAnonymously: vi.fn(() => Promise.resolve({ user: { uid: 'anonymous' } })),
    setPersistence: vi.fn(() => Promise.resolve()),
    browserLocalPersistence: 'browserLocalPersistence',
}));
