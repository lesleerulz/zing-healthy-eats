"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User, AuthResponse, CartData } from "@/lib/types";
import { fetchApi, setToken, removeToken, getToken } from "@/lib/api";

/* ──────────────────────────────────────────────────────
   Auth Context — manages user session and cart state
   for the entire application.
   ────────────────────────────────────────────────────── */

interface AuthContextType {
  user: User | null;
  cart: CartData | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshCart: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user from JWT token on mount.
  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchApi<User>("/api/auth/me")
        .then(setUser)
        .catch(() => {
          removeToken();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Auto-fetch cart when user changes.
  const refreshCart = useCallback(async () => {
    if (!getToken()) {
      setCart(null);
      return;
    }
    try {
      const data = await fetchApi<CartData>("/api/cart");
      setCart(data);
    } catch {
      setCart(null);
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [user, refreshCart]);

  const refreshUser = useCallback(async () => {
    try {
      const data = await fetchApi<User>("/api/auth/me");
      setUser(data);
    } catch {
      removeToken();
      setUser(null);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const data = await fetchApi<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const data = await fetchApi<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setCart(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, cart, loading, login, register, logout, refreshCart, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
