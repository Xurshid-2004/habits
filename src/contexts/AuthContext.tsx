"use client";
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
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
  const initRef = useRef(false); // React Strict Mode da 2 marta ishlamasin

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Faqat onAuthStateChange — getSession kerak emas (lock conflict oldini olish)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // SIGNED_IN da profil yaratish (setTimeout — lock dan qochish)
        if (event === "SIGNED_IN" && session?.user) {
          const u = session.user;
          setTimeout(async () => {
            try {
              const displayName =
                u.user_metadata?.full_name ||
                u.user_metadata?.name ||
                u.email?.split("@")[0] ||
                "User";
              await supabase.from("profiles").upsert({ id: u.id, name: displayName });
            } catch (e) {
              console.error("Profile upsert:", e);
            }
          }, 0);
        }
      }
    );

    return () => { subscription.unsubscribe(); };
  }, []);

  const signUp = async (userData: { name: string; email: string; password: string }) => {
    const { error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: { data: { name: userData.name } },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { console.error("signIn:", error.message); return false; }
    return true;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    // Faqat habit kalitlarini tozala
    try {
      localStorage.removeItem("selected_habit_ids_v1");
      localStorage.removeItem("selected_static_habit_keys_v1");
    } catch { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{
      user, session,
      isAuthenticated: !!user,
      loading,
      signUp, signIn, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}