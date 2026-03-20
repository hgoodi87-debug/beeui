import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../../../services/storageService';
import { CashClosing } from '../../../../types';

interface UseCashClosingsOptions {
    enabled?: boolean;
}

export const useCashClosings = ({ enabled = true }: UseCashClosingsOptions = {}) => {
    const queryClient = useQueryClient();

    const query = useQuery<CashClosing[]>({
        queryKey: ['cashClosings'],
        queryFn: async () => {
            const data = await StorageService.getCashClosings();
            return Array.isArray(data) ? data : [];
        },
        staleTime: Infinity,
        enabled,
    });

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const unsubscribe = StorageService.subscribeCashClosings((data) => {
            queryClient.setQueryData(['cashClosings'], Array.isArray(data) ? data : []);
        });
        return () => unsubscribe();
    }, [enabled, queryClient]);

    return query;
};
