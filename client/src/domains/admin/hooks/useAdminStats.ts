import { useMemo } from 'react';
import { BookingState, BookingStatus, ServiceType, Expenditure, CashClosing } from '../../../../types';

interface StatisticsParams {
    bookings: BookingState[];
    expenditures: Expenditure[];
    revenueStartDate: string;
    revenueEndDate: string;
    closings: CashClosing[];
}

export const useAdminStats = ({
    bookings,
    expenditures,
    revenueStartDate,
    revenueEndDate,
    closings
}: StatisticsParams) => {

    const revenueStats = useMemo(() => {
        const start = new Date(revenueStartDate);
        const end = new Date(revenueEndDate);
        end.setHours(23, 59, 59, 999);

        const targetBookings = bookings.filter((b: BookingState) => {
            const d = new Date(b.pickupDate || '');
            return d >= start && d <= end &&
                !b.isDeleted &&
                b.status !== BookingStatus.CANCELLED &&
                b.status !== BookingStatus.REFUNDED;
        });

        const targetExps = expenditures.filter((e: Expenditure) => {
            const d = new Date(e.date);
            return d >= start && d <= end;
        });

        const firstDayOfMonth = new Date(end.getFullYear(), end.getMonth(), 1);
        const mtdBookings = bookings.filter(b => {
            const d = new Date(b.pickupDate || '');
            return d >= firstDayOfMonth && d <= end && !b.isDeleted && b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.REFUNDED;
        });
        const mtdRevenue = mtdBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);

        const lifetimeBookings = bookings.filter(b => !b.isDeleted && b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.REFUNDED);
        const lifetimeRevenue = lifetimeBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);

        const totalRevenue = targetBookings.reduce((sum: number, b: BookingState) => sum + (b.finalPrice || 0), 0);
        const totalExp = targetExps.reduce((sum: number, e: Expenditure) => sum + (e.amount || 0), 0);

        const filterMethod = (method: string) => targetBookings.filter((b: BookingState) => b.paymentMethod === method).reduce((sum: number, b: BookingState) => sum + (b.finalPrice || 0), 0);

        return {
            total: totalRevenue,
            cash: filterMethod('cash'),
            card: filterMethod('card'),
            apple: filterMethod('apple'),
            samsung: filterMethod('samsung'),
            wechat: filterMethod('wechat'),
            alipay: filterMethod('alipay'),
            naver: filterMethod('naver'),
            kakao: filterMethod('kakao'),
            paypal: filterMethod('paypal'),
            count: targetBookings.length,
            expenditure: totalExp,
            netTotal: totalRevenue - totalExp,
            vat: Math.round(totalRevenue / 11),
            mtdRevenue,
            lifetimeRevenue,
            lifetimeCount: lifetimeBookings.length
        };
    }, [bookings, expenditures, revenueStartDate, revenueEndDate]);

    const dailySettlementStats = useMemo(() => {
        const start = new Date(revenueStartDate);
        const end = new Date(revenueEndDate);
        end.setHours(23, 59, 59, 999);

        const targetBookings = bookings.filter((b: BookingState) => {
            const d = new Date(b.pickupDate || '');
            return d >= start && d <= end && !b.isDeleted && b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.REFUNDED;
        });

        const targetExps = expenditures.filter((e: Expenditure) => {
            const d = new Date(e.date);
            return d >= start && d <= end;
        });

        const firstDayOfMonth = new Date(end.getFullYear(), end.getMonth(), 1);
        const mtdBookings = bookings.filter(b => {
            const d = new Date(b.pickupDate || '');
            return d >= firstDayOfMonth && d <= end && !b.isDeleted && b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.REFUNDED;
        });
        const mtdRevenue = mtdBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);

        const deliveryBookings = targetBookings.filter(b => b.serviceType === ServiceType.DELIVERY);
        const storageBookings = targetBookings.filter(b => b.serviceType === ServiceType.STORAGE);

        const bagSizes = { S: 0, M: 0, L: 0, XL: 0 };
        targetBookings.forEach(b => {
            if (b.bagSizes) {
                bagSizes.S += (b.bagSizes.S || 0);
                bagSizes.M += (b.bagSizes.M || 0);
                bagSizes.L += (b.bagSizes.L || 0);
                bagSizes.XL += (b.bagSizes.XL || 0);
            }
        });

        const revenueByMethod: Record<string, number> = { card: 0, cash: 0, apple: 0, samsung: 0, wechat: 0, alipay: 0, naver: 0, kakao: 0, paypal: 0 };
        targetBookings.forEach(b => {
            const method = b.paymentMethod || 'cash';
            if (method in revenueByMethod) revenueByMethod[method] += (b.finalPrice || 0);
        });

        const totalRevenue = targetBookings.reduce((sum: number, b: BookingState) => sum + (b.finalPrice || 0), 0);
        const totalExp = targetExps.reduce((sum: number, e: Expenditure) => sum + (e.amount || 0), 0);

        const expByCategory: Record<string, number> = {};
        targetExps.forEach((e: Expenditure) => {
            const cat = e.category || '기타';
            expByCategory[cat] = (expByCategory[cat] || 0) + (e.amount || 0);
        });

        const prevDate = new Date(end);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = prevDate.toISOString().split('T')[0];
        const prevClosing = (closings || []).find((c: CashClosing) => c.date === prevDateStr);
        const openingCash = prevClosing ? prevClosing.actualCashOnHand : 0;

        const cancelledCount = targetBookings.filter(b => b.status === BookingStatus.CANCELLED).length;
        const refundedCount = targetBookings.filter(b => b.status === BookingStatus.REFUNDED).length;

        const discountCodeCounts: Record<string, number> = {};
        targetBookings.forEach(b => {
            if (b.discountCode) {
                discountCodeCounts[b.discountCode] = (discountCodeCounts[b.discountCode] || 0) + 1;
            }
        });

        return {
            totalRevenue,
            totalExp,
            netProfit: totalRevenue - totalExp,
            vat: Math.round(totalRevenue / 11),
            deliveryCount: deliveryBookings.length,
            storageCount: storageBookings.length,
            bagSizes,
            revenueByMethod,
            expByCategory,
            mtdRevenue,
            openingCash,
            discountCodeCounts,
            cancelledCount,
            refundedCount,
        };
    }, [bookings, expenditures, revenueStartDate, revenueEndDate, closings]);

    const accountingStats = useMemo(() => {
        const statsMap: Record<string, { date: string, count: number, total: number, cumulative: number }> = {};
        const monthMap: Record<string, { month: string, count: number, total: number, cumulative: number }> = {};
        const start = new Date(revenueStartDate);
        const end = new Date(revenueEndDate);
        end.setHours(23, 59, 59, 999);

        const targetBookings = bookings.filter(b => {
            const d = new Date(b.pickupDate || '');
            return d >= start && d <= end && !b.isDeleted && b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.REFUNDED;
        });

        targetBookings.forEach(b => {
            const dateKey = b.pickupDate || 'Unknown';
            if (!statsMap[dateKey]) statsMap[dateKey] = { date: dateKey, count: 0, total: 0, cumulative: 0 };
            statsMap[dateKey].count++;
            statsMap[dateKey].total += (b.finalPrice || 0);

            if (dateKey !== 'Unknown') {
                const monthKey = dateKey.slice(0, 7);
                if (!monthMap[monthKey]) monthMap[monthKey] = { month: monthKey, count: 0, total: 0, cumulative: 0 };
                monthMap[monthKey].count++;
                monthMap[monthKey].total += (b.finalPrice || 0);
            }
        });

        const sortedDaily = Object.values(statsMap).sort((a, b) => a.date.localeCompare(b.date));
        let dailyAcc = 0;
        sortedDaily.forEach(s => { dailyAcc += s.total; s.cumulative = dailyAcc; });

        const sortedMonthly = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
        let monthlyAcc = 0;
        sortedMonthly.forEach(s => { monthlyAcc += s.total; s.cumulative = monthlyAcc; });

        return {
            daily: sortedDaily.reverse(),
            monthly: sortedMonthly.reverse()
        };
    }, [bookings, revenueStartDate, revenueEndDate]);

    return {
        revenueStats,
        dailySettlementStats,
        accountingDailyStats: accountingStats.daily,
        accountingMonthlyStats: accountingStats.monthly
    };
};
