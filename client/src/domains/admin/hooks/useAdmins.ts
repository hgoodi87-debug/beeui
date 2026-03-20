import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../../../services/storageService';
import { AdminUser } from '../../../../types';

interface UseAdminsOptions {
    enabled?: boolean;
}

export const useAdmins = ({ enabled = true }: UseAdminsOptions = {}) => {
    const queryClient = useQueryClient();

    const query = useQuery<AdminUser[]>({
        queryKey: ['admins'],
        queryFn: async () => {
            return await StorageService.getAdmins();
        },
        staleTime: Infinity,
        enabled,
    });

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const unsubscribe = StorageService.subscribeAdmins((data) => {
            queryClient.setQueryData(['admins'], data);
        });
        return () => unsubscribe();
    }, [enabled, queryClient]);

    return query;
};
