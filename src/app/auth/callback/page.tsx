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

        if (code) {
          // Exchange authorization code for active session in the browser where PKCE verifier exists
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("Auth callback code exchange error:", exchangeError);
            if (isMounted) {
              setErrorMessage(exchangeError.message);
            }
            return;
          }
        }

        // Verify active session in client
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace(next);
        } else {
          // Small buffer to allow auth state listener to propagate
          const timer = setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              router.replace(next);
            } else {
              router.replace("/login");
            }
          }, 600);
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
