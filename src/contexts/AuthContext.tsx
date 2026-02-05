import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types/carbon';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, role?: UserRole) => Promise<boolean>;
  signUp: (username: string, email: string, password: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Verify token by getting current user
          const currentUser = await api.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid token
        api.setToken(null);
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string, role?: UserRole): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Attempt login with backend
      const loginResponse = await api.login({ username, password });
      
      // Get current user information
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${currentUser.username}!`,
      });
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (username: string, email: string, password: string, role?: UserRole): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Attempt sign-up with backend
      await api.signUp({ 
        username, 
        email: email || undefined, 
        password, 
        role: role || "user" 
      });
      
      toast({
        title: "Sign Up Successful",
        description: "Your account has been created successfully. Please log in.",
      });
      
      return true;
    } catch (error) {
      console.error('Sign up failed:', error);
      
      toast({
        title: "Sign Up Failed",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    api.setToken(null);
    localStorage.removeItem('auth_token');
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, signUp, logout, isAuthenticated: !!user, isLoading }}>
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
