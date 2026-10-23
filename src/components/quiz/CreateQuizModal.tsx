"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { QuizCreationFormInput } from "@/types";

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuizCreated?: (quizId: string) => void;
  initialTopic?: string;
  initialSubject?: string;
  courseId?: string;
  moduleId?: string;
}

const SUBJECT_PRESETS = [
  "Physics",
  "Mathematics",
  "Computer Science",
  "Chemistry",
  "Biology",
  "Economics",
  "Literature",
  "History",
  "Other",
];

const GRADE_LEVELS = [
  "Middle School (Class 6-8)",
  "High School (Class 9-10)",
  "Senior Secondary (Class 11-12)",
  "Undergraduate / College",
  "Graduate / Advanced",
];

const CURRICULUM_PRESETS = [
  "General Rigorous Study",
  "CBSE / NCERT",
  "ICSE / ISC",
  "Advanced Placement (AP)",
  "International Baccalaureate (IB)",
  "Cambridge A-Levels",
  "MIT OpenCourseWare Standard",
];

const EXAM_PRESETS = [
  "General Exploration",
  "JEE Advanced",
  "JEE Main",
  "NEET",
  "SAT / ACT",
  "GRE / GATE",
  "College Semester Exam",
];

export default function CreateQuizModal({
  isOpen,
  onClose,
  onQuizCreated,
  initialTopic = "",
  initialSubject = "Physics",
  courseId,
  moduleId,
}: CreateQuizModalProps) {
  const router = useRouter();
  const { session } = useAuth();

  const [topic, setTopic] = useState(initialTopic);
  const [subject, setSubject] = useState(initialSubject);
  const [customSubject, setCustomSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("Senior Secondary (Class 11-12)");
  const [curriculum, setCurriculum] = useState("General Rigorous Study");
  const [examTarget, setExamTarget] = useState("General Exploration");
  const [knowledgeLevel, setKnowledgeLevel] = useState<QuizCreationFormInput["knowledgeLevel"]>("intermediate");
  const [difficulty, setDifficulty] = useState<QuizCreationFormInput["difficulty"]>("medium");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionFormat, setQuestionFormat] = useState<QuizCreationFormInput["questionFormat"]>("single_choice");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(10);
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [learningObjectives, setLearningObjectives] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuestionCountChange = (count: number) => {
    setQuestionCount(count);
    setTimeLimitMinutes(Math.max(5, count * 2));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Please provide a topic to generate questions for.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setGenerationStep("Consulting Gemini AI pedagogical engine...");

    try {
      const activeSubject = subject === "Other" && customSubject.trim() ? customSubject.trim() : subject;

      const payload = {
        topic: topic.trim(),
        subject: activeSubject,
        gradeLevel,
        curriculum: curriculum === "General Rigorous Study" ? undefined : curriculum,
        examTarget: examTarget === "General Exploration" ? undefined : examTarget,
        knowledgeLevel,
        difficulty,
        questionCount,
        questionFormat,
        timeLimitMinutes,
        includeExplanations,
        learningObjectives: learningObjectives.trim() || undefined,
        courseId,
        moduleId,
      };

      setGenerationStep("Synthesizing conceptual problem stems & distractor analysis...");

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate assessment. Please verify your connection and try again.");
      }

      // Store in client guest cache so instant retrieval succeeds immediately
      if (typeof window !== "undefined" && data.quiz) {
        try {
          const list = JSON.parse(localStorage.getItem("pencill_guest_quizzes") || "[]");
          const updated = [data.quiz, ...list.filter((q: any) => q.id !== data.quiz.id)].slice(0, 50);
          localStorage.setItem("pencill_guest_quizzes", JSON.stringify(updated));
        } catch {}
      }

      setGenerationStep("Verifying answer keys & publishing checkpoint...");

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
        if (onQuizCreated) {
          onQuizCreated(data.quizId);
        } else {
          router.push(`/practice/${data.quizId}`);
        }
      }, 600);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setGenerationStep("");
      setError(err instanceof Error ? err.message : "An unexpected error occurred during quiz generation.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div
        className="bg-surface-container-lowest border border-surface-container-high rounded-2xl shadow-xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-surface-container-high/60 flex items-center justify-between shrink-0 bg-surface-container-low/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">psychology</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary font-serif">
                Synthesize Diagnostic Quiz
              </h2>
              <p className="font-body-xs text-body-xs text-on-surface-variant">
                Configure personalized, rigorous assessments calibrated to your exact academic curriculum.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container transition-colors disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleGenerate} className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {error && (
            <div className="p-3.5 bg-error-container/40 border border-error/30 rounded-xl flex items-start gap-2.5 text-error">
              <span className="material-symbols-outlined text-base mt-0.5 shrink-0">error</span>
              <div className="flex-1 text-xs">
                <p className="font-semibold">Generation Notice</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* 1. Topic (Required) */}
          <div className="space-y-1.5">
            <label className="block font-label-md text-label-md font-semibold text-on-surface">
              Topic or Concept <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Projectile Motion with Drag, Stokes Theorem, Recursion & Dynamic Programming"
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-sans"
            />
          </div>

          {/* 2. Subject & Educational Level Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-label-md text-label-md font-semibold text-on-surface">
                Academic Subject
              </label>
              <select
                disabled={isSubmitting}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-sans"
              >
                {SUBJECT_PRESETS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {subject === "Other" && (
                <input
                  type="text"
                  disabled={isSubmitting}
                  placeholder="Specify subject..."
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="mt-2 w-full px-3 py-2 bg-surface-container-low border border-surface-container-high rounded-lg text-xs"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block font-label-md text-label-md font-semibold text-on-surface">
                Education Level
              </label>
              <select
                disabled={isSubmitting}
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-sans"
              >
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Curriculum & Target Examination Grid (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-label-md text-label-md font-semibold text-on-surface">
                Curriculum / Board (Optional)
              </label>
              <select
                disabled={isSubmitting}
                value={curriculum}
                onChange={(e) => setCurriculum(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-sans"
              >
                {CURRICULUM_PRESETS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-label-md text-label-md font-semibold text-on-surface">
                Target Exam (Optional)
              </label>
              <select
                disabled={isSubmitting}
                value={examTarget}
                onChange={(e) => setExamTarget(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container-high rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-sans"
              >
                {EXAM_PRESETS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Knowledge Level vs Question Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-surface-container-high/40">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-label-md font-semibold text-on-surface">
                  Student Knowledge Level
                </label>
                <span className="text-[11px] text-on-surface-variant font-mono">Your Background</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setKnowledgeLevel(lvl)}
                    className={`py-2 px-2 rounded-lg font-label-sm text-xs font-semibold capitalize transition-all border ${
                      knowledgeLevel === lvl
                        ? "bg-primary text-on-primary border-primary shadow-xs"
                        : "bg-surface-container-low text-on-surface hover:bg-surface-container border-surface-container-high/60"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-label-md font-semibold text-on-surface">
                  Problem Difficulty
                </label>
                <span className="text-[11px] text-on-surface-variant font-mono">Question Depth</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(["easy", "medium", "hard", "mixed"] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 px-1 rounded-lg font-label-sm text-xs font-semibold capitalize transition-all border ${
                      difficulty === diff
                        ? "bg-secondary text-on-secondary border-secondary shadow-xs"
                        : "bg-surface-container-low text-on-surface hover:bg-surface-container border-surface-container-high/60"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Question Count & Time Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-label-md font-semibold text-on-surface">
                  Number of Questions
                </label>
                <span className="font-mono text-xs font-bold text-primary">{questionCount} Qs</span>
              </div>
              <div className="flex items-center gap-2">
                {[3, 5, 8, 10, 15].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleQuestionCountChange(cnt)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                      questionCount === cnt
                        ? "bg-primary-container text-on-primary font-bold border-primary"
                        : "bg-surface-container-low text-on-surface border-surface-container-high/60 hover:bg-surface-container"
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-label-md font-semibold text-on-surface">
                  Allocated Time Limit
                </label>
                <span className="font-mono text-xs font-bold text-secondary">{timeLimitMinutes} min</span>
              </div>
              <div className="flex items-center gap-2">
                {[5, 10, 15, 20, 30].map((t) => (
                  <button
                    key={t}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setTimeLimitMinutes(t)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                      timeLimitMinutes === t
                        ? "bg-secondary-fixed text-on-secondary-fixed-variant font-bold border-secondary"
                        : "bg-surface-container-low text-on-surface border-surface-container-high/60 hover:bg-surface-container"
                    }`}
                  >
                    {t}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6. Question Format & Explanations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2 border-t border-surface-container-high/40">
            <div className="space-y-1.5">
              <label className="block font-label-md text-label-md font-semibold text-on-surface">
                Question Format
              </label>
              <select
                disabled={isSubmitting}
                value={questionFormat}
                onChange={(e) => setQuestionFormat(e.target.value as any)}
                className="w-full px-3 py-2 bg-surface-container-low border border-surface-container-high rounded-xl text-on-surface text-xs font-sans"
              >
                <option value="single_choice">Single-choice MCQ (4 Options)</option>
                <option value="true_false">True / False Concept Check</option>
                <option value="multiple_choice">Multiple Select Checkpoint</option>
                <option value="mixed">Mixed Formats</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-4 sm:pt-0">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isSubmitting}
                  checked={includeExplanations}
                  onChange={(e) => setIncludeExplanations(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <div>
                <span className="font-label-md text-label-md font-semibold text-on-surface block">
                  Authoritative Explanations
                </span>
                <span className="text-on-surface-variant text-[11px] block">
                  Step-by-step derivation &amp; distractor critique
                </span>
              </div>
            </div>
          </div>

          {/* 7. Optional Objectives */}
          <div className="space-y-1.5">
            <label className="block font-label-md text-label-md font-semibold text-on-surface">
              Specific Objectives or Formulas to Test (Optional)
            </label>
            <textarea
              rows={2}
              disabled={isSubmitting}
              value={learningObjectives}
              onChange={(e) => setLearningObjectives(e.target.value)}
              placeholder="e.g. Focus on angular momentum conservation, torque cross products, or common frame-of-reference pitfalls"
              className="w-full px-3.5 py-2 bg-surface-container-low border border-surface-container-high rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-xs font-sans resize-none"
            />
          </div>

          {/* Progress Indicator */}
          {isSubmitting && (
            <div className="p-4 bg-surface-container-low rounded-xl border border-primary/20 space-y-2 animate-pulse">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>{generationStep || "Synthesizing customized assessment..."}</span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-1.5 rounded-full animate-indeterminate" />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-surface-container-high/60 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container font-label-md text-xs transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !topic.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-label-md font-semibold rounded-xl hover:bg-primary-container transition-all text-xs shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">bolt</span>
              <span>{isSubmitting ? "Generating..." : "Generate & Start Quiz"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
