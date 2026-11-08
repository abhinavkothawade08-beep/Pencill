# Pencill — Production Engineering Standards & Architecture Patterns

> **Status**: Production Reference Standard  
> **Target Framework**: Next.js 14 App Router / React 18 / Strict TypeScript 5 / Tailwind CSS 3 / Supabase  
> **Core Principle**: Zero fake functionality, zero mock data in production, and zero unhandled errors.

---

## 1. Strict TypeScript Principles

All code in Pencill must adhere to strict type safety without compromises.

### 1.1 Zero `any` Policy
- Never use `any`. If a type is genuinely polymorphic or coming from an untyped external interface, use `unknown` and narrow it with Zod schemas or explicit type guards.
- Avoid loose `as Type` casting. Narrow types safely:
  ```typescript
  // ❌ Disallowed
  const path = (data as any).learningPath;

  // ✅ Required
  const parsed = LearningPathSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError("Invalid learning path payload", parsed.error);
  }
  const path = parsed.data;
  ```

### 1.2 Discriminated Unions for UI State
Avoid multiple uncoordinated boolean flags (e.g. `isLoading`, `isError`, `isSuccess`, `data`). Use discriminated unions to make impossible states unrepresentable:
```typescript
export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string; code?: string }
  | { status: "success"; data: T };
```

---

## 2. Next.js 14 & React Component Standards

### 2.1 Server vs. Client Component Boundaries
- **Default to Server Components**: Keep page wrappers and layout shells server-rendered to minimize JavaScript payload transmitted to the client.
- **Push `"use client"` to the Leaves**: Only components requiring browser APIs (`localStorage`, `window`), React hooks (`useState`, `useEffect`), or user event handlers (`onClick`, `onChange`) should be marked with `"use client"`.
- Never import server-only code (e.g., Supabase service-role client, environment secrets) into client components.

### 2.2 Four Mandatory Component States
Every container that renders dynamic or asynchronous data must explicitly support and render all 4 states:
1. **Loading State**: Render structural Tailwind skeleton blocks matching the exact geometry of the loaded content. Never use a blank white screen or a single generic spinner.
2. **Empty State**: When query results or user lists return zero items, render a deliberate `<EmptyState>` with a contextual icon, clear explanation, and primary action button (e.g., "Create Your First Goal").
3. **Error State**: Render an inline error banner or boundary card with an actionable recovery trigger (e.g., "Try Again", "Refresh Catalog"), rather than allowing the application to crash or freeze.
4. **Populated State**: Render the complete, styled data hierarchy with accessible contrast and semantic typography.

### 2.3 Interactive Element Completeness
- Every `<button>`, `<a>`, and `<input>` must be fully functional.
- Zero placeholder handlers (`onClick={() => {}}` or `console.log("clicked")`).
- If an action is pending or in-flight, the button must show a loading spinner and disable further clicks (`disabled={isLoading}`).
- If an action is unauthorized or unavailable, disable the control with an informative tooltip or message explaining why.

---

## 3. API & Backend Architecture Standards

### 3.1 Route Handler Architecture
- Route handlers (`src/app/api/**/route.ts`) must act strictly as controllers:
  1. Validate incoming HTTP headers, search parameters, and request body with Zod.
  2. Authenticate the requesting user session.
  3. Authorize user permissions for the requested resource.
  4. Delegate business logic to dedicated services (`src/services/`).
  5. Format and return standard JSON response envelopes.

### 3.2 Standard JSON Response Envelopes
All API responses must follow predictable schemas:

**Success Response**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "message": "User-facing sanitized error explanation",
    "code": "RESOURCE_NOT_FOUND",
    "details": {}
  }
}
```

### 3.3 HTTP Status Code Discipline
- `200 OK`: Successful read or update.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Input validation failed (Zod error details attached).
- `401 Unauthorized`: Missing or invalid session token.
- `403 Forbidden`: Authenticated user does not own the targeted record.
- `404 Not Found`: Targeted resource does not exist.
- `429 Too Many Requests`: Rate limit reached (include `Retry-After` header).
- `500 Internal Server Error`: Unhandled server exception (sanitized in production, no stack traces leaked).

---

## 4. State Management & Dual-Persistence Standards

### 4.1 Persistence Hierarchy
Pencill implements a dual-tier persistence pattern:
1. **Tier 1 (Authoritative Cloud)**: Supabase PostgreSQL database. All authenticated user state, enrollments, quizzes, study notes, and milestones are stored in relational tables guarded by Row Level Security (RLS).
2. **Tier 2 (Client Cache & Offline)**: Browser `localStorage` and memory cache. Provides instantaneous navigation, draft autosaving, and offline resilience.

### 4.2 Deletion Registry Synchronization
When a user deletes a resource (course, quiz, or note):
1. Issue the DELETE request to the API/Supabase database.
2. Record the deleted ID in `src/services/supabase/deletionRegistry.ts`.
3. Invalidate local caches.
4. When performing subsequent background syncs, verify all retrieved items against the `deletionRegistry` to prevent zombie records from resurfacing.

---

## 5. Security & Isolation Standards

### 5.1 Zero Service Role Key in Public Code
- `SUPABASE_SERVICE_ROLE_KEY` must never be referenced with `NEXT_PUBLIC_` prefix.
- Client bundles must exclusively use `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- All client-side queries must rely on PostgreSQL Row Level Security (`auth.uid() = user_id`) for multi-tenant data isolation.

### 5.2 Input Sanitization & XSS Defense
- User-supplied text, study note markdown, and community posts must be sanitized before rendering.
- Code blocks in practice environments must run in isolated client sandboxes or strictly controlled runners without eval-based escape vulnerabilities.

---

## 6. Code Hygiene & Quality Gates

Before merging or committing code:
- **TypeScript**: `npx tsc --noEmit` must pass with 0 errors.
- **ESLint**: `npm run lint` must pass with 0 warnings.
- **Test Suite**: `npm test` must pass 100% of test suites.
- **Dead Code**: Delete unused imports, dead components, and temporary scratch scripts before opening a PR.
