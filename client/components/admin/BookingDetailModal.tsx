import React from 'react';
import { BookingState, LocationOption, ServiceType, BookingStatus, SnsType, BagSizes, DiscountCode } from '../../types';

import { StorageService } from '../../services/storageService';

interface BookingDetailModalProps {
    selectedBooking: BookingState | null;
    setSelectedBooking: (b: BookingState | null) => void;
    locations: LocationOption[];
    getStatusStyle: (s: BookingStatus) => string;
    handlePrintLabel: (b: BookingState) => void;
    handleUpdateBooking: () => void;
    isSaving: boolean;
    handleResendEmail: (booking: BookingState) => void;
    sendingEmailId: string | null;
    handleRefund?: (booking: BookingState) => void;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
    selectedBooking,
    setSelectedBooking,
    locations,
    getStatusStyle,
    handlePrintLabel,
    handleUpdateBooking,
    isSaving,
    handleResendEmail,
    sendingEmailId,
    handleRefund
}) => {
    const [promoCode, setPromoCode] = React.useState('');
    const [isApplyingPromo, setIsApplyingPromo] = React.useState(false);

    if (!selectedBooking) return null;

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;
        setIsApplyingPromo(true);
        try {
            const codeData = await StorageService.validateDiscountCode(promoCode);
            if (codeData) {
                const discountPerBag = codeData.amountPerBag;
                const totalDiscount = (selectedBooking.bags || 0) * discountPerBag;

                // Calculate current full price without existing discount
                const currentFinal = selectedBooking.finalPrice || 0;
                const currentDiscount = selectedBooking.discountAmount || 0;
                const basePrice = currentFinal + currentDiscount;

                const newFinalPrice = Math.max(0, basePrice - totalDiscount);

                setSelectedBooking({
                    ...selectedBooking,
                    discountAmount: totalDiscount,
                    finalPrice: newFinalPrice
                });
                setPromoCode('');
                alert(`할인 코드[${codeData.code}]가 적용되었습니다. (₩${totalDiscount.toLocaleString()} 할인)`);
            } else {
                alert('유효하지 않은 할인 코드입니다.');
            }
        } catch (e) {
            console.error(e);
            alert('할인 코드 검증 중 오류가 발생했습니다.');
        } finally {
            setIsApplyingPromo(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-scale-up border border-gray-100">
                {/* Modal Header */}
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${selectedBooking.serviceType === ServiceType.DELIVERY ? 'bg-bee-yellow' : 'bg-bee-blue text-white'}`}>
                            <i className={`fa-solid ${selectedBooking.serviceType === ServiceType.DELIVERY ? 'fa-truck-fast' : 'fa-warehouse'}`}></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-bee-black">예약 상세 내역</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Booking ID: {selectedBooking.id}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button title="Close" aria-label="Close" onClick={() => { setSelectedBooking(null); }} className="w-10 h-10 rounded-full bg-white text-gray-400 hover:text-bee-black transition-colors flex items-center justify-center shadow-sm border border-gray-100"><i className="fa-solid fa-xmark"></i></button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Section 1: Customer Info */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1 h-4 bg-bee-yellow rounded-full"></span> 고객 정보
                            </h3>
                            <div className="bg-gray-50 p-6 rounded-3xl space-y-4 border border-gray-100">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">성함 (Name)</label>
                                    <input title="성함" placeholder="성함 입력" value={selectedBooking.userName || ''} onChange={e => setSelectedBooking({ ...selectedBooking, userName: e.target.value })} className="w-full bg-white p-3 rounded-xl border border-gray-200 font-bold text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">이메일 (Email)</label>
                                    <input title="이메일" placeholder="이메일 입력" value={selectedBooking.userEmail || ''} onChange={e => setSelectedBooking({ ...selectedBooking, userEmail: e.target.value })} className="w-full bg-white p-3 rounded-xl border border-gray-200 font-bold text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">연락처 (SNS)</label>
                                    <div className="flex gap-2">
                                        <select title="SNS 종류" value={selectedBooking.snsType} onChange={e => setSelectedBooking({ ...selectedBooking, snsType: e.target.value as SnsType })} className="bg-white p-3 rounded-xl border border-gray-200 font-bold text-sm">
                                            {Object.values(SnsType).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <input title="SNS ID" placeholder="SNS ID 입력" value={selectedBooking.snsId || ''} onChange={e => setSelectedBooking({ ...selectedBooking, snsId: e.target.value })} className="flex-1 bg-white p-3 rounded-xl border border-gray-200 font-bold text-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Booking Details */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1 h-4 bg-bee-blue rounded-full"></span> 서비스 상세 (날짜/시간)
                            </h3>
                            <div className="bg-gray-50 p-6 rounded-3xl space-y-4 border border-gray-100">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">날짜 (Date)</label>
                                        <input title="수거 날짜" type="date" value={selectedBooking.pickupDate || ''} onChange={e => setSelectedBooking({ ...selectedBooking, pickupDate: e.target.value })} className="w-full bg-white p-3 rounded-xl border border-gray-200 font-bold text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">상태 (Status)</label>
                                        <select title="예약 상태" value={selectedBooking.status} onChange={e => setSelectedBooking({ ...selectedBooking, status: e.target.value as BookingStatus })} className={`w-full p-2.5 rounded-xl border-none outline-none font-black text-xs cursor-pointer shadow-sm ${getStatusStyle(selectedBooking.status || BookingStatus.PENDING)}`}>
                                            {Object.values(BookingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">수거/보관 시작 시간</label>
                                        <input title="수거 시간" type="time" value={selectedBooking.pickupTime || ''} onChange={e => setSelectedBooking({ ...selectedBooking, pickupTime: e.target.value })} className="w-full bg-white p-3 rounded-xl border border-gray-200 font-bold text-sm" />
                                    </div>
                                    {selectedBooking.serviceType === ServiceType.DELIVERY && (
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">배송 완료 시간</label>
                                            <input title="배송 시간" type="time" value={selectedBooking.deliveryTime || ''} onChange={e => setSelectedBooking({ ...selectedBooking, deliveryTime: e.target.value })} className="w-full bg-white p-3 rounded-xl border border-gray-200 font-bold text-sm" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Route & Bags */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1 h-4 bg-purple-500 rounded-full"></span> 경로 및 짐 정보
                        </h3>
                        <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 flex flex-col md:flex-row gap-8">
                            <div className="flex-1 space-y-4">
                                <div className="relative pl-6 border-l-2 border-dashed border-gray-200">
                                    <div className="absolute top-0 left-[-6px] w-3 h-3 rounded-full bg-bee-yellow"></div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">출발지 (Pickup)</label>
                                    <div className="flex gap-2 mb-2">
                                        <select
                                            title="출발 지점"
                                            value={selectedBooking.pickupLocation}
                                            onChange={e => setSelectedBooking({ ...selectedBooking, pickupLocation: e.target.value })}
                                            className="flex-1 bg-white p-2 rounded-lg border border-gray-200 text-xs font-bold"
                                        >
                                            {locations.filter(l => l.supportsDelivery || l.supportsStorage).map(l => (
                                                <option key={l.id} value={l.id}>{l.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <input
                                            value={selectedBooking.pickupAddress || ''}
                                            onChange={e => setSelectedBooking({ ...selectedBooking, pickupAddress: e.target.value })}
                                            className="w-full bg-white p-2 rounded-lg border border-gray-200 text-xs font-bold"
                                            placeholder="주소"
                                        />
                                        <input
                                            value={selectedBooking.pickupAddressDetail || ''}
                                            onChange={e => setSelectedBooking({ ...selectedBooking, pickupAddressDetail: e.target.value })}
                                            className="w-full bg-white p-2 rounded-lg border border-gray-200 text-xs font-bold"
                                            placeholder="상세 주소"
                                        />
                                    </div>
                                </div>

                                {selectedBooking.agreedToPremium && (
                                    <div className="p-4 bg-bee-yellow/5 rounded-2xl border border-bee-yellow/20 space-y-2 mb-4">
                                        <h4 className="text-[10px] font-black text-bee-black uppercase tracking-widest">고가품 안심보장 정보</h4>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-gray-500">보장 한도 (Level)</span>
                                            <span className="font-black text-bee-black">{selectedBooking.insuranceLevel}M KRW (+₩{(Number(selectedBooking.insuranceLevel || 0) * 10000).toLocaleString()}/개)</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-gray-500">적용 가방 수</span>
                                            <span className="font-black text-bee-black">{selectedBooking.insuranceBagCount} / {selectedBooking.bags}개</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs border-t border-bee-yellow/10 pt-2 mt-2">
                                            <span className="font-bold text-gray-500">보험 할증 총액</span>
                                            <span className="font-black text-bee-black">₩{((selectedBooking.insuranceLevel || 0) * 10000 * (selectedBooking.insuranceBagCount || 0)).toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}

                                {selectedBooking.serviceType === ServiceType.DELIVERY && (
                                    <div className="relative pl-6 border-l-2 border-dashed border-gray-200">
                                        <div className="absolute bottom-0 left-[-6px] w-3 h-3 rounded-full bg-bee-black"></div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">도착지 (Dropoff)</label>
                                        <div className="flex gap-2 mb-2">
                                            <select
                                                title="도착 지점"
                                                value={selectedBooking.dropoffLocation}
                                                onChange={e => setSelectedBooking({ ...selectedBooking, dropoffLocation: e.target.value })}
                                                className="flex-1 bg-white p-2 rounded-lg border border-gray-200 text-xs font-bold"
                                            >
                                                <option value="">- 선택 안함 -</option>
                                                {locations.filter(l => l.supportsDelivery).map(l => (
                                                    <option key={l.id} value={l.id}>{l.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <input
                                                value={selectedBooking.dropoffAddress || ''}
                                                onChange={e => setSelectedBooking({ ...selectedBooking, dropoffAddress: e.target.value })}
                                                className="w-full bg-white p-2 rounded-lg border border-gray-200 text-xs font-bold"
                                                placeholder="주소"
                                            />
                                            <input
                                                value={selectedBooking.dropoffAddressDetail || ''}
                                                onChange={e => setSelectedBooking({ ...selectedBooking, dropoffAddressDetail: e.target.value })}
                                                className="w-full bg-white p-2 rounded-lg border border-gray-200 text-xs font-bold"
                                                placeholder="상세 주소"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">총 수량 (Total Bags)</label>
                                    <input
                                        title="총 가방 수량"
                                        placeholder="수량"
                                        type="number"
                                        value={selectedBooking.bags || 0}
                                        onChange={e => setSelectedBooking({ ...selectedBooking, bags: Number(e.target.value) })}
                                        className="w-full text-2xl font-black text-bee-black bg-white border border-gray-200 p-2 rounded-2xl"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['S', 'M', 'L', 'XL'] as const).map(size => (
                                        <div key={size}>
                                            <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">{size} Size</label>
                                            <input
                                                title={`${size} 사이즈 수량`}
                                                placeholder="수량"
                                                type="number"
                                                value={(selectedBooking.bagSizes as any)?.[size] || 0}
                                                onChange={e => {
                                                    const newSizes = { ...(selectedBooking.bagSizes || { S: 0, M: 0, L: 0, XL: 0 }), [size]: Number(e.target.value) };
                                                    const total = Object.values(newSizes).reduce((a, b) => Number(a) + Number(b), 0);
                                                    setSelectedBooking({ ...selectedBooking, bagSizes: newSizes, bags: total });
                                                }}
                                                className="w-full bg-white p-2 rounded-xl border border-gray-200 text-xs font-black"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {(selectedBooking.weightSurcharge5kg || 0) + (selectedBooking.weightSurcharge10kg || 0) > 0 && (
                                <div className="w-full pt-4 border-t border-gray-100 space-y-2">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-2">무게 추가 (Weight)</div>
                                    {selectedBooking.weightSurcharge5kg ? (
                                        <div className="flex justify-between items-center bg-red-50 px-3 py-1.5 rounded-xl border border-red-100">
                                            <span className="text-[10px] font-bold text-red-600">5kg 추가</span>
                                            <span className="text-[10px] font-black text-red-700">{selectedBooking.weightSurcharge5kg}개</span>
                                        </div>
                                    ) : null}
                                    {selectedBooking.weightSurcharge10kg ? (
                                        <div className="flex justify-between items-center bg-red-50 px-3 py-1.5 rounded-xl border border-red-100">
                                            <span className="text-[10px] font-bold text-red-600">10kg 추가</span>
                                            <span className="text-[10px] font-black text-red-700">{selectedBooking.weightSurcharge10kg}개</span>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Section 4: Payment Summary - [스봉이 신설] 럭셔리 영수증 섹션 💅 */}
                    <div className="p-8 bg-gray-900 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-bee-yellow/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                            <span className="w-1 h-3 bg-bee-yellow rounded-full"></span> Payment Summary
                        </h3>

                        <div className="grid grid-cols-2 gap-8 relative z-10">
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2">Method</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-bee-yellow text-xs">
                                        <i className={`fa-solid ${selectedBooking.paymentMethod === 'cash' ? 'fa-money-bill-1' : 'fa-credit-card'}`}></i>
                                    </div>
                                    <span className="text-white text-xs font-black">{selectedBooking.paymentMethod || 'Credit Card'}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2">Status</label>
                                <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-green-500/20">
                                    Paid
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/5 space-y-2 relative z-10">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-gray-500 uppercase">Subtotal</span>
                                <span className="font-bold text-gray-400">₩{((selectedBooking.finalPrice || 0) + (selectedBooking.discountAmount || 0)).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-red-400 uppercase">Discount</span>
                                <span className="font-black text-red-500">- ₩{(selectedBooking.discountAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                <span className="text-[10px] font-black text-bee-yellow uppercase tracking-widest">Final Amount</span>
                                <span className="text-2xl font-black text-white tracking-tighter">
                                    <span className="text-bee-yellow text-xs mr-0.5">₩</span>
                                    {(selectedBooking.finalPrice || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Section 5: AI Analysis */}
                    {selectedBooking.aiAnalysis && (
                        <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100 italic text-sm text-purple-700 font-medium">
                            <i className="fa-solid fa-wand-magic-sparkles mr-2 text-purple-500"></i>
                            {selectedBooking.aiAnalysis}
                        </div>
                    )}

                    {/* Section 6: Discount & Final Payment [스봉이 이동] 💅 */}
                    <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">할인 상세 (Discount):</span>
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${selectedBooking.promoCode ? 'bg-bee-yellow text-bee-black shadow-sm' : 'bg-gray-200 text-gray-400'}`}>
                                            {selectedBooking.promoCode || 'No Code'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                title="신규 할인 코드"
                                                type="text"
                                                placeholder="신규 할인 코드"
                                                value={promoCode}
                                                onChange={e => setPromoCode(e.target.value)}
                                                className="w-32 bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-bee-yellow shadow-sm"
                                            />
                                            <button
                                                onClick={handleApplyPromo}
                                                disabled={isApplyingPromo || !promoCode.trim()}
                                                className="px-4 py-2.5 bg-bee-yellow text-bee-black text-[10px] font-black rounded-xl hover:bg-bee-black hover:text-bee-yellow transition-all shadow-md active:scale-95 disabled:opacity-50"
                                            >
                                                {isApplyingPromo ? <i className="fa-solid fa-spinner animate-spin"></i> : '코드 적용'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-red-500 bg-white/50 p-2 rounded-xl border border-red-50 w-fit">
                                        <span className="font-black text-sm">추가 할인: -₩</span>
                                        <input
                                            title="할인 금액"
                                            type="number"
                                            value={selectedBooking.discountAmount || 0}
                                            onChange={e => {
                                                const disc = Number(e.target.value);
                                                const currentFinal = selectedBooking.finalPrice || 0;
                                                const currentDiscount = selectedBooking.discountAmount || 0;
                                                const basePrice = currentFinal + currentDiscount;
                                                const newFinal = Math.max(0, basePrice - disc);

                                                setSelectedBooking({
                                                    ...selectedBooking,
                                                    discountAmount: disc,
                                                    finalPrice: newFinal
                                                });
                                            }}
                                            className="w-24 bg-transparent font-black text-sm focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">최종 결제 금액 합계:</span>
                                <div className="text-3xl font-black text-bee-black flex items-center justify-end gap-1">
                                    <span className="text-sm">₩</span>
                                    <span>{(selectedBooking.finalPrice || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer [스봉이 가벼워졌어요] 💅 */}
                <div className="p-8 border-t border-gray-50 bg-gray-50/50 flex items-center justify-end gap-4">
                    <button
                        onClick={() => handlePrintLabel(selectedBooking)}
                        className="bg-white text-gray-600 border border-gray-200 px-8 py-4 rounded-2xl font-black text-sm hover:bg-gray-100 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                    >
                        <i className="fa-solid fa-print"></i> 라벨 출력
                    </button>
                    <button
                        onClick={handleUpdateBooking}
                        disabled={isSaving}
                        className="bg-bee-black text-bee-yellow px-12 py-4 rounded-2xl font-black text-sm hover:scale-105 hover:bg-gray-800 transition-all shadow-xl flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-check"></i>}
                        정보 업데이트 완료
                    </button>
                    <button
                        onClick={() => handleResendEmail(selectedBooking)}
                        disabled={sendingEmailId === selectedBooking.id}
                        className="bg-bee-yellow text-bee-black px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 hover:bg-bee-black hover:text-bee-yellow transition-all shadow-xl flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        {sendingEmailId === selectedBooking.id ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-envelope"></i>}
                        바우처 재발송
                    </button>
                    {handleRefund && (
                        <button
                            onClick={() => handleRefund(selectedBooking)}
                            className="bg-red-50 text-red-500 border border-red-100 px-8 py-4 rounded-2xl font-black text-sm hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2"
                        >
                            <i className="fa-solid fa-rotate-left"></i> 반품(환불) 처리
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingDetailModal;
