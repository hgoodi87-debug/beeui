import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BookingWidget from './BookingWidget';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    lang: string;
    t: any;
    preSelectedBooking?: { id: string; type: 'STORAGE' | 'DELIVERY' } | null;
    initialBooking?: any | null;
    onSuccess?: (booking: any) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, lang, t, preSelectedBooking, initialBooking, onSuccess }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-bee-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-[40px] shadow-2xl flex flex-col"
                    >
                        <div className="absolute top-6 right-8 z-[210]">
                            <button
                                title="Close Booking"
                                aria-label="Close Booking"
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-bee-black transition-all"
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar">
                            <BookingWidget
                                lang={lang}
                                t={t}
                                preSelectedBooking={preSelectedBooking}
                                initialBooking={initialBooking}
                                onSuccess={(booking) => {
                                    if (onSuccess) onSuccess(booking);
                                    onClose();
                                }}
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BookingModal;
