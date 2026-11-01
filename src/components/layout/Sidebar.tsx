"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { storageAdapter } from "@/lib/storage/storageAdapter";

const navItems = [
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

  const avatarUrl = profile?.avatarUrl || "/avatars/default-avatar.svg";
  const displayName = profile?.name || user?.user_metadata?.full_name || (user?.email ? user.email.split("@")[0] : "Scholar");
  const userGrade = profile?.grade || "Self-Paced Learner";
  const userTier = profile?.tier || "Pro Path";

  const handleSignOut = async () => {
    await storageAdapter.clearSession();
    await signOut();
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.03)] z-50 flex flex-col justify-between pt-space-lg pb-space-md border-r border-surface-container-high/40">
      <div className="flex flex-col">
        {/* Brand Header */}
        <Link href="/" className="px-space-lg mb-space-xl flex items-center gap-space-sm group">
          <Image
            src="/brand/wordmark.svg"
            alt="Pencill Logo"
            width={130}
            height={36}
            className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
            priority
          />
        </Link>

        {/* Navigation Items */}
        <nav className="px-space-sm space-y-1 overflow-y-auto max-h-[calc(100vh-210px)] no-scrollbar" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-lg transition-all font-label-lg text-label-lg ${
                  isActive
                    ? "bg-surface-container-high text-primary font-semibold shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={`material-symbols-outlined text-lg ${
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
      </div>

      {/* User Profile Card */}
      <div className="px-space-sm">
        <div className="bg-surface-container-low rounded-xl p-space-sm flex flex-col gap-space-xs border border-surface-container-high/60">
          <div className="flex items-center gap-space-sm">
            <Image
              src={avatarUrl}
              alt={displayName}
              width={36}
              height={36}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-secondary/30"
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
          <div className="pt-space-xs mt-space-xs border-t border-surface-variant/40 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSignOut}
              className="font-label-sm text-label-sm text-on-surface-variant hover:text-error flex items-center gap-1 transition-colors"
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
    </aside>
  );
}
