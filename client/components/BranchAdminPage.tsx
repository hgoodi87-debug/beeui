import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { BookingState, BookingStatus, LocationOption, ServiceType, StorageTier } from '../types';
import BookingDetailModal from './admin/BookingDetailModal';
import BranchHeader from './branch/BranchHeader';
import { DEFAULT_STORAGE_TIERS as PRICING_DEFAULT_STORAGE_TIERS } from '../src/domains/booking/bagCategoryUtils';
import { getSupabaseBaseUrl } from '../services/supabaseRuntime';
import { isSupabaseDataEnabled, supabaseMutate } from '../services/supabaseClient';

const BranchStaffTab = lazy(() => import('./branch/BranchStaffTab'));
const BranchRevenueTab = lazy(() => import('./branch/BranchRevenueTab'));

interface BranchAdminPageProps {
    branchId: string;
    adminRole?: string;
    lang: string;
    t: any;
    onBack: () => void;
}

const BOOKING_DETAIL_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isSupabaseBookingDetailId = (value?: string | null) =>
    BOOKING_DETAIL_UUID_PATTERN.test(String(value || '').trim());

type TabKey = 'ALL' | 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'STAFF' | 'REVENUE';

const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'ALL', label: '전체', icon: 'fa-list' },
    { key: 'PENDING', label: '대기', icon: 'fa-clock' },
    { key: 'ACTIVE', label: '활성', icon: 'fa-truck-fast' },
    { key: 'COMPLETED', label: '완료', icon: 'fa-check-double' },
    { key: 'CANCELLED', label: '취소/환불', icon: 'fa-ban' },
    { key: 'STAFF', label: '직원', icon: 'fa-users' },
    { key: 'REVENUE', label: '정산', icon: 'fa-coins' },
];

