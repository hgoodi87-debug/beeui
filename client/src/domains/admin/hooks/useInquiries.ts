import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../../../services/storageService';
import { PartnershipInquiry } from '../../../../types';

export const useInquiries = () => {
    const queryClient = useQueryClient();

    const query = useQuery<PartnershipInquiry[]>({
        queryKey: ['inquiries'],
        queryFn: async () => {
            const data = await StorageService.getInquiries();
            return Array.isArray(data) ? data.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()) : [];
        },
        staleTime: Infinity,
    });

    useEffect(() => {
        const unsubscribe = StorageService.subscribeInquiries((data) => {
            const sortedData = Array.isArray(data) ? data.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()) : [];
            queryClient.setQueryData(['inquiries'], sortedData);
        });
        return () => unsubscribe();
    }, [queryClient]);

    return query;
};
