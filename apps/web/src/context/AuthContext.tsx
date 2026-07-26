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

// ─── Types ────────────────────────────────────────────────────────────────────
// Matches the shape returned by the backend's toJSON transform:
// _id → id, no password, no refreshTokenHash.
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

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

interface AuthContextType {
  user: User | null;
  /** True only during the initial session-restore call on first mount. */
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<unknown>;
  logout: () => Promise<void>;
  /**
   * Fetches a fresh session from the server and updates the in-memory user.
   * Call this after any action that changes server-side user state (e.g. after
   * email verification) so the UI reflects the latest DB values immediately.
   */
  refreshUser: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LS_KEY = "lxuy_logged_in";
const MAX_REFRESH_RETRIES = 2;
const RETRY_DELAY_MS = 600;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Start loading=true so protected pages never flash before we know the state.
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const refreshInFlight = useRef(false);

  // ── Session restoration on mount ──────────────────────────────────────────
  useEffect(() => {
    async function loadUser() {
      if (typeof window === "undefined") return;

      const hasLoggedInFlag = localStorage.getItem(LS_KEY) === "true";
      if (!hasLoggedInFlag) {
        // Definitely a guest — resolve immediately.
        setLoading(false);
        return;
      }

      // Prevent double-invocation (React StrictMode / fast navigations).
      if (refreshInFlight.current) return;
      refreshInFlight.current = true;

      let lastError: { status?: number } | null = null;

      for (let attempt = 0; attempt < MAX_REFRESH_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            // Give the browser time to settle the rotated refresh-token cookie
            // so a rapid second page reload doesn't race against the first.
            await sleep(RETRY_DELAY_MS);
          }

          const response = await fetch("/api/v1/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // "include" sends cookies for same-origin AND proxied cross-origin
            // requests — required when Next.js proxies /api/* to port 3001.
            credentials: "include",
          });

          if (!response.ok) {
            const errText = await response.text();
            console.error(`[AuthContext] Refresh failed with status ${response.status}:`, errText);
            lastError = { status: response.status };
            // 401 = definitively expired/invalid. No point retrying.
            if (response.status === 401) break;
            // 5xx = transient — try again.
            continue;
          }

          const data = (await response.json()) as {
            accessToken: string;
            user: User;
          };
          setAccessToken(data.accessToken);
          setUser(data.user);
          lastError = null;
          break;
        } catch {
          // Network error (API server down / no connection) — retry, but
          // DON'T clear localStorage; the user isn't actually signed out.
          lastError = {};
        }
      }

      if (lastError !== null) {
        // Only remove the flag when the session is definitively dead (401).
        // For network / server errors, keep the flag so the next page load retries.
        if (lastError.status === 401) {
          setUser(null);
          setAccessToken(null);
          localStorage.removeItem(LS_KEY);
        } else {
          // Transient failure — leave the flag but resolve as unauthenticated
          // for this page load. Next reload will retry.
          setUser(null);
          setAccessToken(null);
        }
      }

      refreshInFlight.current = false;
      setLoading(false);
    }

    loadUser();

    // The API client fires this when a protected call returns 401 AND the
    // background token refresh also fails (truly expired session).
    const handleGlobalLogout = () => {
      setUser(null);
      setLoading(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem(LS_KEY);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LS_KEY) {
        if (event.newValue !== "true") {
          // Logged out in another tab
          setUser(null);
          setAccessToken(null);
          router.push("/");
        } else if (event.newValue === "true") {
          // Logged in in another tab - reload to restore session
          window.location.reload();
        }
      }
    };

    window.addEventListener("auth-logout", handleGlobalLogout);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("auth-logout", handleGlobalLogout);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (credentials: LoginCredentials): Promise<User> => {
    const response = await api.post<{ accessToken: string; user: User }>(
      "/api/v1/auth/login",
      credentials
    );
    setAccessToken(response.accessToken);
    setUser(response.user);
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, "true");
    }
    return response.user;
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const register = async (data: RegisterData): Promise<unknown> => {
    return api.post("/api/v1/auth/register", data);
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async (): Promise<void> => {
    try {
      await api.post("/api/v1/auth/logout");
    } catch {
      // Even if the server call fails, fully clear client state.
    } finally {
      setAccessToken(null);
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(LS_KEY);
      }
      router.push("/");
    }
  };

  // ── Refresh User ──────────────────────────────────────────────────────────
  // Calls /refresh which reads fresh DB data and issues updated tokens.
  // Silently no-ops if called while unauthenticated.
  const refreshUser = async (): Promise<void> => {
    try {
      const response = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) return;
      const data = (await response.json()) as {
        accessToken: string;
        user: User;
      };
      setAccessToken(data.accessToken);
      setUser(data.user);
    } catch {
      // Best-effort — never throw from refreshUser.
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
