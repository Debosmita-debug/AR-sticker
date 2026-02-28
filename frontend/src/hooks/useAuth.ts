import { useState, useEffect } from 'react';
import { loginUser, registerUser, setMemoryToken, AuthResponse } from '@/lib/api';

export function useAuth() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Demo mode: auto-login or load from local storage
        const stored = localStorage.getItem('auth_token');
        if (stored) {
            setMemoryToken(stored);
            setUser({ id: 'demo-user', name: 'Demo User' });
        }
    }, []);

    const login = async (credentials: any) => {
        try {
            setLoading(true);
            const res: AuthResponse = await loginUser(credentials);
            setMemoryToken(res.token);
            localStorage.setItem('auth_token', res.token);
            setUser(res.user || { id: 'demo-user', name: 'Demo User' });
            setError(null);
        } catch (e: any) {
            setError(e.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const register = async (credentials: any) => {
        try {
            setLoading(true);
            const res: AuthResponse = await registerUser(credentials);
            setMemoryToken(res.token);
            localStorage.setItem('auth_token', res.token);
            setUser(res.user || { id: 'demo-user', name: 'Demo User' });
            setError(null);
        } catch (e: any) {
            setError(e.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setMemoryToken('');
        localStorage.removeItem('auth_token');
        setUser(null);
    };

    return { user, loading, error, login, register, logout };
}