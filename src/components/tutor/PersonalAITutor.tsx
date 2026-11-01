"use client";

import React, { useState, useRef, useEffect } from "react";

export type TutorPersonality =
  | "simple_teacher"
  | "socratic_tutor"
  | "exam_prep"
  | "practical_instructor"
  | "programming_mentor"
  | "research_assistant";

interface TutorMessage {
  id: string;
  sender: "user" | "tutor";
  text: string;
  timestamp: string;
}

interface PersonalAITutorProps {
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  lessonType?: string;
  studyNotes?: any;
}

const PERSONALITIES: Array<{ id: TutorPersonality; label: string; icon: string; desc: string }> = [
  { id: "simple_teacher", label: "Simple Teacher", icon: "school", desc: "Intuitive analogies & plain language" },
  { id: "socratic_tutor", label: "Socratic Tutor", icon: "help_center", desc: "Probing questions & guided hints" },
  { id: "exam_prep", label: "Exam Prep Mentor", icon: "timer", desc: "High-yield exam patterns & traps" },
  { id: "practical_instructor", label: "Practical Instructor", icon: "handyman", desc: "Real-world implementations" },
  { id: "programming_mentor", label: "Programming Mentor", icon: "terminal", desc: "Code idioms, Big-O & debugging" },
  { id: "research_assistant", label: "Research Assistant", icon: "biotech", desc: "Academic rigor & formal proofs" },
];

export default function PersonalAITutor({
  courseTitle,
  moduleTitle,
  lessonTitle,
  lessonType = "concept",
  studyNotes,
}: PersonalAITutorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [personality, setPersonality] = useState<TutorPersonality>("simple_teacher");
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: "initial-1",
      sender: "tutor",
      text: `Hello! I'm your Personal AI Tutor for **${lessonTitle}**. Ask me any question, request a plain-language analogy, or get a hint on difficult concepts.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Explain this in simple terms",
    "Give me a real-world analogy",
    "What are common mistakes here?",
    "Give me a practice hint",
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputVal).trim();
    if (!query || isSending) return;

    const userMsg: TutorMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsSending(true);

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseTitle,
          moduleTitle,
          lessonTitle,
          lessonType,
          studyNotes,
          personality,
          message: query,
          conversationHistory: messages.slice(-4).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      const data = await res.json();
      if (data.success && data.response) {
        setMessages((prev) => [
          ...prev,
          {
            id: `tut-${Date.now()}`,
            sender: "tutor",
            text: data.response,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        if (data.suggestions && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
        }
      } else {
        throw new Error(data.error || "Failed to receive tutor response");
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `tut-${Date.now()}`,
          sender: "tutor",
          text: `I encountered an issue connecting with the model. Regarding **${lessonTitle}**, remember to focus on the core foundational rules and verify dimensions and assumptions first. Feel free to try again!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Trigger Pill */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-6 z-40 bg-primary text-on-primary hover:bg-primary-container px-4 py-3 rounded-full shadow-2xl flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 group border border-white/20"
          title="Open Personal AI Tutor"
        >
          <span className="material-symbols-outlined text-xl animate-pulse">psychology</span>
          <span className="font-semibold text-xs tracking-wide">Personal AI Tutor</span>
          <span className="w-2 h-2 rounded-full bg-secondary ring-2 ring-white/40" />
        </button>
      )}

      {/* Slide-in Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-4 right-4 sm:right-6 z-50 w-[95vw] sm:w-[440px] h-[600px] max-h-[85vh] bg-surface-container-lowest text-on-surface rounded-3xl shadow-2xl border border-surface-container-high/80 flex flex-col overflow-hidden backdrop-blur-xl">
          {/* Header */}
          <div className="p-4 bg-surface-container-low border-b border-surface-container-high/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-lg">psychology</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs text-primary truncate">Personal AI Tutor</h3>
                <span className="text-[11px] text-on-surface-variant truncate block">
                  Grounding: {lessonTitle}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: `init-${Date.now()}`,
                      sender: "tutor",
                      text: `Conversation refreshed for **${lessonTitle}**. What would you like to explore next?`,
                      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    },
                  ])
                }
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                title="Clear conversation"
              >
                <span className="material-symbols-outlined text-base">restart_alt</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                title="Minimize tutor"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>

          {/* Personality Selector Strip */}
          <div className="px-3 py-2 bg-surface-container/50 border-b border-surface-container-high/40 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
            {PERSONALITIES.map((p) => {
              const isSelected = personality === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPersonality(p.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition-all ${
                    isSelected
                      ? "bg-secondary text-on-secondary shadow-xs"
                      : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
                  }`}
                  title={p.desc}
                >
                  <span className="material-symbols-outlined text-xs">{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-body-sm text-xs">
            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-primary text-on-primary rounded-br-xs"
                        : "bg-surface-container-low text-on-surface border border-surface-container-high/50 rounded-bl-xs shadow-xs"
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-on-surface-variant mt-1 px-1">
                    {m.timestamp}
                  </span>
                </div>
              );
            })}
            {isSending && (
              <div className="flex items-center gap-2 text-on-surface-variant p-2">
                <span className="material-symbols-outlined text-sm animate-spin text-secondary">
                  progress_activity
                </span>
                <span className="text-[11px]">Tutor is analyzing pedagogical context...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {suggestions.length > 0 && !isSending && (
            <div className="px-3 py-1.5 bg-surface-container/30 border-t border-surface-container-high/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(s)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-primary whitespace-nowrap transition-colors border border-surface-container-high/40"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-surface-container-low border-t border-surface-container-high/60 flex items-center gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the tutor a question..."
              className="flex-1 px-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-high/70 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputVal.trim() || isSending}
              className="p-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container disabled:opacity-40 transition-colors"
              title="Send message"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
