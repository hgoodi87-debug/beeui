import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../../../services/storageService';
import { BankTransaction } from '../../../../types';

const QUERY_KEY = ['bankTransactions'] as const;

export const useBankTransactions = ({ enabled = true }: { enabled?: boolean } = {}) => {
    return useQuery<BankTransaction[]>({
        queryKey: QUERY_KEY,
        queryFn: async () => {
            const data = await StorageService.getBankTransactions();
            return Array.isArray(data) ? data : [];
        },
        staleTime: 60_000,
        enabled,
    });
};

export const useBankTransactionsMutations = () => {
    const queryClient = useQueryClient();

    const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

    const save = async (tx: BankTransaction) => {
        const saved = await StorageService.saveBankTransaction(tx);
        await invalidate();
        return saved;
    };

    const remove = async (id: string) => {
        await StorageService.deleteBankTransaction(id);
        await invalidate();
    };

    return { save, remove };
};
