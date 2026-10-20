"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/lib/auth";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMe,
} from "@/lib/api";

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (
    name: string,
    email: string,
    password: string,
    team?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function initAuth() {
      const storedUser = localStorage.getItem("auth_user");
      const storedToken = localStorage.getItem("auth_token");

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem("auth_user");
        }
      }

      if (storedToken) {
        try {
          const res = await getMe();
          if (isMounted && res && res.user) {
            setUser(res.user);
            localStorage.setItem("auth_user", JSON.stringify(res.user));
          }
        } catch {
          // Token expired or invalid
          if (isMounted && !storedUser) {
            localStorage.removeItem("auth_token");
            setUser(null);
          }
        }
      }
    }

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string = ""): Promise<boolean> => {
    try {
      const res = await apiLogin(email, password);
      if (res && res.token && res.user) {
        setUser(res.user);
        localStorage.setItem("auth_token", res.token);
        localStorage.setItem("auth_user", JSON.stringify(res.user));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    team?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiRegister(name, email, password, team);
      if (res && res.token && res.user) {
        setUser(res.user);
        localStorage.setItem("auth_token", res.token);
        localStorage.setItem("auth_user", JSON.stringify(res.user));
        return { success: true };
      }
      return { success: false, error: "Registration failed" };
    } catch (err: any) {
      return { success: false, error: err?.message || "Registration failed" };
    }
  };

  const logout = () => {
    apiLogout().catch(() => {});
    setUser(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
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

