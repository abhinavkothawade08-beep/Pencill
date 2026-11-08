# Global Rule: Regression Prevention & Blast Radius Containment

> **Standard**: Guard against unintended side-effects and maintain backward compatibility.

---

## 1. Blast Radius Mapping
1. **Dependency Analysis**: Identify all upstream and downstream modules importing changed symbols before modification.
2. **Contract Stability**: Never mutate public API schemas or function signatures without backward-compatible defaults.
3. **Database Schema Evolution**: Follow the Expand-Contract pattern for non-destructive, zero-downtime migrations.

---

## 2. State & Cache Integrity
1. **Dual-Persistence Protection**: Ensure client-side local cache (`pathService.ts`) and database truth remain synchronized.
2. **Tombstone Preservation**: Items recorded in `deletionRegistry.ts` must never resurrect during background sync.
3. **Account Isolation**: Account switching must immediately invalidate previous cached state and reinitialize.
