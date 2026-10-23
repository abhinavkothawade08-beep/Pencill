"use client";

import { useEffect, useRef, useState } from "react";

interface DeleteAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  itemType: "quiz" | "learning path";
  itemTypePlural?: string;
  items: Array<{ id: string; title: string }>;
  scopeDescription: string;
  isDeleting: boolean;
}

export default function DeleteAllModal({
  isOpen,
  onClose,
  onConfirm,
  itemType,
  itemTypePlural = itemType === "quiz" ? "quizzes" : "learning paths",
  items,
  scopeDescription,
  isDeleting,
}: DeleteAllModalProps) {
  const [confirmInput, setConfirmInput] = useState("");
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const isExecutingRef = useRef(false);

  const isConfirmed = confirmInput.trim().toUpperCase() === "DELETE";

  // Reset input and focus cancel button on modal open
  useEffect(() => {
    if (isOpen) {
      setConfirmInput("");
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
    if (!isConfirmed || isDeleting || isExecutingRef.current) return;
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
      aria-labelledby="delete-all-title"
      aria-describedby="delete-all-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div className="bg-surface-container-lowest border border-error/30 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Banner */}
        <div className="bg-error-container/20 border-b border-error/20 p-space-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">delete_sweep</span>
          </div>
          <div className="min-w-0">
            <h2
              id="delete-all-title"
              className="font-headline-sm text-headline-sm text-on-surface font-semibold font-serif truncate"
            >
              Delete All {itemTypePlural}?
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-label-sm text-label-sm text-error font-semibold uppercase tracking-wider">
                Permanent Bulk Deletion
              </span>
              <span className="text-on-surface-variant text-xs">•</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                {items.length} {items.length === 1 ? itemType : itemTypePlural}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-space-md space-y-space-md">
          <div
            id="delete-all-description"
            className="space-y-space-sm font-body-md text-body-md text-on-surface leading-relaxed"
          >
            {/* Scope notification badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-xs text-on-surface-variant font-medium">
              <span className="material-symbols-outlined text-sm text-primary">filter_alt</span>
              <span>Scope: <strong className="text-on-surface font-semibold">{scopeDescription}</strong></span>
            </div>

            <p className="text-xs text-on-surface-variant">
              You are about to permanently delete{" "}
              <strong className="text-on-surface font-semibold">
                {items.length} {items.length === 1 ? itemType : itemTypePlural}
              </strong>{" "}
              owned by your account. This includes all associated child questions, attempts, responses, and module progression records from the database.
            </p>

            <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high/60 text-[11px] text-on-surface-variant">
              <strong className="text-primary font-medium">Safety Guarantee:</strong> System-curated catalog curricula, academic standards, and other users&apos; records are strictly protected and will not be touched.
            </div>

            {/* Item Previews */}
            {items.length > 0 && (
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Items to be deleted ({items.length}):
                </span>
                <div className="max-h-28 overflow-y-auto rounded-lg border border-surface-container-high bg-surface-container-lowest p-2 space-y-1 divide-y divide-surface-container-high/40 text-xs text-on-surface">
                  {items.slice(0, 8).map((item) => (
                    <div key={item.id} className="pt-1 first:pt-0 truncate font-mono text-[11px]">
                      • {item.title}
                    </div>
                  ))}
                  {items.length > 8 && (
                    <div className="pt-1 text-[11px] text-on-surface-variant italic font-sans">
                      + {items.length - 8} more {itemTypePlural}...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Explicit Confirmation Input */}
            <div className="space-y-1.5 pt-1">
              <label
                htmlFor="delete-all-confirm-input"
                className="block text-xs font-semibold text-on-surface"
              >
                Type <span className="font-mono font-bold text-error">DELETE</span> to confirm:
              </label>
              <input
                id="delete-all-confirm-input"
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                disabled={isDeleting}
                autoComplete="off"
                className="w-full px-3 py-2 bg-surface-container-low border border-surface-container-high rounded-lg text-xs font-mono text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-error/40 focus:border-error transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-space-sm border-t border-surface-container-high/60">
            <button
              ref={cancelBtnRef}
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg font-label-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isConfirmed || isDeleting}
              className="px-4 py-2 bg-error text-on-error hover:bg-error/90 rounded-lg font-label-md font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 focus:outline-none focus:ring-2 focus:ring-error/40 text-xs"
            >
              {isDeleting ? (
                <>
                  <div
                    className="w-3.5 h-3.5 border-2 border-on-error border-t-transparent rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  <span>Deleting {items.length} items...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base" aria-hidden="true">
                    delete_forever
                  </span>
                  <span>Delete All {items.length} {items.length === 1 ? itemType : itemTypePlural}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
