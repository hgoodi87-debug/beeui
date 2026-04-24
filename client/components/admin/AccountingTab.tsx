import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BookingState, Expenditure, CashClosing, AdminTab, BankTransaction, BankTxType, LocationOption } from '../../types';
import { StorageService } from '../../services/storageService';
import { motion, AnimatePresence } from 'framer-motion';
import { exportKoreanAccountingXLSX } from '../../utils/accountingExport';
import { exportPaymentMethodWordDoc } from '../../utils/wordExport';
import { loadAllLogsForRange, KioskStorageLog } from '../../services/kioskDb';
import { useBankTransactions, useBankTransactionsMutations } from '../../src/domains/admin/hooks/useBankTransactions';
import { ServiceType } from '../../src/domains/shared/types';


interface AccountingTabProps {
    revenueStartDate: string;
    setRevenueStartDate: (d: string) => void;
    revenueEndDate: string;
    setRevenueEndDate: (d: string) => void;
    handleExportCSV: () => void;
    revenueStats: any;
    accountingDailyStats: any[];
    accountingMonthlyStats: any[];
    setSelectedDetailDate: (d: string) => void;
    expForm: any;
    setExpForm: (f: any) => void;
    handleSaveExpenditure: () => void;
    expenditures: Expenditure[];
    deleteExpenditure: (id: string) => void;
    bookings: BookingState[];
    allBookings?: BookingState[];
    locations: LocationOption[];
    onExpenditureSaved?: (exp: Expenditure) => void;
    t: any;
}

type SubTab = 'revenue' | 'expenditure' | 'calendar' | 'kiosk' | 'bank' | 'branch';

