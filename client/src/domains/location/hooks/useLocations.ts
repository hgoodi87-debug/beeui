import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../../../services/storageService';
import { LocationOption } from '../types';

interface UseLocationsOptions {
    enabled?: boolean;
}

/**
 * Hook: useLocations
 * Fetches and subscribes to available branch locations in real-time.
 * Synchronizes Firestore onSnapshot with TanStack Query cache.
 */
export const useLocations = ({ enabled = true }: UseLocationsOptions = {}) => {
    const queryClient = useQueryClient();

    const query = useQuery<LocationOption[]>({
        queryKey: ['locations'],
        queryFn: async () => {
            console.log('[DAL] Initial fetch for locations...');
            return await StorageService.getLocations();
        },
        staleTime: Infinity, // Rely on real-time updates after initial fetch
        enabled,
    });

    useEffect(() => {
        if (!enabled) {
            return;
        }

        console.log('[DAL] Subscribing to locations real-time...');
        const unsubscribe = StorageService.subscribeLocations((data) => {
            queryClient.setQueryData(['locations'], data);
        });
        return () => unsubscribe();
    }, [enabled, queryClient]);

    return query;
};
