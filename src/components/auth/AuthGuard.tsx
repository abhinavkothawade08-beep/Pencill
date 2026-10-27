"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured } from "@/services/supabase/client";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isGuest =
    mounted &&
    (localStorage.getItem("pencill_guest_access") === "true" ||
      sessionStorage.getItem("pencill_guest_access") === "true" ||
      !isSupabaseConfigured);

  useEffect(() => {
    if (mounted && !loading && !user && !isGuest) {
      router.replace(`/login?redirectTo=${encodeURIComponent(pathname || "/dashboard")}`);
    }
  }, [user, loading, router, pathname, isGuest, mounted]);

  if (loading || !mounted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="font-label-sm text-label-sm text-on-surface-variant font-serif italic">
          Verifying scholar authentication...
        </span>
      </div>
    );
  }

  if (!user && !isGuest) {
    return null;
  }

  return <>{children}</>;
}
