import React, { useState, useEffect, useMemo } from 'react';
import { CashClosing, Expenditure, BookingState, BookingStatus, BankTransaction } from '../../types';
import { loadAllLogsForRange, KioskStorageLog } from '../../services/kioskDb';
import { useBankTransactions, useBankTransactionsMutations } from '../../src/domains/admin/hooks/useBankTransactions';

interface DailySettlementTabProps {
    revenueStartDate: string;
    revenueEndDate: string;
    setRevenueStartDate: (d: string) => void;
    setRevenueEndDate: (d: string) => void;
    dailySettlementStats: any;
    cashClosing: any;
    setCashClosing: (c: any) => void;
    handleCashClose: () => void;
    expForm: any;
    setExpForm: (f: any) => void;
    handleSaveExpenditure: () => void;
    closings: CashClosing[];
    clearClosingHistory: () => void;
    bookings: BookingState[];
    expenditures: Expenditure[];
    deleteExpenditure: (id: string) => void;
    setSelectedBooking: (b: BookingState | null) => void;
    t: any;
}

const DailySettlementTab: React.FC<DailySettlementTabProps> = ({
    revenueStartDate,
    revenueEndDate,
    setRevenueStartDate,
    setRevenueEndDate,
    dailySettlementStats,
    cashClosing,
    setCashClosing,
    handleCashClose,
    expForm,
    setExpForm,
    handleSaveExpenditure,
    closings,
    clearClosingHistory,
    bookings,
    expenditures,
    deleteExpenditure,
    setSelectedBooking,
    t
}) => {
    // 통장 잔고 & 입금
    const { data: bankTxs = [] } = useBankTransactions();
    const { save: saveBankTx } = useBankTransactionsMutations();
    const latestBalance = useMemo(() => bankTxs.length > 0 ? bankTxs[0].balance : 0, [bankTxs]);

    const [bankForm, setBankForm] = useState({
        bankName: '',
        accountAlias: '',
        amount: '' as string | number,
        balance: '' as string | number,
        description: '',
    });
    const [bankSaving, setBankSaving] = useState(false);
    const [bankSaved, setBankSaved] = useState(false);

    const CLOSE_CHECKLIST = [
        { id: 'reservations', label: '예약 확정 완료', icon: 'fa-calendar-check' },
        { id: 'kiosk',        label: '키오스크 집계 확인', icon: 'fa-store' },
        { id: 'cash',         label: '현금 실사 완료', icon: 'fa-coins' },
        { id: 'bank',         label: '통장 입금 확인', icon: 'fa-building-columns' },
    ] as const;
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
    useEffect(() => { setCheckedItems(new Set()); }, [revenueEndDate]);
    const allChecked = checkedItems.size === CLOSE_CHECKLIST.length;

    const handleSaveDeposit = async () => {
        const amount = Number(bankForm.amount);
        const balance = Number(bankForm.balance);
        if (!amount || !bankForm.bankName) return;
        setBankSaving(true);
        try {
            await saveBankTx({
                date: revenueEndDate,
                bankName: bankForm.bankName,
                accountAlias: bankForm.accountAlias,
                txType: 'deposit',
                amount,
                balance: balance || latestBalance + amount,
                description: bankForm.description,
                createdBy: 'admin',
                createdAt: new Date().toISOString(),
            } as BankTransaction);
            setBankForm({ bankName: '', accountAlias: '', amount: '', balance: '', description: '' });
            setBankSaved(true);
            setTimeout(() => setBankSaved(false), 2500);
        } finally {
            setBankSaving(false);
        }
    };

    // 키오스크 정산
    const [kioskLogs, setKioskLogs] = useState<KioskStorageLog[]>([]);
    const [kioskLoading, setKioskLoading] = useState(false);

    useEffect(() => {
        if (!revenueEndDate) return;
        setKioskLoading(true);
        (async () => {
            try {
                // 일일 시재는 단일 날짜 — revenueEndDate만 사용해 탭 전환 시 월범위 오염 방지
                const logs = await loadAllLogsForRange(revenueEndDate, revenueEndDate);
                setKioskLogs(logs);
            } finally {
                setKioskLoading(false);
            }
        })();
    }, [revenueEndDate]);

    const kioskStats = useMemo(() => {
        // done=false는 짐 미반환(보관중)이지 미결제가 아님 — 날짜 기준으로 전체 집계
        const gross = kioskLogs.reduce((s, l) => s + l.original_price, 0);
        const disc  = kioskLogs.reduce((s, l) => s + (l.discount ?? 0), 0);
        const net = gross - disc;
        const cash = kioskLogs.filter(l => l.payment === '현금').reduce((s, l) => s + (l.original_price - (l.discount ?? 0)), 0);
        const card = kioskLogs.filter(l => l.payment === '카드').reduce((s, l) => s + (l.original_price - (l.discount ?? 0)), 0);
        const unpaid = kioskLogs.filter(l => l.payment === '미수금').reduce((s, l) => s + (l.original_price - (l.discount ?? 0)), 0);
        const storingCount = kioskLogs.filter(l => !l.done).length;
        return { count: kioskLogs.length, gross, disc, net, cash, card, unpaid, storingCount };
    }, [kioskLogs]);

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-125 transition-transform duration-1000 group-hover:rotate-12">
                    <i className="fa-solid fa-file-invoice-dollar text-9xl text-bee-black"></i>
                </div>
                <div className="space-y-1.5 relative">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-bee-black text-bee-yellow text-[8px] font-black rounded tracking-widest uppercase">Finance Ops</span>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-bee-black">
                            마감 원장 <span className="text-bee-yellow font-serif italic">Closing Board</span>
                        </h1>
                    </div>
                    <p className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                        <i className="fa-solid fa-shield-check text-emerald-500"></i> 지점별 시재 대조 및 본사 수익 정산 확정 🛡️
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-gray-50/50 p-2 pl-6 rounded-[28px] border border-gray-100 hover:bg-white hover:border-bee-yellow transition-all duration-500 hover:shadow-xl hover:shadow-bee-yellow/5">
                    <div className="flex flex-col items-start">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                             Target Date <i className="fa-solid fa-chevron-down text-[6px]"></i>
                        </span>
                        <input
                            type="date"
                            title="정산 날짜 선택"
                            value={revenueEndDate}
                            onChange={e => { setRevenueStartDate(e.target.value); setRevenueEndDate(e.target.value); }}
                            className="text-sm font-black bg-transparent outline-none cursor-pointer text-bee-black focus:text-bee-yellow transition-colors"
                        />
                    </div>
                    <div className="w-10 h-10 bg-bee-black rounded-[18px] text-bee-yellow shadow-lg flex items-center justify-center group-hover:rotate-[360deg] transition-transform duration-700">
                        <i className="fa-solid fa-magnifying-glass-chart text-xs"></i>
                    </div>
                </div>
            </div>

            {/* Premium Summary Grid - Optimized Space */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between hover:border-bee-yellow hover:shadow-xl transition-all group/stat relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-gray-50 rounded-full opacity-50 group-hover/stat:scale-150 transition-transform"></div>
                    <div className="relative">
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <i className="fa-solid fa-cash-register opacity-50"></i> {t.admin?.overview?.revenue || '총 매출액'}
                        </p>
                        <h3 className="text-lg font-black tabular-nums text-bee-black">
                            ₩{(dailySettlementStats.totalRevenue + kioskStats.net).toLocaleString()}
                        </h3>
                        {kioskStats.net > 0 && (
                            <p className="text-[8px] font-bold text-gray-300 mt-0.5">
                                예약 ₩{dailySettlementStats.totalRevenue.toLocaleString()} + 키오스크 ₩{kioskStats.net.toLocaleString()}
                            </p>
                        )}
                    </div>
                    <div className="mt-2 flex gap-1.5 items-center flex-wrap">
                        <div className="px-2 py-0.5 bg-bee-yellow/10 rounded-lg text-[8px] font-black text-bee-yellow flex items-center gap-1">
                            <i className="fa-solid fa-truck text-[7px]"></i> {dailySettlementStats.deliveryCount}
                        </div>
                        <div className="px-2 py-0.5 bg-bee-blue/10 rounded-lg text-[8px] font-black text-bee-blue flex items-center gap-1">
                            <i className="fa-solid fa-box-archive text-[7px]"></i> {dailySettlementStats.storageCount}
                        </div>
                        {kioskStats.count > 0 && (
                            <div className="px-2 py-0.5 bg-amber-100 rounded-lg text-[8px] font-black text-amber-600 flex items-center gap-1">
                                <i className="fa-solid fa-store text-[7px]"></i> {kioskStats.count}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between hover:border-emerald-400 hover:shadow-xl transition-all group/stat relative overflow-hidden">
                    <div className="relative">
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <i className="fa-solid fa-check-double text-emerald-500"></i> {t.admin?.logistics?.filter_completed || '정산 확정'}
                        </p>
                        <h3 className="text-lg font-black tabular-nums text-emerald-500">₩{(dailySettlementStats.confirmedAmount || 0).toLocaleString()}</h3>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                        <p className="text-[8px] font-black text-gray-400 uppercase">Pending: ₩{(dailySettlementStats.unconfirmedAmount || 0).toLocaleString()}</p>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between hover:border-orange-400 hover:shadow-xl transition-all group/stat relative overflow-hidden">
                    <div className="relative">
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <i className="fa-solid fa-hand-holding-dollar text-orange-400"></i> 커미션
                        </p>
                        <h3 className="text-lg font-black tabular-nums text-orange-500">₩{(dailySettlementStats.partnerPayoutTotal || 0).toLocaleString()}</h3>
                    </div>
                    <div className="mt-2">
                        <p className="text-[8px] font-black text-orange-300 uppercase tracking-tight">파트너/지점 커미션</p>
                    </div>
                </div>

                <div className="bg-bee-black p-4 rounded-[28px] shadow-2xl flex flex-col justify-between relative overflow-hidden group/card hover:-translate-y-1 transition-all">
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-bee-yellow opacity-[0.05] rounded-full group-hover/card:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">순수익 (Net Profit)</p>
                            <span className="w-5 h-5 rounded-full bg-bee-yellow/10 flex items-center justify-center">
                                <i className="fa-solid fa-crown text-[9px] text-bee-yellow"></i>
                            </span>
                        </div>
                        <h3 className="text-lg font-black italic tabular-nums text-bee-yellow drop-shadow-lg">
                            ₩{(dailySettlementStats.netProfit - (dailySettlementStats.partnerPayoutTotal || 0) + kioskStats.net).toLocaleString()}
                        </h3>
                        {kioskStats.net > 0 && (
                            <p className="text-[8px] font-bold text-gray-500 mt-0.5">키오스크 +₩{kioskStats.net.toLocaleString()} 포함</p>
                        )}
                    </div>
                </div>
            </div>

            {/* [스봉이] 취소/환불 별도 표기 섹션 💅✨ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-red-50/50 p-4 rounded-[28px] border border-red-100 flex flex-col justify-between group/stat">
                    <div>
                        <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <i className="fa-solid fa-ban"></i> 취소 (Cancelled)
                        </p>
                        <h3 className="text-base font-black tabular-nums text-red-500">
                            ₩{(dailySettlementStats.cancelledTotal || 0).toLocaleString()}
                        </h3>
                    </div>
                    <p className="text-[8px] font-bold text-red-300 mt-2">{dailySettlementStats.cancelledCount || 0}건 취소</p>
                </div>

                <div className="bg-orange-50/50 p-4 rounded-[28px] border border-orange-100 flex flex-col justify-between group/stat">
                    <div>
                        <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <i className="fa-solid fa-rotate-left"></i> 환불 (Refunded)
                        </p>
                        <h3 className="text-base font-black tabular-nums text-orange-500">
                            ₩{(dailySettlementStats.refundedTotal || 0).toLocaleString()}
                        </h3>
                    </div>
                    <p className="text-[8px] font-bold text-orange-300 mt-2">{dailySettlementStats.refundedCount || 0}건 환불</p>
                </div>

                <div className="col-span-2 bg-gray-50/30 p-4 rounded-[28px] border border-gray-100 flex items-center justify-center border-dashed">
                    <p className="text-[10px] font-black text-gray-300 italic">위 금액은 총 매출액에 합산되지 않은 제외 항목입니다. 💅</p>
                </div>
            </div>

            {/* 🐝 키오스크 정산 요약 */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black flex items-center gap-2 text-bee-black">
                        <span className="w-6 h-6 bg-bee-yellow rounded-lg flex items-center justify-center text-[10px]">🐝</span>
                        키오스크 정산 <span className="text-gray-300 font-serif italic text-xs">Kiosk Settlement</span>
                        <span className="px-2 py-0.5 bg-bee-black text-bee-yellow text-[8px] font-black rounded-lg tracking-widest uppercase">연남점 본사 통합</span>
                        {kioskStats.storingCount > 0 && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-black rounded-lg">보관중 {kioskStats.storingCount}건</span>
                        )}
                    </h3>
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{revenueEndDate}</span>
                </div>
                {kioskLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <div className="w-5 h-5 border-2 border-bee-yellow border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-[11px] font-black text-gray-300">불러오는 중…</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-bee-yellow/5 p-4 rounded-[24px] border border-bee-yellow/20 flex flex-col gap-1">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">보관 건수</p>
                            <p className="text-xl font-black text-bee-black tabular-nums">{kioskStats.count}<span className="text-xs font-bold text-gray-400 ml-1">건</span></p>
                        </div>
                        <div className="bg-gray-50/50 p-4 rounded-[24px] border border-gray-100 flex flex-col gap-1">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">매출 합계</p>
                            <p className="text-xl font-black text-bee-black tabular-nums">₩{kioskStats.gross.toLocaleString()}</p>
                        </div>
                        <div className="bg-red-50/50 p-4 rounded-[24px] border border-red-100 flex flex-col gap-1">
                            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">총 할인</p>
                            <p className="text-xl font-black text-red-500 tabular-nums">-₩{kioskStats.disc.toLocaleString()}</p>
                        </div>
                        <div className="bg-bee-black p-4 rounded-[24px] flex flex-col gap-1 relative overflow-hidden">
                            <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-bee-yellow opacity-5 rounded-full"></div>
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">순수익</p>
                            <p className="text-xl font-black italic text-bee-yellow tabular-nums">₩{kioskStats.net.toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* 통장 잔고 + 현금 시재 가로 배치 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">

                    {/* 통장 잔고 & 입금 등록 */}
                    <div className="bg-white p-6 md:p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6 relative overflow-hidden group/bank">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover/bank:scale-125 transition-transform duration-1000 pointer-events-none">
                            <i className="fa-solid fa-building-columns text-8xl text-bee-black"></i>
                        </div>

                        {/* 헤더 */}
                        <div className="space-y-1 relative">
                            <h3 className="text-lg font-black flex items-center gap-2 text-bee-black">
                                <i className="fa-solid fa-building-columns text-blue-500"></i> 통장 잔고
                                <span className="text-gray-300 font-serif italic text-sm">Bank Balance</span>
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">현재 통장 잔액 및 입금 내역 등록</p>
                        </div>

                        {/* 잔고 표시 */}
                        <div className="bg-blue-50/60 rounded-[28px] border border-blue-100 p-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">현재 잔액</p>
                                <div className="font-black text-3xl text-blue-700 flex items-baseline gap-1 font-mono">
                                    <span className="text-sm opacity-50">₩</span>
                                    {latestBalance.toLocaleString()}
                                </div>
                                <p className="text-[8px] font-medium text-blue-300">
                                    {bankTxs.length > 0
                                        ? `최근 거래: ${bankTxs[0].bankName}${bankTxs[0].accountAlias ? ` · ${bankTxs[0].accountAlias}` : ''} · ${bankTxs[0].date}`
                                        : '등록된 거래 없음'}
                                </p>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
                                <i className="fa-solid fa-piggy-bank text-xl"></i>
                            </div>
                        </div>

                        {/* 입금 등록 폼 */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase block italic tracking-tight">입금 등록</label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* 은행명 */}
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">은행명 *</label>
                                    <input
                                        type="text"
                                        value={bankForm.bankName}
                                        onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))}
                                        placeholder="국민, 신한, 하나..."
                                        className="w-full bg-gray-50/80 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                                    />
                                </div>
                                {/* 계좌 별칭 */}
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">계좌 별칭</label>
                                    <input
                                        type="text"
                                        value={bankForm.accountAlias}
                                        onChange={e => setBankForm(f => ({ ...f, accountAlias: e.target.value }))}
                                        placeholder="운영, 정산..."
                                        className="w-full bg-gray-50/80 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* 입금액 */}
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">입금액 (₩) *</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-300">₩</span>
                                        <input
                                            type="number"
                                            value={bankForm.amount}
                                            onChange={e => setBankForm(f => ({ ...f, amount: e.target.value }))}
                                            placeholder="0"
                                            className="w-full bg-gray-50/80 border border-gray-100 rounded-2xl pl-8 pr-4 py-3 text-sm font-black font-mono outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                                        />
                                    </div>
                                </div>
                                {/* 입금 후 잔액 */}
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">입금 후 잔액 (₩)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-300">₩</span>
                                        <input
                                            type="number"
                                            value={bankForm.balance}
                                            onChange={e => setBankForm(f => ({ ...f, balance: e.target.value }))}
                                            placeholder={bankForm.amount ? String(latestBalance + Number(bankForm.amount)) : String(latestBalance)}
                                            className="w-full bg-gray-50/80 border border-gray-100 rounded-2xl pl-8 pr-4 py-3 text-sm font-black font-mono outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 적요 */}
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">적요 (메모)</label>
                                <input
                                    type="text"
                                    value={bankForm.description}
                                    onChange={e => setBankForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="현금 입금, 카드 정산, 이체..."
                                    className="w-full bg-gray-50/80 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                                />
                            </div>

                            <button
                                onClick={handleSaveDeposit}
                                disabled={!bankForm.bankName || !bankForm.amount || bankSaving}
                                className={`w-full py-4 rounded-[24px] font-black text-sm tracking-widest uppercase transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                                    bankSaved
                                        ? 'bg-emerald-500 text-white'
                                        : !bankForm.bankName || !bankForm.amount
                                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                        : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-200'
                                }`}
                            >
                                {bankSaving
                                    ? <><i className="fa-solid fa-circle-notch animate-spin" /> 저장 중...</>
                                    : bankSaved
                                    ? <><i className="fa-solid fa-check-double" /> 입금 등록 완료</>
                                    : <><i className="fa-solid fa-plus" /> 입금 등록</>
                                }
                            </button>
                        </div>
                    </div>

                    {/* Premium Cash Closing Matrix */}
                    <div className="bg-white p-6 md:p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8 relative overflow-hidden group/cash">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover/cash:scale-125 transition-transform duration-1000 group-hover:rotate-12 pointer-events-none">
                            <i className="fa-solid fa-vault text-8xl text-bee-black"></i>
                        </div>

                        <div className="space-y-1 relative">
                            <h3 className="text-lg font-black flex items-center gap-2 text-bee-black">
                                <i className="fa-solid fa-calculator text-bee-yellow"></i> 현금 시재 마감 <span className="text-gray-300 font-serif italic text-sm">Cash Closing</span>
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">전 지점 현장 입금액 및 실제 시재 대조 분석 🛡️</p>
                        </div>

                        {/* Detailed Cash Flow Ledger */}
                        <div className="bg-gray-50/50 rounded-[32px] border border-gray-100 overflow-hidden divide-y divide-gray-100 group/ledger">
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 relative bg-white">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase block italic tracking-tight">장부상 현금 (시스템)</label>
                                    <div className="font-black text-xl sm:text-2xl text-bee-black flex items-baseline gap-1 font-mono">
                                        <span className="text-sm opacity-30">₩</span>
                                        {(dailySettlementStats.revenueByMethod.cash + kioskStats.cash).toLocaleString()}
                                    </div>
                                    {kioskStats.cash > 0 ? (
                                        <p className="text-[8px] font-medium text-gray-300">
                                            예약 ₩{dailySettlementStats.revenueByMethod.cash.toLocaleString()} + 키오스크 현금 ₩{kioskStats.cash.toLocaleString()}
                                        </p>
                                    ) : (
                                        <p className="text-[8px] font-medium text-gray-300">정산 기준일 DB 합계</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-bee-black uppercase block italic tracking-tight">실물 시재 확인 (금고)</label>
                                    <div className="relative group/input flex items-baseline gap-1">
                                        <span className="text-sm font-black text-bee-yellow group-focus-within/input:animate-pulse">₩</span>
                                        <input
                                            type="number"
                                            value={cashClosing.actualCash || ''}
                                            onChange={e => setCashClosing({ ...cashClosing, actualCash: Number(e.target.value) })}
                                            placeholder="0"
                                            className="w-full bg-transparent p-0 font-black text-2xl border-none outline-none focus:text-bee-yellow transition-all font-mono"
                                        />
                                    </div>
                                    <div className="w-full h-0.5 bg-gray-100 group-focus-within/input:bg-bee-yellow transition-all duration-500"></div>
                                    <p className="text-[8px] font-bold text-gray-300 uppercase italic">금고 실사 금액 입력</p>
                                </div>
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-xl shadow-gray-200/50 rounded-2xl flex items-center justify-center border border-gray-100 text-[10px] font-black text-gray-300 group-hover/ledger:text-bee-yellow group-hover/ledger:border-bee-yellow/20 transition-all duration-500">VS</div>
                            </div>

                            <div className={`p-6 flex justify-between items-center transition-all duration-700 ${(dailySettlementStats.revenueByMethod.cash + kioskStats.cash) - (cashClosing.actualCash || 0) === 0
                                ? 'bg-emerald-50/50'
                                : 'bg-orange-50/50'
                                }`}>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 items-center flex gap-2">
                                        마감 차액 분석
                                        {(dailySettlementStats.revenueByMethod.cash + kioskStats.cash) - (cashClosing.actualCash || 0) === 0 && (
                                            <span className="text-[8px] px-2 py-0.5 bg-emerald-500 text-white rounded-full animate-bounce">일치함</span>
                                        )}
                                    </span>
                                    <span className={`text-xl sm:text-3xl font-black italic font-mono tracking-tighter ${(dailySettlementStats.revenueByMethod.cash + kioskStats.cash) - (cashClosing.actualCash || 0) !== 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                                        ₩{((dailySettlementStats.revenueByMethod.cash + kioskStats.cash) - (cashClosing.actualCash || 0)).toLocaleString()}
                                    </span>
                                </div>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${(dailySettlementStats.revenueByMethod.cash + kioskStats.cash) - (cashClosing.actualCash || 0) === 0
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-orange-500 text-white animate-pulse shadow-lg shadow-orange-200'
                                    }`}>
                                    <i className={`fa-solid ${(dailySettlementStats.revenueByMethod.cash + kioskStats.cash) - (cashClosing.actualCash || 0) === 0 ? 'fa-check-double' : 'fa-triangle-exclamation'} text-xl`}></i>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase block ml-1 italic">Audit Notes & Observations</label>
                            <textarea
                                value={cashClosing.notes}
                                onChange={e => setCashClosing({ ...cashClosing, notes: e.target.value })}
                                className="w-full bg-gray-50/50 p-5 rounded-[24px] font-bold border border-gray-100 text-xs outline-none h-24 resize-none focus:bg-white focus:border-bee-yellow focus:ring-4 focus:ring-bee-yellow/5 transition-all"
                                placeholder="정산 차액 발생 시 구체적인 사유를 기록해 주세요..."
                            />
                        </div>

                        {/* 일마감 체크리스트 */}
                        <div className="bg-gray-50/50 rounded-[28px] border border-gray-100 p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <i className="fa-solid fa-list-check text-bee-yellow"></i> 일마감 체크리스트
                                </span>
                                {allChecked && (
                                    <span className="text-[8px] px-2 py-0.5 bg-emerald-500 text-white font-black rounded-full">마감 준비 완료</span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {CLOSE_CHECKLIST.map(item => {
                                    const checked = checkedItems.has(item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setCheckedItems(prev => {
                                                const next = new Set(prev);
                                                checked ? next.delete(item.id) : next.add(item.id);
                                                return next;
                                            })}
                                            className={`flex items-center gap-2 p-3 rounded-[16px] border text-left transition-all ${checked ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'bg-emerald-500' : 'bg-gray-100'}`}>
                                                <i className={`fa-solid ${checked ? 'fa-check' : item.icon} text-[8px] ${checked ? 'text-white' : 'text-gray-300'}`}></i>
                                            </div>
                                            <span className="text-[10px] font-black">{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            onClick={handleCashClose}
                            disabled={!allChecked}
                            className={`group relative w-full py-6 font-black rounded-[32px] overflow-hidden shadow-2xl transition-all ${allChecked ? 'bg-bee-black text-white hover:translate-y-[-2px] active:translate-y-[1px]' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                        >
                            {allChecked && <div className="absolute inset-0 bg-gradient-to-r from-bee-yellow to-amber-400 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>}
                            <span className="relative z-10 group-hover:text-bee-black transition-colors flex items-center justify-center gap-3 tracking-widest uppercase text-xs">
                                <i className="fa-solid fa-file-signature text-sm"></i> 최종 정산 원장 마감 및 승인
                            </span>
                        </button>
                    </div>
            </div>

            {/* 익일 정산 원장 - 전체 너비 */}
            <div className="bg-white p-6 md:p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-lg font-black flex items-center gap-2 text-bee-black">
                            <i className="fa-solid fa-receipt text-bee-yellow"></i> 익일 정산 원장 <span className="text-gray-300 font-serif italic text-sm">Settlement Ledger</span>
                        </h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">발생 매출 및 지점별 정산 배분 상세 내역 📝</p>
                    </div>
                    <span className="px-2 py-1 bg-gray-50 text-[9px] font-black text-gray-400 rounded-lg border border-gray-100 uppercase italic">Auto-Calculated</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-50">
                            <tr>
                                <th className="px-6 py-4">상태 / ID</th>
                                <th className="px-6 py-4">고객 / 경로</th>
                                <th className="px-6 py-4 text-right">총 금액</th>
                                <th className="px-6 py-4 text-right text-orange-400">지점 정산액</th>
                                <th className="px-6 py-4 text-right text-emerald-500">본사 수익</th>
                                <th className="px-6 py-4 text-center">정산 상태</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {bookings.filter(b => b.pickupDate === revenueEndDate && !b.isDeleted).map(b => {
                                const amount = b.settlementHardCopyAmount ?? b.finalPrice ?? 0;
                                const partnerPayout = b.branchSettlementAmount || 0;
                                const hqProfit = amount - partnerPayout;
                                const isCancelled = b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REFUNDED;
                                return (
                                    <tr key={b.id} className={`hover:bg-gray-50/50 transition-all group/row cursor-pointer ${isCancelled ? 'bg-gray-50/80 opacity-60' : ''}`} onClick={() => setSelectedBooking(b)}>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1.5">
                                                <span className={`w-fit px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${isCancelled ? 'bg-red-50 text-red-400 border border-red-100' : b.status === BookingStatus.COMPLETED ? 'bg-bee-black text-bee-yellow' : 'bg-gray-100 text-gray-400'}`}>
                                                    {b.status}
                                                </span>
                                                <span className={`text-[9px] font-black font-mono tracking-tighter ${isCancelled ? 'line-through text-gray-300' : 'text-gray-300'}`}>
                                                    #{b.reservationCode || b.id?.slice(0, 8).toUpperCase()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-black transition-colors ${isCancelled ? 'text-gray-400 line-through' : 'text-bee-black group-hover/row:text-bee-yellow'}`}>{b.userName}</span>
                                                <div className="flex items-center gap-1.5 mt-1 text-[9px] font-bold text-gray-400">
                                                    <i className={`fa-solid ${b.serviceType === 'DELIVERY' ? 'fa-truck' : 'fa-warehouse'} opacity-50`}></i>
                                                    <span className="truncate max-w-[120px]">{b.pickupLocation}</span>
                                                    {b.serviceType === 'DELIVERY' && (
                                                        <>
                                                            <i className="fa-solid fa-arrow-right text-[7px] text-gray-200"></i>
                                                            <span className="truncate max-w-[120px]">{b.dropoffLocation}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-5 text-right font-black text-xs tabular-nums ${isCancelled ? 'text-gray-400 line-through' : 'text-bee-black'}`}>
                                            ₩{amount.toLocaleString()}
                                        </td>
                                        <td className={`px-6 py-5 text-right font-black text-xs tabular-nums ${isCancelled ? 'text-gray-300' : 'text-orange-500'}`}>
                                            {isCancelled ? '-' : `₩${partnerPayout.toLocaleString()}`}
                                        </td>
                                        <td className={`px-6 py-5 text-right font-black text-xs tabular-nums italic ${isCancelled ? 'text-gray-300' : 'text-emerald-600'}`}>
                                            {isCancelled ? '-' : `₩${hqProfit.toLocaleString()}`}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex justify-center">
                                                <div className={`text-[9px] font-black px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-1.5 transition-all ${isCancelled ? 'bg-white border-dashed border-gray-200 text-gray-300' : b.settlementStatus === 'CONFIRMED' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-gray-100 text-gray-300 group-hover/row:border-bee-yellow'}`}>
                                                    <i className={`fa-solid ${isCancelled ? 'fa-xmark' : b.settlementStatus === 'CONFIRMED' ? 'fa-circle-check' : 'fa-clock-rotate-left'} text-[10px]`}></i>
                                                    {isCancelled ? '제외됨' : b.settlementStatus === 'CONFIRMED' ? '확정' : '대기'}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {bookings.filter(b => b.pickupDate === revenueEndDate && !b.isDeleted).length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-gray-300">
                                        <div className="flex flex-col items-center gap-3">
                                            <i className="fa-solid fa-file-invoice text-3xl opacity-10"></i>
                                            <p className="text-[11px] font-black italic">해당 날짜에 접수된 정산 내역이 없습니다.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-50">
                    <h3 className="text-sm font-black flex items-center gap-2 text-bee-black">
                        <i className="fa-solid fa-percent text-purple-400"></i> 할인 코드 적용 리포트
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(dailySettlementStats.discountCodeCounts).length > 0 ? (
                            Object.entries(dailySettlementStats.discountCodeCounts).map(([code, count]: [string, any]) => (
                                <div key={code} className="flex items-center gap-3 pl-3 pr-4 py-2 bg-purple-50/50 rounded-2xl border border-purple-100 group hover:bg-purple-100 transition-all">
                                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-tighter">{code}</span>
                                    <div className="w-px h-3 bg-purple-200"></div>
                                    <span className="text-xs font-black text-purple-800 tabular-nums">{count}건</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-[10px] text-gray-300 font-bold italic py-2">No discount codes used today.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* 기타 지출 관리 */}
            <div className="bg-white p-6 md:p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-lg font-black flex items-center gap-2 text-bee-black">
                            <i className="fa-solid fa-money-bill-transfer text-orange-400"></i> 기타 지출 관리 <span className="text-gray-300 font-serif italic text-sm">Expenses</span>
                        </h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">지점별 소모품 및 운영 실비 내역 💸</p>
                    </div>
                    <div className="p-3 bg-gray-50/50 text-gray-300 rounded-2xl border border-gray-100/50">
                        <i className="fa-solid fa-money-bill text-[10px]"></i>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                            type="text"
                            value={expForm.category}
                            onChange={e => setExpForm({ ...expForm, category: e.target.value })}
                            placeholder="카테고리"
                            className="bg-gray-50 p-4 rounded-2xl border border-transparent font-black text-xs outline-none focus:bg-white focus:border-orange-100 transition-all"
                        />
                        <input
                            type="number"
                            placeholder="금액(₩)"
                            value={expForm.amount === 0 ? '' : expForm.amount}
                            onChange={e => setExpForm({ ...expForm, amount: Number(e.target.value) })}
                            className="bg-gray-50 p-4 rounded-2xl border border-transparent font-black text-xs outline-none focus:bg-white focus:border-orange-100 transition-all text-orange-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={expForm.description}
                            onChange={e => setExpForm({ ...expForm, description: e.target.value })}
                            placeholder="지출 상세 내역 입력..."
                            className="flex-1 bg-gray-50 p-4 rounded-2xl border border-transparent font-black text-xs outline-none focus:bg-white focus:border-orange-100 transition-all"
                        />
                        <button
                            onClick={handleSaveExpenditure}
                            className="px-5 sm:px-6 bg-orange-50 text-orange-500 font-black rounded-2xl hover:bg-orange-500 hover:text-white transition-all shadow-sm border border-orange-100 whitespace-nowrap"
                        >
                            추가
                        </button>
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-50">
                    {expenditures.filter(e => e.date === revenueEndDate).map(e => (
                        <div key={e.id} className="group/exp p-4 bg-gray-50/50 border border-gray-100 rounded-3xl hover:bg-white hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover/exp:text-orange-400 group-hover/exp:border-orange-100 transition-all">
                                        <i className="fa-solid fa-receipt text-xs"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{e.category}</span>
                                        <span className="text-sm font-black text-bee-black mt-0.5">{e.description}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-black text-orange-500 tabular-nums">-₩{e.amount?.toLocaleString()}</span>
                                    <button onClick={() => deleteExpenditure(e.id!)} className="text-[8px] font-black text-gray-300 hover:text-red-500 uppercase mt-1 transition-colors opacity-0 group-hover/exp:opacity-100">
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {expenditures.filter(e => e.date === revenueEndDate).length === 0 && (
                        <div className="py-10 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-50 rounded-[32px]">
                            <i className="fa-solid fa-face-smile text-xl mb-2 opacity-20"></i>
                            <p className="text-[10px] font-black italic">해당 날짜에 등록된 기타 지출 내역이 없습니다. ✨</p>
                        </div>
                    )}
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black flex items-center gap-2"><i className="fa-solid fa-history text-gray-400"></i> 최근 정산 마감 이력</h3>
                    <button onClick={clearClosingHistory} className="px-4 py-2 bg-gray-50 text-[10px] font-black text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all uppercase tracking-widest">Clear History</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">기준 날짜</th>
                                <th className="px-6 py-4">총 매출액</th>
                                <th className="px-6 py-4">실제 보유 시재</th>
                                <th className="px-6 py-4">정산 차액</th>
                                <th className="px-6 py-4">마감 실행자</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {closings.slice(0, 10).map(c => (
                                <tr key={c.id} className="text-xs hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4 font-black text-gray-700">{c.date}</td>
                                    <td className="px-6 py-4 font-black text-bee-black">₩{c.totalRevenue.toLocaleString()}</td>
                                    <td className="px-6 py-4 font-black text-bee-black">₩{c.actualCashOnHand.toLocaleString()}</td>
                                    <td className={`px-6 py-4 font-black ${c.difference !== 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        <span className="flex items-center gap-1">
                                            {c.difference !== 0 && <i className="fa-solid fa-circle-exclamation text-[8px]"></i>}
                                            ₩{c.difference.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-black text-gray-400">
                                                {c.closedBy?.slice(0, 1).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-gray-500">{c.closedBy}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {closings.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-gray-300">
                                        <i className="fa-solid fa-box-open text-2xl mb-2 opacity-10"></i>
                                        <p className="text-[10px] font-black italic">기존 정산 마감 이력이 없습니다.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default DailySettlementTab;
