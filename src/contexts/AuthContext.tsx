import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import * as storage from '../utils/storage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<string | null>; // returns error or null
  register: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function hashPassword(password: string): string {
  // Simple deterministic hash for demo (not for production use)
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const id = storage.getCurrentUserId();
    if (id) {
      const u = storage.getUserById(id);
      if (u) setUser(u);
      else storage.setCurrentUserId(null);
    }
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    const u = storage.getUserByEmail(email);
    if (!u) return 'No account found with this email.';
    if (u.passwordHash !== hashPassword(password)) return 'Incorrect password.';
    storage.setCurrentUserId(u.id);
    setUser(u);
    return null;
  };

  const register = async (name: string, email: string, password: string): Promise<string | null> => {
    if (storage.getUserByEmail(email)) return 'An account with this email already exists.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    const u: User = {
      id: crypto.randomUUID(),
      email: email.toLowerCase().trim(),
      name: name.trim(),
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    storage.saveUser(u);
    storage.setCurrentUserId(u.id);
    setUser(u);
    return null;
  };

  const logout = () => {
    storage.setCurrentUserId(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
