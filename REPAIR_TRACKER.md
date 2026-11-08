# PENCILL — REPAIR TRACKER
**Master Engineering Remediation Ledger**

---

## Active Remediation Queue

| Repair ID | Associated Bug ID | Target Module / File | Responsible Agent | Proposed Approach | Status | Verified By |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **REP-001** | BUG-001 | `src/lib/storage/storageAdapter.ts` | Agent 4 & 5 | Scoped reading materials in `memoryStore` with `${this.activeUserScope}:` prefix so `clearCurrentUserData` evicts them properly. | **VERIFIED** | QA & Reviewer |
| **REP-002** | BUG-002 | `src/services/supabase/quizService.ts` | Agent 4 & 5 | Prevent loading guest quizzes from localStorage when an authenticated `userId` is passed to `getAllQuizzes`. | **VERIFIED** | QA & Reviewer |
| **REP-003** | BUG-003 | `src/app/(dashboard)/new-goal/page.tsx` | Agent 2 & 7 | Guard writing to `pencill_guest_quizzes` with `if (!user?.id)` to prevent guest storage pollution from logged-in users. | **VERIFIED** | QA & Reviewer |
| **REP-004** | BUG-004 | `src/app/api/courses/[id]/route.ts` | Agent 3 | Added standard `GET` handler using `getLearningPathById` with full Zod validation and 200/404 response envelopes. | **VERIFIED** | QA & Reviewer |
| **REP-005** | BUG-005 | `src/components/layout/NotificationPopover.tsx` | Agent 9 | Starts `setInterval(reloadNotifications, 5000)` only when `isOpen` is `true`. | **VERIFIED** | QA & Reviewer |
| **REP-006** | BUG-006 | `src/app/(dashboard)/explore/page.tsx` | Agent 2 | Removed dead code condition `if (false && !user)`. | **VERIFIED** | QA & Reviewer |
| **REP-007** | BUG-007 | `src/app/api/ai/tutor/route.ts` | Agent 8 | Included `isFallback: true` flag in tutor response when deterministic fallback activates. | **VERIFIED** | QA & Reviewer |

---

## Remediation Audit Trail

1. **REP-001 Diff Summary**:
   - Updated `saveReadingMaterial`, `getReadingMaterialById`, and `getReadingMaterialByLesson` in `storageAdapter.ts`.
   - In-memory key mapping updated from `reading:${id}` to `${this.activeUserScope}:reading:${id}`.
   - Cleared on `clearCurrentUserData()` and isolated during user transitions.

2. **REP-002 Diff Summary**:
   - In `quizService.ts`, modified Step 3 of `getAllQuizzes`.
   - Changed `if (typeof window !== "undefined")` to `if (typeof window !== "undefined" && !userId)`.
   - Ensures authenticated accounts receive only database-persisted and user-attributed quizzes.

3. **REP-003 Diff Summary**:
   - In `new-goal/page.tsx`, conditioned `pencill_guest_quizzes` localStorage write with `!user?.id`.
   - Prevents leakage of authenticated users' custom curriculum checkpoint quizzes into guest storage.

4. **REP-004 Diff Summary**:
   - In `src/app/api/courses/[id]/route.ts`, exported `GET` handler with `DeleteCourseParamsSchema` validation.
   - Invokes `getLearningPathById(courseId)` and returns `{ success: true, course }` or `{ success: false, error: ... }` with HTTP 404.

5. **REP-005 Diff Summary**:
   - In `NotificationPopover.tsx`, added early return `if (!isOpen) return;` inside the notification interval effect.
   - Prevents background IndexedDB polling every 5 seconds across all dashboard routes.

6. **REP-006 Diff Summary**:
   - In `explore/page.tsx`, eliminated unreachable `if (false && !user)` block in `handleBookmarkToggle`.

7. **REP-007 Diff Summary**:
   - In `src/app/api/ai/tutor/route.ts`, added `isFallback` tracking variable and exposed it in the response JSON payload.
