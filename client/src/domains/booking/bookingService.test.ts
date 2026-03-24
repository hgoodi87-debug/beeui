import { describe, expect, it } from 'vitest';
import { calculateBookingStoragePrice, STORAGE_RATES } from './bookingService';

const makeDate = (value: string) => new Date(`${value}+09:00`);

describe('calculateBookingStoragePrice', () => {
    it('쇼핑백, 손가방은 4시간 이내 기본요금을 적용한다', () => {
        const result = calculateBookingStoragePrice(
            makeDate('2026-03-23T09:00'),
            makeDate('2026-03-23T11:00'),
            { handBag: 1, carrier: 0, strollerBicycle: 0 },
            'ko'
        );

        expect(result.total).toBe(STORAGE_RATES.handBag.hours4);
    });

    it('4시간 초과 24시간 미만은 1시간 단위로 추가한다', () => {
        const result = calculateBookingStoragePrice(
            makeDate('2026-03-23T09:00'),
            makeDate('2026-03-23T14:00'),
            { handBag: 1, carrier: 1, strollerBicycle: 0 },
            'ko'
        );

        expect(result.total).toBe(4200 + 5250);
    });

    it('24시간은 첫날 정액을 적용한다', () => {
        const result = calculateBookingStoragePrice(
            makeDate('2026-03-23T09:00'),
            makeDate('2026-03-24T09:00'),
            { handBag: 0, carrier: 0, strollerBicycle: 1 },
            'ko'
        );

        expect(result.total).toBe(STORAGE_RATES.strollerBicycle.day1);
    });

    it('영업시간을 넘겨 다음날 찾는 보관 예약은 24시간 미만이어도 첫날 정액을 적용한다', () => {
        const result = calculateBookingStoragePrice(
            makeDate('2026-03-23T20:00'),
            makeDate('2026-03-24T10:00'),
            { handBag: 1, carrier: 0, strollerBicycle: 0 },
            'ko',
            { businessHours: '10:00 - 21:00' }
        );

        expect(result.total).toBe(STORAGE_RATES.handBag.day1);
        expect(result.durationText).toBe('1일 0시간');
    });

    it('24시간 초과는 남은 시간을 1시간 단위로 추가한다', () => {
        const result = calculateBookingStoragePrice(
            makeDate('2026-03-23T09:00'),
            makeDate('2026-03-24T11:00'),
            { handBag: 0, carrier: 1, strollerBicycle: 0 },
            'ko'
        );

        expect(result.total).toBe(STORAGE_RATES.carrier.day1 + (STORAGE_RATES.carrier.hourlyAfter4h * 2));
        expect(result.durationText).toBe('1일 2시간');
    });
});
