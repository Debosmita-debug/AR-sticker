'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth0 } from '@auth0/auth0-react';

/**
 * Auth0 Callback Page
 * Handles the redirect from Auth0 after user logs in
 */
export default function CallbackPage() {
  const router = useRouter();
  const { isLoading, error, isAuthenticated } = useAuth0();

  useEffect(() => {
    if (isLoading) return;

    if (error) {
      console.error('Auth error:', error);
      router.push('/');
      return;
    }

    if (isAuthenticated) {
      // Redirect to home page after successful login
      router.push('/');
    }
  }, [isLoading, error, isAuthenticated, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Signing you in...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
}
