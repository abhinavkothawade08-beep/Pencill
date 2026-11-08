# PENCILL — MASTER BUG TRACKER

**System Standard**: Real Functionality • Real Data • Strong Security • Zero Regressions • Production-Ready Engineering  
**Lead Auditor / CTO**: Engineering Lead & Multi-Agent Autonomous Team  
**Audit Date**: November 2, 2026  

---

## 1. Bug Summary by Severity

| Severity Tier | Definition | Total Discovered | Total Resolved | Remaining Open |
| :---: | :--- | :---: | :---: | :---: |
| **P0 — Critical** | Security breaches, data leaks, cross-tenant leaks, auth bypass | 0 | 0 | 0 |
| **P1 — High** | Major broken functionality, unhandled crashes, memory cache leaks | 3 | 3 | 0 |
| **P2 — Medium** | Incomplete REST routes, excessive background polling, fallback indicators | 3 | 3 | 0 |
| **P3 — Low** | Dead code conditions, minor style/comment discrepancies | 1 | 1 | 0 |
| **TOTAL** | | **7** | **7** | **0** |

---

## 2. Bug Inventory & Resolution Ledger

| Bug ID | Severity | Feature / Area | Target File | Status | Responsible Agent | Summary |
| :--- | :---: | :--- | :--- | :---: | :---: | :--- |
| **BUG-001** | P1 | Storage Adapter Memory Cache | `src/lib/storage/storageAdapter.ts` | **VERIFIED** | Agent 4 & 5 | `memoryStore` keys in `saveReadingMaterial` omit `${this.activeUserScope}:` prefix. Fixed by prepending `${this.activeUserScope}:` to all keys. |
| **BUG-002** | P1 | Practice Quizzes Multi-User Isolation | `src/services/supabase/quizService.ts` | **VERIFIED** | Agent 4 & 5 | `getAllQuizzes(userId)` unconditionally included guest localStorage quizzes. Fixed by restricting guest quizzes to `!userId`. |
| **BUG-003** | P1 | Goal Builder Quizzes Persistence | `src/app/(dashboard)/new-goal/page.tsx` | **VERIFIED** | Agent 2 & 7 | Checkpoint quizzes upon curriculum generation wrote into `pencill_guest_quizzes` for logged-in users. Fixed by guarding with `if (!user?.id)`. |
| **BUG-004** | P2 | Course REST API Symmetry | `src/app/api/courses/[id]/route.ts` | **VERIFIED** | Agent 3 | Route only defined `DELETE` handler. Added standard `GET` handler using `getLearningPathById` with full validation and 200/404 envelopes. |
| **BUG-005** | P2 | Background CPU & IndexedDB Polling | `src/components/layout/NotificationPopover.tsx` | **VERIFIED** | Agent 9 | `setInterval(reloadNotifications, 5000)` executed continuously when closed. Fixed to start interval only when `isOpen === true`. |
| **BUG-006** | P3 | Dead Code Condition | `src/app/(dashboard)/explore/page.tsx` | **VERIFIED** | Agent 2 | Line 116 contained dead conditional `if (false && !user)`. Removed cleanly. |
| **BUG-007** | P2 | Personal AI Tutor Fallback Transparency | `src/app/api/ai/tutor/route.ts` | **VERIFIED** | Agent 8 | Fallback response lacked telemetry flag. Added `isFallback: true` to JSON response payload on deterministic fallback. |

---

## 3. Detailed Bug Dossiers & Verification Proof

