"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error Boundary Caught Exception]:", error);
  }, [error]);

  return (
    <div className="py-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
      <div className="bg-surface-container-lowest p-8 rounded-xl border border-surface-container-high/60 shadow-sm space-y-4 w-full">
        <span className="material-symbols-outlined text-4xl text-error">sync_problem</span>
        <h2 className="font-headline-md text-headline-md font-serif text-primary">
          Study Workspace Error
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Failed to load study data from database. You can try refreshing or returning to your dashboard.
        </p>
        {error.message && (
          <div className="p-3 bg-error-container/20 rounded text-xs text-error font-mono text-left break-all">
            {error.message}
          </div>
        )}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md font-semibold hover:bg-primary-container transition-colors shadow-xs"
          >
            Retry
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-surface-container text-on-surface rounded-lg font-label-md font-semibold hover:bg-surface-container-high transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
