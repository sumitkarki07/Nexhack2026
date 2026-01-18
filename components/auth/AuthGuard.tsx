'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AuthScreen } from './AuthScreen';
import { useAuth } from '@/context';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  // Check localStorage immediately on mount (client-side only)
  const getInitialAuthState = () => {
    if (typeof window !== 'undefined') {
      try {
        const guest = localStorage.getItem('pulseforge_guest');
        const hasGuest = guest === 'true';
        return hasGuest;
      } catch (error) {
        return false;
      }
    }
    return false;
  };

  const [isChecking, setIsChecking] = useState(true);
  const [showAuth, setShowAuth] = useState(() => {
    // Don't show auth initially if guest mode is already set
    return !getInitialAuthState();
  });
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Wait for auth context to load
    if (isLoading) return;

    // Check if user is authenticated or in guest mode
    if (typeof window !== 'undefined') {
      try {
        const guest = localStorage.getItem('pulseforge_guest');
        const hasGuest = guest === 'true';
        
        if (isAuthenticated || hasGuest) {
          setShowAuth(false);
        } else {
          // Only show auth on home page
          if (pathname === '/') {
            setShowAuth(true);
          } else {
            setShowAuth(false);
          }
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        // On error, show auth screen
        if (pathname === '/') {
          setShowAuth(true);
        }
      }
      setIsChecking(false);
    }
  }, [isAuthenticated, isLoading, pathname]);

  const handleAuthComplete = () => {
    // Update state to hide auth screen immediately
    setShowAuth(false);
    
    // Force a hard reload to ensure all state is refreshed
    // This ensures localStorage is properly read by all components
    if (typeof window !== 'undefined') {
      // Use a small delay to ensure localStorage write is complete
      setTimeout(() => {
        window.location.reload();
      }, 50);
    }
  };

  if (isChecking || isLoading) {
    return null; // Loading state
  }

  // Show auth screen only on home page if not authenticated
  if (showAuth && pathname === '/') {
    return <AuthScreen onComplete={handleAuthComplete} />;
  }

  return <>{children}</>;
}
