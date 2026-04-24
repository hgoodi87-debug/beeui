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
                scale: 2,
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

    const checkin_i18n: Record<string, { title: string; steps: string[]; contact_title: string; instagram: string; chatbot: string; email: string }> = {
        ko: {
            title: "이용 방법 (4단계)",
            steps: [
                "예약 지점을 방문하세요.",
                "저장해 둔 QR 바우처를 직원에게 보여 주세요.",
                "짐을 맡겨 주세요.",
                "예약하신 시간에 픽업 장소에 도착하여 짐을 찾아가세요.\n(아래 지점 안내를 참고해 주세요)"
            ],
            contact_title: "문의하기",
            instagram: "인스타그램 DM",
            chatbot: "웹 챗봇",
            email: "이메일 문의"
        },
        en: {
            title: "How It Works (4 Steps)",
            steps: [
                "Visit the reservation location.",
                "Present the saved QR voucher to the staff.",
                "Drop off your luggage.",
                "Arrive at the Pick-up Location at your scheduled time to collect your luggage.\n(Refer to the location guide below)"
            ],
            contact_title: "Contact Us",
            instagram: "Instagram DM",
            chatbot: "Web Chatbot",
            email: "Send Email"
        },
        ja: {
            title: "ご利用方法（4ステップ）",
            steps: [
                "予約した店舗を訪問してください。",
                "保存したQRバウチャーをスタッフに提示してください。",
                "お荷物を預けてください。",
                "ご予約の時間にピックアップ場所へお越しいただき、お荷物をお受け取りください。\n（下記の場所案内をご参照ください）"
            ],
            contact_title: "お問い合わせ",
            instagram: "Instagram DM",
            chatbot: "Webチャット",
            email: "メールで問い合わせ"
        },
        zh: {
            title: "使用方法（4步骤）",
            steps: [
                "前往预约地点。",
                "向工作人员出示保存的QR凭证。",
                "存放您的行李。",
                "在预约时间到达取件地点领取行李。\n（请参考下方地点指南）"
            ],
            contact_title: "联系我们",
            instagram: "Instagram 私信",
            chatbot: "网页客服",
            email: "发送邮件"
        },
        'zh-TW': {
            title: "使用方法（4步驟）",
            steps: [
                "前往預約地點。",
                "向工作人員出示儲存的QR憑證。",
                "存放您的行李。",
                "在預約時間到達取件地點領取行李。\n（請參考下方地點指南）"
            ],
            contact_title: "聯絡我們",
            instagram: "Instagram 私訊",
            chatbot: "網頁客服",
            email: "寄送郵件"
        },
        'zh-HK': {
            title: "使用方法（4步驟）",
            steps: [
                "前往預約地點。",
                "向工作人員出示儲存的QR憑證。",
                "存放您的行李。",
                "在預約時間到達取件地點領取行李。\n（請參考下方地點指南）"
            ],
            contact_title: "聯絡我們",
            instagram: "Instagram 私訊",
            chatbot: "網頁客服",
            email: "寄送郵件"
        }
    };
    const curCheckin = checkin_i18n[lang as keyof typeof checkin_i18n] || checkin_i18n.en;

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

                {/* 3-Step Visual Customer Guide */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.33 }}
                    className="bg-bee-black rounded-[40px] p-7 md:p-10 shadow-2xl overflow-hidden"
                >
                    <h2 className="text-xl font-black italic text-bee-yellow uppercase tracking-tighter mb-1 text-center">
                        {curCheckin.title}
                    </h2>
                    <p className="text-white/40 text-[10px] font-bold text-center mb-7 uppercase tracking-widest">
                        {lang === 'ko' ? '이용 전 꼭 확인하세요' : lang === 'ja' ? 'ご利用前にご確認ください' : lang.startsWith('zh') ? '使用前请仔细阅读' : 'Please read before your visit'}
                    </p>

                    {/* 3 illustration panels */}
                    <div className="grid grid-cols-3 gap-3 mb-6">

                        {/* Panel 1: Visit + QR */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-full aspect-square bg-white/5 rounded-3xl flex items-center justify-center p-2 border border-white/10 relative overflow-hidden">
                                {/* Step 1 SVG — 지점 방문, 환영하는 직원 */}
                                <svg viewBox="0 0 80 96" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    {/* Head */}
                                    <circle cx="40" cy="17" r="12" fill="#F5CBA7"/>
                                    {/* Hair */}
                                    <path d="M28 14 Q28 5 40 5 Q52 5 52 14 Q52 9 40 9 Q28 9 28 14Z" fill="#2C1A0E"/>
                                    {/* Neck */}
                                    <rect x="37" y="27" width="6" height="5" rx="2" fill="#F5CBA7"/>
                                    {/* Body / Black uniform */}
                                    <path d="M20 38 L28 30 Q34 32 40 32 Q46 32 52 30 L60 38 L56 72 L24 72Z" fill="#1a1a1a"/>
                                    {/* Yellow collar accent */}
                                    <path d="M34 30 L40 40 L46 30" stroke="#FFBF00" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
                                    {/* Name badge */}
                                    <rect x="33" y="46" width="14" height="9" rx="2" fill="#FFBF00"/>
                                    {/* Right arm — raised high, welcoming */}
                                    <path d="M56 38 Q68 28 70 18" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round"/>
                                    {/* Left arm — relaxed down */}
                                    <path d="M24 38 Q16 48 18 58" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round"/>
                                    {/* Legs */}
                                    <rect x="28" y="70" width="9" height="22" rx="4" fill="#1a1a1a"/>
                                    <rect x="43" y="70" width="9" height="22" rx="4" fill="#1a1a1a"/>
                                    {/* Shoes */}
                                    <ellipse cx="32" cy="93" rx="8" ry="3.5" fill="#111"/>
                                    <ellipse cx="47" cy="93" rx="8" ry="3.5" fill="#111"/>
                                </svg>
                            </div>
                            <div className="w-7 h-7 rounded-full bg-bee-yellow text-bee-black flex items-center justify-center font-black text-sm shrink-0">1</div>
                            <p className="text-white/80 text-center font-bold text-[10px] leading-tight whitespace-pre-line">
                                {lang === 'ko' ? '지점 방문\nQR 바우처 제시' : lang === 'ja' ? '店舗を訪問\nQRを提示' : lang.startsWith('zh') ? '前往门店\n出示QR凭证' : 'Visit branch\nShow QR voucher'}
                            </p>
                        </div>

                        {/* Panel 2: Nametag attachment — KEY instruction */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-full aspect-square bg-bee-yellow/10 rounded-3xl flex items-center justify-center p-2 border-2 border-bee-yellow/50 relative overflow-hidden">
                                {/* Step 2 SVG — 네임택을 짐에 직접 달기 */}
                                <svg viewBox="0 0 80 96" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    {/* Head (leaning forward) */}
                                    <circle cx="28" cy="17" r="11" fill="#F5CBA7"/>
                                    <path d="M17 14 Q17 6 28 6 Q39 6 39 14 Q39 9 28 9 Q17 9 17 14Z" fill="#2C1A0E"/>
                                    {/* Neck */}
                                    <rect x="25" y="26" width="6" height="4" rx="2" fill="#F5CBA7"/>
                                    {/* Body — leaning forward */}
                                    <path d="M12 35 L20 28 Q24 29 28 30 Q33 29 38 27 L50 33 L48 60 L16 60Z" fill="#1a1a1a"/>
                                    {/* Yellow collar */}
                                    <path d="M24 29 L28 38 L33 27" stroke="#FFBF00" strokeWidth="2" fill="none"/>
                                    {/* Name badge */}
                                    <rect x="22" y="42" width="11" height="7" rx="1.5" fill="#FFBF00"/>
                                    {/* Right arm reaching to tag */}
                                    <path d="M46 34 Q60 40 63 52" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round"/>
                                    {/* Hand */}
                                    <circle cx="64" cy="55" r="5" fill="#F5CBA7"/>
                                    {/* Left arm */}
                                    <path d="M14 36 Q8 46 10 54" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round"/>
                                    {/* Legs bent */}
                                    <path d="M22 58 L18 82" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round"/>
                                    <path d="M34 58 L38 80" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round"/>
                                    {/* Suitcase / Luggage */}
                                    <rect x="48" y="56" width="26" height="34" rx="5" fill="#444"/>
                                    <rect x="55" y="52" width="12" height="7" rx="3" stroke="#666" strokeWidth="2" fill="none"/>
                                    {/* Luggage detail lines */}
                                    <line x1="61" y1="60" x2="61" y2="86" stroke="#555" strokeWidth="1"/>
                                    {/* YELLOW TAG — focal point */}
                                    <rect x="68" y="61" width="10" height="14" rx="2" fill="#FFBF00"/>
                                    <circle cx="73" cy="60" r="2" fill="#FFBF00"/>
                                    <line x1="73" y1="58" x2="73" y2="54" stroke="#FFBF00" strokeWidth="1.5"/>
                                    {/* Tag loop */}
                                    <ellipse cx="73" cy="53" rx="3" ry="2" stroke="#FFBF00" strokeWidth="1.5" fill="none"/>
                                    {/* Tag text line (decoration) */}
                                    <line x1="70" y1="67" x2="76" y2="67" stroke="white" strokeWidth="1" opacity="0.5"/>
                                    <line x1="70" y1="70" x2="76" y2="70" stroke="white" strokeWidth="1" opacity="0.5"/>
                                </svg>
                            </div>
                            <div className="w-7 h-7 rounded-full bg-bee-yellow text-bee-black flex items-center justify-center font-black text-sm shrink-0">2</div>
                            <p className="text-bee-yellow text-center font-black text-[10px] leading-tight whitespace-pre-line">
                                {lang === 'ko' ? '네임택을 짐에\n직접 달아주세요!' : lang === 'ja' ? 'ネームタグを\n直接お付けください!' : lang.startsWith('zh') ? '请将名牌\n直接挂在行李上!' : 'Attach nametag\ndirectly to bag!'}
                            </p>
                        </div>

                        {/* Panel 3: Collect at scheduled time */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-full aspect-square bg-white/5 rounded-3xl flex items-center justify-center p-2 border border-white/10 relative overflow-hidden">
                                {/* Step 3 SVG — 배달기사 + 빨간 네임택 */}
                                <svg viewBox="0 0 80 96" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    {/* Cap */}
                                    <ellipse cx="40" cy="12" rx="16" ry="5" fill="#555"/>
                                    <rect x="24" y="10" width="32" height="6" rx="2" fill="#555"/>
                                    <rect x="20" y="14" width="8" height="3" rx="1" fill="#555"/>
                                    {/* Head */}
                                    <circle cx="40" cy="21" r="10" fill="#F5CBA7"/>
                                    {/* Neck */}
                                    <rect x="37" y="30" width="6" height="4" rx="2" fill="#F5CBA7"/>
                                    {/* Body / Gray delivery uniform */}
                                    <path d="M22 42 L30 33 Q35 34 40 35 Q45 34 50 33 L58 42 L56 72 L24 72Z" fill="#777"/>
                                    {/* Shoulder badge */}
                                    <rect x="22" y="40" width="6" height="10" rx="2" fill="#FFBF00"/>
                                    <rect x="52" y="40" width="6" height="10" rx="2" fill="#FFBF00"/>
                                    {/* Name badge */}
                                    <rect x="33" y="46" width="14" height="9" rx="2" fill="#FFBF00"/>
                                    {/* Right arm holding box */}
                                    <path d="M55 43 Q65 46 66 56" stroke="#777" strokeWidth="8" strokeLinecap="round"/>
                                    {/* Package */}
                                    <rect x="58" y="55" width="18" height="16" rx="3" fill="#C9A96E"/>
                                    <line x1="67" y1="55" x2="67" y2="71" stroke="#A07840" strokeWidth="1"/>
                                    <line x1="58" y1="63" x2="76" y2="63" stroke="#A07840" strokeWidth="1"/>
                                    {/* Left arm */}
                                    <path d="M25 43 Q17 52 20 62" stroke="#777" strokeWidth="8" strokeLinecap="round"/>
                                    {/* RED TAG hanging */}
                                    <rect x="17" y="54" width="10" height="14" rx="2" fill="#EF4444"/>
                                    <circle cx="22" cy="53" r="2" fill="#EF4444"/>
                                    <line x1="22" y1="51" x2="22" y2="47" stroke="#EF4444" strokeWidth="1.5"/>
                                    <ellipse cx="22" cy="46" rx="3" ry="2" stroke="#EF4444" strokeWidth="1.5" fill="none"/>
                                    {/* Legs */}
                                    <rect x="28" y="70" width="9" height="22" rx="4" fill="#555"/>
                                    <rect x="43" y="70" width="9" height="22" rx="4" fill="#555"/>
                                    {/* Shoes */}
                                    <ellipse cx="32" cy="93" rx="8" ry="3.5" fill="#333"/>
                                    <ellipse cx="47" cy="93" rx="8" ry="3.5" fill="#333"/>
                                </svg>
                            </div>
                            <div className="w-7 h-7 rounded-full bg-bee-yellow text-bee-black flex items-center justify-center font-black text-sm shrink-0">3</div>
                            <p className="text-white/80 text-center font-bold text-[10px] leading-tight whitespace-pre-line">
                                {lang === 'ko' ? '예약 시간에\n짐 찾기' : lang === 'ja' ? '予約時間に\nお受け取り' : lang.startsWith('zh') ? '按预约时间\n取回行李' : 'Collect at\nscheduled time'}
                            </p>
                        </div>

                    </div>

                    {/* Nametag instruction callout — 직접 달아야 함 강조 */}
                    <div className="bg-bee-yellow/10 border border-bee-yellow/30 rounded-2xl p-4 flex items-start gap-3">
                        <i className="fa-solid fa-tag text-bee-yellow mt-0.5 shrink-0"></i>
                        <p className="text-bee-yellow font-black text-[11px] leading-relaxed">
                            {lang === 'ko'
                                ? '네임택은 짐을 구분하는 고유 번호표입니다. 받으신 네임택을 짐에 직접 달아주셔야 합니다.'
                                : lang === 'ja'
                                ? 'ネームタグはお荷物を識別するための固有番号です。受け取ったネームタグをお荷物に直接お付けください。'
                                : lang === 'zh-TW' || lang === 'zh-HK'
                                ? '名牌是識別行李的唯一號碼。請將收到的名牌直接掛在您的行李上。'
                                : lang.startsWith('zh')
                                ? '名牌是识别行李的唯一编号。请将收到的名牌直接挂在您的行李上。'
                                : 'The nametag is your luggage\'s unique ID number. You must directly attach the nametag to your bag before check-in.'}
                        </p>
                    </div>
                </motion.div>

                {/* Contact Us Buttons */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.36 }}
                    className="bg-white rounded-[40px] p-8 md:p-10 shadow-xl border border-gray-100"
                >
                    <h2 className="text-xl font-black italic uppercase tracking-tighter text-bee-black mb-6 text-center">
                        {curCheckin.contact_title}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <a
                            href="https://ig.me/m/beeliber"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-3 p-5 bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888] text-white rounded-3xl font-black text-sm hover:scale-[1.03] transition-transform shadow-lg"
                        >
                            <i className="fa-brands fa-instagram text-2xl"></i>
                            {curCheckin.instagram}
                        </a>
                        <button
                            onClick={onBack}
                            className="flex flex-col items-center gap-3 p-5 bg-bee-black text-bee-yellow rounded-3xl font-black text-sm hover:scale-[1.03] transition-transform shadow-lg"
                        >
                            <i className="fa-solid fa-comment-dots text-2xl"></i>
                            {curCheckin.chatbot}
                        </button>
                        <a
                            href={`mailto:support@bee-liber.com?subject=Inquiry - ${booking.reservationCode || booking.id}&body=Reservation: ${booking.reservationCode || booking.id}%0A%0A`}
                            className="flex flex-col items-center gap-3 p-5 bg-gray-100 text-bee-black rounded-3xl font-black text-sm hover:scale-[1.03] transition-transform shadow-lg hover:bg-gray-200"
                        >
                            <i className="fa-solid fa-envelope text-2xl"></i>
                            {curCheckin.email}
                        </a>
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
