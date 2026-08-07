"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { api, setAccessToken } from "../lib/api";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  phoneNumber?: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LS_KEY = "lxuy_admin_logged_in";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const refreshInFlight = useRef(false);

  useEffect(() => {
    async function loadUser() {
      if (typeof window === "undefined") return;

      const hasLoggedInFlag = localStorage.getItem(LS_KEY) === "true";
      if (!hasLoggedInFlag) {
        setLoading(false);
        return;
      }

      if (refreshInFlight.current) return;
      refreshInFlight.current = true;

      try {
        const data = await api.post<{ accessToken: string }>("/api/v1/auth/refresh");
        setAccessToken(data.accessToken);

        const profile = await api.get<User>("/api/v1/auth/me");
        if (profile.role === "admin" || profile.role === "store_manager") {
          setUser(profile);
        } else {
          // Reject non-admin role
          localStorage.removeItem(LS_KEY);
          setAccessToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error("Session restore failed:", err);
        localStorage.removeItem(LS_KEY);
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
        refreshInFlight.current = false;
      }
    }
    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    try {
      const res = await api.post<{ accessToken: string; user: User }>(
        "/api/v1/auth/login",
        credentials
      );

      const profile = res.user;
      if (profile.role !== "admin" && profile.role !== "store_manager") {
        throw new Error("Access denied. You do not have permissions to access the administrator dashboard.");
      }

      setAccessToken(res.accessToken);
      setUser(profile);
      localStorage.setItem(LS_KEY, "true");
      return profile;
    } catch (err) {
      localStorage.removeItem(LS_KEY);
      setAccessToken(null);
      setUser(null);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/v1/auth/logout");
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem(LS_KEY);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
