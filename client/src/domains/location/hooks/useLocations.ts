import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../../../services/storageService';
import { LocationOption } from '../types';

interface UseLocationsOptions {
    enabled?: boolean;
    includeInactive?: boolean;
}

/**
 * Hook: useLocations
 * Fetches branch locations via Supabase and subscribes to real-time updates.
 * Syncs with TanStack Query cache on each update.
 */
export const useLocations = ({ enabled = true, includeInactive = false }: UseLocationsOptions = {}) => {
    const queryClient = useQueryClient();

    const query = useQuery<LocationOption[]>({
        queryKey: ['locations', includeInactive ? 'all' : 'active'],
        queryFn: () => StorageService.getLocations({ includeInactive }),
        staleTime: Infinity,
        enabled,
    });

    useEffect(() => {
        if (!enabled) return;

        const unsubscribe = StorageService.subscribeLocations((data) => {
            queryClient.setQueryData(['locations', includeInactive ? 'all' : 'active'], data);
        }, { includeInactive });
        return () => unsubscribe();
    }, [enabled, includeInactive, queryClient]);

    return query;
};
