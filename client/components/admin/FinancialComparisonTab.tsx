import React, { useMemo, useState } from 'react';
import { BookingState, BookingStatus, LocationOption, ServiceType } from '../../types';
import { StorageService } from '../../services/storageService';
import { AuditService } from '../../services/auditService';
import { useQueryClient } from '@tanstack/react-query';
import { supabaseMutate } from '../../services/supabaseClient';

import { useAdminStore } from '../../src/store/adminStore';

interface FinancialComparisonTabProps {
    bookings: BookingState[];
    locations: LocationOption[];
    t: any;
    currentActor: any;
    onSettleComplete?: () => void;
}

const FinancialComparisonTab: React.FC<FinancialComparisonTabProps> = ({
    bookings,
    locations,
    t,
    currentActor,
    onSettleComplete,
}) => {
    const BOOKING_DETAIL_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const queryClient = useQueryClient();
    const { activeStatusTab } = useAdminStore();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNSETTLED' | 'SETTLED'>('UNSETTLED');

    const isSupabaseBookingDetailId = (value?: string | null) =>
        BOOKING_DETAIL_UUID_PATTERN.test(String(value || '').trim());

    const isFinancialDeleted = (booking?: BookingState | null) =>
        Boolean(booking?.isDeleted) || String(booking?.settlementStatus || '').toLowerCase() === 'deleted';

    const resolveBookingDetailId = async (booking: BookingState): Promise<string> => {
        if (booking.id && isSupabaseBookingDetailId(booking.id)) {
            return booking.id;
        }

        const resolved = await StorageService.getBooking(booking.reservationCode || booking.id || '');
        if (resolved?.id && isSupabaseBookingDetailId(resolved.id)) {
            return resolved.id;
        }

        throw new Error(`Supabase booking_details row not found for booking identifier: ${booking.id || booking.reservationCode}`);
    };

    const mutateFinancialBooking = async (
        booking: BookingState,
        options: {
            supabaseMethod: 'PATCH' | 'DELETE';
            supabaseBody?: Record<string, unknown>;
        }
    ) => {
        if (!booking.id) return;

        // 1차: UUID 기반 PATCH 시도
        try {
            const bookingDetailId = await resolveBookingDetailId(booking);
            await supabaseMutate(`booking_details?id=eq.${encodeURIComponent(bookingDetailId)}`, options.supabaseMethod, options.supabaseBody);
            return;
        } catch {
            // UUID 조회 실패 시 reservation_code 폴백으로 진행
        }

        // 2차: reservation_code 기반 PATCH 폴백
        const code = booking.reservationCode || (isSupabaseBookingDetailId(booking.id) ? null : booking.id);
        if (!code) {
            throw new Error(`정산 처리 불가 — 예약 식별자 없음 (id: ${booking.id})`);
        }
        await supabaseMutate(
            `booking_details?reservation_code=eq.${encodeURIComponent(code)}`,
            options.supabaseMethod,
            options.supabaseBody
        );
    };

    // [스봉이] 금융 대조는 "정산 대상 완료 예약"만 다뤄요.
    // 삭제/취소/환불 건은 어떤 탭 상태에서 넘어와도 미정산 목록으로 유입시키지 않습니다. 💅
    const settlementTargets = useMemo(() => {
        let base = bookings.filter(
            (b) =>
                !isFinancialDeleted(b) &&
                b.status !== BookingStatus.CANCELLED &&
                b.status !== BookingStatus.REFUNDED
        );
        
        // 대시보드에서 특정 상태('COMPLETED' 등)를 눌러서 넘어온 경우
        if (activeStatusTab !== 'ALL') {
            if (activeStatusTab === 'COMPLETED') {
                base = base.filter(b => b.status === BookingStatus.COMPLETED);
            } else if (activeStatusTab === 'ISSUE') {
                base = base.filter(b => b.status === BookingStatus.COMPLETED && !!b.auditNote);
            }
        } else {
            // 기본은 '완료' 건만 보여주되, 정산 안 된 건들 위주로
            base = base.filter(b => b.status === BookingStatus.COMPLETED);
        }
        
        return base;
    }, [bookings, activeStatusTab]);

    const filteredBookings = useMemo(() => {
        if (filterStatus === 'ALL') return settlementTargets;
        if (filterStatus === 'UNSETTLED') return settlementTargets.filter(b => b.settlementStatus !== 'CONFIRMED');
        return settlementTargets.filter(b => b.settlementStatus === 'CONFIRMED');
    }, [settlementTargets, filterStatus]);

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
            await mutateFinancialBooking(booking, {
                supabaseMethod: 'PATCH',
                supabaseBody: {
                    settlement_status: 'CONFIRMED',
                    settled_at: new Date().toISOString(),
                    settled_by: currentActor.name
                }
            });
            await AuditService.logAction(currentActor, 'SETTLEMENT_CONFIRM', { id: booking.id, type: 'BOOKING' }, { method: 'INDIVIDUAL' });
            await queryClient.invalidateQueries({ queryKey: ['bookings'] });
            onSettleComplete?.();
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
            const selectedBookings = filteredBookings.filter((booking) => booking.id && selectedIds.includes(booking.id));
            const settledAt = new Date().toISOString();

            let successCount = 0;
            const failedBookings: { code: string; reason: string }[] = [];

            for (const booking of selectedBookings) {
                try {
                    await mutateFinancialBooking(booking, {
                        supabaseMethod: 'PATCH',
                        supabaseBody: {
                            settlement_status: 'CONFIRMED',
                            settled_at: settledAt,
                            settled_by: currentActor.name
                        }
                    });
                    successCount++;
                } catch (e) {
                    const errMsg = e instanceof Error ? e.message : String(e);
                    console.warn(`[FinancialTab] 정산 실패 (${booking.reservationCode || booking.id}):`, errMsg);
                    failedBookings.push({ code: booking.reservationCode || booking.id || '?', reason: errMsg });
                }
            }

            if (successCount === 0 && failedBookings.length > 0) {
                const detail = failedBookings.slice(0, 5).map(f => `• ${f.code}`).join('\n');
                const more = failedBookings.length > 5 ? `\n…외 ${failedBookings.length - 5}건` : '';
                alert(`정산 처리할 수 있는 예약이 없습니다.\n\n실패 목록:\n${detail}${more}\n\n콘솔에서 상세 오류를 확인하세요.`);
                return;
            }

            await AuditService.logAction(currentActor, 'SETTLEMENT_CONFIRM', { id: 'bulk', type: 'BOOKING' }, { count: successCount, method: 'BULK' });
            await queryClient.invalidateQueries({ queryKey: ['bookings'] });
            setSelectedIds([]);

            if (failedBookings.length > 0) {
                const detail = failedBookings.slice(0, 3).map(f => `• ${f.code}`).join('\n');
                const more = failedBookings.length > 3 ? `\n…외 ${failedBookings.length - 3}건` : '';
                alert(`${successCount}건 정산 확정 완료.\n\n${failedBookings.length}건 실패 (DB에서 찾을 수 없는 예약):\n${detail}${more}`);
            } else {
                alert(`${successCount}건의 일괄 정산 확정이 완료되었습니다. ✨`);
            }
            onSettleComplete?.();
        } catch (e) {
            console.error(e);
            alert('일괄 정산 중 오류가 발생했습니다. 🙄');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBatchDeleteUnsettled = async () => {
        if (selectedIds.length === 0) return;

        const selectedBookings = filteredBookings.filter((booking) => booking.id && selectedIds.includes(booking.id));
        const deleteTargets = selectedBookings.filter((booking) => booking.settlementStatus !== 'CONFIRMED');

        if (deleteTargets.length === 0) {
            alert('미정산 상태인 예약만 일괄 삭제할 수 있어요.');
            return;
        }

        if (!confirm(`선택한 ${deleteTargets.length}건의 미정산 내역을 휴지통으로 이동할까요?\n정산 완료 건은 제외되고, 필요하면 예약 관리에서 복구할 수 있습니다.`)) {
            return;
        }

        setIsProcessing(true);
        try {
            let successCount = 0;
            let skipCount = 0;
            for (const booking of deleteTargets) {
                try {
                    await mutateFinancialBooking(booking, {
                        supabaseMethod: 'PATCH',
                        supabaseBody: { settlement_status: 'deleted' },
                    });
                    successCount++;
                } catch (e) {
                    console.warn(`[FinancialTab] 삭제 스킵 (${booking.id}):`, e);
                    skipCount++;
                }
            }
            await AuditService.logAction(
                currentActor,
                'DELETE',
                { id: 'financial-comparison-bulk-delete', type: 'BOOKING' },
                { count: successCount, method: 'BULK_SOFT_DELETE_UNSETTLED' }
            );
            await queryClient.invalidateQueries({ queryKey: ['bookings'] });
            setSelectedIds((prev) => prev.filter((id) => !deleteTargets.some((booking) => booking.id === id)));
            if (skipCount > 0) {
                alert(`${successCount}건 휴지통 이동 완료. ${skipCount}건은 레거시 예약으로 건너뛰었습니다.`);
            } else {
                alert(`${successCount}건의 미정산 내역을 휴지통으로 이동했습니다.`);
            }
        } catch (e) {
            console.error(e);
            alert('미정산 일괄 삭제 중 오류가 발생했습니다. 🙄');
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
                            {s === 'ALL' ? '전체' : s === 'UNSETTLED' ? `미정산 (${settlementTargets.filter(b => b.settlementStatus !== 'CONFIRMED').length})` : '정산완료'}
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
                        onClick={handleBatchDeleteUnsettled}
                        disabled={selectedIds.length === 0 || isProcessing}
                        className={`px-6 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${selectedIds.length > 0 ? 'bg-red-500 text-white hover:scale-105 active:scale-95' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                    >
                        <i className="fa-solid fa-trash-can"></i>
                        미정산 일괄 삭제
                    </button>
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
                                            <div className="flex items-center justify-end gap-2">
                                                {b.settlementStatus !== 'CONFIRMED' && (
                                                    <>
                                                        <button
                                                            onClick={() => settleBooking(b)}
                                                            disabled={isProcessing}
                                                            className="px-4 py-2 bg-bee-black text-bee-yellow text-[10px] font-black rounded-xl hover:scale-105 active:scale-95 transition-all"
                                                        >
                                                            정산 확정
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!b.id) return;
                                                                if (!confirm('이 미정산 내역을 휴지통으로 이동할까요? 예약 관리에서 복구할 수 있습니다.')) return;
                                                                setIsProcessing(true);
                                                                try {
                                                                    await mutateFinancialBooking(b, {
                                                                        supabaseMethod: 'PATCH',
                                                                        supabaseBody: { settlement_status: 'deleted' },
                                                                    });
                                                                    await AuditService.logAction(currentActor, 'DELETE', { id: b.id, type: 'BOOKING' }, { method: 'INDIVIDUAL_SOFT_DELETE_UNSETTLED' });
                                                                    await queryClient.invalidateQueries({ queryKey: ['bookings'] });
                                                                } catch (e) {
                                                                    console.error(e);
                                                                    alert('삭제 중 오류가 발생했습니다. 🙄');
                                                                } finally {
                                                                    setIsProcessing(false);
                                                                }
                                                            }}
                                                            disabled={isProcessing}
                                                            className="px-4 py-2 bg-red-50 text-red-500 text-[10px] font-black rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                                        >
                                                            삭제
                                                        </button>
                                                    </>
                                                )}
                                            </div>
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
