/**
 * API utility for Auth0 integration
 * Wraps API calls to automatically include Auth0 JWT tokens
 */

import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';
import { isAuth0Configured } from './auth0-config';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Hook to create API functions with automatic Auth0 token injection
 * Usage:
 * const { apiCall } = useApiWithAuth0();
 * await apiCall('/api/endpoint', { method: 'POST', body: {...} });
 */
export function useApiWithAuth0() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const apiCall = useCallback(
    async (
      endpoint: string,
      options: RequestInit = {}
    ): Promise<any> => {
      let headers = { ...options.headers } as Record<string, string>;

      // Add Auth0 token if available and configured
      if (isAuth0Configured && isAuthenticated) {
        try {
          const token = await getAccessTokenSilently({
            audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
            scope: 'openid profile email',
          });
          headers.Authorization = `Bearer ${token}`;
        } catch (error) {
          console.warn('Failed to get Auth0 token:', error);
        }
      }

      const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error?.message || `API Error: ${response.status}`);
      }

      return response.json();
    },
    [getAccessTokenSilently, isAuthenticated]
  );

  return { apiCall };
}

/**
 * Direct API call function (without React hook)
 * Used for calling API from non-component contexts
 */
export async function apiCall(
  endpoint: string,
  options: RequestInit = {},
  auth0Token?: string
): Promise<any> {
  let headers = { ...options.headers } as Record<string, string>;

  if (auth0Token) {
    headers.Authorization = `Bearer ${auth0Token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message || `API Error: ${response.status}`);
  }

  return response.json();
}
