import React from 'react';
import { motion } from 'framer-motion';
import { X, Clock, MapPin, Sparkles, Compass, Star, Store, ArrowRight } from 'lucide-react';
import { BagSizes, LocationOption } from "../../types";
import { SEO_LOCATIONS } from '../../src/constants/seoLocations';
import { BagCategoryId } from '../../src/domains/booking/bagCategoryUtils';

interface BranchDetailsProps {
    t: any;
    lang: string;
    selectedBranch: LocationOption;
    onClose: () => void;
    currentService: 'SAME_DAY' | 'SCHEDULED' | 'STORAGE';
    onBook: (type: 'DELIVERY' | 'STORAGE') => void;
    bookingDate: string;
    onDateChange: (date: string) => void;
    baggageCounts: BagSizes;
    onBaggageChange: (categoryId: BagCategoryId, delta: number) => void;
}

const BranchDetails: React.FC<BranchDetailsProps> = ({
    t,
    lang,
    selectedBranch,
    onClose,
    currentService,
    onBook
}) => {
    const serviceKey = currentService === 'STORAGE' ? 'STORAGE' : 'DELIVERY';
    const isActive = selectedBranch.isActive !== false;
    const [imageFailed, setImageFailed] = React.useState(false);

    React.useEffect(() => {
        setImageFailed(false);
    }, [selectedBranch.id]);

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

    const seoLocation = SEO_LOCATIONS.find(loc => loc.relatedBranchIds.includes(selectedBranch.id));
    const nearbySpot = seoLocation?.touristSpots?.[0];

    return (
        <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="fixed md:relative bottom-0 left-0 right-0 md:inset-auto z-[100] h-auto max-h-[92vh] bg-white/40 backdrop-blur-3xl md:backdrop-blur-none border-t border-white/20 md:border-none rounded-t-[2rem] md:rounded-[3rem] overflow-hidden flex flex-col pointer-events-auto"
        >
            <div className="bg-white/95 rounded-t-[2rem] md:rounded-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl p-4 md:p-7 border-t md:border border-white/20 h-auto overflow-y-auto no-scrollbar backdrop-blur-3xl flex flex-col gap-4 md:gap-5 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-24 bg-gradient-to-b from-bee-yellow/10 to-transparent pointer-events-none" />

                <div className="w-full flex justify-center md:hidden">
                    <div className="w-16 h-1 bg-gray-200/50 rounded-full" />
                </div>

                <div className="relative flex flex-col gap-3 pr-12 md:pr-16">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 bg-bee-black text-bee-yellow text-[9px] md:text-[11px] font-black italic uppercase tracking-[0.18em] rounded-full shadow-lg font-montserrat">
                            {currentService !== 'STORAGE' ? 'Branch Info' : 'Storage Hub'}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-[0.18em] border ${isActive ? 'bg-[#E3F6ED] text-[#13A35E] border-[#13A35E]/20' : 'bg-red-50 text-red-600 border-red-200'}`}>
                            {isActive ? 'OPEN' : 'CLOSE'}
                        </span>
                        {selectedBranch.supportsDelivery && (
                            <span className="px-2.5 py-1 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-[0.14em] bg-bee-black text-bee-yellow">
                                {t.locations_page?.service_delivery || 'DELIVERY'}
                            </span>
                        )}
                        {selectedBranch.supportsStorage && (
                            <span className="px-2.5 py-1 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-[0.14em] bg-bee-yellow text-bee-black">
                                {t.locations_page?.service_storage || 'STORAGE'}
                            </span>
                        )}
                    </div>

                    <div>
                        <h2 className="text-2xl md:text-4xl font-black italic tracking-[-0.05em] leading-tight text-gray-900 font-montserrat">
                            {getName()}
                        </h2>
                        {selectedBranch.shortCode && (
                            <p className="mt-1 text-[11px] md:text-[13px] font-bold uppercase tracking-[0.18em] text-gray-400">
                                {selectedBranch.shortCode}
                            </p>
                        )}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.08, rotate: 90, backgroundColor: '#000', color: '#fff' }}
                        whileTap={{ scale: 0.92 }}
                        onClick={onClose}
                        className="absolute top-0 right-0 w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center transition-all outline-none z-10 shadow-xl border border-white/60"
                    >
                        <X className="w-5 h-5 md:w-6 md:h-6" />
                    </motion.button>
                </div>

                <div className="grid grid-cols-[88px,1fr] md:grid-cols-[220px,1fr] gap-3 md:gap-5 items-start">
                    <div className="w-[88px] h-[88px] md:w-[220px] md:h-[220px] shrink-0 rounded-[1.5rem] md:rounded-[3rem] overflow-hidden shadow-lg md:shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-white bg-gray-50/80">
                        {selectedBranch.imageUrl && !imageFailed ? (
                            <img
                                src={selectedBranch.imageUrl}
                                alt={getName()}
                                fetchPriority="high"
                                decoding="async"
                                className="w-full h-full object-cover"
                                onError={() => setImageFailed(true)}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                <Store className="w-8 h-8 md:w-16 md:h-16" />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 md:gap-4 min-w-0">
                        <div className="rounded-[1.4rem] md:rounded-[2rem] bg-gray-50/80 border border-gray-100 p-3 md:p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[9px] md:text-[11px] font-black text-gray-300 uppercase tracking-[0.16em] font-montserrat">
                                        {lang === 'ko' ? '주소' : 'Address'}
                                    </div>
                                    <div className="mt-1 text-[12px] md:text-[16px] font-bold text-gray-700 leading-snug break-words">
                                        {getAddress()}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-white/80 flex items-start gap-3">
                                <div className="w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[9px] md:text-[11px] font-black text-gray-300 uppercase tracking-[0.16em] font-montserrat">
                                        {lang === 'ko' ? '운영시간' : 'Hours'}
                                    </div>
                                    <div className="mt-1 text-[12px] md:text-[16px] font-bold text-gray-700 leading-snug">
                                        {getHours()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {nearbySpot && (
                            <div className="rounded-[1.4rem] md:rounded-[2rem] bg-bee-yellow/10 border border-bee-yellow/30 p-3 md:p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 text-bee-yellow fill-bee-yellow" />
                                    <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.16em] text-bee-black font-montserrat">
                                        {lang === 'ko' ? '주변 추천' : 'Nearby Pick'}
                                    </span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-white/90 flex items-center justify-center shrink-0 border border-white">
                                        {nearbySpot.category === 'landmark' ? (
                                            <Star className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
                                        ) : (
                                            <Compass className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[12px] md:text-[15px] font-black text-gray-900 leading-tight">
                                            {(nearbySpot.name as any)[lang] || nearbySpot.name.ko}
                                        </h4>
                                        <p className="mt-1 text-[10px] md:text-[13px] text-gray-600 leading-snug">
                                            {(nearbySpot.description as any)[lang] || nearbySpot.description.ko}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-1">
                    <motion.button
                        whileHover={isActive ? { scale: 1.01, y: -1 } : {}}
                        whileTap={isActive ? { scale: 0.99 } : {}}
                        onClick={() => onBook(serviceKey)}
                        disabled={!isActive}
                        className={`w-full py-3.5 md:py-5 rounded-[1.6rem] md:rounded-[2rem] flex items-center justify-center gap-2 text-[12px] md:text-[18px] font-black italic uppercase tracking-[0.08em] transition-all shadow-xl font-montserrat ${isActive
                            ? 'bg-bee-black text-bee-yellow hover:bg-bee-black/90'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <span>{t.locations_page?.info_card_book || 'RESERVE'}</span>
                        <ArrowRight className="w-4 h-4 md:w-6 md:h-6" />
                    </motion.button>
                </div>

                {!isActive && (
                    <p className="text-center text-[10px] md:text-[12px] font-bold text-red-500">
                        {t.locations_page?.currently_closed || 'Currently closed at this branch.'}
                    </p>
                )}
            </div>
        </motion.div>
    );
};

export default React.memo(BranchDetails);
