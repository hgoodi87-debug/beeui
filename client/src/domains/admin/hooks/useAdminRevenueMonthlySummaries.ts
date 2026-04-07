import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../../../services/storageService';
import { AdminRevenueMonthlySummary } from '../../../../types';

interface UseAdminRevenueMonthlySummariesOptions {
  enabled?: boolean;
}

export const useAdminRevenueMonthlySummaries = ({ enabled = true }: UseAdminRevenueMonthlySummariesOptions = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery<AdminRevenueMonthlySummary[]>({
    queryKey: ['adminRevenueMonthlySummaries'],
    queryFn: async () => StorageService.getAdminRevenueMonthlySummaries(),
    staleTime: Infinity,
    enabled,
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const unsubscribe = StorageService.subscribeAdminRevenueMonthlySummaries((data) => {
      queryClient.setQueryData(['adminRevenueMonthlySummaries'], data);
    });

    return () => unsubscribe();
  }, [enabled, queryClient]);

  return query;
};
