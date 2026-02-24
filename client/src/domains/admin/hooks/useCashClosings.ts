import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../../../services/storageService';
import { CashClosing } from '../../../../types';

export const useCashClosings = () => {
    const queryClient = useQueryClient();

    const query = useQuery<CashClosing[]>({
        queryKey: ['cashClosings'],
        queryFn: async () => {
            const data = await StorageService.getCashClosings();
            return Array.isArray(data) ? data : [];
        },
        staleTime: Infinity,
    });

    useEffect(() => {
        const unsubscribe = StorageService.subscribeCashClosings((data) => {
            queryClient.setQueryData(['cashClosings'], Array.isArray(data) ? data : []);
        });
        return () => unsubscribe();
    }, [queryClient]);

    return query;
};
