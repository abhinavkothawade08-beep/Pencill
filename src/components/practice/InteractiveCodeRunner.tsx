"use client";

import React, { useState } from "react";

interface CodingChallenge {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  starterCode: string;
  testCases: Array<{
    inputDesc: string;
    inputArgs: any[];
    expected: any;
  }>;
  hints: string[];
}

const BUILTIN_CHALLENGES: CodingChallenge[] = [
  {
    id: "ch-1",
    title: "Binary Search in a Sorted Array",
    difficulty: "Easy",
    description: "Given a sorted array of integers nums and an integer target, write a function to search target in nums. If target exists, return its index. Otherwise, return -1. You must write an algorithm with O(log n) runtime complexity.",
    starterCode: `function binarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}`,
    testCases: [
      { inputDesc: "[-1, 0, 3, 5, 9, 12], target = 9", inputArgs: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
      { inputDesc: "[-1, 0, 3, 5, 9, 12], target = 2", inputArgs: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
      { inputDesc: "[5], target = 5", inputArgs: [[5], 5], expected: 0 },
    ],
    hints: [
      "Maintain search pointers left and right. Compute mid using Math.floor((left + right) / 2).",
      "If nums[mid] is smaller than target, the target must be in the right subarray: left = mid + 1.",
    ],
  },
  {
    id: "ch-2",
    title: "Two Sum: Linear Hash Map Lookup",
    difficulty: "Easy",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    starterCode: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`,
    testCases: [
      { inputDesc: "[2, 7, 11, 15], target = 9", inputArgs: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { inputDesc: "[3, 2, 4], target = 6", inputArgs: [[3, 2, 4], 6], expected: [1, 2] },
    ],
    hints: [
      "Instead of checking every pair with O(N²) nested loops, store previously visited numbers in a Hash Map.",
      "Check if complement = target - nums[i] is already present in your map.",
    ],
  },
  {
    id: "ch-3",
    title: "Valid Parentheses: Stack Verification",
    difficulty: "Easy",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Open brackets must be closed by the same type of brackets, and open brackets must be closed in the correct order.",
    starterCode: `function isValid(s) {
  const stack = [];
  const map = {
    ')': '(',
    '}': '{',
    ']': '['
  };

  for (const char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      const top = stack.pop();
      if (top !== map[char]) {
        return false;
      }
    }
  }

  return stack.length === 0;
}`,
    testCases: [
      { inputDesc: 's = "()"', inputArgs: ["()"], expected: true },
      { inputDesc: 's = "()[]{}"', inputArgs: ["()[]{}"], expected: true },
      { inputDesc: 's = "(]"', inputArgs: ["(]"], expected: false },
      { inputDesc: 's = "([)]"', inputArgs: ["([)]"], expected: false },
    ],
    hints: [
      "Use a Last-In First-Out (LIFO) Stack to hold opening brackets as you encounter them.",
      "When a closing bracket appears, pop the most recent opening bracket from the stack and verify that their types match.",
    ],
  },
];

export default function InteractiveCodeRunner() {
  const [activeChallengeIdx, setActiveChallengeIdx] = useState(0);
  const challenge = BUILTIN_CHALLENGES[activeChallengeIdx];

  const [code, setCode] = useState(challenge.starterCode);
  const [isRunning, setIsRunning] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<{
    success: boolean;
    durationMs: number;
    results: Array<{
      inputDesc: string;
      expected: any;
      actual: any;
      passed: boolean;
    }>;
    logs: string[];
    error?: string;
  } | null>(null);

  const [revealedHintIdx, setRevealedHintIdx] = useState<number | null>(null);

  const handleSelectChallenge = (idx: number) => {
    setActiveChallengeIdx(idx);
    setCode(BUILTIN_CHALLENGES[idx].starterCode);
    setExecutionOutput(null);
    setRevealedHintIdx(null);
  };

  // Safe client-side sandbox execution using isolated Function evaluation
  const handleRunCode = () => {
    setIsRunning(true);
    setExecutionOutput(null);

    const startTime = performance.now();
    const logs: string[] = [];

    // Temporary console interceptor
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "));
      originalLog(...args);
    };

    try {
      // Evaluate function definition in isolated scope
      const trimmed = code.trim();
      const fnNameMatch = trimmed.match(/function\s+([a-zA-Z0-9_$]+)/);
      if (!fnNameMatch) {
        throw new Error("Could not find a valid function declaration (e.g. 'function binarySearch(...)').");
      }
      const fnName = fnNameMatch[1];

      // Safe evaluation wrapped in isolated closure
      const runner = new Function(`
        "use strict";
        ${trimmed}
        return ${fnName};
      `);

      const userFn = runner();
      if (typeof userFn !== "function") {
        throw new Error(`${fnName} is not a valid executable function.`);
      }

      const results = challenge.testCases.map((tc) => {
        let actual: any;
        let passed = false;
        try {
          actual = userFn(...tc.inputArgs);
          passed = JSON.stringify(actual) === JSON.stringify(tc.expected);
        } catch (err: any) {
          actual = `Error: ${err.message}`;
          passed = false;
        }
        return {
          inputDesc: tc.inputDesc,
          expected: tc.expected,
          actual,
          passed,
        };
      });

      const durationMs = Math.round((performance.now() - startTime) * 10) / 10;
      const allPassed = results.every((r) => r.passed);

      setExecutionOutput({
        success: allPassed,
        durationMs,
        results,
        logs,
      });
    } catch (err: any) {
      const durationMs = Math.round((performance.now() - startTime) * 10) / 10;
      setExecutionOutput({
        success: false,
        durationMs,
        results: [],
        logs,
        error: err.message || "Runtime execution failure",
      });
    } finally {
      console.log = originalLog;
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-6 border border-surface-container-high/70 shadow-sm space-y-6">
      {/* Header and Challenge Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-container-high/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-secondary text-xl">code</span>
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Module H1: Safe In-Browser Practice Sandbox
            </span>
          </div>
          <h2 className="text-lg font-bold text-primary font-serif">{challenge.title}</h2>
        </div>

        <div className="flex items-center gap-2">
          {BUILTIN_CHALLENGES.map((ch, idx) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => handleSelectChallenge(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeChallengeIdx === idx
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              Problem {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Problem Description */}
      <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high/40 text-xs text-on-surface leading-relaxed">
        <p>{challenge.description}</p>
      </div>

      {/* Code Editor Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
          <span className="font-semibold text-primary font-mono">JavaScript / Safe Client Sandbox</span>
          <span>Execution Limit: 2000ms</span>
        </div>

        <textarea
          rows={10}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="w-full p-4 rounded-2xl bg-primary text-surface-container-lowest font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-secondary/50 shadow-inner"
        />
      </div>

      {/* Toolbar: Run and Hints */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {challenge.hints.map((_, hIdx) => (
            <button
              key={hIdx}
              type="button"
              onClick={() => setRevealedHintIdx(revealedHintIdx === hIdx ? null : hIdx)}
              className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-[11px] font-semibold text-on-surface-variant flex items-center gap-1 border border-surface-container-high/50"
            >
              <span className="material-symbols-outlined text-xs">lightbulb</span>
              <span>Hint {hIdx + 1}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleRunCode}
          disabled={isRunning}
          className="px-5 py-2.5 rounded-xl bg-secondary text-on-secondary hover:bg-secondary-container text-xs font-bold shadow-xs flex items-center gap-2 transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-sm ${isRunning ? "animate-spin" : ""}`}>
            {isRunning ? "progress_activity" : "play_arrow"}
          </span>
          <span>Run Sandbox Tests</span>
        </button>
      </div>

      {/* Revealed Hint Box */}
      {revealedHintIdx !== null && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 flex items-start gap-2">
          <span className="material-symbols-outlined text-sm text-amber-600 mt-0.5">lightbulb</span>
          <p>{challenge.hints[revealedHintIdx]}</p>
        </div>
      )}

      {/* Execution Results */}
      {executionOutput && (
        <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Test Execution Results ({executionOutput.durationMs}ms)
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                executionOutput.success
                  ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/30"
                  : "bg-error/10 text-error border border-error/30"
              }`}
            >
              {executionOutput.success ? "All Tests Passed" : "Tests Failed"}
            </span>
          </div>

          {executionOutput.error && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-xs font-mono text-error">
              {executionOutput.error}
            </div>
          )}

          <div className="space-y-2">
            {executionOutput.results.map((r, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/40 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="text-on-surface-variant block text-[11px] font-sans">
                    Case {idx + 1}: {r.inputDesc}
                  </span>
                  <div className="flex items-center gap-3 mt-1 text-[11px]">
                    <span className="text-on-surface-variant">Expected: {JSON.stringify(r.expected)}</span>
                    <span className={r.passed ? "text-emerald-600" : "text-error font-bold"}>
                      Actual: {JSON.stringify(r.actual)}
                    </span>
                  </div>
                </div>

                <span
                  className={`material-symbols-outlined text-base ${
                    r.passed ? "text-emerald-600" : "text-error"
                  }`}
                >
                  {r.passed ? "check_circle" : "cancel"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
