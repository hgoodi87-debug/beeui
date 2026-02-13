import React from 'react';
import { motion } from 'framer-motion';
import { BookingState, ServiceType, LocationOption } from '../types';
import html2canvas from 'html2canvas';

interface BookingVoucherProps {
    booking: BookingState;
    t: any;
    lang: string;
    pickupLoc: LocationOption;
    dropoffLoc?: LocationOption;
    onBack: () => void;
}

const BookingVoucher: React.FC<BookingVoucherProps> = ({ booking, t, lang, pickupLoc, dropoffLoc, onBack }) => {
    const couponRef = React.useRef<HTMLDivElement>(null);

    // 폰트 깨짐 방지 및 언어별 폰트 설정
    const safeDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US');
    };

    const getLocName = (l: LocationOption) => {
        if (!l) return 'N/A';
        const dbLang = lang.startsWith('zh') ? 'zh' : lang;
        if (lang === 'ko') return l.name;
        return (l[`name_${dbLang}` as keyof LocationOption] as string) || l.name_en || l.name;
    };

    const getLocGuide = (l: LocationOption) => {
        if (!l) return '';
        const dbLang = lang.startsWith('zh') ? 'zh' : lang;
        if (lang === 'ko') return l.pickupGuide;
        return (l[`pickupGuide_${dbLang}` as keyof LocationOption] as string) || l.pickupGuide_en || l.pickupGuide;
    };

    const handleSaveCoupon = async () => {
        if (!couponRef.current) return;
        try {
            const canvas = await html2canvas(couponRef.current, {
                scale: 3,
                backgroundColor: null,
                useCORS: true,
                logging: false,
            });
            const link = document.createElement('a');
            link.download = `MoneyBox_Coupon_${booking.id}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Failed to save coupon image:', err);
            alert(lang === 'ko' ? '이미지 저장에 실패했습니다.' : 'Failed to save coupon image.');
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    return (
        <motion.div
            className="flex flex-col h-full bg-gray-50 p-4 md:p-8 overflow-y-auto custom-scrollbar font-pretendard"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <style>
                {`
                @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
                .font-pretendard { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif !important; }
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .font-pretendard { font-family: 'Pretendard', sans-serif !important; }
                }
                `}
            </style>

            {/* Header Area */}
            <div className="flex flex-col items-center mb-10 text-center no-print">
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-20 h-20 bg-bee-yellow rounded-[24px] flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(255,191,0,0.3)] relative"
                >
                    <i className="fa-solid fa-check text-3xl text-bee-black"></i>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-bee-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <i className="fa-solid fa-crown text-[#ffcb05] text-[10px]"></i>
                    </div>
                </motion.div>
                <h2 className="text-3xl font-black italic tracking-tighter text-bee-black mb-2 uppercase">
                    {t.booking.success}
                </h2>
                <div className="px-4 py-1.5 bg-bee-black rounded-full mb-2">
                    <p className="text-[10px] font-black uppercase text-bee-yellow tracking-[0.3em]">
                        {t.booking.successSub}
                    </p>
                </div>
            </div>

            {/* Premium Voucher Ticket */}
            <div className="max-w-md mx-auto w-full relative">
                {/* Serrated Top Edge */}
                <div className="flex justify-between px-4 overflow-hidden mb-[-1px] relative z-10">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="w-4 h-4 rounded-full bg-gray-50 flex-shrink-0" />
                    ))}
                </div>

                <div className="bg-white rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
                    {/* Brand Top Section */}
                    <div className="bg-bee-black p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-bee-yellow/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-bee-yellow/5 rounded-full -ml-16 -mb-16 blur-xl" />

                        <div className="relative z-10 mb-4 flex justify-center gap-1">
                            <span className="text-2xl font-black italic text-bee-yellow">bee</span>
                            <span className="text-2xl font-black text-white">liber</span>
                        </div>
                        <div className="relative z-10">
                            <span className="text-[9px] font-black text-bee-yellow/60 uppercase tracking-[0.4em]">Official Reservation Receipt</span>
                        </div>
                    </div>

                    {/* Booking ID & Date Row */}
                    <div className="px-8 py-6 bg-gray-50/50 flex justify-between items-center border-b border-dashed border-gray-200">
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Reservation ID</p>
                            <h3 className="text-sm font-black text-bee-black">{booking.id}</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Issue Date</p>
                            <h3 className="text-sm font-black text-bee-black">
                                {safeDate(booking.createdAt || '')}
                            </h3>
                        </div>
                    </div>

                    {/* Main Ticket Body */}
                    <div className="p-10 space-y-8">
                        {/* Header QR Placeholder */}
                        <div className="flex flex-col items-center pb-6 border-b border-gray-100 text-center">
                            <div className="w-32 h-32 bg-white rounded-3xl p-3 mb-4 border-2 border-bee-yellow/20 flex items-center justify-center relative group shadow-sm">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.id}`}
                                    alt="QR Code"
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute -bottom-2 px-3 py-1 bg-bee-black rounded-full shadow-lg border border-white/10">
                                    <p className="text-[8px] font-black text-bee-yellow uppercase tracking-tighter">Scan to Verify</p>
                                </div>
                            </div>
                            <p className="text-[11px] font-black text-bee-black mb-1 uppercase tracking-widest">본 바우처를 대원에게 제시하세요</p>
                            <p className="text-[9px] font-bold text-gray-500 leading-relaxed max-w-[260px]">
                                지점 방문 시 본 코드를 제시해 주세요. <br />
                                현장 확인 후 즉시 처리가 진행됩니다.
                            </p>
                        </div>

                        {/* Service Visualization */}
                        <div className="relative">
                            <div className="absolute left-[13px] top-6 bottom-6 w-0.5 border-l-2 border-dashed border-gray-200" />

                            <div className="space-y-8">
                                {/* From */}
                                <div className="flex gap-6 items-start relative z-10">
                                    <div className="w-7 h-7 rounded-full bg-bee-black border-4 border-bee-yellow shadow-md flex items-center justify-center flex-shrink-0">
                                        <div className="w-1.5 h-1.5 rounded-full bg-bee-yellow animate-pulse" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.booking.from}</p>
                                        <h4 className="text-base font-black text-bee-black leading-tight mb-1">{getLocName(pickupLoc)}</h4>
                                        <div className="flex items-center gap-2">
                                            <i className="fa-regular fa-calendar-check text-[10px] text-bee-yellow"></i>
                                            <p className="text-[11px] font-bold text-gray-400">{booking.pickupDate} <span className="mx-1 opacity-30">|</span> {booking.pickupTime}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* To */}
                                <div className="flex gap-6 items-start relative z-10">
                                    <div className={`w-7 h-7 rounded-full flex-shrink-0 border-4 border-white shadow-md flex items-center justify-center ${booking.serviceType === ServiceType.DELIVERY ? 'bg-bee-yellow' : 'bg-gray-100'}`}>
                                        <i className={`fa-solid ${booking.serviceType === ServiceType.DELIVERY ? 'fa-truck-fast text-[11px]' : 'fa-warehouse text-[11px]'} text-bee-black`}></i>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                            {booking.serviceType === ServiceType.DELIVERY ? t.booking.to : t.booking.duration}
                                        </p>
                                        <h4 className="text-base font-black text-bee-black leading-tight mb-1">
                                            {booking.serviceType === ServiceType.DELIVERY
                                                ? (dropoffLoc ? getLocName(dropoffLoc) : (booking.dropoffAddress || 'Address Specified'))
                                                : `${getLocName(pickupLoc)} (${t.storage_tiers?.[booking.selectedStorageTierId || ''] || (lang === 'ko' ? '보관' : 'Storage')})`
                                            }
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <i className="fa-regular fa-clock text-[10px] text-bee-yellow"></i>
                                            <p className="text-[11px] font-bold text-gray-400">
                                                {booking.serviceType === ServiceType.DELIVERY
                                                    ? `${booking.dropoffDate} ${booking.deliveryTime}`
                                                    : `${booking.dropoffDate} (${t.booking.successSub})`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pickup Guide Photo & Text - Added as requested */}
                        {(pickupLoc.pickupImageUrl || getLocGuide(pickupLoc)) && (
                            <div className="p-4 bg-yellow-50/50 rounded-2xl border border-bee-yellow/20 mt-4">
                                <p className="text-[9px] font-black text-bee-yellow uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <i className="fa-solid fa-camera"></i> {lang === 'ko' ? '지점 및 픽업 안내' : 'Branch & Pickup Guide'}
                                </p>
                                {pickupLoc.pickupImageUrl && (
                                    <img
                                        src={pickupLoc.pickupImageUrl}
                                        alt="Pickup Guide"
                                        className="w-full h-32 object-cover rounded-xl mb-3 border border-white shadow-sm"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                )}
                                {getLocGuide(pickupLoc) && (
                                    <p className="text-[10px] font-bold text-bee-black leading-relaxed whitespace-pre-line">
                                        {getLocGuide(pickupLoc)}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Middle Perforation Line */}
                        <div className="flex items-center gap-2 py-2">
                            <div className="w-3 h-3 rounded-full bg-gray-50 -ml-11.5 border border-gray-100" />
                            <div className="flex-1 h-px border-t-2 border-dashed border-gray-100" />
                            <div className="w-3 h-3 rounded-full bg-gray-50 -mr-11.5 border border-gray-100" />
                        </div>

                        {/* Bottom Detail Section */}
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">{t.booking.bags_label}</p>
                                <div className="flex gap-2 flex-wrap">
                                    {Object.entries(booking.bagSizes).map(([size, count]) => {
                                        if (count === 0) return null;
                                        return (
                                            <div key={size} className="px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2">
                                                <span className="text-[10px] font-black text-bee-black uppercase leading-none">{size}</span>
                                                <span className="w-1 h-1 rounded-full bg-bee-yellow" />
                                                <span className="text-[10px] font-bold text-gray-400 leading-none">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="text-right flex flex-col justify-between">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">{t.booking.total_label}</p>
                                <div>
                                    <p className="text-2xl font-black italic text-bee-black leading-none">
                                        ₩{(booking.finalPrice || 0).toLocaleString()}
                                    </p>
                                    <p className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter mt-1">VAT Included</p>
                                </div>
                            </div>
                        </div>

                        {/* User Tag */}
                        <div className="p-5 bg-bee-black rounded-[24px] flex items-center gap-4 border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-bee-yellow/5 rounded-full -mr-12 -mt-12" />
                            <div className="w-10 h-10 bg-bee-yellow rounded-xl flex items-center justify-center text-lg text-bee-black shadow-lg">
                                <i className="fa-solid fa-user"></i>
                            </div>
                            <div>
                                <h5 className="text-[12px] font-black text-white italic tracking-tight">{booking.userName}</h5>
                                <p className="text-[9px] font-black text-bee-yellow uppercase tracking-widest mt-0.5">{booking.snsType} : {booking.snsId}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Serrated Bottom Edge */}
                <div className="flex justify-between px-4 overflow-hidden mt-[-10px] relative z-10">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="w-4 h-4 rounded-full bg-gray-50 flex-shrink-0" />
                    ))}
                </div>

                {/* MoneyBox Coupon Section */}
                <motion.div
                    ref={couponRef}
                    onClick={handleSaveCoupon}
                    className="mt-8 relative group cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="bg-gradient-to-br from-bee-black to-gray-900 rounded-[32px] p-1 shadow-xl overflow-hidden relative border border-gray-800">
                        {/* Background Deco */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-bee-yellow/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-bee-yellow/5 rounded-full -ml-16 -mb-16 blur-2xl pointer-events-none" />

                        <div className="bg-white/5 backdrop-blur-sm rounded-[30px] p-6 border border-white/10 relative z-10">
                            {/* Coupon Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xl font-black italic text-bee-yellow">money</span>
                                        <span className="text-xl font-black text-white">box</span>
                                    </div>
                                    <p className="text-[10px] font-black text-bee-yellow/80 uppercase tracking-widest whitespace-nowrap">Yeonnam Branch Official Partner</p>
                                </div>
                                <div className="px-3 py-1 bg-bee-yellow rounded-full shadow-lg border border-white/20">
                                    <p className="text-[10px] font-black text-bee-black uppercase">VIP Coupon</p>
                                </div>
                            </div>

                            {/* Main Title */}
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-black text-white italic tracking-tight mb-1 uppercase">Currency Exchange</h3>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="h-px w-8 bg-bee-yellow/30" />
                                    <span className="text-3xl font-black text-bee-yellow">Special Benefit</span>
                                    <div className="h-px w-8 bg-bee-yellow/30" />
                                </div>
                            </div>

                            {/* Info Rows */}
                            <div className="space-y-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-location-dot text-bee-yellow mt-1 text-xs"></i>
                                    <div>
                                        <p className="text-[10px] font-bold text-white/50 mb-0.5">ADDRESS</p>
                                        <p className="text-[11px] font-bold text-white leading-tight">서울 마포구 월드컵북로2길 93 (연남점)</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-clock text-bee-yellow mt-1 text-xs"></i>
                                    <div>
                                        <p className="text-[10px] font-bold text-white/50 mb-0.5">OPEN HOURS</p>
                                        <p className="text-[11px] font-bold text-white">09:00 - 21:00 (Everyday)</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-id-card text-bee-yellow mt-1 text-xs"></i>
                                    <div>
                                        <p className="text-[10px] font-bold text-white/50 mb-0.5">COUPON CODE</p>
                                        <p className="text-sm font-black text-bee-yellow">BEELIBER-VIP-2026</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Mente */}
                            <div className="text-center space-y-2">
                                <p className="text-[12px] font-black text-white italic tracking-wide">
                                    {lang === 'ko' ? '"직원을 보여주세요"' : '"Show to staff"'}
                                </p>
                                <p className="text-[10px] font-bold text-red-500 bg-red-500/10 py-1 rounded-lg border border-red-500/20">
                                    {lang === 'ko' ? '금액이 작은 권종은 우대가 어렵습니다' : 'Lower denominational currencies may not be eligible for preference.'}
                                </p>
                                <div className="pt-2">
                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] animate-pulse">
                                        {lang === 'ko' ? '터치하여 쿠폰 이미지 저장' : 'Touch to save coupon image'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Cut-out effect decoration */}
                        <div className="absolute top-1/2 -left-4 w-8 h-8 bg-gray-50 rounded-full -translate-y-1/2 border border-gray-100 shadow-inner z-20" />
                        <div className="absolute top-1/2 -right-4 w-8 h-8 bg-gray-50 rounded-full -translate-y-1/2 border border-gray-100 shadow-inner z-20" />
                    </div>
                </motion.div>
            </div>

            {/* Print Note */}
            <p className="text-center text-[9px] font-bold text-gray-400 my-8 italic">
                <i className="fa-solid fa-circle-info mr-1 text-bee-yellow"></i>
                Please capture this screen or use the PDF save function for quick access at the service counter.
            </p>

            {/* Actions Area */}
            <div className="mt-8 space-y-4 max-w-sm mx-auto w-full">
                <button
                    onClick={() => window.print()}
                    className="w-full py-5 border-2 border-transparent bg-white hover:border-bee-yellow font-black rounded-[24px] transition-all shadow-sm flex items-center justify-center gap-3 group"
                >
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-bee-yellow group-hover:text-bee-black transition-colors">
                        <i className="fa-solid fa-file-pdf"></i>
                    </div>
                    <span className="text-xs uppercase tracking-widest">{t.booking.print_voucher || '바우처 출력/저장'}</span>
                </button>
                <button
                    onClick={onBack}
                    className="w-full py-5 bg-bee-black text-bee-yellow font-black rounded-[24px] shadow-[0_15px_40px_rgba(0,0,0,0.15)] hover:scale-[1.03] active:scale-[0.98] transition-all text-xs uppercase tracking-widest border-2 border-transparent"
                >
                    {t.locations_page.back_to_list || '목록으로 돌아가기'}
                </button>
            </div>
        </motion.div>
    );
};

export default BookingVoucher;
