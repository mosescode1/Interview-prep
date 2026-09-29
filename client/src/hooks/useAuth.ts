"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    api.setToken(res.token);
    const u = res.user as User;
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
  }, []);

  const register = useCallback(async (email: string, username: string, password: string) => {
    const res = await api.register(email, username, password);
    api.setToken(res.token);
    const u = res.user as User;
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    api.clearToken();
    setUser(null);
    localStorage.removeItem("user");
    window.location.href = "/login";
  }, []);

  return { user, loading, login, register, logout };
}
