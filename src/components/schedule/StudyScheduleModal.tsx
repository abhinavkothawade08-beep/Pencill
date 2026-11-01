"use client";

import React, { useState } from "react";
import { generateICalendar, downloadICSFile, ScheduleEvent } from "@/lib/schedule/calendar";
import { LearningPath } from "@/types";

interface StudyScheduleModalProps {
  course: LearningPath;
  isOpen: boolean;
  onClose: () => void;
}

export default function StudyScheduleModal({
  course,
  isOpen,
  onClose,
}: StudyScheduleModalProps) {
  const [studyDaysPerWeek, setStudyDaysPerWeek] = useState(4);
  const [sessionMinutes, setSessionMinutes] = useState(45);
  const [preferredTime, setPreferredTime] = useState("18:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5, 6]); // Mon, Wed, Fri, Sat

  if (!isOpen) return null;

  const modules = course.modules || [];
  const allLessons = modules.flatMap((m: any) => m.lessons || m.resources || []);
  const totalLessons = allLessons.length || 12;

  // Calculate projected schedule
  const totalSessions = totalLessons;
  const estimatedWeeks = Math.max(1, Math.ceil(totalSessions / selectedDays.length));

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex)
        ? prev.length > 1
          ? prev.filter((d) => d !== dayIndex)
          : prev
        : [...prev, dayIndex].sort()
    );
  };

  const handleExportICS = () => {
    const events: ScheduleEvent[] = [];
    const now = new Date();
    const [timeH, timeM] = preferredTime.split(":").map(Number);

    let sessionCounter = 0;
    let dayOffset = 1;

    while (sessionCounter < totalLessons) {
      const candidateDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const dayOfWeek = candidateDate.getDay();

      if (selectedDays.includes(dayOfWeek)) {
        candidateDate.setHours(timeH || 18, timeM || 0, 0, 0);

        const lesson = allLessons[sessionCounter];
        const lessonTitle = lesson?.title || `Session ${sessionCounter + 1}`;

        events.push({
          summary: `Pencill: ${lessonTitle}`,
          description: `Course: ${course.title}\nSession Duration: ${sessionMinutes}m\nTarget: Complete lesson & checkpoint review.`,
          startDate: candidateDate,
          durationMinutes: sessionMinutes,
        });

        sessionCounter++;
      }
      dayOffset++;
    }

    const icsContent = generateICalendar(events, `${course.title} Study Schedule`);
    const cleanFilename = course.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 30);
    downloadICSFile(`pencill-schedule-${cleanFilename}.ics`, icsContent);
  };

  const DAYS = [
    { idx: 0, label: "Sun" },
    { idx: 1, label: "Mon" },
    { idx: 2, label: "Tue" },
    { idx: 3, label: "Wed" },
    { idx: 4, label: "Thu" },
    { idx: 5, label: "Fri" },
    { idx: 6, label: "Sat" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-surface-container-high/70 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-xl">calendar_month</span>
            <h3 className="font-bold text-sm text-primary">Personalized Study Planner</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Course Info */}
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high/40">
          <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
            Target Curriculum
          </span>
          <h4 className="font-bold text-xs text-primary truncate mt-0.5">{course.title}</h4>
          <span className="text-[11px] text-on-surface-variant">
            {modules.length} Modules · {totalLessons} Lessons
          </span>
        </div>

        {/* Days of Week Selection */}
        <div>
          <label className="block text-xs font-bold text-primary mb-2">Available Study Days</label>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map((d) => {
              const active = selectedDays.includes(d.idx);
              return (
                <button
                  key={d.idx}
                  type="button"
                  onClick={() => toggleDay(d.idx)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? "bg-secondary text-on-secondary shadow-xs"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-primary mb-1">Session Duration</label>
            <select
              value={sessionMinutes}
              onChange={(e) => setSessionMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/70 text-xs font-semibold text-on-surface"
            >
              <option value={30}>30 Minutes</option>
              <option value={45}>45 Minutes (Optimal)</option>
              <option value={60}>60 Minutes</option>
              <option value={90}>90 Minutes (Intensive)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-primary mb-1">Preferred Time</label>
            <input
              type="time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/70 text-xs font-semibold text-on-surface"
            />
          </div>
        </div>

        {/* Projection Card */}
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Estimated Timeline:</span>
            <span className="font-bold text-primary">{estimatedWeeks} Weeks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Weekly Commitment:</span>
            <span className="font-bold text-secondary">
              {Math.round((selectedDays.length * sessionMinutes) / 60 * 10) / 10} Hours / Week
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Pacing Feasibility:</span>
            <span className="font-bold text-emerald-600">Realistic & Sustainable</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-surface-container-high text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExportICS}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-transform hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export to Calendar (.ics)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
