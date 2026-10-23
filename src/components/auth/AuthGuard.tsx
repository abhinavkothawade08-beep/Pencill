"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirectTo=${encodeURIComponent(pathname || "/dashboard")}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="font-label-sm text-label-sm text-on-surface-variant font-serif italic">
          Verifying scholar authentication...
        </span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
