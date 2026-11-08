"use client";

import React, { useEffect } from "react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onCancel();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: "error",
          iconColor: "text-error",
          iconBg: "bg-error-container/40 text-on-error-container",
          confirmBtn: "bg-error text-on-error hover:bg-error/90 active:scale-95 shadow-sm",
        };
      case "info":
        return {
          icon: "info",
          iconColor: "text-primary",
          iconBg: "bg-primary/10 text-primary",
          confirmBtn: "bg-primary text-on-primary hover:bg-primary-container active:scale-95 shadow-sm",
        };
      case "warning":
      default:
        return {
          icon: "warning",
          iconColor: "text-amber-500",
          iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
          confirmBtn: "bg-amber-600 text-white hover:bg-amber-700 active:scale-95 shadow-sm",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-container-high/60">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${styles.iconBg}`}>
            <span className={`material-symbols-outlined text-2xl ${styles.iconColor}`}>
              {styles.icon}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="font-headline-sm text-headline-sm text-primary font-serif">
              {title}
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-surface-container-high/40">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 ${styles.confirmBtn}`}
          >
            {isLoading && (
              <span className="material-symbols-outlined text-sm animate-spin">
                progress_activity
              </span>
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
