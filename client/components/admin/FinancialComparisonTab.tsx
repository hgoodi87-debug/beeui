import React, { useMemo, useState } from 'react';
import { BookingState, BookingStatus, LocationOption, ServiceType } from '../../types';
import { StorageService } from '../../services/storageService';
import { AuditService } from '../../services/auditService';
import { useQueryClient } from '@tanstack/react-query';

interface FinancialComparisonTabProps {
    bookings: BookingState[];
    locations: LocationOption[];
    t: any;
    currentActor: any;
}

const FinancialComparisonTab: React.FC<FinancialComparisonTabProps> = ({
    bookings,
    locations,
    t,
    currentActor
}) => {
    const queryClient = useQueryClient();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNSETTLED' | 'SETTLED'>('UNSETTLED');

    // [스봉이] 완료된 건들만 모아서 정산 대상으로 삼아요. 💅
    const completedBookings = useMemo(() => {
        return bookings.filter(b => b.status === BookingStatus.COMPLETED && !b.isDeleted);
    }, [bookings]);

    const filteredBookings = useMemo(() => {
        if (filterStatus === 'ALL') return completedBookings;
        if (filterStatus === 'UNSETTLED') return completedBookings.filter(b => b.settlementStatus !== 'CONFIRMED');
        return completedBookings.filter(b => b.settlementStatus === 'CONFIRMED');
    }, [completedBookings, filterStatus]);

    const totalSelectedAmount = useMemo(() => {
        return filteredBookings
            .filter(b => b.id && selectedIds.includes(b.id))
            .reduce((sum, b) => sum + (b.settlementHardCopyAmount ?? b.finalPrice ?? 0), 0);
    }, [filteredBookings, selectedIds]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredBookings.map(b => b.id).filter(Boolean) as string[]);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const settleBooking = async (booking: BookingState) => {
        if (!booking.id) return;
        setIsProcessing(true);
        try {
            await StorageService.updateBooking(booking.id, {
                settlementStatus: 'CONFIRMED',
                settledAt: new Date().toISOString(),
                settledBy: currentActor.name
            });
            await AuditService.logAction(currentActor, 'SETTLEMENT_CONFIRM', { id: booking.id, type: 'BOOKING' }, { method: 'INDIVIDUAL' });
            await queryClient.invalidateQueries({ queryKey: ['bookings'] });
            // alert('정산 확정 처리가 완료되었습니다. ✨');
        } catch (e) {
            console.error(e);
            alert('정산 처리 중 오류가 발생했습니다. 🙄');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBatchSettle = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`선택한 ${selectedIds.length}건을 일괄 정산 확정하시겠습니까? 💅`)) return;

        setIsProcessing(true);
        try {
            const promises = selectedIds.map(id => 
                StorageService.updateBooking(id, {
                    settlementStatus: 'CONFIRMED',
                    settledAt: new Date().toISOString(),
                    settledBy: currentActor.name
                })
            );
            await Promise.all(promises);
            await AuditService.logAction(currentActor, 'SETTLEMENT_CONFIRM', { id: 'bulk', type: 'BOOKING' }, { count: selectedIds.length, method: 'BULK' });
            await queryClient.invalidateQueries({ queryKey: ['bookings'] });
            setSelectedIds([]);
            alert(`${selectedIds.length}건의 일괄 정산 확정이 완료되었습니다. ✨`);
        } catch (e) {
            console.error(e);
            alert('일괄 정산 중 오류가 발생했습니다. 🙄');
        } finally {
            setIsProcessing(false);
        }
    };

    const getBranchName = (id?: string) => {
        if (!id) return '-';
        return locations.find(l => l.id === id)?.name || id;
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-bee-black">미정산 건 금융 대조 (Financial Comparison) 🪙</h2>
                    <p className="text-sm font-bold text-gray-500">완료된 예약 중 정산이 확정되지 않은 내역을 대조하고 확정합니다. 💅</p>
                </div>
                
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                    {(['ALL', 'UNSETTLED', 'SETTLED'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filterStatus === s ? 'bg-bee-black text-bee-yellow shadow-lg' : 'text-gray-400 hover:text-bee-black'}`}
                        >
                            {s === 'ALL' ? '전체' : s === 'UNSETTLED' ? `미정산 (${completedBookings.filter(b => b.settlementStatus !== 'CONFIRMED').length})` : '정산완료'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Selection Toolbar */}
            <div className={`flex items-center justify-between p-6 rounded-[32px] transition-all ${selectedIds.length > 0 ? 'bg-bee-black shadow-2xl scale-[1.01]' : 'bg-white border border-gray-100 shadow-sm'}`}>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            checked={selectedIds.length > 0 && selectedIds.length === filteredBookings.length}
                            onChange={handleSelectAll}
                            className="w-5 h-5 rounded-lg border-2 border-gray-300 checked:bg-bee-yellow checked:border-bee-yellow transition-all cursor-pointer"
                        />
                        <span className={`text-sm font-black ${selectedIds.length > 0 ? 'text-white' : 'text-gray-400'}`}>
                            {selectedIds.length}건 선택됨
                        </span>
                    </div>
                    {selectedIds.length > 0 && (
                        <div className="h-4 w-[1px] bg-white/20"></div>
                    )}
                    {selectedIds.length > 0 && (
                        <div className="text-white">
                            <span className="text-[10px] font-black uppercase text-white/40 block leading-none mb-1">Total Selected</span>
                            <span className="text-lg font-black text-bee-yellow">₩{totalSelectedAmount.toLocaleString()}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleBatchSettle}
                        disabled={selectedIds.length === 0 || isProcessing}
                        className={`px-6 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${selectedIds.length > 0 ? 'bg-bee-yellow text-bee-black hover:scale-105 active:scale-95' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                    >
                        <i className="fa-solid fa-check-double"></i>
                        일괄 정산 확정
                    </button>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-gray-50/50">
                                <th className="px-6 py-4 w-12"></th>
                                <th className="px-6 py-4">예약번호 / 고객</th>
                                <th className="px-6 py-4">지점</th>
                                <th className="px-6 py-4">날짜</th>
                                <th className="px-6 py-4">결제수단</th>
                                <th className="px-6 py-4">금액</th>
                                <th className="px-6 py-4">상태</th>
                                <th className="px-6 py-4 text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <i className="fa-solid fa-folder-open text-4xl text-gray-100"></i>
                                            <p className="text-sm font-bold text-gray-400">조회된 내역이 없습니다. 시원하시겠어요! 💅</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map(b => (
                                    <tr key={b.id} className="group hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-5">
                                            <input 
                                                type="checkbox" 
                                                checked={!!(b.id && selectedIds.includes(b.id))}
                                                onChange={() => b.id && handleSelectOne(b.id)}
                                                className="w-5 h-5 rounded-lg border-2 border-gray-200 checked:bg-bee-yellow checked:border-bee-yellow transition-all cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-gray-400 mb-0.5">{b.id}</span>
                                                <span className="text-sm font-black text-bee-black truncate max-w-[120px]">{b.userName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Origin Branch</span>
                                                <span className="text-xs font-black text-bee-black">{getBranchName(b.branchId || b.pickupLocation)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-bold text-gray-600 tabular-nums">{b.pickupDate}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-2 py-0.5 bg-gray-100 text-[10px] font-black text-gray-500 rounded-md uppercase">
                                                {b.paymentMethod || 'cash'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 font-black text-bee-black tabular-nums">
                                            ₩{(b.settlementHardCopyAmount ?? b.finalPrice ?? 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-5">
                                            {b.settlementStatus === 'CONFIRMED' ? (
                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black">정산확정</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-[10px] font-black">정산대기</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {b.settlementStatus !== 'CONFIRMED' && (
                                                <button
                                                    onClick={() => settleBooking(b)}
                                                    disabled={isProcessing}
                                                    className="px-4 py-2 bg-bee-black text-bee-yellow text-[10px] font-black rounded-xl hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    정산 확정
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinancialComparisonTab;
