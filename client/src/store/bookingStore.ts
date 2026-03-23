import { create } from 'zustand';
import { BookingState, Branch, ServiceType, BagSizes } from '../../types';

export interface PreSelectedBooking {
    pickupLocation: string;
    serviceType: ServiceType;
    date?: string;
    returnDate?: string;
    bagCounts?: BagSizes;
}

interface BookingStoreState {
    preSelectedBooking: PreSelectedBooking | null;
    lastBooking: BookingState | null;
    customerBranchCode: string | null;
    customerBranch: Branch | null;

    setPreSelectedBooking: (pre: PreSelectedBooking | null) => void;
    setLastBooking: (booking: BookingState | null) => void;
    setCustomerBranchCode: (code: string | null) => void;
    setCustomerBranch: (branch: Branch | null) => void;
    resetBooking: () => void;
}

export const useBookingStore = create<BookingStoreState>((set) => ({
    preSelectedBooking: null,
    lastBooking: null,
    customerBranchCode: null,
    customerBranch: null,

    setPreSelectedBooking: (pre) => set({ preSelectedBooking: pre }),
    setLastBooking: (booking) => set({ lastBooking: booking }),
    setCustomerBranchCode: (code) => set({ customerBranchCode: code }),
    setCustomerBranch: (branch) => set({ customerBranch: branch }),
    resetBooking: () => set({ preSelectedBooking: null, lastBooking: null }),
}));
