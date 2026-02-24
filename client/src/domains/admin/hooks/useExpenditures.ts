import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../../../services/storageService';
import { Expenditure } from '../../../../types';

export const useExpenditures = () => {
    const queryClient = useQueryClient();

    const query = useQuery<Expenditure[]>({
        queryKey: ['expenditures'],
        queryFn: async () => {
            const data = await StorageService.getExpenditures();
            return Array.isArray(data) ? data : [];
        },
        staleTime: Infinity,
    });

    useEffect(() => {
        const unsubscribe = StorageService.subscribeExpenditures((data) => {
            queryClient.setQueryData(['expenditures'], Array.isArray(data) ? data : []);
        });
        return () => unsubscribe();
    }, [queryClient]);

    return query;
};
