"use client";

import Sidebar from "./Sidebar";
import Header from "./Header";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BuilderStoreProvider } from "@/lib/store/builderStore";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  const mobileNavItems = [
    { label: "Dashboard", href: "/dashboard", icon: "grid_view" },
    { label: "Explore", href: "/explore", icon: "explore" },
    { label: "Courses", href: "/courses", icon: "menu_book" },
    { label: "Practice", href: "/practice", icon: "terminal" },
    { label: "Bookmarks", href: "/bookmarks", icon: "bookmark" },
  ];

  const isNewGoal = pathname === "/new-goal";

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface antialiased overflow-x-hidden">
      {/* Sidebar: Fixed Desktop (w-64 or w-20) & Mobile Drawer (Slide-in) */}
      <Sidebar />

      {/* Main Viewport */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 transition-[padding-left] duration-200 ease-in-out motion-reduce:transition-none ${
          isCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        {/* Top Navigation Bar */}
        <Header />

        {/* Main Content Area */}
        <main
          className={`flex-1 w-full pt-16 transition-all duration-200 ${
            isNewGoal
              ? "px-4 sm:px-gutter py-space-lg max-w-[1400px] mx-auto pb-20 md:pb-8"
              : "px-4 sm:px-gutter py-space-lg max-w-[1400px] mx-auto pb-20 md:pb-8"
          }`}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-lowest border-t border-surface-container-high/60 shadow-[0_-1px_8px_rgba(0,0,0,0.03)] z-30 flex items-center justify-around px-2"
        aria-label="Mobile bottom navigation"
      >
        {mobileNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={`material-symbols-outlined text-xl ${
                  isActive ? "text-primary font-bold" : ""
                }`}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <BuilderStoreProvider>
        <AppLayoutInner>{children}</AppLayoutInner>
      </BuilderStoreProvider>
    </SidebarProvider>
  );
}
