'use client';

import { ReactNode } from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import { auth0Config, isAuth0Configured } from '@/lib/auth0-config';

interface Auth0ProviderWrapperProps {
  children: ReactNode;
}

/**
 * Wraps the app with Auth0Provider
 * If Auth0 is not configured, children render without authentication
 */
export function Auth0ProviderWrapper({ children }: Auth0ProviderWrapperProps) {
  // If Auth0 not configured, just render children
  if (!isAuth0Configured) {
    console.warn('⚠️ Auth0 not configured. Authentication disabled.');
    console.warn('To enable Auth0, set NEXT_PUBLIC_AUTH0_DOMAIN and NEXT_PUBLIC_AUTH0_CLIENT_ID');
    return <>{children}</>;
  }

  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri: auth0Config.redirectUri,
        audience: auth0Config.audience,
        scope: 'openid profile email offline_access',
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
      useRefreshTokensFallback={true}
    >
      {children}
    </Auth0Provider>
  );
}
