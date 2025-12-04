'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Define types
interface AdminUser {
  user_id: number;
  user_name: string;
  email: string;
  store_id: number;
  branch_id?: number;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuthToken: () => Promise<boolean>;
  isLoading: boolean;
  isAuthenticated: boolean;
  store_name: string | null;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [store_name, setStoreName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing auth data on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('adminUser');
    const storedToken = localStorage.getItem('authToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (storedUser && storedToken && storedRefreshToken) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
      setStoreName(parsedUser.store_name || null);
    }

    setIsLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        const { auth_token, refresh_token, admin } = data.data;

        setUser(admin);
        setToken(auth_token);
        setRefreshToken(refresh_token);
        setStoreName(admin.store_name || null);

        localStorage.setItem('adminUser', JSON.stringify(admin));
        localStorage.setItem('authToken', auth_token);
        localStorage.setItem('refreshToken', refresh_token);

        router.push('/dashboard');
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setStoreName(null);

    localStorage.removeItem('adminUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');

    router.push('/login');
  };

  // Refresh auth token
  const refreshAuthToken = async (): Promise<boolean> => {
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch('http://localhost:3000/api/v1/admin/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await response.json();

      if (data.success) {
        const { auth_token } = data.data;
        setToken(auth_token);
        localStorage.setItem('authToken', auth_token);
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return false;
    }
  };

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        login,
        logout,
        refreshAuthToken,
        isLoading,
        isAuthenticated,
        store_name,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};