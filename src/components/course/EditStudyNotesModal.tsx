"use client";

import React, { useState, useEffect } from "react";
import { Lesson, LessonNoteResource } from "@/types";

export interface EditStudyNotesModalProps {
  isOpen: boolean;
  lesson: Lesson | null;
  onSave: (updatedLesson: Lesson) => void;
  onClose: () => void;
}

export default function EditStudyNotesModal({
  isOpen,
  lesson,
  onSave,
  onClose,
}: EditStudyNotesModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [readingMinutes, setReadingMinutes] = useState(15);
  const [takeaways, setTakeaways] = useState<string[]>([]);
  const [newTakeaway, setNewTakeaway] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState("");

  useEffect(() => {
    if (lesson) {
      const existingNote = lesson.studyNotes?.[0];
      setTitle(existingNote?.title || `${lesson.title}: Study Notes`);
      setDescription(existingNote?.description || (lesson.summaryPoints?.[0] || ""));
      setReadingMinutes(lesson.durationMinutes || 15);
      setTakeaways(
        existingNote?.description
          ? [existingNote.description]
          : lesson.summaryPoints && lesson.summaryPoints.length > 0
          ? [...lesson.summaryPoints]
          : ["Foundational conceptual principles and definitions"]
      );
      setContentMarkdown(
        (existingNote as any)?.contentMarkdown ||
          `# ${lesson.title}\n\n## Overview\n${existingNote?.description || lesson.summaryPoints?.[0] || "Key theoretical insights and structured academic monograph."}\n\n## Core Principles\n- Systematic analysis\n- Formula derivations & practical applications`
      );
    }
  }, [lesson, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !lesson) return null;

  const handleAddTakeaway = () => {
    if (!newTakeaway.trim()) return;
    setTakeaways([...takeaways, newTakeaway.trim()]);
    setNewTakeaway("");
  };

  const handleRemoveTakeaway = (idx: number) => {
    setTakeaways(takeaways.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lesson) return;

    const updatedNoteResource: LessonNoteResource = {
      id: lesson.studyNotes?.[0]?.id || `note-${lesson.id}-${Date.now().toString(36)}`,
      title: title.trim(),
      type: "study_notes",
      description: description.trim(),
      sourceName: "Pencill Academic Engine",
      url: `/learn/${lesson.moduleId}/${lesson.id}`,
      qualityScore: 98,
      publisher: "Pencill Editorial",
    };

    (updatedNoteResource as any).contentMarkdown = contentMarkdown;

    const updatedLesson: Lesson = {
      ...lesson,
      title: lesson.type === "monograph" ? title.trim() : lesson.title,
      durationMinutes: readingMinutes,
      summaryPoints: takeaways.length > 0 ? takeaways : [description.trim()],
      studyNotes: [updatedNoteResource],
    };

    onSave(updatedLesson);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-study-notes-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-surface-container-lowest rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-surface-container-high/60 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">menu_book</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Lesson Monograph Editor
              </span>
              <h3 id="edit-study-notes-title" className="font-headline-sm text-headline-sm text-primary font-serif">
                Edit Study Notes & Monograph
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Note Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high/60 text-on-surface text-sm focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Monograph Overview
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High-level pedagogical summary"
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high/60 text-on-surface text-sm focus:outline-hidden focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Reading Time (Mins)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={readingMinutes}
                onChange={(e) => setReadingMinutes(parseInt(e.target.value, 10) || 15)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high/60 text-on-surface text-sm focus:outline-hidden focus:border-primary"
              />
            </div>
          </div>

          {/* Key Takeaways Section */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Key Takeaways & Core Concepts
            </label>
            <div className="space-y-2 mb-2">
              {takeaways.map((point, pIdx) => (
                <div
                  key={pIdx}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-container-low border border-surface-container-high/40 text-xs text-on-surface"
                >
                  <span className="flex-1">{point}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTakeaway(pIdx)}
                    className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error/10"
                    title="Remove takeaway"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTakeaway}
                onChange={(e) => setNewTakeaway(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTakeaway();
                  }
                }}
                placeholder="Add a new takeaway point and press Enter..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-surface-container-low border border-surface-container-high/60 text-on-surface text-xs focus:outline-hidden focus:border-primary"
              />
              <button
                type="button"
                onClick={handleAddTakeaway}
                className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs border border-surface-container-high/60 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Full Monograph Markdown Content */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Monograph Markdown Content
            </label>
            <textarea
              rows={8}
              value={contentMarkdown}
              onChange={(e) => setContentMarkdown(e.target.value)}
              placeholder="Enter comprehensive monograph text with headings, formulas, and code snippets..."
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high/60 text-on-surface font-mono text-xs focus:outline-hidden focus:border-primary leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container-high/40 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:bg-primary-container active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">check</span>
              <span>Save Study Notes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
