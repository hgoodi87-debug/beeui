import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { BookingState, BookingStatus, LocationOption, ServiceType, StorageTier } from '../types';
import BranchManualBookingModal from './BranchManualBookingModal';
import BookingDetailModal from './admin/BookingDetailModal';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebaseApp';

interface BranchAdminPageProps {
    branchId: string;
    lang: string;
    t: any;
    onBack: () => void;
}

const INITIAL_STORAGE_TIERS: StorageTier[] = [
    { id: 'st-4h', label: '4시간 이하 (Under 4h)', prices: { S: 2000, M: 3000, L: 5000, XL: 7000 } },
    { id: 'st-1d', label: '1일 (24시간)', prices: { S: 8000, M: 10000, L: 15000, XL: 20000 } },
    { id: 'st-week', label: '7일 (장기)', prices: { S: 40000, M: 55000, L: 80000, XL: 110000 } }
];

const BranchAdminPage: React.FC<BranchAdminPageProps> = ({ branchId: propsBranchId, lang, t, onBack }) => {
    const navigate = useNavigate();
    const path = window.location.pathname;
    const branchId = propsBranchId || (path.startsWith('/branch/') ? path.split('/')[2] : '');

    const [bookings, setBookings] = useState<BookingState[]>([]);
    const [locations, setLocations] = useState<LocationOption[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'STAFF' | 'REVENUE'>('ALL');
    const [selectedBooking, setSelectedBooking] = useState<BookingState | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
    const [refundingId, setRefundingId] = useState<string | null>(null);
    const [staff, setStaff] = useState<any[]>([]);
    const [staffForm, setStaffForm] = useState<any>({});
    const [showStaffPassword, setShowStaffPassword] = useState(false);
    const [revenuePeriod, setRevenuePeriod] = useState<'DAILY' | 'MONTHLY'>('DAILY');
    const [revenueDate, setRevenueDate] = useState<Date>(new Date());

    // 완료 탭 전용 날짜 필터 상태 (최대 3개월 전)
    const [completedStartDate, setCompletedStartDate] = useState<string>(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [completedEndDate, setCompletedEndDate] = useState<string>(() => {
        return new Date().toISOString().split('T')[0];
    });

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
        return () => {
            unsubscribeBookings();
            unsubscribeAdmins();
        };
    }, [branchId]);

    const currentBranch = useMemo(() => locations.find(l => l.id === branchId), [locations, branchId]);

    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            // 본사용 예약(BEE-) 코드는 지점 어드민 대시보드에서 제외
            const isInternalBee =
                (b.id?.toUpperCase().startsWith('BEE')) ||
                (b.reservationCode?.toUpperCase().startsWith('BEE'));
            if (isInternalBee) return false;

            // 지점 연동 확인: pickupLocation, dropoffLocation 또는 branchId가 일치해야 함
            const isRelatedToBranch =
                b.pickupLocation === branchId ||
                b.dropoffLocation === branchId ||
                b.branchId === branchId;

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
                // 오직 완료된 건만! 💅
                if (b.status !== BookingStatus.COMPLETED) return false;

                // 날짜 필터링: 픽업일 또는 생성일 기준으로 기간 내 조회
                const bDateStr = (b.pickupDate || b.createdAt || '').split('T')[0];
                if (bDateStr) {
                    return bDateStr >= completedStartDate && bDateStr <= completedEndDate;
                }
                return true;
            }
            if (activeTab === 'CANCELLED') {
                // 부끄러운(?) 과거들... 취소와 환불 건들을 모아봅시다 💅
                return [BookingStatus.CANCELLED, BookingStatus.REFUNDED].includes(b.status as any);
            }
            return true;
        });
    }, [bookings, searchTerm, activeTab, completedStartDate, completedEndDate]);

    const handleCompletedDateChange = (type: 'start' | 'end', val: string) => {
        const newStart = type === 'start' ? val : completedStartDate;
        const newEnd = type === 'end' ? val : completedEndDate;

        const dStart = new Date(newStart);
        const dEnd = new Date(newEnd);

        if (dStart > dEnd) {
            alert('시작일은 종료일보다 클 수 없습니다.');
            return;
        }

        const diffTime = Math.abs(dEnd.getTime() - dStart.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 90) {
            alert('조회 기간은 최대 3개월(90일)을 초과할 수 없습니다.');
            return;
        }

        if (type === 'start') setCompletedStartDate(val);
        else setCompletedEndDate(val);
    };

    const bt = t.branch_admin || {};

    const revenueData = useMemo(() => {
        if (activeTab !== 'REVENUE') return { total: 0, items: [] };

        const targetYear = revenueDate.getFullYear();
        const targetMonth = revenueDate.getMonth();
        const targetDay = revenueDate.getDate();

        const items = bookings.filter(b => {
            // 정산 기준: 완료(또는 확정) 상태일 때만
            if (b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.CONFIRMED && b.status !== BookingStatus.ARRIVED) return false;

            // 본사용 제외
            const isInternalBee = (b.id?.toUpperCase().startsWith('BEE')) || (b.reservationCode?.toUpperCase().startsWith('BEE'));
            if (isInternalBee) return false;

            const bDate = new Date(b.createdAt || b.pickupDate);
            if (revenuePeriod === 'MONTHLY') {
                return bDate.getFullYear() === targetYear && bDate.getMonth() === targetMonth;
            } else {
                return bDate.getFullYear() === targetYear && bDate.getMonth() === targetMonth && bDate.getDate() === targetDay;
            }
        }).map(b => {
            const finalPrice = typeof b.finalPrice === 'number' ? b.finalPrice : parseInt(String(b.finalPrice || '0').replace(/[^0-9]/g, ''), 10);
            // 수오피스 등 단순히 짐을 옮기는 작업인지 여부 판단
            const isDelivery = b.pickupLocation !== b.dropoffLocation;
            const commRate = isDelivery ? (currentBranch?.commissionRates?.delivery || 0) : (currentBranch?.commissionRates?.storage || 0);
            const commissionAmount = Math.floor(finalPrice * (commRate / 100));

            return {
                ...b,
                calculatedFinalPrice: finalPrice,
                commissionRate: commRate,
                commissionAmount,
                isDelivery
            };
        });

        const total = items.reduce((sum, item) => sum + item.commissionAmount, 0);

        return { total, items: items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()) };
    }, [bookings, activeTab, revenuePeriod, revenueDate, currentBranch]);

    const handleStatusUpdate = async (id: string, status: BookingStatus) => {
        try {
            await StorageService.updateBooking(id, { status });
            alert(bt.status_update_success || 'Status updated');
        } catch (e) {
            console.error(e);
            alert('Update failed');
        }
    };

    const handleUpdateBooking = async () => {
        if (!selectedBooking || !selectedBooking.id) return;
        setIsSaving(true);
        try {
            await StorageService.updateBooking(selectedBooking.id, selectedBooking);
            alert(bt.booking_update_success || '예약 정보가 업데이트되었습니다.');
            setSelectedBooking(null);
        } catch (e) {
            console.error(e);
            alert('Update failed');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResendEmail = async (booking: BookingState) => {
        if (!booking.id) return;
        if (!confirm(`Is it okay to resend the voucher email to ${booking.userName} (${booking.userEmail})?`)) return;

        setSendingEmailId(booking.id);
        try {
            const functions = getFunctions(app, 'us-central1');
            const resendVoucher = httpsCallable(functions, 'resendBookingVoucher');
            await resendVoucher({ bookingId: booking.id });
            alert('Email sent successfully!');
        } catch (error: any) {
            console.error("Failed to send email:", error);
            alert(`Failed to send email: ${error.message}`);
        } finally {
            setSendingEmailId(null);
        }
    };

    const handleRefund = async (booking: BookingState) => {
        if (!booking.id) return;
        if (!confirm(`[최종 확인]\n\n예약번호: ${booking.id}\n고객명: ${booking.userName}\n\n정말로 반품(환불) 처리하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

        setRefundingId(booking.id);
        try {
            const functions = getFunctions(app, 'us-central1');
            const processRefund = httpsCallable(functions, 'processBookingRefund');
            await processRefund({ bookingId: booking.id });
            alert('반품(환불) 처리가 완료되었습니다.');
        } catch (error: any) {
            console.error("Failed to process refund:", error);
            alert(`반품 처리 실패: ${error.message}`);
        } finally {
            setRefundingId(null);
        }
    };

    const handleSaveManualBooking = async (formData: any) => {
        // ... (removed, now handled by App.tsx through dedicated route)
    };

    const handleSaveStaff = async () => {
        if (!staffForm.name || (!staffForm.id && !staffForm.password)) {
            alert('이름과 비밀번호는 필수입니다.');
            return;
        }
        setIsSaving(true);
        try {
            await StorageService.saveAdmin({
                ...staffForm,
                branchId: branchId,
                role: 'staff', // Fixed role for branch staff
                createdAt: staffForm.createdAt || new Date().toISOString()
            } as any);
            alert('직원 정보가 저장되었습니다. ✨');
            setStaffForm({});
            setShowStaffPassword(false);
        } catch (e) {
            console.error(e);
            alert('저장 실패');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteStaff = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await StorageService.deleteAdmin(id);
        } catch (e) {
            console.error(e);
            alert('삭제 실패');
        }
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
        // Simple label print logic
        const printWindow = window.open('', '', 'width=800,height=600');
        if (!printWindow) return;
        printWindow.document.write(`<html><body><h1>Beeliber Label: ${booking.reservationCode || booking.id}</h1><p>Customer: ${booking.userName}</p></body></html>`);
        printWindow.document.close();
        printWindow.print();
    };
    const handleExportCSV = () => {
        if (bookings.length === 0) {
            alert('내보낼 데이터가 없습니다.');
            return;
        }

        const BOM = '\uFEFF';
        let csvContent = BOM;

        // Note: Branch Admins do not see the payment amounts in the export.
        const headers = ['예약번호', '상태', '성함', '픽업날짜', '반납날짜', '픽업장소', '도착장소', '짐 개수', '생성일'];
        csvContent += headers.join(',') + '\n';

        const rows = bookings.map(b => {
            const pickupLoc = locations.find(l => l.id === b.pickupLocation)?.name || b.pickupLocation;
            const dropoffLoc = locations.find(l => l.id === b.dropoffLocation)?.name || b.dropoffLocation;

            return [
                b.id,
                b.status,
                `"${(b.userName || '').replace(/"/g, '""')}"`,
                b.pickupDate,
                b.returnDate || '-',
                `"${(pickupLoc || '').replace(/"/g, '""')}"`,
                `"${(dropoffLoc || '').replace(/"/g, '""')}"`,
                b.bags || 0,
                b.createdAt
            ].join(',');
        });

        csvContent += rows.join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `branch_${branchId}_bookings_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div className="min-h-screen bg-gray-50 text-bee-black font-sans">
            <nav className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} title="Back" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-bee-black">
                            <i className="fa-solid fa-chevron-left"></i>
                        </button>
                        <h1 className="text-xl font-black italic tracking-tighter">
                            <span className="text-bee-yellow">BEE</span> ADMIN <span className="ml-2 text-[10px] font-black bg-bee-black text-bee-yellow px-2 py-0.5 rounded-full uppercase tracking-widest not-italic align-middle">{currentBranch?.name || branchId}</span>
                        </h1>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => navigate(`/admin/branch/${branchId}/booking`)} className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-xl bg-bee-yellow text-bee-black font-black text-sm shadow-lg shadow-bee-yellow/20 hover:scale-105 transition-all">
                            <i className="fa-solid fa-plus"></i>
                            {bt.manual_booking_btn}
                        </button>
                        <button onClick={handleExportCSV} className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-100 text-gray-500 font-black text-sm hover:bg-gray-200 transition-all">
                            <i className="fa-solid fa-download"></i>
                            내보내기
                        </button>
                        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 hover:text-bee-black transition-colors flex items-center justify-center" title="로그아웃" aria-label="로그아웃">
                            <i className="fa-solid fa-arrow-right-from-bracket"></i>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: '전체 예약', count: bookings.length, icon: 'fa-list' },
                        { label: '요청됨', count: bookings.filter(b => b.status === BookingStatus.PENDING).length, icon: 'fa-clock' },
                        { label: '활성(이동/보관)', count: bookings.filter(b => [BookingStatus.TRANSIT, BookingStatus.STORAGE, BookingStatus.ARRIVED].includes(b.status as any)).length, icon: 'fa-truck-fast' },
                        { label: '완료됨', count: bookings.filter(b => b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CONFIRMED).length, icon: 'fa-check-double' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <i className={`fa-solid ${stat.icon} text-gray-300 text-xs`}></i>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
                            </div>
                            <div className="text-2xl font-black text-bee-black">{stat.count}</div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
                    <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-full xl:w-fit overflow-x-auto no-scrollbar">
                        {['ALL', 'PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'STAFF', 'REVENUE'].map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${activeTab === tab ? 'bg-bee-black text-bee-yellow shadow-lg' : 'text-gray-400 hover:text-bee-black'}`}>
                                {tab === 'ALL' ? '전체' : tab === 'PENDING' ? '요청' : tab === 'ACTIVE' ? '활동' : tab === 'COMPLETED' ? '완료' : tab === 'CANCELLED' ? '취소/환불' : tab === 'STAFF' ? '직원 관리' : '정산 내역'}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4 w-full xl:w-auto">
                        {activeTab === 'COMPLETED' && (
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm whitespace-nowrap overflow-x-auto">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">조회 기간</span>
                                <input
                                    type="date"
                                    title="시작일"
                                    value={completedStartDate}
                                    onChange={(e) => handleCompletedDateChange('start', e.target.value)}
                                    className="bg-transparent text-bee-black font-bold text-xs outline-none cursor-pointer"
                                />
                                <span className="text-gray-300">-</span>
                                <input
                                    type="date"
                                    title="종료일"
                                    value={completedEndDate}
                                    onChange={(e) => handleCompletedDateChange('end', e.target.value)}
                                    className="bg-transparent text-bee-black font-bold text-xs outline-none cursor-pointer"
                                />
                            </div>
                        )}
                        {activeTab !== 'REVENUE' && (
                            <div className="relative flex-1 xl:w-80">
                                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
                                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="예약자명, 예약코드 검색..." className="w-full bg-white pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:border-bee-yellow shadow-sm outline-none font-bold text-sm" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                    {isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-4">
                            <div className="w-12 h-12 border-4 border-bee-yellow border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-400 font-bold animate-pulse">데이터를 수사 중입니다...💅</p>
                        </div>
                    ) : activeTab === 'STAFF' ? (
                        <div className="p-8 space-y-8 animate-fade-in-up">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="space-y-6">
                                    <div className="bg-gray-50 p-6 rounded-[30px] border border-gray-100 space-y-4">
                                        <h3 className="text-sm font-black flex items-center gap-2"><div className="w-1.5 h-4 bg-bee-black rounded-full" /> {staffForm.id ? '직원 수정' : '직원 등록'}</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">이름</label>
                                                <input value={staffForm.name || ''} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} className="w-full bg-white p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-black outline-none text-xs" placeholder="성함 입력" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">직책</label>
                                                <input value={staffForm.jobTitle || ''} onChange={e => setStaffForm({ ...staffForm, jobTitle: e.target.value })} className="w-full bg-white p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-black outline-none text-xs" placeholder="Manager, Staff 등" />
                                            </div>
                                            <div className="relative">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">비밀번호</label>
                                                <input
                                                    type={showStaffPassword ? "text" : "password"}
                                                    value={staffForm.password || ''}
                                                    onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                                                    className="w-full bg-white p-3 rounded-xl font-black border border-gray-100 focus:border-bee-black outline-none text-xs tracking-widest"
                                                    placeholder="••••"
                                                />
                                                <button type="button" onClick={() => setShowStaffPassword(!showStaffPassword)} className="absolute right-3 top-[34px] text-gray-300 hover:text-bee-black transition-colors"
                                                    title="비밀번호 보기 토글"
                                                    aria-label="비밀번호 보기 토글"
                                                >
                                                    <i className={`fa-solid ${showStaffPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleSaveStaff}
                                            disabled={isSaving}
                                            className={`w-full py-4 rounded-2xl font-black text-xs transition-all shadow-lg ${isSaving ? 'bg-gray-100 text-gray-400' : 'bg-bee-black text-bee-yellow hover:scale-[1.02]'}`}
                                        >
                                            {isSaving ? '처리 중...' : staffForm.id ? '수정 완료 ✨' : '직원 추가 💅'}
                                        </button>
                                        {staffForm.id && (
                                            <button onClick={() => { setStaffForm({}); setShowStaffPassword(false); }} className="w-full py-2 text-[10px] font-bold text-gray-400">취소</button>
                                        )}
                                    </div>
                                </div>
                                <div className="lg:col-span-2 space-y-3">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">직원 명단 ({staff.length})</div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                                        {staff.map(s => (
                                            <div key={s.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-bee-yellow transition-all">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center font-black text-[10px] text-gray-300 group-hover:bg-bee-yellow group-hover:text-bee-black transition-colors">{s.name?.slice(0, 1)}</div>
                                                    <div className="min-w-0">
                                                        <div className="font-black text-bee-black text-xs truncate">{s.name}</div>
                                                        <div className="text-[9px] font-bold text-gray-400 italic truncate">{s.jobTitle || 'Staff'}</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                                                    <button onClick={() => setStaffForm(s)} className="p-1.5 text-gray-300 hover:text-bee-black" title="수정"><i className="fa-solid fa-pen-to-square text-[9px]"></i></button>
                                                    <button onClick={() => handleDeleteStaff(s.id)} className="p-1.5 text-gray-300 hover:text-red-500" title="삭제"><i className="fa-solid fa-trash-can text-[9px]"></i></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {staff.length === 0 && (
                                        <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-3xl text-[10px] font-bold text-gray-300">
                                            등록된 직원이 없습니다. 💅
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'REVENUE' ? (
                        <div className="p-8 space-y-8 animate-fade-in-up">
                            <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-gray-50 p-6 rounded-[24px] border border-gray-100">
                                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-full md:w-auto">
                                    <button onClick={() => setRevenuePeriod('DAILY')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black transition-all ${revenuePeriod === 'DAILY' ? 'bg-bee-black text-bee-yellow' : 'text-gray-400 hover:text-bee-black'}`}>일간 정산</button>
                                    <button onClick={() => setRevenuePeriod('MONTHLY')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black transition-all ${revenuePeriod === 'MONTHLY' ? 'bg-bee-black text-bee-yellow' : 'text-gray-400 hover:text-bee-black'}`}>월간 정산</button>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto justify-center">
                                    <button onClick={() => {
                                        const d = new Date(revenueDate);
                                        if (revenuePeriod === 'DAILY') d.setDate(d.getDate() - 1);
                                        else d.setMonth(d.getMonth() - 1);
                                        setRevenueDate(d);
                                    }} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:border-bee-black transition-all" title="이전 날짜" aria-label="이전 날짜">
                                        <i className="fa-solid fa-chevron-left text-xs text-gray-400"></i>
                                    </button>
                                    <div className="font-black text-bee-black text-lg min-w-[130px] text-center">
                                        {revenuePeriod === 'DAILY' ?
                                            `${revenueDate.getFullYear()}.${String(revenueDate.getMonth() + 1).padStart(2, '0')}.${String(revenueDate.getDate()).padStart(2, '0')}` :
                                            `${revenueDate.getFullYear()}년 ${revenueDate.getMonth() + 1}월`}
                                    </div>
                                    <button onClick={() => {
                                        const d = new Date(revenueDate);
                                        if (revenuePeriod === 'DAILY') d.setDate(d.getDate() + 1);
                                        else d.setMonth(d.getMonth() + 1);
                                        setRevenueDate(d);
                                    }} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:border-bee-black transition-all" title="다음 날짜" aria-label="다음 날짜">
                                        <i className="fa-solid fa-chevron-right text-xs text-gray-400"></i>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-bee-black text-white p-6 md:p-8 rounded-[30px] shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                                <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                                    <i className="fa-solid fa-coins text-[200px]"></i>
                                </div>
                                <div className="z-10 text-center md:text-left">
                                    <div className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">Total Commission <span className="text-bee-yellow/50">예상 정산액</span></div>
                                    <div className="text-4xl md:text-5xl font-black text-bee-yellow tracking-tighter">₩{revenueData.total.toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-500 mt-2 font-bold">실 결제 금액 바탕의 예상 기여 정산액 총합입니다.</div>
                                </div>
                                <div className="flex gap-4 z-10 w-full md:w-auto">
                                    <div className="flex-1 md:flex-none bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl flex flex-col justify-center items-center border border-white/5">
                                        <span className="text-[10px] text-gray-400 font-bold mb-1 tracking-widest">배송 요율</span>
                                        <span className="text-xl font-black text-white">{currentBranch?.commissionRates?.delivery || 0}%</span>
                                    </div>
                                    <div className="flex-1 md:flex-none bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl flex flex-col justify-center items-center border border-white/5">
                                        <span className="text-[10px] text-gray-400 font-bold mb-1 tracking-widest">보관 요율</span>
                                        <span className="text-xl font-black text-white">{currentBranch?.commissionRates?.storage || 0}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-gray-100 rounded-[24px] overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left whitespace-nowrap">
                                        <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                            <tr>
                                                <th className="px-6 py-5">#</th>
                                                <th className="px-6 py-5">일시 / 예약정보</th>
                                                <th className="px-6 py-5">유형</th>
                                                <th className="px-6 py-5 text-center">적용 요율</th>
                                                <th className="px-6 py-5 text-right text-bee-black">수익(정산)액</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-600">
                                            {revenueData.items.map((item: any, idx: number) => (
                                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 text-gray-300 font-black">{idx + 1}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-bee-black mb-1">{item.createdAt?.split('T')[0] || item.pickupDate}</div>
                                                        <div className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-mono inline-block tracking-tighter">{item.reservationCode || item.id}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black ${item.isDelivery ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
                                                            {item.isDelivery ? '배송' : '보관'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="bg-gray-100 px-2 flex justify-center py-1 rounded-md text-[10px]">{item.commissionRate}%</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="font-black text-sm text-bee-black">₩{item.commissionAmount.toLocaleString()}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {revenueData.items.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-16 text-center text-gray-400 border-dashed border-2 border-gray-50 rounded-2xl m-4">
                                                        <i className="fa-solid fa-folder-open mb-3 text-2xl text-gray-200 block"></i>
                                                        해당 기간의 정산 완료 건이 없습니다.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-5">예약 정보</th>
                                        <th className="px-6 py-5">유형/짐</th>
                                        <th className="px-6 py-5">상태 제어</th>
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
                                                        <td colSpan={5} className="px-8 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                            📅 {bDate}
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="font-black text-bee-black mb-1">{b.userName}</div>
                                                        <div className="text-[10px] font-bold text-gray-400 font-mono tracking-tighter">{b.reservationCode || b.id}</div>
                                                    </td>
                                                    <td className="px-6 py-6 font-bold">
                                                        <div className="flex flex-col gap-1">
                                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md w-fit ${b.serviceType === ServiceType.DELIVERY ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
                                                                {b.serviceType === ServiceType.DELIVERY ? '배송' : '보관'}
                                                            </span>
                                                            <div className="flex gap-1">
                                                                {b.pickupLocation === branchId && (
                                                                    <span className="text-[8px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded uppercase">출발(Pick)</span>
                                                                )}
                                                                {b.dropoffLocation === branchId && (
                                                                    <span className="text-[8px] font-black bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded uppercase">도착(Drop)</span>
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-bold text-bee-black">짐 {b.bags}개</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 font-bold">
                                                        <select
                                                            value={b.status}
                                                            onChange={(e) => handleStatusUpdate(b.id!, e.target.value as BookingStatus)}
                                                            className={`text-[10px] font-black p-2 rounded-xl border-none outline-none cursor-pointer transition-colors ${b.status === BookingStatus.PENDING ? 'bg-orange-50 text-orange-500' :
                                                                b.status === BookingStatus.CONFIRMED ? 'bg-teal-50 text-teal-600' :
                                                                    b.status === BookingStatus.TRANSIT ? 'bg-blue-50 text-blue-500' :
                                                                        b.status === BookingStatus.STORAGE ? 'bg-indigo-50 text-indigo-500' :
                                                                            b.status === BookingStatus.ARRIVED ? 'bg-purple-50 text-purple-500' :
                                                                                b.status === BookingStatus.COMPLETED ? 'bg-green-50 text-green-500' :
                                                                                    b.status === BookingStatus.CANCELLED ? 'bg-red-50 text-red-500' :
                                                                                        b.status === BookingStatus.REFUNDED ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-400'
                                                                }`}
                                                            title="예약 상태 변경"
                                                            aria-label="예약 상태 변경"
                                                        >
                                                            {Object.values(BookingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <div className="text-xs font-bold text-bee-black">{b.pickupDate}</div>
                                                        <div className="text-[10px] text-gray-400">{b.pickupTime}</div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button onClick={() => setSelectedBooking(b)} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-bee-black hover:text-bee-yellow transition-all flex items-center justify-center ml-auto" title="예약 상세 보기" aria-label="예약 상세 보기">
                                                            <i className="fa-solid fa-eye text-xs"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
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
            />
        </div >
    );
};

export default BranchAdminPage;
