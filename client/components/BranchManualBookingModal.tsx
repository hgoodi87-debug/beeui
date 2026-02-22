import React from 'react';
import { LocationOption, StorageTier, ServiceType, BookingStatus } from '../types';

interface BranchManualBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    branchId: string;
    locations: LocationOption[];
    storageTiers: StorageTier[];
    onSave: (formData: any) => Promise<void>;
    isSaving: boolean;
}

const BranchManualBookingModal: React.FC<BranchManualBookingModalProps> = ({
    isOpen,
    onClose,
    branchId,
    locations,
    storageTiers,
    onSave,
    isSaving
}) => {
    const [formData, setFormData] = React.useState({
        serviceType: ServiceType.STORAGE,
        status: BookingStatus.PENDING,
        userName: '',
        userEmail: '',
        pickupLocation: branchId,
        pickupAddress: '',
        pickupAddressDetail: '',
        dropoffLocation: '',
        dropoffAddress: '',
        dropoffAddressDetail: '',
        pickupDate: new Date().toISOString().split('T')[0],
        pickupTime: '10:00',
        dropoffDate: new Date().toISOString().split('T')[0],
        deliveryTime: '18:00',
        bags: 1,
        bagSizes: { S: 1, M: 0, L: 0, XL: 0 } as Record<string, number>,
        finalPrice: 10000,
        paymentMethod: 'cash',
        useInsurance: false,
        insuranceLevel: 1,
        insuranceBagCount: 0,
        discountAmount: 0,
        selectedStorageTierId: storageTiers[0]?.id || 'standard'
    });

    if (!isOpen) return null;

    const currentBranch = locations.find(l => l.id === branchId);

    const handleSave = async () => {
        await onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-bee-black">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black text-bee-yellow">지점 수동 예약 추가</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{currentBranch?.name || branchId} 센터 전용</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-bee-yellow hover:text-bee-black transition-colors flex items-center justify-center">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">서비스 유형</label>
                            <select
                                value={formData.serviceType}
                                onChange={e => setFormData({ ...formData, serviceType: e.target.value as ServiceType })}
                                className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100 focus:border-bee-yellow outline-none"
                            >
                                <option value={ServiceType.STORAGE}>보관 (Storage)</option>
                                <option value={ServiceType.DELIVERY}>배송 (Delivery)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">성함</label>
                            <input
                                value={formData.userName}
                                onChange={e => setFormData({ ...formData, userName: e.target.value })}
                                className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100 focus:border-bee-yellow outline-none"
                                placeholder="홍길동"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">이메일</label>
                            <input
                                value={formData.userEmail}
                                onChange={e => setFormData({ ...formData, userEmail: e.target.value })}
                                className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100 focus:border-bee-yellow outline-none"
                                placeholder="customer@example.com"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">연락처 (참고)</label>
                            <input
                                className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100 focus:border-bee-yellow outline-none"
                                placeholder="010-0000-0000"
                            />
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-lg bg-bee-black flex items-center justify-center">
                                <i className="fa-solid fa-location-dot text-bee-yellow text-[10px]"></i>
                            </div>
                            <span className="text-xs font-black text-bee-black uppercase">지점 정보</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">출발지 (고정)</label>
                                <div className="w-full bg-white p-4 rounded-2xl font-black border border-gray-200 text-bee-black/40">
                                    {currentBranch?.name || branchId}
                                </div>
                            </div>
                            {formData.serviceType === ServiceType.DELIVERY && (
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">도착지</label>
                                    <select
                                        value={formData.dropoffLocation}
                                        onChange={e => setFormData({ ...formData, dropoffLocation: e.target.value })}
                                        className="w-full bg-white p-4 rounded-2xl font-bold border border-gray-100 focus:border-bee-yellow outline-none"
                                    >
                                        <option value="">도착 지점 선택</option>
                                        {locations.filter(l => l.id !== branchId && l.supportsDelivery).map(l => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">날짜</label>
                            <input
                                type="date"
                                value={formData.pickupDate}
                                onChange={e => setFormData({ ...formData, pickupDate: e.target.value })}
                                className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100 focus:border-bee-yellow outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">시간</label>
                            <input
                                type="time"
                                value={formData.pickupTime}
                                onChange={e => setFormData({ ...formData, pickupTime: e.target.value })}
                                className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100 focus:border-bee-yellow outline-none"
                            />
                        </div>
                    </div>

                    <div className="bg-yellow-50/50 p-6 rounded-[32px] border border-yellow-100">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">최종 결제 금액</label>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-bee-black">₩</span>
                                <input
                                    type="number"
                                    value={formData.finalPrice}
                                    onChange={e => setFormData({ ...formData, finalPrice: Number(e.target.value) })}
                                    className="w-32 bg-transparent text-2xl font-black text-bee-black border-b-2 border-bee-yellow focus:outline-none text-center tabular-nums"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {['cash', 'card', 'naver', 'kakao'].map(pm => (
                                <button
                                    key={pm}
                                    onClick={() => setFormData({ ...formData, paymentMethod: pm })}
                                    className={`py-2 rounded-xl text-[10px] font-black transition-all border-2 ${formData.paymentMethod === pm ? 'bg-bee-black text-bee-yellow border-bee-black' : 'bg-white text-gray-400 border-gray-100'}`}
                                >
                                    {pm === 'cash' ? '현금' : pm === 'card' ? '카드' : pm === 'naver' ? '네이버' : '카카오'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-gray-50 flex gap-3 bg-gray-50/50">
                    <button onClick={onClose} className="flex-1 py-4 bg-white text-gray-500 font-black rounded-2xl border border-gray-200">취소</button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-[2] py-4 bg-bee-black text-bee-yellow font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <i className="fa-solid fa-spinner animate-spin"></i>
                        ) : (
                            <>
                                <i className="fa-solid fa-check"></i>
                                <span>예약 완료하기</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BranchManualBookingModal;
