'use client';

import { useState, useCallback, useRef } from 'react';
import { loginUser, registerUser, setMemoryToken, AuthResponse } from '@/lib/api';

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  });
  // Refresh token kept in memory only — never in localStorage
  const refreshTokenRef = useRef<string | null>(null);

  const handleAuthResponse = useCallback((res: AuthResponse) => {
    setMemoryToken(res.accessToken);
    refreshTokenRef.current = res.refreshToken;
    setState({ accessToken: res.accessToken, isAuthenticated: true, loading: false, error: null });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await loginUser(email, password);
      handleAuthResponse(res);
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e.message || 'Login failed.' }));
    }
  }, [handleAuthResponse]);

  const register = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await registerUser(email, password);
      handleAuthResponse(res);
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e.message || 'Registration failed.' }));
    }
  }, [handleAuthResponse]);

  const logout = useCallback(() => {
    setMemoryToken(null);
    refreshTokenRef.current = null;
    setState({ accessToken: null, isAuthenticated: false, loading: false, error: null });
  }, []);

  return { ...state, login, register, logout };
}