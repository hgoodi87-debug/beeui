import React from 'react';
import { BookingState, BookingStatus, ServiceType, LocationOption, AdminTab } from '../../types';
import { OPERATING_STATUS_CONFIG, BOOKING_STATUS_DISPLAY_MAP } from '../../src/constants/admin';
import { maskName, maskEmail } from '../../src/utils/maskUtils';

interface LogisticsTabProps {
    activeTab: AdminTab;
    activeStatusTab: string;
    setActiveStatusTab: (s: string) => void;
    filteredBookings: BookingState[];
    isRefreshing: boolean;
    locations: LocationOption[];
    updateStatus: (id: string, s: BookingStatus) => void;
    getStatusStyle: (s: BookingStatus) => string;
    handleResendEmail: (b: BookingState) => void;
    sendingEmailId: string | null;
    handleRefund: (b: BookingState) => void;
    refundingId: string | null;
    handleRestore: (id: string) => void;
    handlePermanentDelete: (id: string) => void;
    handlePrintLabel: (b: BookingState) => void;
    handleSoftDelete: (id: string) => void;
    setSelectedBooking: (b: BookingState | null) => void;
    onAddManual?: () => void;
    adminRole?: string;
    adminEmail?: string;
    cancelStartDate?: string;
    setCancelStartDate?: (d: string) => void;
    cancelEndDate?: string;
    setCancelEndDate?: (d: string) => void;
    completedStartDate?: string;
    setCompletedStartDate?: (d: string) => void;
    completedEndDate?: string;
    setCompletedEndDate?: (d: string) => void;
    searchStartDate: string;
    setSearchStartDate: (d: string) => void;
    searchEndDate: string;
    setSearchEndDate: (d: string) => void;
    // 일괄 처리 전용 프롭스
    selectedBookingIds: string[];
    setSelectedBookingIds: (ids: string[]) => void;
    handleBatchUpdateStatus: (s: BookingStatus) => void;
    handleBulkCleanupPastIssues: (ids: string[]) => void;
    isBatchUpdating: boolean;
    t: any;
}

