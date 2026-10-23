"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createFullLearningPath } from "@/services/supabase/pathService";
import {
  LearningPathConfig,
  DEFAULT_BUILDER_CONFIG,
  TargetDepthLevel,
  LearnerDifficulty,
  PacingStrategy,
  TargetExamConfig,
  BuilderModalities,
  AdvancedLearningPreferences,
} from "@/lib/types/builder";
import { estimateCurriculumBlueprint } from "@/lib/curriculum/blueprintEstimator";
import DomainSelector from "@/components/builder/DomainSelector";
import ExamSelector from "@/components/builder/ExamSelector";
import DepthDifficultySelector from "@/components/builder/DepthDifficultySelector";
import ModalitiesSelector from "@/components/builder/ModalitiesSelector";
import PacingSelector from "@/components/builder/PacingSelector";
import AdvancedPreferencesAccordion from "@/components/builder/AdvancedPreferencesAccordion";
import CuratorStatusPanel from "@/components/builder/CuratorStatusPanel";
import CurriculumBlueprintCard from "@/components/builder/CurriculumBlueprintCard";

const DRAFT_STORAGE_KEY = "pencill_builder_draft";

function GoalSynthesisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Active Builder Configuration
  const [config, setConfig] = useState<LearningPathConfig>(() => {
    return { ...DEFAULT_BUILDER_CONFIG };
  });

  // UI & Pipeline State
  const [synthesisActive, setSynthesisActive] = useState(false);
  const [synthesisStage, setSynthesisStage] = useState(1);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  // Telemetry Metrics
  const [discoveredCount, setDiscoveredCount] = useState(0);
  const [synthesizedModules, setSynthesizedModules] = useState<
    Array<{ title: string; unitCount: number }>
  >([]);

  // Check URL query parameters and local draft on initial mount
  useEffect(() => {
    // 1. Check if draft exists in localStorage
    if (typeof window !== "undefined") {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          setHasDraft(true);
        }
      } catch {}
    }

    // 2. Read URL params
    const qGoal = searchParams.get("goal") || searchParams.get("topic");
    const qDomain = searchParams.get("domain");
    const qLevel = searchParams.get("level") as TargetDepthLevel | null;

    if (qGoal || qDomain || qLevel) {
      setConfig((prev) => ({
        ...prev,
        topics: qGoal ? [qGoal] : prev.topics,
        domainName: qDomain || prev.domainName,
        depthLevel: qLevel || prev.depthLevel,
      }));
    }
  }, [searchParams]);

  // Compute live pre-generation blueprint estimate
  const blueprintEstimate = useMemo(() => {
    return estimateCurriculumBlueprint(config);
  }, [config]);

  // Draft Management Handlers
  const handleSaveDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(config));
      setHasDraft(true);
      setToastMsg("Customization saved to local draft.");
      setTimeout(() => setToastMsg(null), 3000);
    } catch (e) {
      console.warn("Failed to save draft:", e);
    }
  }, [config]);

  const handleRestoreDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as LearningPathConfig;
        setConfig(parsed);
        setToastMsg("Draft restored successfully.");
        setTimeout(() => setToastMsg(null), 3000);
      }
    } catch (e) {
      console.warn("Failed to restore draft:", e);
    }
  }, []);

  const handleReset = useCallback(() => {
    if (window.confirm("Reset all builder customizations to default?")) {
      setConfig({ ...DEFAULT_BUILDER_CONFIG });
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
          setHasDraft(false);
        } catch {}
      }
      setToastMsg("Customizations reset to standard defaults.");
      setTimeout(() => setToastMsg(null), 3000);
    }
  }, []);

  // Update configuration helpers
  const handleDomainChange = (domainId: string, domainName: string) => {
    setConfig((prev) => ({ ...prev, domainId, domainName }));
  };

  const handleSubjectChange = (subject: string) => {
    setConfig((prev) => ({ ...prev, subject }));
  };

  const handleTopicsChange = (topics: string[]) => {
    setConfig((prev) => ({ ...prev, topics }));
  };

  const handleTargetExamChange = (targetExam: TargetExamConfig | null) => {
    setConfig((prev) => ({ ...prev, targetExam }));
  };

  const handleDepthLevelChange = (depthLevel: TargetDepthLevel) => {
    setConfig((prev) => ({ ...prev, depthLevel }));
  };

  const handleDifficultyChange = (difficulty: LearnerDifficulty) => {
    setConfig((prev) => ({ ...prev, difficulty }));
  };

  const handleLanguageChange = (instructionLanguage: string) => {
    setConfig((prev) => ({ ...prev, instructionLanguage }));
  };

  const handlePreserveTechnicalTermsChange = (preserveTechnicalTerms: boolean) => {
    setConfig((prev) => ({ ...prev, preserveTechnicalTerms }));
  };

  const handleModalitiesChange = (modalities: BuilderModalities) => {
    setConfig((prev) => ({ ...prev, modalities }));
  };

  const handleWeeklyHoursChange = (weeklyHours: number) => {
    setConfig((prev) => ({ ...prev, weeklyHours }));
  };

  const handlePacingStrategyChange = (pacingStrategy: PacingStrategy) => {
    setConfig((prev) => ({ ...prev, pacingStrategy }));
  };

  const handleTargetCompletionDateChange = (targetCompletionDate: string) => {
    setConfig((prev) => ({ ...prev, targetCompletionDate }));
  };

  const handlePreferencesChange = (advancedPreferences: AdvancedLearningPreferences) => {
    setConfig((prev) => ({ ...prev, advancedPreferences }));
  };

  // Main Curriculum Generation Trigger
  const triggerSynthesis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Guard against concurrent / duplicate submissions
    if (synthesisActive) return;

    // 1. Validation
    const effectiveTopics = config.topics.filter(Boolean);
    if (effectiveTopics.length === 0 && !config.subject.trim()) {
      setErrorMsg("Please specify at least one learning topic, subject, or academic target.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const activeModalities = Object.entries(config.modalities)
      .filter(([, active]) => active)
      .map(([k]) => k);

    if (activeModalities.length === 0) {
      setErrorMsg("Please select at least one learning modality (e.g. Video Lectures, Reading Notes).");
      return;
    }

    // 2. Authentication check
    if (!user) {
      handleSaveDraft();
      const redirectTopic = effectiveTopics[0] || config.subject;
      router.push(`/login?redirectTo=${encodeURIComponent("/new-goal?goal=" + encodeURIComponent(redirectTopic))}`);
      return;
    }

    setErrorMsg(null);
    setSynthesisActive(true);
    setSynthesisStage(1);
    setStatusMessage("Validating prerequisites & querying curriculum intelligence engine...");

    try {
      setSynthesisStage(2);
      setStatusMessage("Synthesizing modular syllabus and querying verified repositories...");

      // Execute discovery request
      const primaryQuery = effectiveTopics.length > 0 ? effectiveTopics.join(" · ") : config.subject;

      const res = await fetch("/api/resources/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: primaryQuery,
          domain: config.domainName,
          subject: config.subject,
          topics: config.topics,
          targetExam: config.targetExam,
          depthLevel: config.depthLevel,
          customDepthLevel: config.customDepthLevel,
          difficulty: config.difficulty,
          instructionLanguage: config.instructionLanguage,
          explanationLanguage: config.explanationLanguage,
          resourceLanguage: config.resourceLanguage,
          quizLanguage: config.quizLanguage,
          bilingualExplanations: config.bilingualExplanations,
          preserveTechnicalTerms: config.preserveTechnicalTerms,
          modalities: activeModalities,
          weeklyHours: config.weeklyHours,
          pacingStrategy: config.pacingStrategy,
          targetCompletionDate: config.targetCompletionDate,
          advancedPreferences: config.advancedPreferences,
          generateLearningPath: true,
        }),
      });

      // Milestone 3: Received response from backend
      setSynthesisStage(3);
      setStatusMessage("Curriculum received. Verifying module structure and academic scope...");

      const data = await res.json();
      if (!res.ok || !data.success || !data.learningPath) {
        throw new Error(data.error || "Failed to synthesize curriculum. Please try again.");
      }

      const pathData = data.learningPath;
      const discovered = data.discoveredResources || [];
      setDiscoveredCount(discovered.length);

      // Milestone 4: Discovered resources mapped
      setSynthesisStage(4);
      setStatusMessage(`Auditing ${discovered.length} verified resources from NPTEL, NCERT & MIT OCW...`);

      // Update synthesized modules preview
      if (pathData.modules && Array.isArray(pathData.modules)) {
        setSynthesizedModules(
          pathData.modules.map((m: { title: string; lessons?: unknown[] }) => ({
            title: m.title,
            unitCount: m.lessons?.length || 3,
          }))
        );
      }

      // Milestone 5: Verification & quality audit
      setSynthesisStage(5);
      setStatusMessage("Auditing resource quality, difficulty alignment, and exam grounding...");

      // Milestone 6: Checkpoints and formula deck formulation
      setSynthesisStage(6);
      setStatusMessage("Compiling diagnostic checkpoints, practice sets and formula decks...");

      // Milestone 7: Persistence and enrollment
      setSynthesisStage(7);
      setStatusMessage("Persisting verified learning path & enrolling learner in course...");

      const createdPathId = await createFullLearningPath(
        pathData,
        user.id,
        discovered
      );

      if (!createdPathId) {
        throw new Error("Unable to save generated curriculum to course database.");
      }

      // Clean up draft on successful creation
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch {}
      }

      // Redirect directly to the newly synthesized course
      router.push(`/courses/${createdPathId}`);
    } catch (err: unknown) {
      console.error("[UniversalLearningPathBuilder] Synthesis error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Curriculum synthesis failed. Please try again.");
      setSynthesisActive(false);
      setSynthesisStage(1);
      setStatusMessage("");
    }
  };

  const primaryGoalLabel = config.topics.length > 0 ? config.topics.join(", ") : config.subject;

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
            <span className="text-secondary font-semibold">Universal Learning Path Builder</span>
          </div>

          {/* Draft & Reset Controls */}
          <div className="flex items-center gap-2">
            {hasDraft && (
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="text-xs font-semibold text-secondary hover:text-primary transition-colors px-2.5 py-1 rounded-md bg-secondary-container/30 border border-secondary/20 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">history</span>
                <span>Restore Draft</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveDraft}
              className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors px-2.5 py-1 rounded-md bg-surface-container hover:bg-surface-container-high border border-surface-container-high flex items-center gap-1"
              title="Save current selections as draft"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              <span className="hidden sm:inline">Save Draft</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
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
              What do you want to master?
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Design an intelligent, topic-adaptive curriculum tailored to your exact academic domain, standardized exam syllabus, technical depth, and weekly study schedule.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-space-sm bg-surface-container-low px-space-md py-space-xs rounded-full border border-surface-container-high/60 shrink-0">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
              Curating from 4,200+ Verified Repositories
            </span>
          </div>
        </div>
      </header>

      {/* Toast Notification if any */}
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
          {errorMsg && (
            <div className="p-4 rounded-xl bg-error-container/40 border border-error/40 text-error flex items-start gap-2.5 text-body-sm shadow-xs">
              <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">error</span>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">Curriculum Builder Notice</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-high/60">
            <form onSubmit={triggerSynthesis} className="flex flex-col gap-space-xl">
              {/* Step 1: Universal Domain & Topics Selector */}
              <DomainSelector
                selectedDomainId={config.domainId}
                selectedSubject={config.subject}
                topics={config.topics}
                onDomainChange={handleDomainChange}
                onSubjectChange={handleSubjectChange}
                onTopicsChange={handleTopicsChange}
              />

              {/* Step 1b: Universal Exam & Certification Selector */}
              <ExamSelector
                targetExam={config.targetExam || null}
                onTargetExamChange={handleTargetExamChange}
              />

              {/* Step 2 & 3: Academic Depth, Difficulty & Language */}
              <DepthDifficultySelector
                depthLevel={config.depthLevel}
                customDepthLevel={config.customDepthLevel}
                difficulty={config.difficulty}
                instructionLanguage={config.instructionLanguage}
                explanationLanguage={config.explanationLanguage}
                resourceLanguage={config.resourceLanguage}
                quizLanguage={config.quizLanguage}
                bilingualExplanations={config.bilingualExplanations}
                preserveTechnicalTerms={config.preserveTechnicalTerms}
                onDepthLevelChange={handleDepthLevelChange}
                onCustomDepthLevelChange={(customDepthLevel) => setConfig((prev) => ({ ...prev, customDepthLevel }))}
                onDifficultyChange={handleDifficultyChange}
                onLanguageChange={handleLanguageChange}
                onExplanationLanguageChange={(explanationLanguage) => setConfig((prev) => ({ ...prev, explanationLanguage }))}
                onResourceLanguageChange={(resourceLanguage) => setConfig((prev) => ({ ...prev, resourceLanguage }))}
                onQuizLanguageChange={(quizLanguage) => setConfig((prev) => ({ ...prev, quizLanguage }))}
                onBilingualExplanationsChange={(bilingualExplanations) => setConfig((prev) => ({ ...prev, bilingualExplanations }))}
                onPreserveTechnicalTermsChange={handlePreserveTechnicalTermsChange}
              />

              {/* Step 4: Pedagogical Modalities */}
              <ModalitiesSelector
                modalities={config.modalities}
                domainId={config.domainId}
                hasExamTarget={Boolean(config.targetExam)}
                onModalitiesChange={handleModalitiesChange}
              />

              {/* Step 5: Weekly Commitment & Pacing */}
              <PacingSelector
                weeklyHours={config.weeklyHours}
                pacingStrategy={config.pacingStrategy}
                targetCompletionDate={config.targetCompletionDate}
                feasibilityWarning={blueprintEstimate.scheduleFeasibility.conflictWarning}
                suggestedWeeklyHours={blueprintEstimate.scheduleFeasibility.suggestedWeeklyHours}
                onWeeklyHoursChange={handleWeeklyHoursChange}
                onPacingStrategyChange={handlePacingStrategyChange}
                onTargetCompletionDateChange={handleTargetCompletionDateChange}
              />

              {/* Step 6: Advanced Learning Preferences (Expandable) */}
              <AdvancedPreferencesAccordion
                preferences={config.advancedPreferences}
                onPreferencesChange={handlePreferencesChange}
              />

              {/* Submit & Generate Action */}
              <div className="pt-space-xs border-t border-surface-container-high/40">
                <button
                  type="submit"
                  disabled={synthesisActive}
                  className="w-full bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary py-space-md px-space-lg rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-sm transition-all shadow-md active:scale-[0.99] group cursor-pointer"
                >
                  <span className={`material-symbols-outlined text-xl text-secondary-fixed ${synthesisActive ? "animate-spin" : "group-hover:rotate-12"} transition-transform`}>
                    {synthesisActive ? "sync" : "auto_awesome"}
                  </span>
                  <span className="font-semibold">
                    {synthesisActive ? "Synthesizing Topic-Adaptive Pathway..." : "Build My Learning Path"}
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
            isActive={synthesisActive}
            currentStep={synthesisStage}
            totalSteps={7}
            statusMessage={statusMessage}
            error={errorMsg}
            discoveredCount={discoveredCount}
            modulesCount={synthesizedModules.length}
            onRetry={() => triggerSynthesis()}
            activeGoal={primaryGoalLabel}
          />

          {/* Curriculum Blueprint Preview Card */}
          <CurriculumBlueprintCard
            estimate={blueprintEstimate}
            synthesizedModules={synthesizedModules}
            isGenerating={synthesisActive}
          />
        </aside>
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
