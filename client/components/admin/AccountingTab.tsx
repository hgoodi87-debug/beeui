import React from 'react';
import { BookingState, Expenditure, CashClosing, AdminTab } from '../../types';

interface AccountingTabProps {
    revenueStartDate: string;
    setRevenueStartDate: (d: string) => void;
    revenueEndDate: string;
    setRevenueEndDate: (d: string) => void;
    handleExportCSV: () => void;
    revenueStats: any;
    accountingDailyStats: any[];
    setSelectedDetailDate: (d: string) => void;
    expForm: any;
    setExpForm: (f: any) => void;
    handleSaveExpenditure: () => void;
    expenditures: Expenditure[];
    deleteExpenditure: (id: string) => void;
}

const AccountingTab: React.FC<AccountingTabProps> = ({
    revenueStartDate,
    setRevenueStartDate,
    revenueEndDate,
    setRevenueEndDate,
    handleExportCSV,
    revenueStats,
    accountingDailyStats,
    setSelectedDetailDate,
    expForm,
    setExpForm,
    handleSaveExpenditure,
    expenditures,
    deleteExpenditure
}) => {
    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">매출 결산 (Revenue & Closing)</h1>
                <button
                    onClick={handleExportCSV}
                    className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-green-700 transition-all shadow-lg flex items-center gap-2"
                >
                    <i className="fa-solid fa-file-csv"></i> 스프레드시트 내보내기 (CSV)
                </button>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[30px] shadow-sm border border-gray-100">
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">시작일 (Start)</label>
                        <input type="date" value={revenueStartDate} onChange={e => setRevenueStartDate(e.target.value)} className="bg-gray-50 p-3 rounded-xl font-bold text-sm border border-gray-100" />
                    </div>
                    <span className="text-gray-300 font-bold">~</span>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">종료일 (End)</label>
                        <input type="date" value={revenueEndDate} onChange={e => setRevenueEndDate(e.target.value)} className="bg-gray-50 p-3 rounded-xl font-bold text-sm border border-gray-100" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-bee-yellow/10 p-5 rounded-[24px] border border-bee-yellow/20">
                        <span className="text-[10px] font-black text-bee-black/50 uppercase">누격 매출 (Total Revenue)</span>
                        <h3 className="text-xl md:text-2xl font-black text-bee-black mt-1">₩{revenueStats.total.toLocaleString()}</h3>
                        <span className="text-[10px] font-bold text-gray-500">{revenueStats.count}건</span>
                    </div>
                    <div className="bg-red-50 p-5 rounded-[24px] border border-red-100">
                        <span className="text-[10px] font-black text-red-800/50 uppercase">누적 지출 (Total Expenditure)</span>
                        <h3 className="text-xl md:text-2xl font-black text-red-900 mt-1">₩{revenueStats.expenditure.toLocaleString()}</h3>
                    </div>
                    <div className="bg-emerald-50 p-5 rounded-[24px] border border-emerald-100">
                        <span className="text-[10px] font-black text-emerald-800/50 uppercase">순이익 (Net Profit)</span>
                        <h3 className="text-xl md:text-2xl font-black text-emerald-900 mt-1">₩{(revenueStats.total - revenueStats.expenditure).toLocaleString()}</h3>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-[24px] border border-gray-100">
                        <span className="text-[10px] font-black text-gray-400 uppercase">결제 수단별 비중</span>
                        <div className="mt-1 text-[11px] font-bold text-gray-600 grid grid-cols-2 gap-x-4">
                            <span>카드: ₩{revenueStats.card.toLocaleString()}</span>
                            <span>현금: ₩{revenueStats.cash.toLocaleString()}</span>
                            <span>애플Pay: ₩{revenueStats.apple.toLocaleString()}</span>
                            <span>삼성Pay: ₩{revenueStats.samsung.toLocaleString()}</span>
                            <span>네이버: ₩{revenueStats.naver.toLocaleString()}</span>
                            <span>카카오: ₩{revenueStats.kakao.toLocaleString()}</span>
                            <span>PayPal: ₩{revenueStats.paypal.toLocaleString()}</span>
                            <span>위챗: ₩{revenueStats.wechat.toLocaleString()}</span>
                            <span>알리: ₩{revenueStats.alipay.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-black flex items-center gap-2">
                            <i className="fa-solid fa-chart-line"></i> 기간 내 일별 매출 내역
                        </h3>
                        <div className="overflow-x-auto bg-gray-50/50 rounded-2xl border border-gray-100 p-2 max-h-[400px]">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100 text-[10px] font-black uppercase text-gray-500 border-b">
                                    <tr>
                                        <th className="px-4 py-3">날짜</th>
                                        <th className="px-4 py-3">건수</th>
                                        <th className="px-4 py-3">매출액</th>
                                        <th className="px-4 py-3">누적</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {accountingDailyStats.length > 0 ? accountingDailyStats.map(s => (
                                        <tr
                                            key={s.date}
                                            onClick={() => setSelectedDetailDate(s.date)}
                                            className="text-[11px] hover:bg-white transition-all cursor-pointer group"
                                        >
                                            <td className="px-4 py-3 font-black flex items-center gap-2">
                                                {s.date}
                                                <i className="fa-solid fa-magnifying-glass text-[8px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                                            </td>
                                            <td className="px-4 py-3 font-bold">{s.count}건</td>
                                            <td className="px-4 py-3 font-black text-bee-black">₩{s.total.toLocaleString()}</td>
                                            <td className="px-4 py-3 font-bold text-bee-blue">₩{s.cumulative.toLocaleString()}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400 font-bold">매출 내역 없음</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-black flex items-center gap-2">
                            <i className="fa-solid fa-receipt"></i> 지출 등록 및 내역
                        </h3>
                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase">날짜</label>
                                    <input type="date" value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} className="w-full bg-white p-2 rounded-lg border border-gray-200 text-xs font-bold" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase">항목 (카테고리)</label>
                                    <input type="text" value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })} placeholder="예: 유류비, 소모품" className="w-full bg-white p-2 rounded-lg border border-gray-200 text-xs font-bold" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase">금액</label>
                                    <input type="number" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: Number(e.target.value) })} className="w-full bg-white p-2 rounded-lg border border-gray-200 text-xs font-bold" />
                                </div>
                                <div className="flex items-end">
                                    <button onClick={handleSaveExpenditure} className="w-full bg-bee-black text-white py-2 rounded-lg font-black text-xs hover:bg-gray-800 transition-all">지출 저장</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase">상세 내용</label>
                                <input type="text" value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} placeholder="지출 상세 내용을 입력하세요..." className="w-full bg-white p-2 rounded-lg border border-gray-200 text-xs font-bold" />
                            </div>
                        </div>

                        <div className="overflow-x-auto bg-gray-50/50 rounded-2xl border border-gray-100 p-2 max-h-[250px]">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100 text-[10px] font-black uppercase text-gray-500 border-b">
                                    <tr>
                                        <th className="px-4 py-3">날짜</th>
                                        <th className="px-4 py-3">항목</th>
                                        <th className="px-4 py-3">금액</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {expenditures.map(e => (
                                        <tr key={e.id} className="text-[11px] hover:bg-white transition-colors">
                                            <td className="px-4 py-3 font-black">{e.date}</td>
                                            <td className="px-4 py-3 font-bold">{e.category}</td>
                                            <td className="px-4 py-3 font-black text-red-500">₩{e.amount?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => deleteExpenditure(e.id!)} className="text-gray-300 hover:text-red-500 transition-colors"><i className="fa-solid fa-trash-can"></i></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountingTab;
