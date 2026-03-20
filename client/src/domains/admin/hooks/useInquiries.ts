import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../../../services/storageService';
import { PartnershipInquiry } from '../../../../types';

interface UseInquiriesOptions {
    enabled?: boolean;
}

export const useInquiries = ({ enabled = true }: UseInquiriesOptions = {}) => {
    const queryClient = useQueryClient();

    const query = useQuery<PartnershipInquiry[]>({
        queryKey: ['inquiries'],
        queryFn: async () => {
            const data = await StorageService.getInquiries();
            return Array.isArray(data) ? data.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()) : [];
        },
        staleTime: Infinity,
        enabled,
    });

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const unsubscribe = StorageService.subscribeInquiries((data) => {
            const sortedData = Array.isArray(data) ? data.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()) : [];
            queryClient.setQueryData(['inquiries'], sortedData);
        });
        return () => unsubscribe();
    }, [enabled, queryClient]);

    return query;
};
