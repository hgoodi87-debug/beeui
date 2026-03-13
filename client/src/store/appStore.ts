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

const getBrowserLang = (): string => {
    // [스봉이] 브라우저 언어를 보고 알아서 딱딱 맞춰드리는 지능형 엔진 가동! 💅
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('en')) return 'en';
    if (browserLang.startsWith('ja')) return 'ja';
    if (browserLang.includes('hk')) return 'zh-HK';
    if (browserLang.includes('tw')) return 'zh-TW';
    if (browserLang.startsWith('zh')) return 'zh'; // zh-CN
    return 'ko'; // Default
};

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            lang: getBrowserLang(), // [스봉이] 초기 상태부터 브라우저 언어 감지!
            adminInfo: { name: '', jobTitle: '', branchId: '' },
            setLang: (lang) => set({ lang }),
            setAdminInfo: (adminInfo) => set({ adminInfo }),
            clearAdminInfo: () => set({ adminInfo: { name: '', jobTitle: '', branchId: '' } }),
        }),
        {
            name: 'beeliber-app-storage',
            partialize: (state) => ({
                lang: state.lang,
                adminInfo: state.adminInfo // [스봉이] 이제 모바일에서도 새로고침 걱정 마세요! 💅
            }),
        }
    )
);
