import { useMemo } from 'react';
import {
    BookingState,
    BookingStatus,
    ServiceType,
    Expenditure,
    CashClosing,
    AdminRevenueDailySummary,
    AdminRevenueMonthlySummary,
} from '../../../../types';
import { sanitizeBagSizes } from '../../booking/bagCategoryUtils';

interface StatisticsParams {
    bookings: BookingState[];
    expenditures: Expenditure[];
    revenueStartDate: string;
    revenueEndDate: string;
    closings: CashClosing[];
    revenueDailySummaries?: AdminRevenueDailySummary[];
    revenueMonthlySummaries?: AdminRevenueMonthlySummary[];
}

const toSafeNumber = (value: unknown): number => Number(value || 0) || 0;

const sumSummaryField = <
    T extends AdminRevenueDailySummary | AdminRevenueMonthlySummary,
    K extends keyof T
>(items: T[], key: K): number =>
    items.reduce((sum, item) => sum + toSafeNumber(item[key]), 0);

export const useAdminStats = ({
    bookings,
    expenditures,
    revenueStartDate,
    revenueEndDate,
    closings,
    revenueDailySummaries = [],
    revenueMonthlySummaries = [],
}: StatisticsParams) => {

    const dailySummaryContext = useMemo(() => {
        const start = new Date(revenueStartDate);
        const end = new Date(revenueEndDate);
        end.setHours(23, 59, 59, 999);

        const hasSqlSummaries = revenueDailySummaries.length > 0;
        const filteredDailySummaries = revenueDailySummaries.filter((summary) => {
            const summaryDate = new Date(summary.date);
            return summaryDate >= start && summaryDate <= end;
        });

        const firstDayOfMonth = new Date(end.getFullYear(), end.getMonth(), 1);
        const monthToDateSummaries = revenueDailySummaries.filter((summary) => {
            const summaryDate = new Date(summary.date);
            return summaryDate >= firstDayOfMonth && summaryDate <= end;
        });

        return {
            hasSqlSummaries,
            filteredDailySummaries,
            monthToDateSummaries,
        };
    }, [revenueDailySummaries, revenueStartDate, revenueEndDate]);

    const revenueStats = useMemo(() => {
        const start = new Date(revenueStartDate);
        const end = new Date(revenueEndDate);
        end.setHours(23, 59, 59, 999);

        const targetExps = expenditures.filter((e: Expenditure) => {
            const d = new Date(e.date);
            return d >= start && d <= end;
        });
        const totalExp = targetExps.reduce((sum: number, e: Expenditure) => sum + (e.amount || 0), 0);

        if (dailySummaryContext.hasSqlSummaries) {
            const totalRevenue = sumSummaryField(dailySummaryContext.filteredDailySummaries, 'totalRevenue');
            const mtdRevenue = sumSummaryField(dailySummaryContext.monthToDateSummaries, 'totalRevenue');
            const lifetimeRevenue = sumSummaryField(revenueDailySummaries, 'totalRevenue');
            const lifetimeCount = sumSummaryField(revenueDailySummaries, 'activeBookingCount');

            return {
                total: totalRevenue,
                cash: sumSummaryField(dailySummaryContext.filteredDailySummaries, 'cashRevenue'),
                card: sumSummaryField(dailySummaryContext.filteredDailySummaries, 'cardRevenue'),
                apple: sumSummaryField(dailySummaryContext.filteredDailySummaries, 'appleRevenue'),
                samsung: sumSummaryField(dailySummaryContext.filteredDailySummaries, 'samsungRevenue'),
                wechat: sumSummaryField(dailySummaryContext.filteredDailySummaries, 'wechatRevenue'),
                alipay: sumSummaryField(dailySummaryContext.filteredDailySummaries, 'alipayRevenue'),
                naver: sumSummaryField(dailySummaryContext.filteredDailySummaries, 'naverRevenue'),
                kakao: sumSummaryField(dailySummaryContext.filteredDailySummaries, 'kakaoRevenue'),
                paypal: sumSummaryField(dailySummaryContext.filteredDailySummaries, 'paypalRevenue'),
                count: sumSummaryField(dailySummaryContext.filteredDailySummaries, 'activeBookingCount'),
                expenditure: totalExp,
                netTotal: totalRevenue - totalExp,
                vat: Math.round(totalRevenue / 11),
                mtdRevenue,
                lifetimeRevenue,
                lifetimeCount,
            };
        }

        const targetBookings = bookings.filter((b: BookingState) => {
            const dStr = (b.pickupDate || '').trim();
            if (!dStr) return false;
            const d = new Date(dStr);
            return d >= start && d <= end &&
                !b.isDeleted &&
                b.status !== BookingStatus.CANCELLED &&
                b.status !== BookingStatus.REFUNDED;
        });

        const firstDayOfMonth = new Date(end.getFullYear(), end.getMonth(), 1);
        const mtdBookings = bookings.filter(b => {
            const d = new Date(b.pickupDate || '');
            return d >= firstDayOfMonth && d <= end && !b.isDeleted && b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.REFUNDED;
        });
        const mtdRevenue = mtdBookings.reduce((sum, b) => sum + (b.settlementHardCopyAmount ?? b.finalPrice ?? 0), 0);

        const lifetimeBookings = bookings.filter(b => !b.isDeleted && b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.REFUNDED);
        const lifetimeRevenue = lifetimeBookings.reduce((sum, b) => sum + (b.settlementHardCopyAmount ?? b.finalPrice ?? 0), 0);

        const totalRevenue = targetBookings.reduce((sum: number, b: BookingState) => sum + (b.settlementHardCopyAmount ?? b.finalPrice ?? 0), 0);
        const filterMethod = (method: string) => targetBookings.filter((b: BookingState) => b.paymentMethod === method).reduce((sum: number, b: BookingState) => sum + (b.settlementHardCopyAmount ?? b.finalPrice ?? 0), 0);

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
    }, [bookings, dailySummaryContext, expenditures, revenueDailySummaries, revenueEndDate, revenueStartDate]);

    const dailySettlementStats = useMemo(() => {
        const start = new Date(revenueStartDate);
        const end = new Date(revenueEndDate);
        end.setHours(23, 59, 59, 999);

        const targetExps = expenditures.filter((e: Expenditure) => {
            const d = new Date(e.date);
            return d >= start && d <= end;
        });

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
        const totalExp = targetExps.reduce((sum: number, e: Expenditure) => sum + (e.amount || 0), 0);

        const discountCodeCounts: Record<string, number> = {};
        bookings.forEach((b) => {
            if (!b.discountCode) return;
            const d = new Date(b.pickupDate || '');
            if (d < start || d > end || b.isDeleted || b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REFUNDED) return;
            discountCodeCounts[b.discountCode] = (discountCodeCounts[b.discountCode] || 0) + 1;
        });

        if (dailySummaryContext.hasSqlSummaries) {
            const targetSummaries = dailySummaryContext.filteredDailySummaries;
            const totalRevenue = sumSummaryField(targetSummaries, 'totalRevenue');

            return {
                totalRevenue,
                totalExp,
                netProfit: totalRevenue - totalExp,
                vat: Math.round(totalRevenue / 11),
                deliveryCount: sumSummaryField(targetSummaries, 'deliveryCount'),
                storageCount: sumSummaryField(targetSummaries, 'storageCount'),
                bagSizes: {
                    handBag: sumSummaryField(targetSummaries, 'handBagCount'),
                    carrier: sumSummaryField(targetSummaries, 'carrierCount'),
                    strollerBicycle: sumSummaryField(targetSummaries, 'strollerBicycleCount'),
                },
                revenueByMethod: {
                    card: sumSummaryField(targetSummaries, 'cardRevenue'),
                    cash: sumSummaryField(targetSummaries, 'cashRevenue'),
                    apple: sumSummaryField(targetSummaries, 'appleRevenue'),
                    samsung: sumSummaryField(targetSummaries, 'samsungRevenue'),
                    wechat: sumSummaryField(targetSummaries, 'wechatRevenue'),
                    alipay: sumSummaryField(targetSummaries, 'alipayRevenue'),
                    naver: sumSummaryField(targetSummaries, 'naverRevenue'),
                    kakao: sumSummaryField(targetSummaries, 'kakaoRevenue'),
                    paypal: sumSummaryField(targetSummaries, 'paypalRevenue'),
                },
                expByCategory,
                mtdRevenue: sumSummaryField(dailySummaryContext.monthToDateSummaries, 'totalRevenue'),
                openingCash,
                discountCodeCounts,
                cancelledCount: sumSummaryField(targetSummaries, 'cancelledCount'),
                refundedCount: sumSummaryField(targetSummaries, 'refundedCount'),
                cancelledTotal: sumSummaryField(targetSummaries, 'cancelledTotal'),
                refundedTotal: sumSummaryField(targetSummaries, 'refundedTotal'),
                confirmedAmount: sumSummaryField(targetSummaries, 'confirmedAmount'),
                unconfirmedAmount: sumSummaryField(targetSummaries, 'unconfirmedAmount'),
                partnerPayoutTotal: sumSummaryField(targetSummaries, 'partnerPayoutTotal'),
            };
        }

        const targetBookings = bookings.filter((b: BookingState) => {
            const d = new Date(b.pickupDate || '');
            return d >= start && d <= end && !b.isDeleted && b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.REFUNDED;
        });

        const firstDayOfMonth = new Date(end.getFullYear(), end.getMonth(), 1);
        const mtdBookings = bookings.filter(b => {
            const d = new Date(b.pickupDate || '');
            return d >= firstDayOfMonth && d <= end && !b.isDeleted && b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.REFUNDED;
        });
        const mtdRevenue = mtdBookings.reduce((sum, b) => sum + (b.settlementHardCopyAmount ?? b.finalPrice ?? 0), 0);

        const deliveryBookings = targetBookings.filter(b => b.serviceType === ServiceType.DELIVERY);
        const storageBookings = targetBookings.filter(b => b.serviceType === ServiceType.STORAGE);

        const bagSizes = { handBag: 0, carrier: 0, strollerBicycle: 0 };
        targetBookings.forEach(b => {
            if (b.bagSizes) {
                const normalized = sanitizeBagSizes(b.bagSizes);
                bagSizes.handBag += normalized.handBag;
                bagSizes.carrier += normalized.carrier;
                bagSizes.strollerBicycle += normalized.strollerBicycle;
            }
        });

        const revenueByMethod: Record<string, number> = { card: 0, cash: 0, apple: 0, samsung: 0, wechat: 0, alipay: 0, naver: 0, kakao: 0, paypal: 0 };
        targetBookings.forEach(b => {
            const method = b.paymentMethod || 'cash';
            if (method in revenueByMethod) revenueByMethod[method] += (b.settlementHardCopyAmount ?? b.finalPrice ?? 0);
        });

        const totalRevenue = targetBookings.reduce((sum: number, b: BookingState) => sum + (b.settlementHardCopyAmount ?? b.finalPrice ?? 0), 0);

        const cancelledBookings = bookings.filter(b => {
            const d = new Date(b.pickupDate || '');
            return d >= start && d <= end && !b.isDeleted && b.status === BookingStatus.CANCELLED;
        });
        const refundedBookings = bookings.filter(b => {
            const d = new Date(b.pickupDate || '');
            return d >= start && d <= end && !b.isDeleted && b.status === BookingStatus.REFUNDED;
        });

        const cancelledTotal = cancelledBookings.reduce((sum, b) => sum + (b.settlementHardCopyAmount ?? b.finalPrice ?? 0), 0);
        const refundedTotal = refundedBookings.reduce((sum, b) => sum + (b.settlementHardCopyAmount ?? b.finalPrice ?? 0), 0);

        let confirmedAmount = 0;
        let unconfirmedAmount = 0;
        let partnerPayoutTotal = 0;

        targetBookings.forEach(b => {
            const amount = b.settlementHardCopyAmount ?? b.finalPrice ?? 0;
            if (b.settlementStatus === 'CONFIRMED') {
                confirmedAmount += amount;
            } else {
                unconfirmedAmount += amount;
            }
            if (b.branchSettlementAmount) {
                partnerPayoutTotal += b.branchSettlementAmount;
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
            cancelledCount: cancelledBookings.length,
            refundedCount: refundedBookings.length,
            cancelledTotal,
            refundedTotal,
            confirmedAmount,
            unconfirmedAmount,
            partnerPayoutTotal,
        };
    }, [bookings, closings, dailySummaryContext, expenditures, revenueEndDate, revenueStartDate]);

    const accountingStats = useMemo(() => {
        if (dailySummaryContext.hasSqlSummaries && revenueMonthlySummaries.length > 0) {
            const start = new Date(revenueStartDate);
            const end = new Date(revenueEndDate);
            end.setHours(23, 59, 59, 999);

            const filteredMonthlySummaries = revenueMonthlySummaries.filter((summary) => {
                const summaryMonth = new Date(summary.month);
                return summaryMonth <= end && summaryMonth >= new Date(start.getFullYear(), start.getMonth(), 1);
            });

            const sortedDaily = [...dailySummaryContext.filteredDailySummaries]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((summary) => ({
                    date: summary.date,
                    count: summary.activeBookingCount,
                    total: summary.totalRevenue,
                    cumulative: 0,
                }));

            let dailyAcc = 0;
            sortedDaily.forEach((summary) => {
                dailyAcc += summary.total;
                summary.cumulative = dailyAcc;
            });

            const sortedMonthly = [...filteredMonthlySummaries]
                .sort((a, b) => a.month.localeCompare(b.month))
                .map((summary) => ({
                    month: summary.month,
                    count: summary.activeBookingCount,
                    total: summary.totalRevenue,
                    cumulative: 0,
                }));

            let monthlyAcc = 0;
            sortedMonthly.forEach((summary) => {
                monthlyAcc += summary.total;
                summary.cumulative = monthlyAcc;
            });

            return {
                daily: sortedDaily.reverse(),
                monthly: sortedMonthly.reverse(),
            };
        }

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
            statsMap[dateKey].total += (b.settlementHardCopyAmount ?? b.finalPrice ?? 0);

            if (dateKey !== 'Unknown') {
                const monthKey = dateKey.slice(0, 7);
                if (!monthMap[monthKey]) monthMap[monthKey] = { month: monthKey, count: 0, total: 0, cumulative: 0 };
                monthMap[monthKey].count++;
                monthMap[monthKey].total += (b.settlementHardCopyAmount ?? b.finalPrice ?? 0);
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
    }, [bookings, dailySummaryContext, revenueEndDate, revenueMonthlySummaries, revenueStartDate]);

    return {
        revenueStats,
        dailySettlementStats,
        accountingDailyStats: accountingStats.daily,
        accountingMonthlyStats: accountingStats.monthly,
        monthlyControlStats: {
            gross: dailySettlementStats.totalRevenue,
            confirmed: dailySettlementStats.confirmedAmount,
            unconfirmed: dailySettlementStats.unconfirmedAmount,
            payout: dailySettlementStats.partnerPayoutTotal,
            netMargin: dailySettlementStats.totalRevenue - dailySettlementStats.partnerPayoutTotal - dailySettlementStats.totalExp,
            expenditure: dailySettlementStats.totalExp,
            orderCount: dailySettlementStats.deliveryCount + dailySettlementStats.storageCount,
            cancelledCount: dailySettlementStats.cancelledCount,
            refundedCount: dailySettlementStats.refundedCount
        }
    };
};
