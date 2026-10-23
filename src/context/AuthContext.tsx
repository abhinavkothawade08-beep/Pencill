"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/services/supabase/client";
import { ensureProfile, getProfile } from "@/services/supabase/profileService";
import { migrateGuestDataToUser } from "@/services/supabase/migrationService";
import { UserProfile } from "@/types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: AuthError | null }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (
    email: string,
    pass: string,
    fullName: string
  ) => Promise<{ error: AuthError | null; user: User | null; session: Session | null }>;
  resendConfirmationEmail: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => ({ error: null }),
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null, user: null, session: null }),
  resendConfirmationEmail: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const syncUserProfile = useCallback(async (u: User) => {
    try {
      const p = await ensureProfile(u);
      setProfile(p);
      // Migrate any guest activity to authenticated Supabase account
      await migrateGuestDataToUser(u.id);
    } catch (err) {
      console.error("Failed to sync user profile:", err);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function initializeAuth() {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user || null);

          if (initialSession?.user) {
            await syncUserProfile(initialSession.user);
          }
        }
      } catch (e) {
        console.error("Error retrieving initial session:", e);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen to real-time auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);
      const currentUser = currentSession?.user || null;
      setUser(currentUser);

      if (currentUser && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
        await syncUserProfile(currentUser);
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncUserProfile]);

  const signInWithGoogle = async (redirectTo?: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const redirectUrl = redirectTo
      ? `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
      : `${origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

    return { error };
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    return { error };
  };

  const signUpWithEmail = async (email: string, pass: string, fullName: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          name: fullName,
          full_name: fullName,
        },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    return { error, user: data.user, session: data.session };
  };

  const resendConfirmationEmail = async (email: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const p = await getProfile(user.id);
      if (p) setProfile(p);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resendConfirmationEmail,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
