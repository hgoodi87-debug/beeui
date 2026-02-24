import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdminInfo {
    name: string;
    jobTitle: string;
    branchId: string;
}

interface AppState {
    lang: string;
    adminInfo: AdminInfo;
    setLang: (lang: string) => void;
    setAdminInfo: (info: AdminInfo) => void;
    clearAdminInfo: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            lang: 'ko',
            adminInfo: { name: '', jobTitle: '', branchId: '' },
            setLang: (lang) => set({ lang }),
            setAdminInfo: (adminInfo) => set({ adminInfo }),
            clearAdminInfo: () => set({ adminInfo: { name: '', jobTitle: '', branchId: '' } }),
        }),
        {
            name: 'beeliber-app-storage',
            partialize: (state) => ({ lang: state.lang }), // Only persist lang to localStorage mapping
        }
    )
);
