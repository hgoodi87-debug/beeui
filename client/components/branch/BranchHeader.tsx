import React, { useMemo } from 'react';
import { BookingState, BookingStatus, LocationOption } from '../../types';

interface BranchHeaderProps {
    currentBranch: LocationOption | undefined;
    branchId: string;
    bookings: BookingState[];
}

const BranchHeader: React.FC<BranchHeaderProps> = ({ currentBranch, branchId, bookings }) => {
    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = bookings.filter(b => (b.pickupDate || '').split('T')[0] === today);
        return {
            total: bookings.length,
            pending: bookings.filter(b => b.status === BookingStatus.PENDING).length,
            active: bookings.filter(b => [BookingStatus.CONFIRMED, BookingStatus.TRANSIT, BookingStatus.STORAGE, BookingStatus.ARRIVED].includes(b.status as any)).length,
            completed: bookings.filter(b => b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CONFIRMED).length,
            todayCount: todayBookings.length,
        };
    }, [bookings]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="col-span-2 md:col-span-1 bg-bee-black text-white p-5 rounded-3xl">
                <div className="text-[10px] font-black text-bee-yellow uppercase tracking-widest mb-1">TODAY</div>
                <div className="text-3xl font-black text-bee-yellow">{stats.todayCount}</div>
                <div className="text-[10px] text-gray-400 font-bold mt-1">오늘 예약</div>
            </div>
            {[
                { label: '전체', count: stats.total, icon: 'fa-list', color: 'text-gray-500' },
                { label: '대기', count: stats.pending, icon: 'fa-clock', color: 'text-amber-500' },
                { label: '활성', count: stats.active, icon: 'fa-truck-fast', color: 'text-blue-500' },
                { label: '완료', count: stats.completed, icon: 'fa-check-double', color: 'text-green-500' },
            ].map((stat, idx) => (
                <div key={idx} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <i className={`fa-solid ${stat.icon} ${stat.color} text-xs`}></i>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <div className="text-2xl font-black text-bee-black">{stat.count}</div>
                </div>
            ))}
        </div>
    );
};

export default BranchHeader;