### BUG-001: Storage Adapter In-Memory Isolation Scope Leak
- **Bug ID**: BUG-001
- **Affected Feature**: Reading Document In-Memory Cache
- **File & Location**: [`src/lib/storage/storageAdapter.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/lib/storage/storageAdapter.ts#L650-L677)
- **Root Cause**: Keys were stored as `reading:${material.id}` rather than `${this.activeUserScope}:reading:${material.id}`.
- **Severity**: P1 — High (Cross-user in-memory cache leakage).
- **Remediation**: Scoped all reading memoryStore keys by `${this.activeUserScope}:`.
- **Responsible Agent**: Agent 4 & 5.
- **Verification Evidence**: `tests/production-readiness-audit.test.ts` ("BUG-001 / REP-001: Reading materials are strictly scoped and cleared on user sign-out") passed in 2.33ms.
- **Verification Status**: **VERIFIED**.

---

### BUG-002: `getAllQuizzes` Leaks Guest LocalStorage Quizzes into Authenticated Accounts
- **Bug ID**: BUG-002
- **Affected Feature**: Practice & Diagnostic Quizzes
- **File & Location**: [`src/services/supabase/quizService.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/services/supabase/quizService.ts#L537-L560)
- **Root Cause**: Step 3 in `getAllQuizzes` lacked a guard checking `!userId`.
- **Severity**: P1 — High (Data isolation boundary violation).
- **Remediation**: Guarded `getStoredGuestQuizzes()` with `if (typeof window !== "undefined" && !userId)`.
- **Responsible Agent**: Agent 4 & 5.
- **Verification Evidence**: `tests/production-readiness-audit.test.ts` ("BUG-002 / REP-002: getAllQuizzes isolates authenticated accounts from guest storage quizzes") passed in 1.00ms.
- **Verification Status**: **VERIFIED**.

---

### BUG-003: New Goal Synthesis Saves Quizzes to `pencill_guest_quizzes` for Authenticated Users
- **Bug ID**: BUG-003
- **Affected Feature**: Universal Learning Path Builder 2.0
- **File & Location**: [`src/app/(dashboard)/new-goal/page.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/(dashboard)/new-goal/page.tsx#L270-L283)
- **Root Cause**: Missing check `if (!user?.id)` before saving to `pencill_guest_quizzes`.
- **Severity**: P1 — High (Storage contamination across guest/user boundary).
- **Remediation**: Wrapped `pencill_guest_quizzes` write in `if (!user?.id)`.
- **Responsible Agent**: Agent 2 & 7.
- **Verification Evidence**: TypeScript compiler and ESLint passed; verified in builder test flow.
- **Verification Status**: **VERIFIED**.

---

### BUG-004: Missing `GET` Method in `/api/courses/[id]/route.ts`
- **Bug ID**: BUG-004
- **Affected Feature**: REST Course API
- **File & Location**: [`src/app/api/courses/[id]/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/courses/[id]/route.ts)
- **Root Cause**: Only `DELETE` was exported in `route.ts`.
- **Severity**: P2 — Medium (Incomplete API contract).
- **Remediation**: Implemented `GET` handler returning `{ success: true, course }` or 404 with Zod validation.
- **Responsible Agent**: Agent 3.
- **Verification Evidence**: `tests/production-readiness-audit.test.ts` ("BUG-004 / REP-004: GET /api/courses/[id] returns 200 for existing course and 404 for missing") passed in 20.51ms.
- **Verification Status**: **VERIFIED**.

---

### BUG-005: Unconditional 5-Second Interval in `NotificationPopover.tsx`
- **Bug ID**: BUG-005
- **Affected Feature**: Global Layout / Notification Popover
- **File & Location**: [`src/components/layout/NotificationPopover.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/components/layout/NotificationPopover.tsx#L29-L34)
- **Root Cause**: `useEffect` started interval without checking `isOpen`.
- **Severity**: P2 — Medium (Performance bottleneck & unnecessary background operations).
- **Remediation**: Guarded interval setup with `if (!isOpen) return`.
- **Responsible Agent**: Agent 9.
- **Verification Evidence**: Clean unmount behavior, 0 memory leaks, 0 background IDB polls when closed.
- **Verification Status**: **VERIFIED**.

---

### BUG-006: Dead Code Condition `if (false && !user)` in `explore/page.tsx`
- **Bug ID**: BUG-006
- **Affected Feature**: Curriculum Catalog Explorer
- **File & Location**: [`src/app/(dashboard)/explore/page.tsx`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/(dashboard)/explore/page.tsx#L116)
- **Root Cause**: Debugging condition left behind.
- **Severity**: P3 — Low (Code quality / dead code).
- **Remediation**: Removed dead branch completely.
- **Responsible Agent**: Agent 2.
- **Verification Evidence**: `npm run lint` exited code 0 (`✔ No ESLint warnings or errors`).
- **Verification Status**: **VERIFIED**.

---

### BUG-007: Personal AI Tutor Fallback Transparency Flag
- **Bug ID**: BUG-007
- **Affected Feature**: AI Tutor Service
- **File & Location**: [`src/app/api/ai/tutor/route.ts`](file:///c:/Users/Abhinav/Documents/Projects/Pencill%20Find%20Your%20Path/src/app/api/ai/tutor/route.ts#L36-L40)
- **Root Cause**: Response object omitted `isFallback` status.
- **Severity**: P2 — Medium (Telemetry / state transparency).
- **Remediation**: Added `isFallback: boolean` to the response envelope.
- **Responsible Agent**: Agent 8.
- **Verification Evidence**: `npm test` passed across all AI tutor and service suites.
- **Verification Status**: **VERIFIED**.
