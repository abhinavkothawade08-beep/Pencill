"use client";

import { useState, useEffect } from "react";

export interface DeleteCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  courseTitle: string;
  courseId: string;
  isDeleting: boolean;
  requireTitleMatch?: boolean;
  title?: string;
  subtitle?: string;
  confirmButtonText?: string;
  showWarningCallout?: boolean;
}

export default function DeleteCourseModal({
  isOpen,
  onClose,
  onConfirm,
  courseTitle,
  courseId,
  isDeleting,
  requireTitleMatch = true,
  title = "Delete Curriculum Track",
  subtitle = "Permanent removal of curriculum and all linked assets",
  confirmButtonText = "Confirm Delete",
  showWarningCallout = true,
}: DeleteCourseModalProps) {
  const [confirmInput, setConfirmInput] = useState("");
  const isInputMatching = !requireTitleMatch || confirmInput.trim() === courseTitle.trim();

  // Reset confirmation input when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setConfirmInput("");
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInputMatching && !isDeleting) {
      await onConfirm();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Modal Dialog Card */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Banner */}
        <div className="bg-error-container/20 border-b border-error/20 p-space-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">delete_forever</span>
          </div>
          <div>
            <h2 id="delete-modal-title" className="font-headline-sm text-headline-sm text-on-surface font-semibold font-serif">
              {title}
            </h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-space-md space-y-space-md">
          {/* Warning Callout */}
          {showWarningCallout && (
            <div className="p-space-sm bg-error-container/10 border border-error/30 rounded-xl flex gap-3 text-on-surface">
              <span className="material-symbols-outlined text-error text-xl shrink-0 mt-0.5">warning</span>
              <div className="space-y-1 font-body-sm text-body-sm">
                <p className="font-semibold text-error">Warning: This action cannot be undone.</p>
                <ul className="list-disc list-inside text-on-surface-variant space-y-0.5 text-xs">
                  <li>All syllabus modules, lessons, and practice materials will be deleted.</li>
                  <li>Learner progress records, notes, and study bookmarks will be cascaded.</li>
                  <li>Associated checkpoint quizzes and diagnostic questions will be purged.</li>
                </ul>
              </div>
            </div>
          )}

          <div>
            <p className="font-body-md text-body-md text-on-surface mb-1">
              You are about to delete <span className="font-semibold text-primary font-serif">&quot;{courseTitle}&quot;</span> (ID: <code className="text-xs bg-surface-container px-1.5 py-0.5 rounded font-mono text-secondary">{courseId}</code>).
            </p>
            {requireTitleMatch && (
              <>
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">
                  To verify deletion, type the exact title of the course below:
                </p>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={courseTitle}
                  disabled={isDeleting}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline-variant/60 focus:outline-none focus:border-error focus:ring-2 focus:ring-error/20 transition-all disabled:opacity-50"
                />
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-space-xs border-t border-surface-container-high/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              autoFocus={!requireTitleMatch}
              className="px-4 py-2 bg-surface-container-low text-on-surface hover:bg-surface-container rounded-lg font-label-md font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isInputMatching || isDeleting}
              className="px-4 py-2 bg-error text-on-error hover:bg-error/90 rounded-lg font-label-md font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-error border-t-transparent rounded-full animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">delete_forever</span>
                  <span>{confirmButtonText}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
