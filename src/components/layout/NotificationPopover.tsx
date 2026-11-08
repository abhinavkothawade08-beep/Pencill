"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { storageAdapter, StorageNotification } from "@/lib/storage/storageAdapter";

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
}

export default function NotificationPopover({
  isOpen,
  onClose,
  onUnreadChange,
}: NotificationPopoverProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<StorageNotification[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  const reloadNotifications = useCallback(async () => {
    const list = await storageAdapter.getNotifications();
    setNotifications(list);
    const unread = list.filter((n) => !n.read).length;
    onUnreadChange?.(unread);
  }, [onUnreadChange]);

  useEffect(() => {
    if (!isOpen) return;
    reloadNotifications();
    const interval = setInterval(reloadNotifications, 5000);
    return () => clearInterval(interval);
  }, [isOpen, reloadNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const handleMarkAllRead = async () => {
    await storageAdapter.markAllNotificationsRead();
    await reloadNotifications();
  };

  const handleClickItem = (notif: StorageNotification) => {
    if (notif.link) {
      onClose();
      router.push(notif.link);
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIconForType = (type: string) => {
    switch (type) {
      case "draft_saved":
        return { icon: "save", color: "text-primary" };
      case "path_built":
        return { icon: "auto_awesome", color: "text-secondary" };
      case "feasibility_warning":
        return { icon: "warning", color: "text-amber-500" };
      case "resource_gap":
        return { icon: "info", color: "text-rose-500" };
      default:
        return { icon: "notifications", color: "text-primary" };
    }
  };

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-12 w-80 sm:w-96 bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container-high/80 z-50 overflow-hidden animate-in fade-in slide-from-top-2"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-container-high bg-surface-container-low/50">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-on-surface">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-secondary text-on-secondary text-[11px] font-bold px-1.5 py-0.2 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-secondary hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-surface-container-high/40">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-on-surface-variant">
            No notifications yet.
          </div>
        ) : (
          notifications.map((notif) => {
            const { icon, color } = getIconForType(notif.type);
            return (
              <div
                key={notif.id}
                onClick={() => handleClickItem(notif)}
                className={`p-3.5 flex items-start gap-3 transition-colors ${
                  notif.link ? "cursor-pointer hover:bg-surface-container-low" : ""
                } ${!notif.read ? "bg-secondary-container/10" : ""}`}
              >
                <span className={`material-symbols-outlined text-lg shrink-0 mt-0.5 ${color}`}>
                  {icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className={`text-xs font-semibold truncate ${!notif.read ? "text-primary" : "text-on-surface"}`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-on-surface-variant shrink-0">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-snug">
                    {notif.message}
                  </p>
                </div>
                {!notif.read && (
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0 mt-1.5" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
