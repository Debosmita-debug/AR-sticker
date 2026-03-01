import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';
import { isAuth0Configured } from '@/lib/auth0-config';

/**
 * Hook to get Auth0 access token
 * Returns token if Auth0 is available and user is logged in, otherwise null
 */
export function useAuth0Token() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const getToken = useCallback(async () => {
    if (!isAuth0Configured || !isAuthenticated) {
      return null;
    }

    try {
      const token = await getAccessTokenSilently({
        audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
        scope: 'openid profile email',
      });
      return token;
    } catch (error) {
      console.error('Failed to get Auth0 token:', error);
      return null;
    }
  }, [getAccessTokenSilently, isAuthenticated]);

  return { getToken, isAuthenticated };
}
