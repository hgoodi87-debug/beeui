import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookingState, LocationOption, LocationType } from '../types';
import BookingVoucher from './BookingVoucher';

interface BookingSuccessProps {
    booking: BookingState | null;
    locations: LocationOption[];
    onBack: () => void;
    t: any;
    lang: string;
}

const BookingSuccess: React.FC<BookingSuccessProps> = ({ booking, locations, onBack, t, lang }) => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleSaveImage = async () => {
        const voucherElement = document.getElementById('voucher-capture-area');
        if (!voucherElement) return;

        try {
            const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(voucherElement, {
                scale: 2, // High quality
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const link = document.createElement('a');
            link.download = `Beeliber-Voucher-${booking?.id || 'Booking'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error("Voucher save failed:", error);
            alert(lang === 'ko' ? "이미지 저장에 실패했습니다." : "Failed to save image.");
        }
    };

    if (!booking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="text-center space-y-4">
                    <p className="font-bold text-gray-500">{t.booking?.no_booking_found || (lang === 'ko' ? "예약 정보를 찾을 수 없습니다." : "Booking information not found.")}</p>
                    <button onClick={onBack} className="px-6 py-3 bg-bee-black text-bee-yellow rounded-2xl font-black">{t.locations_page?.back || (lang === 'ko' ? "메인으로 돌아가기" : "Back to Home")}</button>
                </div>
            </div>
        );
    }

    const t_success = {
        ko: {
            title: "예약이 완료되었습니다!",
            subtitle: "비리버를 이용해 주셔서 진심으로 감사합니다.",
            thanks: "고객님의 소중한 물품은 비리버의 전문 팀이 가장 안전하고 정성스럽게 관리하겠습니다. 예약하신 시간에 맞춰 차질 없이 이용하실 수 있도록 최선을 다하겠습니다.",
            info_title: "예약 정보 확인",
            guide_title: "이용 안내 및 규정",
            business_hours: "지점 영업시간",
            cancel_refund_title: "취소 및 환불 규정",
            cancel_refund_content: "• 이용 24시간 전 취소 시 100% 환불 가능합니다.\n• 이용 당일 취소 시에는 환불이 불가한 점 양해 부탁드려요.\n• 노쇼(No-show) 시에도 환불은 어렵습니다.",
            btn_home: "홈으로 돌아가기",
            trust_badge: "PREMIUM TRUSTED SERVICE"
        },
        en: {
            title: "Booking Completed!",
            subtitle: "Thank you for choosing Beeliber.",
            thanks: "Your precious luggage is in the safest hands. Our team will handle everything with extreme care and precision. Don't worry, we've got you covered! ✨",
            info_title: "Booking Details",
            guide_title: "Guide & Policy",
            business_hours: "Business Hours",
            cancel_refund_title: "Cancellation & Refund",
            cancel_refund_content: "• 100% refund for cancellations made 24 hours before use.\n• No refunds for same-day cancellations or no-shows.\n• Please contact support for any changes to your booking.",
            btn_home: "Back to Home",
            trust_badge: "PREMIUM TRUSTED SERVICE"
        },
        ja: {
            title: "予約が完了しました！",
            subtitle: "Beeliberをご利用いただきありがとうございます。",
            thanks: "大切なお荷物は、私たちのチームが責任を持って安全にお運びいたします。細心の注意を払って対応いたしますので、どうぞご安心ください。ブーン！🐝✨",
            info_title: "予約内容の確認",
            guide_title: "ご利用案内と規定",
            business_hours: "営業時間の案内",
            cancel_refund_title: "キャンセル・返金規定",
            cancel_refund_content: "• 利用の24時間前までのキャンセルは100%返金可能です。\n• 当日のキャンセルおよびノーショー（無断キャンセル）は返金いたしかねます。\n• 規定を事前にご確認ください。",
            btn_home: "ホームに戻る",
            trust_badge: "PREMIUM TRUSTED SERVICE"
        },
        zh: {
            title: "预约完成！",
            subtitle: "感谢您选择 Beeliber。",
            thanks: "您的珍贵行李已交给最专业的团队。我们将以最严谨的态度确保您的行李安全送达。请放心开启您的旅程！嗡嗡~ 🐝✨",
            info_title: "确认预约详情",
            guide_title: "使用指南及规定",
            business_hours: "网点营业时间",
            cancel_refund_title: "取消及退款规定",
            cancel_refund_content: "• 使用前24小时取消可获得100%退款。\n• 使用当天取消或未到店(No-show)将无法退款。\n• 请提前确认相关政策。",
            btn_home: "返回首页",
            trust_badge: "PREMIUM TRUSTED SERVICE"
        },
        'zh-TW': {
            title: "預約已完成！",
            subtitle: "感謝您選擇 Beeliber。",
            thanks: "您的珍貴行李已交給最專業的團隊。我們將以最嚴謹的態度確保您的行李安全送達。請放心開啟您的旅程！嗡嗡~ 🐝✨",
            info_title: "確認預約詳情",
            guide_title: "使用指南及規定",
            business_hours: "據點營業時間",
            cancel_refund_title: "取消及退款規定",
            cancel_refund_content: "• 使用前24小時取消可獲得100%退款。\n• 使用當天取消或未到店(No-show)將無法退款。\n• 請提前確認相關政策。",
            btn_home: "返回首頁",
            trust_badge: "PREMIUM TRUSTED SERVICE"
        },
        'zh-HK': {
            title: "預約已完成！",
            subtitle: "感謝您選擇 Beeliber。",
            thanks: "您的珍貴行李已交給最專業的團隊。我們將以最嚴謹的態度確保您的行李安全送達。請放心開啟您的旅程！嗡嗡~ 🐝✨",
            info_title: "確認預約詳情",
            guide_title: "使用指南及規定",
            business_hours: "網點營業時間",
            cancel_refund_title: "取消及退款規定",
            cancel_refund_content: "• 使用前24小時取消可獲得100%退款。\n• 使用當天取消或未到店(No-show)將無法退款。\n• 請提前確認相關政策。",
            btn_home: "返回首頁",
            trust_badge: "PREMIUM TRUSTED SERVICE"
        }
    };

    const curT = t_success[lang as keyof typeof t_success] || t_success.en;

    const getLocName = (l: LocationOption) => {
        const dbLang = lang.startsWith('zh') ? 'zh' : lang.split('-')[0];
        if (lang === 'ko' || lang === 'ko-KR') return l.name;
        return (l[`name_${lang}` as keyof LocationOption] as string) || (l[`name_${dbLang}` as keyof LocationOption] as string) || (t.location_names && t.location_names[l.id]) || l.name_en || l.name;
    };

    const buildFallbackLocation = (id: string, name: string, address?: string): LocationOption => ({
        id: id || 'UNKNOWN',
        shortCode: id || 'UNKNOWN',
        name: name || (lang === 'ko' ? '지점 확인 중' : 'Branch pending'),
        type: LocationType.OTHER,
        address: address || '',
        description: '',
        supportsDelivery: true,
        supportsStorage: true,
    });

    const pickupLoc = locations.find(l => l.id === booking.pickupLocation)
        || booking.pickupLoc
        || buildFallbackLocation(
            booking.pickupLocation,
            booking.pickupAddress || (lang === 'ko' ? '픽업 지점 확인 중' : 'Pickup branch pending'),
            booking.pickupAddress
        );
    const dropoffLoc = locations.find(l => l.id === booking.dropoffLocation)
        || booking.returnLoc
        || (booking.dropoffLocation || booking.dropoffAddress
            ? buildFallbackLocation(
                booking.dropoffLocation,
                booking.dropoffAddress || (lang === 'ko' ? '도착 지점 확인 중' : 'Drop-off pending'),
                booking.dropoffAddress
            )
            : undefined);

    const getBusinessHoursText = (loc?: LocationOption) => {
        if (!loc) return "09:00 - 21:00";
        const dbLang = lang.startsWith('zh') ? 'zh' : lang.split('-')[0];
        if (lang === 'ko' || lang === 'ko-KR') return loc.businessHours || "09:00 - 21:00";
        return (loc[`businessHours_${lang}` as keyof LocationOption] as string) || (loc[`businessHours_${dbLang}` as keyof LocationOption] as string) || loc.businessHours_en || loc.businessHours || "09:00 - 21:00";
    };

    const businessHoursText = getBusinessHoursText(pickupLoc);

    return (
        <div className="min-h-screen bg-[#fafafb] font-sans selection:bg-bee-yellow selection:text-bee-black pb-20">
            {/* Header / Hero Section */}
            <div className="bg-bee-black text-bee-yellow pt-20 pb-12 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
                    <i className="fa-solid fa-honey-bee text-[300px]"></i>
                </div>

                <div className="max-w-2xl mx-auto relative z-10 text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 14 }}
                        className="w-24 h-24 bg-bee-yellow text-bee-black rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-[0_20px_40px_rgba(255,203,5,0.3)] border-4 border-white/20"
                    >
                        <i className="fa-solid fa-check text-4xl"></i>
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-5xl font-black italic tracking-tighter mb-4"
                    >
                        {curT.title}
                    </motion.h1>
                    <motion.div
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.18 }}
                        className="inline-block px-4 py-1.5 bg-bee-yellow/10 border border-bee-yellow/20 rounded-full"
                    >
                        <p className="text-bee-yellow font-black uppercase tracking-[0.25em] text-[11px]">
                            {curT.subtitle}
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto -mt-8 px-4 space-y-6">
                {/* Personalized Message Card */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-[40px] p-8 md:p-10 shadow-2xl border border-gray-100 relative overflow-hidden group"
                >
                    <div className="absolute top-0 left-0 w-2 h-full bg-bee-yellow group-hover:w-4 transition-all duration-500"></div>
                    <div className="flex gap-6 items-start relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl text-bee-black shadow-inner">
                            <i className="fa-solid fa-quote-left opacity-20"></i>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-[11px] font-black text-bee-yellow uppercase tracking-[0.3em] mb-3">{curT.trust_badge}</h3>
                            <p className="text-base md:text-lg font-bold leading-relaxed text-gray-800 whitespace-pre-line">
                                {curT.thanks}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Voucher Section */}
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.28 }}
                >
                    <div className="flex items-center gap-3 mb-6 px-4">
                        <div className="w-2 h-8 bg-bee-black rounded-full"></div>
                        <h2 className="font-black italic text-2xl uppercase tracking-tighter text-bee-black">{curT.info_title}</h2>
                    </div>
                    <div className="rounded-[44px] overflow-hidden shadow-2xl" id="voucher-capture-area">
                        <BookingVoucher
                            booking={booking}
                            t={t}
                            lang={lang}
                            pickupLoc={pickupLoc}
                            dropoffLoc={dropoffLoc}
                            onBack={() => { }} // Not needed here
                        />
                    </div>
                </motion.div>

                {/* Additional Info Grid */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    <div className="bg-white rounded-[32px] p-7 shadow-xl border border-gray-100 hover:scale-[1.02] transition-transform duration-300">
                        <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-bee-black mb-5 flex items-center gap-2">
                            <div className="w-6 h-6 bg-yellow-50 rounded-lg flex items-center justify-center">
                                <i className="fa-solid fa-clock text-bee-yellow text-xs"></i>
                            </div>
                            {curT.business_hours}
                        </h4>
                        <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 shadow-inner">
                            <p className="text-xs font-black text-gray-700 leading-relaxed whitespace-pre-line">
                                {pickupLoc ? `${getLocName(pickupLoc)}: ${businessHoursText}` : "09:00 - 21:00"}
                            </p>
                            <p className="mt-3 text-[10px] font-bold text-gray-400 italic">
                                * {lang === 'ko' ? "지점 운영시간 이외 수령/반납 불가" : "No pickup/dropoff outside biz hours"}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] p-7 shadow-xl border border-gray-100 hover:scale-[1.02] transition-transform duration-300">
                        <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-[#ef4444] mb-5 flex items-center gap-2">
                            <div className="w-6 h-6 bg-red-50 rounded-lg flex items-center justify-center">
                                <i className="fa-solid fa-circle-exclamation text-[#ef4444] text-xs"></i>
                            </div>
                            {curT.cancel_refund_title}
                        </h4>
                        <div className="bg-red-50/30 rounded-2xl p-5 border border-red-50 shadow-inner">
                            <p className="text-[11px] font-bold text-gray-700 leading-relaxed whitespace-pre-line">
                                {curT.cancel_refund_content}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Footer Buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.42 }}
                    className="pt-12 text-center"
                >
                    <button
                        onClick={onBack}
                        className="w-full md:w-auto px-20 py-5 bg-bee-black text-bee-yellow font-black rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:scale-[1.05] transition-all active:scale-95 flex items-center justify-center gap-4 mx-auto group"
                    >
                        <i className="fa-solid fa-house group-hover:rotate-12 transition-transform"></i>
                        <span className="text-sm uppercase tracking-widest">{curT.btn_home}</span>
                    </button>

                    <div className="mt-12 flex flex-col items-center gap-4">
                        <div className="w-10 h-px bg-gray-200"></div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">Beeliber Global Logistics © 2026</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default BookingSuccess;
