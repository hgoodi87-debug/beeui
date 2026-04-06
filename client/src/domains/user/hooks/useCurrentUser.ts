import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { auth, CustomerAuthUser } from '../../../../firebaseApp';

/**
 * Hook: useCurrentUser
 * Manages the current Supabase customer auth user state using TanStack Query.
 * Listens to onAuthStateChanged and synchronizes the cache.
 */
export const useCurrentUser = () => {
    const queryClient = useQueryClient();

    const query = useQuery<CustomerAuthUser | null>({
        queryKey: ['currentUser'],
        queryFn: () => auth.currentUser,
        initialData: auth.currentUser,
        staleTime: Infinity,
    });

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user: CustomerAuthUser | null) => {
            queryClient.setQueryData(['currentUser'], user);
        });
        return () => unsubscribe();
    }, [queryClient]);

    return query;
};
