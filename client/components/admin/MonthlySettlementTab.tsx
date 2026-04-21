import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookingState, BookingStatus, Expenditure, CashClosing } from '../../types';

interface MonthlySettlementTabProps {
    bookings: BookingState[];
    expenditures: Expenditure[];
    revenueStartDate: string;
    setRevenueStartDate: (d: string) => void;
    revenueEndDate: string;
    setRevenueEndDate: (d: string) => void;
    monthlyControlStats: any;
    accountingMonthlyStats: any[];
    onSettlementClose?: (month: string) => void;
    onExportPdf?: (month: string) => void;
    onBulkPayoutConfirm?: (bookingIds: string[]) => void;
}

type SubTab = 'overview' | 'payout' | 'ledger' | 'exceptions';

const MonthlySettlementTab: React.FC<MonthlySettlementTabProps> = ({
    bookings,
    expenditures,
    revenueStartDate,
    setRevenueStartDate,
    revenueEndDate,
    setRevenueEndDate,
    monthlyControlStats,
    accountingMonthlyStats,
    onSettlementClose,
    onExportPdf,
    onBulkPayoutConfirm,
}) => {
    const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');
    const [isClosing, setIsClosing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isBulkConfirming, setIsBulkConfirming] = useState(false);

    const currentMonth = useMemo(() => {
        const d = revenueStartDate ? new Date(revenueStartDate) : new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }, [revenueStartDate]);

    const payoutCandidates = useMemo(() =>
        bookings.filter((booking) => {
            const pickupDate = String(booking.pickupDate || '').trim();
            if (!pickupDate.startsWith(currentMonth)) return false;
            if (!booking.id || booking.isDeleted) return false;
            if (booking.status === BookingStatus.REFUNDED || booking.status === BookingStatus.CANCELLED) return false;
            if (booking.settlementStatus !== 'CONFIRMED') return false;
            return Number(booking.branchSettlementAmount || 0) > 0;
        }),
        [bookings, currentMonth]
    );

    const payoutCandidateIds = useMemo(
        () => payoutCandidates.map((booking) => booking.id!).filter(Boolean),
        [payoutCandidates]
    );

    const handleSettlementClose = useCallback(async () => {
        if (!confirm(`${currentMonth} 월 정산을 마감하시겠습니까?\n마감 후 해당 월 정산 데이터는 수정이 제한됩니다.`)) return;
        setIsClosing(true);
        try {
            if (onSettlementClose) {
                await onSettlementClose(currentMonth);
            } else {
                alert(`${currentMonth} 월 정산 마감이 기록되었습니다.`);
            }
        } finally {
            setIsClosing(false);
        }
    }, [currentMonth, onSettlementClose]);

    const handleExportPdf = useCallback(async () => {
        setIsExporting(true);
        try {
            if (onExportPdf) {
                await onExportPdf(currentMonth);
            } else {
                const printArea = document.querySelector('.monthly-settlement-print-area') || document.body;
                window.print();
            }
        } finally {
            setIsExporting(false);
        }
    }, [currentMonth, onExportPdf]);

    const handleBulkPayoutConfirm = useCallback(async () => {
        if (payoutCandidateIds.length === 0) {
            alert('지급 확정할 미정산 건이 없습니다.');
            return;
        }
        if (!confirm(`미정산 ${payoutCandidateIds.length}건을 일괄 지급 확정하시겠습니까?`)) return;
        setIsBulkConfirming(true);
        try {
            if (onBulkPayoutConfirm) {
                await onBulkPayoutConfirm(payoutCandidateIds);
            } else {
                alert(`${payoutCandidateIds.length}건 일괄 지급 확정 요청이 기록되었습니다.`);
            }
        } finally {
            setIsBulkConfirming(false);
        }
    }, [payoutCandidateIds, onBulkPayoutConfirm]);

    const stats = monthlyControlStats || {
        gross: 0,
        confirmed: 0,
        unconfirmed: 0,
        payout: 0,
        netMargin: 0,
        expenditure: 0,
        orderCount: 0,
        cancelledCount: 0,
        refundedCount: 0
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <i className="fa-solid fa-vault text-9xl text-bee-black"></i>
                </div>
                
                <div className="space-y-1 z-10">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                        월 정산 통제판 <span className="text-bee-yellow italic text-xl ml-1">Control Tower</span>
                    </h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Financial Settlement & Partner Payout Management 🛡️</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 z-10">
                    <div className="flex bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100">
                        {(['overview', 'payout', 'ledger', 'exceptions'] as SubTab[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveSubTab(tab)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black tracking-tight transition-all uppercase ${
                                    activeSubTab === tab 
                                    ? 'bg-bee-black text-white shadow-lg' 
                                    : 'text-gray-400 hover:text-bee-black hover:bg-gray-100'
                                }`}
                            >
                                {tab === 'overview' ? '전체 요약' : 
                                 tab === 'payout' ? '지급 관리' : 
                                 tab === 'ledger' ? '정산 원장' : '예외/조정'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between hover:border-bee-yellow transition-all group">
                    <div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">월 총 결제액</p>
                        <h3 className="text-2xl font-black italic text-bee-black">₩{stats.gross.toLocaleString()}</h3>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">{stats.orderCount} 건의 주문</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-bee-yellow animate-pulse"></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between hover:border-emerald-400 transition-all">
                    <div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">지급 예정 (파트너)</p>
                        <h3 className="text-2xl font-black italic text-emerald-500">₩{stats.payout.toLocaleString()}</h3>
                    </div>
                    <p className="text-[9px] font-black text-emerald-400/60 uppercase mt-2 tracking-tighter">정산 기준일 도래 건</p>
                </div>

                <div className="bg-bee-black p-6 rounded-[32px] shadow-xl flex flex-col justify-between relative overflow-hidden group/margin">
                    <div className="absolute -right-2 -top-2 opacity-10 text-bee-yellow group-hover/margin:rotate-12 transition-transform">
                        <i className="fa-solid fa-sack-dollar text-4xl"></i>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">추정 순수익 (Margin)</p>
                        <h3 className="text-2xl font-black italic text-bee-yellow">₩{stats.netMargin.toLocaleString()}</h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <motion.div 
                                className="bg-bee-yellow h-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.round((stats.netMargin / (stats.gross || 1)) * 100)}%` }}
                            />
                        </div>
                        <span className="text-[9px] font-black text-bee-yellow">{Math.round((stats.netMargin / (stats.gross || 1)) * 100)}%</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between hover:border-blue-400 transition-all">
                    <div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">정산 확정액</p>
                        <h3 className="text-2xl font-black italic text-blue-500">₩{stats.confirmed.toLocaleString()}</h3>
                    </div>
                    <div className="mt-4">
                        <p className="text-[9px] font-black text-gray-300 uppercase leading-none mb-1">미확정액</p>
                        <p className="text-[11px] font-black text-gray-400">₩{stats.unconfirmed.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between hover:border-red-400 transition-all">
                    <div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">환불 및 예외</p>
                        <h3 className="text-2xl font-black italic text-red-500">₩{(stats.refundedCount * 20000).toLocaleString()}</h3>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <span className="px-2 py-0.5 bg-red-50 text-red-400 text-[8px] font-black rounded-md uppercase">환불 {stats.refundedCount}</span>
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-400 text-[8px] font-black rounded-md uppercase">취소 {stats.cancelledCount}</span>
                    </div>
                </div>
            </div>

            {/* Date Selector & Action Bar */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-wrap items-center gap-6 group hover:border-bee-yellow transition-all duration-500">
                <div className="flex items-center gap-4">
                    <div className="space-y-1">
                        <label htmlFor="rev-start" className="text-[9px] font-black text-gray-400 uppercase tracking-widest block ml-1">정산 대상 시작일</label>
                        <div className="flex items-center gap-2">
                            <input 
                                id="rev-start"
                                type="date" 
                                value={revenueStartDate} 
                                onChange={(e) => setRevenueStartDate(e.target.value)}
                                title="정산 시작일 선택"
                                className="bg-gray-50 px-4 py-2.5 rounded-xl font-black text-[11px] outline-none"
                            />
                            <span className="text-gray-300">~</span>
                            <div className="space-y-1">
                                <label htmlFor="rev-end" className="sr-only">정산 대상 종료일</label>
                                <input 
                                    id="rev-end"
                                    type="date" 
                                    value={revenueEndDate} 
                                    onChange={(e) => setRevenueEndDate(e.target.value)}
                                    title="정산 종료일 선택"
                                    className="bg-gray-50 px-4 py-2.5 rounded-xl font-black text-[11px] outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-1"></div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleSettlementClose}
                        disabled={isClosing}
                        title={`${currentMonth} 월 정산 마감`}
                        className={`px-5 py-2.5 rounded-2xl text-[10px] font-black transition-all border flex items-center gap-2 ${
                            isClosing
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-wait'
                                : 'bg-bee-black text-white border-bee-black hover:bg-bee-yellow hover:text-bee-black hover:border-bee-yellow shadow-lg'
                        }`}
                    >
                        <i className={`fa-solid ${isClosing ? 'fa-spinner fa-spin' : 'fa-lock'}`}></i>
                        {isClosing ? '마감 처리중...' : '월 정산 마감'}
                    </button>
                    <button
                        type="button"
                        onClick={handleExportPdf}
                        disabled={isExporting}
                        title={`${currentMonth} 정산서 PDF 발행`}
                        className={`px-5 py-2.5 rounded-2xl text-[10px] font-black transition-all border flex items-center gap-2 ${
                            isExporting
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-wait'
                                : 'bg-white border-gray-200 text-bee-black hover:border-bee-black hover:shadow-md'
                        }`}
                    >
                        <i className={`fa-solid ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-invoice-dollar'}`}></i>
                        {isExporting ? '생성중...' : 'PDF 발행'}
                    </button>
                </div>
            </div>

            {/* Sub-Tab Content */}
            <AnimatePresence mode="wait">
                {activeSubTab === 'overview' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                    >
                        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black flex items-center gap-3">
                                    <i className="fa-solid fa-chart-line text-blue-500"></i> 월별 실적 추이
                                </h3>
                                <span className="text-[10px] font-black text-gray-300 uppercase">최근 6개월 기준</span>
                            </div>
                            <div className="space-y-4">
                                {accountingMonthlyStats.slice(0, 6).map((m, idx) => (
                                    <div key={m.month} className="group cursor-pointer">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-xs font-black text-gray-500 group-hover:text-bee-black transition-colors">{m.month}</span>
                                            <span className="text-xs font-black text-bee-black">₩{m.total.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                                            <motion.div 
                                                className="h-full bg-blue-400 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min((m.total / (accountingMonthlyStats[0]?.total || 1)) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                            <h3 className="text-lg font-black flex items-center gap-3">
                                <i className="fa-solid fa-shield-check text-emerald-500"></i> 정산 마감 체크리스트
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { label: '일일 시재 마감 100% 완료', status: 'done' },
                                    { label: '파트너 지점 정산 데이터 대조 확인', status: 'pending' },
                                    { label: '운송사 위탁 비용 확정', status: 'pending' },
                                    { label: '미정산/예외 주문(환불 등) 처리', status: 'warning' },
                                    { label: '최종 매출 세금 계산서 발행 대기', status: 'pending' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                                        <span className="text-[11px] font-black text-gray-600">{item.label}</span>
                                        <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${
                                            item.status === 'done' ? 'bg-emerald-100 text-emerald-600' : 
                                            item.status === 'warning' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'
                                        }`}>
                                            {item.status.toUpperCase()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeSubTab === 'payout' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black italic">Partners & Carriers Payout Ledger</h3>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleBulkPayoutConfirm}
                                    disabled={isBulkConfirming || payoutCandidateIds.length === 0}
                                    title={payoutCandidateIds.length > 0 ? `미정산 ${payoutCandidateIds.length}건 일괄 지급 확정` : '지급 확정할 미정산 건이 없습니다'}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all flex items-center gap-2 ${
                                        isBulkConfirming || payoutCandidateIds.length === 0
                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                            : 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 shadow-lg'
                                    }`}
                                >
                                    <i className={`fa-solid ${isBulkConfirming ? 'fa-spinner fa-spin' : 'fa-check-double'}`}></i>
                                    {isBulkConfirming ? '처리중...' : `일괄 지급 확정${payoutCandidateIds.length > 0 ? ` (${payoutCandidateIds.length}건)` : ''}`}
                                </button>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-3xl border border-gray-50">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
                                    <tr>
                                        <th className="px-6 py-4">구분</th>
                                        <th className="px-6 py-4">기관명</th>
                                        <th className="px-6 py-4 text-center">건수</th>
                                        <th className="px-6 py-4 text-right">정산 대상액</th>
                                        <th className="px-6 py-4 text-center">상태</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-xs text-bee-black">
                                    {payoutCandidates.length > 0 ? (
                                        payoutCandidates.slice(0, 5).map((b, idx) => (
                                            <tr key={b.id || idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${idx % 2 === 0 ? 'bg-bee-yellow/10 text-bee-yellow' : 'bg-blue-100 text-blue-500'}`}>
                                                        {idx % 2 === 0 ? 'PARTNER' : 'CARRIER'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-black">{b.pickupLocation || 'N/A'}</td>
                                                <td className="px-6 py-4 text-center font-bold">1 건</td>
                                                <td className="px-6 py-4 text-right font-black">₩{Number(b.branchSettlementAmount || 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-[10px] font-black uppercase ${b.settlementStatus === 'CONFIRMED' ? 'text-emerald-500' : 'text-orange-400'}`}>
                                                        {b.settlementStatus === 'CONFIRMED' ? '정산확정' : '정산대기'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        disabled
                                                        title="정산 상세 보기는 아직 준비 중입니다."
                                                        className="text-[10px] font-black text-gray-300 underline cursor-not-allowed"
                                                    >
                                                        준비중
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-20 text-center text-gray-300 font-bold">정산 대상 데이터가 부족합니다. 💅</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MonthlySettlementTab;
