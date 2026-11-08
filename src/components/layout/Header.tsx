"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import GlobalSearchModal from "./GlobalSearchModal";
import NotificationPopover from "./NotificationPopover";
import { storageAdapter } from "@/lib/storage/storageAdapter";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { isCollapsed, toggleCollapse, toggleMobileDrawer } = useSidebar();
  const [searchVal, setSearchVal] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Listen to custom open-global-search events from hotkeys
  useEffect(() => {
    const handleOpenSearch = () => setIsSearchModalOpen(true);
    window.addEventListener("open-global-search", handleOpenSearch);
    return () => window.removeEventListener("open-global-search", handleOpenSearch);
  }, []);

  // Poll or read unread notifications on mount
  useEffect(() => {
    storageAdapter.getNotifications().then((list) => {
      setUnreadCount(list.filter((n) => !n.read).length);
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await storageAdapter.clearSession();
    await signOut();
    router.push("/login");
  };

  const avatarUrl = profile?.avatarUrl || "/avatars/default-avatar.svg";
  const displayName = profile?.name || user?.user_metadata?.full_name || (user?.email ? user.email.split("@")[0] : "Scholar");
  const displayGrade = profile?.grade || "Self-Paced Learner";

  return (
    <>
      <header
        className={`fixed top-0 left-0 ${
          isCollapsed ? "md:left-20" : "md:left-64"
        } right-0 h-16 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] z-30 px-gutter flex items-center justify-between border-b border-surface-container-high/40 transition-[left] duration-200 ease-in-out motion-reduce:transition-none`}
      >
        {/* Left Section: Mobile Menu + Desktop Sidebar Toggle + Search */}
        <div className="flex items-center gap-2 flex-1 max-w-lg min-w-0">
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={toggleMobileDrawer}
            className="md:hidden p-2 -ml-1 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
            aria-label="Open navigation menu"
            title="Open navigation menu"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>

          {/* Desktop Toggle Button */}
          <button
            type="button"
            onClick={toggleCollapse}
            className="hidden md:flex p-2 -ml-1 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
            aria-label={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          >
            <span className="material-symbols-outlined text-xl">
              {isCollapsed ? "menu_open" : "menu"}
            </span>
          </button>

          {/* Search Bar - triggers search modal */}
          <div className="flex-1 max-w-md min-w-0">
            <div
              onClick={() => setIsSearchModalOpen(true)}
              className="relative flex items-center cursor-pointer group"
            >
              <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-lg pointer-events-none group-hover:text-primary transition-colors">
                search
              </span>
              <input
                type="text"
                readOnly
                value={searchVal}
                placeholder="Search topics, courses, notes... (Ctrl+K)"
                className="w-full pl-9 pr-14 py-2 bg-surface-container-lowest hover:bg-white rounded-lg border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-container transition-all"
              />
              <kbd className="absolute right-3 hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-on-surface-variant bg-surface-container rounded border border-outline-variant/30">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Action Icons & User Dropdown */}
        <div className="flex items-center gap-space-md">
          {/* Notifications Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              title="Notifications"
              aria-label="View notifications"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary" />
              )}
            </button>

            <NotificationPopover
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              onUnreadChange={setUnreadCount}
            />
          </div>

          {/* New Goal Action */}
          <Link
            href="/new-goal"
            className="inline-flex items-center gap-1.5 bg-primary-container text-on-primary hover:bg-primary px-space-md py-2 rounded-lg font-label-lg text-label-lg transition-all shadow-[0_1px_4px_rgba(0,0,0,0.08)] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>New Goal</span>
          </Link>

          {/* User Profile Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-primary-container/20 transition-all focus:outline-none ml-1"
              aria-label="User profile menu"
            >
              <Image
                src={avatarUrl}
                alt={displayName}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-surface-variant"
              />
              <span className="material-symbols-outlined text-xs text-on-surface-variant hidden sm:inline">
                expand_more
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-surface-container-lowest rounded-xl shadow-lg border border-surface-container-high py-2 z-50 text-left animate-in fade-in slide-in-from-top-1">
                <div className="px-4 py-2 border-b border-surface-container-high/40">
                  <p className="font-semibold text-sm text-on-surface truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-on-surface-variant truncate">
                    {displayGrade}
                  </p>
                  <span className="inline-block mt-1 text-[11px] font-medium text-secondary bg-secondary-container/40 px-2 py-0.5 rounded-full">
                    {profile?.tier || "Pro Path"}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-on-surface hover:bg-surface-container hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-on-surface-variant">dashboard</span>
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/courses"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-on-surface hover:bg-surface-container hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-on-surface-variant">menu_book</span>
                    <span>My Courses</span>
                  </Link>
                  <Link
                    href="/progress"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-on-surface hover:bg-surface-container hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-on-surface-variant">bar_chart</span>
                    <span>Learning Progress</span>
                  </Link>
                  <Link
                    href="/bookmarks"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-on-surface hover:bg-surface-container hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-on-surface-variant">bookmark</span>
                    <span>Saved Bookmarks</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-on-surface hover:bg-surface-container hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-on-surface-variant">settings</span>
                    <span>Settings &amp; Profile</span>
                  </Link>
                </div>

                <div className="border-t border-surface-container-high/40 pt-1">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-error hover:bg-error-container/30 transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-base text-error">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
}
