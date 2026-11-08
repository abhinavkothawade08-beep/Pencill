# Global Rule: Testing & Hermetic Self-Verification

> **Standard**: Every change must be verified using strict TypeScript compilation, linting, and automated tests.

---

## 1. Verification Protocol
Every task, refactor, or bug fix must complete the full 3-tier verification gate:
1. **TypeScript Type Safety**:
   ```bash
   npx tsc --noEmit
   ```
   *Requirement*: 0 errors.

2. **Linting & Code Quality**:
   ```bash
   npm run lint
   ```
   *Requirement*: 0 warnings, 0 errors.

3. **Automated Test Suite**:
   ```bash
   npm test
   ```
   *Requirement*: 100% pass rate across all suites (341+ tests).

---

## 2. Testing Principles
1. **Zero Fabricated Functionality**: Every button, API route, form, and feature must have genuine automated tests.
2. **Zero Mock Data in Production Paths**: Unit test business logic with authentic educational domain models.
3. **Hermetic & Deterministic**: Tests must never fail due to timing jitter, uncontrolled networks, or random state.
