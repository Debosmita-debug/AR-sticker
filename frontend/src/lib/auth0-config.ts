/**
 * Auth0 Configuration
 * Get your Auth0 credentials from: https://manage.auth0.com
 */

export const auth0Config = {
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '',
  clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '',
  redirectUri: typeof window !== 'undefined' 
    ? `${window.location.origin}/callback`
    : process.env.NEXT_PUBLIC_AUTH0_REDIRECT_URI || 'http://localhost:3000/callback',
  audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || 'http://localhost:5000',
};

export const isAuth0Configured = 
  Boolean(auth0Config.domain && auth0Config.clientId);
