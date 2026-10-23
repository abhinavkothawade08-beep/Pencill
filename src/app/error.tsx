"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Application Error Boundary Caught Exception]:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md bg-surface-container-lowest p-8 rounded-xl border border-surface-container-high shadow-sm space-y-4">
        <span className="material-symbols-outlined text-4xl text-error">report_problem</span>
        <h2 className="font-headline-md text-headline-md font-serif text-primary">
          Something Went Wrong
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          An unexpected error occurred while loading this page. Our team has been notified.
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
            Retry Request
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-surface-container text-on-surface rounded-lg font-label-md font-semibold hover:bg-surface-container-high transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
