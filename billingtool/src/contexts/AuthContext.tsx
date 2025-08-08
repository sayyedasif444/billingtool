'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser, getStoredUser, clearUserSession, storeUserSession } from '@/lib/firebase';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => void;
  signOut: () => void;
  signIn: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: () => {},
  signOut: () => {},
  signIn: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = () => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setLoading(false);
  };

  const signIn = (user: AuthUser) => {
    storeUserSession(user);
    setUser(user);
  };

  const signOut = () => {
    clearUserSession();
    setUser(null);
  };

  useEffect(() => {
    // Check for stored user session on mount
    refreshUser();
  }, []);

  const value = {
    user,
    loading,
    refreshUser,
    signOut,
    signIn,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 