const BranchAdminPage: React.FC<BranchAdminPageProps> = ({ branchId: propsBranchId, adminRole = 'staff', lang, t, onBack }) => {
    const navigate = useNavigate();
    const path = window.location.pathname;
    const branchId = propsBranchId || (path.startsWith('/branch/') ? path.split('/')[2] : '');

    const [bookings, setBookings] = useState<BookingState[]>([]);
    const [locations, setLocations] = useState<LocationOption[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<TabKey>('ALL');
    const [selectedBooking, setSelectedBooking] = useState<BookingState | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
    const [refundingId, setRefundingId] = useState<string | null>(null);
    const [staff, setStaff] = useState<any[]>([]);
    const [completedStartDate, setCompletedStartDate] = useState<string>(() => {
        const d = new Date(); d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [completedEndDate, setCompletedEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (!branchId) return;
        setIsLoading(true);
        StorageService.getLocations().then(setLocations);
        const unsubscribeBookings = StorageService.subscribeBookingsByLocation(branchId, (data) => {
            setBookings(data);
            setIsLoading(false);
        });
        const unsubscribeAdmins = StorageService.subscribeAdmins((data) => {
            setStaff(data.filter(a => a.branchId === branchId));
        });
        return () => { unsubscribeBookings(); unsubscribeAdmins(); };
    }, [branchId]);

    const currentBranch = useMemo(() => locations.find(l => l.id === branchId), [locations, branchId]);

    const branchIdentifiers = useMemo(() => {
        const ids = new Set<string>();
        ids.add(branchId);
        if (currentBranch) {
            if (currentBranch.id) ids.add(currentBranch.id);
            if (currentBranch.shortCode) ids.add(currentBranch.shortCode);
            if ((currentBranch as any).branchCode) ids.add((currentBranch as any).branchCode);
            if ((currentBranch as any).branchId) ids.add((currentBranch as any).branchId);
            if (currentBranch.name) ids.add(currentBranch.name);
        }
        return ids;
    }, [branchId, currentBranch]);

    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            const isInternalBee = (b.id?.toUpperCase().startsWith('BEE')) || (b.reservationCode?.toUpperCase().startsWith('BEE'));
            if (isInternalBee) return false;

            const isRelatedToBranch =
                branchIdentifiers.has(b.pickupLocation || '') ||
                branchIdentifiers.has(b.dropoffLocation || '') ||
                branchIdentifiers.has(b.branchId || '') ||
                branchIdentifiers.has((b as any).pickupLocationId || '');
            if (!isRelatedToBranch) return false;

            const matchesSearch =
                b.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.reservationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.id?.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            if (activeTab === 'ALL') return true;
            if (activeTab === 'PENDING') return b.status === BookingStatus.PENDING;
            if (activeTab === 'ACTIVE') return [BookingStatus.CONFIRMED, BookingStatus.TRANSIT, BookingStatus.STORAGE, BookingStatus.ARRIVED].includes(b.status as any);
            if (activeTab === 'COMPLETED') {
                if (b.status !== BookingStatus.COMPLETED) return false;
                const bDateStr = (b.pickupDate || b.createdAt || '').split('T')[0];
                if (bDateStr) return bDateStr >= completedStartDate && bDateStr <= completedEndDate;
                return true;
            }
            if (activeTab === 'CANCELLED') return [BookingStatus.CANCELLED, BookingStatus.REFUNDED].includes(b.status as any);
            return true;
        });
    }, [bookings, searchTerm, activeTab, completedStartDate, completedEndDate, branchIdentifiers]);

    const handleCompletedDateChange = (type: 'start' | 'end', val: string) => {
        const newStart = type === 'start' ? val : completedStartDate;
        const newEnd = type === 'end' ? val : completedEndDate;
        const dStart = new Date(newStart);
        const dEnd = new Date(newEnd);
        if (dStart > dEnd) { alert('시작일은 종료일보다 클 수 없습니다.'); return; }
        const diffDays = Math.ceil(Math.abs(dEnd.getTime() - dStart.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 90) { alert('조회 기간은 최대 90일입니다.'); return; }
        if (type === 'start') setCompletedStartDate(val); else setCompletedEndDate(val);
    };

    const bt = t.branch_admin || {};

    const handleStatusUpdate = async (id: string, status: BookingStatus) => {
        try { await StorageService.updateBooking(id, { status }); alert(bt.status_update_success || 'Status updated'); }
        catch (e) { console.error(e); alert('Update failed'); }
    };

    const handleUpdateBooking = async () => {
        if (!selectedBooking?.id) return;
        setIsSaving(true);
        try { await StorageService.updateBooking(selectedBooking.id, selectedBooking); alert(bt.booking_update_success || '예약 정보가 업데이트되었습니다.'); setSelectedBooking(null); }
        catch (e) { console.error(e); alert('Update failed'); }
        finally { setIsSaving(false); }
    };

    const handleResendEmail = async (booking: BookingState) => {
        if (!booking.id) return;
        if (!confirm(`Is it okay to resend the voucher email to ${booking.userName} (${booking.userEmail})?`)) return;
        setSendingEmailId(booking.id);
        try {
            if (!isSupabaseDataEnabled()) throw new Error('Supabase booking notification endpoint is not configured.');
            const bookingDetailId = isSupabaseBookingDetailId(booking.id) ? booking.id : String((await StorageService.getBooking(booking.id))?.id || '').trim();
            if (!isSupabaseBookingDetailId(bookingDetailId)) throw new Error('Supabase booking_details id를 찾을 수 없습니다.');
            const SUPABASE_URL = getSupabaseBaseUrl();
            const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
            const res = await fetch(`${SUPABASE_URL}/functions/v1/on-booking-created`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
                body: JSON.stringify({ type: 'INSERT', table: 'booking_details', record: { id: bookingDetailId, reservation_code: booking.reservationCode, user_name: booking.userName, user_email: booking.userEmail, service_type: booking.serviceType, pickup_date: booking.pickupDate, pickup_time: booking.pickupTime, pickup_location: booking.pickupLocation, final_price: booking.finalPrice } }),
            });
            if (!res.ok) throw new Error(`Edge Function 호출 실패 [${res.status}]`);
            alert('Email sent successfully!');
        } catch (error: any) { console.error("Failed to send email:", error); alert(`Failed to send email: ${error.message}`); }
        finally { setSendingEmailId(null); }
    };

    const handleRefund = async (booking: BookingState) => {
        if (!booking.id) return;
        if (!confirm(`[최종 확인]\n\n예약번호: ${booking.id}\n고객명: ${booking.userName}\n\n정말로 반품(환불) 처리하시겠습니까?`)) return;
        setRefundingId(booking.id);
        try {
            if (!isSupabaseDataEnabled()) throw new Error('Supabase booking storage is not configured.');
            const bookingDetailId = isSupabaseBookingDetailId(booking.id) ? booking.id : String((await StorageService.getBooking(booking.id))?.id || '').trim();
            if (!isSupabaseBookingDetailId(bookingDetailId)) throw new Error('Supabase booking_details id를 찾을 수 없습니다.');
            await supabaseMutate(`booking_details?id=eq.${encodeURIComponent(bookingDetailId)}`, 'PATCH', { settlement_status: 'refunded' });
            alert('반품(환불) 처리가 완료되었습니다.');
        } catch (error: any) { console.error("Failed to process refund:", error); alert(`반품 처리 실패: ${error.message}`); }
        finally { setRefundingId(null); }
    };

    const getStatusStyle = (status: BookingStatus) => {
        switch (status) {
            case BookingStatus.PENDING: return 'text-amber-600 bg-bee-yellow/20';
            case BookingStatus.STORAGE: return 'text-blue-700 bg-blue-100';
            case BookingStatus.TRANSIT: return 'text-indigo-600 bg-indigo-100';
            case BookingStatus.ARRIVED: return 'text-purple-700 bg-purple-100';
            case BookingStatus.COMPLETED: return 'text-green-700 bg-green-100';
            case BookingStatus.CANCELLED: return 'text-red-500 bg-red-50';
            case BookingStatus.REFUNDED: return 'text-gray-400 bg-gray-50 border border-gray-100';
            default: return 'text-gray-500 bg-gray-100';
        }
    };

    const handlePrintLabel = (booking: BookingState) => {
        const originName = locations.find(l => l.id === booking.pickupLocation || l.shortCode === booking.pickupLocation)?.name || booking.pickupLocation;
        const destName = locations.find(l => l.id === booking.dropoffLocation || l.shortCode === booking.dropoffLocation)?.name || booking.dropoffLocation;
        const printWindow = window.open('', '', 'width=1200,height=800');
        if (!printWindow) return;
        printWindow.document.write(`<html><head><title>Beeliber Label - ${booking.id}</title><style>@page{size:750mm 500mm landscape;margin:0}*{box-sizing:border-box}body{font-family:'Inter','Apple SD Gothic Neo',sans-serif;margin:0;padding:30mm;width:750mm;height:500mm;display:flex;flex-direction:column;background:#fff;color:#000;overflow:hidden;zoom:0.1;-moz-transform:scale(0.1);-moz-transform-origin:0 0}.header{display:flex;justify-content:space-between;align-items:center;border-bottom:15px solid #ffcb05;padding-bottom:15mm;margin-bottom:20mm}.logo{font-size:100px;font-weight:1000;font-style:italic;letter-spacing:-5px}.service-type{font-size:60px;font-weight:900;background:#000;color:#ffcb05;padding:8mm 25mm;border-radius:30px;text-transform:uppercase}.main-content{flex:1;display:grid;grid-template-columns:1.2fr 1fr;gap:30mm}.info-box{background:#fdfdfd;border:5px solid #f0f0f0;border-radius:60px;padding:20mm;display:flex;flex-direction:column;justify-content:center}.label{font-size:32px;color:#999;font-weight:900;text-transform:uppercase;letter-spacing:8px;margin-bottom:10mm}.value{font-size:85px;font-weight:1000;line-height:1.1;word-break:break-all}.highlight-value{color:#ffcb05;background:#000;display:inline-block;padding:5mm 15mm;border-radius:20px}.booking-id-section{grid-column:span 2;background:#ffcb05;padding:15mm;border-radius:50px;text-align:center;margin-top:10mm}.booking-id-label{font-size:32px;font-weight:900;color:rgba(0,0,0,0.5);letter-spacing:15px;margin-bottom:5mm}.booking-id-value{font-size:180px;font-weight:1000;letter-spacing:-5px;color:#000}.footer{margin-top:20mm;display:flex;justify-content:space-between;align-items:flex-end;border-top:4px solid #f0f0f0;padding-top:10mm;font-size:28px;font-weight:bold;color:#bbb;letter-spacing:2px}.route-info{display:flex;flex-direction:column;gap:10mm}.route-step{display:flex;align-items:center;gap:10mm}.route-dot{width:30px;height:30px;border-radius:50%;background:#ffcb05}.route-dot-end{background:#000}.route-arrow{color:#ffcb05;font-size:60px;margin-left:20mm;margin-top:-5mm;margin-bottom:-5mm}</style></head><body><div class="header"><div class="logo">beeliber</div><div class="service-type">${booking.serviceType}</div></div><div class="main-content"><div class="info-box"><div><div class="label">Customer</div><div class="value">${booking.userName}</div></div><div style="margin-top:15mm"><div class="label">Schedule</div><div class="value">${booking.pickupDate}<br/><span class="highlight-value">${booking.pickupTime}</span></div></div></div><div class="info-box" style="border-left:15px solid #ffcb05"><div class="label">Route</div><div class="route-info"><div class="route-step"><div class="route-dot"></div><div class="value">${originName}</div></div><div class="route-arrow">&darr;</div><div class="route-step"><div class="route-dot route-dot-end"></div><div class="value">${destName || '-'}</div></div></div></div><div class="booking-id-section"><div class="booking-id-label">DELIVERY CODE</div><div class="booking-id-value">${booking.id}</div></div></div><div class="footer"><div>BEELIBER GLOBAL LOGISTICS</div><div>PRINTED: ${new Date().toLocaleString()}</div></div><script>window.onload=function(){window.print();window.onafterprint=function(){window.close()}}</script></body></html>`);
        printWindow.document.close();
    };

    const handleExportCSV = () => {
        if (bookings.length === 0) { alert('내보낼 데이터가 없습니다.'); return; }
        const BOM = '\uFEFF';
        const headers = ['예약번호', '상태', '성함', '픽업날짜', '반납날짜', '픽업장소', '도착장소', '짐 개수', '생성일'];
        const rows = bookings.map(b => {
            const pickupLoc = locations.find(l => l.id === b.pickupLocation || l.shortCode === b.pickupLocation)?.name || b.pickupLocation;
            const dropoffLoc = locations.find(l => l.id === b.dropoffLocation || l.shortCode === b.dropoffLocation)?.name || b.dropoffLocation;
            return [b.id, b.status, `"${(b.userName || '').replace(/"/g, '""')}"`, b.pickupDate, b.returnDate || '-', `"${(pickupLoc || '').replace(/"/g, '""')}"`, `"${(dropoffLoc || '').replace(/"/g, '""')}"`, b.bags || 0, b.createdAt].join(',');
        });
        const blob = new Blob([BOM + headers.join(',') + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `branch_${branchId}_bookings_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const isBookingTab = !['STAFF', 'REVENUE'].includes(activeTab);

    return (
        <div className="min-h-screen bg-gray-50 text-bee-black font-sans">
            {/* Nav */}
            <nav className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 z-40">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} title="Back" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-bee-black">
                            <i className="fa-solid fa-chevron-left"></i>
                        </button>
                        <h1 className="text-lg md:text-xl font-black italic tracking-tighter">
                            <span className="text-bee-yellow">BEE</span> ADMIN
                            <span className="ml-2 text-[10px] font-black bg-bee-black text-bee-yellow px-2 py-0.5 rounded-full uppercase tracking-widest not-italic align-middle">
                                {currentBranch?.name || branchId}
                            </span>
                        </h1>
                    </div>
                    <div className="flex gap-2 md:gap-3">
                        <button onClick={() => navigate(`/admin/branch/${branchId}/booking`)} className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bee-yellow text-bee-black font-black text-sm shadow-lg shadow-bee-yellow/20 hover:scale-105 transition-all">
                            <i className="fa-solid fa-plus"></i> {bt.manual_booking_btn || '수기 예약'}
                        </button>
                        <button onClick={() => navigate(`/admin/branch/${branchId}/booking`)} className="md:hidden w-10 h-10 rounded-xl bg-bee-yellow text-bee-black flex items-center justify-center" title="수기 예약">
                            <i className="fa-solid fa-plus"></i>
                        </button>
                        <button onClick={handleExportCSV} className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-500 font-black text-sm hover:bg-gray-200 transition-all">
                            <i className="fa-solid fa-download"></i> 내보내기
                        </button>
                        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 hover:text-bee-black transition-colors flex items-center justify-center" title="로그아웃" aria-label="로그아웃">
                            <i className="fa-solid fa-arrow-right-from-bracket"></i>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
                {/* Stats header */}
                <BranchHeader currentBranch={currentBranch} branchId={branchId} bookings={bookings} />

                {/* Tabs + Search */}
                <div className="flex flex-col xl:flex-row gap-3 items-center justify-between">
                    <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-full xl:w-fit overflow-x-auto no-scrollbar">
                        {TABS.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 md:flex-none px-4 md:px-5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-1.5
                                    ${activeTab === tab.key ? 'bg-bee-black text-bee-yellow shadow-lg' : 'text-gray-400 hover:text-bee-black'}`}>
                                <i className={`fa-solid ${tab.icon} text-[9px] hidden md:inline`}></i>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-3 w-full xl:w-auto">
                        {activeTab === 'COMPLETED' && (
                            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-gray-100 shadow-sm whitespace-nowrap overflow-x-auto">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:inline">기간</span>
                                <input type="date" title="시작일" value={completedStartDate} onChange={e => handleCompletedDateChange('start', e.target.value)} className="bg-transparent text-bee-black font-bold text-xs outline-none cursor-pointer" />
                                <span className="text-gray-300">-</span>
                                <input type="date" title="종료일" value={completedEndDate} onChange={e => handleCompletedDateChange('end', e.target.value)} className="bg-transparent text-bee-black font-bold text-xs outline-none cursor-pointer" />
                            </div>
                        )}
                        {isBookingTab && (
                            <div className="relative flex-1 xl:w-80">
                                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
                                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="예약자명, 예약코드 검색..." className="w-full bg-white pl-11 pr-4 py-3 rounded-2xl border border-gray-100 focus:border-bee-yellow shadow-sm outline-none font-bold text-sm" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                    {isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-4">
                            <div className="w-12 h-12 border-4 border-bee-yellow border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-400 font-bold animate-pulse">데이터 로딩 중...</p>
                        </div>
                    ) : activeTab === 'STAFF' ? (
                        <Suspense fallback={<div className="p-10 text-center text-gray-300">Loading...</div>}>
                            <BranchStaffTab staff={staff} branchId={branchId} />
                        </Suspense>
                    ) : activeTab === 'REVENUE' ? (
                        <Suspense fallback={<div className="p-10 text-center text-gray-300">Loading...</div>}>
                            <BranchRevenueTab bookings={bookings} currentBranch={currentBranch} branchIdentifiers={branchIdentifiers} />
                        </Suspense>
                    ) : (
                        /* Booking table - mobile card + desktop table hybrid */
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden p-4 space-y-3">
                                {filteredBookings.sort((a, b) => new Date(b.pickupDate || b.createdAt || 0).getTime() - new Date(a.pickupDate || a.createdAt || 0).getTime()).map(b => (
                                    <div key={b.id} onClick={() => setSelectedBooking(b)} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="font-black text-bee-black">{b.userName}</div>
                                                <div className="text-[10px] font-mono text-gray-400 tracking-tighter">{b.reservationCode || b.id}</div>
                                            </div>
                                            <select
                                                value={b.status}
                                                onChange={e => { e.stopPropagation(); handleStatusUpdate(b.id!, e.target.value as BookingStatus); }}
                                                onClick={e => e.stopPropagation()}
                                                className={`text-[10px] font-black p-1.5 rounded-lg border-none outline-none ${getStatusStyle(b.status as BookingStatus)}`}
                                                title="상태" aria-label="상태"
                                            >
                                                {Object.values(BookingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${b.serviceType === ServiceType.DELIVERY ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
                                                {b.serviceType === ServiceType.DELIVERY ? '배송' : '보관'}
                                            </span>
                                            <span className="text-gray-400">짐 {b.bags}개</span>
                                            <span className="ml-auto text-gray-500 font-bold">{b.pickupDate} {b.pickupTime}</span>
                                        </div>
                                    </div>
                                ))}
                                {filteredBookings.length === 0 && (
                                    <div className="py-16 text-center text-gray-300 text-sm">예약이 없습니다.</div>
                                )}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                        <tr>
                                            <th className="px-8 py-5">예약 정보</th>
                                            <th className="px-6 py-5">유형/짐</th>
                                            <th className="px-6 py-5">상태</th>
                                            <th className="px-6 py-5">날짜</th>
                                            <th className="px-8 py-5 text-right">관리</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredBookings.sort((a, b) => new Date(b.pickupDate || b.createdAt || 0).getTime() - new Date(a.pickupDate || a.createdAt || 0).getTime()).map((b, idx, arr) => {
                                            const bDate = (b.pickupDate || b.createdAt || '').split('T')[0];
                                            const prevDate = idx > 0 ? (arr[idx - 1].pickupDate || arr[idx - 1].createdAt || '').split('T')[0] : null;
                                            const showDateHeader = activeTab === 'COMPLETED' && bDate !== prevDate;
                                            return (
                                                <React.Fragment key={b.id}>
                                                    {showDateHeader && (
                                                        <tr className="bg-gray-50/50">
                                                            <td colSpan={5} className="px-8 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{bDate}</td>
                                                        </tr>
                                                    )}
                                                    <tr className="hover:bg-gray-50/50 transition-colors group">
                                                        <td className="px-8 py-5">
                                                            <div className="font-black text-bee-black mb-1">{b.userName}</div>
                                                            <div className="text-[10px] font-bold text-gray-400 font-mono tracking-tighter">{b.reservationCode || b.id}</div>
                                                        </td>
                                                        <td className="px-6 py-5 font-bold">
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md w-fit ${b.serviceType === ServiceType.DELIVERY ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
                                                                    {b.serviceType === ServiceType.DELIVERY ? '배송' : '보관'}
                                                                </span>
                                                                <div className="flex gap-1">
                                                                    {branchIdentifiers.has(b.pickupLocation || '') && <span className="text-[8px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded uppercase">Pick</span>}
                                                                    {branchIdentifiers.has(b.dropoffLocation || '') && <span className="text-[8px] font-black bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded uppercase">Drop</span>}
                                                                </div>
                                                                <span className="text-xs font-bold text-bee-black">짐 {b.bags}개</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 font-bold">
                                                            <select
                                                                value={b.status}
                                                                onChange={e => handleStatusUpdate(b.id!, e.target.value as BookingStatus)}
                                                                className={`text-[10px] font-black p-2 rounded-xl border-none outline-none cursor-pointer transition-colors ${getStatusStyle(b.status as BookingStatus)}`}
                                                                title="상태 변경" aria-label="상태 변경"
                                                            >
                                                                {Object.values(BookingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="text-xs font-bold text-bee-black">{b.pickupDate}</div>
                                                            <div className="text-[10px] text-gray-400">{b.pickupTime}</div>
                                                        </td>
                                                        <td className="px-8 py-5 text-right">
                                                            <button onClick={() => setSelectedBooking(b)} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-bee-black hover:text-bee-yellow transition-all flex items-center justify-center ml-auto" title="상세" aria-label="상세">
                                                                <i className="fa-solid fa-eye text-xs"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {filteredBookings.length === 0 && (
                                    <div className="py-16 text-center text-gray-300 text-sm">예약이 없습니다.</div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>

            <BookingDetailModal
                selectedBooking={selectedBooking}
                setSelectedBooking={setSelectedBooking}
                locations={locations}
                getStatusStyle={getStatusStyle}
                handlePrintLabel={handlePrintLabel}
                handleUpdateBooking={handleUpdateBooking}
                handleResendEmail={handleResendEmail}
                sendingEmailId={sendingEmailId}
                handleRefund={handleRefund}
                isSaving={isSaving}
                adminRole={adminRole}
            />
        </div>
    );
};

export default BranchAdminPage;
