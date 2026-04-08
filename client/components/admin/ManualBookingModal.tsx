import React from 'react';
import { LocationOption, StorageTier, ServiceType, BookingStatus } from '../../types';
import {
    BagCategoryId,
    createEmptyBagSizes,
    getBagCategoriesForService,
    getBagCategoryCount,
    getBagCategoryLabel,
    getStoragePriceForCategory,
    getTotalBags,
    sanitizeBagSizes,
    sanitizeDeliveryBagSizes,
} from '../../src/domains/booking/bagCategoryUtils';

interface ManualBookingModalProps {
    isManualBooking: boolean;
    setIsManualBooking: (b: boolean) => void;
    manualBookingForm: any;
    setManualBookingForm: (f: any) => void;
    locations: LocationOption[];
    storageTiers: StorageTier[];
    deliveryPrices: any;
    calculateManualPrice: (f: any) => number;
    handleResetManualBags: () => void;
    handleAddBagToManual: (categoryId: BagCategoryId) => void;
    handleManualBookingSave: () => void;
    isSaving: boolean;
}

const ManualBookingModal: React.FC<ManualBookingModalProps> = ({
    isManualBooking,
    setIsManualBooking,
    manualBookingForm,
    setManualBookingForm,
    locations,
    storageTiers,
    deliveryPrices,
    calculateManualPrice,
    handleResetManualBags,
    handleAddBagToManual,
    handleManualBookingSave,
    isSaving
}) => {
    if (!isManualBooking) return null;
    const categories = getBagCategoriesForService(manualBookingForm.serviceType || ServiceType.STORAGE);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="text-xl font-black text-bee-black">수동 예약 추가</h2>
                    <button onClick={() => setIsManualBooking(false)} className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 hover:text-bee-black transition-colors flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">서비스 유형</label>
                            <select
                                value={manualBookingForm.serviceType}
                                onChange={e => {
                                    const val = e.target.value as ServiceType;
                                    const currentBagSizes = manualBookingForm.bagSizes || createEmptyBagSizes();
                                    const nextBagSizes = val === ServiceType.DELIVERY
                                        ? sanitizeDeliveryBagSizes(currentBagSizes)
                                        : sanitizeBagSizes(currentBagSizes);
                                    const totalBags = getTotalBags(nextBagSizes);
                                    const next = {
                                        ...manualBookingForm,
                                        serviceType: val,
                                        bagSizes: nextBagSizes,
                                        bags: totalBags,
                                        insuranceBagCount: Math.min(Number(manualBookingForm.insuranceBagCount || totalBags), totalBags)
                                    };
                                    setManualBookingForm({ ...next, finalPrice: calculateManualPrice(next) });
                                }}
                                className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100 focus:border-bee-yellow outline-none"
                            >
                                <option value={ServiceType.DELIVERY}>배송 (Delivery)</option>
                                <option value={ServiceType.STORAGE}>보관 (Storage)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">상태</label>
                            <select
                                value={manualBookingForm.status}
                                onChange={e => setManualBookingForm({ ...manualBookingForm, status: e.target.value as BookingStatus })}
                                className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100 focus:border-bee-yellow outline-none"
                            >
                                {Object.values(BookingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">성함</label>
                            <input value={manualBookingForm.userName} onChange={e => setManualBookingForm({ ...manualBookingForm, userName: e.target.value })} className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100" placeholder="홍길동" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">이메일</label>
                            <input value={manualBookingForm.userEmail} onChange={e => setManualBookingForm({ ...manualBookingForm, userEmail: e.target.value })} className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100" placeholder="user@example.com" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">출발지 (ID)</label>
                                <select value={manualBookingForm.pickupLocation} onChange={e => setManualBookingForm({ ...manualBookingForm, pickupLocation: e.target.value })} className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100 mb-2">
                                    <option value="">출발 지점 선택</option>
                                    {locations.filter(l => l.supportsDelivery || l.supportsStorage).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">출발지 주소</label>
                                <input value={manualBookingForm.pickupAddress || ''} onChange={e => setManualBookingForm({ ...manualBookingForm, pickupAddress: e.target.value })} className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100 mb-2 text-xs" placeholder="호텔명 등" />
                                <input value={manualBookingForm.pickupAddressDetail || ''} onChange={e => setManualBookingForm({ ...manualBookingForm, pickupAddressDetail: e.target.value })} className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100 text-xs" placeholder="상세 주소" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {manualBookingForm.serviceType === ServiceType.DELIVERY && (
                                <>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">도착지 (ID)</label>
                                        <select value={manualBookingForm.dropoffLocation} onChange={e => setManualBookingForm({ ...manualBookingForm, dropoffLocation: e.target.value })} className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100 mb-2">
                                            <option value="">도착 지점 선택</option>
                                            {locations.filter(l => l.supportsDelivery).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">도착지 주소</label>
                                        <input value={manualBookingForm.dropoffAddress || ''} onChange={e => setManualBookingForm({ ...manualBookingForm, dropoffAddress: e.target.value })} className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100 mb-2 text-xs" placeholder="호텔명 등" />
                                        <input value={manualBookingForm.dropoffAddressDetail || ''} onChange={e => setManualBookingForm({ ...manualBookingForm, dropoffAddressDetail: e.target.value })} className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100 text-xs" placeholder="상세 주소" />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">
                                    {manualBookingForm.serviceType === ServiceType.STORAGE ? '보관 시작일' : '날짜'}
                                </label>
                                <input type="date" value={manualBookingForm.pickupDate} onChange={e => {
                                    const next = { ...manualBookingForm, pickupDate: e.target.value };
                                    setManualBookingForm({ ...next, finalPrice: calculateManualPrice(next) });
                                }} className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">
                                    {manualBookingForm.serviceType === ServiceType.STORAGE ? '보관 시작시간' : '수거시간'}
                                </label>
                                <input type="time" value={manualBookingForm.pickupTime} onChange={e => {
                                    const next = { ...manualBookingForm, pickupTime: e.target.value };
                                    setManualBookingForm({ ...next, finalPrice: calculateManualPrice(next) });
                                }} className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100 text-xs" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {manualBookingForm.serviceType === ServiceType.STORAGE && (
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">보관 종료일</label>
                                    <input type="date" value={manualBookingForm.dropoffDate} min={manualBookingForm.pickupDate} onChange={e => {
                                        const next = { ...manualBookingForm, dropoffDate: e.target.value };
                                        setManualBookingForm({ ...next, finalPrice: calculateManualPrice(next) });
                                    }} className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100" />
                                </div>
                            )}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">
                                    {manualBookingForm.serviceType === ServiceType.STORAGE ? '보관 종료시간' : '배송시간'}
                                </label>
                                <input type="time" value={manualBookingForm.deliveryTime} onChange={e => {
                                    const next = { ...manualBookingForm, deliveryTime: e.target.value };
                                    setManualBookingForm({ ...next, finalPrice: calculateManualPrice(next) });
                                }} className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100 text-xs" />
                            </div>
                        </div>

                        {manualBookingForm.serviceType === ServiceType.DELIVERY && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-bee-yellow/5 rounded-2xl border border-bee-yellow/20 relative overflow-hidden">
                                <div className="col-span-2 flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-shield-halved text-bee-black"></i>
                                        <label className="text-[10px] font-black text-bee-black uppercase tracking-widest">고가품 안심보장 (Premium Insurance)</label>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const next = { ...manualBookingForm, useInsurance: !manualBookingForm.useInsurance };
                                            setManualBookingForm({ ...next, finalPrice: calculateManualPrice(next) });
                                        }}
                                        className={`w-12 h-6 rounded-full transition-all relative ${manualBookingForm.useInsurance ? 'bg-bee-black' : 'bg-gray-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${manualBookingForm.useInsurance ? 'left-7 bg-bee-yellow' : 'left-1'}`}></div>
                                    </button>
                                </div>
                                <div className={`col-span-2 transition-all duration-300 ${manualBookingForm.useInsurance ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">보장 한도 선택 (Insurance Level)</label>
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        {[
                                            { level: 1, label: '50~100만원', surcharge: '100% 할증', limit: '1M KRW' },
                                            { level: 2, label: '100~200만원', surcharge: '200% 할증', limit: '2M KRW' },
                                            { level: 3, label: '200~300만원', surcharge: '300% 할증', limit: '3M KRW' }
                                        ].map(item => (
                                            <button
                                                key={item.level}
                                                type="button"
                                                onClick={() => {
                                                    const next = { ...manualBookingForm, insuranceLevel: item.level as 1 | 2 | 3 };
                                                    setManualBookingForm({ ...next, finalPrice: calculateManualPrice(next) });
                                                }}
                                                className={`py-3 px-1 rounded-xl text-[9px] font-black transition-all border-2 flex flex-col items-center justify-center gap-1 ${manualBookingForm.insuranceLevel === item.level ? 'bg-bee-black text-bee-yellow border-bee-black shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-bee-yellow/50'}`}
                                            >
                                                <span className="text-[7px] opacity-60">{item.label}</span>
                                                <span className="text-[10px] leading-tight">{item.surcharge}</span>
                                                <div className={`text-[6px] px-2 py-0.5 rounded-full ${manualBookingForm.insuranceLevel === item.level ? 'bg-bee-yellow/20' : 'bg-gray-50'}`}>{item.limit} Limit</div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-400 uppercase">보험 적용 가방</span>
                                            <span className="text-[10px] font-bold text-bee-black">총 {manualBookingForm.bags}개 중</span>
                                        </div>
                                        <div className="flex items-center bg-gray-50 rounded-lg p-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const next = { ...manualBookingForm, insuranceBagCount: Math.max(0, (manualBookingForm.insuranceBagCount || 0) - 1) };
                                                    setManualBookingForm({ ...next, finalPrice: calculateManualPrice(next) });
                                                }}
                                                className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-gray-400 transition-all"
                                            >
                                                <i className="fa-solid fa-minus text-[10px]"></i>
                                            </button>
                                            <span className="w-8 text-center font-black text-sm">
                                                {manualBookingForm.insuranceBagCount || 0}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const next = { ...manualBookingForm, insuranceBagCount: Math.min(manualBookingForm.bags, (manualBookingForm.insuranceBagCount || 0) + 1) };
                                                    setManualBookingForm({ ...next, finalPrice: calculateManualPrice(next) });
                                                }}
                                                className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-gray-400 transition-all"
                                            >
                                                <i className="fa-solid fa-plus text-[10px]"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                            <div className="flex flex-col items-center gap-4">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        <div className="flex flex-col items-center">
                                            <label className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">할인 금액 (Discount)</label>
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-black text-red-500">-₩</span>
                                                <input
                                                    type="number"
                                                    value={manualBookingForm.discountAmount || 0}
                                                    onChange={e => {
                                                        const next = { ...manualBookingForm, discountAmount: Number(e.target.value) };
                                                        setManualBookingForm({ ...next, finalPrice: calculateManualPrice(next) });
                                                    }}
                                                    className="w-24 bg-white border border-red-100 rounded-lg p-2 text-sm font-black text-red-500 focus:outline-none focus:border-red-300 transition-all text-center"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-2xl font-black text-bee-black">₩</span>
                                        <input
                                            type="number"
                                            value={manualBookingForm.finalPrice}
                                            onChange={e => setManualBookingForm({ ...manualBookingForm, finalPrice: Number(e.target.value) })}
                                            className="w-40 bg-transparent text-3xl font-black text-bee-black border-b-2 border-bee-yellow focus:outline-none text-center tabular-nums"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="w-full space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block text-center">결제 수단 선택 (Payment Method)</label>
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                        {(['card', 'cash', 'apple', 'samsung', 'wechat', 'alipay', 'naver', 'kakao', 'paypal'] as const).map(pm => (
                                            <button
                                                key={pm}
                                                onClick={() => setManualBookingForm({ ...manualBookingForm, paymentMethod: pm })}
                                                className={`py-2.5 rounded-xl text-[10px] font-black transition-all border-2 ${manualBookingForm.paymentMethod === pm ? 'bg-bee-black text-bee-yellow border-bee-black shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-bee-yellow/50'}`}
                                            >
                                                {pm === 'card' ? '카드' :
                                                    pm === 'cash' ? '현금' :
                                                        pm === 'kakao' ? '카카오' :
                                                            pm === 'naver' ? '네이버' :
                                                                pm === 'apple' ? '애플Pay' :
                                                                    pm === 'samsung' ? '삼성Pay' :
                                                                        pm === 'wechat' ? '위챗' :
                                                                            pm === 'alipay' ? '알리' : 'PayPal'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">
                                가방 개수 ({manualBookingForm.serviceType === ServiceType.DELIVERY ? '쇼핑백, 손가방/캐리어 합계' : '쇼핑백, 손가방/캐리어/유모차, 자전거 합계'})
                            </label>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                <input type="number" value={manualBookingForm.bags} onChange={e => {
                                    const next = { ...manualBookingForm, bags: Number(e.target.value) };
                                    setManualBookingForm({ ...next, finalPrice: calculateManualPrice(next) });
                                }} className="flex-1 bg-white p-3 rounded-xl font-black border border-gray-100 focus:outline-none" />
                                <button onClick={handleResetManualBags} className="px-5 py-3 bg-red-50 text-red-500 font-black rounded-xl text-[10px] hover:bg-red-500 hover:text-white transition-all">초기화</button>
                            </div>
                        </div>
                    </div>

                    {/* 가방 사이즈별 선택 섹션 */}
                    <div className="space-y-4 p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">가방 종류별 신속 선택</label>
                            {manualBookingForm.serviceType === ServiceType.STORAGE && (
                                <select
                                    value={manualBookingForm.selectedStorageTierId}
                                    onChange={e => setManualBookingForm({ ...manualBookingForm, selectedStorageTierId: e.target.value })}
                                    className="bg-white px-3 py-1.5 rounded-xl border border-gray-200 text-[10px] font-black outline-none"
                                >
                                    {storageTiers.map(st => <option key={st.id} value={st.id}>{st.label}</option>)}
                                </select>
                            )}
                        </div>
                        <div className={`grid gap-3 ${manualBookingForm.serviceType === ServiceType.DELIVERY ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                            {categories.map(category => {
                                const activePrices = manualBookingForm.serviceType === ServiceType.DELIVERY
                                    ? deliveryPrices
                                    : (storageTiers.find(t => t.id === manualBookingForm.selectedStorageTierId)?.prices || createEmptyBagSizes());
                                const price = getStoragePriceForCategory(activePrices, category.id);
                                const count = getBagCategoryCount(manualBookingForm.bagSizes, category.id);

                                return (
                                    <button
                                        key={category.id}
                                        onClick={() => handleAddBagToManual(category.id)}
                                        className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${count > 0 ? 'bg-bee-yellow border-bee-yellow shadow-md' : 'bg-white border-gray-100 hover:border-bee-yellow/50'}`}
                                    >
                                        <span className={`text-[9px] font-black tracking-tight ${count > 0 ? 'text-bee-black/40' : 'text-gray-300'}`}>{getBagCategoryLabel(category.id, 'ko')}</span>
                                        <span className="font-black text-xs md:text-sm text-bee-black">₩{price.toLocaleString()}</span>
                                        {count > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-bee-black text-bee-yellow text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">{count}</span>}
                                    </button>
                                );
                            })}
                        </div>
                        {manualBookingForm.serviceType === ServiceType.DELIVERY && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-red-500">배송 수기예약은 쇼핑백, 손가방과 캐리어만 접수합니다.</p>
                                <p className="text-[10px] font-black text-red-500">쇼핑백, 손가방만 단독으로는 저장할 수 없고 캐리어를 1개 이상 함께 넣어야 합니다.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 border-t border-gray-50 flex gap-3">
                    <button type="button" onClick={() => setIsManualBooking(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl">취소</button>
                    <button
                        type="button"
                        onClick={handleManualBookingSave}
                        disabled={isSaving}
                        className="flex-3 py-4 bg-bee-black text-bee-yellow font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-transform"
                    >
                        {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-cloud-arrow-up mr-2"></i>}
                        예약 정보 저장하기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManualBookingModal;
