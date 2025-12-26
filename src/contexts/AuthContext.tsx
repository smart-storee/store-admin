"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

// Import types from shared types file
import { AdminUser } from "@/types";
import { API_BASE_URL_WITH_VERSION, isNgrokUrl } from "@/config/api.config";

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
    const storedUser = localStorage.getItem("adminUser");
    const storedToken = localStorage.getItem("authToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");

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
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add ngrok bypass header if using ngrok
      if (isNgrokUrl()) {
        headers["ngrok-skip-browser-warning"] = "true";
      }

      const response = await fetch(
        `${API_BASE_URL_WITH_VERSION}/admin/auth/login`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (data.success) {
        const { auth_token, refresh_token, admin } = data.data;

        setUser(admin);
        setToken(auth_token);
        setRefreshToken(refresh_token);
        setStoreName(admin.store_name || null);

        // Store in localStorage with additional security
        localStorage.setItem("adminUser", JSON.stringify(admin));
        localStorage.setItem("authToken", auth_token);
        localStorage.setItem("refreshToken", refresh_token);

        // Add session timestamp to help with session management
        localStorage.setItem("sessionStartTime", new Date().toISOString());

        router.push("/dashboard");
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setStoreName(null);

    localStorage.removeItem("adminUser");
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("sessionStartTime");

    router.push("/login");
  };

  // Refresh auth token
  const refreshAuthToken = async (): Promise<boolean> => {
    if (!refreshToken) {
      return false;
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add ngrok bypass header if using ngrok
      if (isNgrokUrl()) {
        headers["ngrok-skip-browser-warning"] = "true";
      }

      const response = await fetch(
        `${API_BASE_URL_WITH_VERSION}/admin/auth/refresh-token`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      );

      const data = await response.json();

      if (data.success) {
        const { auth_token } = data.data;
        setToken(auth_token);
        localStorage.setItem("authToken", auth_token);
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error("Token refresh error:", error);
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
