import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { SkeletonRow, SkeletonList } from './ui/Skeleton';
import { useNavigate, useParams } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { sendZPL, buildBookingLabelZPL } from '../services/zebraPrintService';
import { BookingState, BookingStatus, LocationOption, ServiceType, StorageTier } from '../types';
import BookingDetailModal from './admin/BookingDetailModal';
import BranchHeader from './branch/BranchHeader';
import { DEFAULT_STORAGE_TIERS as PRICING_DEFAULT_STORAGE_TIERS } from '../src/domains/booking/bagCategoryUtils';
import { getSupabaseBaseUrl, getSupabaseConfig } from '../services/supabaseRuntime';
import { supabaseMutate } from '../services/supabaseClient';

const BranchStaffTab = lazy(() => import('./branch/BranchStaffTab'));
const BranchRevenueTab = lazy(() => import('./branch/BranchRevenueTab'));

// ─── 키오스크 현황 (인라인 — 별도 파일 불필요) ────────────────────────────
import { loadTodayLog, loadBranchBySlug, loadAllActiveBranches, KioskStorageLog, KioskBranch, todayStr, updateStorageLog } from '../services/kioskDb';

const BranchKioskPanel: React.FC<{ branchId: string }> = ({ branchId }) => {
    const [entries, setEntries] = useState<KioskStorageLog[]>([]);
    const [kioskBranch, setKioskBranch] = useState<KioskBranch | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const today = todayStr();
            const rows = await loadTodayLog(branchId, today);
            setEntries(rows);
            // 슬러그 찾기 (branch_id로 역조회)
            const all = await loadAllActiveBranches();
            setKioskBranch(all.find(b => b.branch_id === branchId) ?? null);
            setLoading(false);
        })();
    }, [branchId]);

    const active = entries.filter(e => !e.done);
    const done = entries.filter(e => e.done);
    const revenue = entries.reduce((sum, e) => sum + (e.original_price - (e.discount ?? 0)), 0);

    const handleDone = async (entry: KioskStorageLog) => {
        await updateStorageLog(entry.id, { done: true });
        setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, done: true } : e));
    };

    if (loading) return <div className="py-10 flex justify-center"><div className="w-6 h-6 border-4 border-bee-yellow border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-4">
            {/* 키오스크 URL */}
            {kioskBranch && (
                <div className="bg-bee-yellow/10 border border-bee-yellow/30 rounded-2xl px-5 py-3 flex items-center gap-3 text-sm">
                    <i className="fa-solid fa-tablet-screen-button text-bee-yellow" />
                    <span className="text-gray-600 font-bold">현장 키오스크:</span>
                    <a href={`/kiosk/${encodeURIComponent(kioskBranch.slug)}`} target="_blank" rel="noreferrer"
                        className="font-black text-bee-black underline underline-offset-2">
                        /kiosk/{kioskBranch.slug}
                    </a>
                </div>
            )}

            {/* 오늘 통계 */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: '보관중', value: active.length, color: 'text-amber-500' },
                    { label: '반납완료', value: done.length, color: 'text-green-500' },
                    { label: '오늘수익', value: `₩${revenue.toLocaleString()}`, color: 'text-bee-black' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
                        <p className={`font-black text-xl ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* 보관 목록 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-black text-sm">오늘 접수 현황 <span className="text-gray-400 font-bold ml-1">{todayStr()}</span></h3>
                    <span className="text-xs text-gray-400 font-bold">{entries.length}건</span>
                </div>
                {entries.length === 0 ? (
                    <p className="text-center text-gray-300 py-10 text-sm">오늘 접수 내역이 없습니다</p>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {entries.map((e) => (
                            <div key={e.id} className={`flex items-center gap-4 px-5 py-3.5 ${e.done ? 'opacity-50' : ''}`}>
                                <span className="w-9 h-9 rounded-full bg-bee-yellow flex items-center justify-center text-bee-black font-black text-sm flex-shrink-0">
                                    {e.tag}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-bee-black">
                                        {e.row_label} ·{' '}
                                        {e.small_qty > 0 && `소형 ${e.small_qty}개`}{e.small_qty > 0 && e.carrier_qty > 0 && ' · '}{e.carrier_qty > 0 && `캐리어 ${e.carrier_qty}개`}
                                    </p>
                                    <p className="text-gray-400 text-xs">{e.start_time} → {e.pickup_time} · {(e.original_price - (e.discount ?? 0)).toLocaleString()}원 · {e.payment}</p>
                                </div>
                                {!e.done ? (
                                    <button onClick={() => handleDone(e)}
                                        className="text-xs font-black text-white bg-green-500 rounded-full px-4 py-1.5 hover:bg-green-600 active:scale-95 transition-all flex-shrink-0 flex items-center gap-1.5">
                                        <i className="fa-solid fa-check-circle text-[10px]" />
                                        반납 완료
                                    </button>
                                ) : (
                                    <span className="text-green-500 text-xs font-bold flex-shrink-0"><i className="fa-solid fa-check mr-1" />완료</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

interface BranchAdminPageProps {
    branchId: string;
    adminRole?: string;
    lang: string;
    t: any;
    onBack: () => void;
}

const BOOKING_DETAIL_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isSupabaseBookingDetailId = (value?: string | null) =>
    BOOKING_DETAIL_UUID_PATTERN.test(String(value || '').trim());

type TabKey = 'ALL' | 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'STAFF' | 'REVENUE' | 'KIOSK';

const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'ALL', label: '전체', icon: 'fa-list' },
    { key: 'PENDING', label: '대기', icon: 'fa-clock' },
    { key: 'ACTIVE', label: '활성', icon: 'fa-truck-fast' },
    { key: 'COMPLETED', label: '완료', icon: 'fa-check-double' },
    { key: 'CANCELLED', label: '취소/환불', icon: 'fa-ban' },
    { key: 'STAFF', label: '직원', icon: 'fa-users' },
    { key: 'REVENUE', label: '정산', icon: 'fa-coins' },
    { key: 'KIOSK', label: '키오스크', icon: 'fa-tablet-screen-button' },
];

const BranchAdminPage: React.FC<BranchAdminPageProps> = ({ branchId: propsBranchId, adminRole = 'staff', lang, t, onBack }) => {
    const navigate = useNavigate();
    // URL params를 우선 사용 — adminInfo.branchId가 비어있어도 동작
    const { branchId: urlBranchId } = useParams<{ branchId: string }>();
    const branchId = urlBranchId || propsBranchId || '';

    const [bookings, setBookings] = useState<BookingState[]>([]);
    const [locations, setLocations] = useState<LocationOption[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<TabKey>('ACTIVE');
    const [selectedBooking, setSelectedBooking] = useState<BookingState | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
    const [refundingId, setRefundingId] = useState<string | null>(null);
    const [allAdmins, setAllAdmins] = useState<any[]>([]);
    const [kioskSlug, setKioskSlug] = useState<string | null>(null);
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
            setAllAdmins(data);
        });
        // 키오스크 슬러그 로드 (nav 버튼용)
        loadAllActiveBranches().then(branches => {
            const found = branches.find(b => b.branch_id === branchId);
            if (found) setKioskSlug(found.slug);
        }).catch(() => {});
        return () => { unsubscribeBookings(); unsubscribeAdmins(); };
    }, [branchId]);

    const currentBranch = useMemo(() =>
        locations.find(l =>
            l.id === branchId ||
            (l as any).supabaseId === branchId ||
            l.shortCode === branchId ||
            (l as any).branchCode === branchId ||
            (l as any).branch_code === branchId
        ),
    [locations, branchId]);

    const branchIdentifiers = useMemo(() => {
        const ids = new Set<string>();
        ids.add(branchId);
        if (currentBranch) {
            if (currentBranch.id) ids.add(currentBranch.id);
            if ((currentBranch as any).supabaseId) ids.add((currentBranch as any).supabaseId);
            if (currentBranch.shortCode) ids.add(currentBranch.shortCode);
            if ((currentBranch as any).branchCode) ids.add((currentBranch as any).branchCode);
            if ((currentBranch as any).branchId) ids.add((currentBranch as any).branchId);
            if (currentBranch.name) ids.add(currentBranch.name);
        }
        return ids;
    }, [branchId, currentBranch]);

    // 지점 직원: branchIdentifiers에 포함되는 모든 admin을 해당 지점 직원으로 인식
    const staff = useMemo(() =>
        allAdmins.filter(a => {
            const aBranchId = String(a.branchId || '').trim();
            const aBranchCode = String(a.branchCode || '').trim();
            return (aBranchId && branchIdentifiers.has(aBranchId)) ||
                   (aBranchCode && branchIdentifiers.has(aBranchCode));
        }),
    [allAdmins, branchIdentifiers]);

    const filteredBookings = useMemo(() => {
        const MS_24H = 24 * 60 * 60 * 1000;
        return bookings.filter(b => {
            const isInternalBee = (b.id?.toUpperCase().startsWith('BEE')) || (b.reservationCode?.toUpperCase().startsWith('BEE'));
            if (isInternalBee) return false;

            const isRelatedToBranch =
                branchIdentifiers.has(b.pickupLocation || '') ||
                branchIdentifiers.has(b.dropoffLocation || '') ||
                branchIdentifiers.has(b.branchId || '') ||
                branchIdentifiers.has((b as any).pickupLocationId || '');
            if (!isRelatedToBranch) return false;

            // 취소/환불건: 24시간 경과 후 자동 숨김
            if ([BookingStatus.CANCELLED, BookingStatus.REFUNDED].includes(b.status as any)) {
                const ref = b.updatedAt || b.createdAt || '';
                if (ref && Date.now() - new Date(ref).getTime() > MS_24H) return false;
            }

            const matchesSearch =
                b.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.reservationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.id?.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            if (activeTab === 'ALL') {
                // 완료/취소는 최근 30일 이내만 표시 (ALL 탭 정리)
                if ([BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.REFUNDED].includes(b.status as any)) {
                    const bDateStr = (b.pickupDate || b.createdAt || '').split('T')[0];
                    if (!bDateStr) return false;
                    const daysAgo30 = new Date();
                    daysAgo30.setDate(daysAgo30.getDate() - 30);
                    return new Date(bDateStr) >= daysAgo30;
                }
                return true;
            }
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

    // bags가 0인 경우 bagSizes 합산으로 보완
    const effectiveBags = (b: BookingState): number => {
        if (b.bags && b.bags > 0) return b.bags;
        const sz = (b as any).bagSizes;
        if (!sz) return 0;
        return (sz.handBag || 0) + (sz.carrier || 0) + (sz.strollerBicycle || 0);
    };

    // 예약별 커미션 금액
    // branchSettlementAmount = 이미 커미션율이 적용된 지점 지급 확정액 → 그대로 사용
    // 미설정 시 전체 금액(settlementHardCopyAmount || finalPrice)에 커미션율 적용
    const bookingCommission = (b: BookingState): number => {
        const bsa = (b as any).branchSettlementAmount;
        if (bsa != null && Number(bsa) > 0) return Math.round(Number(bsa));
        const fullPrice = Number((b as any).settlementHardCopyAmount ?? b.finalPrice ?? 0);
        const deliveryRate = currentBranch?.commissionRates?.delivery ?? 0;
        const storageRate = currentBranch?.commissionRates?.storage ?? 0;
        const rate = b.serviceType === ServiceType.DELIVERY ? deliveryRate : storageRate;
        return Math.floor(fullPrice * (rate / 100));
    };

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
        const opsStatusMap: Partial<Record<BookingStatus, string>> = {
            [BookingStatus.CONFIRMED]: 'pickup_ready',
            [BookingStatus.STORAGE]:   'pickup_completed',
            [BookingStatus.TRANSIT]:   'in_transit',
            [BookingStatus.ARRIVED]:   'arrived_at_destination',
            [BookingStatus.COMPLETED]: 'completed',
            [BookingStatus.CANCELLED]: 'cancelled',
            [BookingStatus.REFUNDED]:  'refunded',
        };
        const ops_status = opsStatusMap[status] ?? undefined;
        const isCompleted = status === BookingStatus.COMPLETED;
        const payload: Record<string, unknown> = { ...(ops_status ? { ops_status } : {}) };
        if (isCompleted) {
            payload.settlement_status = 'CONFIRMED';
            payload.settled_at = new Date().toISOString();
            payload.settled_by = '';
        }
        try {
            await supabaseMutate('rpc/admin_update_booking_details', 'POST', {
                p_id: id,
                p_payload: payload,
            });
            // 낙관적 UI 업데이트 — Realtime이 늦을 경우에도 즉시 반영
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status, ...(isCompleted ? { settlementStatus: 'CONFIRMED' } : {}) } : b));
        } catch (e) { console.error(e); alert('상태 변경 실패: ' + (e instanceof Error ? e.message : e)); }
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
            const bookingDetailId = isSupabaseBookingDetailId(booking.id) ? booking.id : String((await StorageService.getBooking(booking.id))?.id || '').trim();
            if (!isSupabaseBookingDetailId(bookingDetailId)) throw new Error('Supabase booking_details id를 찾을 수 없습니다.');
            const SUPABASE_URL = getSupabaseBaseUrl();
            const SUPABASE_KEY = getSupabaseConfig().anonKey;
            const res = await fetch(`${SUPABASE_URL}/functions/v1/on-booking-created`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
                body: JSON.stringify({ type: 'INSERT', table: 'booking_details', record: {
                    id: bookingDetailId,
                    reservation_code: booking.reservationCode,
                    user_name: booking.userName,
                    user_email: booking.userEmail,
                    service_type: booking.serviceType,
                    pickup_date: booking.pickupDate,
                    pickup_time: booking.pickupTime,
                    pickup_location: booking.pickupLocation,
                    pickup_location_id: booking.pickupLocation,
                    dropoff_location: booking.dropoffLocation,
                    dropoff_location_id: booking.dropoffLocation,
                    dropoff_date: booking.dropoffDate,
                    delivery_time: booking.deliveryTime,
                    return_date: booking.dropoffDate,
                    return_time: booking.deliveryTime,
                    bags: booking.bags || 0,
                    final_price: booking.finalPrice,
                    nametag_number: booking.nametagId,
                    admin_note: booking.auditNote || '',
                    force_resend: true,
                } }),
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

    const handlePrintLabel = async (booking: BookingState) => {
        const originName =
            locations.find(l => l.id === booking.pickupLocation || l.shortCode === booking.pickupLocation)?.name ||
            booking.pickupLocation || '-';
        const destName = booking.serviceType === 'DELIVERY'
            ? (locations.find(l => l.id === booking.dropoffLocation || l.shortCode === booking.dropoffLocation)?.name ||
               booking.dropoffAddress || booking.dropoffLocation || '-')
            : originName;
        const codeLabel = booking.serviceType === 'DELIVERY' ? 'DELIVERY CODE' : 'STORAGE CODE';
        const displayCode = booking.reservationCode || booking.id || '-';

        try {
            const zpl = buildBookingLabelZPL({
                serviceType: booking.serviceType || 'STORAGE',
                customerName: booking.userName || '-',
                pickupDate: booking.pickupDate || '-',
                pickupTime: booking.pickupTime || '-',
                originName,
                destName,
                codeLabel,
                displayCode,
                bags: effectiveBags(booking),
                bagSummary: (booking as any).bagSummary,
                dropoffDate: booking.dropoffDate || booking.returnDate,
                nametagId: (booking as any).nametagId,
                status: booking.status,
                userEmail: booking.userEmail,
            });
            await sendZPL(zpl);
        } catch (err: any) {
            console.error('[ZebraPrint] 실패:', err);
            alert(`라벨 프린터 오류: ${err?.message || err}\n\nZebra Browser Print 앱이 실행 중인지 확인해주세요.\nhttps://www.zebra.com → Support → Browser Print`);
        }
    };

    const handleExportCSV = () => {
        if (bookings.length === 0) { alert('내보낼 데이터가 없습니다.'); return; }
        const BOM = '\uFEFF';
        const headers = ['예약번호', '상태', '성함', '픽업날짜', '반납날짜', '픽업장소', '도착장소', '짐 개수', '생성일'];
        const rows = bookings.map(b => {
            const pickupLoc = locations.find(l => l.id === b.pickupLocation || l.shortCode === b.pickupLocation)?.name || b.pickupLocation;
            const dropoffLoc = locations.find(l => l.id === b.dropoffLocation || l.shortCode === b.dropoffLocation)?.name || b.dropoffLocation;
            return [b.id, b.status, `"${(b.userName || '').replace(/"/g, '""')}"`, b.pickupDate, b.returnDate || '-', `"${(pickupLoc || '').replace(/"/g, '""')}"`, `"${(dropoffLoc || '').replace(/"/g, '""')}"`, effectiveBags(b), b.createdAt].join(',');
        });
        const blob = new Blob([BOM + headers.join(',') + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `branch_${branchId}_bookings_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const isBookingTab = !['STAFF', 'REVENUE', 'KIOSK'].includes(activeTab);

    return (
        <div className="min-h-screen bg-[#F4F5F7] text-bee-black font-sans">
            {/* Minimal sticky nav */}
            <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
                    <button onClick={onBack} title="뒤로" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-bee-black flex-shrink-0">
                        <i className="fa-solid fa-chevron-left text-sm"></i>
                    </button>
                    <span className="font-black text-[11px] tracking-[0.25em] text-gray-300 uppercase select-none">BEE ADMIN</span>
                    <span className="text-gray-200 select-none">·</span>
                    <span className="font-black text-sm text-bee-black truncate">{currentBranch?.name || '...'}</span>
                </div>
            </nav>

            <main className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
                {/* Hero Header */}
                <BranchHeader
                    currentBranch={currentBranch}
                    branchId={branchId}
                    bookings={bookings}
                    kioskSlug={kioskSlug}
                    onQRScan={() => navigate('/staff/scan')}
                    onManualBooking={() => navigate(`/admin/branch/${branchId}/booking`)}
                    onExportCSV={handleExportCSV}
                    onLogout={onBack}
                />

                {/* Tabs + Search */}
                <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
                    <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-full lg:w-fit overflow-x-auto no-scrollbar">
                        {TABS.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex-none px-3.5 md:px-4 py-2 rounded-xl text-[11px] font-black transition-all whitespace-nowrap flex items-center gap-1.5
                                    ${activeTab === tab.key
                                        ? 'bg-bee-black text-bee-yellow shadow-md'
                                        : 'text-gray-400 hover:text-gray-700'}`}>
                                <i className={`fa-solid ${tab.icon} text-[9px]`}></i>
                                <span className="hidden md:inline">{tab.label}</span>
                                <span className="md:hidden">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 w-full lg:w-auto lg:ml-auto">
                        {activeTab === 'COMPLETED' && (
                            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm whitespace-nowrap text-xs">
                                <i className="fa-solid fa-calendar text-gray-300 text-[10px]"></i>
                                <input type="date" title="시작일" value={completedStartDate} onChange={e => handleCompletedDateChange('start', e.target.value)} className="bg-transparent text-bee-black font-bold text-xs outline-none cursor-pointer w-28" />
                                <span className="text-gray-200">–</span>
                                <input type="date" title="종료일" value={completedEndDate} onChange={e => handleCompletedDateChange('end', e.target.value)} className="bg-transparent text-bee-black font-bold text-xs outline-none cursor-pointer w-28" />
                            </div>
                        )}
                        {isBookingTab && (
                            <div className="relative flex-1 lg:w-72">
                                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
                                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="예약자명, 예약코드..." className="w-full bg-white pl-9 pr-4 py-2.5 rounded-xl border border-gray-100 focus:border-bee-yellow shadow-sm outline-none font-bold text-xs" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                    {isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-20 gap-4">
                            <div className="w-8 h-8 border-[3px] border-bee-yellow border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest animate-pulse">Loading</p>
                        </div>
                    ) : activeTab === 'STAFF' ? (
                        <Suspense fallback={<div className="p-10 text-center text-gray-300">Loading...</div>}>
                            <BranchStaffTab staff={staff} branchId={branchId} />
                        </Suspense>
                    ) : activeTab === 'REVENUE' ? (
                        <Suspense fallback={<div className="p-10 text-center text-gray-300">Loading...</div>}>
                            <BranchRevenueTab bookings={bookings} currentBranch={currentBranch} branchIdentifiers={branchIdentifiers} />
                        </Suspense>
                    ) : activeTab === 'KIOSK' ? (
                        <div className="p-4">
                            <BranchKioskPanel branchId={branchId} />
                        </div>
                    ) : (
                        /* Booking table - mobile card + desktop table hybrid */
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden p-3 space-y-2">
                                {isLoading ? (
                                    <SkeletonList count={5} />
                                ) : filteredBookings.sort((a, b) => new Date(b.pickupDate || b.createdAt || 0).getTime() - new Date(a.pickupDate || a.createdAt || 0).getTime()).map(b => (
                                    <div key={b.id} onClick={() => setSelectedBooking(b)} className="bg-gray-50 p-4 rounded-xl active:scale-[0.98] transition-transform cursor-pointer">
                                        <div className="flex justify-between items-start mb-2.5">
                                            <div>
                                                <div className="font-black text-[13px] text-bee-black">{b.userName}</div>
                                                <div className="text-[9px] font-mono text-gray-300 mt-0.5">{b.reservationCode || b.id}</div>
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
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-md text-[9px] font-black ${b.serviceType === ServiceType.DELIVERY ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {b.serviceType === ServiceType.DELIVERY ? '배송' : '보관'}
                                            </span>
                                            <span className="text-[11px] font-bold text-gray-400">
                                                {effectiveBags(b) > 0 ? `짐 ${effectiveBags(b)}개` : ((b as any).bagSummary || '짐 —')}
                                            </span>
                                            <div className="ml-auto text-right">
                                                <div className="text-[10px] font-bold text-gray-500 tabular-nums">{(b.pickupDate || '').split('T')[0]} {b.pickupTime || ''}</div>
                                                {(b.returnDate || b.dropoffDate) && <div className="text-[10px] text-gray-300 tabular-nums">→ {((b.returnDate || b.dropoffDate) || '').split('T')[0]}</div>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {!isLoading && filteredBookings.length === 0 && (
                                    <div className="py-16 text-center">
                                        <i className="fa-solid fa-inbox text-2xl text-gray-200 mb-2 block"></i>
                                        <p className="text-[12px] font-bold text-gray-300">예약이 없습니다</p>
                                    </div>
                                )}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="border-b border-gray-50">
                                        <tr className="text-[9px] font-black text-gray-300 uppercase tracking-[0.18em]">
                                            <th className="px-6 py-4">예약자</th>
                                            <th className="px-4 py-4">유형</th>
                                            <th className="px-4 py-4">상태</th>
                                            <th className="px-4 py-4">맡기는시간</th>
                                            <th className="px-4 py-4">찾는시간</th>
                                            <th className="px-4 py-4 text-right">짐</th>
                                            <th className="px-4 py-4 text-right">커미션</th>
                                            <th className="px-6 py-4 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={8} />)}
                                        {filteredBookings.sort((a, b) => new Date(b.pickupDate || b.createdAt || 0).getTime() - new Date(a.pickupDate || a.createdAt || 0).getTime()).map((b, idx, arr) => {
                                            const bDate = (b.pickupDate || b.createdAt || '').split('T')[0];
                                            const prevDate = idx > 0 ? (arr[idx - 1].pickupDate || arr[idx - 1].createdAt || '').split('T')[0] : null;
                                            const showDateHeader = activeTab === 'COMPLETED' && bDate !== prevDate;
                                            return (
                                                <React.Fragment key={b.id}>
                                                    {showDateHeader && (
                                                        <tr>
                                                            <td colSpan={8} className="px-6 pt-5 pb-1.5 text-[9px] font-black text-gray-300 uppercase tracking-widest">{bDate}</td>
                                                        </tr>
                                                    )}
                                                    <tr className="hover:bg-gray-50/60 transition-colors group border-b border-gray-50 last:border-b-0">
                                                        <td className="px-6 py-4">
                                                            <div className="font-black text-[13px] text-bee-black leading-tight">{b.userName}</div>
                                                            <div className="text-[10px] text-gray-300 font-mono mt-0.5">{b.reservationCode || b.id}</div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg w-fit ${b.serviceType === ServiceType.DELIVERY ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                    {b.serviceType === ServiceType.DELIVERY ? '배송' : '보관'}
                                                                </span>
                                                                <div className="flex gap-1">
                                                                    {branchIdentifiers.has(b.pickupLocation || '') && <span className="text-[8px] font-black bg-orange-100 text-orange-500 px-1.5 py-0.5 rounded">Pick</span>}
                                                                    {branchIdentifiers.has(b.dropoffLocation || '') && <span className="text-[8px] font-black bg-purple-100 text-purple-500 px-1.5 py-0.5 rounded">Drop</span>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <select
                                                                value={b.status}
                                                                onChange={e => handleStatusUpdate(b.id!, e.target.value as BookingStatus)}
                                                                className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border-none outline-none cursor-pointer transition-colors ${getStatusStyle(b.status as BookingStatus)}`}
                                                                title="상태 변경" aria-label="상태 변경"
                                                            >
                                                                {Object.values(BookingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="text-[10px] font-black text-gray-400 truncate max-w-[120px]">
                                                                {locations.find(l => l.id === b.pickupLocation || l.shortCode === b.pickupLocation)?.name || (b as any).pickupLocationName || b.pickupLocation || '—'}
                                                            </div>
                                                            <div className="text-[12px] font-bold text-bee-black tabular-nums mt-0.5">{(b.pickupDate || '').split('T')[0]}</div>
                                                            {b.pickupTime && <div className="text-[10px] text-gray-400 mt-0.5">{b.pickupTime}</div>}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            {(b.returnDate || b.dropoffDate) ? (
                                                                <>
                                                                    <div className="text-[10px] font-black text-gray-400 truncate max-w-[120px]">
                                                                        {locations.find(l => l.id === b.dropoffLocation || l.shortCode === b.dropoffLocation)?.name || (b as any).dropoffLocationName || b.dropoffLocation || '—'}
                                                                    </div>
                                                                    <div className="text-[12px] font-bold text-gray-600 tabular-nums mt-0.5">{((b.returnDate || b.dropoffDate) || '').split('T')[0]}</div>
                                                                    {(b.returnTime || b.deliveryTime) && <div className="text-[10px] text-gray-400 mt-0.5">{b.returnTime || b.deliveryTime}</div>}
                                                                </>
                                                            ) : (
                                                                <span className="text-[11px] text-gray-200">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            {effectiveBags(b) > 0
                                                                ? <span className="text-[12px] font-black text-gray-500">{effectiveBags(b)}<span className="text-[10px] font-bold text-gray-300 ml-0.5">개</span></span>
                                                                : (b as any).bagSummary
                                                                    ? <span className="text-[10px] text-gray-400">{(b as any).bagSummary}</span>
                                                                    : <span className="text-[11px] text-gray-200">—</span>
                                                            }
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            {bookingCommission(b) > 0
                                                                ? <span className="text-[12px] font-black text-emerald-500">₩{bookingCommission(b).toLocaleString()}</span>
                                                                : <span className="text-[11px] text-gray-200">—</span>
                                                            }
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button onClick={() => setSelectedBooking(b)} className="w-8 h-8 rounded-lg bg-gray-50 text-gray-300 hover:bg-bee-black hover:text-bee-yellow transition-all flex items-center justify-center ml-auto opacity-0 group-hover:opacity-100" title="상세" aria-label="상세">
                                                                <i className="fa-solid fa-arrow-right text-[10px]"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {filteredBookings.length === 0 && (
                                    <div className="py-20 text-center">
                                        <i className="fa-solid fa-inbox text-2xl text-gray-200 mb-3 block"></i>
                                        <p className="text-[12px] font-bold text-gray-300">예약이 없습니다</p>
                                    </div>
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
