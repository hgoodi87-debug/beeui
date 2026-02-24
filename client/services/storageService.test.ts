import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from './storageService';
import { getDoc, getDocs } from 'firebase/firestore';

// firebase/firestore mock은 setupTests.ts에서 이미 처리됨
// 하지만 개별 테스트에서 구현을 커스텀하기 위해 다시 가져옴

describe('StorageService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getUserProfile', () => {
        it('should return user profile if it exists', async () => {
            const mockData = {
                uid: 'test-uid',
                email: 'test@example.com',
                displayName: 'Test User',
                points: 1000,
                level: 'BRONZE'
            };

            (getDoc as any).mockResolvedValueOnce({
                exists: () => true,
                data: () => mockData
            });

            const profile = await StorageService.getUserProfile('test-uid');
            expect(profile).toEqual(mockData);
        });

        it('should return null if user profile does not exist', async () => {
            (getDoc as any).mockResolvedValueOnce({
                exists: () => false
            });

            const profile = await StorageService.getUserProfile('non-existent');
            expect(profile).toBeNull();
        });
    });

    describe('getUserCoupons', () => {
        it('should return list of unused coupons for a user', async () => {
            const mockCoupons = [
                { id: 'c1', uid: 'u1', code: 'WELCOME', isUsed: false },
                { id: 'c2', uid: 'u1', code: 'BONUS', isUsed: false }
            ];

            (getDocs as any).mockResolvedValueOnce({
                docs: mockCoupons.map(c => ({
                    id: c.id,
                    data: () => ({ ...c, id: undefined })
                }))
            });

            const coupons = await StorageService.getUserCoupons('u1');
            expect(coupons).toHaveLength(2);
            expect(coupons[0].code).toBe('WELCOME');
            expect(coupons[1].id).toBe('c2');
        });

        it('should return empty array if error occurs', async () => {
            (getDocs as any).mockRejectedValueOnce(new Error('Firestore Error'));

            const coupons = await StorageService.getUserCoupons('u1');
            expect(coupons).toEqual([]);
        });
    });
});
