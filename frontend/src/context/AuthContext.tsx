"use client";

/**
 * AuthContext – JWT stored ONLY in React state (memory).
 * Never persisted to localStorage, sessionStorage, or cookies.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

interface AuthUser {
  id: string;
  email: string;
  plan: "free" | "pro" | "enterprise";
}

interface AuthContextValue {
  /** In-memory access token – null when logged out */
  accessToken: string | null;
  /** In-memory refresh token – null when logged out */
  refreshToken: string | null;
  /** Decoded user metadata */
  user: AuthUser | null;
  /** Whether there is a valid session */
  isAuthenticated: boolean;
  /** Store tokens after login/register */
  signIn: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  /** Clear all auth state */
  signOut: () => void;
  /** Update the access token (called by silent-refresh logic) */
  setAccessToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Silent refresh timer ref
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  /** Silently refresh access token 30 seconds before it expires (~14.5 min) */
  const scheduleTokenRefresh = useCallback((token: string, currentRefreshToken: string) => {
    clearRefreshTimer();
    try {
      // Decode JWT payload (no verification – server validates)
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiresAt = payload.exp * 1000; // ms
      const refreshAt = expiresAt - Date.now() - 30_000; // 30s before expiry

      if (refreshAt > 0) {
        refreshTimerRef.current = setTimeout(async () => {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/auth/refresh`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${currentRefreshToken}`,
              },
            });
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.data?.accessToken) {
                setAccessTokenState(data.data.accessToken);
                scheduleTokenRefresh(data.data.accessToken, currentRefreshToken);
              }
            }
          } catch {
            // Silent failure – user will need to re-login when token expires
          }
        }, refreshAt);
      }
    } catch {
      // Could not decode token – skip auto-refresh
    }
  }, []);

  const signIn = useCallback(
    (newAccessToken: string, newRefreshToken: string, newUser: AuthUser) => {
      setAccessTokenState(newAccessToken);
      setRefreshToken(newRefreshToken);
      setUser(newUser);
      scheduleTokenRefresh(newAccessToken, newRefreshToken);
    },
    [scheduleTokenRefresh]
  );

  const signOut = useCallback(() => {
    clearRefreshTimer();
    setAccessTokenState(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const setAccessToken = useCallback(
    (token: string) => {
      setAccessTokenState(token);
      if (refreshToken) scheduleTokenRefresh(token, refreshToken);
    },
    [refreshToken, scheduleTokenRefresh]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => clearRefreshTimer();
  }, []);

  const value: AuthContextValue = {
    accessToken,
    refreshToken,
    user,
    isAuthenticated: !!accessToken,
    signIn,
    signOut,
    setAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
