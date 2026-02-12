"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCcw, ChevronRight, Clock, MapPin, Package, CheckCircle2, Sparkles, Ruler } from "lucide-react";
import BeeSizeSimulator from "./BeeSizeSimulator";
import { LocationOption, ServiceType, BookingStatus } from '../types';

interface BeeAIReservationProps {
    lang: string;
    t: any;
    onSuccess?: (booking: any) => void;
    initialLocation?: LocationOption;
    initialServiceType?: 'STORAGE' | 'DELIVERY';
    locations: LocationOption[];
}

type Step = 'INIT' | 'INFO' | 'SERVICE_SELECT' | 'DEST_SELECT' | 'TIME' | 'SIZE' | 'CONFIRM' | 'DONE';

interface BookingData {
    pickupDate: string;
    pickupTime: string;
    returnDate: string;
    deliveryTime: string;
    location: string | null;
    destinationLocation: string | null;
    serviceType: 'STORAGE' | 'DELIVERY' | null;
    bagSizes: {
        S: number;
        M: number;
        L: number;
        XL: number;
    };
    userName: string;
    userEmail: string;
    snsChannel: string;
    snsId: string;
    dropoffDate: string;
    agreedToHighValue?: boolean;
}

export default function BeeAIReservation({ lang, t, onSuccess, initialLocation, initialServiceType, locations }: BeeAIReservationProps) {
    const [step, setStep] = useState<Step>('INIT');
    const [stepHistory, setStepHistory] = useState<Step[]>([]);
    const [messages, setMessages] = useState<{ role: 'bot' | 'user', text: string, component?: React.ReactNode }[]>([]);
    const [showSimulator, setShowSimulator] = useState(false);

    // Default Booking Data
    const [bookingData, setBookingData] = useState<BookingData>({
        pickupDate: '',
        pickupTime: '',
        returnDate: '',
        deliveryTime: '',
        location: initialLocation ? initialLocation.id : null,
        destinationLocation: null,
        serviceType: initialServiceType || null,
        bagSizes: { S: 0, M: 1, L: 0, XL: 0 },
        userName: '',
        userEmail: '',
        snsChannel: 'kakao',
        snsId: '',
        dropoffDate: ''
    });

    const [consents, setConsents] = useState({
        terms: false,
        privacy: false,
        highValue: false
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, step]);

    // Initial greeting
    useEffect(() => {
        if (step === 'INIT') {
            setTimeout(() => {
                const greeting = t.bee_ai?.welcome || "안녕하세요! Bee AI입니다. 무엇을 도와드릴까요? 🐝";
                addBotMessage(greeting);

                if (initialLocation) {
                    const hours = getLocalizedHours(initialLocation);
                    addBotMessage(t.bee_ai?.branch_hours_template?.replace('{branch}', getBranchName(initialLocation.id)).replace('{hours}', hours) ||
                        `${getBranchName(initialLocation.id)} 지점의 운영 시간은 [${hours}] 입니다. ✨`, (
                        <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-bee-yellow/20 text-[10px] font-bold text-bee-black">
                            <Clock className="w-3 h-3 inline mr-1" /> {t.booking?.total_price_sub_storage || "21시 이후는 물건을 맡기거나 찾을 수 없습니다."}
                        </div>
                    ));
                }

                setStep('INFO');
            }, 500);
        }
    }, [initialLocation]);

    // Helper: Localize text
    const getText = (key: string, defaultText: string) => {
        return t.bee_ai?.[key] || defaultText;
    };

    // Helper: Get localized branch name
    const getBranchName = (locId: string) => {
        const loc = locations.find(l => l.id === locId);
        if (!loc) return locId;
        const dbLang = lang.startsWith('zh') ? 'zh' : lang;
        if (lang === 'ko') return loc.name;
        return (loc[`name_${dbLang}` as keyof LocationOption] as string) || t.location_names?.[loc.id.toUpperCase()] || loc.name;
    };

    const getLocalizedHours = (loc: LocationOption) => {
        const dbLang = lang.startsWith('zh') ? 'zh' : lang;
        if (lang === 'ko') return loc.businessHours || "09:00 - 21:00";
        return (loc[`businessHours_${dbLang}` as keyof LocationOption] as string) || loc.businessHours || "09:00 - 21:00";
    };

    // Step Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (step === 'INFO') {
                addBotMessage(t.bee_ai?.contact_info_title || "예약자 정보를 입력해주세요. 윙윙~");
            } else if (step === 'SERVICE_SELECT') {
                addBotMessage(t.bee_ai?.question_service || "먼저 원하시는 서비스를 선택해 주세요! 윙윙~");
            } else if (step === 'DEST_SELECT') {
                addBotMessage(t.bee_ai?.question_dest || "짐을 보내실 도착 지점을 선택해주세요.");
            } else if (step === 'TIME') {
                addBotMessage(t.bee_ai?.question_time_only || "언제 맡기고, 언제 찾으실 예정인가요?");
            } else if (step === 'SIZE') {
                addBotMessage(t.bee_ai?.question_size || "맡기실 가방의 사이즈와 수량을 선택해주세요.");
            } else if (step === 'CONFIRM') {
                addBotMessage(t.bee_ai?.question_confirm || "마지막으로 예약 내용을 확인해주세요. 이대로 진행할까요?");
            }
        }, 600);

        // Push to history for back button support
        if (step !== 'INIT' && step !== 'DONE') {
            window.history.pushState({ step }, "");
        }

        return () => clearTimeout(timer);
    }, [step]);

    // Hardware Back Button Integration
    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            if (stepHistory.length > 0) {
                handlePrevStep();
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [stepHistory]);

    const handlePrevStep = () => {
        if (stepHistory.length === 0) return;
        const prev = stepHistory[stepHistory.length - 1];
        setStep(prev);
        setStepHistory(prevHistory => prevHistory.slice(0, -1));
        // Remove last user/bot message pair if possible
        setMessages(prevMsgs => prevMsgs.slice(0, -2));
    };

    const nextStep = (next: Step) => {
        setStepHistory(prev => [...prev, step]);
        setStep(next);
    };

    const addBotMessage = (text: string, component?: React.ReactNode) => {
        setMessages(prev => [...prev, { role: 'bot', text, component }]);
    };

    const addUserMessage = (text: string) => {
        setMessages(prev => [...prev, { role: 'user', text }]);
    };

    // --- HANDLERS ---

    const handleInfoSubmit = () => {
        if (!bookingData.userName || !bookingData.userEmail || !bookingData.snsId) return;
        addUserMessage(`${bookingData.userName} (${bookingData.userEmail}), ${bookingData.snsChannel}: ${bookingData.snsId}`);
        nextStep('SERVICE_SELECT');
    };

    const handleServiceSelect = (type: 'STORAGE' | 'DELIVERY') => {
        setBookingData(prev => ({ ...prev, serviceType: type }));
        addUserMessage(type === 'DELIVERY' ? (t.bee_ai?.btn_delivery || '배송') : (t.bee_ai?.btn_storage || '보관'));
        if (type === 'DELIVERY') {
            nextStep('DEST_SELECT');
        } else {
            nextStep('TIME');
        }
    };

    const handleDestSelect = (locId: string) => {
        setBookingData(prev => ({ ...prev, destinationLocation: locId }));
        addUserMessage((t.bee_ai?.delivery_to_template || "{branch} (으)로 배송").replace('{branch}', getBranchName(locId)));

        // Map Focus Event
        window.dispatchEvent(new CustomEvent('beeliber:location_focus', {
            detail: { locationId: locId }
        }));

        nextStep('TIME');
    };

    const handleTimeSubmit = () => {
        if (!bookingData.pickupDate || !bookingData.pickupTime || !bookingData.dropoffDate || !bookingData.deliveryTime) return;
        addUserMessage(`${bookingData.pickupDate} ${bookingData.pickupTime} ~ ${bookingData.dropoffDate} ${bookingData.deliveryTime}`);
        nextStep('SIZE');
    };

    const handleSizeSubmit = () => {
        const totalBags = bookingData.bagSizes.S + bookingData.bagSizes.M + bookingData.bagSizes.L + bookingData.bagSizes.XL;
        if (totalBags === 0) return;
        addUserMessage(`S:${bookingData.bagSizes.S}, M:${bookingData.bagSizes.M}, L:${bookingData.bagSizes.L}, XL:${bookingData.bagSizes.XL} ${(t.bee_ai?.total_bags_template || "(총 {count}개)").replace('{count}', totalBags.toString())}`);
        nextStep('CONFIRM');
    };

    const handleFinalConfirm = () => {
        addUserMessage(t.bee_ai?.btn_yes || "네, 예약할게요!");

        const totalBags = (bookingData.bagSizes.S || 0) + (bookingData.bagSizes.M || 0) + (bookingData.bagSizes.L || 0) + (bookingData.bagSizes.XL || 0);

        // Construct booking data for state management
        const finalBooking = {
            ...bookingData,
            bags: totalBags,
            status: BookingStatus.PENDING,
            createdAt: new Date().toISOString(),
            pickupLocation: bookingData.location,
            dropoffLocation: bookingData.destinationLocation,
            agreedToHighValue: consents.highValue,
            finalPrice: calculateSimplePrice(bookingData) // Add a simple price calc
        };

        if (onSuccess) {
            onSuccess(finalBooking);
        }
        setStep('DONE');
    };

    // Simple price calculation for AI bookings (v2 might need DB prices)
    const calculateSimplePrice = (data: BookingData) => {
        const basePrice = data.serviceType === 'DELIVERY' ? 25000 : 10000;
        const bagTotal = (data.bagSizes.S * 5000) + (data.bagSizes.M * 8000) + (data.bagSizes.L * 12000) + (data.bagSizes.XL * 15000);
        return basePrice + bagTotal;
    };

    // --- HELPERS ---
    const generateTimeOptions = (start: number, end: number) => {
        const options = [];
        for (let h = start; h <= end; h++) {
            const hStr = h.toString().padStart(2, '0');
            options.push(`${hStr}:00`);
            if (h < end) {
                options.push(`${hStr}:30`);
            }
        }
        return options;
    };

    // --- RENDERERS ---

    const renderInputArea = () => {
        if (step === 'INFO') {
            const snsOptions = [
                { id: 'kakao', name: t.booking?.sns_channels?.kakao || '카카오톡' },
                { id: 'line', name: t.booking?.sns_channels?.line || '라인' },
                { id: 'whatsapp', name: t.booking?.sns_channels?.whatsapp || '왓츠앱' },
                { id: 'instagram', name: t.booking?.sns_channels?.instagram || '인스타그램' },
                { id: 'wechat', name: t.booking?.sns_channels?.wechat || '위챗' },
                { id: 'other', name: t.booking?.sns_channels?.other || '기타' }
            ];

            return (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-white rounded-2xl border-2 border-bee-yellow shadow-xl w-full max-w-[90%] self-end">
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 mb-1 block">{t.booking?.name || "이름"}</label>
                            <input
                                type="text"
                                placeholder={t.booking?.name || "이름"}
                                className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:border-bee-yellow outline-none transition-all"
                                onChange={(e) => setBookingData(prev => ({ ...prev, userName: e.target.value }))}
                                value={bookingData.userName}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 mb-1 block">{t.booking?.email || "이메일"}</label>
                            <input
                                type="email"
                                placeholder={t.booking?.email || "이메일"}
                                className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:border-bee-yellow outline-none transition-all"
                                onChange={(e) => setBookingData(prev => ({ ...prev, userEmail: e.target.value }))}
                                value={bookingData.userEmail}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 mb-1 block">{t.booking?.sns || "SNS 채널"}</label>
                                <select
                                    title="SNS Channel"
                                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:border-bee-yellow outline-none bg-white transition-all appearance-none cursor-pointer"
                                    onChange={(e) => setBookingData(prev => ({ ...prev, snsChannel: e.target.value }))}
                                    value={bookingData.snsChannel}
                                >
                                    {snsOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 mb-1 block">{t.booking?.snsId || "SNS ID"}</label>
                                <input
                                    type="text"
                                    placeholder="ID"
                                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:border-bee-yellow outline-none transition-all"
                                    onChange={(e) => setBookingData(prev => ({ ...prev, snsId: e.target.value }))}
                                    value={bookingData.snsId}
                                />
                            </div>
                        </div>
                        <button
                            title="Confirm Information"
                            aria-label="Confirm Information"
                            onClick={handleInfoSubmit}
                            disabled={!bookingData.userName || !bookingData.userEmail || !bookingData.snsId}
                            className="w-full py-3 bg-bee-black text-bee-yellow rounded-xl font-bold text-xs hover:bg-black/95 disabled:opacity-50 disabled:grayscale transition-all mt-2"
                        >
                            {t.booking?.next || "다음"}
                        </button>
                    </div>
                </motion.div>
            );
        }

        if (step === 'SERVICE_SELECT') {
            return (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-xl w-full max-w-[90%] self-end">
                    <div className="flex gap-2">
                        <button title="Select Delivery" aria-label="Select Delivery" onClick={() => handleServiceSelect('DELIVERY')} className="flex-1 py-4 bg-bee-black text-bee-yellow rounded-2xl font-black text-xs shadow-lg hover:scale-[1.02] transition-all">
                            {t.bee_ai?.btn_delivery || '배송 (Delivery)'}
                        </button>
                        <button title="Select Storage" aria-label="Select Storage" onClick={() => handleServiceSelect('STORAGE')} className="flex-1 py-4 bg-bee-yellow text-bee-black rounded-2xl font-black text-xs shadow-lg hover:scale-[1.02] transition-all">
                            {t.bee_ai?.btn_storage || '보관 (Storage)'}
                        </button>
                    </div>
                </motion.div>
            );
        }

        if (step === 'DEST_SELECT') {
            const destOptions = locations.filter(l => l.id !== initialLocation?.id && l.supportsDelivery);
            return (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-[90%] self-end">
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {destOptions.map(loc => (
                            <button
                                title={`Select ${getBranchName(loc.id)}`}
                                aria-label={`Select ${getBranchName(loc.id)}`}
                                key={loc.id}
                                onClick={() => handleDestSelect(loc.id)}
                                className="w-full p-3 text-left bg-gray-50 hover:bg-yellow-50 rounded-xl transition-all border border-transparent hover:border-bee-yellow group"
                            >
                                <div className="font-bold text-xs group-hover:text-bee-black">{getBranchName(loc.id)}</div>
                                <div className="text-[10px] text-gray-400 truncate tracking-tight">{loc.address || loc.description}</div>
                            </button>
                        ))}
                    </div>
                </motion.div>
            );
        }

        if (step === 'TIME') {
            const isDelivery = bookingData.serviceType === 'DELIVERY';
            const pickupTimes = isDelivery ? generateTimeOptions(9, 14) : generateTimeOptions(9, 20);
            const returnTimes = isDelivery ? generateTimeOptions(16, 22) : generateTimeOptions(9, 20);

            return (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-[90%] self-end">
                    {!isDelivery && (
                        <div className="text-[10px] text-center text-bee-black font-bold bg-yellow-50 p-2 rounded-lg border border-bee-yellow/20">
                            {t.bee_ai?.storage_note || "📢 20시 이후는 1일 단위 추가 요금이 발생할 수 있어요! 윙윙~"}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 mb-1 block flex items-center gap-1"><Clock size={10} /> {t.booking?.pickup_schedule || "맡기는 시간"}</label>
                            <input type="date" title="Pickup Date" className="w-full text-xs p-2 border border-gray-200 rounded-lg mb-2 focus:border-bee-yellow outline-none" onChange={(e) => setBookingData(prev => ({ ...prev, pickupDate: e.target.value }))} value={bookingData.pickupDate} />
                            <select
                                title="Pickup Time"
                                className={`w-full text-xs p-2 border rounded-lg outline-none ${!bookingData.pickupTime ? 'text-gray-400' : 'text-black border-bee-yellow bg-yellow-50/50'}`}
                                onChange={(e) => setBookingData(prev => ({ ...prev, pickupTime: e.target.value }))}
                                value={bookingData.pickupTime}
                            >
                                <option value="">{t.booking?.select_time || "시간 선택"}</option>
                                {pickupTimes.map(time => <option key={time} value={time}>{time}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 mb-1 block flex items-center gap-1"><Clock size={10} /> {t.booking?.delivery_schedule || "찾는 시간"}</label>
                            <input type="date" title="Drop-off Date" className="w-full text-xs p-2 border border-gray-200 rounded-lg mb-2 focus:border-bee-yellow outline-none" onChange={(e) => setBookingData(prev => ({ ...prev, dropoffDate: e.target.value }))} value={bookingData.dropoffDate} />
                            <select
                                title="Drop-off Time"
                                className={`w-full text-xs p-2 border rounded-lg outline-none ${!bookingData.deliveryTime ? 'text-gray-400' : 'text-black border-bee-yellow bg-yellow-50/50'}`}
                                onChange={(e) => setBookingData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                                value={bookingData.deliveryTime}
                            >
                                <option value="">{t.booking?.select_time || "시간 선택"}</option>
                                {returnTimes.map(time => <option key={time} value={time}>{time}</option>)}
                            </select>
                        </div>
                    </div>

                    <button
                        title="Confirm Schedule"
                        aria-label="Confirm Schedule"
                        onClick={handleTimeSubmit}
                        disabled={!bookingData.pickupDate || !bookingData.pickupTime || !bookingData.dropoffDate || !bookingData.deliveryTime}
                        className="w-full py-3 bg-bee-black text-bee-yellow rounded-xl font-bold text-xs hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {t.booking?.next || "다음"} <ChevronRight className="w-3 h-3 inline ml-1" />
                    </button>
                </motion.div>
            );
        }

        if (step === 'SIZE') {
            const sizes = [
                { id: 'M', label: 'M (18-23")', desc: t.booking?.size_m_desc || '기내용/백팩' },
                { id: 'L', label: 'L (24-26")', desc: t.booking?.size_l_desc || '수하물용' },
                { id: 'XL', label: 'XL (27-30")', desc: t.booking?.size_xl_desc || '대형/골프백' }
            ];

            return (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-3 p-4 bg-white rounded-2xl border-2 border-bee-yellow shadow-xl w-full max-w-[90%] self-end">
                    <div className="space-y-2">
                        {sizes.map((s) => (
                            <div key={s.id} className="flex items-center justify-between bg-gray-50/50 rounded-xl p-3 border border-gray-100 group hover:border-bee-yellow/30 transition-all">
                                <div>
                                    <div className="font-black text-xs text-bee-black">{s.label}</div>
                                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{s.desc}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setBookingData(prev => ({ ...prev, bagSizes: { ...prev.bagSizes, [s.id]: Math.max(0, prev.bagSizes[s.id as keyof typeof prev.bagSizes] - 1) } }))}
                                        className="w-7 h-7 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-bee-black hover:border-bee-yellow transition-all"
                                    >
                                        -
                                    </button>
                                    <span className="w-4 text-center font-black text-xs">{bookingData.bagSizes[s.id as keyof typeof bookingData.bagSizes]}</span>
                                    <button
                                        onClick={() => setBookingData(prev => ({ ...prev, bagSizes: { ...prev.bagSizes, [s.id]: Math.min(10, prev.bagSizes[s.id as keyof typeof prev.bagSizes] + 1) } }))}
                                        className="w-7 h-7 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-bee-black hover:border-bee-yellow transition-all"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowSimulator(true)}
                        className="w-full py-2 bg-yellow-50 border border-bee-yellow/20 rounded-xl font-bold text-[10px] text-bee-black hover:bg-bee-yellow/20 transition-all flex items-center justify-center gap-1.5"
                    >
                        <Ruler className="w-3 h-3 text-bee-yellow" />
                        {t.size_simulator?.header_title || "사이즈 체크"}
                    </button>
                    <button
                        title="Confirm Bag Sizes"
                        aria-label="Confirm Bag Sizes"
                        onClick={handleSizeSubmit}
                        disabled={(bookingData.bagSizes.S + bookingData.bagSizes.M + bookingData.bagSizes.L + bookingData.bagSizes.XL) === 0}
                        className="w-full py-3 bg-bee-black text-bee-yellow rounded-xl font-bold text-xs hover:bg-black/90 disabled:opacity-50 transition-all"
                    >
                        {t.booking?.confirm || "확인"} <ChevronRight className="w-3 h-3 inline ml-1" />
                    </button>
                </motion.div>
            )
        }

        if (step === 'CONFIRM') {
            return (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-5 bg-white rounded-[24px] border-2 border-bee-yellow shadow-xl w-full max-w-[90%] self-end">
                    <div className="space-y-3 mb-5">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                            <Sparkles className="w-4 h-4 text-bee-yellow" />
                            <span className="font-black text-sm">{t.booking?.confirm || "최종 예약 확인"}</span>
                        </div>
                        <div className="flex justify-between text-xs items-center">
                            <span className="text-gray-400 font-bold">{t.booking?.service_label || "서비스"}</span>
                            <span className="font-bold text-bee-black">
                                {bookingData.serviceType === 'DELIVERY' ? (t.booking?.delivery || '배송') : (t.booking?.storage || '보관')}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs items-center">
                            <span className="text-gray-400 font-bold">{t.booking?.pickup_schedule_label || "일정"}</span>
                            <div className="text-right">
                                <div className="font-bold">{bookingData.pickupDate} {bookingData.pickupTime}</div>
                                <div className="text-gray-300 text-[10px]">~ {bookingData.dropoffDate} {bookingData.deliveryTime}</div>
                            </div>
                        </div>
                        <div className="flex justify-between text-xs items-center">
                            <span className="text-gray-400 font-bold">{t.booking?.from_label || "출발 지점"}</span>
                            <span className="font-bold text-bee-black">
                                {getBranchName(bookingData.location || '')}
                            </span>
                        </div>
                        {bookingData.serviceType === 'DELIVERY' && (
                            <div className="flex justify-between text-xs items-center">
                                <span className="text-gray-400 font-bold">{t.booking?.to_label || "도착 지점"}</span>
                                <span className="font-bold text-blue-500">
                                    {getBranchName(bookingData.destinationLocation || '')}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between text-xs items-center">
                            <span className="text-gray-400 font-bold">{t.booking?.bags_label || "물류"}</span>
                            <div className="font-bold text-right space-y-0.5">
                                {bookingData.bagSizes.S > 0 && <div>S x {bookingData.bagSizes.S}</div>}
                                {bookingData.bagSizes.M > 0 && <div>M x {bookingData.bagSizes.M}</div>}
                                {bookingData.bagSizes.L > 0 && <div>L x {bookingData.bagSizes.L}</div>}
                                {bookingData.bagSizes.XL > 0 && <div>XL x {bookingData.bagSizes.XL}</div>}
                            </div>
                        </div>

                        {/* Consents */}
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={consents.terms} onChange={e => setConsents(prev => ({ ...prev, terms: e.target.checked }))} className="w-4 h-4 accent-bee-yellow" />
                                <span className="text-[10px] font-bold text-gray-500 group-hover:text-bee-black transition-colors">
                                    {(t.terms?.agree_format || "{link}에 동의합니다").split('{link}').map((part: string, i: number) => (
                                        i === 1 ? (
                                            <span key={i} className="underline cursor-pointer hover:text-bee-black" onClick={(e) => { e.preventDefault(); window.open('/terms', '_blank'); }}>
                                                {t.terms?.link_usage || "이용 약관"}
                                            </span>
                                        ) : <span key={i}>{part}</span>
                                    ))}
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={consents.privacy} onChange={e => setConsents(prev => ({ ...prev, privacy: e.target.checked }))} className="w-4 h-4 accent-bee-yellow" />
                                <span className="text-[10px] font-bold text-gray-500 group-hover:text-bee-black transition-colors">
                                    {(t.terms?.agree_format || "{link}에 동의합니다").split('{link}').map((part: string, i: number) => (
                                        i === 1 ? (
                                            <span key={i} className="underline cursor-pointer hover:text-bee-black" onClick={(e) => { e.preventDefault(); window.open('/privacy', '_blank'); }}>
                                                {t.terms?.link_privacy || "개인정보 처리방침"}
                                            </span>
                                        ) : <span key={i}>{part}</span>
                                    ))}
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={consents.highValue} onChange={e => setConsents(prev => ({ ...prev, highValue: e.target.checked }))} className="w-4 h-4 accent-bee-yellow" />
                                <span className="text-[10px] font-bold text-gray-500 group-hover:text-bee-black transition-colors">
                                    {(t.terms?.agree_format || "{link}에 동의합니다").split('{link}').map((part: string, i: number) => (
                                        i === 1 ? (
                                            <span key={i} className="underline cursor-pointer hover:text-bee-black" onClick={(e) => { e.preventDefault(); window.open('/terms#insurance', '_blank'); }}>
                                                {t.terms?.link_insurance || "고가 물품 및 보상 규정"}
                                            </span>
                                        ) : <span key={i}>{part}</span>
                                    ))}
                                </span>
                            </label>
                        </div>
                    </div>
                    <button
                        onClick={handleFinalConfirm}
                        disabled={!consents.terms || !consents.privacy || !consents.highValue}
                        className="w-full py-4 bg-bee-yellow text-bee-black rounded-xl font-black text-sm shadow-lg hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                    >
                        {t.booking?.book_now || "예약 확정하기"} <CheckCircle2 className="w-4 h-4" />
                    </button>
                </motion.div>
            )
        }

        return null;
    };

    if (!t) return null;

    return (
        <section className="w-full h-full bg-white/60 backdrop-blur-md overflow-hidden flex flex-col relative">
            {/* Header */}
            <div className="p-4 bg-white/80 border-b border-gray-100 flex items-center justify-between backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-bee-yellow rounded-full flex items-center justify-center shadow-lg text-lg animate-bee-float border-2 border-white">🐝</div>
                    <div>
                        <h4 className="font-black text-sm text-bee-black tracking-tight">{t.chatbot?.header || "Bee AI"}</h4>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Online</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {stepHistory.length > 0 && (
                        <button
                            onClick={handlePrevStep}
                            title="Previous Step"
                            aria-label="Previous Step"
                            className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ChevronRight className="w-3 h-3 text-gray-400 rotate-180" />
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setStep('INIT');
                            setStepHistory([]);
                            setMessages([]);
                            setBookingData({
                                pickupDate: '', pickupTime: '', returnDate: '', deliveryTime: '',
                                location: initialLocation ? initialLocation.id : null,
                                destinationLocation: null,
                                serviceType: initialServiceType || null,
                                bagSizes: { S: 0, M: 1, L: 0, XL: 0 },
                                userName: '', userEmail: '', snsChannel: 'kakao', snsId: '',
                                dropoffDate: ''
                            });
                        }}
                        title="Reset Reservation"
                        aria-label="Reset Reservation"
                        className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <RefreshCcw className="w-3 h-3 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-white/30 pb-32">
                {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'bot' && (
                            <div className="w-7 h-7 rounded-full bg-bee-yellow flex items-center justify-center text-xs mr-2 shadow-sm border border-white shrink-0 self-end mb-1">🐝</div>
                        )}
                        <div
                            className={`max-w-[85%] px-4 py-3 text-xs font-medium leading-relaxed shadow-sm
                                ${msg.role === 'user'
                                    ? 'bg-bee-black text-bee-yellow rounded-[18px] rounded-tr-none'
                                    : 'bg-white text-gray-800 rounded-[18px] rounded-tl-none border border-gray-100'
                                }
                            `}
                        >
                            {msg.text}
                            {msg.component}
                        </div>
                    </motion.div>
                ))}

                {/* Input Area (Overlay at bottom) */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none">
                    <div className="pointer-events-auto flex flex-col items-end">
                        {step !== 'DONE' && step !== 'INIT' && renderInputArea()}
                    </div>
                </div>

                <div ref={messagesEndRef} />
            </div>

            <BeeSizeSimulator
                t={t}
                lang={lang}
                isOpen={showSimulator}
                onClose={() => setShowSimulator(false)}
            />
        </section>
    );
}
