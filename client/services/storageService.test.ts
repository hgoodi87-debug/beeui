import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from './storageService';
import { doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';

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

    describe('deduplicateAdmins', () => {
        it('preserves password-bearing canonical admin records over uid-mapped duplicates', async () => {
            const batchDelete = vi.fn();
            const batchCommit = vi.fn().mockResolvedValue(undefined);

            (writeBatch as any).mockImplementation(() => ({
                delete: batchDelete,
                commit: batchCommit
            }));
            (doc as any).mockImplementation((_db: unknown, collectionName: string, id: string) => ({
                collectionName,
                id
            }));
            (getDocs as any).mockResolvedValueOnce({
                docs: [
                    {
                        id: 'anonymous-uid-001',
                        data: () => ({
                            uid: 'anonymous-uid-001',
                            name: '이서연',
                            email: 'seoyeon@bee-liber.com',
                            loginId: 'seoyeon',
                            role: 'staff',
                            jobTitle: 'CS',
                            branchId: 'hq',
                            createdAt: '2026-03-20T00:00:00.000Z',
                            updatedAt: '2026-03-21T10:00:00.000Z'
                        })
                    },
                    {
                        id: 'admin-seoyeon',
                        data: () => ({
                            name: '이서연',
                            email: 'seoyeon@bee-liber.com',
                            loginId: 'seoyeon',
                            password: '1234',
                            role: 'staff',
                            jobTitle: 'CS',
                            branchId: 'hq',
                            createdAt: '2026-03-20T00:00:00.000Z',
                            updatedAt: '2026-03-20T10:00:00.000Z'
                        })
                    }
                ]
            });

            const result = await StorageService.deduplicateAdmins();

            expect(result).toEqual({ total: 2, removed: 1 });
            expect(doc).toHaveBeenCalledWith(expect.anything(), 'admins', 'anonymous-uid-001');
        });

        it('does not delete ambiguous same-name records without email or loginId', async () => {
            const batchDelete = vi.fn();
            const batchCommit = vi.fn();

            (writeBatch as any).mockReturnValueOnce({
                delete: batchDelete,
                commit: batchCommit
            });
            (getDocs as any).mockResolvedValueOnce({
                docs: [
                    {
                        id: 'admin-1',
                        data: () => ({
                            name: '김민수',
                            jobTitle: '매니저',
                            createdAt: '2026-03-20T00:00:00.000Z'
                        })
                    },
                    {
                        id: 'admin-2',
                        data: () => ({
                            name: '김민수',
                            jobTitle: '팀장',
                            createdAt: '2026-03-21T00:00:00.000Z'
                        })
                    }
                ]
            });

            const result = await StorageService.deduplicateAdmins();

            expect(result).toEqual({ total: 2, removed: 0 });
            expect(batchDelete).not.toHaveBeenCalled();
            expect(batchCommit).not.toHaveBeenCalled();
        });

        it('deletes only older exact duplicates with the same identity key', async () => {
            const batchDelete = vi.fn();
            const batchCommit = vi.fn().mockResolvedValue(undefined);

            (writeBatch as any).mockImplementation(() => ({
                delete: batchDelete,
                commit: batchCommit
            }));
            (doc as any).mockImplementation((_db: unknown, collectionName: string, id: string) => ({
                collectionName,
                id
            }));
            (getDocs as any).mockResolvedValueOnce({
                docs: [
                    {
                        id: 'admin-old',
                        data: () => ({
                            name: '이서연',
                            email: 'seoyeon@bee-liber.com',
                            loginId: 'seoyeon',
                            role: 'staff',
                            jobTitle: 'CS',
                            branchId: 'hq',
                            createdAt: '2026-03-20T00:00:00.000Z',
                            updatedAt: '2026-03-20T10:00:00.000Z'
                        })
                    },
                    {
                        id: 'admin-new',
                        data: () => ({
                            name: '이서연',
                            email: 'seoyeon@bee-liber.com',
                            loginId: 'seoyeon',
                            role: 'staff',
                            jobTitle: 'CS',
                            branchId: 'hq',
                            phone: '010-0000-0000',
                            createdAt: '2026-03-20T00:00:00.000Z',
                            updatedAt: '2026-03-21T10:00:00.000Z'
                        })
                    }
                ]
            });

            const result = await StorageService.deduplicateAdmins();

            expect(result).toEqual({ total: 2, removed: 1 });
            expect(doc).toHaveBeenCalledWith(expect.anything(), 'admins', 'admin-old');
        });
    });

    describe('saveAdmin', () => {
        it('preserves the existing password when an edited admin leaves the password blank', async () => {
            (setDoc as any).mockResolvedValueOnce(undefined);

            await StorageService.saveAdmin({
                id: 'admin-1',
                name: '김민수',
                jobTitle: '매니저',
                password: '   ',
                createdAt: '2026-03-21T00:00:00.000Z'
            } as any);

            expect(setDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    id: 'admin-1',
                    name: '김민수',
                    jobTitle: '매니저',
                    createdAt: '2026-03-21T00:00:00.000Z'
                }),
                { merge: true }
            );
            expect((setDoc as any).mock.calls[0][1]).not.toHaveProperty('password');
        });
    });
});
