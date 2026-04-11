import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookingState, LocationOption, ServiceType, BookingStatus, SnsType, BagSizes, Expenditure } from '../../types';
import { OPERATING_STATUS_CONFIG, BOOKING_STATUS_DISPLAY_MAP } from '../../src/constants/admin';
import { COUNTRY_NAMES } from '../../src/constants/countries';
import { StorageService } from '../../services/storageService';
import { AuditService } from '../../services/auditService';
import { maskName, maskEmail, maskPhone, maskId } from '../../src/utils/maskUtils';
import {
    createEmptyBagSizes,
    getBagCategoriesForService,
    getBagCategoryCount,
    getBagCategoryLabel,
    sanitizeDeliveryBagSizes,
    setBagCategoryCount,
} from '../../src/domains/booking/bagCategoryUtils';

interface BookingSidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    selectedBooking: BookingState | null;
    bookings: BookingState[];
    expenditures: Expenditure[];
    setSelectedBooking: (booking: BookingState | null) => void;
    locations: LocationOption[];
    getStatusStyle: (s: BookingStatus) => string;
    handlePrintLabel: (b: BookingState) => void;
    handleUpdateBooking: () => void;
    isSaving: boolean;
    handleResendEmail: (booking: BookingState) => void;
    sendingEmailId: string | null;
    handleRefund?: (booking: BookingState) => void;
    adminRole?: string;
    adminEmail?: string;
    adminName?: string;
    t: any;
}



