"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<string, User> = {
  'admin@incident.ai': {
    id: '1',
    name: 'Admin User',
    email: 'admin@incident.ai',
    role: 'owner',
  },
  'engineer@incident.ai': {
    id: '2',
    name: 'Engineer User',
    email: 'engineer@incident.ai',
    role: 'engineer',
  },
  'viewer@incident.ai': {
    id: '3',
    name: 'Viewer User',
    email: 'viewer@incident.ai',
    role: 'viewer',
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const login = (email: string, password?: string) => {
    const demoUser = DEMO_USERS[email];
    if (demoUser) {
      // In a real app we'd check password, here we just check if the demo user exists
      setUser(demoUser);
      localStorage.setItem('auth_user', JSON.stringify(demoUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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
