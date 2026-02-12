import React from 'react';
import { CashClosing, Expenditure, BookingState } from '../../types';

interface DailySettlementTabProps {
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
    setSelectedBooking: (b: BookingState | null) => void;
}

const DailySettlementTab: React.FC<DailySettlementTabProps> = ({
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
    setSelectedBooking
}) => {
    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">일일 정산 (Daily Settlement)</h1>

            {/* Date Selection */}
            <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 flex items-center gap-4">
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">정산일 (Date)</label>
                    <input type="date" value={revenueEndDate} onChange={e => { setRevenueStartDate(e.target.value); setRevenueEndDate(e.target.value); }} className="bg-gray-50 p-3 rounded-xl font-bold text-sm border border-gray-100" />
                </div>
                <p className="text-xs text-gray-400 font-bold mt-5">* 일일 정산은 선택한 하루의 데이터를 집계합니다.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-bee-yellow/10 p-5 rounded-[24px] border border-bee-yellow/20">
                    <span className="text-[10px] font-black text-bee-black/50 uppercase">총 매출액 (Revenue)</span>
                    <h3 className="text-xl md:text-2xl font-black text-bee-black mt-1">₩{dailySettlementStats.totalRevenue.toLocaleString()}</h3>
                    <div className="flex gap-2 mt-2 text-[10px] font-bold text-gray-500">
                        <span>배송 {dailySettlementStats.deliveryCount}건</span>
                        <span>/</span>
                        <span>보관 {dailySettlementStats.storageCount}건</span>
                    </div>
                </div>
                <div className="bg-red-50 p-5 rounded-[24px] border border-red-100">
                    <span className="text-[10px] font-black text-red-800/50 uppercase">총 지출액 (Expenditure)</span>
                    <h3 className="text-xl md:text-2xl font-black text-red-900 mt-1">₩{dailySettlementStats.totalExp.toLocaleString()}</h3>
                    <span className="text-[10px] font-bold text-gray-400">{Object.keys(dailySettlementStats.expByCategory).length}개 항목</span>
                </div>
                <div className="bg-emerald-50 p-5 rounded-[24px] border border-emerald-100">
                    <span className="text-[10px] font-black text-emerald-800/50 uppercase">장부상 현금 (Ledger Cash)</span>
                    <h3 className="text-xl md:text-2xl font-black text-emerald-900 mt-1">₩{dailySettlementStats.netProfit.toLocaleString()}</h3>
                    <span className="text-[10px] font-bold text-emerald-600/60 uppercase">VAT 제외: ₩{(dailySettlementStats.totalRevenue - dailySettlementStats.vat - dailySettlementStats.totalExp).toLocaleString()}</span>
                </div>
                <div className="bg-gray-50 p-5 rounded-[24px] border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase">가방 사이즈별 (Bags)</span>
                    <div className="mt-2 grid grid-cols-4 gap-1">
                        {Object.entries(dailySettlementStats.bagSizes).map(([size, count]: [string, any]) => (
                            <div key={size} className="text-center">
                                <div className="text-[8px] font-black text-gray-300 uppercase">{size}</div>
                                <div className="text-xs font-black">{count}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Booking List Dropdowns */}
                <div className="bg-white p-6 md:p-8 rounded-[30px] shadow-sm border border-gray-100 space-y-6 flex flex-col">
                    <h3 className="text-lg font-black flex items-center gap-2"><i className="fa-solid fa-list-check"></i> 당일 예약 상세 내역</h3>

                    <div className="space-y-4">
                        {/* Delivery Bookings Collapsible */}
                        <details className="group border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/30" open>
                            <summary className="flex justify-between items-center p-5 cursor-pointer hover:bg-bee-yellow/5 transition-all outline-none">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-bee-yellow/10 flex items-center justify-center text-bee-black">
                                        <i className="fa-solid fa-truck-fast text-xs"></i>
                                    </div>
                                    <span className="font-black text-sm">배송 예약</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="bg-bee-yellow text-bee-black px-3 py-1 rounded-full text-[10px] font-black">총 {dailySettlementStats.deliveryCount}건</span>
                                    <i className="fa-solid fa-chevron-down text-[10px] group-open:rotate-180 transition-transform"></i>
                                </div>
                            </summary>
                            <div className="p-4 pt-0 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {bookings.filter(b => b.pickupDate === revenueEndDate && b.serviceType === 'DELIVERY' && !b.isDeleted).map(b => (
                                    <div
                                        key={b.id}
                                        onClick={() => { setSelectedBooking(b); }}
                                        className="p-3 bg-white border border-gray-100 rounded-xl hover:border-bee-yellow hover:shadow-sm cursor-pointer transition-all flex justify-between items-center group/item"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-gray-400">ID: {b.id}</span>
                                            <span className="text-xs font-bold text-bee-black">{b.userName} 님</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-black text-bee-black">₩{(b.finalPrice || 0).toLocaleString()}</div>
                                            <div className="text-[9px] font-bold text-gray-400">{b.status}</div>
                                        </div>
                                    </div>
                                ))}
                                {dailySettlementStats.deliveryCount === 0 && (
                                    <p className="text-center py-8 text-xs text-gray-400 font-bold italic">당일 배송 예약이 없습니다.</p>
                                )}
                            </div>
                        </details>

                        {/* Storage Bookings Collapsible */}
                        <details className="group border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/30">
                            <summary className="flex justify-between items-center p-5 cursor-pointer hover:bg-bee-blue/5 transition-all outline-none">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-bee-blue/10 flex items-center justify-center text-bee-blue">
                                        <i className="fa-solid fa-warehouse text-xs"></i>
                                    </div>
                                    <span className="font-black text-sm">보관 예약</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="bg-bee-blue text-white px-3 py-1 rounded-full text-[10px] font-black">총 {dailySettlementStats.storageCount}건</span>
                                    <i className="fa-solid fa-chevron-down text-[10px] group-open:rotate-180 transition-transform"></i>
                                </div>
                            </summary>
                            <div className="p-4 pt-0 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {bookings.filter(b => b.pickupDate === revenueEndDate && b.serviceType === 'STORAGE' && !b.isDeleted).map(b => (
                                    <div
                                        key={b.id}
                                        onClick={() => { setSelectedBooking(b); }}
                                        className="p-3 bg-white border border-gray-100 rounded-xl hover:border-bee-blue hover:shadow-sm cursor-pointer transition-all flex justify-between items-center group/item"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-gray-400">ID: {b.id}</span>
                                            <span className="text-xs font-bold text-bee-black">{b.userName} 님</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-black text-bee-black">₩{(b.finalPrice || 0).toLocaleString()}</div>
                                            <div className="text-[9px] font-bold text-gray-400">{b.status}</div>
                                        </div>
                                    </div>
                                ))}
                                {dailySettlementStats.storageCount === 0 && (
                                    <p className="text-center py-8 text-xs text-gray-400 font-bold italic">당일 보관 예약이 없습니다.</p>
                                )}
                            </div>
                        </details>
                    </div>

                    <h3 className="text-sm font-black flex items-center gap-2 pt-6 border-t border-gray-100"><i className="fa-solid fa-tag"></i> 할인 코드 사용 현황</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(dailySettlementStats.discountCodeCounts).length > 0 ? (
                            Object.entries(dailySettlementStats.discountCodeCounts).map(([code, count]: [string, any]) => (
                                <div key={code} className="flex justify-between items-center px-3 py-2 bg-purple-50 rounded-xl border border-purple-100">
                                    <span className="text-[10px] font-black text-purple-600">{code}</span>
                                    <span className="text-xs font-black text-purple-800">{count}건</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-400 font-bold col-span-2 py-4">사용된 할인 코드가 없습니다.</p>
                        )}
                    </div>
                </div>

                {/* Cash Closing in Daily Settlement */}
                <div className="bg-white p-6 md:p-8 rounded-[30px] shadow-sm border border-gray-100 space-y-6">
                    <h3 className="text-lg font-black flex items-center gap-2">
                        <i className="fa-solid fa-cash-register"></i> 당일 현금 시재 마감 (Cash Closing)
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">장부상 현금 (Ledger)</label>
                                <div className="bg-gray-50 p-4 rounded-2xl font-black text-lg border border-gray-100">
                                    ₩{dailySettlementStats.revenueByMethod.cash.toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">실제 현금 (Actual)</label>
                                <input
                                    type="number"
                                    value={cashClosing.actualCash}
                                    onChange={e => setCashClosing({ ...cashClosing, actualCash: Number(e.target.value) })}
                                    placeholder="시재 입력"
                                    className="w-full bg-gray-50 p-4 rounded-2xl font-black text-lg border border-gray-100 outline-none focus:border-bee-black"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-xs font-bold text-gray-500 uppercase">정산 오차 (Difference)</span>
                            <span className={`text-lg font-black ${dailySettlementStats.revenueByMethod.cash - cashClosing.actualCash !== 0 ? 'text-red-500' : 'text-green-500'}`}>
                                ₩{(dailySettlementStats.revenueByMethod.cash - cashClosing.actualCash).toLocaleString()}
                            </span>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">마감 특이사항 (Notes)</label>
                            <textarea
                                value={cashClosing.notes}
                                onChange={e => setCashClosing({ ...cashClosing, notes: e.target.value })}
                                className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-gray-100 text-sm outline-none h-24 resize-none"
                                placeholder="특이사항을 입력하세요..."
                            />
                        </div>

                        <button onClick={handleCashClose} className="w-full py-4 bg-bee-black text-white font-black rounded-2xl hover:scale-[1.02] transition-all shadow-xl">
                            당일 마감 저장하기
                        </button>
                    </div>

                    <h3 className="text-lg font-black flex items-center gap-2 pt-6 border-t border-gray-50">
                        <i className="fa-solid fa-receipt"></i> 당일 지출 등록 (Daily Expenditure)
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">항목 (Category)</label>
                                <input type="text" value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })} placeholder="유류비, 소모품 등" className="w-full bg-gray-50 p-3 rounded-xl border border-gray-100 font-bold text-sm outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">금액 (Amount)</label>
                                <input type="number" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: Number(e.target.value) })} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-100 font-bold text-sm outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">상세 내용 (Description)</label>
                            <input type="text" value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} placeholder="지출 상세 내용을 입력하세요..." className="w-full bg-gray-50 p-3 rounded-xl border border-gray-100 font-bold text-sm outline-none" />
                        </div>
                        <button onClick={handleSaveExpenditure} className="w-full py-3 bg-gray-100 text-gray-600 font-black rounded-xl hover:bg-gray-200 transition-all border border-gray-200">
                            지출 내역 저장
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[30px] shadow-sm border border-gray-100 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black flex items-center gap-2"><i className="fa-solid fa-history"></i> 최근 정산 내역</h3>
                    <button onClick={clearClosingHistory} className="text-[10px] font-black text-red-400 hover:text-red-600">히스토리 초기화</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
                            <tr>
                                <th className="px-6 py-4">날짜</th>
                                <th className="px-6 py-4">매출</th>
                                <th className="px-6 py-4">실제 시재</th>
                                <th className="px-6 py-4">차액</th>
                                <th className="px-6 py-4">마감자</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {closings.slice(0, 10).map(c => (
                                <tr key={c.id} className="text-xs hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-black">{c.date}</td>
                                    <td className="px-6 py-4 font-bold">₩{c.totalRevenue.toLocaleString()}</td>
                                    <td className="px-6 py-4 font-bold">₩{c.actualCashOnHand.toLocaleString()}</td>
                                    <td className={`px-6 py-4 font-black ${c.difference !== 0 ? 'text-red-500' : 'text-green-500'}`}>₩{c.difference.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-gray-500">{c.closedBy}</td>
                                </tr>
                            ))}
                            {closings.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 font-bold">내역이 없습니다.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DailySettlementTab;
