'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { QuotaCheck } from '@/types';

interface AuthContextType {
    user: User | null;
    quota: QuotaCheck;
    isLoading: boolean;
    refreshQuota: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const defaultQuota: QuotaCheck = { can_use: true, remaining: 1, used: 0 };

const AuthContext = createContext<AuthContextType>({
    user: null,
    quota: defaultQuota,
    isLoading: true,
    refreshQuota: async () => { },
    refreshUser: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [quota, setQuota] = useState<QuotaCheck>(defaultQuota);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();

    const refreshUser = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    }, [supabase]);

    const refreshQuota = useCallback(async () => {
        try {
            const res = await fetch('/api/quota');
            if (res.ok) {
                const data = await res.json();
                setQuota(data);
            }
        } catch (error) {
            console.error('Failed to fetch quota:', error);
        }
    }, []);

    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            await refreshUser();
            await refreshQuota();
            setIsLoading(false);
        };

        initialize();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setUser(session?.user ?? null);
            await refreshQuota();
        });

        return () => subscription.unsubscribe();
    }, [supabase, refreshUser, refreshQuota]);

    return (
        <AuthContext.Provider value={{ user, quota, isLoading, refreshQuota, refreshUser }
        }>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}