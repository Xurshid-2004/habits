"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  signUp: (userData: { name: string; email: string; password: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

          // Agar foydalanuvchi muvaffaqiyatli autentifikatsiya qilsa
          if (event === 'SIGNED_IN' && session?.user) {
            // profiles table schema: id, name, start_day, end_day (screenshot bo'yicha)
            // Shu sabab faqat shu kolonkalarga yozamiz (email/age/created_at yo'q bo'lishi mumkin)
            try {
              const displayName =
                session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name ||
                session.user.email?.split('@')[0] ||
                'User';

              const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                  id: session.user.id,
                  name: displayName,
                });

              if (profileError) {
                console.error('Profile upsert error:', profileError);
              }
            } catch (error) {
              console.error('Profile save error:', error);
            }
          }
        }
      }
    );

    return () => {
      isMounted = false; // Tozalash (cleanup) qismi
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (userData: { name: string; email: string; password: string }) => {
    setLoading(true);
    try {
      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
          },
        },
      });

      if (error) throw error;

      // If user is created successfully, store additional data in a separate table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            name: userData.name,
          });

        if (profileError) throw profileError;
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Sign in error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}