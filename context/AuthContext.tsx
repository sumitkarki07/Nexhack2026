'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  email: string;
  name: string;
  provider?: string;
  signedInAt: number;
  interests?: string[]; // Market category IDs the user is interested in
  profileCompleted?: boolean; // Whether user has completed profile setup
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateUserInterests: (interests: string[]) => void;
  updateProfile: (updates: Partial<User>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('pulseforge_user');
        if (stored) {
          const userData = JSON.parse(stored);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const userData: User = {
      email,
      name: email.split('@')[0],
      signedInAt: Date.now(),
    };
    
    setUser(userData);
    localStorage.setItem('pulseforge_user', JSON.stringify(userData));
  };

  const signUp = async (name: string, email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const userData: User = {
      email,
      name,
      signedInAt: Date.now(),
      interests: [],
      profileCompleted: false,
    };
    
    setUser(userData);
    localStorage.setItem('pulseforge_user', JSON.stringify(userData));
  };

  const updateUserInterests = (interests: string[]) => {
    if (!user) return;
    
    const updatedUser: User = {
      ...user,
      interests,
      profileCompleted: true,
    };
    
    setUser(updatedUser);
    localStorage.setItem('pulseforge_user', JSON.stringify(updatedUser));
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser: User = {
      ...user,
      ...updates,
    };
    
    setUser(updatedUser);
    localStorage.setItem('pulseforge_user', JSON.stringify(updatedUser));
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('pulseforge_user');
    localStorage.removeItem('pulseforge_guest'); // Also clear guest mode
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        updateUserInterests,
        updateProfile,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