const BookingSidePanel: React.FC<BookingSidePanelProps> = ({
    isOpen,
    onClose,
    selectedBooking,
    bookings,
    expenditures,
    setSelectedBooking,
    locations,
    getStatusStyle,
    handlePrintLabel,
    handleUpdateBooking,
    isSaving,
    handleResendEmail,
    sendingEmailId,
    handleRefund,
    adminRole = 'staff',
    adminEmail,
    adminName,
    t
}) => {
    const [promoCode, setPromoCode] = React.useState('');
    const [isApplyingPromo, setIsApplyingPromo] = React.useState(false);
    const [isUnmasked, setIsUnmasked] = React.useState(false);

    const currentActor = { id: adminName || 'unknown', name: adminName || 'unknown', email: adminEmail };

    // 🛡️ [스봉이] 민감 정보 열람 시 자동 로깅
    React.useEffect(() => {
        if (isOpen && selectedBooking && adminRole !== 'super') {
            AuditService.logAction(currentActor, 'PII_VIEW', { id: selectedBooking.id!, type: 'BOOKING' }, { reason: 'SidePanel Open', masked: true });
        }
    }, [isOpen, selectedBooking?.id]);

    const handleRequestUnmask = async () => {
        if (selectedBooking) {
            await AuditService.logAction(currentActor, 'PII_UNMASK', { id: selectedBooking.id!, type: 'BOOKING' }, { reason: 'Manual Unmask Request' });
            setIsUnmasked(true);
        }
    };

    if (!selectedBooking) return null;

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;
        setIsApplyingPromo(true);
        try {
            const codeData = await StorageService.validateDiscountCode(promoCode);
            if (codeData) {
                const discountPerBag = codeData.amountPerBag;
                const totalDiscount = (selectedBooking.bags || 0) * discountPerBag;
                const currentFinal = selectedBooking.finalPrice || 0;
                const currentDiscount = selectedBooking.discountAmount || 0;
                const basePrice = currentFinal + currentDiscount;
                const newFinalPrice = Math.max(0, basePrice - totalDiscount);

                setSelectedBooking({
                    ...selectedBooking,
                    discountAmount: totalDiscount,
                    finalPrice: newFinalPrice,
                    promoCode: codeData.code
                });
                setPromoCode('');
                alert(`할인 코드[${codeData.code}]가 적용되었습니다. 💅`);
            } else {
                alert('유효하지 않은 할인 코드입니다.');
            }
        } catch (e) {
            console.error(e);
            alert('할인 코드 검증 중 오류 발생');
        } finally {
            setIsApplyingPromo(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[110]"
                    />

                    {/* Side Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[120] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center text-2xl shadow-sm ${selectedBooking.serviceType === ServiceType.DELIVERY ? 'bg-bee-yellow' : 'bg-bee-blue text-white'}`}>
                                    <i className={`fa-solid ${selectedBooking.serviceType === ServiceType.DELIVERY ? 'fa-truck-fast' : 'fa-warehouse'}`}></i>
                                </div>
                                <div className="space-y-1">
                                <h2 className="text-2xl font-black text-bee-black tracking-tight">예약 상세 관리 ✨</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">예약 번호: {selectedBooking.reservationCode || selectedBooking.id}</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-12 h-12 rounded-full hover:bg-gray-100 text-gray-400 hover:text-bee-black transition-all flex items-center justify-center border border-gray-100"
                            title="닫기"
                        >
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>

                    {/* Body Content */}
                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar pb-32">
                        {/* Operating Status Selector */}
                        <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-2">운영상태 시스템 제어 🛡️</label>
                            <div className="relative group/select">
                                <div 
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full z-10 shadow-sm"
                                    style={{ backgroundColor: OPERATING_STATUS_CONFIG[BOOKING_STATUS_DISPLAY_MAP[selectedBooking.status || BookingStatus.PENDING]].color }}
                                />
                                <select
                                    value={selectedBooking.status}
                                    onChange={e => setSelectedBooking({ ...selectedBooking, status: e.target.value as BookingStatus })}
                                    title="운영 상태 실시간 변경"
                                    className="w-full pl-10 pr-10 py-5 rounded-2xl border-2 border-transparent focus:border-bee-yellow bg-white font-black text-sm cursor-pointer appearance-none transition-all shadow-sm outline-none"
                                >
                                    {Object.values(BookingStatus).map(s => (
                                        <option key={s} value={s}>
                                            {OPERATING_STATUS_CONFIG[BOOKING_STATUS_DISPLAY_MAP[s]].label} ({s})
                                        </option>
                                    ))}
                                </select>
                                <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-xs text-gray-300 pointer-events-none group-hover/select:text-bee-black transition-colors"></i>
                            </div>
                            <textarea 
                                placeholder="상태 변경 시 특이사항을 기록하세요 (예: 짐 수거 지연 등)"
                                value={selectedBooking.auditNote || ''}
                                onChange={e => setSelectedBooking({ ...selectedBooking, auditNote: e.target.value })}
                                className="w-full bg-white p-5 rounded-2xl font-bold text-xs h-24 resize-none border-2 border-transparent focus:border-bee-yellow outline-none shadow-sm placeholder:text-gray-300"
                                title="상태 변경 사유 입력"
                            />
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-bee-black uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <span className="w-1.5 h-4 bg-bee-yellow rounded-full"></span> 고객 정보 🛡️
                                    {!isUnmasked && adminRole !== 'super' && (
                                        <button onClick={handleRequestUnmask} className="text-[9px] bg-bee-black text-bee-yellow px-2 py-0.5 rounded-full hover:scale-105 transition-all">정보 열람</button>
                                    )}
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">성함</label>
                                        <input 
                                            title="성함" 
                                            value={(isUnmasked || adminRole === 'super') ? (selectedBooking.userName || '') : maskName(selectedBooking.userName || '')} 
                                            onChange={e => setSelectedBooking({ ...selectedBooking, userName: e.target.value })} 
                                            disabled={!isUnmasked && adminRole !== 'super'}
                                            className="w-full bg-gray-50 p-4 rounded-2xl border-none font-black text-sm focus:ring-2 focus:ring-bee-yellow outline-none disabled:opacity-70" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">이메일 주소</label>
                                        <input 
                                            title="이메일" 
                                            value={(isUnmasked || adminRole === 'super') ? (selectedBooking.userEmail || '') : maskEmail(selectedBooking.userEmail || '')} 
                                            onChange={e => setSelectedBooking({ ...selectedBooking, userEmail: e.target.value })} 
                                            disabled={!isUnmasked && adminRole !== 'super'}
                                            className="w-full bg-gray-50 p-4 rounded-2xl border-none font-black text-sm focus:ring-2 focus:ring-bee-yellow outline-none disabled:opacity-70" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">SNS 연락처 ({selectedBooking.snsType || selectedBooking.snsChannel || 'None'})</label>
                                        <input
                                            title="SNS ID"
                                            value={(isUnmasked || adminRole === 'super') ? (selectedBooking.snsId || '') : maskId(selectedBooking.snsId || '')}
                                            onChange={e => setSelectedBooking({ ...selectedBooking, snsId: e.target.value })}
                                            disabled={!isUnmasked && adminRole !== 'super'}
                                            className="w-full bg-gray-50 p-4 rounded-2xl border-none font-black text-sm focus:ring-2 focus:ring-bee-yellow outline-none disabled:opacity-70"
                                        />
                                    </div>
                                    {selectedBooking.utmSource && (
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">유입 채널</label>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-3 py-1.5 bg-bee-yellow/20 text-bee-black font-black text-xs rounded-xl">
                                                    {selectedBooking.utmSource}
                                                </span>
                                                {selectedBooking.utmMedium && (
                                                    <span className="px-3 py-1.5 bg-gray-100 text-gray-600 font-bold text-xs rounded-xl">
                                                        {selectedBooking.utmMedium}
                                                    </span>
                                                )}
                                                {selectedBooking.utmCampaign && (
                                                    <span className="px-3 py-1.5 bg-gray-100 text-gray-600 font-bold text-xs rounded-xl">
                                                        {selectedBooking.utmCampaign}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-bee-black uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <span className="w-1.5 h-4 bg-bee-blue rounded-full"></span> 서비스 일정
                                    {/* [스봉이] 당일 예약 아니면 본부장님 놀라시지 않게 경고 날려드려요 💅✨ */}
                                    {selectedBooking.pickupDate && selectedBooking.pickupDate !== new Date(new Date().getTime() + 9*60*60*1000 + new Date().getTimezoneOffset()*60000).toISOString().split('T')[0] && (
                                        <span className="ml-auto text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 flex items-center gap-1 animate-bounce">
                                            <i className="fa-solid fa-triangle-exclamation"></i>
                                            당일 예약 아님
                                        </span>
                                    )}
                                </h3>
                                <div className="space-y-4">
                                    <div className={`${selectedBooking.pickupDate && selectedBooking.pickupDate !== new Date(new Date().getTime() + 9*60*60*1000 + new Date().getTimezoneOffset()*60000).toISOString().split('T')[0] ? 'ring-2 ring-amber-200 ring-offset-2 rounded-2xl' : ''}`}>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">수거/시작일</label>
                                        <input title="수거 날짜" type="date" value={selectedBooking.pickupDate || ''} onChange={e => setSelectedBooking({ ...selectedBooking, pickupDate: e.target.value })} className="w-full bg-gray-50 p-4 rounded-2xl border-none font-black text-sm focus:ring-2 focus:ring-bee-yellow outline-none" />
                                    </div>
                                    {selectedBooking.serviceType === ServiceType.STORAGE && (
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">반환/종료일</label>
                                            <input title="반환 날짜" type="date" value={selectedBooking.dropoffDate || ''} onChange={e => setSelectedBooking({ ...selectedBooking, dropoffDate: e.target.value })} className="w-full bg-gray-50 p-4 rounded-2xl border-none font-black text-sm focus:ring-2 focus:ring-bee-yellow outline-none" />
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">시작시간</label>
                                            <input title="시작 시간" type="time" value={selectedBooking.pickupTime || ''} onChange={e => setSelectedBooking({ ...selectedBooking, pickupTime: e.target.value })} className="w-full bg-gray-50 p-4 rounded-2xl border-none font-black text-xs focus:ring-2 focus:ring-bee-yellow outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">완료/반환시간</label>
                                            <input title="완료 시간" type="time" value={selectedBooking.deliveryTime || ''} onChange={e => setSelectedBooking({ ...selectedBooking, deliveryTime: e.target.value })} className="w-full bg-gray-50 p-4 rounded-2xl border-none font-black text-xs focus:ring-2 focus:ring-bee-yellow outline-none" />
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">관할 지점 (Branch)</label>
                                        <div className="w-full bg-gray-900 text-bee-yellow p-4 rounded-2xl font-black text-sm flex items-center gap-3 shadow-lg">
                                            <i className="fa-solid fa-warehouse"></i>
                                            {selectedBooking.branchName || '지점 정보 없음 🐝'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Route & Bags */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-bee-black uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span> 운송 및 물류 현황
                            </h3>
                            <div className="bg-white p-8 rounded-[40px] border-2 border-gray-100 space-y-8 relative overflow-hidden group hover:border-emerald-500/20 transition-all">
                                <div className="absolute top-0 right-0 p-6 text-gray-50 group-hover:text-emerald-500/5 transition-colors">
                                    <i className="fa-solid fa-route text-8xl"></i>
                                </div>
                                <div className="space-y-6 relative z-10">
                                    <div className="relative pl-8 border-l-2 border-dashed border-gray-200">
                                        <div className="absolute left-[-6px] top-0 w-3 h-3 rounded-full bg-bee-yellow shadow-lg shadow-bee-yellow/50"></div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                                            {selectedBooking.serviceType === ServiceType.STORAGE ? '기점/입고지 (Origin)' : '출발지 (Origin)'}
                                        </label>
                                        <select title="출발 지점" value={selectedBooking.pickupLocation} onChange={e => setSelectedBooking({ ...selectedBooking, pickupLocation: e.target.value })} className="w-full bg-gray-50 p-3 rounded-xl border-none font-bold text-xs mb-3">
                                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                            {!locations.some(l => l.id === selectedBooking.pickupLocation) && selectedBooking.pickupLocation && (
                                                <option value={selectedBooking.pickupLocation}>{selectedBooking.pickupLocation} (Legacy)</option>
                                            )}
                                        </select>
                                        <input title="출발 상세주소" value={selectedBooking.pickupAddress || ''} onChange={e => setSelectedBooking({ ...selectedBooking, pickupAddress: e.target.value })} placeholder="정확한 주소 정보를 입력하거나 선택하세요" className="w-full bg-gray-50 p-3 rounded-xl border-none font-bold text-xs" />
                                    </div>

                                    <div className="relative pl-8 border-l-2 border-dashed border-gray-200">
                                        <div className="absolute left-[-6px] bottom-0 w-3 h-3 rounded-full bg-bee-black shadow-lg shadow-bee-black/50"></div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                                            {selectedBooking.serviceType === ServiceType.STORAGE ? '종점/반환지 (Destination)' : '도착지 (Destination)'}
                                        </label>
                                        <select title="도착 지점" value={selectedBooking.dropoffLocation} onChange={e => setSelectedBooking({ ...selectedBooking, dropoffLocation: e.target.value })} className="w-full bg-gray-50 p-3 rounded-xl border-none font-bold text-xs mb-3">
                                            <option value="">- 직접 입력 -</option>
                                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                            {!locations.some(l => l.id === selectedBooking.dropoffLocation) && selectedBooking.dropoffLocation && (
                                                <option value={selectedBooking.dropoffLocation}>{selectedBooking.dropoffLocation} (Legacy)</option>
                                            )}
                                        </select>
                                        <input title="도착 상세주소" value={selectedBooking.dropoffAddress || ''} onChange={e => setSelectedBooking({ ...selectedBooking, dropoffAddress: e.target.value })} placeholder="도착 지점 정보를 입력하세요" className="w-full bg-gray-50 p-3 rounded-xl border-none font-bold text-xs" />
                                    </div>
                                </div>

                                <div className={`pt-6 border-t border-gray-100 grid gap-4 relative z-10 ${selectedBooking.serviceType === ServiceType.DELIVERY ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                                    {getBagCategoriesForService(selectedBooking.serviceType).map(category => {
                                        const count = getBagCategoryCount(selectedBooking.bagSizes, category.id);
                                        return (
                                        <div key={category.id} className="text-center p-3 rounded-2xl group/size transition-colors bg-gray-50 hover:bg-bee-yellow/10">
                                            <div className="text-[9px] font-black text-gray-400 tracking-tight mb-1">{getBagCategoryLabel(category.id, 'ko')}</div>
                                            <input
                                                title={`${getBagCategoryLabel(category.id, 'ko')} 수량`}
                                                type="number"
                                                value={count}
                                                onChange={e => {
                                                    const nextSizes = setBagCategoryCount(selectedBooking.bagSizes || createEmptyBagSizes(), category.id, Number(e.target.value));
                                                    const newSizes = selectedBooking.serviceType === ServiceType.DELIVERY ? sanitizeDeliveryBagSizes(nextSizes) : nextSizes;
                                                    const total = Object.values(newSizes).reduce((a, b) => Number(a) + Number(b), 0);
                                                    setSelectedBooking({ ...selectedBooking, bagSizes: newSizes, bags: total });
                                                }}
                                                disabled={adminRole !== 'super'}
                                                className="w-full bg-transparent text-center font-black text-lg outline-none group-hover/size:text-bee-black disabled:text-gray-300"
                                            />
                                        </div>
                                    )})}
                                </div>
                            </div>
                        </div>

                        {/* Discount & Payment (Redesigned) */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-bee-black uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span> 결제 및 할인 정보
                            </h3>
                            <div className="p-8 bg-gray-900 rounded-[40px] text-white space-y-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute bottom-0 right-0 opacity-10 rotate-12 -mb-10 -mr-10">
                                    <i className="fa-solid fa-receipt text-[200px]"></i>
                                </div>
                                
                                <div className="flex justify-between items-start relative z-10 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1.5 ${selectedBooking.paymentStatus === 'paid' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20' : 'bg-amber-400/15 text-amber-200 border-amber-300/20'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${selectedBooking.paymentStatus === 'paid' ? 'bg-emerald-300' : 'bg-amber-300'}`}></span>
                                                {selectedBooking.paymentStatus === 'paid' ? '결제완료' : '결제대기'}
                                            </span>
                                            {selectedBooking.paymentStatus !== 'paid' && (
                                                <span className="text-[10px] font-bold text-gray-300">
                                                    토스 실결제 전이라 현장 결제 기준으로 처리 중
                                                </span>
                                            )}
                                        </div>
                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">할인 코드 적용 (Promo)</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                title="할인 코드 입력"
                                                placeholder="코드 입력..."
                                                value={promoCode}
                                                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                                className="w-32 bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-black uppercase focus:outline-none focus:border-bee-yellow transition-all"
                                            />
                                            <button
                                                onClick={handleApplyPromo}
                                                disabled={isApplyingPromo || !promoCode.trim()}
                                                className="px-6 py-3 bg-bee-yellow text-bee-black text-[10px] font-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                적용
                                            </button>
                                        </div>
                                        {selectedBooking.promoCode && (
                                            <div className="text-[10px] font-black text-emerald-400 flex items-center gap-2">
                                                <i className="fa-solid fa-circle-check"></i>
                                                적용됨: {selectedBooking.promoCode} (-₩{(selectedBooking.discountAmount || 0).toLocaleString()})
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2">최종 결제 금액</label>
                                        <div className="text-4xl font-black text-bee-yellow tracking-tighter">
                                            <span className="text-sm align-top mr-1">₩</span>
                                            {(selectedBooking.finalPrice || 0).toLocaleString()}
                                        </div>
                                        <div className="text-[10px] font-bold text-gray-400 mt-2">VAT 포함 (10%)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Float Buttons */}
                    <div className="p-8 border-t border-gray-100 bg-white/80 backdrop-blur-3xl sticky bottom-0 z-20 flex items-center justify-center gap-4">
                        <button
                            onClick={() => handlePrintLabel(selectedBooking)}
                            className="flex-1 bg-gray-50 text-gray-600 border border-gray-100 py-5 rounded-[24px] font-black text-xs hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-sm"
                            title="라벨 출력"
                        >
                            <i className="fa-solid fa-print"></i> 라벨 출력
                        </button>
                        <button
                            onClick={() => handleResendEmail(selectedBooking)}
                            disabled={sendingEmailId === selectedBooking.id}
                            className="flex-1 bg-bee-yellow text-bee-black py-5 rounded-[24px] font-black text-xs hover:bg-bee-black hover:text-bee-yellow transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                            title="바우처 재발송"
                        >
                            {sendingEmailId === selectedBooking.id ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-envelope"></i>}
                            바우처 재발송
                        </button>
                        <button
                            onClick={handleUpdateBooking}
                            disabled={isSaving}
                            className="flex-[2] bg-bee-black text-bee-yellow py-5 rounded-[24px] font-black text-xs hover:scale-[1.03] transition-all flex items-center justify-center gap-2 shadow-2xl disabled:opacity-50 active:scale-95"
                            title="예약 정보 업데이트"
                        >
                            {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-shield-halved"></i>}
                            예약 정보 업데이트
                        </button>
                    </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default BookingSidePanel;
