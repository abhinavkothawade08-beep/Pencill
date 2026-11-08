"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { storageAdapter } from "@/lib/storage/storageAdapter";
import { useAuth } from "./AuthContext";

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleCollapse: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean) => void;
  toggleMobileDrawer: () => void;
  closeMobileDrawer: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsedState] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Initialize from user preference in storageAdapter
  useEffect(() => {
    let isMounted = true;
    storageAdapter.getSidebarCollapsed().then((saved) => {
      if (isMounted) {
        setIsCollapsedState(saved);
        setIsHydrated(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Persist preference whenever isCollapsed changes after initial hydration
  const setIsCollapsed = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setIsCollapsedState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        storageAdapter.saveSidebarCollapsed(next).catch(() => {});
        // Dispatch resize event so charts, graphs, and canvas elements recompute
        if (typeof window !== "undefined") {
          setTimeout(() => {
            window.dispatchEvent(new Event("resize"));
          }, 210);
        }
        return next;
      });
    },
    []
  );

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, [setIsCollapsed]);

  const toggleMobileDrawer = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobileDrawer = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  // Listen for Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) {
        setIsMobileOpen(false);
      }
      // Optional shortcut: Ctrl+B or Cmd+B toggles desktop sidebar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        const target = e.target as HTMLElement;
        const isEditing =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable;
        if (!isEditing) {
          e.preventDefault();
          toggleCollapse();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, toggleCollapse]);

  // Lock body scroll when mobile drawer is open to prevent background scrolling
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isMobileOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [isMobileOpen]);

  // Reset mobile drawer on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileOpen]);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        toggleCollapse,
        isMobileOpen,
        setIsMobileOpen,
        toggleMobileDrawer,
        closeMobileDrawer,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextType {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
