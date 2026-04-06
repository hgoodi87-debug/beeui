import React from 'react';
import { BookingState, LocationOption, ServiceType, BookingStatus, SnsType } from '../../types';
import { OPERATING_STATUS_CONFIG, BOOKING_STATUS_DISPLAY_MAP } from '../../src/constants/admin';
import { COUNTRY_NAMES } from '../../src/constants/countries';
import { StorageService } from '../../services/storageService';
import { getSupabaseBaseUrl } from '../../services/supabaseRuntime';
import { getActiveAdminRequestHeaders } from '../../services/adminAuthService';
import {
    createEmptyBagSizes,
    getBagCategoriesForService,
    getBagCategoryCount,
    getBagCategoryLabel,
    sanitizeDeliveryBagSizes,
    setBagCategoryCount,
} from '../../src/domains/booking/bagCategoryUtils';

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
    adminRole?: string;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
    selectedBooking,
    setSelectedBooking,
    locations,
    handlePrintLabel,
    handleUpdateBooking,
    isSaving,
    handleResendEmail,
    sendingEmailId,
    handleRefund,
    adminRole = 'staff'
}) => {
    const [promoCode, setPromoCode] = React.useState('');
    const [isApplyingPromo, setIsApplyingPromo] = React.useState(false);
    const [csPanelOpen, setCsPanelOpen] = React.useState(false);
    const [csInquiry, setCsInquiry] = React.useState('');
    const [csGenerating, setCsGenerating] = React.useState(false);
    const [csToast, setCsToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const COUNTRY_TO_LANG: Record<string, string> = {
        TW: 'zh-TW', HK: 'zh-HK', JP: 'ja', CN: 'zh', KR: 'ko',
    };

    const handleGenerateCsReply = async () => {
        if (!csInquiry.trim()) return;
        setCsGenerating(true);
        setCsToast(null);
        try {
            const SUPABASE_URL = getSupabaseBaseUrl();
            const headers = await getActiveAdminRequestHeaders();
            const customerLang = COUNTRY_TO_LANG[selectedBooking?.country || ''] || 'en';
            const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-content-gen`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    use_case: 'cs_reply',
                    entity_id: selectedBooking?.id || null,
                    inquiry_body: csInquiry.trim(),
                    customer_lang: customerLang,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || res.statusText);
            const policy = data.data?.policy_check;
            const msg = policy && !policy.passed
                ? `⚠ 정책 위반 감지 — AI 검수함에 저장됨`
                : '✓ AI 답변 초안이 검수함에 저장되었습니다.';
            setCsToast({ msg, type: policy && !policy.passed ? 'error' : 'success' });
            setCsInquiry('');
            setTimeout(() => { setCsToast(null); setCsPanelOpen(false); }, 3500);
        } catch (e) {
            setCsToast({ msg: `생성 실패: ${e}`, type: 'error' });
        } finally {
            setCsGenerating(false);
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
                                    <input readOnly={adminRole !== 'super'} title="성함" placeholder="성함 입력" value={selectedBooking.userName || ''} onChange={e => setSelectedBooking({ ...selectedBooking, userName: e.target.value })} className="w-full bg-white p-3 rounded-xl border border-gray-200 font-bold text-sm read-only:bg-gray-100" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">이메일 (Email)</label>
                                    <input readOnly={adminRole !== 'super'} title="이메일" placeholder="이메일 입력" value={selectedBooking.userEmail || ''} onChange={e => setSelectedBooking({ ...selectedBooking, userEmail: e.target.value })} className="w-full bg-white p-3 rounded-xl border border-gray-200 font-bold text-sm read-only:bg-gray-100" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">연락처 (SNS)</label>
                                    <div className="flex gap-2">
                                        <select disabled={adminRole !== 'super'} title="SNS 종류" value={selectedBooking.snsType} onChange={e => setSelectedBooking({ ...selectedBooking, snsType: e.target.value as SnsType })} className="bg-white p-3 rounded-xl border border-gray-200 font-bold text-sm disabled:bg-gray-100">
                                            {Object.values(SnsType).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <input readOnly={adminRole !== 'super'} title="SNS ID" placeholder="SNS ID 입력" value={selectedBooking.snsId || ''} onChange={e => setSelectedBooking({ ...selectedBooking, snsId: e.target.value })} className="flex-1 bg-white p-3 rounded-xl border border-gray-200 font-bold text-sm read-only:bg-gray-100" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">국가 (Country)</label>
                                        <select disabled={adminRole !== 'super'} title="국가 선택" value={selectedBooking.country || 'KR'} onChange={e => setSelectedBooking({ ...selectedBooking, country: e.target.value })} className="w-full bg-white p-3 rounded-xl border border-gray-200 font-bold text-sm disabled:bg-gray-100">
                                            {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
                                                <option key={code} value={code}>{name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">관할 지점 (Branch)</label>
                                        <div className="w-full bg-gray-100 p-3 rounded-xl border border-gray-200 font-black text-xs text-bee-black flex items-center gap-2">
                                            <i className="fa-solid fa-warehouse text-gray-400"></i>
                                            {selectedBooking.branchName || '지점 정보 없음 🐝'}
                                        </div>
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
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                                            {selectedBooking.serviceType === ServiceType.STORAGE ? '보관 시작 날짜' : '날짜 (Date)'}
                                        </label>
                                        <input title="수거 날짜" type="date" value={selectedBooking.pickupDate || ''} onChange={e => setSelectedBooking({ ...selectedBooking, pickupDate: e.target.value })} className="w-full bg-white p-3 rounded-xl border border-gray-200 font-bold text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">상태 (Status)</label>
                                        <div className="relative group/select">
                                            <div 
                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full z-10"
                                                style={{ backgroundColor: OPERATING_STATUS_CONFIG[BOOKING_STATUS_DISPLAY_MAP[selectedBooking.status || BookingStatus.PENDING]].color }}
                                            />
                                            <select
                                                title="예약 상태"
                                                value={selectedBooking.status}
                                                onChange={e => setSelectedBooking({ ...selectedBooking, status: e.target.value as BookingStatus })}
                                                className="w-full pl-7 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white font-black text-xs cursor-pointer appearance-none transition-all hover:border-bee-yellow outline-none"
                                            >
                                                {Object.values(BookingStatus).map(s => (
                                                    <option key={s} value={s}>
                                                        {OPERATING_STATUS_CONFIG[BOOKING_STATUS_DISPLAY_MAP[s]].label} ({s})
                                                    </option>
                                                ))}
                                            </select>
                                            <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[8px] text-gray-400 pointer-events-none"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                                            {selectedBooking.serviceType === ServiceType.STORAGE ? '보관 시작 시간' : '수거 시간'}
                                        </label>
                                        <input title="수거 시간" type="time" value={selectedBooking.pickupTime || ''} onChange={e => setSelectedBooking({ ...selectedBooking, pickupTime: e.target.value })} className="w-full bg-white p-3 rounded-xl border border-gray-100 font-bold text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                                            {selectedBooking.serviceType === ServiceType.STORAGE ? '찾는 시간' : '배송 완료 시간'}
                                        </label>
                                        <input title="배송 시간" type="time" value={selectedBooking.deliveryTime || ''} onChange={e => setSelectedBooking({ ...selectedBooking, deliveryTime: e.target.value })} className="w-full bg-white p-3 rounded-xl border border-gray-100 font-bold text-sm" />
                                    </div>
                                </div>
                                {selectedBooking.serviceType === ServiceType.STORAGE && (
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">찾는 날짜 (Return Date)</label>
                                        <input title="찾는 날짜" type="date" value={selectedBooking.dropoffDate || ''} onChange={e => setSelectedBooking({ ...selectedBooking, dropoffDate: e.target.value })} className="w-full bg-white p-3 rounded-xl border border-gray-100 font-bold text-sm" />
                                    </div>
                                )}
                                <div className="mt-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">변경 사유 (Audit Log Note)</label>
                                    <textarea title="변경 사유" placeholder="변경 사유 입력" value={selectedBooking.auditNote || ''} onChange={e => setSelectedBooking({ ...selectedBooking, auditNote: e.target.value })} className="w-full bg-white p-3 rounded-xl border border-gray-200 font-bold text-[11px] h-16 resize-none focus:border-bee-yellow outline-none" />
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
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                                        {selectedBooking.serviceType === ServiceType.STORAGE ? '기점/입고지 (Pickup)' : '출발지 (Pickup)'}
                                    </label>
                                    <select disabled={adminRole !== 'super'} title="출발 지점" value={selectedBooking.pickupLocation} onChange={e => setSelectedBooking({ ...selectedBooking, pickupLocation: e.target.value })} className="w-full bg-white p-2 mb-2 rounded-lg border border-gray-200 text-xs font-bold disabled:bg-gray-100">
                                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        {/* [스봉이] 매칭되는 ID가 없는 레거시 데이터면 텍스트를 옵션에 살짝 끼워넣어드려요 💅 */}
                                        {!locations.some(l => l.id === selectedBooking.pickupLocation) && selectedBooking.pickupLocation && (
                                            <option value={selectedBooking.pickupLocation}>{selectedBooking.pickupLocation} (Legacy)</option>
                                        )}
                                    </select>
                                    <input readOnly={adminRole !== 'super'} value={selectedBooking.pickupAddress || ''} onChange={e => setSelectedBooking({ ...selectedBooking, pickupAddress: e.target.value })} className="w-full bg-white p-2 rounded-lg border border-gray-200 text-xs font-bold mb-2 read-only:bg-gray-100" placeholder="주소" />
                                    <input readOnly={adminRole !== 'super'} value={selectedBooking.pickupAddressDetail || ''} onChange={e => setSelectedBooking({ ...selectedBooking, pickupAddressDetail: e.target.value })} className="w-full bg-white p-2 rounded-lg border border-gray-200 text-xs font-bold read-only:bg-gray-100" placeholder="상세 주소" />
                                </div>
                                
                                <div className="relative pl-6 border-l-2 border-dashed border-gray-200">
                                    <div className="absolute bottom-0 left-[-6px] w-3 h-3 rounded-full bg-bee-black"></div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                                        {selectedBooking.serviceType === ServiceType.STORAGE ? '종점/반환지 (Return)' : '도착지 (Dropoff)'}
                                    </label>
                                    <select disabled={adminRole !== 'super'} title="도착 지점" value={selectedBooking.dropoffLocation} onChange={e => setSelectedBooking({ ...selectedBooking, dropoffLocation: e.target.value })} className="w-full bg-white p-2 mb-2 rounded-lg border border-gray-200 text-xs font-bold disabled:bg-gray-100">
                                        <option value="">- 선택 안함 -</option>
                                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        {/* [스봉이] 매칭되는 ID가 없는 레거시 데이터 fallback 💅 */}
                                        {!locations.some(l => l.id === selectedBooking.dropoffLocation) && selectedBooking.dropoffLocation && (
                                            <option value={selectedBooking.dropoffLocation}>{selectedBooking.dropoffLocation} (Legacy)</option>
                                        )}
                                    </select>
                                    <input readOnly={adminRole !== 'super'} value={selectedBooking.dropoffAddress || ''} onChange={e => setSelectedBooking({ ...selectedBooking, dropoffAddress: e.target.value })} className="w-full bg-white p-2 rounded-lg border border-gray-200 text-xs font-bold mb-2 read-only:bg-gray-100" placeholder="주소" />
                                    <input readOnly={adminRole !== 'super'} value={selectedBooking.dropoffAddressDetail || ''} onChange={e => setSelectedBooking({ ...selectedBooking, dropoffAddressDetail: e.target.value })} className="w-full bg-white p-2 rounded-lg border border-gray-200 text-xs font-bold read-only:bg-gray-100" placeholder="상세 주소" />
                                </div>
                            </div>
                            <div className="min-w-[200px] flex flex-col gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">총 수량 (Total Bags)</label>
                                    <input readOnly={adminRole !== 'super'} type="number" value={selectedBooking.bags || 0} title="총 수하물 수량" className="w-full text-2xl font-black text-bee-black bg-white border border-gray-200 p-2 rounded-2xl read-only:bg-gray-100" />
                                </div>
                                <div className={`grid gap-2 ${selectedBooking.serviceType === ServiceType.DELIVERY ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                                    {getBagCategoriesForService(selectedBooking.serviceType).map(category => {
                                        const count = getBagCategoryCount(selectedBooking.bagSizes, category.id);
                                        return (
                                        <div key={category.id}>
                                            <label className="text-[8px] font-black text-gray-400 block mb-1">{getBagCategoryLabel(category.id, 'ko')}</label>
                                            <input readOnly={adminRole !== 'super'} type="number" value={count} onChange={e => {
                                                const nextSizes = setBagCategoryCount(selectedBooking.bagSizes || createEmptyBagSizes(), category.id, Number(e.target.value));
                                                const newSizes = selectedBooking.serviceType === ServiceType.DELIVERY ? sanitizeDeliveryBagSizes(nextSizes) : nextSizes;
                                                const total = Object.values(newSizes).reduce((a, b) => Number(a) + Number(b), 0);
                                                setSelectedBooking({ ...selectedBooking, bagSizes: newSizes, bags: total });
                                            }} title={`${getBagCategoryLabel(category.id, 'ko')} 수량`} className="w-full bg-white p-2 rounded-xl border border-gray-200 text-xs font-black read-only:bg-gray-100" />
                                        </div>
                                    )})}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Payment Summary */}
                    {adminRole === 'super' ? (
                        <div className="p-8 bg-white rounded-[32px] border border-gray-200 shadow-xl space-y-4">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1 h-3 bg-bee-yellow rounded-full"></span> Payment Summary
                            </h3>
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-gray-500">Subtotal</span>
                                <span>₩{((selectedBooking.finalPrice || 0) + (selectedBooking.discountAmount || 0)).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold text-red-500">
                                <span>Discount</span>
                                <span>- ₩{(selectedBooking.discountAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase">Final Amount</span>
                                <span className="text-2xl font-black">₩{(selectedBooking.finalPrice || 0).toLocaleString()}</span>
                            </div>

                            {/* Section 6 logic merged here for Super Admin */}
                            <div className="pt-6 border-t border-gray-100 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Promo Code</label>
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Code" value={promoCode} onChange={e => setPromoCode(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold" />
                                            <button onClick={handleApplyPromo} disabled={isApplyingPromo || !promoCode.trim()} className="px-4 py-2.5 bg-bee-yellow text-bee-black text-[10px] font-black rounded-xl hover:bg-bee-black hover:text-bee-yellow transition-all">
                                                {isApplyingPromo ? '...' : 'Apply'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Extra Discount</label>
                                        <input type="number" value={selectedBooking.discountAmount || 0} onChange={e => {
                                            const disc = Number(e.target.value);
                                            const base = (selectedBooking.finalPrice || 0) + (selectedBooking.discountAmount || 0);
                                            setSelectedBooking({ ...selectedBooking, discountAmount: disc, finalPrice: Math.max(0, base - disc) });
                                        }} title="추가 할인 금액" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 text-center">
                            <i className="fa-solid fa-lock text-gray-300 mb-2"></i>
                            <p className="text-[10px] font-bold text-gray-400">결제 보안 정보는 본사 관리자만 열람할 수 있습니다. 🛡️</p>
                        </div>
                    )}
                </div>

                {/* CS 답변 초안 패널 */}
                {csPanelOpen && (
                    <div className="px-8 pb-4 border-t border-gray-50 bg-gray-50/50 pt-4">
                        <div className="bg-white rounded-2xl border border-bee-yellow/40 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black text-bee-black flex items-center gap-1.5">
                                    <i className="fa-solid fa-robot text-bee-yellow"></i> AI CS 답변 초안 생성
                                </p>
                                <button onClick={() => setCsPanelOpen(false)} className="text-gray-400 hover:text-gray-700 text-xs">
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                            {csToast && (
                                <div className={`text-xs font-bold px-3 py-2 rounded-xl ${csToast.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                    {csToast.msg}
                                </div>
                            )}
                            <textarea
                                value={csInquiry}
                                onChange={e => setCsInquiry(e.target.value)}
                                placeholder="고객 문의 내용을 붙여넣으세요..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold resize-none focus:outline-none focus:border-bee-yellow"
                                rows={3}
                            />
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] text-gray-400">
                                    언어 자동감지: <span className="font-bold">{COUNTRY_TO_LANG[selectedBooking.country || ''] || 'en'}</span>
                                    {` (국가: ${selectedBooking.country || '?'})`}
                                </p>
                                <button
                                    onClick={handleGenerateCsReply}
                                    disabled={csGenerating || !csInquiry.trim()}
                                    className="bg-bee-yellow text-bee-black px-4 py-2 rounded-xl text-xs font-black hover:bg-bee-black hover:text-bee-yellow transition-all disabled:opacity-40 flex items-center gap-1.5"
                                >
                                    {csGenerating ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                                    생성
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Footer */}
                <div className="p-8 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between gap-4">
                    <button
                        onClick={() => setCsPanelOpen(p => !p)}
                        className={`flex items-center gap-2 px-5 py-4 rounded-2xl font-black text-sm transition-all ${csPanelOpen ? 'bg-bee-yellow text-bee-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        title="AI CS 답변 초안 생성"
                    >
                        <i className="fa-solid fa-robot"></i>
                        <span className="hidden sm:inline">CS 답변 초안</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <button onClick={() => handlePrintLabel(selectedBooking)} className="bg-white text-gray-600 border border-gray-200 px-6 py-4 rounded-2xl font-black text-sm hover:bg-gray-100 shadow-sm transition-all"><i className="fa-solid fa-print mr-2"></i> Label</button>
                        <button onClick={handleUpdateBooking} disabled={isSaving} className="bg-bee-black text-bee-yellow px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl disabled:opacity-50">
                            {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-check mr-2"></i>} Update
                        </button>
                        <button onClick={() => handleResendEmail(selectedBooking)} disabled={sendingEmailId === selectedBooking.id} className="bg-bee-yellow text-bee-black px-6 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-md disabled:opacity-50"><i className="fa-solid fa-envelope mr-2"></i> Resend Email</button>
                        {handleRefund && (
                            <button onClick={() => handleRefund(selectedBooking)} className="bg-red-50 text-red-500 border border-red-100 px-6 py-4 rounded-2xl font-black text-sm hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-rotate-left mr-2"></i> Refund</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingDetailModal;
