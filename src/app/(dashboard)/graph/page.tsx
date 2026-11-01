"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import {
  ConceptNode,
  buildKnowledgeGraphFromCourses,
  identifyPrerequisiteGaps,
} from "@/lib/knowledge-graph/graph";
import { useAuth } from "@/context/AuthContext";
import { getUserEnrollments } from "@/services/supabase/enrollmentService";
import { getCompletedLessonIds } from "@/services/supabase/progressService";
import { storageAdapter } from "@/lib/storage/storageAdapter";
import { LearningPath } from "@/types";

export default function KnowledgeGraphPage() {
  const { user, session } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);
  const [targetGoalId, setTargetGoalId] = useState<string>("");

  const loadGraphData = useCallback(async () => {
    setLoading(true);
    try {
      let enrolledCourses: any[] = [];
      let completedLessons: string[] = [];

      try {
        const enrollments = await getUserEnrollments(user?.id || null, {
          accessToken: session?.access_token,
        });
        enrolledCourses = enrollments
          .map((e) => e.course)
          .filter((c): c is LearningPath => Boolean(c));

        if (user?.id) {
          const ids = await getCompletedLessonIds(user.id);
          completedLessons = ids || [];
        }
      } catch (e) {
        console.warn("[KnowledgeGraph] Remote enrollments unavailable, loading local:", e);
      }

      let allCourses = enrolledCourses;
      if (!user?.id) {
        // Guest mode fallback
        const localSaved = await storageAdapter.getSavedPaths();
        const courseMap = new Map<string, any>();
        enrolledCourses.forEach((c) => courseMap.set(c.id, c));
        localSaved.forEach((c) => {
          if (!courseMap.has(c.id)) courseMap.set(c.id, c);
        });
        for (const p of localSaved) {
          const prog = await storageAdapter.getProgress(p.id);
          if (prog?.completedLessonIds) {
            prog.completedLessonIds.forEach((id) => {
              if (!completedLessons.includes(id)) {
                completedLessons.push(id);
              }
            });
          }
        }
        allCourses = Array.from(courseMap.values());
      }
      setCourses(allCourses);
      setCompletedLessonIds(completedLessons);
    } catch (err) {
      console.error("Failed to load knowledge graph courses:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, session?.access_token]);

  useEffect(() => {
    loadGraphData();
  }, [loadGraphData]);

  // Dynamically generate genuine nodes from actual courses and completed lessons
  const allNodes: ConceptNode[] = useMemo(() => {
    return buildKnowledgeGraphFromCourses(courses, completedLessonIds);
  }, [courses, completedLessonIds]);

  // Set default selected and target nodes when nodes populate
  useEffect(() => {
    if (allNodes.length > 0) {
      if (!selectedNode || !allNodes.some((n) => n.id === selectedNode.id)) {
        // Select first in-progress or first node
        const firstInProg = allNodes.find((n) => n.status === "learning") || allNodes[0];
        setSelectedNode(firstInProg);
      }
      if (!targetGoalId || !allNodes.some((n) => n.id === targetGoalId)) {
        // Default target goal is the last mastery node or final module
        const lastNode = allNodes[allNodes.length - 1];
        setTargetGoalId(lastNode?.id || "");
      }
    } else {
      setSelectedNode(null);
      setTargetGoalId("");
    }
  }, [allNodes, selectedNode, targetGoalId]);

  // Unique domains represented in user's genuine courses
  const domains = useMemo(() => {
    const set = new Set<string>();
    allNodes.forEach((n) => {
      if (n.domain) set.add(n.domain);
    });
    return Array.from(set).sort();
  }, [allNodes]);

  const filteredNodes = useMemo(() => {
    return allNodes.filter((n) => {
      const matchesCourse = selectedCourseId === "all" || n.courseId === selectedCourseId;
      const matchesDomain = selectedDomain === "all" || n.domain === selectedDomain;
      return matchesCourse && matchesDomain;
    });
  }, [allNodes, selectedCourseId, selectedDomain]);

  // Group by tier for clean visual DAG progression
  const foundationNodes = filteredNodes.filter((n) => n.tier === "foundation");
  const coreNodes = filteredNodes.filter((n) => n.tier === "core");
  const advancedNodes = filteredNodes.filter((n) => n.tier === "advanced");
  const masteryNodes = filteredNodes.filter((n) => n.tier === "mastery");

  // Gap analysis for selected target
  const gapAnalysis = useMemo(() => {
    if (!targetGoalId || allNodes.length === 0) {
      return { targetNode: undefined, missingPrerequisites: [], remediationRoadmap: [] };
    }
    return identifyPrerequisiteGaps(targetGoalId, allNodes);
  }, [targetGoalId, allNodes]);

  const getStatusBadge = (status: ConceptNode["status"]) => {
    switch (status) {
      case "mastered":
        return {
          bg: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
          label: "Mastered",
          icon: "check_circle",
        };
      case "learning":
        return {
          bg: "bg-amber-500/10 text-amber-700 border-amber-500/30",
          label: "In Progress",
          icon: "hourglass_top",
        };
      case "gap":
        return {
          bg: "bg-error/10 text-error border-error/30",
          label: "Prerequisite Gap",
          icon: "error",
        };
      default:
        return {
          bg: "bg-surface-container text-on-surface-variant border-surface-container-high",
          label: "Unlocked",
          icon: "lock_open",
        };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-pulse">
        <div className="h-28 bg-surface-container-lowest rounded-3xl border border-surface-container-high/60" />
        <div className="h-40 bg-surface-container-lowest rounded-3xl border border-surface-container-high/60" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 bg-surface-container-lowest rounded-2xl" />
            <div className="h-48 bg-surface-container-lowest rounded-2xl" />
          </div>
          <div className="h-96 bg-surface-container-lowest rounded-2xl" />
        </div>
      </div>
    );
  }

  // Meaningful Empty State when user has not enrolled in or synthesized any learning paths
  if (courses.length === 0 || allNodes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6">
        <div className="bg-gradient-to-r from-surface-container-low to-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-surface-container-high/60 shadow-xs flex items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary text-2xl">account_tree</span>
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                Dynamic Conceptual Graph
              </span>
            </div>
            <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary font-serif">
              Personal Knowledge Graph & Dependency DAG
            </h1>
            <p className="font-body-md text-sm text-on-surface-variant mt-2 leading-relaxed">
              Pencill generates conceptual knowledge graphs dynamically from your genuine learning paths,
              curriculum modules, and lesson milestones. No fake nodes or simulated activity.
            </p>
          </div>
        </div>

        <EmptyState
          icon="account_tree"
          title="Your Knowledge Graph is Empty"
          description="You are not currently enrolled in any learning pathways. Synthesize your first tailored curriculum or enroll from our open catalog to generate your interactive prerequisite dependency graph."
          actionText="Create Your First Learning Path"
          actionHref="/new-goal"
        />
      </div>
    );
  }

  return (
    <div className="space-y-space-xl max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">account_tree</span>
            <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary font-serif">
              Personal Knowledge Graph &amp; Dependency DAG
            </h1>
          </div>
          <p className="font-body-md text-sm text-on-surface-variant mt-1">
            Real curriculum concept hierarchy generated from your {courses.length} active learning {courses.length === 1 ? "path" : "paths"}.
            Click any concept to inspect prerequisites or resume learning.
          </p>
        </div>

        {/* Course & Domain Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {courses.length > 1 && (
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs text-on-surface font-semibold shadow-xs"
            >
              <option value="all">All {courses.length} Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}

          {domains.length > 1 && (
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs text-on-surface font-semibold shadow-xs"
            >
              <option value="all">All Disciplines</option>
              {domains.map((dom) => (
                <option key={dom} value={dom}>
                  {dom}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* AI Learning Gap Detector Card */}
      {gapAnalysis.targetNode && (
        <div className="bg-gradient-to-r from-surface-container-low to-surface-container-lowest p-6 rounded-3xl border border-surface-container-high/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="material-symbols-outlined text-secondary text-lg">radar</span>
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                Grounded Learning Gap Detector
              </span>
            </div>
            <h2 className="text-lg font-bold text-primary font-serif">
              Target Milestone: {gapAnalysis.targetNode.label}
            </h2>
            <p className="text-xs text-on-surface-variant mt-1 max-w-2xl leading-relaxed">
              {gapAnalysis.missingPrerequisites.length > 0
                ? `You have ${gapAnalysis.missingPrerequisites.length} uncompleted prerequisite module${
                    gapAnalysis.missingPrerequisites.length > 1 ? "s" : ""
                  } before starting "${gapAnalysis.targetNode.label}". Review and complete these units first.`
                : `All foundational prerequisite milestones for "${gapAnalysis.targetNode.label}" are fully satisfied!`}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <select
              value={targetGoalId}
              onChange={(e) => setTargetGoalId(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs text-on-surface font-semibold shadow-xs max-w-xs truncate"
            >
              {allNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  Target: {n.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Grid: Visual DAG Progression Columns & Side Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph Progression Columns (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Foundation Tier */}
          {foundationNodes.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high/60 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Tier 1: Foundational Units
                </span>
                <span className="text-[11px] text-on-surface-variant">{foundationNodes.length} Concepts</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {foundationNodes.map((node) => {
                  const badge = getStatusBadge(node.status);
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/30"
                          : "bg-surface-container-low hover:bg-surface-container border-surface-container-high/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] text-on-surface-variant uppercase font-semibold truncate">
                          {node.domain}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}
                        >
                          <span className="material-symbols-outlined text-[12px]">{badge.icon}</span>
                          {badge.label}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-primary line-clamp-1">{node.label}</h4>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-on-surface-variant">
                        <span>{node.completedLessonCount || 0}/{node.lessonCount || 0} Lessons</span>
                        <span className="font-bold text-primary">{node.masteryScore}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Core Tier */}
          {coreNodes.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high/60 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Tier 2: Core Paradigms &amp; Methods
                </span>
                <span className="text-[11px] text-on-surface-variant">{coreNodes.length} Concepts</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {coreNodes.map((node) => {
                  const badge = getStatusBadge(node.status);
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/30"
                          : "bg-surface-container-low hover:bg-surface-container border-surface-container-high/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] text-on-surface-variant uppercase font-semibold truncate">
                          {node.domain}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}
                        >
                          <span className="material-symbols-outlined text-[12px]">{badge.icon}</span>
                          {badge.label}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-primary line-clamp-1">{node.label}</h4>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-on-surface-variant">
                        <span>{node.completedLessonCount || 0}/{node.lessonCount || 0} Lessons</span>
                        <span className="font-bold text-primary">{node.masteryScore}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Advanced & Mastery Tier */}
          {(advancedNodes.length > 0 || masteryNodes.length > 0) && (
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high/60 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  Tier 3 &amp; 4: Advanced Concepts &amp; Capstones
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  {advancedNodes.length + masteryNodes.length} Concepts
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...advancedNodes, ...masteryNodes].map((node) => {
                  const badge = getStatusBadge(node.status);
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/30"
                          : "bg-surface-container-low hover:bg-surface-container border-surface-container-high/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] text-on-surface-variant uppercase font-semibold truncate">
                          {node.domain}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}
                        >
                          <span className="material-symbols-outlined text-[12px]">{badge.icon}</span>
                          {badge.label}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-primary line-clamp-1">{node.label}</h4>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-on-surface-variant">
                        <span>{node.completedLessonCount || 0}/{node.lessonCount || 0} Lessons</span>
                        <span className="font-bold text-primary">{node.masteryScore}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Concept Inspector Sidebar (1 Col) */}
        <div className="lg:col-span-1">
          {selectedNode ? (
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high/70 shadow-sm space-y-5 sticky top-24">
              <div>
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                  Curriculum Node Inspector
                </span>
                <h3 className="text-lg font-bold text-primary mt-1 font-serif">{selectedNode.label}</h3>
                <span className="text-xs text-on-surface-variant block mt-0.5">
                  {selectedNode.courseTitle || selectedNode.domain} · Tier: {selectedNode.tier}
                </span>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-container-low p-3 rounded-xl border border-surface-container-high/40">
                {selectedNode.summary}
              </p>

              {/* Real Mastery Meter */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-primary">Module Progress</span>
                  <span className="font-bold text-secondary">{selectedNode.masteryScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      selectedNode.masteryScore === 100
                        ? "bg-emerald-500"
                        : selectedNode.masteryScore > 0
                        ? "bg-amber-500"
                        : "bg-surface-variant"
                    }`}
                    style={{ width: `${selectedNode.masteryScore}%` }}
                  />
                </div>
              </div>

              {/* Direct Prerequisites */}
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                  Prerequisites ({selectedNode.prerequisites.length})
                </h4>
                {selectedNode.prerequisites.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic">
                    Foundational concept. No prior prerequisites needed.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedNode.prerequisites.map((pId) => {
                      const pNode = allNodes.find((n) => n.id === pId);
                      const isClear = (pNode?.masteryScore || 0) === 100;
                      return (
                        <div
                          key={pId}
                          onClick={() => pNode && setSelectedNode(pNode)}
                          className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-xs cursor-pointer border border-surface-container-high/40 transition-colors"
                        >
                          <span className="font-medium text-primary truncate mr-2">{pNode?.label || pId}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              isClear
                                ? "bg-emerald-500/10 text-emerald-700"
                                : "bg-error/10 text-error"
                            }`}
                          >
                            {isClear ? "Completed" : "Pending"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Direct Unlocked Downstream Concepts */}
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                  Unlocks Next ({selectedNode.unlockedConcepts.length})
                </h4>
                {selectedNode.unlockedConcepts.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic">
                    Final syllabus milestone for this learning pathway.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.unlockedConcepts.map((uId) => {
                      const uNode = allNodes.find((n) => n.id === uId);
                      return (
                        <button
                          key={uId}
                          type="button"
                          onClick={() => uNode && setSelectedNode(uNode)}
                          className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-[11px] font-semibold text-primary transition-colors border border-surface-container-high/40 truncate max-w-full"
                        >
                          {uNode?.label || uId}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Navigation Action to Actual Learning Content */}
              <div className="pt-2 flex flex-col gap-2">
                {selectedNode.courseId && selectedNode.lessonId ? (
                  <Link
                    href={`/learn/${selectedNode.courseId}/${selectedNode.lessonId}`}
                    className="w-full py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">play_lesson</span>
                    <span>
                      {selectedNode.masteryScore === 100
                        ? "Review Lesson Workspace"
                        : "Continue Learning This Unit"}
                    </span>
                  </Link>
                ) : selectedNode.courseId ? (
                  <Link
                    href={`/courses/${selectedNode.courseId}`}
                    className="w-full py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">menu_book</span>
                    <span>Open Course Syllabus</span>
                  </Link>
                ) : null}

                {selectedNode.courseId && (
                  <Link
                    href={`/courses/${selectedNode.courseId}`}
                    className="w-full py-2 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-surface-container-high/60"
                  >
                    <span className="material-symbols-outlined text-xs">format_list_bulleted</span>
                    <span>View Full Syllabus</span>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 text-xs text-on-surface-variant">
              Select any concept node in the DAG to inspect prerequisites and lesson progression.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}