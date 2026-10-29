"use client";

import { useState, useId, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { storageAdapter } from "@/lib/storage/storageAdapter";
import { enrollUserInCourse } from "@/services/supabase/enrollmentService";
import { estimateBlueprint } from "@/lib/curriculum/blueprintEstimator";
import type {
  LearnerGoalInput,
  EngineExecutionResult,
} from "@/lib/resource-engine/types";

interface LevelOption {
  id: string;
  label: string;
  subtitle: string;
  level: LearnerGoalInput["level"];
  depth: LearnerGoalInput["depth"];
  isExam?: boolean;
}

const LEVEL_OPTIONS: LevelOption[] = [
  {
    id: "foundation",
    label: "Foundation",
    subtitle: "Grade 9–10 fundamentals",
    level: "beginner",
    depth: "introductory",
  },
  {
    id: "class-11",
    label: "Class 11",
    subtitle: "High School Standard",
    level: "intermediate",
    depth: "comprehensive",
  },
  {
    id: "class-12",
    label: "Class 12",
    subtitle: "Senior Board Scope",
    level: "intermediate",
    depth: "rigorous",
  },
  {
    id: "competitive",
    label: "Competitive Focus",
    subtitle: "JEE Adv / NEET Mastery",
    level: "advanced",
    depth: "rigorous",
    isExam: true,
  },
  {
    id: "undergraduate",
    label: "Undergraduate Intro",
    subtitle: "First-year engineering rigorous syllabus",
    level: "advanced",
    depth: "comprehensive",
  },
];

const LANGUAGE_OPTIONS = [
  { label: "English", value: "English" },
  { label: "Hindi", value: "Hindi" },
  { label: "Hinglish (Bilingual)", value: "Hinglish" },
  { label: "Tamil", value: "Tamil" },
  { label: "Marathi", value: "Marathi" },
];

const EXPLANATION_STYLES = [
  { id: "step-by-step-analytical", label: "Step-by-Step Analytical" },
  { id: "simple-intuitive", label: "Simple & Intuitive" },
  { id: "mathematical-rigorous", label: "Mathematical & Rigorous" },
  { id: "example-driven", label: "Example-Driven" },
  { id: "visual-diagram", label: "Visual & Diagram-Based" },
  { id: "exam-oriented", label: "Exam-Oriented" },
];

const KNOWLEDGE_LEVELS = [
  { id: "complete-beginner", label: "Complete Beginner", desc: "No prior background" },
  { id: "some-basics", label: "Some Basics", desc: "Familiar with definitions" },
  { id: "intermediate", label: "Intermediate", desc: "Solid conceptual foundation" },
  { id: "advanced", label: "Advanced", desc: "Extensive prior coursework" },
];

const MASTERY_LEVELS = [
  { id: "familiarity", label: "Familiarity", desc: "Broad intuition" },
  { id: "working-competence", label: "Working Competence", desc: "Solve standard problems" },
  { id: "deep-conceptual", label: "Deep Conceptual", desc: "Rigorous proofs & derivations" },
  { id: "exam-ready", label: "Exam Ready", desc: "High accuracy & speed" },
  { id: "true-mastery", label: "True Mastery", desc: "Synthesis & novel problems" },
];

const VERIFIED_REPOSITORIES = [
  "NCERT",
  "NPTEL",
  "Khan Academy",
  "MIT OCW",
  "SWAYAM",
  "OpenStax",
  "Stanford Online",
];

function NewGoalPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, session } = useAuth();
  const topicInputId = useId();

  // Multi-Topic & Subtopic Tag State (PEN-003)
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["JEE Physics"]);
  const [newTopicInput, setNewTopicInput] = useState("");
  const [topicError, setTopicError] = useState<string | null>(null);

  // Core Builder Form State
  const [selectedLevelId, setSelectedLevelId] = useState("class-11");
  const [language, setLanguage] = useState("English");
  const [modalities, setModalities] = useState({
    videos: true,
    readings: true,
    practice: true,
    quizzes: true,
    flashcards: false,
  });
  const [weeklyStudyHours, setWeeklyStudyHours] = useState(6);

  // Advanced Pedagogical Preferences State (PEN-003)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [explanationStyle, setExplanationStyle] = useState("step-by-step-analytical");
  const [priorKnowledge, setPriorKnowledge] = useState("some-basics");
  const [targetMastery, setTargetMastery] = useState("exam-ready");
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>([
    "NCERT",
    "NPTEL",
    "Khan Academy",
    "MIT OCW",
  ]);

  // Generation & Engine State
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStageStep, setActiveStageStep] = useState(3);
  const [generationResult, setGenerationResult] = useState<EngineExecutionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pre-fill from query params if present
  useEffect(() => {
    const qTopic = searchParams.get("topic") || searchParams.get("goal");
    if (qTopic && qTopic.trim()) {
      setSelectedTopics([qTopic.trim()]);
    }
  }, [searchParams]);

  const selectedLevel = LEVEL_OPTIONS.find((l) => l.id === selectedLevelId) || LEVEL_OPTIONS[1];
  const targetWeeks = Math.max(2, Math.min(12, Math.round(24 / weeklyStudyHours)));

  // Pacing description helper
  const getPacingDescription = (hrs: number) => {
    if (hrs <= 3) return "Casual Pace · ~8 Weeks Total Duration";
    if (hrs <= 7) return `Steady Pace · ~${targetWeeks} Weeks Total Duration`;
    if (hrs <= 14) return "Sprint Pace · ~3 Weeks Total Duration";
    return "Intensive Pace · ~2 Weeks Total Duration";
  };

  // Add Topic Handler with strict validation (PEN-003)
  const handleAddTopic = (topicToAdd?: string) => {
    const raw = topicToAdd !== undefined ? topicToAdd : newTopicInput;
    const clean = raw ? raw.trim() : "";

    if (!clean) {
      setTopicError("Please enter a topic name.");
      return;
    }

    if (clean.length < 3) {
      setTopicError("Topic must be at least 3 characters long.");
      return;
    }

    if (selectedTopics.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setTopicError(`Topic "${clean}" is already selected.`);
      return;
    }

    if (selectedTopics.length >= 8) {
      setTopicError("Maximum limit of 8 topics reached.");
      return;
    }

    setSelectedTopics((prev) => [...prev, clean]);
    setNewTopicInput("");
    setTopicError(null);
  };

  // Remove Topic Handler (PEN-003)
  const handleRemoveTopic = (indexToRemove: number) => {
    setSelectedTopics((prev) => prev.filter((_, i) => i !== indexToRemove));
    setTopicError(null);
  };

  // Toggle Repository Selection
  const toggleRepository = (repo: string) => {
    setSelectedRepositories((prev) => {
      if (prev.includes(repo)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter((r) => r !== repo);
      }
      return [...prev, repo];
    });
  };

  // Adaptive Suggested Topics based on current topic keywords
  const suggestedTopicPool = useMemo(() => {
    const joined = selectedTopics.join(" ").toLowerCase();
    if (joined.includes("phys") || joined.includes("mech") || joined.includes("motion") || joined.includes("electr")) {
      return ["Thermodynamics", "Electrodynamics", "Rotational Dynamics", "Optics", "Modern Physics", "Wave Optics"];
    }
    if (joined.includes("math") || joined.includes("calc") || joined.includes("algebra") || joined.includes("prob")) {
      return ["Differential Calculus", "Linear Algebra", "Vector Calculus", "Probability & Statistics", "Complex Numbers"];
    }
    if (joined.includes("chem") || joined.includes("organ") || joined.includes("bond")) {
      return ["Organic Reaction Mechanisms", "Chemical Bonding", "Thermodynamics & Equilibrium", "Coordination Compounds"];
    }
    if (joined.includes("code") || joined.includes("program") || joined.includes("python") || joined.includes("comput")) {
      return ["Data Structures", "Algorithms & Complexity", "Object-Oriented Design", "Async & Concurrency", "System Design"];
    }
    return ["Mechanics", "Thermodynamics", "Differential Calculus", "Organic Chemistry", "Data Structures"];
  }, [selectedTopics]);

  const activeSuggestions = suggestedTopicPool
    .filter((s) => !selectedTopics.some((t) => t.toLowerCase() === s.toLowerCase()))
    .slice(0, 4);

  // Dynamic Blueprint Estimation (PEN-003)
  const blueprintEstimate = useMemo(() => {
    const topicsToUse = selectedTopics.length > 0 ? selectedTopics : ["Foundational Subject Concepts"];
    return estimateBlueprint({
      selectedTopics: topicsToUse.map((t, idx) => ({ id: `t-${idx}`, label: t, complexity: 3 })),
      depthLevelId: selectedLevelId,
      difficulty: selectedLevel.level,
      weeklyStudyHours,
      modalities: {
        video: modalities.videos,
        reading: modalities.readings,
        practice: modalities.practice,
        diagnostic: modalities.quizzes,
        flashcards: modalities.flashcards,
        worked: false,
        pyq: false,
        coding: false,
        projects: false,
      },
    });
  }, [selectedTopics, selectedLevelId, selectedLevel, weeklyStudyHours, modalities]);

  // Handle Curriculum Generation (PEN-004)
  const handleStartGeneration = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let topicsToSynthesize = [...selectedTopics];
    if (newTopicInput.trim().length >= 3 && !selectedTopics.some((t) => t.toLowerCase() === newTopicInput.trim().toLowerCase())) {
      topicsToSynthesize.push(newTopicInput.trim());
      setSelectedTopics(topicsToSynthesize);
      setNewTopicInput("");
    }

    if (topicsToSynthesize.length === 0) {
      setTopicError("Please specify at least one subject or topic.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setTopicError(null);
    setGenerationResult(null);
    setActiveStageStep(1);

    const primaryTopic = topicsToSynthesize.join(", ");

    const input: LearnerGoalInput = {
      topic: primaryTopic,
      level: selectedLevel.level,
      depth: selectedLevel.depth,
      learningGoal: selectedLevel.isExam ? "prepare_exam" : "understand_concepts",
      learningStyle: selectedLevel.isExam
        ? "exam_preparation"
        : modalities.readings && !modalities.videos
        ? "theory_focused"
        : modalities.practice && !modalities.videos
        ? "practical_projects"
        : "balanced",
      weeklyStudyHours,
      targetWeeks,
      language,
      targetExam: selectedLevel.isExam ? topicsToSynthesize[0] : null,
      priorKnowledge,
    };

    // Stage progression timer
    const interval = setInterval(() => {
      setActiveStageStep((curr) => {
        if (curr < 5) return curr + 1;
        return curr;
      });
    }, 1400);

    try {
      const res = await fetch("/api/courses/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(input),
      });

      clearInterval(interval);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Server synthesis returned HTTP ${res.status}`);
      }

      const resData: EngineExecutionResult = json.data;
      setGenerationResult(resData);
      setActiveStageStep(5);
      setIsGenerating(false);

      // Dual-Persistence Client Integration (PEN-004)
      if (resData.course) {
        await storageAdapter.savePath(resData.course);
        try {
          localStorage.setItem(`pencill_path_${resData.courseId}`, JSON.stringify(resData.course));
        } catch {}
      }

      // Enroll user (supports guest local enrollment + Supabase account sync)
      await enrollUserInCourse(user?.id || null, resData.courseId, { accessToken: session?.access_token });

      // Initialize progress
      await storageAdapter.updateProgress(resData.courseId, {
        completedLessonIds: [],
        hoursLogged: 0,
        lastAccessed: new Date().toISOString(),
      });
    } catch (err: any) {
      clearInterval(interval);
      setIsGenerating(false);
      setErrorMsg(err.message || "Learning path generation failed. Please try again.");
    }
  };

  const handleStartCourse = () => {
    if (generationResult?.courseId) {
      router.push(`/courses/${generationResult.courseId}`);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="max-w-7xl mx-auto w-full pb-space-xl">
        {/* Top Editorial Header & Breadcrumb */}
        <header className="mb-space-xl">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md mb-space-sm uppercase tracking-wider font-semibold">
            <Link className="hover:text-primary transition-colors" href="/dashboard">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-secondary">New Learning Path</span>
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

            <div className="hidden lg:flex items-center gap-space-sm bg-surface-container-low px-space-md py-space-xs rounded-full border border-surface-container-high/60">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Curating from 4,200+ Verified Academic Repositories
              </span>
            </div>
          </div>
        </header>

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
                {/* Step 1: Interactive Learning Goal & Topic Tags (PEN-003) */}
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <label
                      className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-semibold"
                      htmlFor={topicInputId}
                    >
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-bold">
                        1
                      </span>
                      Specify Subject, Topics, or Standardized Exam
                    </label>
                    <span className="font-label-sm text-label-sm text-secondary font-medium">
                      Step 1 of 5
                    </span>
                  </div>

                  {/* Active Selected Topic Pills */}
                  {selectedTopics.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 pb-1">
                      {selectedTopics.map((top, idx) => (
                        <span
                          key={`${top}-${idx}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-label-sm font-semibold border border-primary/20 shadow-xs transition-all animate-fadeIn"
                        >
                          <span className="material-symbols-outlined text-xs text-secondary-fixed">label</span>
                          <span>{top}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTopic(idx)}
                            className="w-4 h-4 rounded-full hover:bg-on-primary-container/20 flex items-center justify-center ml-0.5 text-on-primary-container transition-colors"
                            title={`Remove ${top}`}
                            aria-label={`Remove topic ${top}`}
                          >
                            <span className="material-symbols-outlined text-xs">close</span>
                          </button>
                        </span>
                      ))}
                      <span className="text-on-surface-variant font-label-sm text-label-sm self-center ml-1">
                        ({selectedTopics.length}/8 topics)
                      </span>
                    </div>
                  )}

                  {/* Inline Add Topic Input & Action Row */}
                  <div className="relative mt-space-xs flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        id={topicInputId}
                        className="w-full bg-surface-container-low px-space-md py-3 rounded-lg text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] border border-surface-container-high/40 transition-all pr-10"
                        placeholder={
                          selectedTopics.length === 0
                            ? "e.g. Classical Electrodynamics, Organic Chemistry Class 12, Microeconomics"
                            : "+ Add another subtopic or specific chapter..."
                        }
                        type="text"
                        value={newTopicInput}
                        onChange={(e) => {
                          setNewTopicInput(e.target.value);
                          if (topicError) setTopicError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTopic();
                          }
                        }}
                      />
                      <button
                        className="absolute right-3 top-3 text-on-surface-variant hover:text-primary transition-colors"
                        type="button"
                        onClick={() => setShowAdvanced((prev) => !prev)}
                        title="Toggle Advanced Pedagogical Preferences"
                        aria-label="Toggle Advanced Pedagogical Preferences"
                      >
                        <span className={`material-symbols-outlined text-lg ${showAdvanced ? "text-primary rotate-45 transition-transform" : "transition-transform"}`}>
                          tune
                        </span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddTopic()}
                      className="bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-md text-label-md font-semibold px-4 py-3 rounded-lg flex items-center gap-1 transition-all flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                      <span>Add Topic</span>
                    </button>
                  </div>

                  {/* Validation Error Banner */}
                  {topicError && (
                    <div className="text-error font-label-sm text-label-sm flex items-center gap-1.5 pt-1 animate-fadeIn">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      <span>{topicError}</span>
                    </div>
                  )}

                  {/* Adaptive Suggested Subtopics */}
                  {activeSuggestions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Suggested subtopics:
                      </span>
                      {activeSuggestions.map((sug) => (
                        <button
                          key={sug}
                          className="bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary px-space-sm py-0.5 rounded-md font-label-sm text-label-sm transition-colors"
                          onClick={() => handleAddTopic(sug)}
                          type="button"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Expandable Advanced Pedagogical Preferences Drawer (PEN-003) */}
                  {showAdvanced && (
                    <div className="mt-space-md p-space-md bg-surface-container-low/70 border border-surface-container-high/60 rounded-xl flex flex-col gap-space-md animate-fadeIn">
                      <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high/50">
                        <div className="flex items-center gap-space-xs text-primary font-headline-sm text-headline-sm font-semibold">
                          <span className="material-symbols-outlined text-lg">tune</span>
                          <span>Advanced Pedagogical Preferences</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAdvanced(false)}
                          className="text-on-surface-variant hover:text-on-surface text-label-sm"
                        >
                          Done
                        </button>
                      </div>

                      {/* Explanation Style */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-md text-label-md text-on-surface font-semibold">
                          Pedagogical Explanation Style
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {EXPLANATION_STYLES.map((style) => (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => setExplanationStyle(style.id)}
                              className={`p-2 rounded-lg text-left text-label-sm font-medium transition-all ${
                                explanationStyle === style.id
                                  ? "bg-primary text-on-primary shadow-xs"
                                  : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                              }`}
                            >
                              {style.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Knowledge Level & Mastery Tier */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-label-md text-label-md text-on-surface font-semibold">
                            Current Background
                          </label>
                          <div className="flex flex-col gap-1">
                            {KNOWLEDGE_LEVELS.map((kl) => (
                              <button
                                key={kl.id}
                                type="button"
                                onClick={() => setPriorKnowledge(kl.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-left text-label-sm transition-all flex items-center justify-between ${
                                  priorKnowledge === kl.id
                                    ? "bg-primary-container text-on-primary-container font-semibold"
                                    : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                                }`}
                              >
                                <span>{kl.label}</span>
                                <span className="text-xs opacity-75">{kl.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="font-label-md text-label-md text-on-surface font-semibold">
                            Target Mastery
                          </label>
                          <div className="flex flex-col gap-1">
                            {MASTERY_LEVELS.map((ml) => (
                              <button
                                key={ml.id}
                                type="button"
                                onClick={() => setTargetMastery(ml.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-left text-label-sm transition-all flex items-center justify-between ${
                                  targetMastery === ml.id
                                    ? "bg-secondary-container text-on-secondary-container font-semibold"
                                    : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                                }`}
                              >
                                <span>{ml.label}</span>
                                <span className="text-xs opacity-75">{ml.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Academic Repositories */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-md text-label-md text-on-surface font-semibold">
                          Target Academic Repositories
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {VERIFIED_REPOSITORIES.map((repo) => {
                            const isSelected = selectedRepositories.includes(repo);
                            return (
                              <button
                                key={repo}
                                type="button"
                                onClick={() => toggleRepository(repo)}
                                className={`px-2.5 py-1 rounded-full text-label-sm font-medium transition-all flex items-center gap-1 ${
                                  isSelected
                                    ? "bg-primary text-on-primary shadow-xs"
                                    : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
                                }`}
                              >
                                {isSelected && (
                                  <span className="material-symbols-outlined text-xs">check</span>
                                )}
                                <span>{repo}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2: Target Academic Level */}
                <div className="flex flex-col gap-space-xs">
                  <label className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-semibold">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-bold">
                      2
                    </span>
                    Target Depth &amp; Difficulty
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-xs mt-space-xs">
                    {LEVEL_OPTIONS.map((opt) => {
                      const isActive = selectedLevelId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          className={`flex flex-col items-start p-space-sm rounded-lg text-left transition-all ${
                            opt.id === "undergraduate" ? "sm:col-span-2" : ""
                          } ${
                            isActive
                              ? "bg-primary-container text-on-primary shadow-sm active-pill"
                              : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                          }`}
                          onClick={() => setSelectedLevelId(opt.id)}
                          type="button"
                        >
                          <span className="font-label-lg text-label-lg font-semibold flex items-center justify-between w-full">
                            <span>{opt.label}</span>
                            {isActive && (
                              <span className="material-symbols-outlined text-sm text-secondary-fixed">
                                check_circle
                              </span>
                            )}
                          </span>
                          <span
                            className={`font-label-sm text-label-sm ${
                              isActive ? "text-primary-fixed-dim" : "text-on-surface-variant"
                            }`}
                          >
                            {opt.subtitle}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3: Preferred Language */}
                <div className="flex flex-col gap-space-xs">
                  <label className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-semibold">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-bold">
                      3
                    </span>
                    Instruction Language
                  </label>

                  <div className="flex flex-wrap gap-space-xs mt-space-xs">
                    {LANGUAGE_OPTIONS.map((lang) => {
                      const isActive = language === lang.value;
                      return (
                        <button
                          key={lang.value}
                          className={`px-space-md py-space-xs rounded-full font-label-md text-label-md font-semibold transition-all ${
                            isActive
                              ? "bg-primary text-on-primary shadow-sm"
                              : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                          }`}
                          onClick={() => setLanguage(lang.value)}
                          type="button"
                        >
                          {lang.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 4: Primary Learning Modality / Focus */}
                <div className="flex flex-col gap-space-xs">
                  <label className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-semibold">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-bold">
                      4
                    </span>
                    Primary Pedagogical Modalities
                  </label>
                  <p className="font-body-sm text-body-sm text-on-surface-variant -mt-1">
                    Pencill selects verified materials matching your cognitive study routine.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs mt-space-xs">
                    <label className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                      <input
                        checked={modalities.videos}
                        onChange={(e) => setModalities({ ...modalities, videos: e.target.checked })}
                        className="w-4 h-4 rounded text-primary accent-primary"
                        type="checkbox"
                      />
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                          Curated Video Lectures
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          NPTEL, IIT Faculty, &amp; YouTube stars
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                      <input
                        checked={modalities.readings}
                        onChange={(e) => setModalities({ ...modalities, readings: e.target.checked })}
                        className="w-4 h-4 rounded text-primary accent-primary"
                        type="checkbox"
                      />
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                          Deep Reading / Theory Notes
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          NCERT extracts &amp; classic textbook notes
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                      <input
                        checked={modalities.practice}
                        onChange={(e) => setModalities({ ...modalities, practice: e.target.checked })}
                        className="w-4 h-4 rounded text-primary accent-primary"
                        type="checkbox"
                      />
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                          Graded Practice Problems
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Past 10 years JEE Main/Adv questions
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                      <input
                        checked={modalities.quizzes}
                        onChange={(e) => setModalities({ ...modalities, quizzes: e.target.checked })}
                        className="w-4 h-4 rounded text-primary accent-primary"
                        type="checkbox"
                      />
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                          Diagnostic Quizzes
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Instant feedback checkpoint tests
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors sm:col-span-2">
                      <input
                        checked={modalities.flashcards}
                        onChange={(e) => setModalities({ ...modalities, flashcards: e.target.checked })}
                        className="w-4 h-4 rounded text-primary accent-primary"
                        type="checkbox"
                      />
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                          Spaced Formula Flashcards
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Equations, dimensional formulas &amp; memory hooks
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Step 5: Weekly Time Commitment */}
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-semibold">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-bold">
                        5
                      </span>
                      Weekly Commitment
                    </label>
                    <span className="font-label-lg text-label-lg text-secondary font-semibold bg-secondary-fixed/30 px-space-sm py-0.5 rounded">
                      {weeklyStudyHours} hours / week
                    </span>
                  </div>

                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Pacing strategy:{" "}
                    <span className="text-on-surface font-medium">
                      {getPacingDescription(weeklyStudyHours)}
                    </span>
                  </p>

                  <div className="pt-space-sm pb-space-xs">
                    <input
                      className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
                      max="20"
                      min="2"
                      step="1"
                      type="range"
                      value={weeklyStudyHours}
                      onChange={(e) => setWeeklyStudyHours(parseInt(e.target.value, 10))}
                    />
                    <div className="flex justify-between text-on-surface-variant font-label-sm text-label-sm mt-1">
                      <span>Casual (2 hrs)</span>
                      <span className="font-semibold text-primary">Balanced (6 hrs)</span>
                      <span>Sprint (12 hrs)</span>
                      <span>Intensive (20 hrs)</span>
                    </div>
                  </div>
                </div>

                {/* Action Submit Button */}
                <div className="pt-space-sm">
                  <button
                    className="w-full bg-primary hover:bg-primary-container text-on-primary py-space-md px-space-lg rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-sm transition-all shadow-md active:scale-[0.99] group disabled:opacity-50"
                    disabled={isGenerating}
                    type="submit"
                  >
                    <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform text-secondary-fixed">
                      auto_awesome
                    </span>
                    <span>{isGenerating ? "Synthesizing Curriculum..." : "Build My Learning Path"}</span>
                    <span className="material-symbols-outlined text-lg ml-auto opacity-70 group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </button>

                  <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-space-xs">
                    Free academic syllabus builder. No subscription needed for public modules.
                  </p>
                </div>
              </form>
            </div>
          </section>

          {/* RIGHT COLUMN: Live AI Synthesis Engine Simulator & Dynamic Blueprint (5 Cols) */}
          <aside className="lg:col-span-5 flex flex-col gap-space-md">
            {/* Live Synthesis Status Card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-high/60">
              {/* Card Header & Status Pulse */}
              <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high">
                <div className="flex items-center gap-space-xs">
                  <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-surface-container-low">
                    <span className="material-symbols-outlined text-primary text-base">neurology</span>
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-secondary animate-ping" />
                  </div>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-serif">
                    Curator Engine
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-secondary bg-secondary-container/40 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  {isGenerating ? "Synthesizing..." : "Live Indexing"}
                </span>
              </div>

              {/* Dynamic Header */}
              <div className="my-space-md">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-lg text-label-lg text-primary font-semibold">
                    {isGenerating ? "Synthesis in Progress" : generationResult ? "Synthesis Complete" : "Curator Pipeline Ready"}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                    STEP {activeStageStep} OF 5
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Sequencing highest-yield resources tailored to{" "}
                  <strong className="text-on-surface font-semibold">
                    {selectedTopics.length > 0 ? selectedTopics.join(", ") : "your selected subject"}
                  </strong>.
                </p>
              </div>

              {/* Sequential Stage Checklist */}
              <div className="flex flex-col gap-space-md relative pl-2">
                {/* Stage 1: Domain Deconstruction */}
                <div className="flex items-start gap-space-sm">
                  <div className="flex flex-col items-center">
                    <span className="material-symbols-outlined text-lg text-on-secondary-container bg-secondary-fixed/40 rounded-full p-0.5">
                      check
                    </span>
                    <div className="w-0.5 h-7 bg-surface-container-highest mt-1" />
                  </div>
                  <div className="flex flex-col min-w-0 pt-0.5">
                    <span className="font-label-lg text-label-lg text-on-surface font-medium">
                      Domain Deconstruction
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Classified fundamental subtopics from NCERT &amp; academic core.
                    </p>
                  </div>
                </div>

                {/* Stage 2: Prerequisite Sequencing */}
                <div className="flex items-start gap-space-sm">
                  <div className="flex flex-col items-center">
                    <span className="material-symbols-outlined text-lg text-on-secondary-container bg-secondary-fixed/40 rounded-full p-0.5">
                      check
                    </span>
                    <div className="w-0.5 h-7 bg-surface-container-highest mt-1" />
                  </div>
                  <div className="flex flex-col min-w-0 pt-0.5">
                    <span className="font-label-lg text-label-lg text-on-surface font-medium">
                      Prerequisite Sequencing
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Mapped mathematical tools &amp; foundational prerequisites sequentially.
                    </p>
                  </div>
                </div>

                {/* Stage 3: Harvesting Content */}
                <div className="flex items-start gap-space-sm">
                  <div className="flex flex-col items-center">
                    {activeStageStep >= 3 ? (
                      isGenerating && activeStageStep === 3 ? (
                        <div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center animate-spin">
                          <span className="material-symbols-outlined text-sm text-on-primary-fixed">sync</span>
                        </div>
                      ) : (
                        <span className="material-symbols-outlined text-lg text-on-secondary-container bg-secondary-fixed/40 rounded-full p-0.5">
                          check
                        </span>
                      )
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-outline-variant" />
                      </div>
                    )}
                    <div className="w-0.5 h-7 bg-surface-container-high mt-1" />
                  </div>
                  <div className="flex flex-col min-w-0 pt-0.5">
                    <span className="font-label-lg text-label-lg text-primary font-bold flex items-center gap-1.5">
                      Harvesting High-Yield Content
                      {isGenerating && activeStageStep === 3 && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                      )}
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface">
                      Evaluating top verified playlists: NPTEL, Khan Academy, and MIT open repositories.
                    </p>
                  </div>
                </div>

                {/* Stage 4: Quality & Clarity Audit */}
                <div className={`flex items-start gap-space-sm ${activeStageStep < 4 ? "opacity-60" : ""}`}>
                  <div className="flex flex-col items-center">
                    {activeStageStep >= 4 ? (
                      isGenerating && activeStageStep === 4 ? (
                        <div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center animate-spin">
                          <span className="material-symbols-outlined text-sm text-on-primary-fixed">sync</span>
                        </div>
                      ) : (
                        <span className="material-symbols-outlined text-lg text-on-secondary-container bg-secondary-fixed/40 rounded-full p-0.5">
                          check
                        </span>
                      )
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-outline-variant" />
                      </div>
                    )}
                    <div className="w-0.5 h-7 bg-surface-container mt-1" />
                  </div>
                  <div className="flex flex-col min-w-0 pt-0.5">
                    <span className="font-label-lg text-label-lg text-on-surface font-medium">
                      Quality &amp; Clarity Audit
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Checking resolution, audio crispness, and exam-question alignment.
                    </p>
                  </div>
                </div>

                {/* Stage 5: Formulating Modular Syllabi & Quizzes */}
                <div className={`flex items-start gap-space-sm ${activeStageStep < 5 ? "opacity-40" : ""}`}>
                  <div className="flex flex-col items-center">
                    {activeStageStep >= 5 ? (
                      <span className="material-symbols-outlined text-lg text-on-secondary-container bg-secondary-fixed/40 rounded-full p-0.5">
                        check
                      </span>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-outline-variant" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 pt-0.5">
                    <span className="font-label-lg text-label-lg text-on-surface font-medium">
                      Formulating Modular Syllabi &amp; Quizzes
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Generating instant flashcard decks and end-of-unit tests.
                    </p>
                  </div>
                </div>
              </div>

              {/* Academic Source Telemetry Widget */}
              <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between border border-surface-container-high/40">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-base">verified</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                    Sources Indexed
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedRepositories.slice(0, 3).map((repo) => (
                    <span key={repo} className="font-label-sm text-label-sm text-on-surface bg-surface-container px-2 py-0.5 rounded font-mono">
                      {repo}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Real-Time Course Blueprint Preview (PEN-003) */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-high/60">
              <div className="flex items-center justify-between mb-space-sm">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-serif">
                    Curriculum Blueprint
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {generationResult
                      ? "Synthesized Learning Units"
                      : `${blueprintEstimate.moduleRange[0]}–${blueprintEstimate.moduleRange[1]} Estimated Modules · ~${blueprintEstimate.estimatedTotalHours} Hours`}
                  </p>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                  {generationResult ? "Synthesized" : "Live Dynamic"}
                </span>
              </div>

              <div className="flex flex-col gap-space-xs" id="modules-container">
                {generationResult ? (
                  generationResult.assignments.map((assign, idx) => (
                    <div
                      key={assign.moduleId}
                      className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between group hover:bg-surface-container transition-all"
                    >
                      <div className="flex items-center gap-space-sm min-w-0">
                        <span className="w-6 h-6 rounded-md bg-surface-container-highest text-primary flex items-center justify-center font-label-sm text-label-sm font-bold flex-shrink-0">
                          {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-lg text-label-lg text-on-surface truncate font-semibold">
                            {assign.moduleTitle}
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            {assign.videos.length} videos · {assign.readings.length} readings · {assign.quiz ? "1 checkpoint quiz" : "study notes"}
                          </span>
                        </div>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-secondary-container bg-secondary-fixed/50 px-2 py-0.5 rounded font-medium flex-shrink-0">
                        Ready
                      </span>
                    </div>
                  ))
                ) : (
                  blueprintEstimate.progressionPhases.map((phase, idx) => (
                    <div
                      key={phase.stageNumber}
                      className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between group hover:bg-surface-container transition-all"
                    >
                      <div className="flex items-center gap-space-sm min-w-0">
                        <span className="w-6 h-6 rounded-md bg-surface-container-highest text-primary flex items-center justify-center font-label-sm text-label-sm font-bold flex-shrink-0">
                          {phase.stageNumber < 10 ? `0${phase.stageNumber}` : phase.stageNumber}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-lg text-label-lg text-on-surface truncate font-semibold">
                            {phase.title}
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                            {phase.focus} · ~{phase.estimatedHours} hrs
                          </span>
                        </div>
                      </div>
                      <span className="font-label-sm text-label-sm text-secondary bg-secondary-container/40 px-2 py-0.5 rounded font-medium flex-shrink-0">
                        {idx === 0 ? "Foundations" : idx === blueprintEstimate.progressionPhases.length - 1 ? "Capstone" : "Core"}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Start Course CTA upon successful synthesis */}
              {generationResult && (
                <div className="mt-space-md pt-space-sm border-t border-surface-container-high flex flex-col gap-2">
                  <button
                    onClick={handleStartCourse}
                    className="w-full bg-primary-container text-on-primary hover:bg-primary py-2.5 px-space-md rounded-lg font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <span>Start Learning This Path</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>
              )}

              {/* Subtle Scholarly Footer Quote */}
              <div className="mt-space-md pt-space-sm border-t border-surface-container-high flex items-center gap-space-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-base text-secondary">menu_book</span>
                <span className="font-label-sm text-label-sm italic">
                  Organized according to academic mastery directives.
                </span>
              </div>
            </div>
          </aside>
        </div>

        {/* Editorial Feature Strip / Confidence Signals */}
        <div className="mt-space-xl grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="bg-surface-container-lowest rounded-xl p-space-md flex items-start gap-space-sm shadow-sm border border-surface-container-high/60">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0 text-primary">
              <span className="material-symbols-outlined text-xl">auto_stories</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-0.5 font-serif">
                Zero Cognitive Fluff
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Pencill skips clickbait, sponsor breaks, and filler tutorials. You only get distilled academic mastery.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md flex items-start gap-space-sm shadow-sm border border-surface-container-high/60">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0 text-secondary">
              <span className="material-symbols-outlined text-xl">conversion_path</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-0.5 font-serif">
                Continuous Diagnostic
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Quizzes after every module track your knowledge retention and auto-adjust subsequent lesson difficulty.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md flex items-start gap-space-sm shadow-sm border border-surface-container-high/60">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0 text-primary">
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
    </AuthGuard>
  );
}
