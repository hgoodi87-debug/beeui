import React, { lazy, Suspense } from 'react';
import { BagSizes, ServiceType } from '../types';

const MockupBookingFlow = lazy(() => import('./MockupBookingFlow'));

interface BookingFlowModalProps {
    open: boolean;
    onClose: () => void;
    t: any;
    lang: string;
    onLangChange: (lang: string) => void;
    user: any;
    onSuccess: (booking: any) => void | Promise<void>;
    initialServiceType?: ServiceType;
    initialLocationId?: string;
    bookingLocations: any[];
    customerBranchId?: string;
    customerBranchRates?: any;
    preSelectedBooking?: {
        pickupLocation?: string;
        serviceType: ServiceType;
        date?: string;
        returnDate?: string;
        bagCounts?: BagSizes;
    } | null;
    onLocationSelect: (
        id: string,
        type: ServiceType,
        date?: string,
        returnDate?: string,
        bagCounts?: BagSizes
    ) => void;
}

/**
 * 데스크탑 예약 플로우 — 목업 dwModal 이식 (MockupBookingFlow 위임)
 * 모바일에서는 사용하지 않음 (전체 화면 라우팅 유지)
 */
const BookingFlowModal: React.FC<BookingFlowModalProps> = ({
    open,
    onClose,
    user,
    onSuccess,
    initialServiceType,
    initialLocationId,
    bookingLocations,
    preSelectedBooking,
    lang,
}) => {
    return (
        <Suspense fallback={null}>
            <MockupBookingFlow
                open={open}
                onClose={onClose}
                user={user}
                onSuccess={onSuccess}
                initialServiceType={preSelectedBooking?.serviceType || initialServiceType}
                initialLocationId={preSelectedBooking?.pickupLocation || initialLocationId}
                locations={bookingLocations || []}
                lang={lang}
            />
        </Suspense>
    );
};

export default BookingFlowModal;
