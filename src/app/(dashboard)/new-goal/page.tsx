"use client";

import { useState, useEffect, useMemo, Suspense, useRef } from "react";
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
import DomainSelector from "@/components/builder/DomainSelector";
import LearningObjectivesBuilder from "@/components/builder/LearningObjectivesBuilder";
import DepthDifficultySelector from "@/components/builder/DepthDifficultySelector";
import ExamSelector from "@/components/builder/ExamSelector";
import TeachingStyleSelector from "@/components/builder/TeachingStyleSelector";
import ModalitiesSelector from "@/components/builder/ModalitiesSelector";
import EducatorsSourcesSelector from "@/components/builder/EducatorsSourcesSelector";
import LanguageAccessibilitySelector from "@/components/builder/LanguageAccessibilitySelector";
import PacingSelector from "@/components/builder/PacingSelector";
import AdvancedPreferencesAccordion from "@/components/builder/AdvancedPreferencesAccordion";
import CurriculumBlueprintCard from "@/components/builder/CurriculumBlueprintCard";
import CuratorStatusPanel from "@/components/builder/CuratorStatusPanel";
import ResourceCoverageMatrix from "@/components/builder/ResourceCoverageMatrix";
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
    toggleEducatorPreference,
    saveDraft,
    restoreDraft,
    resetToDefaults,
    undoReset,
  } = useBuilderStore();

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
  }, [searchParams, addTopic, toggleEducatorPreference, config.selectedTopics, config.educatorPreferences]);

  // Handle Draft Restoration Action
  const handleRestoreDraftClick = async () => {
    const success = await restoreDraft();
    if (success) {
      setDraftRestoredBanner(true);
      setTimeout(() => setDraftRestoredBanner(false), 4000);
    }
  };

  // Primary Generation Action
  const handleStartGeneration = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (config.selectedTopics.length === 0) {
      setErrorMsg("Please select or enter at least one topic for your curriculum.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const enabledModalitiesCount = Object.values(config.modalities).filter(Boolean).length;
    if (enabledModalitiesCount === 0) {
      setErrorMsg("At least one learning modality (videos, reading, practice, or quizzes) must be enabled.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsGenerating(true);
    setEngineState("RUNNING");
    setErrorMsg(null);
    setGenerationResult(null);
    setActiveStageStep(1);
    setStagesTelemetry([]);

    const primaryTopic = config.selectedTopics.map((t) => t.label).join(", ");

    const payload: LearnerGoalInput = {
      topic: primaryTopic,
      title: config.title || config.selectedTopics[0]?.label || "Custom Learning Path",
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
      // Connect to SSE streaming endpoint
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

      // Checkpoint Quizzes Persistence into guest cache
      if (finalResultData.quizzes && Array.isArray(finalResultData.quizzes)) {
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

      // Enroll User in active course
      await enrollUserInCourse(user?.id || null, finalResultData.courseId, { accessToken: session?.access_token });

      // Initialize Progress
      await storageAdapter.updateProgress(finalResultData.courseId, {
        completedLessonIds: [],
        hoursLogged: 0,
        lastAccessed: new Date().toISOString(),
      });
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
        <header className="mb-space-lg pt-2">
          <div className="flex items-center justify-between mb-space-sm flex-wrap gap-2">
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md uppercase tracking-wider font-semibold">
              <Link className="hover:text-primary transition-colors" href="/dashboard">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-secondary">New Learning Path 2.0</span>
            </div>

            {/* Persistent State Bar & Draft Actions */}
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
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
            <div className="max-w-3xl">
              <h1 className="font-display-lg text-display-lg text-primary tracking-tight mb-space-xs font-serif">
                What do you want to learn?
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                Define your academic target, examination syllabus, or concept. Pencill dynamically discovers, sequences, and assesses the highest-yield open educational resources.
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-space-sm bg-surface-container-low px-space-md py-space-xs rounded-full border border-surface-container-high/60 shrink-0">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Curating from 4,200+ Verified Academic Repositories
              </span>
            </div>
          </div>
        </header>

        {/* Undo Reset Toast */}
        {canUndoReset && (
          <div className="mb-space-md p-space-sm bg-surface-container-highest border border-outline-variant rounded-xl flex items-center justify-between shadow-md animate-fadeIn text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">restore</span>
              <span>Builder configuration was reset to defaults.</span>
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
              <span>An unfinished learning path configuration draft was detected in local storage.</span>
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
          <div className="mb-space-lg p-space-md bg-error-container/40 border border-error/20 rounded-xl text-error text-body-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">error</span>
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="font-label-sm text-label-sm text-error font-semibold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 2-Column Split Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* LEFT COLUMN: The Configuration Builder (7 Cols) */}
          <section className="lg:col-span-7 flex flex-col gap-space-lg">
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-high/60">
              <form
                className="flex flex-col gap-space-xl"
                id="path-builder-form"
                onSubmit={handleStartGeneration}
              >
                {/* 1. Domain, Subject & Multi-Topic Taxonomy */}
                <DomainSelector />

                {/* 2. Specific Learning Objectives & Outcome Builder */}
                <LearningObjectivesBuilder />

                {/* 3. Target Depth & Difficulty Preference */}
                <DepthDifficultySelector />

                {/* 4. Examination Alignment */}
                <ExamSelector />

                {/* 5. Teaching Style & Pedagogical Balance */}
                <TeachingStyleSelector />

                {/* 6. Complete Resource Modality Selector */}
                <ModalitiesSelector />

                {/* 7. Preferred Educators & Institutional Sources */}
                <EducatorsSourcesSelector />

                {/* 8. Granular Language & Accessibility Settings */}
                <LanguageAccessibilitySelector />

                {/* 9. Study Schedule & Pacing Controls */}
                <PacingSelector estimatedTotalHours={23} />

                {/* 10. Collapsible Advanced Preferences */}
                <AdvancedPreferencesAccordion />

                {/* Main Submit Action */}
                <div className="pt-space-md border-t border-surface-container-high flex flex-col gap-2">
                  <button
                    className="w-full bg-primary hover:bg-primary-container text-on-primary py-space-md px-space-lg rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-sm transition-all shadow-md active:scale-[0.99] group disabled:opacity-50"
                    disabled={isGenerating}
                    type="submit"
                  >
                    <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform text-secondary-fixed">
                      auto_awesome
                    </span>
                    <span>
                      {isGenerating ? "Synthesizing Verified Learning Path..." : "Build My Learning Path"}
                    </span>
                    <span className="material-symbols-outlined text-lg ml-auto opacity-70 group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </button>

                  <p className="text-center font-label-sm text-label-sm text-on-surface-variant">
                    Pencill verifies canonical URLs, transcript alignment, and question validity before delivery.
                  </p>
                </div>
              </form>
            </div>
          </section>

          {/* RIGHT COLUMN: Live Curator Engine, Blueprint & Coverage Matrix (5 Cols) */}
          <aside className="lg:col-span-5 flex flex-col gap-space-md lg:sticky lg:top-4">
            {/* 1. Curator Engine Execution Panel */}
            <CuratorStatusPanel
              engineState={engineState}
              activeStageNumber={activeStageStep}
              stagesTelemetry={stagesTelemetry}
              telemetry={liveTelemetry || generationResult?.telemetry}
              activeGoal={config.title || config.selectedTopics.map((t) => t.label).join(", ")}
              error={errorMsg}
              onCancel={isGenerating ? handleCancelGeneration : undefined}
              onRetry={engineState === "FAILED" ? () => handleStartGeneration() : undefined}
            />

            {/* 2. Interactive Curriculum Blueprint */}
            <CurriculumBlueprintCard
              generationResult={generationResult}
              isGenerating={isGenerating}
            />

            {/* 3. Resource Coverage Matrix */}
            <ResourceCoverageMatrix
              generationResult={generationResult}
              isGenerating={isGenerating}
            />

            {/* Course Ready CTA Banner when Generation Succeeds */}
            {generationResult && (
              <div className="p-space-md bg-secondary-container/40 border border-secondary/40 rounded-xl flex flex-col gap-2 shadow-sm animate-fadeIn">
                <div className="flex items-center gap-2 text-secondary font-bold text-sm">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span>Learning Path Successfully Created!</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Your customized pathway with verified lectures, structured reading notes, and formative checkpoint quizzes is ready.
                </p>
                <button
                  type="button"
                  onClick={handleStartCourse}
                  className="w-full bg-primary text-on-primary hover:bg-primary/90 py-2.5 px-space-md rounded-lg font-label-md text-label-md font-semibold flex items-center justify-center gap-2 shadow-xs transition-all mt-1"
                >
                  <span>Start Learning This Path</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            )}
          </aside>
        </div>

        {/* Feature Signals Strip */}
        <div className="mt-space-xl grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="bg-surface-container-lowest rounded-xl p-space-md flex items-start gap-space-sm shadow-sm border border-surface-container-high/60">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-primary">
              <span className="material-symbols-outlined text-xl">auto_stories</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-0.5 font-serif">
                Zero Cognitive Fluff
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Pencill skips clickbait, filler tutorials, and sponsor breaks. You only receive verified academic mastery.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md flex items-start gap-space-sm shadow-sm border border-surface-container-high/60">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-secondary">
              <span className="material-symbols-outlined text-xl">quiz</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-0.5 font-serif">
                Continuous Diagnostics
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Formative checkpoint quizzes after every module verify retention with explanations and balanced keys.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md flex items-start gap-space-sm shadow-sm border border-surface-container-high/60">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-primary">
              <span className="material-symbols-outlined text-xl">verified</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-0.5 font-serif">
                Verified Repositories
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Every resource is indexed from accredited universities, faculty channels, and verified open educational databases.
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
                <div className="lg:col-span-7 h-96 bg-surface-container-lowest rounded-xl border border-surface-container-high/60" />
                <div className="lg:col-span-5 h-96 bg-surface-container-lowest rounded-xl border border-surface-container-high/60" />
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
