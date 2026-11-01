"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Toast from "@/components/ui/Toast";

type ImportType = "text" | "youtube" | "weblink" | "file";

export default function UniversalLearningImporterPage() {
  const router = useRouter();
  const [importType, setImportType] = useState<ImportType>("text");
  const [rawText, setRawText] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Extracted Preview State
  const [extractedPreview, setExtractedPreview] = useState<{
    title: string;
    domain: string;
    level: string;
    modules: string[];
    objectives: string[];
  } | null>(null);

  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      setToast({ open: true, message: `Loaded ${file.name} (${Math.round(content.length / 1024)} KB)` });
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    let sourceContent = "";
    if (importType === "text") sourceContent = rawText;
    else if (importType === "youtube" || importType === "weblink") sourceContent = urlInput;
    else if (importType === "file") sourceContent = fileContent;

    if (!sourceContent.trim()) {
      setToast({ open: true, message: "Please enter or upload study content to import." });
      return;
    }

    setIsAnalyzing(true);

    try {
      // Deterministic heuristic extraction for structure
      const lines = sourceContent
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      // Guess title
      let title = "Imported Study Course";
      if (lines[0] && lines[0].length < 80) {
        title = lines[0].replace(/^[#*-]\s*/, "");
      } else if (urlInput) {
        title = `Curriculum from ${new URL(urlInput.startsWith("http") ? urlInput : "https://" + urlInput).hostname}`;
      }

      // Extract modules
      const detectedModules: string[] = [];
      const detectedObjectives: string[] = [];

      for (const line of lines) {
        if (/^(chapter|module|unit|section|week|\d+\.)/i.test(line) && line.length < 100) {
          detectedModules.push(line.replace(/^[#*-]\s*/, ""));
        } else if (line.toLowerCase().includes("objective") || line.toLowerCase().includes("understand")) {
          detectedObjectives.push(line.slice(0, 100));
        }
      }

      // Fallback modules if none parsed explicitly
      if (detectedModules.length === 0) {
        detectedModules.push(
          "Foundations and Core Definitions",
          "Methodology and Worked Applications",
          "Advanced Problem Solving & Synthesis"
        );
      }

      // Domain inference
      let domain = "Computer Science";
      const fullTextLower = sourceContent.toLowerCase();
      if (fullTextLower.includes("physics") || fullTextLower.includes("force") || fullTextLower.includes("quantum")) {
        domain = "Physics";
      } else if (fullTextLower.includes("calculus") || fullTextLower.includes("integral") || fullTextLower.includes("algebra")) {
        domain = "Mathematics";
      } else if (fullTextLower.includes("biology") || fullTextLower.includes("cell") || fullTextLower.includes("dna")) {
        domain = "Biology";
      }

      setExtractedPreview({
        title,
        domain,
        level: "Undergraduate / Advanced",
        modules: detectedModules.slice(0, 6),
        objectives:
          detectedObjectives.length > 0
            ? detectedObjectives.slice(0, 4)
            : [
                "Master fundamental concepts and definitions",
                "Apply theoretical principles to practical problems",
                "Evaluate and verify problem solutions independently",
              ],
      });
    } catch (err: any) {
      setToast({ open: true, message: "Error analyzing source: " + err.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLaunchCurriculum = () => {
    if (!extractedPreview) return;
    const query = new URLSearchParams({
      goal: extractedPreview.title,
      domain: extractedPreview.domain,
    });
    router.push(`/new-goal?${query.toString()}`);
  };

  return (
    <div className="space-y-space-xl max-w-5xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-surface-container-low to-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-surface-container-high/60 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-secondary text-2xl">input</span>
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">
            Innovation 4 & 8: Universal Learning Importer
          </span>
        </div>
        <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary font-serif">
          Learn Anything From Anything
        </h1>
        <p className="font-body-md text-sm text-on-surface-variant mt-2 max-w-2xl leading-relaxed">
          Transform your raw lecture notes, course syllabus, YouTube playlists, open-access papers, or PDF chapters
          into a fully structured, multi-module learning path with video discovery, study monographs, and diagnostic quizzes.
        </p>
      </div>

      {/* Input Selection Tabs */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high/70 shadow-xs space-y-6">
        <div className="flex items-center gap-2 border-b border-surface-container-high/40 pb-3 overflow-x-auto no-scrollbar">
          {[
            { id: "text" as ImportType, label: "Paste Text / Syllabus", icon: "subject" },
            { id: "youtube" as ImportType, label: "YouTube Playlist / Video", icon: "smart_display" },
            { id: "weblink" as ImportType, label: "Web Link / Article", icon: "link" },
            { id: "file" as ImportType, label: "Upload Document (TXT/MD)", icon: "upload_file" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setImportType(tab.id);
                setExtractedPreview(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                importType === tab.id
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Input Forms */}
        {importType === "text" && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-primary">
              Paste Course Syllabus, Lecture Notes, or Table of Contents
            </label>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Chapter 1: Vectors and Coordinate Systems&#10;Chapter 2: Kinematics in Two Dimensions&#10;Chapter 3: Newton's Laws and Free Body Diagrams&#10;Chapter 4: Rotational Motion and Angular Momentum"
              className="w-full p-4 rounded-xl bg-surface-container-low border border-surface-container-high/70 text-xs text-on-surface font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        {(importType === "youtube" || importType === "weblink") && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-primary">
              {importType === "youtube" ? "YouTube Video or Playlist URL" : "Web Article or Documentation URL"}
            </label>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={
                importType === "youtube"
                  ? "https://www.youtube.com/playlist?list=PL..."
                  : "https://docs.python.org/3/tutorial/..."
              }
              className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container-high/70 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        {importType === "file" && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-primary">
              Upload Educational Text or Markdown File
            </label>
            <div className="border-2 border-dashed border-surface-container-high rounded-2xl p-8 text-center bg-surface-container-low/50 hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-3xl text-secondary mb-2">upload_file</span>
              <p className="text-xs text-on-surface font-semibold">
                {fileName ? `Selected: ${fileName}` : "Click to select a text document (.txt, .md)"}
              </p>
              <input
                type="file"
                accept=".txt,.md,.json"
                onChange={handleFileUpload}
                className="mt-3 text-xs text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary-container cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-6 py-2.5 rounded-xl bg-secondary text-on-secondary hover:bg-secondary-container text-xs font-semibold shadow-xs flex items-center gap-2 transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${isAnalyzing ? "animate-spin" : ""}`}>
              {isAnalyzing ? "progress_activity" : "auto_fix_high"}
            </span>
            <span>{isAnalyzing ? "Deconstructing Educational Hierarchy..." : "Deconstruct & Structure Curriculum"}</span>
          </button>
        </div>
      </div>

      {/* Extracted Curriculum Preview */}
      {extractedPreview && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high/70 shadow-sm space-y-5 animate-in fade-in">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-surface-container-high/40">
            <div>
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                Extracted Curriculum Architecture
              </span>
              <h2 className="text-xl font-bold text-primary mt-1">{extractedPreview.title}</h2>
              <span className="text-xs text-on-surface-variant">
                Domain: {extractedPreview.domain} · Level: {extractedPreview.level}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLaunchCurriculum}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-transform hover:scale-[1.02]"
            >
              <span>Synthesize Full Pencill Path</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Modules */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-secondary">view_module</span>
                <span>Detected Module Sequence ({extractedPreview.modules.length})</span>
              </h4>
              <ul className="space-y-2 text-xs text-on-surface">
                {extractedPreview.modules.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-primary shrink-0">{idx + 1}.</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Learning Objectives */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-secondary">flag</span>
                <span>Pedagogical Objectives ({extractedPreview.objectives.length})</span>
              </h4>
              <ul className="space-y-2 text-xs text-on-surface">
                {extractedPreview.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs text-emerald-600 shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.open && (
        <Toast
          message={toast.message}
          isOpen={toast.open}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
        />
      )}
    </div>
  );
}
