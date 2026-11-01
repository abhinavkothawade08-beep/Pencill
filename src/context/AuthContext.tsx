"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/services/supabase/client";
import { UserProfile } from "@/types";
import { ensureProfile, getProfile } from "@/services/supabase/profileService";
import { migrateGuestDataToUser } from "@/services/supabase/migrationService";
import { storageAdapter } from "@/lib/storage/storageAdapter";
import { resetDeletionRegistry } from "@/services/supabase/deletionRegistry";

export interface AuthContextType {
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
  resetPasswordForEmail: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function clearAllClientStorage(): void {
  if (typeof window === "undefined") return;

  try {
    // 1. Clear known legacy / guest keys
    localStorage.removeItem("pencill_guest_access");
    localStorage.removeItem("pencill_guest_progress");
    localStorage.removeItem("pencill_guest_quizzes");
    localStorage.removeItem("pencill_guest_quiz_attempts");
    localStorage.removeItem("pencill_guest_enrollments");
    localStorage.removeItem("builder_config_draft");
    localStorage.removeItem("pencill_deleted_records");
    localStorage.removeItem("pencill_persisted_achievements");

    sessionStorage.removeItem("pencill_guest_access");

    // 2. Clear dynamic / user-prefixed keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("pencill_notes_") ||
          key.startsWith("pencill_path_") ||
          key.startsWith("pencill_enrollments_") ||
          key.startsWith("pencill_user_") ||
          key.startsWith("builder_config_draft_"))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // 3. Reset in-memory deletion cache
    resetDeletionRegistry();
  } catch (err) {
    console.warn("[Auth] Failed to clean client storage:", err);
  }
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
  resetPasswordForEmail: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
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
      storageAdapter.setUserScope(u.id);
      const p = await ensureProfile(u);
      setProfile(p);

      // ONLY migrate guest activity if guest mode was genuinely active immediately prior
      if (typeof window !== "undefined") {
        const hadGuestAccess = localStorage.getItem("pencill_guest_access") === "true";
        if (hadGuestAccess) {
          await migrateGuestDataToUser(u.id);
          localStorage.removeItem("pencill_guest_access");
          sessionStorage.removeItem("pencill_guest_access");
        }
      }
    } catch (err) {
      console.error("Failed to sync user profile:", err);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      storageAdapter.setUserScope(null);
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
          const currentUser = initialSession?.user || null;
          setUser(currentUser);
          storageAdapter.setUserScope(currentUser ? currentUser.id : null);

          if (currentUser) {
            await syncUserProfile(currentUser);
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
      storageAdapter.setUserScope(currentUser ? currentUser.id : null);

      if (currentUser && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
        await syncUserProfile(currentUser);
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
        clearAllClientStorage();
        await storageAdapter.clearCurrentUserData();
        storageAdapter.setUserScope(null);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("pencill:auth-state-reset"));
          window.dispatchEvent(new CustomEvent("pencill:enrollment-changed"));
        }
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
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
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
          full_name: fullName,
          name: fullName,
        },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    return { error, user: data?.user || null, session: data?.session || null };
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

  const resetPasswordForEmail = async (email: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/settings`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signOut error:", e);
    }
    clearAllClientStorage();
    await storageAdapter.clearCurrentUserData();
    storageAdapter.setUserScope(null);
    setUser(null);
    setSession(null);
    setProfile(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pencill:auth-state-reset"));
      window.dispatchEvent(new CustomEvent("pencill:enrollment-changed"));
    }
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
        resetPasswordForEmail,
        updatePassword,
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
