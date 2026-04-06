import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../../../services/storageService';
import { BookingState } from '../types';

/**
 * Hook: useBookings
 * Fetches all bookings via Supabase and subscribes to real-time updates.
 * Syncs with TanStack Query cache on each update.
 */
export const useBookings = () => {
    const queryClient = useQueryClient();

    const query = useQuery<BookingState[]>({
        queryKey: ['bookings'],
        queryFn: () => StorageService.getBookings(),
        staleTime: Infinity,
    });

    useEffect(() => {
        const unsubscribe = StorageService.subscribeBookings((data) => {
            queryClient.setQueryData(['bookings'], data);
        });
        return () => unsubscribe();
    }, [queryClient]);

    return query;
};
