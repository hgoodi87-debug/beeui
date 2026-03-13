import React from 'react';
import { CashClosing, Expenditure, BookingState, BookingStatus } from '../../types';

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
    expenditures: Expenditure[];
    deleteExpenditure: (id: string) => void;
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
    expenditures,
    deleteExpenditure,
    setSelectedBooking
}) => {
    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                    <i className="fa-solid fa-chart-line text-8xl text-bee-black"></i>
                </div>
                <div className="space-y-1 relative">
                    <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
                        일일 정산 <span className="text-bee-yellow italic">Settlement</span>
                    </h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">일일 금융 대조 및 시재 마감 🛡️</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50/80 p-1.5 pl-4 rounded-[20px] border border-gray-100 hover:bg-white hover:border-bee-yellow transition-all duration-300">
                    <div className="flex flex-col items-start pr-2">
                        <span className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">정산 기준일</span>
                        <input
                            type="date"
                            title="정산 날짜 선택"
                            value={revenueEndDate}
                            onChange={e => { setRevenueStartDate(e.target.value); setRevenueEndDate(e.target.value); }}
                            className="text-xs font-black bg-transparent outline-none cursor-pointer text-bee-black focus:text-bee-yellow transition-colors"
                        />
                    </div>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <div className="p-2.5 bg-bee-black rounded-2xl text-bee-yellow shadow-lg group-hover:rotate-12 transition-transform">
                        <i className="fa-solid fa-calendar-check text-[10px]"></i>
                    </div>
                </div>
            </div>

            {/* Premium Summary Grid - Optimized Space */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between hover:border-bee-yellow hover:shadow-md transition-all">
                    <div>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2">총 매출액</p>
                        <h3 className="text-xl font-black italic text-bee-black">₩{dailySettlementStats.totalRevenue.toLocaleString()}</h3>
                    </div>
                    <div className="mt-3 flex gap-1.5 items-center">
                        <span className="px-1.5 py-0.5 bg-bee-yellow/10 rounded-md text-[8px] font-black text-bee-yellow">배송 {dailySettlementStats.deliveryCount}</span>
                        <span className="px-1.5 py-0.5 bg-bee-blue/10 rounded-md text-[8px] font-black text-bee-blue">보관 {dailySettlementStats.storageCount}</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between hover:border-red-400 transition-all">
                    <div>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2">당일 지출액</p>
                        <h3 className="text-xl font-black italic text-red-500">₩{dailySettlementStats.totalExp.toLocaleString()}</h3>
                    </div>
                    <p className="text-[8px] font-black text-red-300 mt-2 uppercase">{Object.keys(dailySettlementStats.expByCategory).length}개 카테고리 기록됨</p>
                </div>

                <div className="bg-emerald-500 p-5 rounded-[28px] shadow-lg flex flex-col justify-between relative overflow-hidden group/card hover:-translate-y-1 transition-all">
                    <div className="absolute top-0 right-0 p-3 opacity-20 text-white group-hover/card:scale-125 transition-transform">
                        <i className="fa-solid fa-sack-dollar text-2xl"></i>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-white/70 uppercase tracking-widest mb-2">현금 장부 금액</p>
                        <h3 className="text-xl font-black italic text-white">₩{dailySettlementStats.revenueByMethod.cash.toLocaleString()}</h3>
                    </div>
                    <p className="text-[8px] font-black text-white/50 mt-2 uppercase">당일 수령한 현금 총액</p>
                </div>

                <div className="bg-bee-black p-5 rounded-[28px] shadow-lg flex flex-col justify-between relative overflow-hidden group/card hover:-translate-y-1 transition-all">
                    <div className="absolute bottom-0 right-0 p-3 opacity-10 text-bee-yellow group-hover/card:scale-125 transition-transform">
                        <i className="fa-solid fa-chart-pie text-2xl"></i>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">당일 순수익</p>
                        <h3 className="text-xl font-black italic text-bee-yellow">₩{dailySettlementStats.netProfit.toLocaleString()}</h3>
                    </div>
                    <div className="mt-3">
                        <p className="text-[8px] font-black text-gray-500 uppercase">예상 부가세: ₩{dailySettlementStats.vat.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between hover:border-purple-400 transition-all col-span-2 md:col-span-1 lg:col-span-1">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2">짐 크기별 수량 (S/M/L/XL)</p>
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl">
                        <div className="text-center">
                            <p className="text-[7px] font-black text-gray-400">S</p>
                            <p className="text-[10px] font-black">{dailySettlementStats.bagSizes.S}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[7px] font-black text-gray-400">M</p>
                            <p className="text-[10px] font-black">{dailySettlementStats.bagSizes.M}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[7px] font-black text-gray-400">L</p>
                            <p className="text-[10px] font-black">{dailySettlementStats.bagSizes.L}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[7px] font-black text-gray-400">XL</p>
                            <p className="text-[10px] font-black">{dailySettlementStats.bagSizes.XL}</p>
                        </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                        <span className="text-[7px] font-black text-orange-400">환불: {dailySettlementStats.refundedCount}</span>
                        <span className="text-[7px] font-black text-gray-400">취소: {dailySettlementStats.cancelledCount}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Bookings & Discounts Section */}
                <div className="bg-white p-6 md:p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black flex items-center gap-2">
                                <i className="fa-solid fa-list-check text-bee-yellow"></i> 당일 예약 분석
                            </h3>
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-bee-yellow"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-bee-blue"></div>
                            </div>
                        </div>

                        {/* Delivery Bookings Collapsible */}
                        <details className="group border border-gray-50 rounded-[24px] overflow-hidden bg-gray-50/20" open>
                            <summary className="flex justify-between items-center p-5 cursor-pointer hover:bg-bee-yellow/5 transition-all outline-none list-none">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-bee-yellow/10 flex items-center justify-center text-bee-yellow">
                                        <i className="fa-solid fa-truck-fast text-sm"></i>
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="font-black text-sm text-bee-black">배송 예약 목록</span>
                                        <span className="text-[10px] font-bold text-gray-400">총 {dailySettlementStats.deliveryCount} 건 접수됨</span>
                                    </div>
                                </div>
                                <i className="fa-solid fa-chevron-down text-[10px] group-open:rotate-180 transition-transform text-gray-300"></i>
                            </summary>
                            <div className="p-4 pt-0 space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                                {bookings.filter(b => b.pickupDate === revenueEndDate && b.serviceType === 'DELIVERY' && !b.isDeleted).map(b => (
                                    <div
                                        key={b.id}
                                        onClick={() => { setSelectedBooking(b); }}
                                        className="p-4 bg-white border border-gray-100 rounded-[20px] hover:border-bee-yellow hover:shadow-md cursor-pointer transition-all flex justify-between items-center group/item"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-8 rounded-full bg-bee-yellow/20"></div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-gray-300">#{b.reservationCode || (b.id ? b.id.slice(0, 6).toUpperCase() : 'N/A')}</span>
                                                <span className="text-xs font-black text-bee-black">{b.userName} 님</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-black text-bee-black">₩{(b.finalPrice || 0).toLocaleString()}</div>
                                            <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-1 ${b.status === BookingStatus.COMPLETED ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                {b.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {dailySettlementStats.deliveryCount === 0 && (
                                    <div className="py-12 flex flex-col items-center justify-center text-gray-300">
                                        <i className="fa-solid fa-ghost text-2xl mb-2 opacity-20"></i>
                                        <p className="text-[10px] font-black italic">No delivery bookings today.</p>
                                    </div>
                                )}
                            </div>
                        </details>

                        {/* Storage Bookings Collapsible */}
                        <details className="group border border-gray-50 rounded-[24px] overflow-hidden bg-gray-50/20">
                            <summary className="flex justify-between items-center p-5 cursor-pointer hover:bg-bee-blue/5 transition-all outline-none list-none">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-bee-blue/10 flex items-center justify-center text-bee-blue">
                                        <i className="fa-solid fa-warehouse text-sm"></i>
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="font-black text-sm text-bee-black">보관 예약 목록</span>
                                        <span className="text-[10px] font-bold text-gray-400">총 {dailySettlementStats.storageCount} 건 접수됨</span>
                                    </div>
                                </div>
                                <i className="fa-solid fa-chevron-down text-[10px] group-open:rotate-180 transition-transform text-gray-300"></i>
                            </summary>
                            <div className="p-4 pt-0 space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                                {bookings.filter(b => b.pickupDate === revenueEndDate && b.serviceType === 'STORAGE' && !b.isDeleted).map(b => (
                                    <div
                                        key={b.id}
                                        onClick={() => { setSelectedBooking(b); }}
                                        className="p-4 bg-white border border-gray-100 rounded-[20px] hover:border-bee-blue hover:shadow-md cursor-pointer transition-all flex justify-between items-center group/item"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-8 rounded-full bg-bee-blue/20"></div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-gray-300">#{b.reservationCode || (b.id ? b.id.slice(0, 6).toUpperCase() : 'N/A')}</span>
                                                <span className="text-xs font-black text-bee-black">{b.userName} 님</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-black text-bee-black">₩{(b.finalPrice || 0).toLocaleString()}</div>
                                            <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-1 ${b.status === BookingStatus.COMPLETED ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                {b.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {dailySettlementStats.storageCount === 0 && (
                                    <div className="py-12 flex flex-col items-center justify-center text-gray-300">
                                        <i className="fa-solid fa-ghost text-2xl mb-2 opacity-20"></i>
                                        <p className="text-[10px] font-black italic">No storage bookings today.</p>
                                    </div>
                                )}
                            </div>
                        </details>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-50">
                        <h3 className="text-sm font-black flex items-center gap-2"><i className="fa-solid fa-percent text-purple-400"></i> 할인 코드 적용 현황</h3>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(dailySettlementStats.discountCodeCounts).length > 0 ? (
                                Object.entries(dailySettlementStats.discountCodeCounts).map(([code, count]: [string, any]) => (
                                    <div key={code} className="flex items-center gap-3 pl-3 pr-4 py-2 bg-purple-50 rounded-2xl border border-purple-100 group hover:bg-purple-100 transition-colors">
                                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-tighter">{code}</span>
                                        <div className="w-px h-3 bg-purple-200"></div>
                                        <span className="text-xs font-black text-purple-800">{count}건</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[10px] text-gray-300 font-bold italic py-2">No discount codes used today.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cash Closing & Expenditure Side */}
                <div className="bg-white p-6 md:p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-10 h-fit">
                    {/* Advanced Settlement Matrix */}
                    <div className="bg-gray-50/50 rounded-[32px] p-6 border border-gray-100 space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">결제 수단별 상세 분석</h4>
                            <div className="flex gap-1">
                                <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                                <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(dailySettlementStats.revenueByMethod).map(([method, amount]: [string, any]) => (
                                <div key={method} className="bg-white p-3 rounded-2xl border border-gray-100/50 flex flex-col items-center group/method hover:border-bee-yellow transition-all">
                                    <span className="text-[8px] font-black text-gray-300 uppercase mb-1">{
                                        method === 'card' ? '카드' :
                                            method === 'cash' ? '현금' :
                                                method === 'apple' ? '애플' :
                                                    method === 'samsung' ? '삼성' :
                                                        method === 'naver' ? '네이버' :
                                                            method === 'kakao' ? '카카오' :
                                                                method === 'paypal' ? '페이팔' : method
                                    }</span>
                                    <span className={`text-[11px] font-black ${amount > 0 ? 'text-bee-black' : 'text-gray-200'}`}>₩{amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-lg font-black flex items-center gap-2">
                                <i className="fa-solid fa-cash-register text-emerald-500"></i> 현금 시재 마감 (Cash Flow)
                            </h3>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-500 rounded-lg text-[9px] font-black uppercase italic">
                                <i className="fa-solid fa-shield-halved"></i> 장부 대조 완료
                            </div>
                        </div>

                        {/* Detailed Cash Flow Ledger */}
                        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                            <div className="p-5 flex justify-between items-center bg-gray-50/30">
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Opening Cash (전일 이월)</p>
                                    <p className="text-sm font-black text-gray-500 italic">₩{(dailySettlementStats.openingCash || 0).toLocaleString()}</p>
                                </div>
                                <i className="fa-solid fa-arrow-right-long text-gray-200 text-xs"></i>
                            </div>

                            <div className="p-5 grid grid-cols-2 gap-8 relative">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase block italic">장부상 현금 매출액</label>
                                    <div className="font-black text-xl text-emerald-600 flex items-baseline gap-1">
                                        <span className="text-xs">₩</span>{dailySettlementStats.revenueByMethod.cash.toLocaleString()}
                                    </div>
                                    <p className="text-[8px] font-bold text-gray-300 italic">시스템에 기록된 당일 현금 총액</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-bee-black uppercase block italic">Actual Hand (실물 시재)</label>
                                    <div className="relative group">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-black text-bee-black transition-colors group-hover:text-bee-yellow">₩</span>
                                        <input
                                            type="number"
                                            value={cashClosing.actualCash}
                                            onChange={e => setCashClosing({ ...cashClosing, actualCash: Number(e.target.value) })}
                                            placeholder="0"
                                            className="w-full bg-transparent p-0 pl-4 font-black text-xl border-none outline-none focus:text-bee-yellow transition-all"
                                        />
                                    </div>
                                    <div className="w-full h-px bg-gray-100 group-hover:bg-bee-yellow transition-colors"></div>
                                </div>
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 text-[8px] font-black text-gray-300">VS</div>
                            </div>

                            <div className={`p-5 flex justify-between items-center transition-all duration-700 ${dailySettlementStats.revenueByMethod.cash - cashClosing.actualCash === 0
                                ? 'bg-emerald-50/50'
                                : 'bg-red-50/50 animate-pulse-subtle'
                                }`}>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">최종 장부 차액</span>
                                    <span className={`text-2xl font-black italic ${dailySettlementStats.revenueByMethod.cash - cashClosing.actualCash !== 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        ₩{(dailySettlementStats.revenueByMethod.cash - cashClosing.actualCash).toLocaleString()}
                                    </span>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${dailySettlementStats.revenueByMethod.cash - cashClosing.actualCash === 0 ? 'bg-emerald-500 text-white' : 'bg-red-400 text-white'
                                    } shadow-lg shadow-emerald-500/10 rotate-3`}>
                                    <i className={`fa-solid ${dailySettlementStats.revenueByMethod.cash - cashClosing.actualCash === 0 ? 'fa-square-check' : 'fa-triangle-exclamation'} text-lg`}></i>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-[10px] font-black text-gray-400 uppercase block ml-1 italic group-hover:text-bee-yellow transition-colors">마감 특이사항 및 메모</label>
                            <textarea
                                value={cashClosing.notes}
                                onChange={e => setCashClosing({ ...cashClosing, notes: e.target.value })}
                                className="w-full bg-white p-5 rounded-[24px] font-bold border border-gray-100 text-xs outline-none h-20 resize-none focus:border-bee-yellow transition-all shadow-sm"
                                placeholder="정산 관련 특이사항을 명확하게 기록해 주세요 (최종 승인 검토용)..."
                            />
                        </div>

                        <button
                            onClick={handleCashClose}
                            className="group relative w-full py-5 bg-bee-black text-white font-black rounded-[28px] overflow-hidden shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.98]"
                        >
                            <div className="absolute inset-0 bg-bee-yellow translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                            <span className="relative z-10 group-hover:text-bee-black transition-colors flex items-center justify-center gap-2">
                                <i className="fa-solid fa-lock-open text-xs group-hover:fa-lock transition-all"></i> 일일 정산 최종 확정 및 마감
                            </span>
                        </button>
                    </div>

                    <div className="space-y-6 pt-10 border-t border-gray-50 relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                        </div>

                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black flex items-center gap-2">
                                <i className="fa-solid fa-receipt text-red-400"></i> 지출 관리
                            </h3>
                            <p className="text-[9px] font-black text-gray-300 uppercase">Registered Today: {expenditures.length}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase block ml-1">Category</label>
                                    <input
                                        type="text"
                                        value={expForm.category}
                                        onChange={e => setExpForm({ ...expForm, category: e.target.value })}
                                        placeholder="Category"
                                        className="w-full bg-gray-50 p-4 rounded-2xl border border-transparent font-black text-xs outline-none focus:bg-white focus:border-red-100 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase block ml-1">Amount</label>
                                    <input
                                        type="number"
                                        title="지출 금액"
                                        placeholder="0"
                                        value={expForm.amount}
                                        onChange={e => setExpForm({ ...expForm, amount: Number(e.target.value) })}
                                        className="w-full bg-gray-50 p-4 rounded-2xl border border-transparent font-black text-xs outline-none focus:bg-white focus:border-red-100 transition-all text-red-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase block ml-1">Description</label>
                                <input
                                    type="text"
                                    value={expForm.description}
                                    onChange={e => setExpForm({ ...expForm, description: e.target.value })}
                                    placeholder="상세 내역 입력"
                                    className="w-full bg-gray-50 p-4 rounded-2xl border border-transparent font-black text-xs outline-none focus:bg-white focus:border-red-100 transition-all"
                                />
                            </div>
                            <button
                                onClick={handleSaveExpenditure}
                                className="w-full py-4 bg-red-50 text-red-500 font-black rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 flex items-center justify-center gap-2"
                            >
                                <i className="fa-solid fa-plus text-[10px]"></i> 지출 내역 추가
                            </button>
                        </div>

                        <div className="bg-gray-50/50 rounded-[28px] overflow-hidden border border-gray-100 shadow-inner">
                            <div className="max-h-[250px] overflow-y-auto">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-gray-100 text-[9px] font-black uppercase text-gray-400 z-10">
                                        <tr>
                                            <th className="px-5 py-4">항목</th>
                                            <th className="px-5 py-4 text-right">금액</th>
                                            <th className="px-5 py-4 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {expenditures.length > 0 ? expenditures.map(e => (
                                            <tr key={e.id} className="hover:bg-red-50/30 transition-colors group">
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col text-left">
                                                        <span className="font-black text-xs text-bee-black">{e.category}</span>
                                                        <span className="text-[9px] font-bold text-gray-400 line-clamp-1">{e.description}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-right font-black text-red-500 italic text-xs">
                                                    ₩{e.amount?.toLocaleString()}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        onClick={() => deleteExpenditure(e.id!)}
                                                        className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:bg-red-100 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                        title="지출 삭제"
                                                    >
                                                        <i className="fa-solid fa-trash-can text-[10px]"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={3} className="px-5 py-12 text-center text-gray-300">
                                                    <i className="fa-solid fa-receipt text-xl mb-2 opacity-10"></i>
                                                    <p className="text-[10px] font-black italic">지출 내역이 없습니다.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
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
                                        <p className="text-[10px] font-black italic">No closing history found.</p>
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
