import React, { useState, useMemo } from 'react';
import { BookingState, Expenditure, CashClosing, AdminTab } from '../../types';

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
}

type SubTab = 'revenue' | 'expenditure' | 'calendar';

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
    deleteExpenditure
}) => {
    const [activeSubTab, setActiveSubTab] = useState<SubTab>('revenue');

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
                    <h1 className="text-xl md:text-2xl font-black tracking-tight">매출 결산 <span className="text-bee-yellow italic">Accounting</span></h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Unified Period Performance & Financial Statistics 🛡️</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 relative z-10">
                    <div className="flex bg-gray-50/80 p-1 rounded-2xl border border-gray-100">
                        <button
                            onClick={() => setActiveSubTab('revenue')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-tight transition-all ${activeSubTab === 'revenue' ? 'bg-bee-black text-white shadow-lg' : 'text-gray-400 hover:text-bee-black'}`}
                        >
                            매출 요약
                        </button>
                        <button
                            onClick={() => setActiveSubTab('expenditure')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-tight transition-all ${activeSubTab === 'expenditure' ? 'bg-bee-black text-white shadow-lg' : 'text-gray-400 hover:text-bee-black'}`}
                        >
                            지출 내역
                        </button>
                        <button
                            onClick={() => setActiveSubTab('calendar')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-tight transition-all ${activeSubTab === 'calendar' ? 'bg-bee-black text-white shadow-lg' : 'text-gray-400 hover:text-bee-black'}`}
                        >
                            매출 캘린더
                        </button>
                    </div>
                </div>
            </div>

            {/* Premium Summary Grid - Optimized Space */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between hover:border-bee-yellow transition-all">
                    <div>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1.5 line-clamp-1">총 매출 (선택 기간)</p>
                        <h3 className="text-xl font-black italic text-bee-black">₩{(revenueStats?.total || 0).toLocaleString()}</h3>
                    </div>
                    <div className="mt-3">
                        <span className="px-2 py-0.5 bg-bee-yellow/10 rounded-md text-[8px] font-black text-bee-yellow tracking-tighter">{(revenueStats?.count || 0)}건의 주문</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between hover:border-red-400 transition-all">
                    <div>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1.5 line-clamp-1">총 지출</p>
                        <h3 className="text-xl font-black italic text-red-500">₩{(revenueStats?.expenditure || 0).toLocaleString()}</h3>
                    </div>
                    <div className="mt-4">
                        <div className="w-full bg-gray-50 h-1 rounded-full overflow-hidden" title="매출 대비 지출 비중">
                            <div 
                                className="bg-red-400 h-full transition-all duration-1000" 
                                style={{ width: `${Math.min(((revenueStats?.expenditure || 0) / (revenueStats?.total || 1)) * 100, 100)}%` } as React.CSSProperties}
                            ></div>
                        </div>
                    </div>
                </div>

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

                <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between hover:border-blue-400 transition-all">
                    <div>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1.5">부가세 별도 (예상)</p>
                        <h3 className="text-xl font-black italic text-blue-500">₩{(revenueStats?.vat || 0).toLocaleString()}</h3>
                    </div>
                    <p className="text-[8px] font-black text-gray-300 mt-2 uppercase tracking-tighter">약 1/11 산출 기준</p>
                </div>

                <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between hover:border-purple-400 transition-all col-span-2 md:col-span-1 lg:col-span-1">
                    <div>
                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1.5 line-clamp-1">누적 총 매출</p>
                        <h3 className="text-xl font-black italic text-bee-black">₩{(revenueStats?.lifetimeRevenue || 0).toLocaleString()}</h3>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-50">
                        <p className="text-[8px] font-black text-gray-300 uppercase">누적: {(revenueStats?.lifetimeCount || 0).toLocaleString()}건의 주문</p>
                    </div>
                </div>
            </div>

            {/* Date Range Selector & Audit Section */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-wrap items-center gap-6 group hover:border-bee-yellow transition-all duration-500">
                <div className="flex items-center gap-4">
                    <div className="space-y-1 text-left">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block ml-1">조회 시작일</label>
                        <div className="relative">
                            <i className="fa-solid fa-calendar-alt absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-[10px]"></i>
                            <input
                                type="date"
                                title="조회 시작일"
                                value={revenueStartDate}
                                onChange={e => setRevenueStartDate(e.target.value)}
                                className="bg-gray-50 pl-10 pr-6 py-2.5 rounded-2xl font-black text-[11px] border border-transparent outline-none focus:bg-white focus:border-bee-black transition-all"
                            />
                        </div>
                    </div>
                    <div className="pt-4 text-gray-200 font-black">~</div>
                    <div className="space-y-1 text-left">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block ml-1">조회 종료일</label>
                        <div className="relative">
                            <i className="fa-solid fa-calendar-alt absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-[10px]"></i>
                            <input
                                type="date"
                                title="조회 종료일"
                                value={revenueEndDate}
                                onChange={e => setRevenueEndDate(e.target.value)}
                                className="bg-gray-50 pl-10 pr-6 py-2.5 rounded-2xl font-black text-[11px] border border-transparent outline-none focus:bg-white focus:border-bee-black transition-all"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex-1"></div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportCSV}
                        className="px-5 py-2.5 bg-bee-yellow text-bee-black rounded-[20px] text-[10px] font-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-bee-yellow/10 flex items-center gap-2"
                    >
                        <i className="fa-solid fa-file-excel"></i> CSV 엑셀 내보내기
                    </button>
                </div>
            </div>

            {/* Payment Method Matrix */}
            <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-50 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                <div className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center">
                    <span className="text-[8px] font-black text-gray-300 uppercase mb-1">카드결제</span>
                    <span className="text-[11px] font-black">₩{(revenueStats?.card || 0).toLocaleString()}</span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center">
                    <span className="text-[8px] font-black text-gray-300 uppercase mb-1">현금 결제</span>
                    <span className="text-[11px] font-black text-emerald-500">₩{(revenueStats?.cash || 0).toLocaleString()}</span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center">
                    <span className="text-[8px] font-black text-gray-300 uppercase mb-1">네이버페이</span>
                    <span className="text-[11px] font-black text-green-500">₩{(revenueStats?.naver || 0).toLocaleString()}</span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center">
                    <span className="text-[8px] font-black text-gray-300 uppercase mb-1">카카오페이</span>
                    <span className="text-[11px] font-black text-yellow-500">₩{(revenueStats?.kakao || 0).toLocaleString()}</span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center">
                    <span className="text-[8px] font-black text-gray-300 uppercase mb-1">애플페이</span>
                    <span className="text-[11px] font-black">₩{(revenueStats?.apple || 0).toLocaleString()}</span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center">
                    <span className="text-[8px] font-black text-gray-300 uppercase mb-1">삼성페이</span>
                    <span className="text-[11px] font-black text-blue-400">₩{(revenueStats?.samsung || 0).toLocaleString()}</span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center">
                    <span className="text-[8px] font-black text-gray-300 uppercase mb-1">페이팔</span>
                    <span className="text-[11px] font-black text-blue-600">₩{(revenueStats?.paypal || 0).toLocaleString()}</span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center">
                    <span className="text-[8px] font-black text-gray-300 uppercase mb-1">해외결제</span>
                    <span className="text-[11px] font-black text-gray-400">₩{(revenueStats?.alipay + revenueStats?.wechat || 0).toLocaleString()}</span>
                </div>
            </div>

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
                                                <tr><td colSpan={3} className="px-6 py-20 text-center text-gray-300 font-black italic">No records in this period.</td></tr>
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
                                                        <p className="text-[9px] font-bold text-bee-blue mt-0.5">累積 ₩{s.cumulative.toLocaleString()}</p>
                                                    </td>
                                                </tr>
                                            ))}
                                            {accountingMonthlyStats.length === 0 && (
                                                <tr><td colSpan={3} className="px-6 py-20 text-center text-gray-300 font-black italic">No monthly records.</td></tr>
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
                                        value={expForm.category}
                                        onChange={e => setExpForm({ ...expForm, category: e.target.value })}
                                        placeholder="예: 유류비, 소모품 등"
                                        className="w-full bg-white p-4 rounded-2xl border border-transparent font-black text-xs outline-none focus:border-red-200 transition-all shadow-sm"
                                    />
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
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block">Detailed Description</label>
                                <input
                                    type="text"
                                    value={expForm.description}
                                    onChange={e => setExpForm({ ...expForm, description: e.target.value })}
                                    placeholder="Enter expense details..."
                                    className="w-full bg-white p-4 rounded-2xl border border-transparent font-black text-xs outline-none focus:border-red-200 transition-all shadow-sm"
                                />
                            </div>
                            <button
                                onClick={handleSaveExpenditure}
                                className="w-full py-5 bg-red-400 text-white font-black rounded-[24px] hover:bg-red-500 transition-all shadow-xl shadow-red-100 hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <i className="fa-solid fa-plus-circle"></i> 지출 내역 신규 등록
                            </button>
                        </div>

                        <div className="overflow-hidden rounded-[32px] border border-gray-50">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100 text-[10px] font-black uppercase text-gray-400">
                                    <tr>
                                        <th className="px-6 py-4">일자</th>
                                        <th className="px-6 py-4">항목</th>
                                        <th className="px-6 py-4 text-right">금액</th>
                                        <th className="px-6 py-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {expenditures.map(e => (
                                        <tr key={e.id} className="hover:bg-red-50/20 transition-colors group">
                                            <td className="px-6 py-4 font-black text-gray-500 text-xs">{e.date}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-xs text-bee-black">{e.category}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold">{e.description}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-red-500 text-xs">₩{e.amount?.toLocaleString()}</td>
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
                                    ))}
                                    {expenditures.length === 0 && (
                                        <tr><td colSpan={4} className="px-6 py-20 text-center text-gray-300 font-black italic">표시할 지출 내역이 없습니다.</td></tr>
                                    )}
                                </tbody>
                            </table>
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

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
                            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                                <div key={day} className="text-center text-[10px] font-black text-gray-300 uppercase tracking-widest pb-4 border-b border-gray-50">{day}</div>
                            ))}
                            {calendarDays.map((day, idx) => {
                                const dateStr = day.toISOString().split('T')[0];
                                const total = getDailyTotal(dateStr);
                                const isSelected = revenueEndDate === dateStr;

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedDetailDate(dateStr)}
                                        className={`min-h-[100px] p-4 rounded-[28px] border-2 cursor-pointer transition-all hover:-translate-y-1 ${isSelected ? 'bg-bee-black border-bee-black shadow-xl shadow-bee-black/20' : 'bg-gray-50/50 border-transparent hover:border-bee-yellow/20 hover:bg-white hover:shadow-lg'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`text-xs font-black ${isSelected ? 'text-bee-yellow' : 'text-gray-400'}`}>{day.getDate()}</span>
                                            {total > 1000000 && <div className="w-1.5 h-1.5 rounded-full bg-bee-yellow animate-pulse"></div>}
                                        </div>
                                        <div className="space-y-1">
                                            {total > 0 && (
                                                <>
                                                    <p className={`text-[10px] font-black leading-tight ${isSelected ? 'text-white' : 'text-bee-black'}`}>₩{(total / 1000).toFixed(0)}k</p>
                                                    <div className="w-full h-1 bg-bee-yellow/20 rounded-full overflow-hidden">
                                                        <div 
                                                            className="bg-bee-yellow h-full" 
                                                            style={{ width: `${Math.min((total / 2000000) * 100, 100)}%` } as React.CSSProperties}
                                                        ></div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountingTab;
