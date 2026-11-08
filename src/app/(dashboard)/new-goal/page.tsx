"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { storageAdapter } from "@/lib/storage/storageAdapter";
import { enrollUserInCourse } from "@/services/supabase/enrollmentService";
import {
  BuilderStoreProvider,
  useBuilderStore,
} from "@/lib/store/builderStore";
import StepProgressIndicator from "@/components/builder/StepProgressIndicator";
import Step1GoalDefinition from "@/components/builder/Step1GoalDefinition";
import Step2Personalize from "@/components/builder/Step2Personalize";
import Step3ReviewCurriculum from "@/components/builder/Step3ReviewCurriculum";
import CompactCuratorSidebar from "@/components/builder/CompactCuratorSidebar";
import type {
  LearnerGoalInput,
  EngineExecutionResult,
  EngineTelemetryStage,
  ResourceEngineTelemetry,
} from "@/lib/resource-engine/types";

function NewGoalPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, session } = useAuth();

  const {
    config,
    isDirty,
    isSaving,
    lastSavedTime,
    hasDraft,
    canUndoReset,
    addTopic,
    saveDraft,
    restoreDraft,
    resetToDefaults,
    undoReset,
  } = useBuilderStore();

  // 3-Step Wizard Navigation
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Generation & Engine State
  const [isGenerating, setIsGenerating] = useState(false);
  const [engineState, setEngineState] = useState<"STANDBY" | "RUNNING" | "COMPLETE" | "PARTIAL" | "FAILED">("STANDBY");
  const [activeStageStep, setActiveStageStep] = useState(1);
  const [stagesTelemetry, setStagesTelemetry] = useState<EngineTelemetryStage[]>([]);
  const [liveTelemetry, setLiveTelemetry] = useState<ResourceEngineTelemetry | null>(null);
  const [generationResult, setGenerationResult] = useState<EngineExecutionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [draftRestoredBanner, setDraftRestoredBanner] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Pre-fill from query params if present
  useEffect(() => {
    const qTopic = searchParams.get("topic") || searchParams.get("goal");
    if (qTopic && qTopic.trim()) {
      const clean = qTopic.trim();
      const exists = config.selectedTopics.some((t) => t.label.toLowerCase() === clean.toLowerCase());
      if (!exists) {
        addTopic({ label: clean, source: "popular", complexity: 3 });
      }
    }
  }, [searchParams, addTopic, config.selectedTopics]);

  // Handle Draft Restoration Action
  const handleRestoreDraftClick = async () => {
    const success = await restoreDraft();
    if (success) {
      setDraftRestoredBanner(true);
      setTimeout(() => setDraftRestoredBanner(false), 4000);
    }
  };

  // Step Validation Rule
  const canNavigateToStep = (targetStep: 1 | 2 | 3) => {
    const hasTopic = Boolean(config.selectedTopics[0]?.label?.trim() || config.title?.trim());
    if (targetStep === 1) return true;
    if (targetStep === 2) return hasTopic;
    if (targetStep === 3) return hasTopic;
    return false;
  };

  // Primary Course Creation Action (triggered in Step 3)
  const handleStartGeneration = async () => {
    const primaryTopic = config.selectedTopics.map((t) => t.label).join(", ") || config.title;

    if (!primaryTopic || !primaryTopic.trim()) {
      setErrorMsg("Please specify a topic for your curriculum before creating the course.");
      setCurrentStep(1);
      return;
    }

    const enabledModalitiesCount = Object.values(config.modalities).filter(Boolean).length;
    if (enabledModalitiesCount === 0) {
      setErrorMsg("At least one learning modality (videos, reading, practice, or quizzes) must be enabled.");
      setCurrentStep(2);
      return;
    }

    setIsGenerating(true);
    setEngineState("RUNNING");
    setErrorMsg(null);
    setGenerationResult(null);
    setActiveStageStep(1);
    setStagesTelemetry([]);

    const payload: LearnerGoalInput = {
      topic: primaryTopic.trim(),
      title: config.title || primaryTopic.trim(),
      domain: config.domainId,
      subject: config.subjectId,
      topics: config.selectedTopics.map((t) => t.label),
      subtopics: config.subtopics || [],
      learningObjectives: config.learningObjectives || [],
      prerequisites: config.prerequisites || [],
      knownConcepts: config.knownConcepts || [],
      difficultConcepts: config.difficultConcepts || [],
      excludedTopics: config.excludedTopics || [],
      level: config.depthLevelId.includes("competitive")
        ? "competitive_exam"
        : config.depthLevelId.includes("undergraduate")
        ? "undergraduate"
        : (config.difficulty as any) || "intermediate",
      learningGoal: config.examAlign.enabled ? "prepare_exam" : "understand_concepts",
      learningStyle: config.teachingStyle === "theory_first"
        ? "theory_focused"
        : config.teachingStyle === "practice_first"
        ? "practical_projects"
        : "balanced",
      teachingStyle: config.teachingStyle,
      customTeachingMix: config.customTeachingMix,
      difficultyPreference: config.difficultyPreference,
      weeklyStudyHours: config.weeklyHours,
      targetWeeks: Math.max(2, Math.min(24, Math.ceil(24 / Math.max(1, config.weeklyHours)))),
      language: config.languageSettings?.explanationLanguage || config.language || "English",
      explanationLanguage: config.languageSettings?.explanationLanguage,
      videoLanguage: config.languageSettings?.videoLanguage,
      readingLanguage: config.languageSettings?.readingLanguage,
      quizLanguage: config.languageSettings?.quizLanguage,
      targetExam: config.examAlign.enabled && config.examAlign.examName ? config.examAlign.examName : null,
      priorKnowledge: config.advanced.currentLevel,
      depth: config.depthLevelId.includes("foundation")
        ? "introductory"
        : config.depthLevelId.includes("competitive")
        ? "rigorous"
        : "comprehensive",
      modalities: {
        video: config.modalities.video,
        reading: config.modalities.reading,
        practice: config.modalities.practice,
        quizzes: config.modalities.diagnostic,
        flashcards: config.modalities.flashcards,
        projects: config.modalities.projects,
      },
      preferredEducators: config.educatorPreferences?.preferredEducatorIds || [],
      preferredRepositories: config.repositoryPreferences?.preferredRepositories || config.advanced.repositories,
      excludedRepositories: config.repositoryPreferences?.excludedRepositories || [],
      readingDepth: config.readingPreferences?.readingDepth || "detailed",
      questionsPerQuiz: config.assessmentPreferences?.questionsPerQuiz || 5,
      requireCaptions: config.videoPreferences?.requireCaptions || false,
      curriculumBlueprintOverrides: config.curriculumBlueprintOverrides || [],
    };

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const res = await fetch("/api/courses/generate?stream=true", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      if (!res.ok) {
        let errText = `Server error HTTP ${res.status}`;
        try {
          const json = await res.json();
          if (json.error) errText = json.error;
        } catch {}
        throw new Error(errText);
      }

      // Read SSE stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let finalResultData: EngineExecutionResult | null = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              try {
                const event = JSON.parse(trimmed.substring(6));
                if (event.type === "stage" && event.stage) {
                  setActiveStageStep(event.stage.stage);
                  setStagesTelemetry((prev) => {
                    const filtered = prev.filter((s) => s.stage !== event.stage.stage);
                    return [...filtered, event.stage].sort((a, b) => a.stage - b.stage);
                  });
                } else if (event.type === "telemetry" && event.telemetry) {
                  setLiveTelemetry(event.telemetry);
                  if (event.telemetry.stages) {
                    setStagesTelemetry(event.telemetry.stages);
                  }
                  if (event.telemetry.currentStage) {
                    setActiveStageStep(event.telemetry.currentStage);
                  }
                } else if (event.type === "complete" && event.data) {
                  finalResultData = event.data;
                } else if (event.type === "error") {
                  throw new Error(event.error || "Generation pipeline failed");
                }
              } catch (e: any) {
                if (e.message && e.message !== "Unexpected end of JSON input") {
                  throw e;
                }
              }
            }
          }
        }
      }

      // Fallback if not streamed but returned standard JSON
      if (!finalResultData) {
        try {
          const directJson = JSON.parse(buffer);
          if (directJson.data) finalResultData = directJson.data;
        } catch {}
      }

      if (!finalResultData) {
        throw new Error("Curriculum synthesis completed without returning valid course data.");
      }

      setGenerationResult(finalResultData);
      setActiveStageStep(11);
      setEngineState(finalResultData.coverage?.isComplete ? "COMPLETE" : "PARTIAL");
      setIsGenerating(false);

      // Dual-Persistence: Local Storage & IndexedDB Cache
      if (finalResultData.course) {
        await storageAdapter.savePath(finalResultData.course);
        try {
          localStorage.setItem(`pencill_path_${finalResultData.courseId}`, JSON.stringify(finalResultData.course));
        } catch {}
      }

      // Guest Checkpoint Quizzes Cache
      if (!user?.id && finalResultData.quizzes && Array.isArray(finalResultData.quizzes)) {
        try {
          const rawGuestQuizzes = localStorage.getItem("pencill_guest_quizzes");
          const existingGuest: any[] = rawGuestQuizzes ? JSON.parse(rawGuestQuizzes) : [];
          const existingIds = new Set(existingGuest.map((q: any) => q.id));
          for (const q of finalResultData.quizzes) {
            if (!existingIds.has(q.id)) {
              existingGuest.unshift(q);
              existingIds.add(q.id);
            }
          }
          localStorage.setItem("pencill_guest_quizzes", JSON.stringify(existingGuest.slice(0, 50)));
        } catch {}
      }

      // Enroll User in newly synthesized path
      await enrollUserInCourse(user?.id || null, finalResultData.courseId, { accessToken: session?.access_token });

      // Initialize Progress
      await storageAdapter.updateProgress(finalResultData.courseId, {
        completedLessonIds: [],
        hoursLogged: 0,
        lastAccessed: new Date().toISOString(),
      });

      // Navigate to course details
      router.push(`/courses/${finalResultData.courseId}`);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setEngineState("STANDBY");
        setIsGenerating(false);
        setErrorMsg("Curriculum synthesis was cancelled.");
        return;
      }
      setIsGenerating(false);
      setEngineState("FAILED");
      setErrorMsg(err.message || "Learning path generation failed. Please try again.");
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setEngineState("STANDBY");
  };

  const handleStartCourse = () => {
    if (generationResult?.courseId) {
      router.push(`/courses/${generationResult.courseId}`);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      <div className="max-w-7xl mx-auto w-full pb-space-2xl px-4 sm:px-6">
        {/* Top Editorial Header & Breadcrumb */}
        <header className="mb-space-md pt-2">
          <div className="flex items-center justify-between mb-space-xs flex-wrap gap-2">
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-xs uppercase tracking-wider font-semibold">
              <Link className="hover:text-primary transition-colors" href="/dashboard">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-secondary">Learning Path Builder</span>
            </div>

            {/* Draft Status & Reset Actions */}
            <div className="flex items-center gap-2">
              {lastSavedTime && (
                <span className="text-xs text-on-surface-variant font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{lastSavedTime}</span>
                </span>
              )}
              {isDirty && !isSaving && (
                <span className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-medium">
                  Unsaved changes
                </span>
              )}
              {isSaving && (
                <span className="text-[11px] text-primary bg-primary-fixed/30 px-2 py-0.5 rounded font-medium animate-pulse">
                  Saving draft...
                </span>
              )}
              <button
                type="button"
                onClick={saveDraft}
                disabled={isSaving}
                className="text-xs font-semibold px-2.5 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors flex items-center gap-1"
                title="Save configuration draft"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                <span>Save Draft</span>
              </button>
              <button
                type="button"
                onClick={resetToDefaults}
                className="text-xs font-medium px-2 py-1 rounded-md text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors"
                title="Reset to defaults"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Heading Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mt-2">
            <div className="max-w-2xl">
              <h1 className="font-display-lg text-display-lg text-primary tracking-tight font-serif">
                What do you want to learn?
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed">
                Describe your target topic or goal. Pencill AI will intelligently sequence verified lectures, reading monographs, and formative checkpoints.
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-2 bg-surface-container-low px-3.5 py-1.5 rounded-full border border-surface-container-high/60 shrink-0">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="font-label-sm text-xs text-on-surface-variant font-medium">
                4,200+ Verified Academic Repositories
              </span>
            </div>
          </div>
        </header>

        {/* Undo Reset Notification */}
        {canUndoReset && (
          <div className="mb-space-md p-space-sm bg-surface-container-highest border border-outline-variant rounded-xl flex items-center justify-between shadow-md animate-fadeIn text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">restore</span>
              <span>Configuration was reset to defaults.</span>
            </div>
            <button
              type="button"
              onClick={undoReset}
              className="px-3 py-1 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-xs"
            >
              Undo Reset (10s)
            </button>
          </div>
        )}

        {/* Unfinished Draft Recovery Prompt */}
        {hasDraft && !draftRestoredBanner && (
          <div className="mb-space-md p-space-sm bg-secondary-container/30 border border-secondary/30 rounded-xl flex items-center justify-between shadow-xs animate-fadeIn text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-base">history</span>
              <span>An unfinished learning path draft was detected in local storage.</span>
            </div>
            <button
              type="button"
              onClick={handleRestoreDraftClick}
              className="px-3 py-1 bg-secondary text-on-secondary font-semibold rounded-lg hover:bg-secondary/90 transition-colors"
            >
              Restore Draft
            </button>
          </div>
        )}

        {/* Draft Restored Banner */}
        {draftRestoredBanner && (
          <div className="mb-space-md p-space-sm bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-fadeIn">
            <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
            <span>Draft restored successfully from local storage.</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-space-md p-space-md bg-error-container/40 border border-error/20 rounded-xl text-error text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              <span className="font-medium">{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-xs font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* LEFT COLUMN: 3-Step Wizard Container (7-8 Cols) */}
          <section className="lg:col-span-8 flex flex-col">
            {/* Step Progress Stepper Bar */}
            <StepProgressIndicator
              currentStep={currentStep}
              onSelectStep={(step) => setCurrentStep(step)}
              canNavigateToStep={canNavigateToStep}
            />

            {/* Active Step Content Container */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high/60">
              {currentStep === 1 && (
                <Step1GoalDefinition
                  onContinue={() => setCurrentStep(2)}
                />
              )}

              {currentStep === 2 && (
                <Step2Personalize
                  onBack={() => setCurrentStep(1)}
                  onPreview={() => setCurrentStep(3)}
                />
              )}

              {currentStep === 3 && (
                <Step3ReviewCurriculum
                  onBack={() => setCurrentStep(2)}
                  onCreateCourse={handleStartGeneration}
                  isGenerating={isGenerating}
                />
              )}
            </div>
          </section>

          {/* RIGHT COLUMN: Compact AI Learning Assistant & Preview (4-5 Cols) */}
          <aside className="lg:col-span-4 flex flex-col">
            <CompactCuratorSidebar
              currentStep={currentStep}
              engineState={engineState}
              activeStageNumber={activeStageStep}
              generationResult={generationResult}
              isGenerating={isGenerating}
              onCancel={isGenerating ? handleCancelGeneration : undefined}
              onStartCourse={generationResult?.courseId ? handleStartCourse : undefined}
            />
          </aside>
        </div>

        {/* Bottom Feature Assurance Strip */}
        <div className="mt-space-xl grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="bg-surface-container-lowest rounded-xl p-space-md flex items-start gap-3 shadow-2xs border border-surface-container-high/60">
            <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-primary">
              <span className="material-symbols-outlined text-lg">auto_stories</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-xs font-bold text-on-surface mb-0.5 font-serif">
                Zero Cognitive Fluff
              </h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Pencill skips clickbait and filler tutorials. Only verified lectures and structured academic monographs.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md flex items-start gap-3 shadow-2xs border border-surface-container-high/60">
            <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-secondary">
              <span className="material-symbols-outlined text-lg">quiz</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-xs font-bold text-on-surface mb-0.5 font-serif">
                Continuous Diagnostics
              </h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Formative checkpoint quizzes verify retention with clear explanations and balanced answer keys.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md flex items-start gap-3 shadow-2xs border border-surface-container-high/60">
            <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-primary">
              <span className="material-symbols-outlined text-lg">verified</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-xs font-bold text-on-surface mb-0.5 font-serif">
                Accredited Repositories
              </h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Resources are indexed from accredited university faculty channels and open-access repositories.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewGoalPage() {
  return (
    <AuthGuard>
      <BuilderStoreProvider>
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto py-12 px-6 animate-pulse space-y-6">
              <div className="h-20 bg-surface-container-lowest rounded-xl border border-surface-container-high/60" />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 h-96 bg-surface-container-lowest rounded-xl border border-surface-container-high/60" />
                <div className="lg:col-span-4 h-96 bg-surface-container-lowest rounded-xl border border-surface-container-high/60" />
              </div>
            </div>
          }
        >
          <NewGoalPageContent />
        </Suspense>
      </BuilderStoreProvider>
    </AuthGuard>
  );
}
