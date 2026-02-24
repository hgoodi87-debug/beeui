import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../../../services/storageService';
import { BranchProspect } from '../../../../types';

export const useBranchProspects = () => {
    const queryClient = useQueryClient();

    const query = useQuery<BranchProspect[]>({
        queryKey: ['branchProspects'],
        queryFn: async () => {
            const data = await StorageService.getBranchProspects();
            return Array.isArray(data) ? data.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()) : [];
        },
        staleTime: Infinity,
    });

    useEffect(() => {
        const unsubscribe = StorageService.subscribeBranchProspects((data) => {
            const sortedData = Array.isArray(data) ? data.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()) : [];
            queryClient.setQueryData(['branchProspects'], sortedData);
        });
        return () => unsubscribe();
    }, [queryClient]);

    return query;
};
