import React, { useEffect, useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { BagSizes, ServiceType } from '../types';

const LocationsPage = lazy(() => import('./LocationsPage'));
const BookingPage = lazy(() => import('./BookingPage'));

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
    /** 미리 선택된 예약 데이터 (Locations → Booking 단계 전환용) */
    preSelectedBooking?: {
        pickupLocation?: string;
        serviceType: ServiceType;
        date?: string;
        returnDate?: string;
        bagCounts?: BagSizes;
    } | null;
    /** Locations에서 지점 선택 시 호출 — 외부 store에 preSelected 저장 후 step 전환 */
    onLocationSelect: (
        id: string,
        type: ServiceType,
        date?: string,
        returnDate?: string,
        bagCounts?: BagSizes
    ) => void;
}

type Step = 'locations' | 'booking';

/**
 * 데스크탑 전용 예약 플로우 팝업.
 * - 모바일에서는 사용하지 않음 (전체 화면 라우팅 유지)
 * - 내부 step 상태로 LocationsPage ↔ BookingPage 전환
 * - 결제 로직(handleBook, PayPal)은 BookingPage 내부에 그대로 유지
 */
const BookingFlowModal: React.FC<BookingFlowModalProps> = ({
    open,
    onClose,
    t,
    lang,
    onLangChange,
    user,
    onSuccess,
    initialServiceType,
    initialLocationId,
    bookingLocations,
    customerBranchId,
    customerBranchRates,
    preSelectedBooking,
    onLocationSelect,
}) => {
    const [step, setStep] = useState<Step>('locations');

    // 모달 열릴 때마다 첫 단계로 리셋
    useEffect(() => {
        if (open) setStep('locations');
    }, [open]);

    // Esc 키로 닫기
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    // body 스크롤 잠금
    useEffect(() => {
        if (!open) return;
        const orig = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = orig; };
    }, [open]);

    const handleSelectLocation = (
        id: string,
        type: ServiceType,
        date?: string,
        returnDate?: string,
        bagCounts?: BagSizes
    ) => {
        // 외부 store에 데이터 저장 (handleLocationSelect와 동일 로직)
        onLocationSelect(id, type, date, returnDate, bagCounts);
        // 모달 내부 다음 단계로 이동 (라우터 전환 없이)
        setStep('booking');
    };

    const handleBookingBack = () => {
        setStep('locations');
    };

    const handleBookingSuccess = async (booking: any) => {
        await onSuccess(booking);
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[200] hidden md:flex items-center justify-center p-6"
                    aria-modal="true"
                    role="dialog"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.98 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="relative w-full max-w-[1180px] h-[90vh] max-h-[860px] rounded-[28px] bg-white shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-7 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md flex-shrink-0">
                            <div className="flex items-center gap-3 text-sm font-black tracking-wide text-bee-black">
                                <span className={`flex items-center gap-1.5 ${step === 'locations' ? 'text-bee-black' : 'text-gray-400'}`}>
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${step === 'locations' ? 'bg-bee-yellow text-bee-black' : 'bg-gray-200 text-gray-500'}`}>1</span>
                                    {lang.startsWith('ko') ? '지점 선택' : 'Pick Branch'}
                                </span>
                                <span className="text-gray-300">›</span>
                                <span className={`flex items-center gap-1.5 ${step === 'booking' ? 'text-bee-black' : 'text-gray-400'}`}>
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${step === 'booking' ? 'bg-bee-yellow text-bee-black' : 'bg-gray-200 text-gray-500'}`}>2</span>
                                    {lang.startsWith('ko') ? '정보 & 결제' : 'Info & Payment'}
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                                aria-label="Close"
                            >
                                <X size={18} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Modal Body — flex-1 로 남은 영역 채우고 내부 스크롤 */}
                        <div className="flex-1 overflow-y-auto bg-gray-50">
                            <Suspense
                                fallback={
                                    <div className="flex h-full w-full items-center justify-center">
                                        <span className="h-8 w-8 animate-spin rounded-full border-2 border-bee-yellow border-t-transparent" />
                                    </div>
                                }
                            >
                                {step === 'locations' ? (
                                    <LocationsPage
                                        onBack={onClose}
                                        onSelectLocation={handleSelectLocation}
                                        t={t}
                                        lang={lang}
                                        onLangChange={onLangChange}
                                        user={user}
                                        initialLocationId={preSelectedBooking?.pickupLocation || initialLocationId}
                                        initialServiceType={(preSelectedBooking?.serviceType || initialServiceType) as string | undefined}
                                    />
                                ) : (
                                    <BookingPage
                                        t={t}
                                        lang={lang}
                                        locations={bookingLocations}
                                        initialLocationId={preSelectedBooking?.pickupLocation}
                                        initialServiceType={preSelectedBooking?.serviceType as ServiceType | undefined}
                                        initialDate={preSelectedBooking?.date}
                                        initialReturnDate={preSelectedBooking?.returnDate}
                                        initialBagSizes={preSelectedBooking?.bagCounts}
                                        onBack={handleBookingBack}
                                        onSuccess={handleBookingSuccess}
                                        user={user}
                                        customerBranchId={customerBranchId}
                                        customerBranchRates={customerBranchRates}
                                    />
                                )}
                            </Suspense>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BookingFlowModal;
