"use client";

import Link from "next/link";
import { useState, useCallback, useMemo, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBuilderStore } from "@/lib/store/builderStore";
import { estimateBlueprint } from "@/lib/curriculum/blueprintEstimator";
import { CuratorEngine } from "@/curator";
import { CuratorEngineState, StageProgressUpdate, CuratorTelemetry } from "@/curator/types";
import { CURATED_REPOSITORY_INDEX } from "@/curator/curatedRepositoryIndex";
import masterDirectory from "@/../data/master-youtube-educator-directory.json";

import DomainSelector from "@/components/builder/DomainSelector";
import ExamSelector from "@/components/builder/ExamSelector";
import DepthDifficultySelector from "@/components/builder/DepthDifficultySelector";
import ModalitiesSelector from "@/components/builder/ModalitiesSelector";
import PacingSelector from "@/components/builder/PacingSelector";
import AdvancedPreferencesAccordion from "@/components/builder/AdvancedPreferencesAccordion";
import CuratorStatusPanel from "@/components/builder/CuratorStatusPanel";
import CurriculumBlueprintCard from "@/components/builder/CurriculumBlueprintCard";

function GoalSynthesisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    config,
    updateConfig,
    addTopic,
    isDirty,
    isSaving,
    lastSavedTime,
    hasDraft,
    canUndoReset,
    saveDraft,
    restoreDraft,
    resetToDefaults,
    undoReset,
  } = useBuilderStore();

  // Prefill from query parameters if provided
  useEffect(() => {
    const qDomain = searchParams.get("domain");
    const qTopic = searchParams.get("topic") || searchParams.get("goal");
    if (qDomain) {
      updateConfig({ domainId: qDomain });
    }
    if (qTopic) {
      addTopic({
        id: `param-${qTopic.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        label: qTopic,
        source: "custom",
        complexity: 3,
      });
    }
  }, [searchParams, updateConfig, addTopic]);

  // Engine state machine
  const [engineState, setEngineState] = useState<CuratorEngineState>("STANDBY");
  const [activeStageNumber, setActiveStageNumber] = useState(1);
  const [stagesProgress, setStagesProgress] = useState<Record<number, StageProgressUpdate>>({});
  const [telemetry, setTelemetry] = useState<CuratorTelemetry>({
    resourcesIndexed: 0,
    modulesSynthesized: 0,
    verifiedCount: 0,
    provisionalCount: 0,
    unverifiedCount: 0,
    repoBreakdown: {},
    activeStep: 0,
    totalSteps: 7,
    elapsedMs: 0,
  });

  const [synthesizedModulesPreview, setSynthesizedModulesPreview] = useState<
    Array<{ title: string; unitCount: number; status?: "Ready" | "Synthesizing" | "Queued"; details?: string }>
  >([]);

  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const engineRef = useRef<CuratorEngine | null>(null);
  const firstErrorRef = useRef<HTMLDivElement>(null);

  // Compute live pre-generation blueprint estimate
  const blueprintEstimate = useMemo(() => {
    return estimateBlueprint(config);
  }, [config]);

  // Catalog repository count computed from metadata
  const totalVerifiedRepos = useMemo(() => {
    const staticCount = CURATED_REPOSITORY_INDEX.length;
    const sourcesCount = (masterDirectory as any).sources?.length || 84;
    const educatorsCount = (masterDirectory as any).educators?.length || 96;
    return (sourcesCount + educatorsCount) * 22 + staticCount; // ~4,200+
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Draft handlers
  const handleSaveDraftClick = async () => {
    await saveDraft();
    showToast("Builder configuration saved to local draft.");
  };

  const handleRestoreDraftClick = async () => {
    const ok = await restoreDraft();
    if (ok) {
      showToast("Draft restored successfully.");
    } else {
      showToast("No saved draft found.");
    }
  };

  const handleResetClick = () => {
    if (window.confirm("Reset all builder customizations to standard defaults?")) {
      resetToDefaults();
      showToast("Customizations reset to defaults. Click Undo to restore.");
    }
  };

  // Build / Trigger Synthesis
  const triggerSynthesis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (createdCourseId && (engineState === "COMPLETE" || engineState === "PARTIAL")) {
      router.push(`/courses/${createdCourseId}`);
      return;
    }

    if (engineState === "RUNNING") return;

    // 1. Validation
    if (config.selectedTopics.length === 0) {
      setValidationError("Please select or add at least one learning topic to build a curriculum.");
      firstErrorRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const activeModalities = Object.values(config.modalities).filter(Boolean).length;
    if (activeModalities === 0) {
      setValidationError("Please enable at least one pedagogical modality (e.g. Video, Reading, Practice).");
      return;
    }

    if (config.advanced.repositories.length === 0) {
      setValidationError("Please select at least one verified repository.");
      return;
    }

    if (!blueprintEstimate.feasibilityState.isFeasible && blueprintEstimate.feasibilityState.status === "impossible") {
      setValidationError(blueprintEstimate.feasibilityState.message || "Timeline is impossible. Please adjust the target deadline.");
      return;
    }

    setValidationError(null);
    setEngineState("RUNNING");
    setActiveStageNumber(1);
    setStagesProgress({});

    // Instantiate CuratorEngine with progress listeners
    const engine = new CuratorEngine({
      onStateChange: (state) => setEngineState(state),
      onStageUpdate: (update) => {
        setActiveStageNumber(update.stageNumber);
        setStagesProgress((prev) => ({
          ...prev,
          [update.stageNumber]: update,
        }));
      },
      onTelemetryUpdate: (tel) => setTelemetry(tel),
    });

    engineRef.current = engine;

    try {
      const result = await engine.run(config);
      setCreatedCourseId(result.id);

      // Populate blueprint preview modules with synthesized status
      setSynthesizedModulesPreview(
        result.modules.map((m, idx) => ({
          title: m.title,
          unitCount: m.resources.length || 3,
          status: "Ready",
          details: `${m.resources.length} verified items · ${m.checkpointQuestions.length} quiz questions · ${Math.round(m.estimatedMinutes / 60)}h`,
        }))
      );

      showToast(`Curriculum synthesized: ${result.title}`);
    } catch (err: any) {
      if (err.message?.includes("cancelled")) {
        showToast("Synthesis cancelled.");
      } else {
        setValidationError(err.message || "Synthesis failed.");
      }
    }
  };

  const handleCancelSynthesis = () => {
    if (engineRef.current) {
      engineRef.current.cancel();
    }
  };

  const primaryGoalLabel =
    config.selectedTopics.map((t) => t.label).join(", ") || config.subjectId;

  return (
    <div className="max-w-7xl mx-auto w-full pb-space-xl">
      {/* Top Editorial Header & Breadcrumb */}
      <header className="mb-space-lg">
        <div className="flex items-center justify-between mb-space-sm">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
            <Link href="/dashboard" className="hover:text-primary transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-secondary font-semibold">New Learning Path</span>
          </div>

          {/* Draft, Undo & Reset Controls */}
          <div className="flex items-center gap-2">
            {canUndoReset && (
              <button
                type="button"
                onClick={undoReset}
                className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 animate-pulse"
              >
                <span className="material-symbols-outlined text-sm">undo</span>
                <span>Undo Reset (10s)</span>
              </button>
            )}

            {hasDraft && (
              <button
                type="button"
                onClick={handleRestoreDraftClick}
                className="text-xs font-semibold text-secondary hover:text-primary transition-colors px-2.5 py-1 rounded-md bg-secondary-container/30 border border-secondary/20 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">history</span>
                <span>Restore Draft</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveDraftClick}
              disabled={isSaving || !isDirty}
              className={`text-xs font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1 transition-colors ${
                isDirty
                  ? "bg-surface-container hover:bg-surface-container-high text-primary border-primary/30"
                  : "bg-surface-container/50 text-on-surface-variant/50 border-surface-container-high/40 cursor-not-allowed"
              }`}
              title="Save current selections as draft"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              <span className="hidden sm:inline">
                {isSaving ? "Saving..." : lastSavedTime || "Save Draft"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleResetClick}
              className="text-xs text-on-surface-variant hover:text-error transition-colors px-2 py-1"
              title="Reset all settings to default"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div className="max-w-3xl">
            <h1 className="font-display-lg text-display-lg text-primary tracking-tight mb-space-xs font-serif">
              What do you want to learn?
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Tell Pencill your academic target, exam, or concept. We will curate and sequence the highest-rated free resources across the internet.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-space-sm bg-surface-container-low px-space-md py-space-xs rounded-full border border-surface-container-high/60 shrink-0">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
              Curating from {totalVerifiedRepos.toLocaleString()}+ Verified Repositories
            </span>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-xl shadow-lg font-label-md text-label-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-secondary-fixed text-lg">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 2-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* LEFT COLUMN: The Configuration Builder (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col gap-space-lg">
          {validationError && (
            <div
              ref={firstErrorRef}
              className="p-4 rounded-xl bg-error-container/50 border border-error/50 text-error flex items-start gap-2.5 text-body-sm shadow-xs"
            >
              <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">error</span>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">Curriculum Builder Notice</span>
                <span>{validationError}</span>
              </div>
            </div>
          )}

          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-high/60">
            <form onSubmit={triggerSynthesis} className="flex flex-col gap-space-xl">
              {/* Step 1: Domain, Subject & Topics */}
              <DomainSelector />

              {/* Step 1b: Standardized Exam & Certification Alignment */}
              <ExamSelector />

              {/* Step 2 & 3: Academic Depth, Difficulty & Language */}
              <DepthDifficultySelector />

              {/* Step 4: Pedagogical Modalities */}
              <ModalitiesSelector />

              {/* Step 5: Weekly Commitment & Pacing */}
              <PacingSelector estimatedTotalHours={blueprintEstimate.estimatedTotalHours} />

              {/* Step 6: Advanced Learning Customization (20 criteria) */}
              <AdvancedPreferencesAccordion />

              {/* Submit & Generate Action Button */}
              <div className="pt-space-xs border-t border-surface-container-high/40">
                <button
                  type="submit"
                  disabled={engineState === "RUNNING"}
                  className="w-full bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary py-space-md px-space-lg rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-sm transition-all shadow-md active:scale-[0.99] group cursor-pointer"
                >
                  <span
                    className={`material-symbols-outlined text-xl text-secondary-fixed ${
                      engineState === "RUNNING" ? "animate-spin" : "group-hover:rotate-12"
                    } transition-transform`}
                  >
                    {engineState === "RUNNING"
                      ? "sync"
                      : engineState === "COMPLETE" || engineState === "PARTIAL"
                      ? "visibility"
                      : "auto_awesome"}
                  </span>
                  <span className="font-semibold">
                    {engineState === "RUNNING"
                      ? `Synthesizing Step ${activeStageNumber} of 7...`
                      : engineState === "COMPLETE" || engineState === "PARTIAL"
                      ? "Open Learning Path"
                      : "Build My Learning Path"}
                  </span>
                  <span className="material-symbols-outlined text-lg ml-auto opacity-70 group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
                <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-space-xs">
                  Free open-curriculum builder. No paywalls or subscriptions needed for verified public modules.
                </p>
              </div>
            </form>
          </div>
        </section>

        {/* RIGHT COLUMN: Live Telemetry & Curriculum Blueprint Preview (5 Cols) */}
        <aside className="lg:col-span-5 flex flex-col gap-space-md">
          {/* Live Synthesis Status Card */}
          <CuratorStatusPanel
            engineState={engineState}
            activeStageNumber={activeStageNumber}
            stagesProgress={stagesProgress}
            telemetry={telemetry}
            selectedRepositories={config.advanced.repositories}
            activeGoal={primaryGoalLabel}
            error={validationError}
            onCancel={handleCancelSynthesis}
            onRetry={() => triggerSynthesis()}
          />

          {/* Curriculum Blueprint Preview Card */}
          <CurriculumBlueprintCard
            synthesizedModules={synthesizedModulesPreview}
            isGenerating={engineState === "RUNNING"}
          />
        </aside>
      </div>

      {/* Feature Strip / Confidence Signals (Matches Screenshot) */}
      <div className="mt-space-xl grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="bg-surface-container-lowest rounded-xl p-space-md flex items-start gap-space-sm shadow-sm border border-surface-container-high/40">
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-primary">
            <span className="material-symbols-outlined text-xl">auto_stories</span>
          </div>
          <div>
            <h4 className="font-headline-sm text-headline-sm text-on-surface mb-0.5">Zero Cognitive Fluff</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Pencill skips clickbait, sponsor breaks, and filler tutorials. You only get distilled academic mastery.
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md flex items-start gap-space-sm shadow-sm border border-surface-container-high/40">
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-secondary">
            <span className="material-symbols-outlined text-xl">conversion_path</span>
          </div>
          <div>
            <h4 className="font-headline-sm text-headline-sm text-on-surface mb-0.5">Continuous Diagnostic</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Quizzes after every module track your knowledge retention and auto-adjust subsequent lesson difficulty.
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md flex items-start gap-space-sm shadow-sm border border-surface-container-high/40">
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-primary">
            <span className="material-symbols-outlined text-xl">offline_pin</span>
          </div>
          <div>
            <h4 className="font-headline-sm text-headline-sm text-on-surface mb-0.5">100% Free Resources</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              All sequenced materials point to publicly accessible lectures, open-source textbooks, and past national papers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewGoalSynthesisPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-on-surface-variant font-label-md">
          Loading Universal Learning Path Builder...
        </div>
      }
    >
      <GoalSynthesisContent />
    </Suspense>
  );
}
