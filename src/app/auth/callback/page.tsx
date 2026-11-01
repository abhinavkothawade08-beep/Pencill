"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/services/supabase/client";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let redirectScheduled = false;

    const navigateToNext = (targetPath: string) => {
      if (redirectScheduled) return;
      redirectScheduled = true;
      try {
        localStorage.removeItem("pencill_guest_access");
        sessionStorage.removeItem("pencill_guest_access");
      } catch {
        // Ignore storage exceptions
      }
      router.replace(targetPath);
    };

    // 1. Listen for auth state changes immediately (captures session establishment from PKCE or Hash)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED")) {
        const next = searchParams.get("next") || searchParams.get("redirectTo") || "/dashboard";
        navigateToNext(next);
      }
    });

    async function handleAuth() {
      try {
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        if (error || errorDescription) {
          if (isMounted) {
            setErrorMessage(errorDescription || error || "Authentication error occurred.");
          }
          return;
        }

        const code = searchParams.get("code");
        const next = searchParams.get("next") || searchParams.get("redirectTo") || "/dashboard";

        // Check if session is already present (e.g. established on page mount or previous tick)
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession) {
          navigateToNext(next);
          return;
        }

        if (code) {
          // Exchange authorization code for active session in the browser where PKCE verifier exists
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            // Verify if session exists despite exchange error (common in React StrictMode double-execution)
            const { data: { session: checkSession } } = await supabase.auth.getSession();
            if (checkSession) {
              navigateToNext(next);
              return;
            }

            console.error("Auth callback code exchange error:", exchangeError);
            if (isMounted) {
              setErrorMessage(exchangeError.message);
            }
            return;
          }
        }

        // Final session check
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigateToNext(next);
        } else {
          // Buffer polling to allow auth state listener to propagate tokens
          const timer = setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              navigateToNext(next);
            } else if (isMounted && !redirectScheduled) {
              router.replace("/login");
            }
          }, 800);
          return () => clearTimeout(timer);
        }
      } catch (err: unknown) {
        console.error("Auth callback unexpected error:", err);
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : "Authentication callback failed.");
        }
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, searchParams]);

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-error/30 max-w-md w-full text-center shadow-sm">
          <span className="material-symbols-outlined text-error text-3xl mb-2">error</span>
          <h2 className="text-title-md font-serif text-primary mb-2">Authentication Notice</h2>
          <p className="text-body-sm text-on-surface-variant mb-6">{errorMessage}</p>
          <button
            onClick={() => router.replace("/login")}
            className="w-full py-2.5 px-4 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-label-md font-semibold transition-all"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="font-label-sm text-label-sm text-on-surface-variant font-serif italic">
        Finalizing scholar authentication...
      </span>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
