import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../../../services/storageService';
import { BookingState } from '../types';

/**
 * Hook: useBookings
 * Fetch and subscribe to all bookings in real-time.
 * Synchronizes Firestore onSnapshot with TanStack Query cache.
 */
export const useBookings = () => {
    const queryClient = useQueryClient();

    const query = useQuery<BookingState[]>({
        queryKey: ['bookings'],
        queryFn: async () => {
            console.log('[DAL] Initial fetch for bookings...');
            return await StorageService.getBookings();
        },
        staleTime: Infinity, // Rely on real-time updates after initial fetch
    });

    useEffect(() => {
        console.log('[DAL] Subscribing to bookings real-time...');
        const unsubscribe = StorageService.subscribeBookings((data) => {
            queryClient.setQueryData(['bookings'], data);
        });
        return () => unsubscribe();
    }, [queryClient]);

    return query;
};
