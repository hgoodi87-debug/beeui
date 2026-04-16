import React, { useState, useMemo } from 'react';
import { BookingState, BookingStatus, LocationOption, ServiceType } from '../../types';

interface BranchRevenueTabProps {
    bookings: BookingState[];
    currentBranch: LocationOption | undefined;
    branchIdentifiers: Set<string>;
}

const BranchRevenueTab: React.FC<BranchRevenueTabProps> = ({ bookings, currentBranch, branchIdentifiers }) => {
    const [period, setPeriod] = useState<'DAILY' | 'MONTHLY'>('DAILY');
    const [date, setDate] = useState<Date>(new Date());

    const revenueData = useMemo(() => {
        const targetYear = date.getFullYear();
        const targetMonth = date.getMonth();
        const targetDay = date.getDate();

        const items = bookings.filter(b => {
            if (b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.CONFIRMED && b.status !== BookingStatus.ARRIVED) return false;
            const isInternalBee = (b.id?.toUpperCase().startsWith('BEE')) || (b.reservationCode?.toUpperCase().startsWith('BEE'));
            if (isInternalBee) return false;

            const bDate = new Date(b.pickupDate || b.createdAt);
            if (period === 'MONTHLY') {
                return bDate.getFullYear() === targetYear && bDate.getMonth() === targetMonth;
            }
            return bDate.getFullYear() === targetYear && bDate.getMonth() === targetMonth && bDate.getDate() === targetDay;
        }).map(b => {
            const finalPrice = typeof b.finalPrice === 'number' ? b.finalPrice : parseInt(String(b.finalPrice || 0).replace(/[^0-9]/g, ''), 10);
            const isDelivery = b.serviceType === ServiceType.DELIVERY;
            const commRate = isDelivery ? (currentBranch?.commissionRates?.delivery || 0) : (currentBranch?.commissionRates?.storage || 0);
            // DB에 저장된 정산액 우선, 없으면 현재 요율로 계산
            const settlementAmount = b.branchSettlementAmount && b.branchSettlementAmount > 0
                ? b.branchSettlementAmount
                : Math.round(finalPrice * commRate / 100);
            // 짐 정보: bag_summary 우선, 없으면 bagSizes로 조합
            const bagLabel = (() => {
                if (b.bagSummary) return b.bagSummary;
                const s = b.bagSizes;
                if (!s) return `${b.bags || 0}개`;
                const parts = [
                    s.handBag > 0 ? `핸드백 ${s.handBag}` : '',
                    s.carrier > 0 ? `캐리어 ${s.carrier}` : '',
                    s.strollerBicycle > 0 ? `유모차 ${s.strollerBicycle}` : '',
                ].filter(Boolean);
                return parts.length > 0 ? parts.join(' · ') : `${b.bags || 0}개`;
            })();
            return { ...b, calculatedFinalPrice: finalPrice, commissionRate: commRate, settlementAmount, bagLabel, isDelivery };
        });

        const total = items.reduce((sum, item) => sum + item.settlementAmount, 0);
        const totalSales = items.reduce((sum, item) => sum + item.calculatedFinalPrice, 0);
        return { total, totalSales, items: items.sort((a, b) => new Date(b.pickupDate || b.createdAt || 0).getTime() - new Date(a.pickupDate || a.createdAt || 0).getTime()) };
    }, [bookings, period, date, currentBranch, branchIdentifiers]);

    const navigate = (dir: number) => {
        const d = new Date(date);
        if (period === 'DAILY') d.setDate(d.getDate() + dir);
        else d.setMonth(d.getMonth() + dir);
        setDate(d);
    };

    const dateLabel = period === 'DAILY'
        ? `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
        : `${date.getFullYear()}년 ${date.getMonth() + 1}월`;

    return (
        <div className="p-6 md:p-8 space-y-6 animate-fade-in-up">
            {/* Period selector */}
            <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-gray-50 p-5 rounded-[24px] border border-gray-100">
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-full md:w-auto">
                    <button onClick={() => setPeriod('DAILY')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black transition-all ${period === 'DAILY' ? 'bg-bee-black text-bee-yellow' : 'text-gray-400 hover:text-bee-black'}`}>일간</button>
                    <button onClick={() => setPeriod('MONTHLY')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black transition-all ${period === 'MONTHLY' ? 'bg-bee-black text-bee-yellow' : 'text-gray-400 hover:text-bee-black'}`}>월간</button>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto justify-center">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:border-bee-black transition-all" title="이전" aria-label="이전">
                        <i className="fa-solid fa-chevron-left text-xs text-gray-400"></i>
                    </button>
                    <div className="font-black text-bee-black text-lg min-w-[130px] text-center">{dateLabel}</div>
                    <button onClick={() => navigate(1)} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:border-bee-black transition-all" title="다음" aria-label="다음">
                        <i className="fa-solid fa-chevron-right text-xs text-gray-400"></i>
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-bee-black text-white p-6 rounded-[24px] shadow-lg relative overflow-hidden md:col-span-1">
                    <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
                        <i className="fa-solid fa-coins text-[120px]"></i>
                    </div>
                    <div className="z-10 relative">
                        <div className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">정산 받을 금액</div>
                        <div className="text-3xl font-black text-bee-yellow tracking-tighter">₩{revenueData.total.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500 mt-1 font-bold">{revenueData.items.length}건 커미션 합계</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">총 매출</div>
                    <div className="text-2xl font-black text-bee-black">₩{revenueData.totalSales.toLocaleString()}</div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">배송 요율</div>
                            <div className="text-xl font-black text-blue-500">{currentBranch?.commissionRates?.delivery || 0}%</div>
                        </div>
                        <div className="w-px bg-gray-100"></div>
                        <div className="flex-1">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">보관 요율</div>
                            <div className="text-xl font-black text-green-500">{currentBranch?.commissionRates?.storage || 0}%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue table */}
            <div className="border border-gray-100 rounded-[24px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">#</th>
                                <th className="px-6 py-4">일시 / 예약정보</th>
                                <th className="px-6 py-4">유형</th>
                                <th className="px-6 py-4">짐</th>
                                <th className="px-6 py-4 text-center">요율</th>
                                <th className="px-6 py-4 text-right">매출</th>
                                <th className="px-6 py-4 text-right text-bee-black">정산액</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-600">
                            {revenueData.items.map((item: any, idx: number) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-gray-300 font-black">{idx + 1}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-bee-black mb-1">{item.pickupDate || item.createdAt?.split('T')[0]}</div>
                                        <div className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-mono inline-block tracking-tighter">{item.reservationCode || item.id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black ${item.isDelivery ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
                                            {item.isDelivery ? '배송' : '보관'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[11px] text-gray-600 font-bold">{item.bagLabel}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-gray-100 px-2 py-1 rounded-md text-[10px]">{item.commissionRate}%</span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-400">₩{item.calculatedFinalPrice.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="font-black text-sm text-bee-black">₩{item.settlementAmount.toLocaleString()}</div>
                                    </td>
                                </tr>
                            ))}
                            {revenueData.items.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                                        <i className="fa-solid fa-folder-open mb-3 text-2xl text-gray-200 block"></i>
                                        해당 기간의 정산 건이 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BranchRevenueTab;
