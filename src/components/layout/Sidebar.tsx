"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { storageAdapter } from "@/lib/storage/storageAdapter";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "grid_view" },
  { label: "My Courses", href: "/courses", icon: "menu_book" },
  { label: "Smart Retention", href: "/review", icon: "psychology" },
  { label: "Knowledge Graph", href: "/graph", icon: "account_tree" },
  { label: "Practice & Code", href: "/practice", icon: "terminal" },
  { label: "Explore Catalog", href: "/explore", icon: "explore" },
  { label: "Master Educators", href: "/educators", icon: "cast_for_education" },
  { label: "Universal Importer", href: "/import", icon: "input" },
  { label: "Community Q&A", href: "/community", icon: "forum" },
  { label: "Achievements", href: "/achievements", icon: "workspace_premium" },
  { label: "Progress", href: "/progress", icon: "bar_chart" },
  { label: "Bookmarks", href: "/bookmarks", icon: "bookmark" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const { isCollapsed, toggleCollapse, isMobileOpen, closeMobileDrawer } = useSidebar();

  const avatarUrl = profile?.avatarUrl || "/avatars/default-avatar.svg";
  const displayName =
    profile?.name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split("@")[0] : "Scholar");
  const userGrade = profile?.grade || "Self-Paced Learner";
  const userTier = profile?.tier || "Pro Path";

  const handleSignOut = async () => {
    if (isMobileOpen) closeMobileDrawer();
    await storageAdapter.clearSession();
    await signOut();
  };

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* DESKTOP SIDEBAR (Visible on md and up, Collapsible / Expandable)   */}
      {/* ------------------------------------------------------------------ */}
      <aside
        id="desktop-sidebar"
        aria-label="Main application navigation"
        className={`hidden md:flex fixed left-0 top-0 h-full bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.03)] z-40 flex-col justify-between pt-space-md pb-space-md border-r border-surface-container-high/40 transition-[width] duration-200 ease-in-out motion-reduce:transition-none select-none ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex flex-col min-h-0 flex-1">
          {/* Brand & Toggle Header */}
          <div
            className={`mb-3 flex items-center ${
              isCollapsed ? "flex-col gap-2 px-2" : "justify-between px-4"
            }`}
          >
            {isCollapsed ? (
              <>
                <Link
                  href="/dashboard"
                  className="p-1.5 rounded-xl hover:bg-surface-container transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Pencill Home"
                  title="Pencill Home"
                >
                  <Image
                    src="/brand/icon.svg"
                    alt="Pencill Icon"
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain transition-transform group-hover:scale-105"
                    priority
                  />
                </Link>
                <button
                  type="button"
                  onClick={toggleCollapse}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Expand sidebar (Ctrl+B)"
                  title="Expand sidebar (Ctrl+B)"
                >
                  <span className="material-symbols-outlined text-xl">chevron_right</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-space-sm group min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                  aria-label="Pencill Home"
                >
                  <Image
                    src="/brand/wordmark.svg"
                    alt="Pencill Logo"
                    width={124}
                    height={32}
                    className="h-7 w-auto object-contain transition-transform group-hover:scale-102"
                    priority
                  />
                </Link>
                <button
                  type="button"
                  onClick={toggleCollapse}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Collapse sidebar (Ctrl+B)"
                  title="Collapse sidebar (Ctrl+B)"
                >
                  <span className="material-symbols-outlined text-xl">menu_open</span>
                </button>
              </>
            )}
          </div>

          {/* Navigation Links */}
          <nav
            className={`flex-1 space-y-1 overflow-y-auto no-scrollbar ${
              isCollapsed ? "px-2" : "px-3"
            }`}
            aria-label="Desktop navigation links"
          >
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              if (isCollapsed) {
                return (
                  <div key={item.href} className="relative group flex justify-center">
                    <Link
                      href={item.href}
                      className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isActive
                          ? "bg-surface-container-high text-primary font-bold shadow-xs ring-1 ring-primary/20"
                          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      }`}
                      aria-label={item.label}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span
                        className={`material-symbols-outlined text-xl shrink-0 ${
                          isActive
                            ? "text-primary font-bold"
                            : "text-on-surface-variant group-hover:text-on-surface"
                        }`}
                      >
                        {item.icon}
                      </span>
                    </Link>

                    {/* Floating Accessible Tooltip on Hover/Focus */}
                    <div
                      role="tooltip"
                      className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-neutral-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-150 z-50 whitespace-nowrap flex items-center gap-1.5"
                    >
                      <span>{item.label}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-secondary" />}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all font-label-lg text-label-lg group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? "bg-surface-container-high text-primary font-semibold shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span
                    className={`material-symbols-outlined text-xl shrink-0 ${
                      isActive
                        ? "text-primary font-bold"
                        : "text-on-surface-variant group-hover:text-on-surface"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Card */}
        {isCollapsed ? (
          <div className="px-2 pt-2 flex flex-col items-center gap-2 border-t border-surface-container-high/40">
            {/* User Avatar with Tooltip */}
            <div className="relative group flex justify-center">
              <Link
                href="/settings"
                className="p-0.5 rounded-full hover:ring-2 hover:ring-primary/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`User profile: ${displayName}`}
              >
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-secondary/30"
                />
              </Link>
              <div
                role="tooltip"
                className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-neutral-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-150 z-50 whitespace-nowrap"
              >
                <p className="font-semibold">{displayName}</p>
                <p className="text-[10px] text-neutral-300 font-normal">
                  {userGrade} • {userTier}
                </p>
              </div>
            </div>

            {/* Sign Out Button with Tooltip */}
            <div className="relative group flex justify-center">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
                aria-label="Sign Out"
                title="Sign Out"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
              <div
                role="tooltip"
                className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-neutral-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-150 z-50 whitespace-nowrap"
              >
                Sign Out
              </div>
            </div>
          </div>
        ) : (
          <div className="px-3 pt-2">
            <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-2 border border-surface-container-high/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={36}
                  height={36}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-secondary/30 shrink-0"
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-label-lg text-label-lg text-on-surface truncate font-semibold">
                    {displayName}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                    {userGrade}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-surface-variant/40 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="font-label-sm text-label-sm text-on-surface-variant hover:text-error flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-error rounded"
                  title="Sign Out"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  <span>Sign Out</span>
                </button>
                <span className="font-label-sm text-label-sm text-secondary font-medium bg-secondary-container/40 px-2 py-0.5 rounded-full">
                  {userTier}
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* MOBILE NAVIGATION DRAWER (Slide-in on mobile / tablet < md)        */}
      {/* ------------------------------------------------------------------ */}
      <div className="md:hidden">
        {/* Subtle Backdrop Overlay */}
        <div
          className={`fixed inset-0 bg-neutral-950/50 backdrop-blur-xs z-50 transition-opacity duration-300 ease-in-out ${
            isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={closeMobileDrawer}
          aria-hidden="true"
        />

        {/* Slide-out Drawer Panel */}
        <aside
          id="mobile-navigation-drawer"
          aria-label="Mobile Navigation Drawer"
          aria-hidden={!isMobileOpen}
          className={`fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-surface-container-lowest shadow-2xl z-50 flex flex-col justify-between pt-space-md pb-space-md border-r border-surface-container-high/40 transition-transform duration-300 ease-in-out motion-reduce:transition-none ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer Brand & Close Button */}
          <div className="px-4 mb-3 flex items-center justify-between border-b border-surface-container-high/40 pb-3">
            <Link
              href="/dashboard"
              onClick={closeMobileDrawer}
              className="flex items-center gap-space-sm group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
              aria-label="Pencill Home"
            >
              <Image
                src="/brand/wordmark.svg"
                alt="Pencill Logo"
                width={120}
                height={32}
                className="h-7 w-auto object-contain"
                priority
              />
            </Link>
            <button
              type="button"
              onClick={closeMobileDrawer}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Close navigation drawer"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          {/* Drawer Navigation Links */}
          <nav
            className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar"
            aria-label="Mobile Drawer Navigation"
          >
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileDrawer}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-label-lg text-label-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? "bg-surface-container-high text-primary font-semibold shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span
                    className={`material-symbols-outlined text-xl ${
                      isActive ? "text-primary font-bold" : "text-on-surface-variant"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Drawer User Profile */}
          <div className="px-3 pt-3 border-t border-surface-container-high/40 mt-2">
            <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-2 border border-surface-container-high/60">
              <div className="flex items-center gap-2.5">
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={36}
                  height={36}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-secondary/30 shrink-0"
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-label-lg text-label-lg text-on-surface truncate font-semibold">
                    {displayName}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                    {userGrade}
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-secondary font-medium bg-secondary-container/40 px-2 py-0.5 rounded-full shrink-0">
                  {userTier}
                </span>
              </div>
              <div className="pt-2 border-t border-surface-variant/40 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="font-label-sm text-label-sm text-on-surface-variant hover:text-error flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-error rounded"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
