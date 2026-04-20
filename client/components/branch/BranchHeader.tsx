import React, { useMemo } from 'react';
import { BookingState, BookingStatus, LocationOption, ServiceType } from '../../types';

interface BranchHeaderProps {
    currentBranch: LocationOption | undefined;
    branchId: string;
    bookings: BookingState[];
    kioskSlug?: string | null;
    onManualBooking?: () => void;
    onExportCSV?: () => void;
    onLogout?: () => void;
    onQRScan?: () => void;
}

const BranchHeader: React.FC<BranchHeaderProps> = ({
    currentBranch, branchId, bookings, kioskSlug, onManualBooking, onExportCSV, onLogout, onQRScan
}) => {
    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = bookings.filter(b => (b.pickupDate || '').split('T')[0] === today);
        const thisMonth = today.slice(0, 7);
        const completedThisMonth = bookings.filter(b =>
            b.status === BookingStatus.COMPLETED &&
            (b.pickupDate || '').slice(0, 7) === thisMonth
        );
        const deliveryRate = currentBranch?.commissionRates?.delivery ?? 0;
        const storageRate = currentBranch?.commissionRates?.storage ?? 0;
        const monthlyCommission = completedThisMonth.reduce((sum, b) => {
            // branchSettlementAmount = 이미 커미션율이 적용된 지점 지급 확정액
            const bsa = (b as any).branchSettlementAmount;
            if (bsa != null && Number(bsa) > 0) return sum + Math.round(Number(bsa));
            // 미설정 시 전체 금액에 커미션율 적용
            const fullPrice = Number((b as any).settlementHardCopyAmount ?? b.finalPrice ?? 0);
            const rate = b.serviceType === ServiceType.DELIVERY ? deliveryRate : storageRate;
            return sum + Math.floor(fullPrice * (rate / 100));
        }, 0);
        return {
            total: bookings.length,
            pending: bookings.filter(b => b.status === BookingStatus.PENDING).length,
            active: bookings.filter(b => [BookingStatus.CONFIRMED, BookingStatus.TRANSIT, BookingStatus.STORAGE, BookingStatus.ARRIVED].includes(b.status as any)).length,
            completed: bookings.filter(b => b.status === BookingStatus.COMPLETED).length,
            todayCount: todayBookings.length,
            monthlyCommission,
            deliveryRate,
            storageRate,
        };
    }, [bookings, currentBranch]);

    const branchName = currentBranch?.name || branchId;
    const branchAddress = currentBranch?.address || '';

    return (
        <div className="bg-bee-black rounded-[2rem] overflow-hidden shadow-2xl shadow-black/20">
            {/* Top section — branch identity + actions */}
            <div className="px-6 md:px-8 pt-7 pb-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-black text-bee-yellow/60 uppercase tracking-[0.3em]">Branch Admin</span>
                        <span className="w-1 h-1 rounded-full bg-bee-yellow/30" />
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Dashboard</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight truncate">
                        {branchName}
                    </h1>
                    {branchAddress && (
                        <p className="text-[11px] text-white/40 font-medium mt-1 truncate">
                            <i className="fa-solid fa-location-dot mr-1.5 text-white/20" />{branchAddress}
                        </p>
                    )}
                    {/* Commission badges */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-black text-blue-300">
                            <i className="fa-solid fa-plane-departure text-[8px]" />
                            배송 {stats.deliveryRate}%
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-black text-emerald-300">
                            <i className="fa-solid fa-box text-[8px]" />
                            보관 {stats.storageRate}%
                        </span>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap md:flex-nowrap">
                    {onQRScan && (
                        <button
                            onClick={onQRScan}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bee-yellow text-bee-black font-black text-xs shadow-lg shadow-bee-yellow/30 hover:scale-[1.03] active:scale-95 transition-all"
                        >
                            <i className="fa-solid fa-qrcode text-sm" />
                            QR 스캔
                        </button>
                    )}
                    {kioskSlug && (
                        <a
                            href={`/kiosk/${encodeURIComponent(kioskSlug)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bee-yellow text-bee-black font-black text-xs shadow-lg shadow-bee-yellow/30 hover:scale-[1.03] active:scale-95 transition-all"
                        >
                            <i className="fa-solid fa-tablet-screen-button text-sm" />
                            키오스크 열기
                        </a>
                    )}
                    {onManualBooking && (
                        <button
                            onClick={onManualBooking}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-black text-xs hover:bg-white/15 transition-all"
                        >
                            <i className="fa-solid fa-plus text-sm" />
                            수기 예약
                        </button>
                    )}
                    {onExportCSV && (
                        <button
                            onClick={onExportCSV}
                            title="CSV 내보내기"
                            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all flex items-center justify-center"
                        >
                            <i className="fa-solid fa-download text-xs" />
                        </button>
                    )}
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            title="로그아웃"
                            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/20 transition-all flex items-center justify-center"
                        >
                            <i className="fa-solid fa-arrow-right-from-bracket text-xs" />
                        </button>
                    )}
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-5 border-t border-white/8">
                {[
                    { label: '오늘 예약', value: stats.todayCount, icon: 'fa-sun', accent: 'text-bee-yellow', bg: 'bg-bee-yellow/10' },
                    { label: '전체', value: stats.total, icon: 'fa-layer-group', accent: 'text-white', bg: '' },
                    { label: '대기', value: stats.pending, icon: 'fa-hourglass-half', accent: 'text-amber-400', bg: '' },
                    { label: '활성', value: stats.active, icon: 'fa-bolt', accent: 'text-blue-400', bg: '' },
                    { label: '이달 커미션', value: `₩${stats.monthlyCommission.toLocaleString()}`, icon: 'fa-coins', accent: 'text-emerald-400', bg: '', wide: true },
                ].map(({ label, value, icon, accent, bg, wide }) => (
                    <div key={label} className={`${wide ? 'col-span-2 md:col-span-1' : ''} ${bg} px-5 md:px-6 py-4 border-r border-white/8 last:border-r-0 flex flex-col gap-0.5`}>
                        <div className="flex items-center gap-1.5 mb-1">
                            <i className={`fa-solid ${icon} text-[9px] ${accent} opacity-60`} />
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{label}</span>
                        </div>
                        <span className={`text-xl md:text-2xl font-black tabular-nums leading-none ${accent}`}>{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BranchHeader;
