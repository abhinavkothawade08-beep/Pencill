"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getLearningPathById } from "@/services/supabase";
import { deleteLearningPath } from "@/services/supabase/pathService";
import {
  isUserEnrolled,
  enrollUserInCourse,
  unenrollUserFromCourse,
} from "@/services/supabase/enrollmentService";
import {
  getUserBookmarks,
  addBookmark,
  removeBookmark,
} from "@/services/supabase/bookmarkService";
import { storageAdapter } from "@/lib/storage/storageAdapter";
import { LearningPath } from "@/types";
import EmptyState from "@/components/ui/EmptyState";
import DeleteCourseModal from "@/components/ui/DeleteCourseModal";
import Toast from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import StudyScheduleModal from "@/components/schedule/StudyScheduleModal";
import PersonalAITutor from "@/components/tutor/PersonalAITutor";
import PlaylistCard from "@/components/cards/PlaylistCard";
import SyllabusCoverageView from "@/components/course/SyllabusCoverageView";
import { sanitizeModuleLessonsAgainstPlaylist } from "@/lib/resource-engine/playlist-deduplication";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EditStudyNotesModal from "@/components/course/EditStudyNotesModal";
import AddResourceModal from "@/components/course/AddResourceModal";
import { Lesson } from "@/types";

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, session, profile } = useAuth();
  const courseId = params?.courseId as string;

  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);

  // Completed lesson IDs
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

  // Interactive Quiz Modal State
  const [activeQuizModule, setActiveQuizModule] = useState<any | null>(null);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Interactive Flashcard Modal State
  const [activeFlashcardModule, setActiveFlashcardModule] = useState<any | null>(null);
  const [activeFlashcardIdx, setActiveFlashcardIdx] = useState(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);
  const [flashcardMastered, setFlashcardMastered] = useState<Record<string, boolean>>({});

  // Deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastIcon, setToastIcon] = useState("check_circle");
  const [isToastOpen, setIsToastOpen] = useState(false);

  // Accordion state for modules
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [openMatrixModules, setOpenMatrixModules] = useState<Record<string, boolean>>({});

  // Curriculum Customization & Module Regeneration State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [regeneratingModuleId, setRegeneratingModuleId] = useState<string | null>(null);
  const [addResourceModuleId, setAddResourceModuleId] = useState<string | null>(null);
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [newResourceType, setNewResourceType] = useState<"video" | "reading" | "notes">("reading");

  // Add Topic / Module State
  const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicObjective, setNewTopicObjective] = useState("");
  const [newTopicHours, setNewTopicHours] = useState(3);
  const [autoSynthesizeTopic, setAutoSynthesizeTopic] = useState(true);

  // Dedicated Course Editing System States
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [initialCourseSnapshot, setInitialCourseSnapshot] = useState<any | null>(null);

  // Specialized Sub-Modals for Lesson & Resource Editing
  const [activeNotesLesson, setActiveNotesLesson] = useState<Lesson | null>(null);
  const [activeAddResourceModule, setActiveAddResourceModule] = useState<{ id: string; title: string } | null>(null);

  // Accessible Confirmation Barrier Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Warn user about unsaved changes before leaving / reloading
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes in your course syllabus. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Handle repair module success callback
  const handleModuleRepairSuccess = (moduleId: string, updatedMatrix: any, addedLessons: any[]) => {
    if (!course?.modules) return;
    const newModules = course.modules.map((m: any) => {
      if (m.id === moduleId) {
        const mergedLessons = [...(m.lessons || m.resources || []), ...(addedLessons || [])];
        return {
          ...m,
          lessons: mergedLessons,
          resources: mergedLessons,
          totalResources: mergedLessons.length,
          syllabusMatrix: updatedMatrix,
          coverageStatus: updatedMatrix.overallCoveragePercent >= 75 ? "Fully Covered" : "Partially Covered",
        };
      }
      return m;
    });

    const updatedCourse = { ...course, modules: newModules };
    setCourse(updatedCourse);
    try {
      storageAdapter.savePath(updatedCourse);
    } catch {}
    setToastIcon("check_circle");
    setToastMessage("Syllabus gaps repaired with fresh verified academic resources!");
    setIsToastOpen(true);
  };

  // Regenerate an individual module
  const handleRegenerateModule = async (moduleId: string) => {
    if (!course || regeneratingModuleId) return;
    setRegeneratingModuleId(moduleId);

    try {
      const res = await fetch(`/api/courses/${course.id}/regenerate-module`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });

      const data = await res.json();
      if (data.success && data.course) {
        setCourse(data.course);
        await storageAdapter.savePath(data.course);
        setToastIcon("check_circle");
        setToastMessage("Module regenerated with fresh verified resources & assessment!");
        setIsToastOpen(true);
      } else {
        throw new Error(data.error || "Failed to regenerate module");
      }
    } catch (err: any) {
      setToastIcon("error");
      setToastMessage(err.message || "Failed to regenerate module");
      setIsToastOpen(true);
    } finally {
      setRegeneratingModuleId(null);
    }
  };

  // Reorder modules
  const handleReorderModule = async (index: number, direction: "up" | "down") => {
    if (!course?.modules) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= course.modules.length) return;

    const newModules = [...course.modules];
    const temp = newModules[index];
    newModules[index] = newModules[targetIdx];
    newModules[targetIdx] = temp;

    const updatedCourse = { ...course, modules: newModules };
    setCourse(updatedCourse);
    await storageAdapter.savePath(updatedCourse);
    setToastIcon("check_circle");
    setToastMessage("Modules reordered successfully!");
    setIsToastOpen(true);
  };

  // Remove a module
  const handleRemoveModule = async (moduleId: string) => {
    if (!course?.modules || course.modules.length <= 1) {
      setToastIcon("warning");
      setToastMessage("Curriculum must retain at least one module.");
      setIsToastOpen(true);
      return;
    }

    const updatedModules = course.modules.filter((m: any) => m.id !== moduleId);
    const updatedCourse = { ...course, modules: updatedModules, moduleCount: updatedModules.length };
    setCourse(updatedCourse);
    await storageAdapter.savePath(updatedCourse);
    setToastIcon("check_circle");
    setToastMessage("Module removed from curriculum.");
    setIsToastOpen(true);
  };

  // Add custom resource to module
  const handleAddCustomResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addResourceModuleId || !newResourceTitle.trim() || !course?.modules) return;

    const newRes = {
      id: `custom-res-${Date.now()}`,
      title: newResourceTitle.trim(),
      type: newResourceType,
      sourceUrl: newResourceUrl.trim() || undefined,
      sourceName: "Learner Added Resource",
      durationMinutes: 15,
      verificationStatus: "verified",
    };

    const updatedModules = course.modules.map((m: any) => {
      if (m.id === addResourceModuleId) {
        const curLessons = m.lessons || m.resources || [];
        return {
          ...m,
          lessons: [...curLessons, newRes],
          resources: [...curLessons, newRes],
          totalResources: curLessons.length + 1,
        };
      }
      return m;
    });

    const updatedCourse = { ...course, modules: updatedModules };
    setCourse(updatedCourse);
    await storageAdapter.savePath(updatedCourse);
    setAddResourceModuleId(null);
    setNewResourceTitle("");
    setNewResourceUrl("");
    setToastIcon("check_circle");
    setToastMessage("Custom resource added to module!");
    setIsToastOpen(true);
  };

  // Add custom module / topic to course
  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !newTopicTitle.trim()) return;

    const newModId = `mod-${Date.now()}`;
    const newModule = {
      id: newModId,
      courseId: course.id,
      moduleNumber: (course.modules?.length || 0) + 1,
      title: newTopicTitle.trim(),
      description: newTopicObjective.trim() || `Comprehensive module covering ${newTopicTitle.trim()}`,
      estimatedHours: newTopicHours || 3,
      objective: newTopicObjective.trim() || `Master concepts of ${newTopicTitle.trim()}`,
      lessons: [
        {
          id: `les-${newModId}-vid-1`,
          title: `Foundations of ${newTopicTitle.trim()}`,
          type: "video",
          durationMinutes: 15,
          sourceName: "Verified Curriculum Lecture",
        },
        {
          id: `les-${newModId}-read-1`,
          title: `${newTopicTitle.trim()} Study Monograph`,
          type: "reading",
          durationMinutes: 12,
          sourceName: "Academic Source",
        },
      ],
      resources: [],
      checkpointQuestions: [],
      flashcards: [],
    };

    const updatedModules = [...(course.modules || []), newModule];
    const updatedCourse = {
      ...course,
      modules: updatedModules,
      moduleCount: updatedModules.length,
      durationHours: (course.durationHours || 0) + (newTopicHours || 3),
    };

    setCourse(updatedCourse);
    await storageAdapter.savePath(updatedCourse);
    setIsAddTopicModalOpen(false);
    const addedTitle = newTopicTitle.trim();
    setNewTopicTitle("");
    setNewTopicObjective("");
    setNewTopicHours(3);

    setToastIcon("check_circle");
    setToastMessage(`Module "${addedTitle}" appended to syllabus.`);
    setIsToastOpen(true);

    if (autoSynthesizeTopic) {
      handleRegenerateModule(newModId);
    }
  };

  // --------------------------------------------------------------------------
  // Course Editing System Handlers
  // --------------------------------------------------------------------------
  const handleToggleEditMode = () => {
    if (isEditMode) {
      handleCancelEditMode();
    } else {
      setIsEditMode(true);
      // Open all modules automatically in edit mode for ease of curation
      if (course?.modules) {
        const allOpen: Record<string, boolean> = {};
        course.modules.forEach((m: any) => {
          allOpen[m.id] = true;
        });
        setOpenModules(allOpen);
      }
    }
  };

  const handleCancelEditMode = () => {
    if (isDirty) {
      setConfirmDialog({
        isOpen: true,
        title: "Discard Unsaved Edits?",
        message: "You have unsaved changes in this course syllabus. If you cancel, your changes will be discarded.",
        confirmLabel: "Discard Edits",
        variant: "warning",
        onConfirm: () => {
          if (initialCourseSnapshot) {
            setCourse(JSON.parse(JSON.stringify(initialCourseSnapshot)));
          }
          setIsDirty(false);
          setIsEditMode(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      setIsEditMode(false);
    }
  };

  const handleRestoreOriginal = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Restore Original Syllabus?",
      message: "This will revert all current customizations back to the initial syllabus draft.",
      confirmLabel: "Restore Original",
      variant: "warning",
      onConfirm: () => {
        if (initialCourseSnapshot) {
          setCourse(JSON.parse(JSON.stringify(initialCourseSnapshot)));
          setIsDirty(true);
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setToastIcon("history");
        setToastMessage("Reverted to original course draft.");
        setIsToastOpen(true);
      },
    });
  };

  const handleUpdateCourseField = (field: string, value: any) => {
    if (!course) return;
    setCourse({ ...course, [field]: value });
    setIsDirty(true);
  };

  const handleAddTag = (newTag: string) => {
    if (!course || !newTag.trim()) return;
    const currentTags = course.tags || [];
    if (currentTags.includes(newTag.trim())) return;
    setCourse({ ...course, tags: [...currentTags, newTag.trim()] });
    setIsDirty(true);
  };

  const handleRemoveTag = (indexToRemove: number) => {
    if (!course || !course.tags) return;
    setCourse({
      ...course,
      tags: course.tags.filter((_: string, idx: number) => idx !== indexToRemove),
    });
    setIsDirty(true);
  };

  const handleUpdateModule = (moduleId: string, field: string, value: any) => {
    if (!course?.modules) return;
    const updated = course.modules.map((m: any) =>
      m.id === moduleId ? { ...m, [field]: value } : m
    );
    setCourse({ ...course, modules: updated });
    setIsDirty(true);
  };

  const handleConfirmDeleteModule = (moduleId: string, title: string) => {
    if (!course?.modules || course.modules.length <= 1) {
      setToastIcon("warning");
      setToastMessage("Curriculum must retain at least one module pillar.");
      setIsToastOpen(true);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: `Delete Module: ${title}?`,
      message: "This will remove this module and all of its associated lessons from your curriculum draft.",
      confirmLabel: "Delete Module",
      variant: "danger",
      onConfirm: () => {
        const remaining = (course.modules || [])
          .filter((m: any) => m.id !== moduleId)
          .map((m: any, idx: number) => ({
            ...m,
            moduleNumber: idx + 1,
            orderIndex: idx,
          }));
        setCourse({
          ...course,
          modules: remaining,
          moduleCount: remaining.length,
        });
        setIsDirty(true);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setToastIcon("delete");
        setToastMessage(`Module "${title}" removed.`);
        setIsToastOpen(true);
      },
    });
  };

  const handleAddNewModule = () => {
    if (!course) return;
    const currentModules = course.modules || [];
    const nextNum = currentModules.length + 1;
    const newModId = `mod-${course.id}-${Date.now().toString(36)}-${nextNum}`;
    const newModule = {
      id: newModId,
      pathId: course.id,
      title: `Module ${nextNum}: New Syllabus Pillar`,
      moduleNumber: nextNum,
      orderIndex: currentModules.length,
      status: "locked",
      objective: "Define core competencies and learning goals for this unit.",
      totalResources: 1,
      completedResources: 0,
      lessons: [
        {
          id: `les-${newModId}-1`,
          moduleId: newModId,
          title: "Introduction and Overview",
          type: "video",
          durationMinutes: 15,
          sourceName: "Academic Lecture",
          orderIndex: 0,
          summaryPoints: ["Foundational overview of module concepts."],
          verificationStatus: "user_added",
          isUserCreated: true,
        },
      ],
    };

    const updated = {
      ...course,
      modules: [...currentModules, newModule],
      moduleCount: currentModules.length + 1,
    };
    setCourse(updated);
    setOpenModules((prev) => ({ ...prev, [newModId]: true }));
    setIsDirty(true);
    setToastIcon("add_circle");
    setToastMessage(`Added Module ${nextNum}. Click 'Save Changes' when finished.`);
    setIsToastOpen(true);
  };

  const handleUpdateLesson = (moduleId: string, lessonId: string, field: string, value: any) => {
    if (!course?.modules) return;
    const updated = course.modules.map((m: any) => {
      if (m.id === moduleId) {
        const lessons = (m.lessons || m.resources || []).map((l: any) =>
          l.id === lessonId ? { ...l, [field]: value } : l
        );
        return {
          ...m,
          lessons,
          resources: lessons,
        };
      }
      return m;
    });
    setCourse({ ...course, modules: updated });
    setIsDirty(true);
  };

  const handleReorderLesson = (moduleId: string, index: number, direction: "up" | "down") => {
    if (!course?.modules) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;

    const updatedModules = course.modules.map((m: any) => {
      if (m.id === moduleId) {
        const rawLessons = [...(m.lessons || m.resources || [])];
        if (targetIdx < 0 || targetIdx >= rawLessons.length) return m;
        const temp = rawLessons[index];
        rawLessons[index] = rawLessons[targetIdx];
        rawLessons[targetIdx] = temp;
        const reindexed = rawLessons.map((l, i) => ({ ...l, orderIndex: i }));
        return {
          ...m,
          lessons: reindexed,
          resources: reindexed,
        };
      }
      return m;
    });

    setCourse({ ...course, modules: updatedModules });
    setIsDirty(true);
  };

  const handleConfirmDeleteLesson = (moduleId: string, lessonId: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      title: `Remove Lesson: ${title}?`,
      message: "Are you sure you want to remove this learning resource from the module?",
      confirmLabel: "Remove Lesson",
      variant: "danger",
      onConfirm: () => {
        const updatedModules = (course.modules || []).map((m: any) => {
          if (m.id === moduleId) {
            const rawLessons = m.lessons || m.resources || [];
            const filtered = rawLessons
              .filter((l: any) => l.id !== lessonId)
              .map((l: any, idx: number) => ({ ...l, orderIndex: idx }));
            return {
              ...m,
              lessons: filtered,
              resources: filtered,
              totalResources: filtered.length,
            };
          }
          return m;
        });

        setCourse({
          ...course,
          modules: updatedModules,
        });
        setIsDirty(true);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setToastIcon("delete");
        setToastMessage(`Resource "${title}" removed.`);
        setIsToastOpen(true);
      },
    });
  };

  const handleSaveStudyNotes = (updatedLesson: Lesson) => {
    if (!course?.modules) return;
    const updatedModules = course.modules.map((m: any) => {
      if (m.id === updatedLesson.moduleId) {
        const curLessons = m.lessons || m.resources || [];
        const nextLessons = curLessons.map((l: any) =>
          l.id === updatedLesson.id ? updatedLesson : l
        );
        return {
          ...m,
          lessons: nextLessons,
          resources: nextLessons,
        };
      }
      return m;
    });

    setCourse({ ...course, modules: updatedModules });
    setIsDirty(true);
    setActiveNotesLesson(null);
    setToastIcon("check_circle");
    setToastMessage(`Study notes for "${updatedLesson.title}" updated.`);
    setIsToastOpen(true);
  };

  const handleAddResource = (newLesson: Lesson, targetModuleId: string) => {
    if (!course?.modules) return;
    const updatedModules = course.modules.map((m: any) => {
      if (m.id === targetModuleId) {
        const curLessons = m.lessons || m.resources || [];
        const nextLessons = [
          ...curLessons,
          { ...newLesson, orderIndex: curLessons.length },
        ];
        return {
          ...m,
          lessons: nextLessons,
          resources: nextLessons,
          totalResources: nextLessons.length,
        };
      }
      return m;
    });

    setCourse({ ...course, modules: updatedModules });
    setIsDirty(true);
    setActiveAddResourceModule(null);
    setToastIcon("add_circle");
    setToastMessage(`Resource added to module.`);
    setIsToastOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!course || isSaving) return;
    setIsSaving(true);

    try {
      // Recompute total duration
      let totalMins = 0;
      for (const m of course.modules || []) {
        for (const l of m.lessons || m.resources || []) {
          totalMins += l.durationMinutes || 15;
        }
      }
      const recomputedHours = Math.max(1, Math.round(totalMins / 60));

      const payload = {
        title: course.title,
        description: course.description,
        domain: course.domain,
        level: course.level,
        durationHours: course.durationHours || recomputedHours,
        tags: course.tags || [],
        syllabusNote: course.syllabusNote || null,
        weeklyCheckpoint: course.weeklyCheckpoint || {},
        modules: (course.modules || []).map((m: any, mIdx: number) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          moduleNumber: mIdx + 1,
          orderIndex: mIdx,
          status: m.status,
          objective: m.objective,
          checkpointQuestions: m.checkpointQuestions || [],
          flashcards: m.flashcards || [],
          primaryPlaylist: m.primaryPlaylist || null,
          syllabusMatrix: m.syllabusMatrix || null,
          coverageStatus: m.coverageStatus,
          unmetObjectives: m.unmetObjectives,
          lessons: (m.lessons || m.resources || []).map((l: any, lIdx: number) => ({
            id: l.id,
            title: l.title,
            type: l.type,
            durationMinutes: l.durationMinutes || 15,
            sourceName: l.sourceName || "Curated Academic Source",
            sourceUrl: l.sourceUrl || undefined,
            orderIndex: lIdx,
            summaryPoints: l.summaryPoints || [],
            conceptId: l.conceptId,
            prerequisitesNote: l.prerequisitesNote,
            studyNotes: l.studyNotes || [],
            verificationStatus: l.verificationStatus || "verified",
            selectionExplanation: l.selectionExplanation,
            isPlaylist: l.isPlaylist,
            playlistItemCount: l.playlistItemCount,
          })),
        })),
      };

      // 1. Try server PATCH API
      const res = await fetch(`/api/courses/${course.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && data.course) {
        setCourse(data.course);
        setInitialCourseSnapshot(JSON.parse(JSON.stringify(data.course)));
        await storageAdapter.savePath(data.course);
      } else {
        // Offline / local fallback
        const localCourse = {
          ...course,
          durationHours: course.durationHours || recomputedHours,
          updatedAt: new Date().toISOString(),
        };
        setCourse(localCourse);
        setInitialCourseSnapshot(JSON.parse(JSON.stringify(localCourse)));
        await storageAdapter.savePath(localCourse);
        if (typeof window !== "undefined") {
          localStorage.setItem(`pencill_path_${course.id}`, JSON.stringify(localCourse));
        }
      }

      setIsDirty(false);
      setToastIcon("check_circle");
      setToastMessage("All curriculum customizations saved successfully!");
      setIsToastOpen(true);
    } catch (saveErr: any) {
      console.warn("[CourseDetails] Save error, saving locally:", saveErr);
      await storageAdapter.savePath(course);
      setInitialCourseSnapshot(JSON.parse(JSON.stringify(course)));
      setIsDirty(false);
      setToastIcon("check_circle");
      setToastMessage("Course saved to local storage.");
      setIsToastOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  // 1. Load course from Supabase or storageAdapter fallback
  const loadCourseData = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);

    try {
      let data: any = null;
      try {
        data = await getLearningPathById(courseId);
      } catch (err) {
        console.warn("[CourseDetails] Supabase load failed, falling back to storageAdapter:", err);
      }

      if (!data) {
        data = await storageAdapter.getSavedPathById(courseId);
      }

      if (!data) {
        setError(`The requested curriculum (${courseId}) was not found in local or remote store.`);
        return;
      }

      setCourse(data);
      setInitialCourseSnapshot(JSON.parse(JSON.stringify(data)));

      // Initialize accordion
      if (data?.modules && data.modules.length > 0) {
        const initial: Record<string, boolean> = {};
        data.modules.forEach((m: any, idx: number) => {
          initial[m.id] = idx === 0;
        });
        setOpenModules(initial);
      }

      // Check progress in storageAdapter
      const prog = await storageAdapter.getProgress(courseId);
      if (prog && prog.completedLessonIds) {
        setCompletedLessonIds(prog.completedLessonIds);
      }
    } catch (err: any) {
      console.error("[CourseDetails] Error loading course:", err);
      setError("Unable to load course syllabus.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  // 2. Check enrollment and bookmarks
  useEffect(() => {
    if (!courseId) return;

    // Enrollment check
    isUserEnrolled(user?.id || null, courseId, { accessToken: session?.access_token })
      .then((enrolled) => {
        setIsEnrolled(enrolled);
      })
      .catch(async () => {
        // Fallback: check storageAdapter progress
        const prog = await storageAdapter.getProgress(courseId);
        if (prog) setIsEnrolled(true);
      });

    // Bookmark check
    if (user?.id) {
      getUserBookmarks(user.id)
        .then((bmarks) => {
          const match = bmarks.find((b) => b.pathId === courseId);
          if (match) {
            setIsBookmarked(true);
            setBookmarkId(match.id);
          } else {
            setIsBookmarked(false);
            setBookmarkId(null);
          }
        })
        .catch(async () => {
          const localBmarks = await storageAdapter.getBookmarks();
          const match = localBmarks.find((b) => b.pathId === courseId || b.id === `bm-${courseId}`);
          setIsBookmarked(!!match);
        });
    } else {
      storageAdapter.getBookmarks().then((localBmarks) => {
        const match = localBmarks.find((b) => b.pathId === courseId || b.id === `bm-${courseId}`);
        setIsBookmarked(!!match);
      });
    }
  }, [courseId, user?.id, session?.access_token]);

  // Toggle lesson complete
  const handleToggleLessonComplete = async (lessonId: string) => {
    if (!course) return;

    const nextCompleted = completedLessonIds.includes(lessonId)
      ? completedLessonIds.filter((id) => id !== lessonId)
      : [...completedLessonIds, lessonId];

    setCompletedLessonIds(nextCompleted);

    // Update storageAdapter progress
    const totalLessons = course.modules?.reduce(
      (sum: number, m: any) => sum + (m.lessons?.length || m.resources?.length || 0),
      0
    ) || 1;
    const progressPercent = Math.min(100, Math.round((nextCompleted.length / totalLessons) * 100));

    await storageAdapter.updateProgress(course.id, {
      completedLessonIds: nextCompleted,
      hoursLogged: Math.round((nextCompleted.length * (course.durationHours || 20)) / totalLessons),
    });

    setToastIcon("check_circle");
    setToastMessage(
      nextCompleted.includes(lessonId)
        ? `Lesson marked complete (${progressPercent}% track progress)`
        : "Lesson marked incomplete"
    );
    setIsToastOpen(true);
  };

  const handleToggleEnroll = async () => {
    if (!course || isEnrolling) return;
    setIsEnrolling(true);

    try {
      if (isEnrolled) {
        if (user?.id) {
          try {
            await unenrollUserFromCourse(user.id, course.id, {
              accessToken: session?.access_token,
            });
          } catch {}
        }
        setIsEnrolled(false);
        setCourse((prev: any) =>
          prev
            ? { ...prev, enrolledCount: Math.max(0, (prev.enrolledCount || 1) - 1) }
            : null
        );
        setToastIcon("info");
        setToastMessage(`Unenrolled from "${course.title}".`);
        setIsToastOpen(true);
      } else {
        if (user?.id) {
          try {
            await enrollUserInCourse(user.id, course.id, {
              accessToken: session?.access_token,
            });
          } catch {}
        }
        await storageAdapter.updateProgress(course.id, {
          completedLessonIds: [],
          hoursLogged: 0,
          quizScores: {},
          flashcardState: {},
        });
        setIsEnrolled(true);
        setCourse((prev: any) =>
          prev ? { ...prev, enrolledCount: (prev.enrolledCount || 0) + 1 } : null
        );
        setToastIcon("check_circle");
        setToastMessage(`Enrolled in "${course.title}".`);
        setIsToastOpen(true);
      }
    } catch (err: any) {
      setToastIcon("error");
      setToastMessage(err.message || "Failed to update enrollment.");
      setIsToastOpen(true);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!course) return;

    try {
      if (isBookmarked) {
        if (bookmarkId && user?.id) {
          try {
            await removeBookmark(bookmarkId, user.id);
          } catch {}
        }
        await storageAdapter.removeBookmark(`bm-${course.id}`);
        await storageAdapter.removeBookmark(course.id);
        setIsBookmarked(false);
        setBookmarkId(null);
        setToastIcon("bookmark_remove");
        setToastMessage("Curriculum removed from saved bookmarks.");
        setIsToastOpen(true);
      } else {
        let addedId: string | undefined;
        if (user?.id) {
          try {
            const res = await addBookmark(
              {
                pathId: course.id,
                title: course.title,
                type: "path",
                category: "path",
                source: "Pencill",
                description: course.description || "Learning pathway",
              },
              user.id
            );
            addedId = res ?? undefined;
          } catch {}
        }
        await storageAdapter.addBookmark({
          type: "path",
          title: course.title,
          pathId: course.id,
          source: "Pencill Verified Track",
        });
        setIsBookmarked(true);
        setBookmarkId(addedId || `bm-${course.id}`);
        setToastIcon("bookmark");
        setToastMessage("Curriculum added to your bookmarks.");
        setIsToastOpen(true);
      }
    } catch (err: any) {
      setToastIcon("error");
      setToastMessage(err.message || "Failed to update bookmarks.");
      setIsToastOpen(true);
    }
  };

  // Export JSON handler
  const handleExportJson = () => {
    if (!course) return;
    const cleanFilename = `${(course.title || "curriculum").replace(/[^a-zA-Z0-9]/g, "_")}.json`;
    const blob = new Blob([JSON.stringify(course, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = cleanFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastIcon("download");
    setToastMessage(`Exported "${cleanFilename}" to your downloads.`);
    setIsToastOpen(true);
  };

  // Print syllabus handler
  const handlePrintSyllabus = () => {
    window.print();
  };

  const toggleModule = (id: string) => {
    setOpenModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    if (!course?.modules) return;
    const areAllOpen = course.modules.every((m: any) => openModules[m.id]);
    const nextState: Record<string, boolean> = {};
    course.modules.forEach((m: any) => {
      nextState[m.id] = !areAllOpen;
    });
    setOpenModules(nextState);
  };

  const isOwner = Boolean(user && course?.authorUserId && course.authorUserId === user.id);
  const isAdmin = Boolean(
    profile?.tier?.toLowerCase() === "admin" ||
      (user?.app_metadata as Record<string, unknown> | undefined)?.role === "admin"
  );
  const canDelete = isOwner || isAdmin || !course?.authorUserId;
  const canEdit = isOwner || isAdmin || !course?.authorUserId;

  const handleDeleteConfirm = async () => {
    if (!course) return;
    setIsDeleting(true);

    try {
      // 1. Delete and unenroll via pathService helper
      await deleteLearningPath(course.id, {
        accessToken: session?.access_token,
        userId: user?.id || null,
      });

      // 2. Explicitly ensure unenrollment
      await unenrollUserFromCourse(user?.id || null, course.id, {
        accessToken: session?.access_token,
      });

      // 3. Remove from storageAdapter
      await storageAdapter.deletePath(course.id);

      setToastIcon("check_circle");
      setToastMessage(`Curriculum "${course.title}" was permanently deleted.`);
      setIsToastOpen(true);
      setIsDeleteModalOpen(false);
      setTimeout(() => {
        router.push("/courses");
      }, 1200);
    } catch (err: any) {
      setToastIcon("error");
      setToastMessage(err.message || "Error deleting course.");
      setIsToastOpen(true);
      setIsDeleting(false);
    }
  };

  // Checkpoint Quiz submission
  const handleQuizOptionSelect = (qIdx: number, optionIdx: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qIdx]: optionIdx }));
  };

  const handleQuizSubmit = async () => {
    if (!activeQuizModule) return;
    const questions = activeQuizModule.checkpointQuestions || [];
    let correct = 0;
    questions.forEach((q: any, idx: number) => {
      const targetIndex = typeof q.correctOptionIndex === 'number'
        ? q.correctOptionIndex
        : (q.correctOptionId ? (q.correctOptionId.charCodeAt(0) - 65) : 0);
      if (quizAnswers[idx] === targetIndex) {
        correct++;
      }
    });
    const scorePct = Math.round((correct / Math.max(1, questions.length)) * 100);
    setQuizScore(scorePct);
    setQuizSubmitted(true);

    // Save quiz score & mark quiz lesson complete in storageAdapter
    const existingProg = (await storageAdapter.getProgress(course.id)) || {
      completedLessonIds: [],
      hoursLogged: 0,
      quizScores: {},
      flashcardState: {},
    };

    const nextCompleted = new Set(existingProg.completedLessonIds || []);
    // Find quiz lesson in this module
    const moduleLessons = activeQuizModule.lessons || activeQuizModule.resources || [];
    for (const l of moduleLessons) {
      if (l.type === 'quiz' || (l.title && l.title.toLowerCase().includes('quiz'))) {
        nextCompleted.add(l.id);
      }
    }
    const updatedCompletedList = Array.from(nextCompleted);
    setCompletedLessonIds(updatedCompletedList);

    await storageAdapter.updateProgress(course.id, {
      completedLessonIds: updatedCompletedList,
      quizScores: {
        ...(existingProg.quizScores || {}),
        [activeQuizModule.id]: scorePct,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-space-xl pb-space-xl max-w-5xl mx-auto animate-pulse">
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-surface-container-high/60 space-y-4">
          <div className="h-4 bg-surface-container rounded w-48"></div>
          <div className="h-9 bg-surface-container rounded w-3/4"></div>
          <div className="h-4 bg-surface-container-low rounded w-full"></div>
          <div className="h-4 bg-surface-container-low rounded w-2/3"></div>
          <div className="h-10 bg-surface-container-low rounded w-64 mt-6"></div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-4xl mx-auto py-space-xl">
        <EmptyState
          title="Curriculum Not Found"
          description={
            error ||
            `The requested curriculum (${courseId}) is not yet available in the catalog.`
          }
          actionText="Browse Available Paths"
          actionHref="/explore"
        />
      </div>
    );
  }

  const allLessons =
    course.modules?.flatMap((m: any) => m.lessons || m.resources || []) || [];
  const totalLessonsCount = allLessons.length;
  const completedCount = completedLessonIds.length;
  const progressPercent =
    totalLessonsCount > 0
      ? Math.min(100, Math.round((completedCount / totalLessonsCount) * 100))
      : course.progressPercent ?? 0;

  const firstModule = course.modules?.[0];
  const firstLesson = firstModule?.lessons?.[0] || firstModule?.resources?.[0];

  return (
    <div className="flex flex-col gap-space-xl pb-space-xl max-w-5xl mx-auto print:max-w-none print:p-0">
      {/* Course Editing Mode Sticky Toolbar */}
      {isEditMode && (
        <aside
          role="region"
          aria-label="Course Editing Toolbar"
          className="sticky top-4 z-40 bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border-2 border-primary/30 flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">edit_document</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary text-sm">Course Syllabus Editor</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                    isDirty
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isDirty ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                  <span>{isDirty ? "Unsaved Changes" : "All Changes Saved"}</span>
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Customize titles, objectives, module ordering, lessons, and reading monographs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleRestoreOriginal}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low border border-surface-container-high/60 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              title="Restore to original draft before edits"
            >
              <span className="material-symbols-outlined text-sm">history</span>
              <span>Restore Original</span>
            </button>

            <button
              type="button"
              onClick={handleCancelEditMode}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low border border-surface-container-high/60 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>Cancel</span>
            </button>

            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={isSaving || !isDirty}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container active:scale-95 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">save</span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </aside>
      )}

      {/* 1. Course Header Section */}
      <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-high/60 print:border-none print:shadow-none print:p-0 relative overflow-hidden">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-space-xs text-on-surface-variant font-label-md text-label-md mb-space-sm print:hidden">
          <Link href="/courses" className="hover:text-primary transition-colors">
            My Courses
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary font-semibold">{course.title}</span>
          <span className="mx-space-xs text-outline-variant">•</span>
          <span className="bg-secondary-container/50 text-on-secondary-fixed-variant px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold">
            Curated Pathway
          </span>
        </div>

        {isEditMode ? (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
                Course Title
              </label>
              <input
                type="text"
                value={course.title || ""}
                onChange={(e) => handleUpdateCourseField("title", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border-2 border-primary/40 text-primary font-display-md text-xl font-serif focus:outline-hidden focus:border-primary shadow-xs"
                placeholder="Course Title"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Course Description
              </label>
              <textarea
                rows={2}
                value={course.description || ""}
                onChange={(e) => handleUpdateCourseField("description", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high/60 text-on-surface text-sm focus:outline-hidden focus:border-primary leading-relaxed"
                placeholder="Course overview and scope"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Academic Domain
                </label>
                <input
                  type="text"
                  value={course.domain || ""}
                  onChange={(e) => handleUpdateCourseField("domain", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high/60 text-on-surface text-sm focus:outline-hidden focus:border-primary"
                  placeholder="e.g. Computer Science, Mathematics"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Academic Level
                </label>
                <select
                  value={course.level || "Class 11"}
                  onChange={(e) => handleUpdateCourseField("level", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high/60 text-on-surface text-sm focus:outline-hidden focus:border-primary"
                >
                  <option value="Foundation">Foundation</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Competitive">Competitive Exam</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Estimated Duration (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={course.durationHours || 20}
                  onChange={(e) => handleUpdateCourseField("durationHours", parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high/60 text-on-surface text-sm focus:outline-hidden focus:border-primary"
                />
              </div>
            </div>

            {/* Tags Editor */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Course Tags
              </label>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {(course.tags || []).map((tag: string, tIdx: number) => (
                  <span
                    key={tIdx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-container text-primary border border-surface-container-high/60"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tIdx)}
                      className="hover:text-error transition-colors"
                      title="Remove tag"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a tag and press Enter..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        handleAddTag(val);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-surface-container-low border border-surface-container-high/60 text-on-surface text-xs focus:outline-hidden focus:border-primary"
                />
              </div>
            </div>

            {/* Curator / Syllabus Note */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Curator&apos;s Syllabus Note
              </label>
              <textarea
                rows={2}
                value={course.syllabusNote || ""}
                onChange={(e) => handleUpdateCourseField("syllabusNote", e.target.value)}
                placeholder="Pedagogical rationale or study advice"
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high/60 text-on-surface text-sm focus:outline-hidden focus:border-primary leading-relaxed"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-space-sm">
            <div>
              <h1 className="font-display-lg text-display-lg text-primary tracking-tight font-serif">
                {course.title}
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed max-w-3xl">
                {course.level || "Class 11"} · {course.language || "English Medium"} · {course.description || "Rigorous academic pathway curated from verified open access repositories."}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold self-start md:self-auto shrink-0 print:hidden">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              Advanced Syllabus
            </span>
          </div>
        )}

        {/* Academic Metadata Array */}
        <div className="flex flex-wrap items-center gap-space-sm mt-space-md pt-space-md border-t border-surface-container-low print:hidden">
          <div className="flex items-center gap-1.5 text-on-surface font-label-md text-label-md bg-surface-container-low px-2.5 py-1 rounded">
            <span className="material-symbols-outlined text-base text-on-surface-variant">auto_stories</span>
            <span>{totalLessonsCount} Resources</span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface font-label-md text-label-md bg-surface-container-low px-2.5 py-1 rounded">
            <span className="material-symbols-outlined text-base text-on-surface-variant">category</span>
            <span>{course.modules?.length || 4} Core Modules</span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface font-label-md text-label-md bg-surface-container-low px-2.5 py-1 rounded">
            <span className="material-symbols-outlined text-base text-on-surface-variant">schedule</span>
            <span>{course.durationHours || 18} Hours Total</span>
          </div>
          <div className="flex items-center gap-1.5 text-on-secondary-fixed-variant font-label-md text-label-md bg-secondary-fixed/40 px-2.5 py-1 rounded">
            <span className="material-symbols-outlined text-base">psychology</span>
            <span>Prerequisites: {course.domain || "Standard Syllabus"}</span>
          </div>
        </div>

        {/* Course Progress Ribbon */}
        <div className="mt-space-lg bg-surface-container-low p-space-md rounded-lg border border-surface-container-high/40 print:hidden">
          <div className="flex items-center justify-between font-label-md text-label-md mb-2">
            <span className="text-on-surface font-semibold">Curriculum Progression</span>
            <span className="text-primary font-bold">
              {progressPercent}% Complete <span className="font-normal text-on-surface-variant">({completedCount} of {totalLessonsCount} items)</span>
            </span>
          </div>
          <div className="w-full h-2.5 bg-surface-variant rounded-full overflow-hidden flex">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Quick Launch Bar */}
        <div className="flex flex-wrap items-center justify-between gap-space-md mt-space-lg pt-space-sm print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            {firstLesson && (
              <Link
                href={`/learn/${course.id}/${firstLesson.id}`}
                className="bg-primary text-on-primary hover:bg-primary-container px-space-md py-2.5 rounded-lg font-label-lg text-label-lg transition-all shadow-sm flex items-center gap-2 active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">play_circle</span>
                <span>Resume Next: {firstLesson.title}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleToggleEnroll}
              disabled={isEnrolling}
              className={`px-space-md py-2.5 rounded-lg font-label-md text-label-md font-semibold transition-all border flex items-center gap-1.5 ${
                isEnrolled
                  ? "bg-surface-container text-on-surface hover:bg-error-container hover:text-on-error-container border-surface-container-high"
                  : "bg-surface-container-low text-primary hover:bg-surface-container border-surface-container-high/60"
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {isEnrolled ? "check" : "add"}
              </span>
              <span>{isEnrolled ? "Enrolled" : "Enroll Free"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintSyllabus}
              className="bg-surface-container-lowest text-primary hover:bg-surface-container px-space-md py-2.5 rounded-lg font-label-lg text-label-lg transition-colors flex items-center gap-1.5 border border-surface-container-high/60"
            >
              <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
              <span>Syllabus (Print/PDF)</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="bg-surface-container-lowest text-primary hover:bg-surface-container px-space-md py-2.5 rounded-lg font-label-lg text-label-lg transition-colors flex items-center gap-1.5 border border-surface-container-high/60"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              <span>JSON</span>
            </button>

            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="bg-surface-container-lowest text-primary hover:bg-surface-container px-space-md py-2.5 rounded-lg font-label-lg text-label-lg transition-colors flex items-center gap-1.5 border border-surface-container-high/60"
            >
              <span className="material-symbols-outlined text-lg">calendar_month</span>
              <span>Study Planner (.ics)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`p-2.5 rounded-lg border transition-colors flex items-center justify-center ${
                isBookmarked
                  ? "bg-secondary-container/40 text-secondary border-secondary/30"
                  : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant border-surface-container-high/60"
              }`}
              title={isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
            >
              <span className="material-symbols-outlined text-xl">
                {isBookmarked ? "bookmark_added" : "bookmark_border"}
              </span>
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={handleToggleEditMode}
                className={`px-3 py-2 rounded-lg font-label-md text-label-md font-semibold transition-all flex items-center gap-1.5 border shadow-xs ${
                  isEditMode
                    ? "bg-amber-600 text-white border-amber-600 hover:bg-amber-700"
                    : "bg-surface-container-low text-primary hover:bg-surface-container border-surface-container-high/60"
                }`}
                title={isEditMode ? "Exit Edit Mode" : "Edit Course Syllabus"}
              >
                <span className="material-symbols-outlined text-base">
                  {isEditMode ? "close" : "edit"}
                </span>
                <span>{isEditMode ? "Exit Edit Mode" : "Edit Course"}</span>
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-error hover:bg-error/10 px-3 py-2 rounded-lg font-label-md text-label-md transition-colors flex items-center gap-1.5 border border-transparent hover:border-error/20"
                title="Delete Course Track"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                <span className="hidden sm:inline">Delete Track</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Pedagogical Statement & Visual Spark Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-space-md items-stretch print:hidden">
        <div className="md:col-span-2 bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-high/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm tracking-wider uppercase mb-1 font-semibold">
              <span className="material-symbols-outlined text-sm text-secondary">verified_user</span>
              <span>Curator&apos;s Syllabus Note</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface leading-relaxed">
              A structured mastery pathway spanning analytical theory, rigorous concept mapping, and graded practice problem sets. Designed for deep conceptual intuition, moving deliberately from intuitive physical models to calculus-based derivations.
            </p>
          </div>
          <div className="flex items-center gap-space-md pt-space-sm mt-space-sm border-t border-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> {totalLessonsCount} Verified Resources
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Continuous Diagnostic Checkpoints
            </span>
          </div>
        </div>

        <div className="bg-primary text-on-primary rounded-xl p-space-md flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="absolute -right-6 -bottom-6 opacity-10 text-on-primary pointer-events-none">
            <span className="material-symbols-outlined text-9xl">functions</span>
          </div>
          <div className="relative z-10">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-fixed font-semibold">Weekly Target</span>
            <h3 className="font-headline-md text-headline-md mt-1 font-serif">Curriculum Sprint</h3>
            <p className="font-body-sm text-body-sm text-primary-fixed-dim mt-1">Projected mastery checkpoint this week.</p>
          </div>
          <div className="relative z-10 pt-space-md">
            <div className="flex justify-between items-end mb-1 text-on-primary font-label-sm text-label-sm">
              <span>Target Completion</span>
              <span className="font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-primary-container rounded-full overflow-hidden">
              <div className="h-full bg-secondary-fixed transition-all" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Structured Curriculum Tree / Modules */}
      <section className="space-y-space-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-space-sm">
            <h3 className="font-headline-md text-headline-md text-primary font-serif">
              Syllabus Breakdown
            </h3>
            <span className="text-on-surface-variant font-label-md text-label-md">
              {course.modules?.length || 0} Modules · {course.durationHours ? `~${course.durationHours}h Total` : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => setIsAddTopicModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-surface-container-high text-primary hover:bg-surface-container font-label-md text-xs font-semibold flex items-center gap-1 border border-surface-container-high shadow-xs transition-all"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              <span>+ Add Topic / Module</span>
            </button>
            {course.modules && course.modules.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="text-primary hover:text-primary-container font-label-md text-label-md font-semibold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">unfold_more</span>
                <span>Toggle All</span>
              </button>
            )}
          </div>
        </div>

        {/* Modules Accordion */}
        <div className="space-y-space-sm">
          {course.modules?.map((module: any, mIdx: number) => {
            const isOpen = !!openModules[module.id];
            const rawResources = module.lessons || module.resources || [];
            const { lessons: resources } = module.primaryPlaylist
              ? sanitizeModuleLessonsAgainstPlaylist(module)
              : { lessons: rawResources };
            const moduleCompleted =
              resources.length > 0 &&
              resources.every((r: any) => completedLessonIds.includes(r.id));

            const displayResources = isEditMode ? rawResources : resources;

            return (
              <div
                key={module.id || mIdx}
                className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-surface-container-high/60 transition-all print:border-b print:shadow-none"
              >
                {/* Module Header: Edit Mode vs View Mode */}
                {isEditMode ? (
                  <div className="w-full p-space-md flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-surface-container-high/40 bg-surface-container-low/50">
                    <div className="flex items-start md:items-center gap-3 min-w-0 flex-1">
                      {/* Reorder Buttons */}
                      <div className="flex flex-col sm:flex-row items-center bg-surface-container rounded-lg p-0.5 border border-surface-container-high/40 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReorderModule(mIdx, "up")}
                          disabled={mIdx === 0}
                          aria-label="Move module up"
                          className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-high disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Move module up"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_upward</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorderModule(mIdx, "down")}
                          disabled={mIdx === (course.modules?.length || 0) - 1}
                          aria-label="Move module down"
                          className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-high disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Move module down"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_downward</span>
                        </button>
                      </div>

                      <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-xl">view_module</span>
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                            Module {(mIdx + 1).toString().padStart(2, "0")}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 uppercase">
                            Editing
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            ({displayResources.length} Lessons)
                          </span>
                        </div>

                        <input
                          type="text"
                          value={module.title}
                          onChange={(e) => handleUpdateModule(module.id, "title", e.target.value)}
                          placeholder="Module Pillar Title"
                          className="w-full px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high text-sm font-bold text-primary font-serif focus:outline-none focus:ring-1 focus:ring-primary"
                        />

                        <input
                          type="text"
                          value={module.objective || ""}
                          onChange={(e) => handleUpdateModule(module.id, "objective", e.target.value)}
                          placeholder="Module learning objective / pedagogical target..."
                          className="w-full px-3 py-1 rounded-lg bg-surface-container-lowest border border-surface-container-high/70 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => setActiveAddResourceModule({ id: module.id, title: module.title })}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1.5 border border-primary/20 transition-colors shadow-2xs"
                        title="Add resource or lecture to this module"
                      >
                        <span className="material-symbols-outlined text-sm">add_circle</span>
                        <span>Add Resource</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleConfirmDeleteModule(module.id, module.title)}
                        aria-label="Delete module"
                        className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors"
                        title="Delete this module pillar"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleModule(module.id)}
                        aria-label={isOpen ? "Collapse module" : "Expand module"}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
                        title={isOpen ? "Collapse module" : "Expand module"}
                      >
                        <span className={`material-symbols-outlined text-lg transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                          expand_more
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleModule(module.id)}
                    className="w-full p-space-md flex items-center justify-between text-left hover:bg-surface-container-low transition-colors"
                  >
                    <div className="flex items-center gap-space-md min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          moduleCompleted
                            ? "bg-surface-container text-primary"
                            : "bg-primary-container text-on-primary"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">
                          {moduleCompleted ? "check_circle" : "menu_book"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                            Module {(mIdx + 1).toString().padStart(2, "0")}
                          </span>
                          {module.checkpointQuestions?.length > 0 && (
                            <span className="px-2 py-0.5 rounded font-label-sm text-xs font-semibold bg-secondary-container/40 text-on-secondary-container">
                              Quiz Ready
                            </span>
                          )}
                          {module.flashcards?.length > 0 && (
                            <span className="px-2 py-0.5 rounded font-label-sm text-xs font-semibold bg-primary/10 text-primary">
                              Formula Deck
                            </span>
                          )}
                          {module.syllabusMatrix && (
                            <span className="px-2 py-0.5 rounded font-mono text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                              {module.syllabusMatrix.overallCoveragePercent}% Covered
                            </span>
                          )}
                        </div>
                        <h4 className="font-headline-sm text-headline-sm text-primary truncate mt-0.5 font-sans">
                          {module.title}
                        </h4>
                        {module.objective && (
                          <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">
                            {module.objective}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-space-md shrink-0">
                      <span className="hidden sm:inline font-label-md text-label-md text-on-surface-variant">
                        {displayResources.length} Resources
                      </span>
                      <span
                        className={`material-symbols-outlined text-on-surface-variant transition-transform duration-200 print:hidden ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      >
                        expand_more
                      </span>
                    </div>
                  </button>
                )}

                {/* Collapsible Content */}
                {(isOpen || typeof window === "undefined") && (
                  <div className="px-space-md pb-space-md pt-space-xs space-y-2 border-t border-surface-container-high/40">
                    {/* Module Interactive Runners Strip (Hidden in Edit Mode for clean curation) */}
                    {!isEditMode && (
                      <div className="flex flex-wrap items-center gap-2 py-1 mb-2 print:hidden">
                        {module.checkpointQuestions?.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveQuizModule(module);
                              setActiveQuestionIdx(0);
                              setQuizAnswers({});
                              setQuizSubmitted(false);
                              setQuizScore(null);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                          >
                            <span className="material-symbols-outlined text-sm">quiz</span>
                            <span>Take Checkpoint Quiz ({module.checkpointQuestions.length} Qs)</span>
                          </button>
                        )}

                        {module.flashcards?.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveFlashcardModule(module);
                              setActiveFlashcardIdx(0);
                              setIsFlashcardFlipped(false);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-surface-container text-primary hover:bg-surface-container-high text-xs font-semibold border border-surface-container-high/60 flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">style</span>
                            <span>Review Flashcards ({module.flashcards.length} Cards)</span>
                          </button>
                        )}

                        {/* Regenerate Individual Module */}
                        <button
                          type="button"
                          onClick={() => handleRegenerateModule(module.id)}
                          disabled={regeneratingModuleId === module.id}
                          className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold border border-surface-container-high/60 flex items-center gap-1.5 disabled:opacity-50"
                          title="Regenerate this individual module without modifying the rest of the course"
                        >
                          <span className={`material-symbols-outlined text-sm ${regeneratingModuleId === module.id ? "animate-spin" : ""}`}>
                            {regeneratingModuleId === module.id ? "progress_activity" : "refresh"}
                          </span>
                          <span>{regeneratingModuleId === module.id ? "Regenerating..." : "Regenerate Module"}</span>
                        </button>

                        {/* Add Personal Resource */}
                        <button
                          type="button"
                          onClick={() => setAddResourceModuleId(module.id)}
                          className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold border border-surface-container-high/60 flex items-center gap-1.5"
                          title="Add personal study link or note to this module"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                          <span>Add Resource</span>
                        </button>

                        {/* Move Up / Move Down */}
                        {mIdx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleReorderModule(mIdx, "up")}
                            className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant"
                            title="Move module up"
                          >
                            <span className="material-symbols-outlined text-base">arrow_upward</span>
                          </button>
                        )}
                        {mIdx < (course.modules?.length || 0) - 1 && (
                          <button
                            type="button"
                            onClick={() => handleReorderModule(mIdx, "down")}
                            className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant"
                            title="Move module down"
                          >
                            <span className="material-symbols-outlined text-base">arrow_downward</span>
                          </button>
                        )}

                        {/* Syllabus Matrix Toggle */}
                        {module.syllabusMatrix && (
                          <button
                            type="button"
                            onClick={() => setOpenMatrixModules((prev) => ({ ...prev, [module.id]: !prev[module.id] }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                              openMatrixModules[module.id]
                                ? "bg-primary text-on-primary border-primary"
                                : "bg-surface-container text-primary hover:bg-surface-container-high border-surface-container-high/60"
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">checklist</span>
                            <span>{openMatrixModules[module.id] ? "Hide Syllabus Matrix" : "Syllabus Matrix"}</span>
                          </button>
                        )}

                        {/* Remove Module */}
                        <button
                          type="button"
                          onClick={() => handleRemoveModule(module.id)}
                          className="p-1 rounded-lg hover:bg-error-container hover:text-error text-on-surface-variant ml-auto"
                          title="Remove module"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    )}

                    {/* Primary Playlist Card if present (view mode only) */}
                    {!isEditMode && module.primaryPlaylist && (
                      <PlaylistCard playlist={module.primaryPlaylist} moduleTitle={module.title} />
                    )}

                    {/* Syllabus Coverage View if toggled */}
                    {!isEditMode && module.syllabusMatrix && openMatrixModules[module.id] && (
                      <SyllabusCoverageView
                        courseId={course.id}
                        moduleId={module.id}
                        moduleTitle={module.title}
                        matrix={module.syllabusMatrix}
                        onRepairCompleted={(updatedMatrix, newLessons) =>
                          handleModuleRepairSuccess(module.id, updatedMatrix, newLessons)
                        }
                      />
                    )}

                    {/* Resources List: Edit Mode vs View Mode */}
                    {isEditMode ? (
                      <div className="space-y-3">
                        {displayResources.map((item: any, idx: number) => {
                          const isUserAdded =
                            item.verificationStatus === "user_added" ||
                            Boolean(item.isUserCreated);

                          return (
                            <div
                              key={item.id || idx}
                              className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high/60 space-y-3"
                            >
                              {/* Top Row: Reordering, Index, Verification Badges, Actions */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  {/* Reorder Buttons */}
                                  <div className="flex items-center bg-surface-container rounded-lg p-0.5 border border-surface-container-high/40">
                                    <button
                                      type="button"
                                      onClick={() => handleReorderLesson(module.id, idx, "up")}
                                      disabled={idx === 0}
                                      aria-label="Move lesson up"
                                      className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-high disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                      title="Move lesson up"
                                    >
                                      <span className="material-symbols-outlined text-sm">arrow_upward</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleReorderLesson(module.id, idx, "down")}
                                      disabled={idx === displayResources.length - 1}
                                      aria-label="Move lesson down"
                                      className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-high disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                      title="Move lesson down"
                                    >
                                      <span className="material-symbols-outlined text-sm">arrow_downward</span>
                                    </button>
                                  </div>

                                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                                    #{idx + 1}
                                  </span>

                                  {/* Verification Badge */}
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase ${
                                      isUserAdded
                                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                    }`}
                                  >
                                    {isUserAdded ? "User Added" : "Verified"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setActiveNotesLesson(item)}
                                    className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold flex items-center gap-1.5 border border-surface-container-high/70 transition-colors shadow-2xs"
                                    title="Edit rich-text study notes & monograph"
                                  >
                                    <span className="material-symbols-outlined text-xs">edit_note</span>
                                    <span>Edit Study Notes</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleConfirmDeleteLesson(module.id, item.id, item.title)}
                                    aria-label="Remove resource"
                                    className="p-1 rounded-lg hover:bg-error-container hover:text-error text-on-surface-variant transition-colors"
                                    title="Remove resource from module"
                                  >
                                    <span className="material-symbols-outlined text-base">delete</span>
                                  </button>
                                </div>
                              </div>

                              {/* Title Input */}
                              <div>
                                <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                                  Lesson / Resource Title
                                </label>
                                <input
                                  type="text"
                                  value={item.title || ""}
                                  onChange={(e) => handleUpdateLesson(module.id, item.id, "title", e.target.value)}
                                  placeholder="e.g. Memory Layout & Pointer Arithmetic in C"
                                  className="w-full px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high/70 text-xs font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </div>

                              {/* Modality, Duration, Source Name, URL */}
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                                <div className="sm:col-span-3">
                                  <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                                    Modality
                                  </label>
                                  <select
                                    value={item.type || "video"}
                                    onChange={(e) => handleUpdateLesson(module.id, item.id, "type", e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high/70 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                                  >
                                    <option value="video">Video Lecture</option>
                                    <option value="reading">Reading / Monograph</option>
                                    <option value="notes">Study Notes</option>
                                    <option value="practice">Practice / Lab</option>
                                    <option value="quiz">Checkpoint Quiz</option>
                                  </select>
                                </div>

                                <div className="sm:col-span-2">
                                  <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                                    Duration (mins)
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={600}
                                    value={item.durationMinutes || 15}
                                    onChange={(e) => handleUpdateLesson(module.id, item.id, "durationMinutes", Math.max(1, Number(e.target.value)))}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high/70 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                </div>

                                <div className="sm:col-span-3">
                                  <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                                    Source Name
                                  </label>
                                  <input
                                    type="text"
                                    value={item.sourceName || ""}
                                    onChange={(e) => handleUpdateLesson(module.id, item.id, "sourceName", e.target.value)}
                                    placeholder="e.g. MIT OpenCourseWare"
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high/70 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                </div>

                                <div className="sm:col-span-4">
                                  <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                                    Resource URL
                                  </label>
                                  <input
                                    type="url"
                                    value={item.sourceUrl || item.url || ""}
                                    onChange={(e) => {
                                      handleUpdateLesson(module.id, item.id, "sourceUrl", e.target.value);
                                      handleUpdateLesson(module.id, item.id, "url", e.target.value);
                                    }}
                                    placeholder="https://..."
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high/70 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Add Resource to this Module Button */}
                        <button
                          type="button"
                          onClick={() => setActiveAddResourceModule({ id: module.id, title: module.title })}
                          className="w-full py-2.5 px-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center gap-2 transition-colors mt-2"
                        >
                          <span className="material-symbols-outlined text-sm">add_circle</span>
                          <span>Add Resource to {module.title}</span>
                        </button>
                      </div>
                    ) : (
                      /* Standard Viewing Mode Resources list */
                      displayResources.map((item: any, idx: number) => {
                        const isDone = completedLessonIds.includes(item.id);
                        const status = item.verificationStatus || item.status || "verified";

                        return (
                          <div
                            key={item.id || idx}
                            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                              isDone
                                ? "bg-surface-container-low/60 border border-surface-container-high/30 opacity-75"
                                : "bg-surface-container-low hover:bg-surface-container border border-surface-container-high/40"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Complete Checkbox */}
                              <button
                                type="button"
                                onClick={() => handleToggleLessonComplete(item.id)}
                                className="text-on-surface-variant hover:text-primary shrink-0 transition-colors"
                                title={isDone ? "Mark incomplete" : "Mark complete"}
                              >
                                <span
                                  className={`material-symbols-outlined text-xl ${
                                    isDone ? "text-primary font-bold" : "text-outline-variant"
                                  }`}
                                >
                                  {isDone ? "check_circle" : "radio_button_unchecked"}
                                </span>
                              </button>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap text-xs">
                                  <span className="font-mono font-semibold px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant">
                                    #{idx + 1}
                                  </span>

                                  {/* Status Badge */}
                                  <span
                                    className={`px-1.5 py-0.2 rounded font-semibold text-[11px] uppercase ${
                                      status === "verified"
                                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                        : status === "provisional"
                                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                                        : "bg-surface-container text-on-surface-variant border border-surface-container-high"
                                    }`}
                                  >
                                    {status}
                                  </span>

                                  {/* Source Repository Tag */}
                                  <span className="font-semibold text-primary/80 bg-primary/10 px-1.5 py-0.2 rounded">
                                    {item.sourceName || "Academic Repo"}
                                  </span>

                                  {/* Language tag */}
                                  {item.language && (
                                    <span className="font-mono text-xs px-1 rounded bg-surface-container text-on-surface-variant uppercase">
                                      {item.language}
                                    </span>
                                  )}

                                  {item.durationMinutes && (
                                    <span className="text-on-surface-variant">
                                      {item.durationMinutes}m
                                    </span>
                                  )}
                                </div>

                                <Link
                                  href={`/learn/${course.id}/${item.id}`}
                                  className={`font-label-lg text-label-lg truncate mt-0.5 block hover:underline ${
                                    isDone ? "line-through text-on-surface-variant" : "text-primary font-medium"
                                  }`}
                                >
                                  {item.title}
                                </Link>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 print:hidden">
                              <Link
                                href={`/learn/${course.id}/${item.id}`}
                                className="px-3 py-1 rounded text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container transition-colors flex items-center gap-1 shadow-xs"
                              >
                                <span>Study</span>
                                <span className="material-symbols-outlined text-xs">arrow_forward</span>
                              </Link>
                              {(item.url || item.sourceUrl) && (
                                <a
                                  href={item.url || item.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors"
                                  title="Open Original Source Repository"
                                >
                                  <span className="material-symbols-outlined text-base">open_in_new</span>
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add New Module Button in Edit Mode */}
          {isEditMode && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAddNewModule}
                className="w-full py-4 px-6 rounded-2xl border-2 border-dashed border-primary/40 bg-surface-container-lowest hover:bg-primary/5 text-primary font-semibold flex items-center justify-center gap-3 transition-all shadow-sm hover:border-primary group"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined text-xl">add_box</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-primary font-serif">Add New Module Pillar to Course</p>
                  <p className="text-xs text-on-surface-variant font-normal">Append a fresh syllabus unit with customized learning objectives</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 3. Checkpoint Quiz Runner Modal */}
      {activeQuizModule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-surface-container-high/60 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
              <div>
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                  Diagnostic Checkpoint
                </span>
                <h3 className="font-headline-md text-headline-md text-primary font-serif">
                  {activeQuizModule.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveQuizModule(null)}
                aria-label="Close Quiz"
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Questions View */}
            {activeQuizModule.checkpointQuestions && (
              <div className="py-4 space-y-6">
                {activeQuizModule.checkpointQuestions.map((q: any, qIdx: number) => {
                  const selected = quizAnswers[qIdx];
                  const correctIdx = typeof q.correctOptionIndex === 'number'
                    ? q.correctOptionIndex
                    : (q.correctOptionId ? (q.correctOptionId.charCodeAt(0) - 65) : 0);
                  const isCorrect = selected === correctIdx;
                  const questionPrompt = q.questionText || q.prompt || `Question ${qIdx + 1}`;
                  const optionsList = Array.isArray(q.options)
                    ? q.options.map((opt: any) => typeof opt === 'string' ? opt : (opt?.text || opt?.label || String(opt)))
                    : (q.optionsList || []);

                  return (
                    <div
                      key={q.id || qIdx}
                      className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40"
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-semibold text-on-surface-variant">Question {qIdx + 1}</span>
                        <span className="px-2 py-0.5 rounded font-medium bg-surface-container text-on-surface-variant capitalize">
                          {q.difficulty || "medium"}
                        </span>
                      </div>
                      <p className="font-semibold text-primary mb-3 text-sm">{questionPrompt}</p>

                      <div className="space-y-2">
                        {optionsList.map((opt: string, optIdx: number) => {
                          const isOptionSelected = selected === optIdx;
                          let optionClass = "bg-surface-container-lowest border-surface-container-high/60 text-on-surface";
                          if (quizSubmitted) {
                            if (optIdx === correctIdx) {
                              optionClass = "bg-emerald-500/15 border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-bold";
                            } else if (isOptionSelected) {
                              optionClass = "bg-rose-500/15 border-rose-500/50 text-rose-800 dark:text-rose-300 line-through";
                            }
                          } else if (isOptionSelected) {
                            optionClass = "bg-primary-container text-on-primary border-primary";
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleQuizOptionSelect(qIdx, optIdx)}
                              className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${optionClass}`}
                            >
                              <span>{opt}</span>
                              {quizSubmitted && optIdx === correctIdx && (
                                <span className="material-symbols-outlined text-sm text-emerald-600">check</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className="mt-3 p-2.5 rounded-lg bg-surface-container text-xs text-on-surface-variant border-l-2 border-primary">
                          <span className="font-semibold text-primary">Explanation: </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Score & Controls */}
                <div className="pt-2 flex items-center justify-between">
                  {quizSubmitted ? (
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-primary">
                        Score: {quizScore}%
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setQuizSubmitted(false);
                          setQuizAnswers({});
                          setQuizScore(null);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-surface-container-high/60 text-xs font-semibold text-primary hover:bg-surface-container"
                      >
                        Retake Quiz
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length === 0}
                      className="px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-sm ml-auto disabled:opacity-50"
                    >
                      Submit Assessment
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Spaced Flashcard Modal */}
      {activeFlashcardModule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-container-high/60">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Formula Flashcards ({activeFlashcardIdx + 1} of {activeFlashcardModule.flashcards?.length})
              </span>
              <button
                type="button"
                onClick={() => setActiveFlashcardModule(null)}
                aria-label="Close Flashcards"
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Flashcard Card Flip */}
            {activeFlashcardModule.flashcards?.[activeFlashcardIdx] && (
              <div className="py-6">
                {(() => {
                  const card = activeFlashcardModule.flashcards[activeFlashcardIdx];
                  return (
                    <div
                      onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
                      className="min-h-[200px] p-6 rounded-2xl bg-surface-container-low border border-surface-container-high/60 flex flex-col items-center justify-center text-center cursor-pointer shadow-inner transition-transform hover:scale-[1.01]"
                    >
                      {!isFlashcardFlipped ? (
                        <>
                          <span className="text-xs font-semibold text-secondary uppercase mb-2">Concept / Term</span>
                          <h4 className="text-lg font-bold text-primary font-serif mb-3">{card.concept}</h4>
                          <span className="text-xs text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">flip</span>
                            Click card to reveal formula
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase mb-2">Formula &amp; Law</span>
                          <div className="font-mono text-base font-bold text-primary bg-surface-container px-3 py-1.5 rounded-lg mb-3">
                            {card.formulaLatex}
                          </div>
                          <p className="text-xs text-on-surface-variant max-w-xs">{card.memoryHook}</p>
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* Navigation & Knowledge Toggle */}
                <div className="flex items-center justify-between mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFlashcardFlipped(false);
                      setActiveFlashcardIdx((prev) => Math.max(0, prev - 1));
                    }}
                    disabled={activeFlashcardIdx === 0}
                    className="px-3 py-1.5 rounded-lg border border-surface-container-high/60 text-xs font-semibold text-on-surface-variant disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsFlashcardFlipped(false);
                      setActiveFlashcardIdx((prev) =>
                        Math.min((activeFlashcardModule.flashcards?.length || 1) - 1, prev + 1)
                      );
                    }}
                    disabled={activeFlashcardIdx >= (activeFlashcardModule.flashcards?.length || 1) - 1}
                    className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold disabled:opacity-40"
                  >
                    Next Card
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {course && (
        <DeleteCourseModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          courseTitle={course.title}
          courseId={course.id}
          isDeleting={isDeleting}
        />
      )}

      {/* 5. Study Schedule & Calendar Export Modal */}
      {course && (
        <StudyScheduleModal
          course={course}
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
        />
      )}

      {/* 6. Add Custom Resource Modal */}
      {addResourceModuleId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddCustomResource}
            className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-container-high/70 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
              <h3 className="text-sm font-bold text-primary">Add Custom Resource to Module</h3>
              <button
                type="button"
                onClick={() => setAddResourceModuleId(null)}
                className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1">Resource Title</label>
              <input
                type="text"
                required
                value={newResourceTitle}
                onChange={(e) => setNewResourceTitle(e.target.value)}
                placeholder="e.g. My Notes on Vectors or Official Doc Link"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/70 text-xs text-on-surface"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1">Resource Type</label>
              <select
                value={newResourceType}
                onChange={(e) => setNewResourceType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/70 text-xs text-on-surface font-medium"
              >
                <option value="reading">Academic Reading / Documentation</option>
                <option value="video">Video Lecture URL</option>
                <option value="notes">Personal Study Notes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1">Resource URL (Optional)</label>
              <input
                type="url"
                value={newResourceUrl}
                onChange={(e) => setNewResourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/70 text-xs text-on-surface"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddResourceModuleId(null)}
                className="px-4 py-2 rounded-xl border border-surface-container-high text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-xs"
              >
                Add Resource
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Topic / Module Modal */}
      {isAddTopicModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <form
            onSubmit={handleAddTopic}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">add_circle</span>
                <h3 className="font-headline-sm text-headline-sm font-serif text-primary">
                  Append New Topic / Module
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTopicModalOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1">
                Module / Topic Title
              </label>
              <input
                type="text"
                required
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                placeholder="e.g. Fourier Transforms & Spectral Analysis"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/70 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1">
                Specific Learning Objective / Focus
              </label>
              <textarea
                rows={2}
                value={newTopicObjective}
                onChange={(e) => setNewTopicObjective(e.target.value)}
                placeholder="e.g. Master continuous vs discrete transforms, Euler's formula representation, and frequency decomposition."
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/70 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1">
                Estimated Workload (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={newTopicHours}
                onChange={(e) => setNewTopicHours(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/70 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low/60 border border-surface-container-high/40">
              <input
                id="auto-synth"
                type="checkbox"
                checked={autoSynthesizeTopic}
                onChange={(e) => setAutoSynthesizeTopic(e.target.checked)}
                className="rounded text-primary focus:ring-primary"
              />
              <label htmlFor="auto-synth" className="text-xs text-on-surface font-medium cursor-pointer">
                Automatically discover verified videos &amp; generate study notes
              </label>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddTopicModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-surface-container-high text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-xs"
              >
                Append Module
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 7. Floating Personal AI Tutor */}
      {course && (
        <PersonalAITutor
          courseTitle={course.title}
          moduleTitle={course.modules?.[0]?.title || "Course Overview"}
          lessonTitle={course.title}
        />
      )}

      {/* 8. Dedicated Course Editing Modals */}
      {activeNotesLesson && (
        <EditStudyNotesModal
          isOpen={!!activeNotesLesson}
          lesson={activeNotesLesson}
          onSave={handleSaveStudyNotes}
          onClose={() => setActiveNotesLesson(null)}
        />
      )}

      {activeAddResourceModule && course && (
        <AddResourceModal
          isOpen={!!activeAddResourceModule}
          moduleId={activeAddResourceModule.id}
          moduleTitle={activeAddResourceModule.title}
          courseTopic={course.title}
          onAddResource={handleAddResource}
          onClose={() => setActiveAddResourceModule(null)}
        />
      )}

      {/* 9. Accessible Confirmation Barrier Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      <Toast
        isOpen={isToastOpen}
        message={toastMessage}
        icon={toastIcon}
        onClose={() => setIsToastOpen(false)}
      />
    </div>
  );
}
