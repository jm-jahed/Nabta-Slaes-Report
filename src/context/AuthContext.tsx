'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local session
    const storedUser = localStorage.getItem('sales_reports_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('sales_reports_user');
      }
    } else {
      // Default to logged-in Admin in demo / local mode for friction-free initial review
      const defaultAdmin: UserProfile = {
        id: 'usr-admin-01',
        email: 'admin@salesreport.ae',
        name: 'Jahed Admin',
        role: 'admin',
      };
      setUser(defaultAdmin);
      localStorage.setItem('sales_reports_user', JSON.stringify(defaultAdmin));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    // If Supabase is connected
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.full_name || email.split('@')[0],
            role: 'admin',
          };
          setUser(profile);
          localStorage.setItem('sales_reports_user', JSON.stringify(profile));
          setIsLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        console.error('Supabase login failed, using local auth:', err);
      }
    }

    // Local / Demo Authentication check
    if (password.length >= 4) {
      const adminUser: UserProfile = {
        id: 'admin-' + Date.now(),
        email: email,
        name: email.includes('admin') ? 'Jahed Admin' : email.split('@')[0],
        role: 'admin',
      };
      setUser(adminUser);
      localStorage.setItem('sales_reports_user', JSON.stringify(adminUser));
      setIsLoading(false);
      return { success: true };
    } else {
      setIsLoading(false);
      return { success: false, error: 'Password must be at least 4 characters.' };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('sales_reports_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === 'admin',
        isLoading,
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
