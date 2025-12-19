"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/auth";
import { getToken, setToken, clearToken, verifyToken } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await verifyToken(token);
      if (userData) {
        setUser(userData);
      } else {
        clearToken();
      }
      setLoading(false);
    }

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { login: loginApi } = await import("@/lib/auth");
      const response = await loginApi(email, password);
      setToken(response.accessToken);
      if (response.refreshToken) {
        localStorage.setItem("refreshToken", response.refreshToken);
      }

      // First, try to use user data from the login response if available
      let userData: User | null = null;
      if (response.user) {
        userData = {
          id: response.user.id,
          email: response.user.email,
          role: response.user.role as "admin" | "student",
          name: response.user.name || response.user.email,
          institute: response.user.institute,
          phoneNumber: response.user.phoneNumber,
        };
      }

      // If not in response, try to verify token
      if (!userData) {
        userData = await verifyToken(response.accessToken);
      }
      
      // If verification fails, try to decode the token directly
      if (!userData) {
        try {
        const tokenParts = response.accessToken.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              userData = {
                id: payload.sub || payload.id || "",
                email: payload.email || email,
                role: payload.role || "student",
                name: payload.name || email,
                institute: payload.institute,
                phoneNumber: payload.phoneNumber,
              };
            }
        } catch (decodeError) {
          console.error("Failed to decode token:", decodeError);
          throw new Error("Failed to process authentication token");
        }
      }

      if (userData) {
        setUser(userData);
        router.push("/dashboard");
        router.refresh();
      } else {
        throw new Error("Failed to verify user token");
      }
    } catch (error) {
      // Re-throw to be caught by the login page
      throw error;
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user ? user.role === "admin" : false,
        isStudent: user ? user.role === "student" : false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

