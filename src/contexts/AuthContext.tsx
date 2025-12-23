import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types/carbon';
import { mockUsers } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, role: UserRole) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (username: string, password: string, role: UserRole): boolean => {
    // Simple mock authentication
    if (username && password.length >= 4) {
      const existingUser = mockUsers.find(u => u.username === username && u.role === role);
      if (existingUser) {
        setUser(existingUser);
      } else {
        // Create new user session
        setUser({
          id: Date.now().toString(),
          username,
          role,
        });
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
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
