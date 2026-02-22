import React, { useState, useEffect, useMemo } from 'react';
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
    const path = window.location.pathname;
    const branchId = propsBranchId || (path.startsWith('/branch/') ? path.split('/')[2] : '');

    const [bookings, setBookings] = useState<BookingState[]>([]);
    const [locations, setLocations] = useState<LocationOption[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'STAFF'>('ALL');
    const [selectedBooking, setSelectedBooking] = useState<BookingState | null>(null);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
    const [refundingId, setRefundingId] = useState<string | null>(null);
    const [staff, setStaff] = useState<any[]>([]);
    const [staffForm, setStaffForm] = useState<any>({});
    const [showStaffPassword, setShowStaffPassword] = useState(false);

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
            const matchesSearch =
                b.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.reservationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.id?.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;
            if (activeTab === 'ALL') return true;
            if (activeTab === 'PENDING') return b.status === BookingStatus.PENDING;
            if (activeTab === 'ACTIVE') return [BookingStatus.TRANSIT, BookingStatus.STORAGE, BookingStatus.ARRIVED].includes(b.status as any);
            if (activeTab === 'COMPLETED') return b.status === BookingStatus.COMPLETED;
            return true;
        });
    }, [bookings, searchTerm, activeTab]);

    const bt = t.branch_admin || {};

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
        setIsSaving(true);
        try {
            // Generate full booking object
            const newBooking: BookingState = {
                ...formData,
                pickupLocation: branchId,
                status: BookingStatus.CONFIRMED,
                createdAt: new Date().toISOString(),
                reservationCode: '' // Will be generated by storageService
            };
            await StorageService.saveBooking(newBooking);
            alert(bt.manual_booking_success || 'Manual booking saved successfully.');
            setIsManualModalOpen(false);
        } catch (e) {
            console.error(e);
            alert('Manual booking failed.');
        } finally {
            setIsSaving(false);
        }
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

    const handleSaveManualBooking = async (formData: any) => {
        setIsSaving(true);
        try {
            await StorageService.saveBooking(formData);
            setIsManualModalOpen(false);
            alert(bt.booking_created_success || 'Booking created successfully');
        } catch (error) {
            console.error(error);
            alert('Failed to save booking');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-bee-black font-sans">
            <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-bee-black flex items-center justify-center">
                        <i className="fa-solid fa-store text-bee-yellow text-sm"></i>
                    </div>
                    <div>
                        <h1 className="text-xl font-black italic tracking-tighter">
                            {currentBranch?.name || branchId} <span className="text-bee-yellow">{bt.title}</span>
                        </h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Beeliber Partner Portal</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsManualModalOpen(true)} className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-xl bg-bee-yellow text-bee-black font-black text-sm shadow-lg shadow-bee-yellow/20 hover:scale-105 transition-all">
                        <i className="fa-solid fa-plus"></i>
                        {bt.manual_booking_btn}
                    </button>
                    <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 hover:text-bee-black transition-colors flex items-center justify-center" title="로그아웃" aria-label="로그아웃">
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                    </button>
                </div>
            </nav>

            <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: '전체 예약', count: bookings.length, icon: 'fa-list' },
                        { label: '요청됨', count: bookings.filter(b => b.status === BookingStatus.PENDING).length, icon: 'fa-clock' },
                        { label: '활성(이동/보관)', count: bookings.filter(b => [BookingStatus.TRANSIT, BookingStatus.STORAGE, BookingStatus.ARRIVED].includes(b.status as any)).length, icon: 'fa-truck-fast' },
                        { label: '완료됨', count: bookings.filter(b => b.status === BookingStatus.COMPLETED).length, icon: 'fa-check-double' }
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

                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-full md:w-fit overflow-x-auto no-scrollbar">
                        {['ALL', 'PENDING', 'ACTIVE', 'COMPLETED', 'STAFF'].map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${activeTab === tab ? 'bg-bee-black text-bee-yellow shadow-lg' : 'text-gray-400 hover:text-bee-black'}`}>
                                {tab === 'ALL' ? '전체' : tab === 'PENDING' ? '요청' : tab === 'ACTIVE' ? '활동' : tab === 'COMPLETED' ? '완료' : '직원 관리'}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-80">
                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="예약자명, 예약코드 검색..." className="w-full bg-white pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:border-bee-yellow shadow-sm outline-none font-bold text-sm" />
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
                                                <button type="button" onClick={() => setShowStaffPassword(!showStaffPassword)} className="absolute right-3 top-[34px] text-gray-300 hover:text-bee-black transition-colors">
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
                                    {filteredBookings.map((b) => (
                                        <tr key={b.id} className="hover:bg-gray-50/50 transition-colors group">
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
                                                    className={`text-xs font-black p-2 rounded-xl border-none outline-none cursor-pointer ${b.status === BookingStatus.PENDING ? 'bg-orange-50 text-orange-500' :
                                                        b.status === BookingStatus.TRANSIT ? 'bg-blue-50 text-blue-500' :
                                                            b.status === BookingStatus.STORAGE ? 'bg-indigo-50 text-indigo-500' :
                                                                b.status === BookingStatus.ARRIVED ? 'bg-purple-50 text-purple-500' :
                                                                    b.status === BookingStatus.COMPLETED ? 'bg-green-50 text-green-500' : 'bg-gray-100 text-gray-400'
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
                                    ))}
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

            <BranchManualBookingModal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
                branchId={branchId}
                locations={locations}
                storageTiers={INITIAL_STORAGE_TIERS}
                onSave={handleSaveManualBooking}
                isSaving={isSaving}
            />
        </div>
    );
};

export default BranchAdminPage;