const AccountingTab: React.FC<AccountingTabProps> = ({
    revenueStartDate,
    setRevenueStartDate,
    revenueEndDate,
    setRevenueEndDate,
    handleExportCSV,
    revenueStats,
    accountingDailyStats,
    accountingMonthlyStats,
    setSelectedDetailDate,
    expForm,
    setExpForm,
    handleSaveExpenditure,
    expenditures,
    deleteExpenditure,
    bookings,
    allBookings,
    locations,
    onExpenditureSaved,
    t
}) => {
    const [activeSubTab, setActiveSubTab] = useState<SubTab>('revenue');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptUploading, setReceiptUploading] = useState(false);
    const receiptInputRef = useRef<HTMLInputElement>(null);

    const handleReceiptSelect = async (file: File) => {
        setReceiptFile(file);
        setReceiptUploading(true);
        try {
            const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const path = `receipts/${new Date().toISOString().slice(0, 10)}/${Date.now()}.${ext}`;
            const url = await StorageService.uploadFile(file, path);
            setExpForm({ ...expForm, receiptUrl: url });
        } catch (e) {
            console.error('[Receipt] upload failed', e);
            alert('영수증 업로드에 실패했습니다.');
            setReceiptFile(null);
        } finally {
            setReceiptUploading(false);
        }
    };

    // 통장 잔고 내역
    const { data: bankTxs = [], isLoading: bankLoading } = useBankTransactions({ enabled: activeSubTab === 'bank', startDate: revenueStartDate, endDate: revenueEndDate });
    const { save: saveBankTx, remove: deleteBankTx } = useBankTransactionsMutations();
    const [bankSaving, setBankSaving] = useState(false);
    const [bankToast, setBankToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const emptyBankForm: Omit<BankTransaction, 'id' | 'createdAt' | 'createdBy'> = {
        date: new Date().toISOString().slice(0, 10),
        bankName: '',
        accountAlias: '',
        txType: 'deposit' as BankTxType,
        amount: 0,
        balance: 0,
        description: '',
    };
    const [bankForm, setBankForm] = useState(emptyBankForm);

    const bankStats = useMemo(() => {
        const deposits = bankTxs.filter(t => t.txType === 'deposit').reduce((s, t) => s + t.amount, 0);
        const withdrawals = bankTxs.filter(t => t.txType === 'withdrawal').reduce((s, t) => s + t.amount, 0);
        const latestBalance = bankTxs.length > 0 ? bankTxs[0].balance : 0;
        return { deposits, withdrawals, latestBalance, count: bankTxs.length };
    }, [bankTxs]);

    const handleSaveBankTx = async () => {
        if (!bankForm.bankName || bankForm.amount <= 0) return;
        setBankSaving(true);
        try {
            await saveBankTx({
                ...bankForm,
                createdBy: 'admin',
                createdAt: new Date().toISOString(),
            });
            setBankForm(emptyBankForm);
            setBankToast({ msg: '저장 완료', type: 'success' });
            setTimeout(() => setBankToast(null), 3000);
        } catch (e) {
            console.error('[AccountingTab] saveBankTx failed:', e);
            setBankToast({ msg: `저장 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`, type: 'error' });
            setTimeout(() => setBankToast(null), 4000);
        } finally {
            setBankSaving(false);
        }
    };

    // 키오스크 정산 데이터
    const [kioskLogs, setKioskLogs] = useState<KioskStorageLog[]>([]);
    const [kioskLoading, setKioskLoading] = useState(false);

    useEffect(() => {
        setKioskLoading(true);
        (async () => {
            try {
                const logs = await loadAllLogsForRange(revenueStartDate, revenueEndDate);
                setKioskLogs(logs);
            } finally {
                setKioskLoading(false);
            }
        })();
    }, [revenueStartDate, revenueEndDate]);

    const kioskStats = useMemo(() => {
        // done=false는 짐 미반환(보관중)이지 미결제가 아님 — 날짜 기준으로 전체 집계
        const storingCount = kioskLogs.filter(l => !l.done).length;
        const gross = kioskLogs.reduce((s, l) => s + l.original_price, 0);
        const disc  = kioskLogs.reduce((s, l) => s + (l.discount ?? 0), 0);
        const net   = gross - disc;
        const dailyMap = new Map<string, { count: number; gross: number; disc: number; net: number }>();
        for (const l of kioskLogs) {
            const d = dailyMap.get(l.date) ?? { count: 0, gross: 0, disc: 0, net: 0 };
            d.count++;
            d.gross += l.original_price;
            d.disc  += l.discount ?? 0;
            d.net   += l.original_price - (l.discount ?? 0);
            dailyMap.set(l.date, d);
        }
        const daily = Array.from(dailyMap.entries())
            .map(([date, v]) => ({ date, ...v }))
            .sort((a, b) => b.date.localeCompare(a.date));
        return { count: kioskLogs.length, gross, disc, net, daily, storingCount };
    }, [kioskLogs]);

    // Calendar logic
    const calendarDays = useMemo(() => {
        const start = new Date(revenueStartDate);
        const end = new Date(revenueEndDate);
        const days = [];
        const curr = new Date(start);

        while (curr <= end) {
            days.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }
        return days;
    }, [revenueStartDate, revenueEndDate]);

    const getDailyTotal = (dateStr: string) => {
        const stat = accountingDailyStats.find(s => s.date === dateStr);
        return stat ? stat.total : 0;
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm overflow-hidden group">
                <div className="space-y-1 relative z-10">
                    <h1 className="text-xl md:text-2xl font-black tracking-tight">{t.admin?.sidebar?.accounting || '매출 결산'} <span className="text-bee-yellow italic">Accounting</span></h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">통합 기간 실적 분석 및 재무 통계 🛡️</p>
                </div>

                <div className="flex flex-col gap-3 relative z-10 w-full lg:w-auto">
                    {/* 날짜 + 내보내기 버튼 */}
                    <div className="flex flex-wrap items-center gap-2 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <input
                                type="date"
                                title="조회 시작일"
                                value={revenueStartDate}
                                onChange={e => setRevenueStartDate(e.target.value)}
                                className="bg-white px-3 py-1.5 rounded-xl font-black text-[10px] border border-gray-100 outline-none focus:border-bee-black transition-all flex-1 min-w-0"
                            />
                            <span className="text-gray-300 font-black text-[10px] shrink-0">~</span>
                            <input
                                type="date"
                                title="조회 종료일"
                                value={revenueEndDate}
                                onChange={e => setRevenueEndDate(e.target.value)}
                                className="bg-white px-3 py-1.5 rounded-xl font-black text-[10px] border border-gray-100 outline-none focus:border-bee-black transition-all flex-1 min-w-0"
                            />
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={handleExportCSV}
                                title="CSV 내보내기 (간편)"
                                className="w-8 h-8 bg-gray-100 text-gray-500 rounded-xl text-[10px] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-sm"
                            >
                                <i className="fa-solid fa-file-csv"></i>
                            </button>
                            <button
                                onClick={() => exportKoreanAccountingXLSX({
                                    revenueStats,
                                    accountingDailyStats,
                                    accountingMonthlyStats,
                                    expenditures,
                                    startDate: revenueStartDate,
                                    endDate: revenueEndDate,
                                })}
                                title="한국 회계처리 양식 XLSX 다운로드"
                                className="flex items-center gap-1.5 px-3 py-2 bg-bee-black text-bee-yellow rounded-xl text-[10px] font-black hover:scale-105 active:scale-95 transition-all shadow-md shadow-black/10 whitespace-nowrap"
                            >
                                <i className="fa-solid fa-file-spreadsheet"></i>
                                <span className="hidden sm:inline">회계장부 XLSX</span>
                                <span className="sm:hidden">XLSX</span>
                            </button>
                            <button
                                onClick={() => exportPaymentMethodWordDoc({
                                    bookings,
                                    startDate: revenueStartDate,
                                    endDate: revenueEndDate,
                                })}
                                title="일자별 결제수단 현황 Word 문서 다운로드"
                                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black hover:scale-105 active:scale-95 transition-all shadow-md shadow-blue-600/20 whitespace-nowrap"
                            >
                                <i className="fa-solid fa-file-word"></i>
                                <span className="hidden sm:inline">결제수단별 Word</span>
                                <span className="sm:hidden">Word</span>
                            </button>
                        </div>
                    </div>

                    {/* 서브탭 — 모바일에서 가로 스크롤 */}
                    <div className="overflow-x-auto no-scrollbar">
                        <div className="flex bg-gray-50/80 p-1 rounded-2xl border border-gray-100 w-max min-w-full">
                            <button
                                onClick={() => setActiveSubTab('revenue')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-tight transition-all whitespace-nowrap ${activeSubTab === 'revenue' ? 'bg-bee-black text-white shadow-lg' : 'text-gray-400 hover:text-bee-black'}`}
                            >
                                매출 요약
                            </button>
                            <button
                                onClick={() => setActiveSubTab('expenditure')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-tight transition-all whitespace-nowrap ${activeSubTab === 'expenditure' ? 'bg-bee-black text-white shadow-lg' : 'text-gray-400 hover:text-bee-black'}`}
                            >
                                지출 내역
                            </button>
                            <button
                                onClick={() => setActiveSubTab('calendar')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-tight transition-all whitespace-nowrap ${activeSubTab === 'calendar' ? 'bg-bee-black text-white shadow-lg' : 'text-gray-400 hover:text-bee-black'}`}
                            >
                                매출 캘린더
                            </button>
                            <button
                                onClick={() => setActiveSubTab('kiosk')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-tight transition-all whitespace-nowrap relative ${activeSubTab === 'kiosk' ? 'bg-bee-yellow text-bee-black shadow-lg' : 'text-gray-400 hover:text-bee-black'}`}
                            >
                                🐝 키오스크 정산
                                {kioskStats.storingCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                                        {kioskStats.storingCount}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveSubTab('bank')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-tight transition-all whitespace-nowrap ${activeSubTab === 'bank' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-bee-black'}`}
                            >
                                🏦 통장 잔고
                            </button>
                            <button
                                onClick={() => setActiveSubTab('branch')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-tight transition-all whitespace-nowrap ${activeSubTab === 'branch' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-bee-black'}`}
                            >
                                🏪 지점 정산
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Summary Grid — 매출 요약 탭에서만 노출 */}
            {activeSubTab === 'revenue' && <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 총 매출 */}
                <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between hover:border-bee-yellow transition-all">
                    <div>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1.5 line-clamp-1">총 매출 (선택 기간)</p>
                        <h3 className="text-xl font-black italic text-bee-black">₩{(revenueStats?.total || 0).toLocaleString()}</h3>
                    </div>
                    <div className="mt-3">
                        <span className="px-2 py-0.5 bg-bee-yellow/10 rounded-md text-[8px] font-black text-bee-yellow tracking-tighter">{(revenueStats?.count || 0)}건의 주문</span>
                    </div>
                </div>

                {/* 고정비 */}
                <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between hover:border-emerald-400 transition-all">
                    <div>
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 line-clamp-1">고정비</p>
                        <h3 className="text-xl font-black italic text-emerald-600">₩{(revenueStats?.fixedExpenditure || 0).toLocaleString()}</h3>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-50 space-y-0.5">
                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">월급 · 임대료 · 서버 · 구독료</p>
                        <div className="w-full bg-gray-50 h-1 rounded-full overflow-hidden" title="총 지출 대비 고정비 비중">
                            <motion.div
                                className="bg-emerald-400 h-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(((revenueStats?.fixedExpenditure || 0) / (revenueStats?.expenditure || 1)) * 100, 100)}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                </div>

                {/* 유동비 */}
                <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between hover:border-amber-400 transition-all">
                    <div>
                        <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1.5 line-clamp-1">유동비</p>
                        <h3 className="text-xl font-black italic text-amber-600">₩{(revenueStats?.variableExpenditure || 0).toLocaleString()}</h3>
                    </div>
                    <div className="mt-4">
                        <div className="w-full bg-gray-50 h-1 rounded-full overflow-hidden" title="매출 대비 유동비 비중">
                            <motion.div
                                className="bg-amber-400 h-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(((revenueStats?.variableExpenditure || 0) / (revenueStats?.total || 1)) * 100, 100)}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                </div>

                {/* 순수익 */}
                <div className="bg-bee-black p-5 rounded-[28px] shadow-lg flex flex-col justify-between relative overflow-hidden group/card hover:-translate-y-1 transition-all">
                    <div className="absolute top-0 right-0 p-3 opacity-10 text-bee-yellow group-hover/card:rotate-12 transition-transform">
                        <i className="fa-solid fa-chart-line text-2xl"></i>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">선택 기간 순수익</p>
                        <h3 className="text-xl font-black italic text-bee-yellow">₩{(revenueStats?.netTotal || 0).toLocaleString()}</h3>
                    </div>
                    <p className="text-[8px] font-black text-emerald-400 mt-2 uppercase">마진율: {Math.round(((revenueStats?.netTotal || 0) / (revenueStats?.total || 1)) * 100)}%</p>
                </div>

                {/* 부가세 */}
                <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between hover:border-blue-400 transition-all">
                    <div>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1.5">부가세 별도 (예상)</p>
                        <h3 className="text-xl font-black italic text-blue-500">₩{(revenueStats?.vat || 0).toLocaleString()}</h3>
                    </div>
                    <p className="text-[8px] font-black text-gray-300 mt-2 uppercase tracking-tighter">약 1/11 산출 기준</p>
                </div>

                {/* 당월 누적매출 */}
                <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between hover:border-purple-400 transition-all col-span-2 md:col-span-1 lg:col-span-1">
                    <div>
                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1.5 line-clamp-1">당월 누적매출</p>
                        <h3 className="text-xl font-black italic text-bee-black">₩{((revenueStats?.mtdRevenue || 0) + kioskStats.net).toLocaleString()}</h3>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-50 space-y-0.5">
                        <p className="text-[8px] font-black text-gray-300 uppercase">선택 기간 기준 당월 실적</p>
                        <p className="text-[8px] font-black text-bee-yellow uppercase">🐝 키오스크 +₩{kioskStats.net.toLocaleString()} 포함</p>
                    </div>
                </div>
            </div>}

            {/* 🐝 키오스크 정산 요약 — 매출 요약 탭에서만 노출 */}
            {activeSubTab === 'revenue' && <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black flex items-center gap-2 text-bee-black">
                        <span className="w-6 h-6 bg-bee-yellow rounded-lg flex items-center justify-center text-[10px]">🐝</span>
                        키오스크 정산 <span className="text-gray-300 font-serif italic text-xs">Kiosk Settlement</span>
                    </h3>
                    {kioskLoading && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 border-2 border-bee-yellow border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">불러오는 중</span>
                        </div>
                    )}
                </div>
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
            </div>}

            {/* Payment Method Matrix — 매출 요약 탭에서만 노출 */}
            {activeSubTab === 'revenue' && <div className="bg-white p-5 md:p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <i className="fa-solid fa-credit-card text-bee-blue"></i> 결제 수단별 매출 분석
                    </h4>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-100 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {[
                        { label: t.admin?.accounting?.methods?.card || '카드결제', amount: revenueStats?.card || 0, icon: 'fa-credit-card', color: 'gray' },
                        { label: t.admin?.accounting?.methods?.cash || '현금 결제', amount: revenueStats?.cash || 0, icon: 'fa-money-bill-wave', color: 'emerald' },
                        { label: t.admin?.accounting?.methods?.naver || '네이버페이', amount: revenueStats?.naver || 0, icon: 'fa-n', color: 'green' },
                        { label: t.admin?.accounting?.methods?.kakao || '카카오페이', amount: revenueStats?.kakao || 0, icon: 'fa-comment', color: 'yellow' },
                        { label: t.admin?.accounting?.methods?.apple || '애플페이', amount: revenueStats?.apple || 0, icon: 'fa-apple-pay', color: 'black' },
                        { label: t.admin?.accounting?.methods?.samsung || '삼성페이', amount: revenueStats?.samsung || 0, icon: 'fa-mobile-screen', color: 'blue' },
                        { label: t.admin?.accounting?.methods?.paypal || '페이팔', amount: revenueStats?.paypal || 0, icon: 'fa-paypal', color: 'indigo' },
                        { label: t.admin?.accounting?.methods?.overseas || '해외결제', amount: (revenueStats?.alipay || 0) + (revenueStats?.wechat || 0), icon: 'fa-globe', color: 'violet' }
                    ].map((m, idx) => (
                        <motion.div 
                            key={m.label} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-gray-50/50 p-4 rounded-[24px] border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-md transition-all group/method"
                        >
                            <div className="flex flex-col items-center text-center space-y-2">
                                <div className={`w-8 h-8 rounded-xl bg-${m.color}-50 flex items-center justify-center text-[10px] group-hover/method:scale-110 transition-transform`}>
                                    <i className={`fa-solid ${m.icon} ${m.amount > 0 ? `text-${m.color}-500` : 'text-gray-300'}`}></i>
                                </div>
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">{m.label}</span>
                                <span className={`text-[11px] font-black font-mono ${m.amount > 0 ? 'text-bee-black' : 'text-gray-200'}`}>
                                    ₩{m.amount.toLocaleString()}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>}

            {/* SubTab Content */}
            <div className="animate-fade-in">
                {activeSubTab === 'revenue' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                        <div className="bg-white p-6 md:p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black flex items-center gap-2"><i className="fa-solid fa-chart-line text-blue-500"></i> 일별 상세 매출</h3>
                                <span className="text-[10px] font-black text-gray-300 uppercase">{accountingDailyStats.length} 건 기록됨</span>
                            </div>
                            <div className="overflow-hidden rounded-[32px] border border-gray-50">
                                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-gray-50 text-[10px] font-black uppercase text-gray-400 z-10">
                                            <tr>
                                                <th className="px-6 py-4">날짜</th>
                                                <th className="px-6 py-4">건수</th>
                                                <th className="px-6 py-4 text-right">매출액</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {accountingDailyStats.map(s => (
                                                <tr
                                                    key={s.date}
                                                    onClick={() => setSelectedDetailDate(s.date)}
                                                    className="hover:bg-blue-50/20 cursor-pointer transition-colors group"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-4 rounded-full bg-blue-100 group-hover:bg-blue-400 transition-colors"></div>
                                                            <span className="font-black text-xs text-gray-700">{s.date}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-gray-400 text-xs">{s.count} 건</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="font-black text-xs text-bee-black">₩{s.total.toLocaleString()}</span>
                                                        <p className="text-[9px] font-bold text-blue-300 mt-1">Cum. ₩{s.cumulative.toLocaleString()}</p>
                                                    </td>
                                                </tr>
                                            ))}
                                            {accountingDailyStats.length === 0 && (
                                                <tr><td colSpan={3} className="px-6 py-20 text-center text-gray-300 font-black italic">해당 기간의 매출 기록이 없습니다.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 md:p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black flex items-center gap-2"><i className="fa-solid fa-calendar-check text-purple-500"></i> 월간 정산 요약</h3>
                            </div>
                            <div className="overflow-hidden rounded-[32px] border border-gray-50">
                                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="bg-bee-black text-[10px] font-black uppercase text-bee-yellow">
                                            <tr>
                                                <th className="px-6 py-5">정산월</th>
                                                <th className="px-6 py-5">주문량</th>
                                                <th className="px-6 py-5 text-right">매출액</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 text-xs">
                                            {accountingMonthlyStats.map(s => (
                                                <tr key={s.month} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-5 font-black text-gray-800">{s.month}</td>
                                                    <td className="px-6 py-5 font-bold text-gray-400">{s.count} 건</td>
                                                    <td className="px-6 py-5 text-right">
                                                        <span className="font-black text-bee-black text-sm">₩{s.total.toLocaleString()}</span>
                                                        <p className="text-[9px] font-bold text-bee-blue mt-0.5">누적 ₩{s.cumulative.toLocaleString()}</p>
                                                    </td>
                                                </tr>
                                            ))}
                                            {accountingMonthlyStats.length === 0 && (
                                                <tr><td colSpan={3} className="px-6 py-20 text-center text-gray-300 font-black italic">월간 정산 데이터가 없습니다.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeSubTab === 'expenditure' && (
                    <div className="bg-white p-6 md:p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8 max-w-4xl mx-auto">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black flex items-center gap-2">
                                <i className="fa-solid fa-receipt text-red-400"></i> 지출 항목 관리
                            </h3>
                            <span className="text-[10px] font-black text-gray-300 uppercase">총 지출 항목: {expenditures.length} 건</span>
                        </div>

                        <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-50 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block">지출 발생일</label>
                                    <input
                                        type="date"
                                        title="지출 발생일"
                                        value={expForm.date}
                                        onChange={e => setExpForm({ ...expForm, date: e.target.value })}
                                        className="w-full bg-white p-4 rounded-2xl border border-transparent font-black text-xs outline-none focus:border-red-200 transition-all shadow-sm"
                                    />
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block">카테고리</label>
                                    <input
                                        type="text"
                                        list="expense-category-list"
                                        value={expForm.category}
                                        onChange={e => setExpForm({ ...expForm, category: e.target.value })}
                                        placeholder="카테고리 선택 또는 직접 입력"
                                        className="w-full bg-white p-4 rounded-2xl border border-transparent font-black text-xs outline-none focus:border-red-200 transition-all shadow-sm"
                                    />
                                    <datalist id="expense-category-list">
                                        <option value="식대" />
                                        <option value="소모품비" />
                                        <option value="파트너십 운송비" />
                                        <option value="유류비" />
                                        <option value="교통비" />
                                        <option value="임차료" />
                                        <option value="광고비" />
                                        <option value="마케팅" />
                                        <option value="수수료" />
                                        <option value="플랫폼" />
                                        <option value="급여" />
                                        <option value="인건비" />
                                        <option value="보험" />
                                        <option value="통신비" />
                                        <option value="수리" />
                                        <option value="기타" />
                                    </datalist>
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block">금액 (₩)</label>
                                    <input
                                        type="number"
                                        value={expForm.amount}
                                        onChange={e => setExpForm({ ...expForm, amount: Number(e.target.value) })}
                                        placeholder="0"
                                        className="w-full bg-white p-4 rounded-2xl border border-transparent font-black text-xs outline-none focus:border-red-200 transition-all shadow-sm text-red-500"
                                    />
                                </div>
                            </div>
                            {/* 비용구분 / 결제구분 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block">비용 구분</label>
                                    <div className="flex gap-2">
                                        {[
                                            { value: 'fixed',    label: '고정비', icon: 'fa-lock', color: 'emerald' },
                                            { value: 'variable', label: '유동비', icon: 'fa-wave-square', color: 'amber' },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setExpForm({ ...expForm, costType: opt.value as any })}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-black transition-all border-2 ${expForm.costType === opt.value ? `border-${opt.color}-400 bg-${opt.color}-50 text-${opt.color}-600 shadow-sm` : 'border-transparent bg-white text-gray-400 hover:border-gray-200'}`}
                                            >
                                                <i className={`fa-solid ${opt.icon} text-[10px]`}></i>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-gray-300 ml-1">미선택 시 계정과목으로 자동 판단</p>
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block">결제 구분</label>
                                    <div className="flex gap-2">
                                        {[
                                            { value: 'corporate_card', label: '법인카드', icon: 'fa-credit-card', color: 'blue' },
                                            { value: 'personal',       label: '개인비용', icon: 'fa-user-wallet', color: 'orange' },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setExpForm({ ...expForm, paymentType: opt.value as any })}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-black transition-all border-2 ${expForm.paymentType === opt.value ? `border-${opt.color}-400 bg-${opt.color}-50 text-${opt.color}-600 shadow-sm` : 'border-transparent bg-white text-gray-400 hover:border-gray-200'}`}
                                            >
                                                <i className={`fa-solid ${opt.icon} text-[10px]`}></i>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block">지출 상세 내역</label>
                                <input
                                    type="text"
                                    value={expForm.description}
                                    onChange={e => setExpForm({ ...expForm, description: e.target.value })}
                                    placeholder="상세 지출 내용을 입력하세요..."
                                    className="w-full bg-white p-4 rounded-2xl border border-transparent font-black text-xs outline-none focus:border-red-200 transition-all shadow-sm"
                                />
                            </div>
                            {/* 영수증 업로드 */}
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block">영수증 첨부</label>
                                <input
                                    ref={receiptInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                                    className="hidden"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleReceiptSelect(f); }}
                                />
                                <button
                                    type="button"
                                    onClick={() => receiptInputRef.current?.click()}
                                    disabled={receiptUploading}
                                    className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed text-xs font-black transition-all ${
                                        expForm.receiptUrl
                                            ? 'border-green-300 bg-green-50 text-green-700'
                                            : 'border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:text-red-400'
                                    }`}
                                >
                                    {receiptUploading ? (
                                        <><i className="fa-solid fa-spinner fa-spin text-red-400"></i> 업로드 중...</>
                                    ) : expForm.receiptUrl ? (
                                        <>
                                            <i className="fa-solid fa-circle-check text-green-500"></i>
                                            <span className="truncate max-w-[200px]">{receiptFile?.name || '영수증 첨부됨'}</span>
                                            <a href={expForm.receiptUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="ml-auto text-green-600 hover:underline shrink-0">보기</a>
                                        </>
                                    ) : (
                                        <><i className="fa-solid fa-paperclip"></i> 영수증 파일 첨부 (JPG · PNG · PDF)</>
                                    )}
                                </button>
                                {expForm.receiptUrl && (
                                    <button type="button" onClick={() => { setReceiptFile(null); setExpForm({ ...expForm, receiptUrl: '' }); }} className="text-[9px] text-gray-300 hover:text-red-400 ml-1 font-black transition-colors">
                                        첨부 취소
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={handleSaveExpenditure}
                                className="w-full py-5 bg-red-400 text-white font-black rounded-[24px] hover:bg-red-500 transition-all shadow-xl shadow-red-100 hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <i className="fa-solid fa-plus-circle"></i> 지출 내역 신규 등록
                            </button>
                        </div>

                        <div className="overflow-hidden rounded-[32px] border border-gray-50">
                            <div className="overflow-x-auto">
                            <table className="w-full min-w-[480px] text-left">
                                <thead className="bg-gray-100 text-[10px] font-black uppercase text-gray-400">
                                    <tr>
                                        <th className="px-6 py-4">일자</th>
                                        <th className="px-6 py-4">항목</th>
                                        <th className="px-6 py-4">구분</th>
                                        <th className="px-6 py-4 text-right">금액</th>
                                        <th className="px-6 py-4 text-center">영수증</th>
                                        <th className="px-6 py-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {expenditures.map(e => {
                                        const costLabel = e.costType === 'fixed' ? '고정비' : e.costType === 'variable' ? '유동비' : null;
                                        const payLabel  = e.paymentType === 'corporate_card' ? '법카' : e.paymentType === 'personal' ? '개인' : null;
                                        return (
                                        <tr key={e.id} className="hover:bg-red-50/20 transition-colors group">
                                            <td className="px-6 py-4 font-black text-gray-500 text-xs">{e.date}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-xs text-bee-black">{e.category}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold">{e.description}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {costLabel && (
                                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${costLabel === '고정비' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                            {costLabel}
                                                        </span>
                                                    )}
                                                    {payLabel && (
                                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${payLabel === '법카' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                                                            {payLabel}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-red-500 text-xs">₩{e.amount?.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center">
                                                {e.receiptUrl ? (
                                                    <a href={e.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-50 text-green-500 hover:bg-green-100 transition-colors" title="영수증 보기">
                                                        <i className="fa-solid fa-receipt text-[10px]"></i>
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-200 text-[10px]">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => deleteExpenditure(e.id!)}
                                                    title="Delete"
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-200 hover:bg-red-100 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                                                </button>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                    {expenditures.length === 0 && (
                                        <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-300 font-black italic">표시할 지출 내역이 없습니다.</td></tr>
                                    )}
                                </tbody>
                            </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeSubTab === 'calendar' && (
                    <div className="bg-white p-6 md:p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-10">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black flex items-center gap-2"><i className="fa-solid fa-calendar-alt text-bee-yellow"></i> 캘린더 요약 보기</h3>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-bee-yellow"></div>
                                    <span className="text-[10px] font-black text-gray-400">고매출 구간</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-100"></div>
                                    <span className="text-[10px] font-black text-gray-400">일반 구간</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-6">
                            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                                <div key={day} className="text-center text-[11px] font-black text-gray-300 uppercase tracking-[0.2em] pb-6 border-b border-gray-50">{day}</div>
                            ))}
                            {calendarDays.map((day, idx) => {
                                const dateStr = day.toISOString().split('T')[0];
                                const total = getDailyTotal(dateStr);
                                const isSelected = revenueEndDate === dateStr;
                                
                                // Heatmap intensity (0 to 1)
                                const intensity = total > 0 ? Math.min(total / 3000000, 1) : 0;
                                const isHighRevenue = total >= 1500000;

                                return (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ y: -5, scale: 1.02 }}
                                        onClick={() => setSelectedDetailDate(dateStr)}
                                        className={`min-h-[120px] p-5 rounded-[32px] border-2 cursor-pointer transition-all relative overflow-hidden group/day ${
                                            isSelected 
                                                ? 'bg-bee-black border-bee-black shadow-2xl shadow-bee-black/30' 
                                                : 'bg-white border-gray-50 hover:border-bee-yellow/20 hover:shadow-xl'
                                        }`}
                                    >
                                        {/* Heatmap background effect */}
                                        {!isSelected && total > 0 && (
                                            <div 
                                                className="absolute inset-x-0 bottom-0 bg-bee-yellow/5" 
                                                style={{ 
                                                    height: `${intensity * 100}%`,
                                                    opacity: intensity * 0.5 + 0.1
                                                }}
                                            />
                                        )}

                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <span className={`text-xs font-black ${isSelected ? 'text-bee-yellow' : 'text-gray-300 group-hover/day:text-bee-black'}`}>
                                                {day.getDate()}
                                            </span>
                                            {isHighRevenue && (
                                                <div className="flex gap-0.5">
                                                    <div className="w-1 h-1 rounded-full bg-bee-yellow animate-ping"></div>
                                                    <div className="w-1 h-1 rounded-full bg-bee-yellow"></div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2 relative z-10">
                                            {total > 0 ? (
                                                <>
                                                    <p className={`text-xs font-black font-mono tracking-tighter leading-tight ${isSelected ? 'text-white' : 'text-bee-black'}`}>
                                                        ₩{total.toLocaleString()}
                                                    </p>
                                                    <div className="h-1 bg-gray-100/50 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            className={`h-full ${isSelected ? 'bg-bee-yellow' : 'bg-bee-yellow opacity-40'}`}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${intensity * 100}%` }}
                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="h-10 flex items-center justify-center opacity-[0.03] group-hover/day:opacity-[0.08] transition-opacity">
                                                    <i className="fa-solid fa-peace text-xl"></i>
                                                </div>
                                            )}
                                        </div>

                                        {isSelected && (
                                            <div className="absolute -bottom-2 -right-2 opacity-10">
                                                <i className="fa-solid fa-fingerprint text-4xl text-white"></i>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {activeSubTab === 'kiosk' && (
                    <div className="space-y-6">
                        {/* KPI 카드 4칸 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: '총 보관 건수',    val: `${kioskStats.count}건`,                        icon: 'fa-box',           color: 'text-amber-500',  bg: 'hover:border-amber-300' },
                                { label: '총 원가',         val: `₩${kioskStats.gross.toLocaleString()}`,        icon: 'fa-tag',           color: 'text-blue-500',   bg: 'hover:border-blue-300' },
                                { label: '순수익',          val: `₩${kioskStats.net.toLocaleString()}`,          icon: 'fa-won-sign',      color: 'text-emerald-500',bg: 'hover:border-emerald-300' },
                            ].map(card => (
                                <div key={card.label} className={`bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between transition-all ${card.bg}`}>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1.5">{card.label}</p>
                                        <h3 className={`text-xl font-black italic ${card.color}`}>{card.val}</h3>
                                    </div>
                                    <i className={`fa-solid ${card.icon} ${card.color} text-xs mt-3 opacity-50`}></i>
                                </div>
                            ))}
                        </div>

                        {/* 일별 정산 테이블 */}
                        <div className="bg-white p-6 md:p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black flex items-center gap-2">
                                    <i className="fa-solid fa-store text-amber-400"></i> 키오스크 일별 정산
                                </h3>
                                <span className="text-[10px] font-black text-gray-300 uppercase">{revenueStartDate} ~ {revenueEndDate}</span>
                            </div>

                            {kioskLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="w-8 h-8 border-4 border-bee-yellow border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-[32px] border border-gray-50">
                                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left">
                                            <thead className="sticky top-0 bg-bee-black text-[10px] font-black uppercase text-bee-yellow z-10">
                                                <tr>
                                                    <th className="px-6 py-4">날짜</th>
                                                    <th className="px-6 py-4 text-right">건수</th>
                                                    <th className="px-6 py-4 text-right">원가</th>
                                                    <th className="px-6 py-4 text-right">할인</th>
                                                    <th className="px-6 py-4 text-right">순수익</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 text-xs">
                                                {kioskStats.daily.map(d => (
                                                    <tr key={d.date} className="hover:bg-amber-50/30 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-1.5 h-4 rounded-full bg-amber-100 group-hover:bg-amber-400 transition-colors"></div>
                                                                <span className="font-black text-gray-700">{d.date}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-bold text-gray-400">{d.count}건</td>
                                                        <td className="px-6 py-4 text-right font-bold text-gray-500">₩{d.gross.toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-right font-bold text-red-400">{d.disc > 0 ? `-₩${d.disc.toLocaleString()}` : '—'}</td>
                                                        <td className="px-6 py-4 text-right font-black text-bee-black">₩{d.net.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                                {kioskStats.daily.length === 0 && (
                                                    <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-300 font-black italic">해당 기간의 키오스크 데이터가 없습니다.</td></tr>
                                                )}
                                                {kioskStats.daily.length > 0 && (
                                                    <tr className="bg-gray-50 font-black">
                                                        <td className="px-6 py-4 text-gray-500 uppercase text-[10px] tracking-widest">합계</td>
                                                        <td className="px-6 py-4 text-right text-gray-700">{kioskStats.count}건</td>
                                                        <td className="px-6 py-4 text-right text-gray-700">₩{kioskStats.gross.toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-right text-red-500">{kioskStats.disc > 0 ? `-₩${kioskStats.disc.toLocaleString()}` : '—'}</td>
                                                        <td className="px-6 py-4 text-right text-emerald-600 text-sm">₩{kioskStats.net.toLocaleString()}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 🏦 통장 잔고 내역 */}
                {activeSubTab === 'bank' && (
                    <div className="space-y-6">
                        {/* 요약 카드 */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col gap-1">
                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">현재 잔액</p>
                                <p className="text-xl font-black italic text-blue-600">₩{bankStats.latestBalance.toLocaleString()}</p>
                                <p className="text-[8px] font-black text-gray-300 mt-1 uppercase">최근 기록 기준</p>
                            </div>
                            <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col gap-1">
                                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">총 입금</p>
                                <p className="text-xl font-black italic text-emerald-600">₩{bankStats.deposits.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col gap-1">
                                <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">총 출금</p>
                                <p className="text-xl font-black italic text-red-500">₩{bankStats.withdrawals.toLocaleString()}</p>
                            </div>
                            <div className="bg-bee-black p-5 rounded-[28px] flex flex-col gap-1">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">기록 건수</p>
                                <p className="text-xl font-black italic text-bee-yellow">{bankStats.count.toLocaleString()}<span className="text-xs text-gray-500 ml-1">건</span></p>
                            </div>
                        </div>

                        {/* 입력 폼 */}
                        <div className="bg-white p-6 md:p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                            <h3 className="text-lg font-black flex items-center gap-2">
                                <i className="fa-solid fa-plus text-blue-500"></i> 거래 내역 입력
                            </h3>
                            <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-50 space-y-5">
                                {/* 1행: 날짜 / 은행명 / 계좌별칭 */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block">거래일</label>
                                        <input
                                            type="date"
                                            title="거래일"
                                            value={bankForm.date}
                                            onChange={e => setBankForm(f => ({ ...f, date: e.target.value }))}
                                            className="w-full bg-white p-4 rounded-2xl border border-transparent font-black text-xs outline-none focus:border-blue-200 transition-all shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block">은행명</label>
                                        <input
                                            type="text"
                                            list="bank-name-list"
                                            value={bankForm.bankName}
                                            onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))}
                                            placeholder="국민, 신한, 우리…"
                                            className="w-full bg-white p-4 rounded-2xl border border-transparent font-black text-xs outline-none focus:border-blue-200 transition-all shadow-sm"
                                        />
                                        <datalist id="bank-name-list">
                                            {['국민은행', '신한은행', '우리은행', 'IBK기업은행', 'KEB하나은행', '카카오뱅크', '토스뱅크', '농협은행'].map(b => (
                                                <option key={b} value={b} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block">계좌 별칭 (선택)</label>
                                        <input
                                            type="text"
                                            value={bankForm.accountAlias || ''}
                                            onChange={e => setBankForm(f => ({ ...f, accountAlias: e.target.value }))}
                                            placeholder="예: 국민-운영 / 신한-급여"
                                            className="w-full bg-white p-4 rounded-2xl border border-transparent font-black text-xs outline-none focus:border-blue-200 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>

                                {/* 2행: 구분 / 금액 / 잔액 */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block">구분</label>
                                        <div className="flex gap-2">
                                            {([
                                                { value: 'deposit',    label: '입금', icon: 'fa-arrow-down', color: 'emerald' },
                                                { value: 'withdrawal', label: '출금', icon: 'fa-arrow-up',   color: 'red' },
                                            ] as const).map(opt => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setBankForm(f => ({ ...f, txType: opt.value }))}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[10px] font-black transition-all border-2 ${
                                                        bankForm.txType === opt.value
                                                            ? opt.value === 'deposit'
                                                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                                                                : 'bg-red-500 text-white border-red-500 shadow-md'
                                                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                                    }`}
                                                >
                                                    <i className={`fa-solid ${opt.icon} text-[9px]`}></i>
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block">거래 금액 (₩)</label>
                                        <input
                                            type="number"
                                            step="1"
                                            min="0"
                                            value={bankForm.amount || ''}
                                            onChange={e => setBankForm(f => ({ ...f, amount: Math.round(Number(e.target.value)) }))}
                                            placeholder="0"
                                            className={`w-full bg-white p-4 rounded-2xl border border-transparent font-black text-xs outline-none transition-all shadow-sm ${bankForm.txType === 'deposit' ? 'focus:border-emerald-200 text-emerald-600' : 'focus:border-red-200 text-red-500'}`}
                                        />
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block">거래 후 잔액 (₩)</label>
                                        <input
                                            type="number"
                                            step="1"
                                            min="0"
                                            value={bankForm.balance || ''}
                                            onChange={e => setBankForm(f => ({ ...f, balance: Math.round(Number(e.target.value)) }))}
                                            placeholder="0"
                                            className="w-full bg-white p-4 rounded-2xl border border-transparent font-black text-xs outline-none focus:border-blue-200 transition-all shadow-sm text-blue-600"
                                        />
                                    </div>
                                </div>

                                {/* 3행: 적요 + 저장 버튼 */}
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1 space-y-2 text-left">
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block">적요 (거래 설명)</label>
                                        <input
                                            type="text"
                                            value={bankForm.description}
                                            onChange={e => setBankForm(f => ({ ...f, description: e.target.value }))}
                                            placeholder="예: 카드대금 자동이체, 임대료, 직원급여…"
                                            className="w-full bg-white p-4 rounded-2xl border border-transparent font-black text-xs outline-none focus:border-blue-200 transition-all shadow-sm"
                                        />
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {bankToast && (
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${bankToast.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                                {bankToast.msg}
                                            </span>
                                        )}
                                        <button
                                            onClick={handleSaveBankTx}
                                            disabled={bankSaving || !bankForm.bankName || bankForm.amount <= 0}
                                            className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-600/20 whitespace-nowrap"
                                        >
                                            {bankSaving ? (
                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <i className="fa-solid fa-floppy-disk"></i>
                                            )}
                                            저장
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 내역 테이블 */}
                        <div className="bg-white p-6 md:p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black flex items-center gap-2">
                                    <i className="fa-solid fa-table-list text-blue-500"></i> 통장 거래 내역
                                </h3>
                                {bankLoading && (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-[9px] font-black text-gray-300 uppercase">불러오는 중</span>
                                    </div>
                                )}
                                {!bankLoading && (
                                    <span className="text-[10px] font-black text-gray-300 uppercase">{bankTxs.length}건</span>
                                )}
                            </div>
                            <div className="overflow-hidden rounded-[32px] border border-gray-50">
                                <div className="max-h-[560px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-gray-50 text-[10px] font-black uppercase text-gray-400 z-10">
                                            <tr>
                                                <th className="px-5 py-4">날짜</th>
                                                <th className="px-5 py-4">은행 / 계좌</th>
                                                <th className="px-5 py-4">적요</th>
                                                <th className="px-5 py-4 text-right">입금</th>
                                                <th className="px-5 py-4 text-right">출금</th>
                                                <th className="px-5 py-4 text-right">잔액</th>
                                                <th className="px-5 py-4"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 text-xs">
                                            {bankTxs.map(tx => (
                                                <tr key={tx.id} className="hover:bg-blue-50/20 transition-colors group">
                                                    <td className="px-5 py-4 font-black text-gray-700 whitespace-nowrap">{tx.date}</td>
                                                    <td className="px-5 py-4">
                                                        <div className="font-black text-gray-800">{tx.bankName}</div>
                                                        {tx.accountAlias && <div className="text-[9px] text-gray-400 mt-0.5">{tx.accountAlias}</div>}
                                                    </td>
                                                    <td className="px-5 py-4 text-gray-500 max-w-[200px] truncate">{tx.description || '—'}</td>
                                                    <td className="px-5 py-4 text-right font-black text-emerald-600">
                                                        {tx.txType === 'deposit' ? `+₩${tx.amount.toLocaleString()}` : '—'}
                                                    </td>
                                                    <td className="px-5 py-4 text-right font-black text-red-500">
                                                        {tx.txType === 'withdrawal' ? `-₩${tx.amount.toLocaleString()}` : '—'}
                                                    </td>
                                                    <td className="px-5 py-4 text-right font-black text-blue-600 tabular-nums">
                                                        ₩{tx.balance.toLocaleString()}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <button
                                                            onClick={() => tx.id && deleteBankTx(tx.id)}
                                                            title="삭제"
                                                            className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all"
                                                        >
                                                            <i className="fa-solid fa-trash text-[10px]"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {!bankLoading && bankTxs.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-20 text-center text-gray-300 font-black italic">
                                                        거래 내역이 없습니다. 위 폼에서 입력하세요.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 🏪 지점 정산 탭 */}
                {activeSubTab === 'branch' && (
                    <BranchSettlementPanel
                        bookings={allBookings ?? bookings}
                        locations={locations}
                        expenditures={expenditures}
                        revenueStartDate={revenueStartDate}
                        revenueEndDate={revenueEndDate}
                        onExpenditureSaved={onExpenditureSaved}
                    />
                )}
            </div>
        </div>
    );
};

// ─── 지점 정산 패널 ────────────────────────────────────────────────────
interface BranchSettlementEntry {
    branchId: string;
    branchName: string;
    deliveryAmount: number;
    storageAmount: number;
    totalCommission: number;
    deliveryCount: number;
    storageCount: number;
    commDeliveryRate: number;
    commStorageRate: number;
    isPaid: boolean;
    existingExpId?: string;
}

const BranchSettlementPanel: React.FC<{
    bookings: BookingState[];
    locations: LocationOption[];
    expenditures: Expenditure[];
    revenueStartDate: string;
    revenueEndDate: string;
    onExpenditureSaved?: (exp: Expenditure) => void;
}> = ({ bookings, locations, expenditures, revenueStartDate, revenueEndDate, onExpenditureSaved }) => {
    const [saving, setSaving] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [paidIds, setPaidIds] = useState<Set<string>>(new Set());

    const entries = useMemo<BranchSettlementEntry[]>(() => {
        const map: Record<string, BranchSettlementEntry> = {};

        const filtered = bookings.filter(b => {
            const d = b.pickupDate || '';
            return d >= revenueStartDate && d <= revenueEndDate && !b.isDeleted;
        });

        filtered.forEach(b => {
            const key = b.branchId || b.branchName || '기타';
            const loc = locations.find(l =>
                l.id === b.branchId ||
                l.name === b.branchName ||
                (l as any).shortCode === (b as any).branchCode
            );
            const bName = b.branchName || loc?.name || key;
            if (!map[key]) {
                map[key] = {
                    branchId: key,
                    branchName: bName,
                    deliveryAmount: 0,
                    storageAmount: 0,
                    totalCommission: 0,
                    deliveryCount: 0,
                    storageCount: 0,
                    commDeliveryRate: loc?.commissionRates?.delivery ?? 0,
                    commStorageRate: loc?.commissionRates?.storage ?? 0,
                    isPaid: false,
                };
            }
            const entry = map[key];
            const price = (b as any).settlementHardCopyAmount ?? b.finalPrice ?? 0;
            const isDelivery = b.serviceType === ServiceType.DELIVERY;
            const rate = isDelivery ? entry.commDeliveryRate : entry.commStorageRate;
            const comm = Math.floor(price * (rate / 100));
            entry.totalCommission += comm;
            if (isDelivery) { entry.deliveryAmount += comm; entry.deliveryCount += 1; }
            else { entry.storageAmount += comm; entry.storageCount += 1; }
        });

        // 이미 이 기간에 수수료 지출 처리된 지점 표시
        expenditures.forEach(exp => {
            if (exp.category !== '수수료') return;
            const matchKey = Object.keys(map).find(k => exp.description?.includes(map[k].branchName));
            if (matchKey && exp.date >= revenueStartDate && exp.date <= revenueEndDate) {
                map[matchKey].isPaid = true;
                map[matchKey].existingExpId = exp.id;
            }
        });

        return Object.values(map).filter(e => e.totalCommission > 0).sort((a, b) => b.totalCommission - a.totalCommission);
    }, [bookings, locations, expenditures, revenueStartDate, revenueEndDate]);

    const totalCommission = entries.reduce((s, e) => s + e.totalCommission, 0);
    const paidCommission = entries.filter(e => e.isPaid || paidIds.has(e.branchId)).reduce((s, e) => s + e.totalCommission, 0);

    const handleMarkPaid = async (entry: BranchSettlementEntry) => {
        if (saving) return;
        setSaving(entry.branchId);
        try {
            const exp: Expenditure = {
                date: revenueEndDate,
                category: '수수료',
                description: `수수료(${entry.branchName}) ${revenueStartDate}~${revenueEndDate}`,
                amount: entry.totalCommission,
                branchId: entry.branchId !== '기타' ? entry.branchId : undefined,
                costType: 'variable' as any,
                paymentType: 'corporate' as any,
                createdBy: 'admin',
                createdAt: new Date().toISOString(),
            };
            const saved = await StorageService.saveExpenditure(exp);
            onExpenditureSaved?.(saved);
            setPaidIds(prev => new Set([...prev, entry.branchId]));
            setToast({ msg: `${entry.branchName} 커미션 완료 처리 ✅`, type: 'success' });
            setTimeout(() => setToast(null), 3000);
        } catch (e) {
            console.error(e);
            setToast({ msg: '저장 실패', type: 'error' });
            setTimeout(() => setToast(null), 3000);
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-xs font-black shadow-xl transition-all ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {toast.msg}
                </div>
            )}

            {/* 요약 카드 */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1.5">총 커미션</p>
                    <p className="text-xl font-black text-bee-black">₩{totalCommission.toLocaleString()}</p>
                    <p className="text-[9px] text-gray-400 font-bold mt-1">{entries.length}개 지점</p>
                </div>
                <div className="bg-white p-5 rounded-[24px] border border-emerald-100 shadow-sm">
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1.5">완료 처리</p>
                    <p className="text-xl font-black text-emerald-600">₩{paidCommission.toLocaleString()}</p>
                    <p className="text-[9px] text-emerald-400 font-bold mt-1">{entries.filter(e => e.isPaid || paidIds.has(e.branchId)).length}개 지점</p>
                </div>
                <div className="bg-white p-5 rounded-[24px] border border-orange-100 shadow-sm">
                    <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1.5">미지급</p>
                    <p className="text-xl font-black text-orange-500">₩{(totalCommission - paidCommission).toLocaleString()}</p>
                    <p className="text-[9px] text-orange-400 font-bold mt-1">{entries.filter(e => !e.isPaid && !paidIds.has(e.branchId)).length}개 지점</p>
                </div>
            </div>

            {/* 지점별 테이블 */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-black text-bee-black flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                        지점별 커미션 정산 현황
                    </h3>
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{revenueStartDate} ~ {revenueEndDate}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-50">
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-300 uppercase tracking-widest">지점명</th>
                                <th className="px-6 py-4 text-right text-[9px] font-black text-gray-300 uppercase tracking-widest">배송 커미션</th>
                                <th className="px-6 py-4 text-right text-[9px] font-black text-gray-300 uppercase tracking-widest">보관 커미션</th>
                                <th className="px-6 py-4 text-right text-[9px] font-black text-gray-300 uppercase tracking-widest">합계</th>
                                <th className="px-6 py-4 text-center text-[9px] font-black text-gray-300 uppercase tracking-widest">상태</th>
                                <th className="px-6 py-4 text-center text-[9px] font-black text-gray-300 uppercase tracking-widest">처리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs">
                            {entries.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-gray-300 font-black italic">
                                        선택 기간에 커미션 내역이 없습니다.
                                    </td>
                                </tr>
                            )}
                            {entries.map(entry => {
                                const isPaid = entry.isPaid || paidIds.has(entry.branchId);
                                const isProcessing = saving === entry.branchId;
                                return (
                                    <tr key={entry.branchId} className={`transition-colors ${isPaid ? 'bg-emerald-50/30' : 'hover:bg-gray-50/50'}`}>
                                        <td className="px-6 py-4">
                                            <div className="font-black text-bee-black">{entry.branchName}</div>
                                            <div className="text-[9px] text-gray-400 mt-0.5">
                                                배송 {entry.commDeliveryRate}% / 보관 {entry.commStorageRate}% | {entry.deliveryCount + entry.storageCount}건
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="font-black text-blue-600">₩{entry.deliveryAmount.toLocaleString()}</div>
                                            <div className="text-[9px] text-gray-400">{entry.deliveryCount}건</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="font-black text-purple-600">₩{entry.storageAmount.toLocaleString()}</div>
                                            <div className="text-[9px] text-gray-400">{entry.storageCount}건</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-bee-black text-sm">
                                            ₩{entry.totalCommission.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black ${isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-500'}`}>
                                                <i className={`fa-solid ${isPaid ? 'fa-circle-check' : 'fa-clock'} text-[8px]`}></i>
                                                {isPaid ? '완료' : '대기'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {isPaid ? (
                                                <span className="text-[9px] text-gray-300 font-bold">지출 처리됨</span>
                                            ) : (
                                                <button
                                                    onClick={() => handleMarkPaid(entry)}
                                                    disabled={!!saving}
                                                    className="px-4 py-2 bg-emerald-500 text-white text-[9px] font-black rounded-xl hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5 mx-auto"
                                                >
                                                    {isProcessing
                                                        ? <><i className="fa-solid fa-circle-notch animate-spin"></i> 처리중</>
                                                        : <><i className="fa-solid fa-check"></i> 완료 처리</>
                                                    }
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100">
                    <p className="text-[9px] text-gray-400 font-medium">* 완료 처리 시 지출 내역에 <span className="font-black text-gray-600">수수료(지점명)</span> 항목으로 자동 등록됩니다.</p>
                </div>
            </div>
        </div>
    );
};

export default AccountingTab;
