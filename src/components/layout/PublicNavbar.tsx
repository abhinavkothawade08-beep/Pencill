"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function PublicNavbar() {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high/40">
      <div className="h-16 max-w-7xl mx-auto px-margin flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-space-md">
          <Image
            src="/brand/wordmark.svg"
            alt="Pencill"
            width={130}
            height={36}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>

        {/* Public Navigation Links */}
        <nav className="hidden md:flex items-center gap-space-lg font-label-lg text-label-lg">
          <a href="/#how-it-works" className="text-primary font-semibold hover:text-primary transition-colors">
            How It Works
          </a>
          <Link href="/explore" className="text-on-surface-variant hover:text-on-surface transition-colors">
            Explore
          </Link>
          <a href="/#features" className="text-on-surface-variant hover:text-on-surface transition-colors">
            Features
          </a>
          <a href="/#philosophy" className="text-on-surface-variant hover:text-on-surface transition-colors">
            Philosophy
          </a>
        </nav>

        {/* Auth CTAs */}
        <div className="flex items-center gap-space-md">
          {user ? (
            <Link
              href="/dashboard"
              className="font-label-lg text-label-lg bg-primary-container text-on-primary hover:bg-primary px-space-md py-2 rounded-lg transition-all shadow-[0_1px_4px_rgba(0,0,0,0.08)] active:scale-[0.98] flex items-center gap-1.5"
            >
              <span>Go to Workspace</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="font-label-lg text-label-lg text-primary hover:text-on-surface px-space-md py-space-sm rounded-lg transition-colors hidden sm:inline-block"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="font-label-lg text-label-lg bg-primary-container text-on-primary hover:bg-primary px-space-md py-2 rounded-lg transition-all shadow-[0_1px_4px_rgba(0,0,0,0.08)] active:scale-[0.98]"
              >
                Start Learning
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
