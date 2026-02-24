import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../../../services/storageService';
import { LocationOption } from '../types';

/**
 * Hook: useLocations
 * Fetches and subscribes to available branch locations in real-time.
 * Synchronizes Firestore onSnapshot with TanStack Query cache.
 */
export const useLocations = () => {
    const queryClient = useQueryClient();

    const query = useQuery<LocationOption[]>({
        queryKey: ['locations'],
        queryFn: async () => {
            console.log('[DAL] Initial fetch for locations...');
            return await StorageService.getLocations();
        },
        staleTime: Infinity, // Rely on real-time updates after initial fetch
    });

    useEffect(() => {
        console.log('[DAL] Subscribing to locations real-time...');
        const unsubscribe = StorageService.subscribeLocations((data) => {
            queryClient.setQueryData(['locations'], data);
        });
        return () => unsubscribe();
    }, [queryClient]);

    return query;
};
