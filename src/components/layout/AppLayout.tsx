"use client";

import Sidebar from "./Sidebar";
import Header from "./Header";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BuilderStoreProvider } from "@/lib/store/builderStore";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const mobileNavItems = [
    { label: "Dashboard", href: "/dashboard", icon: "grid_view" },
    { label: "Explore", href: "/explore", icon: "explore" },
    { label: "Courses", href: "/courses", icon: "menu_book" },
    { label: "Practice", href: "/practice", icon: "check_circle" },
    { label: "Bookmarks", href: "/bookmarks", icon: "bookmark" },
  ];

  return (
    <BuilderStoreProvider>
      <div className="min-h-screen bg-background text-on-surface">
        {/* Desktop Sidebar (hidden on mobile) */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main Top Header */}
        <Header />

        {/* Main Content Area */}
        <div className="md:pl-64 pt-16 pb-20 md:pb-6 min-h-screen">
          <main className="px-4 sm:px-gutter py-space-lg w-full max-w-[1280px] mx-auto">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-lowest border-t border-surface-container-high/60 shadow-lg z-50 flex items-center justify-around px-2"
          aria-label="Mobile navigation"
        >
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
                  isActive ? "text-primary font-semibold" : "text-on-surface-variant hover:text-on-surface"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className={`material-symbols-outlined text-xl ${isActive ? "text-primary" : ""}`}>
                  {item.icon}
                </span>
                <span className="text-[10px] font-label-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </BuilderStoreProvider>
  );
}
