import React from 'react';
import { motion } from 'framer-motion';
import { X, Clock, Phone, ChevronRight, MapPin, Navigation } from 'lucide-react';
import { LocationOption, ServiceType } from "../../types";
import BaggageCounter from './BaggageCounter';

interface BranchDetailsProps {
    t: any;
    lang: string;
    selectedBranch: LocationOption;
    onClose: () => void;
    currentService: 'SAME_DAY' | 'SCHEDULED' | 'STORAGE';
    onBook: (type: 'DELIVERY' | 'STORAGE') => void;
    bookingDate: string;
    onDateChange: (date: string) => void;
    baggageCounts: { S: number, M: number, L: number, XL: number };
    onBaggageChange: (size: 'S' | 'M' | 'L' | 'XL', delta: number) => void;
}

const BranchDetails: React.FC<BranchDetailsProps> = ({
    t, lang, selectedBranch, onClose, currentService, onBook, bookingDate, onDateChange, baggageCounts, onBaggageChange
}) => {
    if (!selectedBranch) return null;

    // Check service support directly from boolean flags
    const serviceKey = currentService === 'STORAGE' ? 'STORAGE' : 'DELIVERY';
    const isActive = serviceKey === 'DELIVERY' ? selectedBranch.supportsDelivery : selectedBranch.supportsStorage;

    // Multilingual data access helper
    const getName = () => {
        if (lang === 'ko') return selectedBranch.name;
        const fieldSuffix = lang.replace('-', '_').toLowerCase();
        const key = `name_${fieldSuffix}` as keyof LocationOption;
        return (selectedBranch[key] as string) || selectedBranch.name_zh || selectedBranch.name_en || selectedBranch.name;
    };

    const getAddress = () => {
        if (lang === 'ko') return selectedBranch.address;
        const fieldSuffix = lang.replace('-', '_').toLowerCase();
        const key = `address_${fieldSuffix}` as keyof LocationOption;
        return (selectedBranch[key] as string) || selectedBranch.address_zh || selectedBranch.address_en || selectedBranch.address;
    };

    const getHours = () => {
        if (lang === 'ko') return selectedBranch.businessHours || '09:00 - 21:00';
        const fieldSuffix = lang.replace('-', '_').toLowerCase();
        const key = `businessHours_${fieldSuffix}` as keyof LocationOption;
        return (selectedBranch[key] as string) || selectedBranch.businessHours_zh || selectedBranch.businessHours_en || selectedBranch.businessHours || '09:00 - 21:00';
    };

    const handleGetDirections = () => {
        const address = getAddress();
        if (address) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
        }
    };

    return (
        <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="fixed inset-x-0 bottom-0 md:relative md:inset-auto md:w-full bg-white md:bg-transparent z-[100] md:z-10 h-auto max-h-[85vh] md:max-h-none"
        >
            <div className="bg-white rounded-t-[3rem] md:rounded-[4rem] shadow-[-30px_0_80px_rgba(0,0,0,0.2)] p-6 md:p-12 border-t md:border border-gray-100/50 h-full md:h-auto overflow-y-auto no-scrollbar backdrop-blur-3xl flex flex-col">
                {/* Mobile Handle Bar */}
                <div className="w-full flex justify-center mb-4 md:hidden">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full" />
                </div>

                {/* Header - [스봉이 수정] 사장님 요청대로 중앙 정렬 및 폰트 축소 💅 */}
                <div className="relative flex flex-col items-center mb-0 mt-2">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 bg-bee-yellow text-bee-black text-[8px] font-black uppercase tracking-widest rounded-full shadow-sm">
                            {currentService !== 'STORAGE' ? 'Branch Info' : 'Storage Hub'}
                        </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-[1000] tracking-[-0.05em] leading-tight text-gray-900 text-center">
                        {getName()}
                    </h2>

                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 90, backgroundColor: '#000', color: '#fff' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="absolute -top-2 -right-2 md:top-0 md:right-0 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center transition-all outline-none z-10 shadow-sm"
                    >
                        <X className="w-5 h-5" />
                    </motion.button>
                </div>

                {/* Info & Image Section - [스봉이 수정] 여백 축소 및 정밀 밸런스 💅 */}
                <div className="flex flex-row items-center gap-6 py-4">
                    {/* Info List */}
                    <div className="flex-1 space-y-4">
                        {/* Address */}
                        <div className="flex items-start gap-3 group">
                            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-bee-yellow/10 transition-colors shrink-0 border border-gray-100/50">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 group-hover:text-bee-yellow" />
                            </div>
                            <div>
                                <div className="text-[8px] font-black text-gray-300 uppercase tracking-[0.15em] mb-0.5">Address</div>
                                <div className="text-[11px] font-bold text-gray-600 leading-tight max-w-[160px]">{getAddress()}</div>
                            </div>
                        </div>

                        {/* Hours */}
                        <div className="flex items-start gap-3 group">
                            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-bee-yellow/10 transition-colors shrink-0 border border-gray-100/50">
                                <Clock className="w-3.5 h-3.5 text-gray-400 group-hover:text-bee-yellow" />
                            </div>
                            <div>
                                <div className="text-[8px] font-black text-gray-300 uppercase tracking-[0.15em] mb-0.5">Business Hours</div>
                                <div className="text-[11px] font-bold text-gray-600 leading-tight">{getHours()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Branch Image */}
                    {selectedBranch.imageUrl && (
                        <div className="w-28 h-28 md:w-32 md:h-32 shrink-0 rounded-[2rem] overflow-hidden shadow-xl shadow-gray-200/30 border-2 border-white bg-gray-50 ring-1 ring-gray-100">
                            <img
                                src={selectedBranch.imageUrl}
                                alt={getName()}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Actions Section - [스봉이 수정] 다시 아래로! 하지만 사장님 취향대로 아주 타이트하고 세련되게 💅 */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                    {/* Primary: Book Now (Slim & Sophisticated 💅) */}
                    <motion.button
                        whileHover={isActive ? { scale: 1.01 } : {}}
                        whileTap={isActive ? { scale: 0.99 } : {}}
                        onClick={() => onBook(serviceKey)}
                        disabled={!isActive}
                        className={`w-full py-5 rounded-full flex items-center justify-center gap-2 text-[13px] font-[1000] uppercase tracking-[0.2em] transition-all shadow-xl ${isActive
                            ? 'bg-bee-yellow text-bee-black hover:shadow-bee-yellow/20'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                            }`}
                    >
                        <span>{t.locations_page?.info_card_book || 'Book Now'}</span>
                        <ChevronRight className="w-5 h-5" />
                    </motion.button>

                    {/* Secondary: Get Directions (Slim 💅) */}
                    <motion.button
                        whileHover={{ scale: 1.01, backgroundColor: '#f9fafb' }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleGetDirections}
                        className="w-full py-4 rounded-full flex items-center justify-center gap-2 text-[11px] font-[1000] uppercase tracking-[0.15em] text-gray-500 border border-gray-200 hover:border-gray-300 transition-all font-sans"
                    >
                        <Navigation className="w-4 h-4" />
                        <span>{t.locations_page?.btn_get_directions || 'Get Directions'}</span>
                    </motion.button>

                    {!isActive && (
                        <p className="text-center text-[10px] font-bold text-red-500 mt-2">
                            {t.locations_page?.currently_closed || 'Currently closed at this branch.'}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default BranchDetails;