const LogisticsTab: React.FC<LogisticsTabProps> = ({
    activeTab,
    activeStatusTab,
    setActiveStatusTab,
    filteredBookings,
    isRefreshing,
    locations,
    updateStatus,
    getStatusStyle,
    handleResendEmail,
    sendingEmailId,
    handleRefund,
    refundingId,
    handleRestore,
    handlePermanentDelete,
    handlePrintLabel,
    handleSoftDelete,
    setSelectedBooking,
    onAddManual,
    adminRole = 'staff',
    adminEmail,
    cancelStartDate,
    setCancelStartDate,
    cancelEndDate,
    setCancelEndDate,
    completedStartDate,
    setCompletedStartDate,
    completedEndDate,
    setCompletedEndDate,
    searchStartDate,
    setSearchStartDate,
    searchEndDate,
    setSearchEndDate,
    selectedBookingIds,
    setSelectedBookingIds,
    handleBatchUpdateStatus,
    handleBulkCleanupPastIssues,
    isBatchUpdating,
    t
}) => {
    const [batchSelectValue, setBatchSelectValue] = React.useState('');

    const fmtCreatedAt = (createdAt?: string) => {
        if (!createdAt) return '-';
        const kst = new Date(new Date(createdAt).getTime() + 9 * 60 * 60 * 1000);
        const mo = String(kst.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(kst.getUTCDate()).padStart(2, '0');
        const hh = String(kst.getUTCHours()).padStart(2, '0');
        const mm = String(kst.getUTCMinutes()).padStart(2, '0');
        return `${mo}/${dd} ${hh}:${mm}`;
    };

    // [스봉이] KST 기준 오늘 날짜 계산 센스있게 해드려요 💅✨
    const todayKST = React.useMemo(() => {
        const now = new Date();
        const kstOffset = 9 * 60; // 9 hours
        const kstTime = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000);
        return kstTime.toISOString().split('T')[0];
    }, []);

    const isNotToday = (dateStr?: string) => {
        if (!dateStr) return false;
        return dateStr !== todayKST;
    };

    const findLocName = (id: string | undefined) =>
        locations.find(l => l.id === id || l.supabaseId === id || l.shortCode === id)?.name || id || '-';

    const paymentBadgeLabel = (booking: BookingState) => {
        if (booking.paymentMethod === 'cash') return '방문 현금';
        if (booking.paymentStatus === 'paid') {
            return booking.paymentMethod === 'paypal' ? '페이팔 결제완료' : '결제완료';
        }
        return '결제대기';
    };

    const paymentBadgeStyle = (booking: BookingState) => {
        if (booking.paymentMethod === 'cash') return 'bg-gray-50 text-gray-500 border-gray-200';
        if (booking.paymentStatus === 'paid') {
            return booking.paymentMethod === 'paypal'
                ? 'bg-blue-50 text-blue-600 border-blue-100'
                : 'bg-emerald-50 text-emerald-600 border-emerald-100';
        }
        return 'bg-amber-50 text-amber-600 border-amber-100';
    };

    const paymentBadgeDotStyle = (booking: BookingState) => {
        if (booking.paymentMethod === 'cash') return 'bg-gray-400';
        if (booking.paymentStatus === 'paid') {
            return booking.paymentMethod === 'paypal' ? 'bg-blue-500' : 'bg-emerald-500';
        }
        return 'bg-amber-500';
    };

    const cleanupTargetBookings = React.useMemo(() => {
        return filteredBookings.filter((booking) => {
            if (booking.isDeleted || booking.settlementStatus === 'deleted') return false;
            const hasIssueTrace = booking.status === BookingStatus.CANCELLED ||
                booking.status === BookingStatus.REFUNDED ||
                Boolean(booking.auditNote?.trim());
            if (!hasIssueTrace) return false;

            const cleanupBaseDate = booking.returnDate || booking.dropoffDate || booking.pickupDate;
            return Boolean(cleanupBaseDate) && cleanupBaseDate < todayKST;
        });
    }, [filteredBookings, todayKST]);

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-2">
                <div className="flex-1">
                    <h1 className="text-2xl md:text-4xl font-black tracking-tight text-bee-black">
                        {activeTab === 'DELIVERY_BOOKINGS' ? '여정(배송) 스마트 관리' : '여정(거치) 스마트 관리'}
                    </h1>
                </div>

                <div className="flex-1 min-w-0 flex justify-start lg:justify-center">
                    <div className="max-w-full overflow-x-auto no-scrollbar">
                        <div className="h-10 flex items-center flex-nowrap bg-white/50 backdrop-blur-3xl px-1.5 rounded-2xl border border-gray-200 min-w-max gap-0.5">
                            {activeTab === 'STORAGE_BOOKINGS' ? (
                                (['ALL', 'TODAY_IN', 'STORAGE', 'TODAY_OUT', 'COMPLETED', 'ISSUE'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveStatusTab(tab)}
                                        className={`h-7 shrink-0 whitespace-nowrap px-3 rounded-xl text-[11px] font-black transition-all ${activeStatusTab === tab ? 'bg-bee-yellow text-bee-black shadow-md shadow-bee-yellow/20' : 'text-gray-400 hover:text-bee-black hover:bg-white/70'}`}
                                    >
                                        {tab === 'ALL' ? (t.admin?.logistics?.filter_all || '전체') : tab === 'TODAY_IN' ? '오늘 입고' : tab === 'STORAGE' ? '보관중' : tab === 'TODAY_OUT' ? '오늘 픽업' : tab === 'COMPLETED' ? '완료' : '이슈/취소'}
                                    </button>
                                ))
                            ) : (
                                (['ALL', 'PENDING', 'TRANSIT', 'ARRIVED', 'COMPLETED', 'ISSUE'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveStatusTab(tab)}
                                        className={`h-7 shrink-0 whitespace-nowrap px-3 rounded-xl text-[11px] font-black transition-all ${activeStatusTab === tab ? 'bg-bee-yellow text-bee-black shadow-md shadow-bee-yellow/20' : 'text-gray-400 hover:text-bee-black hover:bg-white/70'}`}
                                    >
                                        {tab === 'ALL' ? '전체' : tab === 'PENDING' ? '접수 대기' : tab === 'TRANSIT' ? '이동중' : tab === 'ARRIVED' ? '도착' : tab === 'COMPLETED' ? '완료' : '이슈/취소'}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-start lg:justify-end gap-3">
                    {/* 날짜 구간 조회 필터 */}
                    <div className="h-10 flex items-center gap-2 bg-white/50 backdrop-blur-3xl px-3 rounded-2xl border border-bee-yellow/20 shadow-lg shadow-bee-yellow/5">
                        <i className="fa-solid fa-calendar-range text-bee-yellow text-xs shrink-0"></i>
                        <input
                            type="date"
                            value={searchStartDate}
                            onChange={(e) => setSearchStartDate(e.target.value)}
                            className="bg-transparent text-[11px] font-black outline-none cursor-pointer text-bee-black w-[110px]"
                            title="시작 날짜"
                        />
                        <span className="text-[10px] font-black text-gray-400">~</span>
                        <input
                            type="date"
                            value={searchEndDate}
                            onChange={(e) => setSearchEndDate(e.target.value)}
                            className="bg-transparent text-[11px] font-black outline-none cursor-pointer text-bee-black w-[110px]"
                            title="종료 날짜"
                        />
                        {(searchStartDate || searchEndDate) && (
                            <button
                                onClick={() => { setSearchStartDate(''); setSearchEndDate(''); }}
                                className="text-gray-400 hover:text-bee-black transition-colors shrink-0"
                                title="날짜 필터 초기화"
                            >
                                <i className="fa-solid fa-circle-xmark text-xs"></i>
                            </button>
                        )}
                    </div>

                    {onAddManual && (
                        <button
                            onClick={onAddManual}
                            className="h-10 px-4 bg-bee-yellow text-bee-black font-black rounded-2xl text-[11px] shadow-xl shadow-bee-yellow/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
                        >
                            <i className="fa-solid fa-plus text-[9px]"></i>
                            수동 예약 추가
                        </button>
                    )}
                </div>
            </div>

            {/* 완료 이력 날짜 필터 UI */}
            {activeStatusTab === 'COMPLETED' && setCompletedStartDate && setCompletedEndDate && (
                <div className="bg-bee-yellow/10 border border-bee-yellow/30 rounded-[28px] px-6 py-4 flex flex-nowrap items-center gap-4 overflow-x-auto no-scrollbar animate-fade-in-up">
                    <div className="flex shrink-0 items-center gap-2 text-bee-black">
                        <i className="fa-solid fa-flag-checkered text-sm text-bee-yellow"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest">완료 이력 조회 구간</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <input
                            type="date"
                            title="완료 시작일"
                            value={completedStartDate}
                            onChange={e => setCompletedStartDate(e.target.value)}
                            className="text-xs font-black bg-white border border-bee-yellow/30 rounded-xl px-3 py-2 outline-none focus:border-bee-yellow transition-colors cursor-pointer text-bee-black"
                        />
                        <span className="text-[10px] font-bold text-gray-400">에서</span>
                        <input
                            type="date"
                            title="완료 종료일"
                            value={completedEndDate}
                            onChange={e => setCompletedEndDate(e.target.value)}
                            className="text-xs font-black bg-white border border-bee-yellow/30 rounded-xl px-3 py-2 outline-none focus:border-bee-yellow transition-colors cursor-pointer text-bee-black"
                        />
                        <span className="text-[10px] font-bold text-gray-400">까지</span>
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                        <div className="text-[10px] font-black text-bee-black bg-white px-3 py-1.5 rounded-xl border border-bee-yellow/30">
                            {filteredBookings.length}건 완료
                        </div>
                    </div>
                </div>
            )}

            {/* 취소/환불 날짜 필터 UI */}
            {(activeStatusTab === 'CANCELLED' || activeStatusTab === 'ISSUE') && setCancelStartDate && setCancelEndDate && (
                <div className="bg-red-50/70 border border-red-100 rounded-[28px] px-6 py-4 flex flex-nowrap items-center gap-4 overflow-x-auto no-scrollbar animate-fade-in-up">
                    <div className="flex shrink-0 items-center gap-2 text-red-400">
                        <i className="fa-solid fa-calendar-xmark text-sm"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest">취소/환불 날짜 구간 필터 🗂️</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <input
                            type="date"
                            title="취소 시작일"
                            value={cancelStartDate}
                            onChange={e => setCancelStartDate(e.target.value)}
                            className="text-xs font-black bg-white border border-red-100 rounded-xl px-3 py-2 outline-none focus:border-red-300 transition-colors cursor-pointer text-bee-black"
                        />
                        <span className="text-[10px] font-bold text-red-300">에서</span>
                        <input
                            type="date"
                            title="취소 종료일"
                            value={cancelEndDate}
                            onChange={e => setCancelEndDate(e.target.value)}
                            className="text-xs font-black bg-white border border-red-100 rounded-xl px-3 py-2 outline-none focus:border-red-300 transition-colors cursor-pointer text-bee-black"
                        />
                        <span className="text-[10px] font-bold text-red-300">까지</span>
                    </div>
                    <div className="ml-auto flex shrink-0 items-center justify-end gap-2">
                        <div className="text-[10px] font-black text-red-400 bg-white px-3 py-1.5 rounded-xl border border-red-100">
                            {filteredBookings.length}건 조회됨
                        </div>
                        {cleanupTargetBookings.length > 0 && (
                            <button
                                onClick={() => handleBulkCleanupPastIssues(cleanupTargetBookings.map(booking => booking.id!).filter(Boolean))}
                                disabled={isBatchUpdating}
                                className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black shadow-lg shadow-red-200/60 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                title="지난 취소/환불/이슈 예약을 일괄 휴지통 이동"
                            >
                                <i className={`fa-solid ${isBatchUpdating ? 'fa-spinner animate-spin' : 'fa-trash-can'}`}></i>
                                지난 취소/환불/이슈 {cleanupTargetBookings.length}건 정리
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="bg-white/50 backdrop-blur-3xl p-2 md:p-10 rounded-[40px] shadow-lg border border-gray-200 overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/80 text-[10px] font-black uppercase text-gray-400 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        title="전체 선택"
                                        checked={filteredBookings.length > 0 && selectedBookingIds.length === filteredBookings.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedBookingIds(filteredBookings.map(b => b.id!));
                                            } else {
                                                setSelectedBookingIds([]);
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-gray-300 text-bee-yellow focus:ring-bee-yellow cursor-pointer"
                                    />
                                </th>
                                <th className="px-6 py-4">{t.admin?.logistics?.table?.id || 'ID / 예약 고객'}</th>
                                <th className="px-6 py-4">{activeTab === 'STORAGE_BOOKINGS' ? '보관 센터' : '이동 노선'}</th>
                                <th className="px-6 py-4">{activeTab === 'STORAGE_BOOKINGS' ? '보관 일정' : '집하 일자'}</th>
                                <th className="px-6 py-4">금융/정산 상태</th>
                                <th className="px-6 py-4">{t.admin?.logistics?.table?.status || '여정 관제 / 리얼타임'}</th>
                                <th className="px-6 py-4 text-center">{t.admin?.logistics?.table?.actions || '작업'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredBookings.length > 0 ? filteredBookings.map(b => (
                                <tr key={b.id} className={`group hover:bg-white/90 transition-all ${selectedBookingIds.includes(b.id!) ? 'bg-bee-yellow/5' : ''}`}>
                                    <td className="px-6 py-5">
                                        <input
                                            type="checkbox"
                                            title="선택"
                                            checked={selectedBookingIds.includes(b.id!)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedBookingIds([...selectedBookingIds, b.id!]);
                                                } else {
                                                    setSelectedBookingIds(selectedBookingIds.filter(id => id !== b.id));
                                                }
                                            }}
                                            className="w-4 h-4 rounded border-gray-300 text-bee-yellow focus:ring-bee-yellow cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <div className="px-2 py-0.5 bg-gray-900 text-white text-[9px] font-black w-fit rounded tracking-tighter">
                                                    {b.reservationCode || b.id?.slice(0, 8).toUpperCase()}
                                                </div>
                                                {b.nametagId && (
                                                    <div className="min-w-[24px] h-6 px-1.5 rounded-full bg-bee-yellow text-bee-black text-[10px] font-black flex items-center justify-center" title={`네임태그 #${b.nametagId}`}>
                                                        #{b.nametagId}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-black text-bee-black text-sm group-hover:text-bee-yellow transition-colors cursor-pointer" onClick={() => { setSelectedBooking({ ...b }); }}>
                                                {adminRole === 'super' ? b.userName : maskName(b.userName || '')}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-bold">
                                                {adminRole === 'super' ? b.userEmail : maskEmail(b.userEmail || '')}
                                            </span>
                                            <span className="text-[9px] text-gray-300 font-bold mt-0.5 flex items-center gap-1">
                                                <i className="fa-regular fa-clock text-[8px]"></i>
                                                {fmtCreatedAt(b.createdAt)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {b.serviceType === ServiceType.DELIVERY ? (
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase">FROM</span>
                                                    <span className="text-[11px] font-bold text-bee-black truncate max-w-[100px]">{findLocName(b.pickupLocation)}</span>
                                                    {(b.pickupDate || b.pickupTime) && (
                                                        <span className="text-[9px] text-gray-400 mt-0.5 tabular-nums">{(b.pickupDate || '').split('T')[0]}{b.pickupTime ? ` ${b.pickupTime}` : ''}</span>
                                                    )}
                                                </div>
                                                <i className="fa-solid fa-arrow-right-long text-bee-yellow/50 text-[10px]"></i>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase">TO</span>
                                                    <span className="text-[11px] font-bold text-bee-black truncate max-w-[100px]">{findLocName(b.dropoffLocation)}</span>
                                                    {(b.returnDate || b.dropoffDate || b.returnTime || b.deliveryTime) && (
                                                        <span className="text-[9px] text-gray-400 mt-0.5 tabular-nums">{((b.returnDate || b.dropoffDate) || '').split('T')[0]}{(b.returnTime || b.deliveryTime) ? ` ${b.returnTime || b.deliveryTime}` : ''}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-400 uppercase">FROM</span>
                                                <span className="text-[11px] font-bold text-bee-black">{findLocName(b.pickupLocation)}</span>
                                                {(b.pickupDate || b.pickupTime) && (
                                                    <span className="text-[9px] text-gray-400 mt-0.5 tabular-nums">{(b.pickupDate || '').split('T')[0]}{b.pickupTime ? ` ${b.pickupTime}` : ''}</span>
                                                )}
                                                {(b.returnDate || b.dropoffDate) && (
                                                    <span className="text-[9px] text-gray-300 mt-1 tabular-nums">→ {((b.returnDate || b.dropoffDate) || '').split('T')[0]}{(b.returnTime || b.deliveryTime) ? ` ${b.returnTime || b.deliveryTime}` : ''}</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className={`px-6 py-5 transition-colors ${isNotToday(b.pickupDate) ? 'bg-amber-50/50' : ''}`}>
                                        {b.serviceType === ServiceType.DELIVERY ? (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[11px] font-black ${isNotToday(b.pickupDate) ? 'text-amber-600' : 'text-bee-black'}`}>
                                                        {b.pickupDate}
                                                    </span>
                                                    {isNotToday(b.pickupDate) && (
                                                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black rounded uppercase tracking-tighter animate-pulse">
                                                            {new Date(b.pickupDate || '') > new Date(todayKST) ? 'Future' : 'Past'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[9px] font-bold text-gray-400 px-1.5 py-0.5 bg-gray-50 rounded-md w-fit italic">Items: {b.bags} Bags</div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[11px] font-black ${isNotToday(b.pickupDate) ? 'text-amber-600' : 'text-bee-black'}`}>
                                                        {b.pickupDate} ~ {b.returnDate || b.dropoffDate || b.pickupDate}
                                                    </span>
                                                    {isNotToday(b.pickupDate) && (
                                                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black rounded uppercase tracking-tighter animate-pulse">
                                                            Schedule Note
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[9px] font-bold text-gray-400 px-1.5 py-0.5 bg-gray-50 rounded-md w-fit">{b.pickupTime} - {b.returnTime || b.deliveryTime || ''} | {b.bags} Bags</div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1.5">
                                            {/* Tier 1: Payment */}
                                            <div className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full w-fit flex items-center gap-1.5 border ${paymentBadgeStyle(b)}`}>
                                                <span className={`w-1 h-1 rounded-full ${paymentBadgeDotStyle(b)}`}></span>
                                                {paymentBadgeLabel(b)}
                                            </div>
                                            {/* Tier 2: Settlement */}
                                            <div className={`text-[9px] font-black px-2 py-0.5 rounded-full w-fit flex items-center gap-1.5 border ${['정산확정', 'CONFIRMED'].includes(b.settlementStatus as string) ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                                <i className="fa-solid fa-coins text-[8px]"></i>
                                                {b.settlementStatus === 'CONFIRMED' ? '정산확정' : (b.settlementStatus || '정산미정')}
                                            </div>
                                            {/* Tier 3: Issue */}
                                            {b.auditNote ? (
                                                <div className="text-[9px] font-black px-2 py-0.5 rounded-full w-fit flex items-center gap-1.5 bg-orange-50 text-orange-600 border border-orange-100 animate-pulse">
                                                    <i className="fa-solid fa-triangle-exclamation text-[8px]"></i>
                                                    이슈 발생
                                                </div>
                                            ) : (
                                                <div className="text-[9px] font-black px-2 py-0.5 rounded-full w-fit flex items-center gap-1.5 bg-gray-50 text-gray-300 border border-gray-100 opacity-50">
                                                    <i className="fa-solid fa-check text-[8px]"></i>
                                                    지연없음
                                                </div>
                                            )}
                                            <div className="text-sm font-black text-bee-black tracking-tighter mt-1 tabular-nums">₩{(b.finalPrice || 0).toLocaleString()}</div>
                                            {(b as any).branchSettlementAmount > 0 && (
                                                <div className="text-[9px] font-bold text-green-600 tabular-nums">커미션 ₩{Number((b as any).branchSettlementAmount).toLocaleString()}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-2">
                                            <div className="relative group/select w-fit">
                                                <div 
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full z-10 shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                                                    style={{ backgroundColor: OPERATING_STATUS_CONFIG[BOOKING_STATUS_DISPLAY_MAP[b.status || BookingStatus.PENDING]].color }}
                                                />
                                                <select
                                                    value={b.status}
                                                    onChange={e => updateStatus(b.id!, e.target.value as BookingStatus)}
                                                    title="예약 상태 변경"
                                                    className="text-[10px] font-black pl-7 pr-10 py-2.5 rounded-2xl border-2 border-transparent bg-gray-50 shadow-inner cursor-pointer appearance-none transition-all hover:bg-white hover:border-bee-yellow hover:shadow-lg outline-none min-w-[140px] text-bee-black"
                                                >
                                                    {Object.values(BookingStatus).map(s => (
                                                        <option key={s} value={s}>
                                                            {OPERATING_STATUS_CONFIG[BOOKING_STATUS_DISPLAY_MAP[s]].label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <i className="fa-solid fa-caret-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 pointer-events-none group-hover/select:text-bee-black transition-colors"></i>
                                            </div>
                                            {b.auditNote && (
                                                <div className="text-[9px] text-orange-600 font-bold bg-orange-50/50 px-2.5 py-1.5 rounded-xl border border-orange-100 w-fit flex items-center gap-2 max-w-[180px]" title={b.auditNote}>
                                                    <i className="fa-solid fa-quote-left text-[7px] opacity-50"></i>
                                                    <span className="truncate">{b.auditNote}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleResendEmail(b)}
                                                disabled={sendingEmailId === b.id}
                                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-bee-black hover:text-bee-yellow text-gray-500 transition-all flex items-center justify-center"
                                                title="예약증 재발송"
                                            >
                                                {sendingEmailId === b.id ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-envelope"></i>}
                                            </button>
                                            <button
                                                onClick={() => handleRefund(b)}
                                                disabled={refundingId === b.id || b.status === BookingStatus.REFUNDED}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${b.status === BookingStatus.REFUNDED
                                                    ? 'bg-red-50 text-red-200 cursor-not-allowed'
                                                    : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'
                                                    }`}
                                                title="결제 취소(환불)"
                                            >
                                                {refundingId === b.id ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-rotate-left"></i>}
                                            </button>

                                            <button
                                                onClick={() => handlePrintLabel(b)}
                                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-bee-black hover:text-bee-yellow text-gray-500 transition-all flex items-center justify-center"
                                                title="라벨 출력"
                                             >
                                                <i className="fa-solid fa-print"></i>
                                             </button>

                                             {/* 취소/환불 건 휴지통 이동 (전체 관리자) */}
                                             {(b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REFUNDED) && (
                                                <button
                                                    onClick={() => handleSoftDelete(b.id!)}
                                                    className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-700 hover:text-white transition-all flex items-center justify-center"
                                                    title="휴지통으로 이동"
                                                >
                                                    <i className="fa-solid fa-trash-can text-xs"></i>
                                                </button>
                                             )}
                                             {/* 슈퍼관리자 전용 영구 삭제 버튼 */}
                                             {adminRole === 'super' && (b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REFUNDED) && (
                                                <button
                                                    onClick={() => handlePermanentDelete(b.id!)}
                                                    className="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center"
                                                    title="과거 기록 영구 삭제 (복구 불가)"
                                                >
                                                    <i className="fa-solid fa-times text-xs"></i>
                                                </button>
                                             )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center text-gray-400 font-bold">
                                        {isRefreshing ? '데이터를 실시간 동기화 중입니다...' : (activeTab === 'TRASH' ? '휴지통이 비었습니다. 텅 비어있네요! 💅' : '접수된 예약 내역이 없습니다. (No Bookings)')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden space-y-4">
                    {filteredBookings.length > 0 ? filteredBookings.map(b => (
                        <div key={b.id} className="bg-white/90 backdrop-blur-3xl p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col gap-5 relative overflow-hidden group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="px-2 py-0.5 bg-gray-900 text-white text-[8px] font-black rounded tracking-tighter">
                                            {b.reservationCode || b.id?.slice(0, 8).toUpperCase()}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[10px] font-black ${isNotToday(b.pickupDate) ? 'text-amber-600' : 'text-gray-400'}`}>
                                                {b.pickupDate}
                                            </span>
                                            {isNotToday(b.pickupDate) && (
                                                <span className="px-1 py-0.5 bg-amber-100 text-amber-700 text-[7px] font-black rounded border border-amber-200 uppercase">
                                                    Caution
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <h4 className="font-black text-lg text-bee-black group-hover:text-bee-yellow transition-colors cursor-pointer" onClick={() => { setSelectedBooking({ ...b }); }}>
                                        {adminRole === 'super' ? b.userName : maskName(b.userName || '')}
                                    </h4>
                                    <span className="text-[9px] text-gray-300 font-bold flex items-center gap-1 mt-0.5">
                                        <i className="fa-regular fa-clock text-[8px]"></i>
                                        접수 {fmtCreatedAt(b.createdAt)}
                                    </span>
                                </div>
                                <select
                                    value={b.status}
                                    onChange={e => updateStatus(b.id!, e.target.value as BookingStatus)}
                                    title="예약 상태 변경 (모바일)"
                                    className={`text-[9px] font-black py-2 px-3 rounded-xl border-none outline-none shadow-sm cursor-pointer appearance-none ${getStatusStyle(b.status || BookingStatus.PENDING)}`}
                                >
                                    {Object.values(BookingStatus).map(s => <option key={s} value={s}>{OPERATING_STATUS_CONFIG[BOOKING_STATUS_DISPLAY_MAP[s]].label}</option>)}
                                </select>
                            </div>

                            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                {b.serviceType === ServiceType.DELIVERY ? (
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">FROM</span>
                                            <span className="font-black text-xs text-bee-black block truncate">{findLocName(b.pickupLocation)}</span>
                                            {(b.pickupDate || b.pickupTime) && (
                                                <span className="text-[9px] text-gray-400 mt-0.5 block tabular-nums">{(b.pickupDate || '').split('T')[0]}{b.pickupTime ? ` ${b.pickupTime}` : ''}</span>
                                            )}
                                        </div>
                                        <i className="fa-solid fa-arrow-right-long text-bee-yellow text-xs opacity-50"></i>
                                        <div className="flex-1 text-right">
                                            <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">TO</span>
                                            <span className="font-black text-xs text-bee-black block truncate">{findLocName(b.dropoffLocation)}</span>
                                            {(b.returnDate || b.dropoffDate || b.returnTime || b.deliveryTime) && (
                                                <span className="text-[9px] text-gray-400 mt-0.5 block tabular-nums">{((b.returnDate || b.dropoffDate) || '').split('T')[0]}{(b.returnTime || b.deliveryTime) ? ` ${b.returnTime || b.deliveryTime}` : ''}</span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-black text-gray-400 uppercase">FROM</span>
                                            <div className="text-right">
                                                <span className="font-black text-xs text-bee-black block">{findLocName(b.pickupLocation)}</span>
                                                {(b.pickupDate || b.pickupTime) && (
                                                    <span className="text-[9px] text-gray-400 tabular-nums">{(b.pickupDate || '').split('T')[0]}{b.pickupTime ? ` ${b.pickupTime}` : ''}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-gray-100 pt-2">
                                            <span className="text-[8px] font-black text-gray-400 uppercase">TO</span>
                                            <div className="text-right">
                                                <span className="font-black text-xs text-bee-black block">{findLocName(b.dropoffLocation || b.pickupLocation)}</span>
                                                {(b.returnDate || b.dropoffDate) && (
                                                    <span className="text-[9px] text-gray-400 tabular-nums">{((b.returnDate || b.dropoffDate) || '').split('T')[0]}{(b.returnTime || b.deliveryTime) ? ` ${b.returnTime || b.deliveryTime}` : ''}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 3-Tier Badges for Mobile - [스봉이] 줄바꿈 방지 및 가독성 최적화 💅 */}
                            <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-2 pb-1">
                                <div className={`shrink-0 text-[8px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 border whitespace-nowrap ${paymentBadgeStyle(b)}`}>
                                    <span className={`w-1 h-1 rounded-full ${paymentBadgeDotStyle(b)}`}></span>
                                    {paymentBadgeLabel(b)}
                                </div>
                                <div className="shrink-0 text-[8px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 border whitespace-nowrap bg-blue-50 text-blue-600 border-blue-100">
                                    <i className="fa-solid fa-coins text-[7px]"></i>
                                    {b.settlementStatus || '정산미정'}
                                </div>
                                {b.auditNote && (
                                    <div className="shrink-0 text-[8px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 bg-orange-50 text-orange-600 border border-orange-100 whitespace-nowrap animate-pulse">
                                        <i className="fa-solid fa-triangle-exclamation text-[7px]"></i>
                                        이슈 대응필요
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                <div className="flex gap-2.5">
                                    <button
                                        onClick={() => handleResendEmail(b)}
                                        disabled={sendingEmailId === b.id}
                                        className="w-9 h-9 rounded-full bg-gray-50 text-gray-400 hover:bg-bee-black hover:text-bee-yellow flex items-center justify-center transition-all border border-gray-100"
                                        title="이메일 재전송"
                                    >
                                        {sendingEmailId === b.id ? <i className="fa-solid fa-spinner animate-spin text-xs"></i> : <i className="fa-solid fa-envelope text-xs"></i>}
                                    </button>
                                    <button
                                        onClick={() => handleRefund(b)}
                                        disabled={refundingId === b.id || b.status === BookingStatus.REFUNDED}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border ${b.status === BookingStatus.REFUNDED
                                            ? 'bg-red-50 text-red-200 border-red-50'
                                            : 'bg-red-50 text-red-500 border-red-100 hover:bg-red-500 hover:text-white'
                                            }`}
                                        title="환불 처리"
                                    >
                                        {refundingId === b.id ? <i className="fa-solid fa-spinner animate-spin text-xs"></i> : <i className="fa-solid fa-rotate-left text-xs"></i>}
                                    </button>
                                     <button onClick={() => handlePrintLabel(b)} title="라벨 출력" className="w-9 h-9 rounded-full bg-gray-50 hover:bg-bee-black hover:text-bee-yellow text-gray-500 transition-all border border-gray-100 flex items-center justify-center">
                                        <i className="fa-solid fa-print text-xs"></i>
                                    </button>
                                    {/* 취소/환불 건 휴지통 이동 (전체 관리자) */}
                                    {(b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REFUNDED) && (
                                        <button
                                            onClick={() => handleSoftDelete(b.id!)}
                                            className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-700 hover:text-white transition-all border border-gray-200 flex items-center justify-center"
                                            title="휴지통으로 이동"
                                        >
                                            <i className="fa-solid fa-trash-can text-xs"></i>
                                        </button>
                                    )}
                                    {adminRole === 'super' && (b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REFUNDED) && (
                                        <button
                                            onClick={() => handlePermanentDelete(b.id!)}
                                            className="w-9 h-9 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-100 flex items-center justify-center"
                                            title="영구 삭제"
                                        >
                                            <i className="fa-solid fa-times text-xs"></i>
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-black text-xl text-bee-black tracking-tighter tabular-nums">₩{(b.finalPrice || 0).toLocaleString()}</span>
                                    {(b as any).branchSettlementAmount > 0 && (
                                        <span className="text-[10px] font-bold text-green-600 tabular-nums">커미션 ₩{Number((b as any).branchSettlementAmount).toLocaleString()}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="bg-white/80 backdrop-blur-3xl p-10 rounded-[24px] text-center border border-gray-200 shadow-sm">
                            <i className="fa-solid fa-folder-open text-gray-300 text-3xl mb-3"></i>
                            <p className="text-xs font-bold text-gray-400">{activeTab === 'TRASH' ? '휴지통이 비었습니다. 💅' : '접수된 예약 내역이 없습니다.'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 일괄 처리 플로팅 액션바 */}
            {selectedBookingIds.length > 0 && (
                <div className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-32px)] md:w-auto md:min-w-[520px] max-w-2xl px-4">
                    <div className="bg-gray-900 px-6 py-4 md:px-8 md:py-5 rounded-[28px] shadow-[0_8px_40px_rgba(0,0,0,0.55)] border border-bee-yellow/30 flex flex-col md:flex-row items-center gap-4 md:gap-8">
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-bee-yellow rounded-2xl flex items-center justify-center shadow-lg shadow-bee-yellow/30">
                                    <i className="fa-solid fa-check text-bee-black text-sm font-black"></i>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-bee-yellow text-[9px] font-black uppercase tracking-widest">선택됨</span>
                                    <span className="text-white text-lg font-black leading-none">{selectedBookingIds.length}<span className="text-xs ml-1 text-gray-400 font-medium">건</span></span>
                                </div>
                            </div>
                            <div className="hidden md:block h-10 w-[1px] bg-white/10 mx-2"></div>
                            <button
                                onClick={() => setSelectedBookingIds([])}
                                className="md:hidden text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-tighter px-3 py-2 bg-white/10 rounded-xl border border-white/10 transition-all"
                            >
                                취소
                            </button>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-none">
                                <select
                                    value={batchSelectValue}
                                    onChange={(e) => {
                                        setBatchSelectValue(e.target.value);
                                    }}
                                    disabled={isBatchUpdating}
                                    title="일괄 상태 변경"
                                    className="w-full md:w-[180px] bg-white text-bee-black text-[11px] font-black px-4 py-3 pr-10 rounded-2xl outline-none transition-all cursor-pointer appearance-none shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <option value="">상태 선택...</option>
                                    <option value="접수완료">접수 대기</option>
                                    <option value="이동중">이동중</option>
                                    <option value="목적지도착">도착</option>
                                    <option value="완료">✅ 완료 처리</option>
                                    <option value="취소됨">취소/환불</option>
                                </select>
                                <i className={`fa-solid ${isBatchUpdating ? 'fa-spinner animate-spin' : 'fa-chevron-down'} absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none`}></i>
                            </div>

                            <button
                                onClick={() => {
                                    if (!batchSelectValue) {
                                        alert('변경할 상태를 먼저 선택해 주세요.');
                                        return;
                                    }
                                    handleBatchUpdateStatus(batchSelectValue as BookingStatus);
                                    setBatchSelectValue('');
                                }}
                                disabled={!batchSelectValue || isBatchUpdating}
                                className="flex items-center gap-2 text-bee-black text-[11px] font-black px-4 py-3 bg-bee-yellow hover:bg-bee-yellow/90 rounded-2xl transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                <i className="fa-solid fa-check text-[10px]"></i>
                                확인
                            </button>

                            <button
                                onClick={() => setSelectedBookingIds([])}
                                className="hidden md:flex items-center gap-2 text-gray-400 hover:text-white text-[10px] font-bold px-4 py-3 bg-white/10 hover:bg-white/15 rounded-2xl border border-white/10 transition-all"
                            >
                                <i className="fa-solid fa-xmark text-[10px]"></i>
                                선택 해제
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogisticsTab;
