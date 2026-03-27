import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../../../services/storageService';
import { AdminRevenueDailySummary } from '../../../../types';

interface UseAdminRevenueDailySummariesOptions {
  enabled?: boolean;
}

export const useAdminRevenueDailySummaries = ({ enabled = true }: UseAdminRevenueDailySummariesOptions = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery<AdminRevenueDailySummary[]>({
    queryKey: ['adminRevenueDailySummaries'],
    queryFn: async () => StorageService.getAdminRevenueDailySummaries(),
    staleTime: Infinity,
    enabled,
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const unsubscribe = StorageService.subscribeAdminRevenueDailySummaries((data) => {
      queryClient.setQueryData(['adminRevenueDailySummaries'], data);
    });

    return () => unsubscribe();
  }, [enabled, queryClient]);

  return query;
};
