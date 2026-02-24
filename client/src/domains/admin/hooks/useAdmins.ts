import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../../../services/storageService';
import { AdminUser } from '../../../../types';

export const useAdmins = () => {
    const queryClient = useQueryClient();

    const query = useQuery<AdminUser[]>({
        queryKey: ['admins'],
        queryFn: async () => {
            return await StorageService.getAdmins();
        },
        staleTime: Infinity,
    });

    useEffect(() => {
        const unsubscribe = StorageService.subscribeAdmins((data) => {
            queryClient.setQueryData(['admins'], data);
        });
        return () => unsubscribe();
    }, [queryClient]);

    return query;
};
