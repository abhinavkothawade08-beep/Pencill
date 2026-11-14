"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import {
  BuilderConfig,
  DEFAULT_BUILDER_CONFIG_STATE,
  SelectedTopicItem,
  SelectedTopicSource,
  AdvancedLearningConfig,
  LearningObjectiveItem,
  CustomTeachingMix,
  TeachingStyleType,
  DifficultyPreferenceType,
} from "../types/builderConfig";
import { storageAdapter } from "../storage/storageAdapter";
import {
  sanitizeInputObjectives,
  sanitizeInputSubtopics,
  sanitizeInputPrerequisites,
} from "../curriculum-intelligence/topic-consistency-validator";

interface BuilderStoreContextType {
  config: BuilderConfig;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedTime: string | null;
  hasDraft: boolean;
  canUndoReset: boolean;
  updateConfig: (updater: Partial<BuilderConfig> | ((prev: BuilderConfig) => BuilderConfig)) => void;
  updateAdvanced: <K extends keyof AdvancedLearningConfig>(key: K, val: AdvancedLearningConfig[K]) => void;
  setTitle: (title: string) => void;
  addTopic: (topic: Omit<SelectedTopicItem, 'id'> & { id?: string }) => { added: boolean; reason?: string };
  removeTopic: (topicId: string) => void;
  renameTopic: (topicId: string, newLabel: string) => void;
  clearTopics: () => void;
  setTeachingStyle: (style: TeachingStyleType) => void;
  setCustomTeachingMix: (mix: CustomTeachingMix) => void;
  setDifficultyPreference: (pref: DifficultyPreferenceType) => void;
  addLearningObjective: (text: string, successCriteria?: string) => void;
  updateLearningObjective: (id: string, text: string, successCriteria?: string) => void;
  removeLearningObjective: (id: string) => void;
  addPrerequisite: (concept: string) => void;
  removePrerequisite: (concept: string) => void;
  addKnownConcept: (concept: string) => void;
  removeKnownConcept: (concept: string) => void;
  addDifficultConcept: (concept: string) => void;
  removeDifficultConcept: (concept: string) => void;
  addExcludedTopic: (topic: string) => void;
  removeExcludedTopic: (topic: string) => void;
  toggleEducatorPreference: (educatorId: string) => void;
  toggleRepositoryPreference: (repo: string) => void;
  toggleModality: (modalityKey: keyof BuilderConfig['modalities']) => { success: boolean; reason?: string };
  updateSchedule: (schedule: Partial<BuilderConfig['scheduleSettings']>) => void;
  updateLanguageSettings: (settings: Partial<BuilderConfig['languageSettings']>) => void;
  updateCurriculumOverride: (override: { moduleIndex: number; title: string; customObjectives?: string[]; isRemoved?: boolean }) => void;
  reorderCurriculumModules: (fromIndex: number, toIndex: number) => void;
  resetCurriculumOverrides: () => void;
  saveDraft: () => Promise<void>;
  restoreDraft: () => Promise<boolean>;
  resetToDefaults: () => void;
  undoReset: () => void;
}

const BuilderStoreContext = createContext<BuilderStoreContextType | null>(null);

const DRAFT_KEY = "builder_config_draft";

