"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [searchVal, setSearchVal] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    router.push("/login");
  };

  const avatarUrl = profile?.avatarUrl || "/avatars/default-avatar.svg";
  const displayName = profile?.name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Scholar";

  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] z-40 px-gutter flex items-center justify-between border-b border-surface-container-high/40">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
              onSearch?.(e.target.value);
            }}
            placeholder="Search topics, courses, notes..."
            className="w-full pl-9 pr-space-md py-2 bg-surface-container-lowest rounded-lg border border-surface-container-high/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary-container"
          />
        </form>
      </div>

      {/* Right Action Icons & User Dropdown */}
      <div className="flex items-center gap-space-md">
        <button
          type="button"
          className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          title="Notifications"
        >
          <span className="material-symbols-outlined text-xl">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary"></span>
        </button>

        <Link
          href="/new-goal"
          className="inline-flex items-center gap-1.5 bg-primary-container text-on-primary hover:bg-primary px-space-md py-2 rounded-lg font-label-lg text-label-lg transition-all shadow-[0_1px_4px_rgba(0,0,0,0.08)] active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>New Goal</span>
        </Link>

        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-primary/20 transition-all focus:outline-none"
            >
              <Image
                src={avatarUrl}
                alt={displayName}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-secondary/40"
              />
              <span className="material-symbols-outlined text-xs text-on-surface-variant hidden sm:inline">
                expand_more
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest rounded-xl shadow-lg border border-surface-container-high/60 py-2 z-50 text-left">
                <div className="px-4 py-2 border-b border-surface-container-high/40">
                  <p className="font-label-md text-label-md font-semibold text-primary truncate">
                    {displayName}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    {user.email}
                  </p>
                  <span className="inline-block mt-1 font-label-sm text-label-sm text-secondary bg-secondary-container/30 px-2 py-0.5 rounded-full">
                    {profile?.tier || "Pro Path"}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">dashboard</span>
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/progress"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">bar_chart</span>
                    <span>Learning Progress</span>
                  </Link>
                  <Link
                    href="/bookmarks"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">bookmark</span>
                    <span>Saved Bookmarks</span>
                  </Link>
                </div>

                <div className="border-t border-surface-container-high/40 pt-1">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2 font-label-md text-label-md text-error hover:bg-error-container/20 transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-primary rounded-lg font-label-md font-semibold text-xs transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
