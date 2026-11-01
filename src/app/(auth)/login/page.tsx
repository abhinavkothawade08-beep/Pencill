"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirectTo") || "/dashboard";

  const { user, loading, signInWithEmail, signInWithGoogle, resendConfirmationEmail, resetPasswordForEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEmailNotConfirmed, setIsEmailNotConfirmed] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  // Forgot Password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  const handleResendVerification = async () => {
    if (!email.trim()) return;
    setIsResending(true);
    setResendStatus(null);
    try {
      const { error } = await resendConfirmationEmail(email.trim());
      if (error) {
        if (error.message?.toLowerCase().includes("rate limit")) {
          setResendStatus("Email rate limit reached. Please wait a few minutes, or disable email confirmation in Supabase.");
        } else {
          setResendStatus(error.message);
        }
      } else {
        setResendStatus("Verification email resent! Please check your inbox and spam folder.");
      }
    } catch {
      setResendStatus("Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setErrorMessage(null);
    setIsEmailNotConfirmed(false);
    setResendStatus(null);
    setIsSubmitting(true);

    try {
      const { error } = await signInWithEmail(email.trim(), password);
      if (error) {
        if (error.message?.toLowerCase().includes("email not confirmed")) {
          setIsEmailNotConfirmed(true);
          setErrorMessage(
            "Your email address has not been confirmed yet. Please verify your email before signing in."
          );
        } else {
          setErrorMessage(error.message || "Failed to authenticate. Please check your credentials.");
        }
      } else {
        router.replace(redirectTo);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected authentication error occurred.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsGoogleSubmitting(true);
    try {
      const { error } = await signInWithGoogle(redirectTo);
      if (error) {
        setErrorMessage(error.message || "Could not initialize Google authentication.");
        setIsGoogleSubmitting(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google authentication failed.";
      setErrorMessage(msg);
      setIsGoogleSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotStatus({ success: false, message: "Please enter your academic email address." });
      return;
    }

    setIsSendingReset(true);
    setForgotStatus(null);
    try {
      const { error } = await resetPasswordForEmail(forgotEmail.trim());
      if (error) {
        setForgotStatus({ success: false, message: error.message || "Failed to send password reset email." });
      } else {
        setForgotStatus({
          success: true,
          message: `Password recovery link dispatched to ${forgotEmail.trim()}. Check your inbox and spam folder.`,
        });
      }
    } catch {
      setForgotStatus({ success: false, message: "An unexpected error occurred while requesting password reset." });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest py-8 px-6 sm:px-10 shadow-sm border border-surface-container-high/60 rounded-2xl">
      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-3 rounded-lg bg-error-container/30 border border-error/30 text-error text-body-sm space-y-2">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
            <span>{errorMessage}</span>
          </div>
          {isEmailNotConfirmed && (
            <div className="pt-2 border-t border-error/20 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="text-xs font-semibold text-primary underline hover:text-primary-container text-left disabled:opacity-50"
              >
                {isResending ? "Resending verification link..." : "Resend verification email"}
              </button>
              {resendStatus && (
                <span className="text-xs text-on-surface-variant font-medium">{resendStatus}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Google OAuth Button */}
      <div>
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleSubmitting || isSubmitting}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-surface-container-lowest hover:bg-surface-container-low border border-surface-container-high rounded-xl text-primary font-label-md font-semibold transition-all shadow-xs disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{isGoogleSubmitting ? "Connecting..." : "Continue with Google"}</span>
        </button>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-container-high/60" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider font-label-sm">
          <span className="bg-surface-container-lowest px-3 text-on-surface-variant">
            Or with academic email
          </span>
        </div>
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block font-label-md text-label-md font-medium text-on-surface mb-1"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="scholar@university.edu"
            className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-lg border border-surface-container-high text-on-surface font-body-sm text-body-sm placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="password"
              className="block font-label-md text-label-md font-medium text-on-surface"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => {
                setForgotEmail(email);
                setIsForgotPasswordOpen(true);
                setForgotStatus(null);
              }}
              className="text-xs font-semibold text-primary hover:text-primary-container hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-lg border border-surface-container-high text-on-surface font-body-sm text-body-sm placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isGoogleSubmitting}
          className="w-full mt-2 py-2.5 px-4 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-label-lg font-semibold transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting && (
            <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
          )}
          <span>{isSubmitting ? "Signing In..." : "Sign In"}</span>
        </button>
      </form>

      {/* Footer Navigation */}
      <div className="mt-6 text-center text-body-sm text-on-surface-variant">
        <span>New to Pencill? </span>
        <Link
          href={`/signup?redirectTo=${encodeURIComponent(redirectTo)}`}
          className="text-primary font-semibold hover:underline"
        >
          Create an account
        </Link>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">lock_reset</span>
                <h3 className="font-headline-sm text-headline-sm font-serif text-primary">
                  Reset Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              Enter your registered academic email address. We will dispatch a secure link to reset your account password.
            </p>

            {forgotStatus && (
              <div
                className={`p-3 rounded-lg text-body-sm flex items-start gap-2 ${
                  forgotStatus.success
                    ? "bg-secondary-container/40 text-on-secondary-fixed-variant border border-secondary/30"
                    : "bg-error-container/30 text-error border border-error/30"
                }`}
              >
                <span className="material-symbols-outlined text-base shrink-0 mt-0.5">
                  {forgotStatus.success ? "check_circle" : "error"}
                </span>
                <span>{forgotStatus.message}</span>
              </div>
            )}

            {!forgotStatus?.success && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-xs font-semibold text-on-surface mb-1">
                    Academic Email Address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="scholar@university.edu"
                    className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-lg border border-surface-container-high text-on-surface font-body-sm text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingReset}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSendingReset && (
                      <span className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>{isSendingReset ? "Sending Link..." : "Send Reset Link"}</span>
                  </button>
                </div>
              </form>
            )}

            {forgotStatus?.success && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Wordmark */}
        <Link href="/" className="inline-block mb-6">
          <Image
            src="/brand/wordmark.svg"
            alt="Pencill"
            width={140}
            height={40}
            className="h-9 w-auto mx-auto object-contain"
            priority
          />
        </Link>
        <h2 className="font-headline-md text-headline-md text-primary font-serif tracking-tight">
          Welcome back to your study desk
        </h2>
        <p className="mt-2 text-body-sm font-body-sm text-on-surface-variant">
          Sign in to synchronize your structured learning paths and notes.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense
          fallback={
            <div className="bg-surface-container-lowest py-8 px-6 sm:px-10 shadow-sm border border-surface-container-high/60 rounded-2xl flex items-center justify-center min-h-[300px]">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
