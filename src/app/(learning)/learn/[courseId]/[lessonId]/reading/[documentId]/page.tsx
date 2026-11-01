"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReadingDocumentViewer from "@/components/reading/ReadingDocumentViewer";
import { GeneratedReadingDocument } from "@/lib/reading-engine/types";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabase/client";

export default function DedicatedReadingDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const courseId = params?.courseId as string;
  const lessonId = params?.lessonId as string;
  const documentId = params?.documentId as string;

  const [document, setDocument] = useState<GeneratedReadingDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadDocument() {
      if (!documentId) return;
      setLoading(true);
      setError(null);
      setRegenError(null);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/reading/${encodeURIComponent(documentId)}`, {
          headers,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to load document (${res.status})`);
        }

        const resJson = await res.json();
        if (mounted && resJson.data) {
          setDocument(resJson.data);
        } else {
          throw new Error("Document payload was empty.");
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load study notes.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDocument();

    return () => {
      mounted = false;
    };
  }, [documentId]);

  const handleRegenerate = async () => {
    if (!documentId || isRegenerating) return;
    setIsRegenerating(true);
    setRegenError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/reading/${encodeURIComponent(documentId)}/regenerate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason: "Learner requested fresh study notes" }),
      });

      const resJson = await res.json().catch(() => ({}));
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.error || "Regeneration failed.");
      }

      if (resJson.data) {
        setDocument(resJson.data);
      }
    } catch (err: any) {
      setRegenError(err.message || "We were unable to regenerate study notes right now. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-surface-container-low p-4 sm:p-8 flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <h2 className="font-headline-sm text-lg font-serif text-primary">
            Retrieving Pencill Study Notes...
          </h2>
          <p className="text-xs text-on-surface-variant">
            Loading your verified academic monograph and conceptual notes.
          </p>
        </div>
      </main>
    );
  }

  if (error || !document) {
    return (
      <main className="min-h-screen bg-surface-container-low p-4 sm:p-8 flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-surface-container-lowest rounded-2xl border border-error/30 shadow-sm text-center space-y-4">
          <span className="material-symbols-outlined text-4xl text-error">error</span>
          <h2 className="font-headline-sm text-lg font-serif text-primary">
            Document Not Available
          </h2>
          <p className="text-xs text-on-surface-variant">
            {error || "The requested reading document could not be found."}
          </p>
          <div className="pt-2">
            <Link
              href={`/learn/${courseId}/${lessonId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Return to Lesson</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-container-low text-on-surface pb-16">
      {/* Top Breadcrumb Header */}
      <div className="bg-surface-container-lowest border-b border-surface-container-high/60 sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2 text-xs truncate">
          <Link
            href={`/learn/${courseId}/${lessonId}`}
            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Back to Lesson</span>
          </Link>
          <span className="text-on-surface-variant">/</span>
          <span className="text-on-surface-variant truncate max-w-[200px] sm:max-w-md">
            {document.title}
          </span>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs"
        >
          <span className="material-symbols-outlined text-sm">print</span>
          <span>Print / PDF</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-4">
        {regenError && (
          <div className="p-3.5 rounded-lg bg-error/10 border border-error/20 flex items-center justify-between gap-3 text-xs text-error">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span className="break-words">{regenError}</span>
            </div>
            <button
              type="button"
              onClick={handleRegenerate}
              className="px-3 py-1 rounded bg-error text-white font-semibold hover:bg-error/90 transition-colors shrink-0 shadow-xs"
            >
              Retry
            </button>
          </div>
        )}

        <ReadingDocumentViewer
          document={document}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          fullPageRoute={true}
        />
      </div>
    </main>
  );
}
