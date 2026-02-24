import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { auth } from '../../../../firebaseApp';
import { User } from 'firebase/auth';

/**
 * Hook: useCurrentUser
 * Manages the current Firebase Auth user state using TanStack Query.
 * Listens to onAuthStateChanged and synchronizes the cache.
 */
export const useCurrentUser = () => {
    const queryClient = useQueryClient();

    const query = useQuery<User | null>({
        queryKey: ['currentUser'],
        queryFn: () => auth.currentUser,
        initialData: auth.currentUser,
        staleTime: Infinity,
    });

    useEffect(() => {
        console.log('[DAL] Subscribing to Auth state changes...');
        const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
            queryClient.setQueryData(['currentUser'], user);
        });
        return () => unsubscribe();
    }, [queryClient]);

    return query;
};
