"use client";

import { useEffect, useRef } from "react";

interface DeleteQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  quizTitle: string;
  quizId: string;
  isDeleting: boolean;
}

export default function DeleteQuizModal({
  isOpen,
  onClose,
  onConfirm,
  quizTitle,
  quizId,
  isDeleting,
}: DeleteQuizModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const deleteBtnRef = useRef<HTMLButtonElement>(null);
  const isExecutingRef = useRef(false);

  // Focus management: focus Cancel button by default to prevent accidental deletion
  useEffect(() => {
    if (isOpen) {
      isExecutingRef.current = false;
      const timer = setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Accessible keyboard support: Escape key dismisses modal (when not actively deleting)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDeleting || isExecutingRef.current) return;
    isExecutingRef.current = true;
    try {
      await onConfirm();
    } finally {
      isExecutingRef.current = false;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-quiz-title"
      aria-describedby="delete-quiz-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Banner */}
        <div className="bg-error-container/20 border-b border-error/20 p-space-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">delete_forever</span>
          </div>
          <div>
            <h2
              id="delete-quiz-title"
              className="font-headline-sm text-headline-sm text-on-surface font-semibold font-serif"
            >
              Delete Quiz Assessment?
            </h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Permanent removal
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-space-md space-y-space-md">
          <div
            id="delete-quiz-description"
            className="space-y-space-sm font-body-md text-body-md text-on-surface leading-relaxed"
          >
            <p>
              Are you sure you want to permanently delete{" "}
              <strong className="font-semibold text-primary font-serif">
                &apos;{quizTitle}&apos;
              </strong>
              ?
            </p>
            <p className="text-on-surface-variant font-body-sm text-body-sm">
              This action will permanently delete this diagnostic assessment, all its generated questions, and student attempt histories from the database. This action cannot be undone.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-space-sm border-t border-surface-container-high/60">
            <button
              ref={cancelBtnRef}
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg font-label-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              Cancel
            </button>
            <button
              ref={deleteBtnRef}
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-error text-on-error hover:bg-error/90 rounded-lg font-label-md font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 focus:outline-none focus:ring-2 focus:ring-error/40"
            >
              {isDeleting ? (
                <>
                  <div
                    className="w-4 h-4 border-2 border-on-error border-t-transparent rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base" aria-hidden="true">
                    delete_forever
                  </span>
                  <span>Delete Permanently</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
