'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { isAuth0Configured } from '@/lib/auth0-config';

/**
 * Login/Logout button component
 * Shows user info when logged in, login button when logged out
 */
export function AuthButton() {
  const { loginWithRedirect, logout, user, isLoading, isAuthenticated } = useAuth0();

  if (!isAuth0Configured) {
    return null; // Auth0 not configured
  }

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end text-sm">
          <p className="font-medium text-gray-900">{user.name || user.email}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        <button
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => loginWithRedirect()}
      className="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
    >
      Login
    </button>
  );
}
