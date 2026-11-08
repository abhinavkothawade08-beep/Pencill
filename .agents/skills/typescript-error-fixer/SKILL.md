---
name: typescript-error-fixer
description: >-
  Parse, diagnose, and resolve TypeScript compiler errors (TS2322, TS2345, TS2769, etc.) by repairing type definitions, generics, and nullability contracts. Use when 'npx tsc --noEmit' fails.
---

# Automated TypeScript Error Resolution

> **Category**: Automated Debugging & Root Cause Analysis  
> **Specialist Subagent**: `architect`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Rapidly resolve TypeScript compilation errors without disabling strict compiler checks.**: Rapidly resolve TypeScript compilation errors without disabling strict compiler checks.
2. **Align property types, nullability modifiers, and generic constraints between caller and callee.**: Align property types, nullability modifiers, and generic constraints between caller and callee.
3. **Preserve intended business semantics while satisfying the TypeScript type checker.**: Preserve intended business semantics while satisfying the TypeScript type checker.

---

## 2. Standard Operating Procedures (SOP)

1. Run 'npx tsc --noEmit' and capture the compiler diagnostics with line numbers and TS error codes.
2. Analyze the compiler message: identify expected type vs provided type.
3. Inspect the declaration of the target type and the expression supplying the value.
4. Adjust the source code to provide the required structural shape, or refine the type signature.
5. Re-run 'npx tsc --noEmit' to ensure zero remaining errors.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx tsc --noEmit
npx tsc --noEmit --pretty
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never suppress type errors with '// @ts-ignore' or '// @ts-nocheck'.
- **Guard**: Never cast away type errors using 'as any' or loose type assertions.
- **Guard**: Never make mandatory schema fields optional just to bypass compiler errors.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify 'npx tsc --noEmit' exits with code 0.
- [ ] Verify all function signatures accurately reflect input and output types.
- [ ] Verify existing tests continue to pass after type adjustments.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `architect`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
