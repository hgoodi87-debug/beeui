
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookingState, BookingStatus, ServiceType } from '../types';
import { StorageService } from '../services/storageService';
import { ChevronLeft, Search, Package, MapPin, Clock, CreditCard, X, AlertCircle, Trash2, Sparkles, ArrowRight } from 'lucide-react';

interface UserTrackingPageProps {
    onBack: () => void;
    t: any;
    lang: string;
}

import BookingModal from './BookingModal';

const UserTrackingPage: React.FC<UserTrackingPageProps> = ({ onBack, t, lang }) => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [bookings, setBookings] = useState<BookingState[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<BookingState | null>(null);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!name.trim() || !email.trim()) {
            alert(t.booking.alert_fill_info);
            return;
        }
        setIsSearching(true);
        try {
            const results = await StorageService.searchBookingsByNameAndEmail(name, email);
            setBookings(results.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()));
            setHasSearched(true);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const isModificationLocked = (booking: BookingState) => {
        if (!booking.pickupDate) return true;

        const today = new Date();
        // Reset time to start of day for accurate compassion
        today.setHours(0, 0, 0, 0);

        const pickup = new Date(booking.pickupDate);
        // Ensure pickup is also treated as start of day (input is YYYY-MM-DD)
        pickup.setHours(0, 0, 0, 0);

        // Lock if today is same as or after pickup date
        return today.getTime() >= pickup.getTime();
    };

    const handleEditClick = (booking: BookingState) => {
        if (isModificationLocked(booking)) {
            alert(t.tracking_page.alert_modification_locked || "Bookings cannot be modified on the day of service or later.");
            return;
        }
        setSelectedBooking(booking);
        setShowEditModal(true);
    };

    const handleCancelClick = (booking: BookingState) => {
        if (isModificationLocked(booking)) {
            alert(t.tracking_page.alert_cancellation_locked || "Bookings cannot be cancelled on the day of service or later.");
            return;
        }
        setSelectedBooking(booking);
        setShowRefundModal(true);
    };

    const confirmCancel = async () => {
        if (!selectedBooking?.id) return;
        setIsCancelling(true);
        try {
            await StorageService.cancelBooking(selectedBooking.id);
            alert(t.refund.alert_cancel_success);
            setShowRefundModal(false);
            // Refresh search
            handleSearch();
        } catch (error) {
            alert(t.refund.alert_cancel_error);
        } finally {
            setIsCancelling(false);
        }
    };

    const getStatusStep = (status?: BookingStatus) => {
        switch (status) {
            case BookingStatus.CONFIRMED: return 1;
            case BookingStatus.PENDING: return 2;
            case BookingStatus.STORAGE:
            case BookingStatus.TRANSIT: return 3;
            case BookingStatus.ARRIVED: return 4;
            case BookingStatus.COMPLETED: return 5;
            default: return 0;
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <button onClick={onBack} title={t.tracking?.go_back || "Go Back"} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-black tracking-tight">{t.tracking_page.title}</h1>
                <div className="w-10" /> {/* Spacer */}
            </header>

            <main className="max-w-4xl mx-auto px-6 pt-12">
                {/* Search Form */}
                <section className="bg-white rounded-[32px] shadow-xl p-8 md:p-12 mb-12">
                    <div className="mb-8 text-center md:text-left">
                        <h2 className="text-2xl font-black mb-2">{t.tracking_page.title}</h2>
                        <p className="text-gray-500 font-bold">{t.tracking_page.subtitle}</p>
                    </div>

                    <form onSubmit={handleSearch} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                                    {t.booking.name}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder={t.tracking?.name_placeholder || 'Name'}
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-bee-yellow rounded-2xl p-4 pl-12 text-sm font-bold outline-none transition-all"
                                    />
                                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                                    {t.booking.email}
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={t.tracking?.placeholder || 'Email'}
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-bee-yellow rounded-2xl p-4 pl-12 text-sm font-bold outline-none transition-all"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400">@</div>
                                </div>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isSearching}
                            className="w-full py-5 bg-bee-black text-bee-yellow rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            {isSearching ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                    <Search className="w-5 h-5" />
                                </motion.div>
                            ) : (
                                <Search className="w-5 h-5" />
                            )}
                            {t.tracking_page.search_btn}
                        </button>
                    </form>
                </section>

                {/* Results */}
                {hasSearched && (
                    <div className="space-y-8 animate-fade-in">
                        {bookings.length > 0 ? (
                            bookings.map((booking) => (
                                <div key={booking.id} className="bg-white rounded-[32px] shadow-lg overflow-hidden border border-gray-100">
                                    <div className="p-6 md:p-8">
                                        {/* Top Header */}
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black text-bee-yellow bg-bee-black px-2 py-0.5 rounded">
                                                        {booking.serviceType === ServiceType.DELIVERY ? t.booking.delivery : t.booking.storage}
                                                    </span>
                                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{booking.id}</span>
                                                </div>
                                                <h3 className="text-xl font-black">{booking.pickupDate} {t.tracking?.status_suffix || ''}</h3>
                                            </div>
                                            <div className={`px-5 py-2 rounded-full text-xs font-black ${booking.status === BookingStatus.CANCELLED ? 'bg-red-50 text-red-500' : 'bg-bee-yellow text-bee-black'
                                                }`}>
                                                {t.status_mapping[booking.status || ''] || booking.status}
                                            </div>
                                        </div>

                                        {/* Progress Bar (Only for non-cancelled) */}
                                        {booking.status !== BookingStatus.CANCELLED && booking.status !== BookingStatus.REFUNDED && (
                                            <div className="mb-12">
                                                <div className="flex justify-between mb-4">
                                                    {[
                                                        { label: t.tracking?.status_1 || t.tracking_page?.status_1, step: 1 },
                                                        { label: t.tracking?.status_2 || t.tracking_page?.status_2, step: 2 },
                                                        { label: t.tracking?.status_3 || t.tracking_page?.status_3, step: 3 },
                                                        { label: t.tracking?.status_4 || t.tracking_page?.status_4, step: 4 },
                                                        { label: t.tracking?.status_5 || t.tracking_page?.status_5, step: 5 }
                                                    ].map((s) => (
                                                        <div key={s.step} className="flex flex-col items-center gap-2">
                                                            <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${getStatusStep(booking.status) >= s.step ? 'bg-bee-yellow' : 'bg-gray-200'
                                                                }`} />
                                                            <span className={`text-[9px] font-black uppercase tracking-tighter ${getStatusStep(booking.status) >= s.step ? 'text-bee-black' : 'text-gray-300'
                                                                }`}>
                                                                {s.label}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="h-1 w-full bg-gray-100 rounded-full relative overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(getStatusStep(booking.status) - 1) * 25}%` }}
                                                        className="h-full bg-bee-yellow rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-gray-100">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-gray-50 rounded-2xl"><MapPin className="w-5 h-5 text-bee-yellow" /></div>
                                                <div>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">{t.tracking?.label_route || t.tracking_page?.label_route || "Route"}</span>
                                                    <p className="text-sm font-bold leading-tight">
                                                        {t.location_names[booking.pickupLocation] || booking.pickupLocation}
                                                        {booking.serviceType === ServiceType.DELIVERY && ` → ${t.location_names[booking.dropoffLocation] || booking.dropoffLocation}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-gray-50 rounded-2xl"><Clock className="w-5 h-5 text-bee-yellow" /></div>
                                                <div>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">{t.tracking?.label_schedule || t.tracking_page?.label_schedule || "Schedule"}</span>
                                                    <p className="text-sm font-bold leading-tight">{booking.pickupDate} {booking.pickupTime}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-gray-50 rounded-2xl"><CreditCard className="w-5 h-5 text-bee-yellow" /></div>
                                                <div>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">{t.tracking?.label_payment || t.tracking_page?.label_payment || "Payment"}</span>
                                                    <p className="text-sm font-bold leading-tight">₩{booking.finalPrice?.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                                            {/* Nearby Tips Button 💅 */}
                                            <button
                                                onClick={() => {
                                                    const branchToSlug: Record<string, string> = {
                                                        'HBO': 'hongdae',
                                                        'MYN': 'hongdae',
                                                        'MBX-011': 'seoul-station',
                                                        'MBX-005': 'seongsu',
                                                        'MBX-001': 'bukchon',
                                                        'MBX-016': 'myeongdong',
                                                        'MBX-009': 'myeongdong'
                                                    };
                                                    const retrievalLocId = booking.serviceType === ServiceType.DELIVERY ? booking.dropoffLocation : booking.pickupLocation;
                                                    const slug = branchToSlug[retrievalLocId];
                                                    navigate(slug ? `/tips/${slug}` : '/tips');
                                                }}
                                                className="flex items-center gap-3 px-6 py-3 bg-bee-yellow/10 text-bee-black border border-bee-yellow/20 rounded-2xl hover:bg-bee-yellow/20 transition-all font-black text-[10px] uppercase tracking-widest"
                                            >
                                                <Sparkles size={14} className="text-bee-yellow fill-bee-yellow" />
                                                Nearby Tips 💅
                                                <ArrowRight size={14} />
                                            </button>

                                            <div className="flex items-center gap-3">
                                                {booking.status !== BookingStatus.CANCELLED && booking.status !== BookingStatus.REFUNDED && booking.status !== BookingStatus.COMPLETED && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditClick(booking)}
                                                            className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-colors ${isModificationLocked(booking) ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-bee-black'}`}
                                                        >
                                                            <i className="fa-solid fa-pen"></i>
                                                            {t.booking?.edit_btn || 'Edit'}
                                                        </button>
                                                        <div className="w-px h-4 bg-gray-200 self-center"></div>
                                                        <button
                                                            onClick={() => handleCancelClick(booking)}
                                                            className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-colors ${isModificationLocked(booking) ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-500'}`}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            {t.tracking?.cancel_btn || t.tracking_page?.cancel_btn || "Cancel"}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-[32px] p-20 text-center shadow-lg">
                                <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-6" />
                                <h3 className="text-xl font-black text-gray-300">{t.tracking?.noResult || 'No bookings found.'}</h3>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Refund Policy Modal */}
            <AnimatePresence>
                {showRefundModal && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 md:p-12">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-2xl font-black tracking-tight">{t.refund.title}</h3>
                                    <button onClick={() => setShowRefundModal(false)} title={t.common?.close || "Close"} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="bg-slate-50 rounded-3xl p-6 mb-8">
                                    <pre className="text-sm font-bold text-gray-600 leading-relaxed whitespace-pre-wrap font-sans">
                                        {t.refund.content}
                                    </pre>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={confirmCancel}
                                        disabled={isCancelling}
                                        className="w-full py-5 bg-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isCancelling ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><AlertCircle className="w-5 h-5" /></motion.div> : <Trash2 className="w-5 h-5" />}
                                        {t.refund.confirm_btn}
                                    </button>
                                    <button
                                        onClick={() => setShowRefundModal(false)}
                                        className="w-full py-5 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                                    >
                                        {t.refund.close_btn}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Booking Edit Modal */}
            <BookingModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                lang={lang}
                t={t}
                initialBooking={selectedBooking}
                onSuccess={(updatedBooking) => {
                    alert(t.booking?.update_success || 'Booking updated successfully!');
                    setShowEditModal(false);
                    handleSearch(); // Refresh list
                }}
            />
        </div>
    );
};

export default UserTrackingPage;
