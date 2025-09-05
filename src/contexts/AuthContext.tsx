'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setAuthToken, clearAuthToken } from '@/lib/api/simple-client';

type User = {
  id: number;
  name: string;
  email: string;
  department: string;
  is_manager: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isManager: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if token exists in localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      setAuthToken(token);
      const userData = await api.auth.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      clearAuthToken();
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.auth.login({ email, password });
      const { token, user: userData } = response;
      
      // Store token
      localStorage.setItem('authToken', token);
      setAuthToken(token);
      
      // Set user data
      setUser(userData);
      
      // Redirect based on role
      if (userData.is_manager) {
        router.push('/dashboard');
      } else {
        router.push('/reports');
      }
    } catch (error) {
      clearAuthToken();
      localStorage.removeItem('authToken');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      clearAuthToken();
      localStorage.removeItem('authToken');
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isManager: user?.is_manager || false,
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

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requireAdmin = false
) {
  return function ProtectedComponent(props: P) {
    const { isAuthenticated, isManager, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          router.push('/login');
        } else if (requireAdmin && !isManager) {
          router.push('/unauthorized');
        }
      }
    }, [isAuthenticated, isManager, loading, router]);

    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-lg">読み込み中...</div>
        </div>
      );
    }

    if (!isAuthenticated || (requireAdmin && !isManager)) {
      return null;
    }

    return <Component {...props} />;
  };
}