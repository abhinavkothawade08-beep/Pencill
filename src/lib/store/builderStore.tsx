"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import {
  BuilderConfig,
  DEFAULT_BUILDER_CONFIG_STATE,
  SelectedTopicItem,
  SelectedTopicSource,
  AdvancedLearningConfig,
} from "../types/builderConfig";
import { storageAdapter } from "../storage/storageAdapter";

interface BuilderStoreContextType {
  config: BuilderConfig;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedTime: string | null;
  hasDraft: boolean;
  canUndoReset: boolean;
  updateConfig: (updater: Partial<BuilderConfig> | ((prev: BuilderConfig) => BuilderConfig)) => void;
  updateAdvanced: <K extends keyof AdvancedLearningConfig>(key: K, val: AdvancedLearningConfig[K]) => void;
  addTopic: (topic: Omit<SelectedTopicItem, 'id'> & { id?: string }) => { added: boolean; reason?: string };
  removeTopic: (topicId: string) => void;
  renameTopic: (topicId: string, newLabel: string) => void;
  clearTopics: () => void;
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

    setConfig((prev) => ({
      ...prev,
      selectedTopics: [...prev.selectedTopics, newTopic],
    }));
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

  // Manual save draft
  const saveDraft = useCallback(async () => {
    setIsSaving(true);
    await storageAdapter.saveDraft(DRAFT_KEY, config);
    await storageAdapter.addNotification({
      type: "draft_saved",
      title: "Draft Saved",
      message: `Curriculum draft for ${config.selectedTopics.map((t) => t.label).join(", ") || "Goal"} saved locally.`,
      read: false,
    });
    setIsSaving(false);
    setIsDirty(false);
    setHasDraft(true);
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setLastSavedTime(`Saved ${timeStr}`);
  }, [config]);

  // Restore draft
  const restoreDraft = useCallback(async () => {
    const saved = await storageAdapter.getDraft<BuilderConfig>(DRAFT_KEY);
    if (saved && saved.domainId) {
      setConfig(saved);
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
        addTopic,
        removeTopic,
        renameTopic,
        clearTopics,
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
