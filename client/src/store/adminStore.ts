import { create } from 'zustand';
import { AdminTab } from '../../types';

interface AdminStore {
    activeTab: AdminTab;
    setActiveTab: (tab: AdminTab) => void;
    activeStatusTab: string; // 'ALL' | 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'TODAY_IN' | 'STORAGE' | 'TODAY_OUT' | 'TRANSIT' | 'ARRIVED' | 'ISSUE';
    setActiveStatusTab: (tab: 'ALL' | 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED') => void;
    globalBranchFilter: string;
    setGlobalBranchFilter: (filter: string) => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
    activeTab: 'OVERVIEW',
    setActiveTab: (tab) => set({ activeTab: tab }),
    activeStatusTab: 'ALL',
    setActiveStatusTab: (tab) => set({ activeStatusTab: tab }),
    globalBranchFilter: 'ALL',
    setGlobalBranchFilter: (filter) => set({ globalBranchFilter: filter }),
}));
