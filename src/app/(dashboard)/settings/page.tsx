"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/services/supabase/profileService";
import { storageAdapter } from "@/lib/storage/storageAdapter";
import AuthGuard from "@/components/auth/AuthGuard";
import Toast from "@/components/ui/Toast";

const AVATAR_OPTIONS = [
  "/avatars/aanya-patel.png",
  "/avatars/default-avatar.svg",
];

const GRADE_OPTIONS = [
  "Class 9 · Foundation",
  "Class 10 · Board Candidate",
  "Class 11 · JEE Aspirant",
  "Class 11 · NEET Aspirant",
  "Class 12 · Board & Competitive Finals",
  "Undergraduate · Computer Science & Engineering",
  "Undergraduate · Natural Sciences & Mathematics",
  "Graduate · Advanced Research & Master's",
  "Independent Lifelong Scholar",
];

const TARGET_EXAM_OPTIONS = [
  "JEE Main & Advanced",
  "NEET UG",
  "GATE Computer Science",
  "CBSE Class 12 Boards",
  "AP / College Board Finals",
  "University Semester Examinations",
  "Industry Software Engineering Interview",
  "General Subject Mastery",
];

const LEARNING_STYLES = [
  { id: "balanced", label: "Balanced", desc: "Equal distribution between conceptual monographs, lectures, and practice drills." },
  { id: "theory_focused", label: "Theory & Derivations First", desc: "Rigorous proofs, analytical definitions, and conceptual foundations before exercises." },
  { id: "practical_projects", label: "Code & Practice First", desc: "Hands-on implementation, coding sandboxes, and problem solving from day one." },
  { id: "exam_preparation", label: "High-Yield Exam Prep", desc: "Previous year questions, pattern shortcuts, time management, and error minimization." },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "profile" | "preferences" | "security") || "profile";
  const isRecovery = searchParams.get("recovery") === "true";

  const { user, profile, refreshProfile, updatePassword, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "security">(
    isRecovery ? "security" : initialTab
  );

  // Profile Form State
  const [name, setName] = useState(profile?.name || "");
  const [grade, setGrade] = useState(profile?.grade || GRADE_OPTIONS[2]);
  const [targetExam, setTargetExam] = useState(profile?.targetExam || TARGET_EXAM_OPTIONS[0]);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || AVATAR_OPTIONS[0]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Learning Preferences State
  const [learningStyle, setLearningStyle] = useState("balanced");
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Security Form State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Toast
  const [toastState, setToastState] = useState<{ open: boolean; message: string; icon?: string }>({
    open: false,
    message: "",
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      if (profile.grade) setGrade(profile.grade);
      if (profile.targetExam) setTargetExam(profile.targetExam);
      if (profile.avatarUrl) setAvatarUrl(profile.avatarUrl);
    }
  }, [profile]);

  // Load preferences from storageAdapter on mount
  useEffect(() => {
    storageAdapter.getProfile().then((p) => {
      if (p) {
        if (!name && p.name) setName(p.name);
        if (p.grade) setGrade(p.grade);
      }
    });
    storageAdapter.getDraft<any>("learning_preferences").then((draft) => {
      if (draft) {
        if (draft.learningStyle) setLearningStyle(draft.learningStyle);
        if (draft.weeklyHours) setWeeklyHours(draft.weeklyHours);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSavingProfile(true);
    try {
      const updates = {
        name: name.trim(),
        grade,
        targetExam,
        avatarUrl,
        tier: profile?.tier || "Pro Path",
      };

      // 1. Update Supabase if authenticated
      if (user?.id) {
        await updateProfile(user.id, updates);
        await refreshProfile();
      }

      // 2. Update storageAdapter for local persistence
      await storageAdapter.saveProfile({
        id: user?.id || "local-scholar",
        name: name.trim(),
        email: user?.email || "scholar@pencill.edu",
        grade,
        tier: profile?.tier || "Pro Path",
        avatarUrl,
      });

      setToastState({
        open: true,
        message: "Scholar profile updated successfully!",
        icon: "check_circle",
      });
    } catch (err: any) {
      setToastState({
        open: true,
        message: err.message || "Failed to update profile.",
        icon: "error",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrefs(true);
    try {
      await storageAdapter.saveDraft("learning_preferences", {
        learningStyle,
        weeklyHours,
        updatedAt: new Date().toISOString(),
      });

      setToastState({
        open: true,
        message: "Learning preferences saved to your study desk.",
        icon: "check_circle",
      });
    } catch (err: any) {
      setToastState({
        open: true,
        message: "Failed to persist learning preferences.",
        icon: "error",
      });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 6) {
      setPasswordStatus({ success: false, message: "New password must be at least 6 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ success: false, message: "Passwords do not match." });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        setPasswordStatus({ success: false, message: error.message || "Failed to update password." });
      } else {
        setPasswordStatus({ success: true, message: "Password updated successfully!" });
        setNewPassword("");
        setConfirmPassword("");
        setToastState({
          open: true,
          message: "Account security credentials updated.",
          icon: "lock",
        });
      }
    } catch {
      setPasswordStatus({ success: false, message: "An unexpected error occurred while updating password." });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleClearCache = async () => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Are you sure you want to clear your local session cache? Enrolled courses and notes synced to your account will remain safe."
      );
      if (confirmed) {
        await storageAdapter.clearSession();
        setToastState({
          open: true,
          message: "Local cache cleared.",
          icon: "cleaning_services",
        });
      }
    }
  };

  const handleExportData = async () => {
    try {
      const [paths, bookmarks, progress] = await Promise.all([
        storageAdapter.getSavedPaths(),
        storageAdapter.getBookmarks(),
        storageAdapter.getProfile(),
      ]);

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        scholarProfile: progress,
        savedPaths: paths,
        bookmarks,
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pencill-scholar-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setToastState({
        open: true,
        message: "Scholar data exported successfully.",
        icon: "download",
      });
    } catch {
      setToastState({
        open: true,
        message: "Failed to export data.",
        icon: "error",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <Toast
        isOpen={toastState.open}
        message={toastState.message}
        icon={toastState.icon}
        onClose={() => setToastState((prev) => ({ ...prev, open: false }))}
      />

      {/* Editorial Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-secondary text-lg">manage_accounts</span>
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">
            Scholar Settings &amp; Preferences
          </span>
        </div>
        <h1 className="text-2xl font-bold text-primary font-serif">Workspace Settings</h1>
        <p className="text-body-sm text-on-surface-variant mt-1">
          Configure your academic identity, pedagogical delivery preferences, and security credentials.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-container-high/60 pb-1">
        {[
          { id: "profile", label: "Academic Profile", icon: "person" },
          { id: "preferences", label: "Learning Preferences", icon: "tune" },
          { id: "security", label: "Account & Security", icon: "shield" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-t-xl font-label-md text-xs font-semibold flex items-center gap-2 transition-all border-b-2 -mb-[2px] ${
              activeTab === tab.id
                ? "border-primary text-primary bg-surface-container-low/50 shadow-xs"
                : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container/30"
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: ACADEMIC PROFILE */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high/60 shadow-sm space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-primary font-serif">Scholar Identity</h2>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-2">
                Scholar Avatar
              </label>
              <div className="flex items-center gap-3">
                {AVATAR_OPTIONS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(av)}
                    className={`relative p-1 rounded-full transition-all ${
                      avatarUrl === av
                        ? "ring-2 ring-primary ring-offset-2"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={av}
                      alt={`Avatar option ${idx + 1}`}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {avatarUrl === av && (
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-primary text-on-primary rounded-full flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="settings-name" className="block text-xs font-semibold text-on-surface mb-1">
                Full Name / Scholar Alias
              </label>
              <input
                id="settings-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aanya Patel"
                className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-surface-container-high text-on-surface font-body-sm text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Academic Grade / Level */}
            <div>
              <label htmlFor="settings-grade" className="block text-xs font-semibold text-on-surface mb-1">
                Academic Grade / Program
              </label>
              <select
                id="settings-grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-surface-container-high text-on-surface font-body-sm text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Target Exam */}
            <div>
              <label htmlFor="settings-exam" className="block text-xs font-semibold text-on-surface mb-1">
                Target Milestone or Examination
              </label>
              <select
                id="settings-exam"
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-surface-container-high text-on-surface font-body-sm text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {TARGET_EXAM_OPTIONS.map((ex) => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-surface-container-high/40 flex justify-end">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-label-md text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {isSavingProfile && (
                <span className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isSavingProfile ? "Saving Profile..." : "Save Profile"}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: LEARNING PREFERENCES */}
      {activeTab === "preferences" && (
        <form onSubmit={handleSavePreferences} className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high/60 shadow-sm space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-primary font-serif">Curriculum Synthesis Preferences</h2>
            <p className="text-xs text-on-surface-variant">
              These preferences configure the default pedagogical strategy when synthesizing new learning tracks.
            </p>

            {/* Learning Style Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-on-surface">
                Preferred Teaching Philosophy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LEARNING_STYLES.map((ls) => (
                  <div
                    key={ls.id}
                    onClick={() => setLearningStyle(ls.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      learningStyle === ls.id
                        ? "border-primary bg-surface-container-low shadow-xs"
                        : "border-surface-container-high/60 hover:border-surface-container-high bg-surface-container-lowest"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-primary font-serif">{ls.label}</span>
                      <input
                        type="radio"
                        name="learningStyle"
                        checked={learningStyle === ls.id}
                        onChange={() => setLearningStyle(ls.id)}
                        className="text-primary focus:ring-primary"
                      />
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">{ls.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Hours Budget */}
            <div className="space-y-1 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-on-surface">
                  Weekly Study Hours Budget
                </label>
                <span className="text-xs font-mono font-bold text-primary bg-surface-container px-2 py-0.5 rounded">
                  {weeklyHours} Hours / Week
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={40}
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>3h (Casual)</span>
                <span>15h (Standard)</span>
                <span>40h (Intensive Examination)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-surface-container-high/40 flex justify-end">
            <button
              type="submit"
              disabled={isSavingPrefs}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-label-md text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {isSavingPrefs && (
                <span className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isSavingPrefs ? "Saving Preferences..." : "Save Preferences"}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: ACCOUNT & SECURITY */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Password Update Form */}
          <form onSubmit={handleUpdatePassword} className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high/60 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-primary font-serif">Account Password</h2>
            <p className="text-xs text-on-surface-variant">
              Update your account credentials to keep your study desk and certificates secure.
            </p>

            {passwordStatus && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                  passwordStatus.success
                    ? "bg-secondary-container/40 text-on-secondary-fixed-variant border border-secondary/30"
                    : "bg-error-container/30 text-error border border-error/30"
                }`}
              >
                <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">
                  {passwordStatus.success ? "check_circle" : "error"}
                </span>
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="new-pass" className="block text-xs font-semibold text-on-surface mb-1">
                  New Password (min 6 chars)
                </label>
                <input
                  id="new-pass"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-surface-container-high text-on-surface font-body-sm text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="confirm-pass" className="block text-xs font-semibold text-on-surface mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirm-pass"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-surface-container-high text-on-surface font-body-sm text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingPassword || !newPassword}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-label-md text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-2 transition-all"
              >
                {isUpdatingPassword && (
                  <span className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                )}
                <span>{isUpdatingPassword ? "Updating..." : "Update Password"}</span>
              </button>
            </div>
          </form>

          {/* Data Export & Cache Management */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high/60 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-primary font-serif">Data &amp; Session Management</h2>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 bg-surface-container-low/60 rounded-xl border border-surface-container-high/40">
              <div>
                <p className="text-xs font-bold text-on-surface">Export Learning Telemetry</p>
                <p className="text-[11px] text-on-surface-variant">
                  Download a complete JSON archive of your enrolled courses, bookmarks, and local progress.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                className="px-4 py-2 rounded-lg bg-surface-container-lowest text-primary hover:bg-surface-container border border-surface-container-high text-xs font-semibold shrink-0 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Export JSON</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 bg-surface-container-low/60 rounded-xl border border-surface-container-high/40">
              <div>
                <p className="text-xs font-bold text-on-surface">Purge Offline Session Cache</p>
                <p className="text-[11px] text-on-surface-variant">
                  Clears local IndexedDB and browser storage draft caches without modifying database records.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearCache}
                className="px-4 py-2 rounded-lg bg-surface-container-lowest text-error hover:bg-error-container/20 border border-error/30 text-xs font-semibold shrink-0 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                <span>Purge Cache</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 bg-error-container/10 rounded-xl border border-error/20">
              <div>
                <p className="text-xs font-bold text-error">End Active Session</p>
                <p className="text-[11px] text-on-surface-variant">
                  Sign out of this browser. All synced curricula will remain available upon your next login.
                </p>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                className="px-4 py-2 rounded-lg bg-error text-on-error hover:opacity-90 text-xs font-semibold shrink-0 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <SettingsContent />
      </Suspense>
    </AuthGuard>
  );
}
