"use client";

interface ToastProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  onUndo?: () => void;
  icon?: string;
}

export default function Toast({
  message,
  isOpen,
  onClose,
  onUndo,
  icon = "check_circle",
}: ToastProps) {
  if (!isOpen) return null;

  return (
    <aside
      aria-live="polite"
      role="status"
      className="fixed bottom-20 md:bottom-6 right-6 md:right-8 bg-inverse-surface text-inverse-on-surface px-space-md py-3 rounded-xl shadow-xl flex items-center gap-space-md z-50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 border border-outline-variant/20"
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary-fixed text-lg">
          {icon}
        </span>
        <span className="font-body-sm text-body-sm">{message}</span>
      </div>

      <div className="flex items-center gap-2 border-l border-outline-variant/30 pl-space-md">
        {onUndo && (
          <button
            type="button"
            onClick={onUndo}
            className="font-label-lg text-label-lg text-secondary-fixed hover:text-secondary-fixed-dim transition-colors font-semibold"
          >
            Undo
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="text-inverse-on-surface/70 hover:text-inverse-on-surface p-0.5 rounded transition-colors"
          title="Dismiss"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </aside>
  );
}