export function BuilderStoreProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<BuilderConfig>(() => ({ ...DEFAULT_BUILDER_CONFIG_STATE }));
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [previousConfigBeforeReset, setPreviousConfigBeforeReset] = useState<BuilderConfig | null>(null);
  const [canUndoReset, setCanUndoReset] = useState(false);

  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const undoResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(false);

  // Check storage on mount for existing draft
  useEffect(() => {
    let isMounted = true;
    storageAdapter.getDraft<BuilderConfig>(DRAFT_KEY).then((draft) => {
      if (!isMounted) return;
      if (draft && draft.domainId) {
        setHasDraft(true);
      }
      initialLoadRef.current = true;
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Beforeunload listener when dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes in your curriculum builder. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Reset store on auth state reset (logout/account switch)
  useEffect(() => {
    const handleAuthReset = () => {
      setConfig({ ...DEFAULT_BUILDER_CONFIG_STATE });
      setHasDraft(false);
      setIsDirty(false);
      setLastSavedTime(null);
      setPreviousConfigBeforeReset(null);
      setCanUndoReset(false);
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };

    window.addEventListener("pencill:auth-state-reset", handleAuthReset);
    return () => window.removeEventListener("pencill:auth-state-reset", handleAuthReset);
  }, []);

  // Autosave after 2s idle when dirty
  useEffect(() => {
    if (!initialLoadRef.current || !isDirty) return;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(() => {
      storageAdapter.saveDraft(DRAFT_KEY, config).then(() => {
        setIsSaving(false);
        setIsDirty(false);
        setHasDraft(true);
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
        setLastSavedTime(`Saved ${timeStr}`);
      });
    }, 2000);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [config, isDirty]);

  // Master config updater
  const updateConfig = useCallback((updater: Partial<BuilderConfig> | ((prev: BuilderConfig) => BuilderConfig)) => {
    setConfig((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      return next;
    });
    setIsDirty(true);
  }, []);

  // Specialized advanced updater
  const updateAdvanced = useCallback(<K extends keyof AdvancedLearningConfig>(key: K, val: AdvancedLearningConfig[K]) => {
    setConfig((prev) => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        [key]: val,
      },
    }));
    setIsDirty(true);
  }, []);

  const setTitle = useCallback((title: string) => {
    updateConfig((prev) => {
      const cleanTitle = title.trim();
      if (!cleanTitle) return { ...prev, title };

      const sanitizedObjectives = sanitizeInputObjectives(prev.learningObjectives || [], cleanTitle);
      const sanitizedSubtopics = sanitizeInputSubtopics(prev.subtopics || [], cleanTitle);
      const sanitizedPrereqs = sanitizeInputPrerequisites(prev.prerequisites || [], cleanTitle);
      const sanitizedKnown = sanitizeInputPrerequisites(prev.knownConcepts || [], cleanTitle);
      const sanitizedDifficult = sanitizeInputSubtopics(prev.difficultConcepts || [], cleanTitle);

      return {
        ...prev,
        title,
        learningObjectives: sanitizedObjectives,
        subtopics: sanitizedSubtopics,
        prerequisites: sanitizedPrereqs,
        knownConcepts: sanitizedKnown,
        difficultConcepts: sanitizedDifficult,
      };
    });
  }, [updateConfig]);

  // Topic management
  const addTopic = useCallback((topic: Omit<SelectedTopicItem, 'id'> & { id?: string }) => {
    const cleanLabel = topic.label ? topic.label.trim() : "";
    if (!cleanLabel) {
      return { added: false, reason: "Topic name cannot be empty or whitespace only." };
    }
    if (cleanLabel.length < 3) {
      return { added: false, reason: "Topic must be at least 3 characters long." };
    }

    const currentConfig = configRef.current;
    if (currentConfig.selectedTopics.length >= 8) {
      return { added: false, reason: "Maximum limit of 8 topics reached. Remove a topic to add another." };
    }

    const exists = currentConfig.selectedTopics.some((t) => t.label.toLowerCase() === cleanLabel.toLowerCase());
    if (exists) {
      return { added: false, reason: `Topic "${cleanLabel}" is already selected.` };
    }

    const topicId = topic.id || `topic-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTopic: SelectedTopicItem = {
      id: topicId,
      label: cleanLabel,
      source: topic.source || "custom",
      complexity: topic.complexity || 3,
      prereqs: topic.prereqs || [],
    };

    setConfig((prev) => {
      const isDefaultPhysics =
        prev.selectedTopics.length === 1 &&
        prev.selectedTopics[0].label.toLowerCase().includes('class 11 mechanics');

      const baseTopics = isDefaultPhysics ? [] : prev.selectedTopics;
      const nextTopics = [...baseTopics, newTopic];
      const primaryTopic = nextTopics[0]?.label || cleanLabel;

      const sanitizedObjectives = sanitizeInputObjectives(prev.learningObjectives || [], primaryTopic);
      const sanitizedSubtopics = sanitizeInputSubtopics(prev.subtopics || [], primaryTopic);
      const sanitizedPrereqs = sanitizeInputPrerequisites(prev.prerequisites || [], primaryTopic);
      const sanitizedKnown = sanitizeInputPrerequisites(prev.knownConcepts || [], primaryTopic);
      const sanitizedDifficult = sanitizeInputSubtopics(prev.difficultConcepts || [], primaryTopic);

      return {
        ...prev,
        selectedTopics: nextTopics,
        learningObjectives: sanitizedObjectives,
        subtopics: sanitizedSubtopics,
        prerequisites: sanitizedPrereqs,
        knownConcepts: sanitizedKnown,
        difficultConcepts: sanitizedDifficult,
      };
    });
    setIsDirty(true);

    storageAdapter.addRecent({
      label: cleanLabel,
      type: "topic",
      domainId: currentConfig.domainId,
      subjectId: currentConfig.subjectId,
    });

    return { added: true };
  }, []);

  const removeTopic = useCallback((topicId: string) => {
    setConfig((prev) => ({
      ...prev,
      selectedTopics: prev.selectedTopics.filter((t) => t.id !== topicId),
    }));
    setIsDirty(true);
  }, []);

  const renameTopic = useCallback((topicId: string, newLabel: string) => {
    const clean = newLabel.trim();
    if (!clean) return;
    setConfig((prev) => ({
      ...prev,
      selectedTopics: prev.selectedTopics.map((t) => (t.id === topicId ? { ...t, label: clean } : t)),
    }));
    setIsDirty(true);
  }, []);

  const clearTopics = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      selectedTopics: [],
    }));
    setIsDirty(true);
  }, []);

  // Teaching Style
  const setTeachingStyle = useCallback((style: TeachingStyleType) => {
    updateConfig({ teachingStyle: style });
  }, [updateConfig]);

  const setCustomTeachingMix = useCallback((mix: CustomTeachingMix) => {
    updateConfig({ customTeachingMix: mix });
  }, [updateConfig]);

  const setDifficultyPreference = useCallback((pref: DifficultyPreferenceType) => {
    updateConfig({ difficultyPreference: pref });
  }, [updateConfig]);

  // Learning Objectives
  const addLearningObjective = useCallback((text: string, successCriteria?: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;
    const newObj: LearningObjectiveItem = {
      id: `lo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: cleanText,
      successCriteria: successCriteria?.trim(),
    };
    setConfig((prev) => ({
      ...prev,
      learningObjectives: [...(prev.learningObjectives || []), newObj],
    }));
    setIsDirty(true);
  }, []);

  const updateLearningObjective = useCallback((id: string, text: string, successCriteria?: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;
    setConfig((prev) => ({
      ...prev,
      learningObjectives: (prev.learningObjectives || []).map((lo) =>
        lo.id === id ? { ...lo, text: cleanText, successCriteria: successCriteria?.trim() } : lo
      ),
    }));
    setIsDirty(true);
  }, []);

  const removeLearningObjective = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      learningObjectives: (prev.learningObjectives || []).filter((lo) => lo.id !== id),
    }));
    setIsDirty(true);
  }, []);

  // Prerequisites
  const addPrerequisite = useCallback((concept: string) => {
    const clean = concept.trim();
    if (!clean) return;
    setConfig((prev) => {
      const list = prev.prerequisites || [];
      if (list.some((c) => c.toLowerCase() === clean.toLowerCase())) return prev;
      return { ...prev, prerequisites: [...list, clean] };
    });
    setIsDirty(true);
  }, []);

  const removePrerequisite = useCallback((concept: string) => {
    setConfig((prev) => ({
      ...prev,
      prerequisites: (prev.prerequisites || []).filter((c) => c !== concept),
    }));
    setIsDirty(true);
  }, []);

  // Known Concepts
  const addKnownConcept = useCallback((concept: string) => {
    const clean = concept.trim();
    if (!clean) return;
    setConfig((prev) => {
      const list = prev.knownConcepts || [];
      if (list.some((c) => c.toLowerCase() === clean.toLowerCase())) return prev;
      return { ...prev, knownConcepts: [...list, clean] };
    });
    setIsDirty(true);
  }, []);

  const removeKnownConcept = useCallback((concept: string) => {
    setConfig((prev) => ({
      ...prev,
      knownConcepts: (prev.knownConcepts || []).filter((c) => c !== concept),
    }));
    setIsDirty(true);
  }, []);

  // Difficult Concepts
  const addDifficultConcept = useCallback((concept: string) => {
    const clean = concept.trim();
    if (!clean) return;
    setConfig((prev) => {
      const list = prev.difficultConcepts || [];
      if (list.some((c) => c.toLowerCase() === clean.toLowerCase())) return prev;
      return { ...prev, difficultConcepts: [...list, clean] };
    });
    setIsDirty(true);
  }, []);

  const removeDifficultConcept = useCallback((concept: string) => {
    setConfig((prev) => ({
      ...prev,
      difficultConcepts: (prev.difficultConcepts || []).filter((c) => c !== concept),
    }));
    setIsDirty(true);
  }, []);

  // Excluded Topics
  const addExcludedTopic = useCallback((topic: string) => {
    const clean = topic.trim();
    if (!clean) return;
    setConfig((prev) => {
      const list = prev.excludedTopics || [];
      if (list.some((c) => c.toLowerCase() === clean.toLowerCase())) return prev;
      return { ...prev, excludedTopics: [...list, clean] };
    });
    setIsDirty(true);
  }, []);

  const removeExcludedTopic = useCallback((topic: string) => {
    setConfig((prev) => ({
      ...prev,
      excludedTopics: (prev.excludedTopics || []).filter((t) => t !== topic),
    }));
    setIsDirty(true);
  }, []);

  // Educators & Repositories
  const toggleEducatorPreference = useCallback((educatorId: string) => {
    setConfig((prev) => {
      const list = prev.educatorPreferences?.preferredEducatorIds || [];
      const nextList = list.includes(educatorId)
        ? list.filter((id) => id !== educatorId)
        : [...list, educatorId];
      return {
        ...prev,
        educatorPreferences: {
          ...prev.educatorPreferences,
          preferredEducatorIds: nextList,
        },
      };
    });
    setIsDirty(true);
  }, []);

  const toggleRepositoryPreference = useCallback((repo: string) => {
    setConfig((prev) => {
      const list = prev.repositoryPreferences?.preferredRepositories || [];
      const nextList = list.includes(repo)
        ? (list.length <= 1 ? list : list.filter((r) => r !== repo))
        : [...list, repo];
      return {
        ...prev,
        repositoryPreferences: {
          ...prev.repositoryPreferences,
          preferredRepositories: nextList,
        },
        advanced: {
          ...prev.advanced,
          repositories: nextList,
        },
      };
    });
    setIsDirty(true);
  }, []);

  // Modality toggle with safety invariant
  const toggleModality = useCallback((key: keyof BuilderConfig['modalities']) => {
    const current = configRef.current.modalities;
    const isCurrentlyOn = current[key];
    const activeCount = Object.values(current).filter(Boolean).length;

    if (isCurrentlyOn && activeCount <= 1) {
      return { success: false, reason: "At least one pedagogical modality must remain enabled." };
    }

    setConfig((prev) => ({
      ...prev,
      modalities: {
        ...prev.modalities,
        [key]: !isCurrentlyOn,
      },
    }));
    setIsDirty(true);
    return { success: true };
  }, []);

  // Schedule & Language
  const updateSchedule = useCallback((schedule: Partial<BuilderConfig['scheduleSettings']>) => {
    setConfig((prev) => ({
      ...prev,
      scheduleSettings: {
        ...prev.scheduleSettings,
        ...schedule,
      },
      deadline: schedule.targetCompletionDate !== undefined ? (schedule.targetCompletionDate || null) : prev.deadline,
    }));
    setIsDirty(true);
  }, []);

  const updateLanguageSettings = useCallback((settings: Partial<BuilderConfig['languageSettings']>) => {
    setConfig((prev) => ({
      ...prev,
      languageSettings: {
        ...prev.languageSettings,
        ...settings,
      },
      language: settings.explanationLanguage || prev.language,
    }));
    setIsDirty(true);
  }, []);

  // Curriculum Blueprint Overrides
  const updateCurriculumOverride = useCallback((override: { moduleIndex: number; title: string; customObjectives?: string[]; isRemoved?: boolean }) => {
    setConfig((prev) => {
      const existing = prev.curriculumBlueprintOverrides || [];
      const idx = existing.findIndex((o) => o.moduleIndex === override.moduleIndex);
      let updated: typeof existing;
      if (idx >= 0) {
        updated = existing.map((o) => (o.moduleIndex === override.moduleIndex ? { ...o, ...override } : o));
      } else {
        updated = [...existing, override];
      }
      return {
        ...prev,
        curriculumBlueprintOverrides: updated,
      };
    });
    setIsDirty(true);
  }, []);

  const reorderCurriculumModules = useCallback((fromIndex: number, toIndex: number) => {
    setConfig((prev) => {
      const overrides = [...(prev.curriculumBlueprintOverrides || [])];
      // Store a custom reorder marker or swap
      const existingFrom = overrides.find((o) => o.moduleIndex === fromIndex);
      const existingTo = overrides.find((o) => o.moduleIndex === toIndex);
      
      const newOverrides = overrides.filter((o) => o.moduleIndex !== fromIndex && o.moduleIndex !== toIndex);
      if (existingFrom) newOverrides.push({ ...existingFrom, moduleIndex: toIndex });
      else newOverrides.push({ moduleIndex: toIndex, title: `Module ${fromIndex + 1}` });

      if (existingTo) newOverrides.push({ ...existingTo, moduleIndex: fromIndex });
      else newOverrides.push({ moduleIndex: fromIndex, title: `Module ${toIndex + 1}` });

      return {
        ...prev,
        curriculumBlueprintOverrides: newOverrides,
      };
    });
    setIsDirty(true);
  }, []);

  const resetCurriculumOverrides = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      curriculumBlueprintOverrides: [],
    }));
    setIsDirty(true);
  }, []);

  // Manual save draft
  const saveDraft = useCallback(async () => {
    setIsSaving(true);
    await storageAdapter.saveDraft(DRAFT_KEY, config);
    await storageAdapter.addNotification({
      type: "draft_saved",
      title: "Draft Saved",
      message: `Curriculum draft for ${config.title || config.selectedTopics.map((t) => t.label).join(", ") || "Goal"} saved locally.`,
      read: false,
    });
    setIsSaving(false);
    setIsDirty(false);
    setHasDraft(true);
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setLastSavedTime(`Saved ${timeStr}`);
  }, [config]);

  // Restore draft with safe schema hydration
  const restoreDraft = useCallback(async () => {
    const saved = await storageAdapter.getDraft<BuilderConfig>(DRAFT_KEY);
    if (saved && saved.domainId) {
      const hydrated: BuilderConfig = {
        ...DEFAULT_BUILDER_CONFIG_STATE,
        ...saved,
        modalities: {
          ...DEFAULT_BUILDER_CONFIG_STATE.modalities,
          ...(saved.modalities || {}),
        },
        advanced: {
          ...DEFAULT_BUILDER_CONFIG_STATE.advanced,
          ...(saved.advanced || {}),
        },
        learningObjectives: saved.learningObjectives?.length
          ? saved.learningObjectives
          : DEFAULT_BUILDER_CONFIG_STATE.learningObjectives,
        prerequisites: saved.prerequisites?.length
          ? saved.prerequisites
          : DEFAULT_BUILDER_CONFIG_STATE.prerequisites,
        videoPreferences: {
          ...DEFAULT_BUILDER_CONFIG_STATE.videoPreferences,
          ...(saved.videoPreferences || {}),
        },
        readingPreferences: {
          ...DEFAULT_BUILDER_CONFIG_STATE.readingPreferences,
          ...(saved.readingPreferences || {}),
        },
        practicePreferences: {
          ...DEFAULT_BUILDER_CONFIG_STATE.practicePreferences,
          ...(saved.practicePreferences || {}),
        },
        assessmentPreferences: {
          ...DEFAULT_BUILDER_CONFIG_STATE.assessmentPreferences,
          ...(saved.assessmentPreferences || {}),
        },
        repositoryPreferences: {
          ...DEFAULT_BUILDER_CONFIG_STATE.repositoryPreferences,
          ...(saved.repositoryPreferences || {}),
        },
        educatorPreferences: {
          ...DEFAULT_BUILDER_CONFIG_STATE.educatorPreferences,
          ...(saved.educatorPreferences || {}),
        },
        scheduleSettings: {
          ...DEFAULT_BUILDER_CONFIG_STATE.scheduleSettings,
          ...(saved.scheduleSettings || {}),
        },
        languageSettings: {
          ...DEFAULT_BUILDER_CONFIG_STATE.languageSettings,
          ...(saved.languageSettings || {}),
        },
      };
      setConfig(hydrated);
      setIsDirty(false);
      return true;
    }
    return false;
  }, []);

  // Reset with 10s undo
  const resetToDefaults = useCallback(() => {
    setPreviousConfigBeforeReset({ ...config });
    setConfig({ ...DEFAULT_BUILDER_CONFIG_STATE });
    setIsDirty(false);
    setCanUndoReset(true);

    if (undoResetTimerRef.current) clearTimeout(undoResetTimerRef.current);
    undoResetTimerRef.current = setTimeout(() => {
      setCanUndoReset(false);
      setPreviousConfigBeforeReset(null);
    }, 10000);
  }, [config]);

  const undoReset = useCallback(() => {
    if (previousConfigBeforeReset) {
      setConfig(previousConfigBeforeReset);
      setPreviousConfigBeforeReset(null);
      setCanUndoReset(false);
      setIsDirty(true);
    }
  }, [previousConfigBeforeReset]);

  return (
    <BuilderStoreContext.Provider
      value={{
        config,
        isDirty,
        isSaving,
        lastSavedTime,
        hasDraft,
        canUndoReset,
        updateConfig,
        updateAdvanced,
        setTitle,
        addTopic,
        removeTopic,
        renameTopic,
        clearTopics,
        setTeachingStyle,
        setCustomTeachingMix,
        setDifficultyPreference,
        addLearningObjective,
        updateLearningObjective,
        removeLearningObjective,
        addPrerequisite,
        removePrerequisite,
        addKnownConcept,
        removeKnownConcept,
        addDifficultConcept,
        removeDifficultConcept,
        addExcludedTopic,
        removeExcludedTopic,
        toggleEducatorPreference,
        toggleRepositoryPreference,
        toggleModality,
        updateSchedule,
        updateLanguageSettings,
        updateCurriculumOverride,
        reorderCurriculumModules,
        resetCurriculumOverrides,
        saveDraft,
        restoreDraft,
        resetToDefaults,
        undoReset,
      }}
    >
      {children}
    </BuilderStoreContext.Provider>
  );
}

export function useBuilderStore() {
  const ctx = useContext(BuilderStoreContext);
  if (!ctx) {
    throw new Error("useBuilderStore must be used within a BuilderStoreProvider");
  }
  return ctx;
}
