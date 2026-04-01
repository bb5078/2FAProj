/**
 * AuthContext — global authentication state.
 *
 * Provides: { user, loading, setUser, refreshUser, doLogout }
 *
 * On mount: calls GET /api/auth/me to restore session from cookie.
 * Components use the useAuth() hook to read and update auth state.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, logout as apiLogout } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const data = await getMe();
            setUser(data.success ? data.user : null);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const doLogout = useCallback(async () => {
        try {
            await apiLogout();
        } catch {
            // ignore errors — always clear local state
        }
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, setUser, refreshUser, doLogout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
