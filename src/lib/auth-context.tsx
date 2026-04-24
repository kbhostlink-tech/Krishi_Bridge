"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  country: string;
  kycStatus: string;
  emailVerified: boolean;
  onboardingComplete: boolean;
  preferredLang?: string;
  adminRole?: string | null;
  uniquePaymentCode?: string | null;
}

interface AuthActionResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  userId?: string;
  details?: unknown;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  register: (data: RegisterData) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: "FARMER" | "BUYER" | "AGGREGATOR";
  country: string;
  preferredLang?: "en" | "hi" | "ne" | "dz" | "ar";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Module-level singleton to deduplicate concurrent refresh calls across AuthProvider instances
let inflightRefresh: Promise<string | null> | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    // Deduplicate: if a refresh is already in flight, reuse it
    if (inflightRefresh) {
      const token = await inflightRefresh;
      if (mountedRef.current && token) setAccessToken(token);
      return token;
    }

    inflightRefresh = (async () => {
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
        if (!res.ok) return null;
        const data = await res.json();
        return data.accessToken as string;
      } catch {
        return null;
      } finally {
        inflightRefresh = null;
      }
    })();

    const token = await inflightRefresh;
    if (mountedRef.current && token) setAccessToken(token);
    return token;
  }, []);

  // Attempt to restore session on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await refreshToken();
      if (cancelled) return;
      if (token) {
        try {
          const meRes = await fetch("/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meRes.ok && !cancelled) {
            const meData = await meRes.json();
            setUser(meData.user);
          }
        } catch {
          // Silent failure
        }
      }
      if (!cancelled) setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [refreshToken]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          success: false,
          error: data?.error,
          errorCode: data?.errorCode,
          details: data?.details,
        };
      }

      setUser(data.user);
      setAccessToken(data.accessToken);
      return { success: true, userId: data.user.id };
    } catch {
      return { success: false, errorCode: "network_error" };
    }
  }, []);

  const register = useCallback(async (registerData: RegisterData) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(registerData),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          success: false,
          error: data?.error,
          errorCode: data?.errorCode,
          details: data?.details,
        };
      }

      setUser(data.user);
      setAccessToken(data.accessToken);
      return { success: true, userId: data.user.id };
    } catch {
      return { success: false, errorCode: "network_error" };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        credentials: "include",
      });
    } catch {
      // Continue with local cleanup
    }
    setUser(null);
    setAccessToken(null);
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, register, logout, refreshToken, setUser, setAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

