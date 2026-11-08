---
name: android-development
description: >-
  Develop, package, and optimize Android mobile applications using Capacitor, React Native, or native Android toolchains. Use when configuring mobile wrappers, Android manifests, or mobile builds.
---

# Android Mobile Engineering & Cross-Platform Architecture

> **Category**: Google Ecosystem, APIs & Mobile  
> **Specialist Subagent**: `frontend-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Configure and build Android applications with clean manifest permissions and security.**: Configure and build Android applications with clean manifest permissions and security.
2. **Optimize web-to-mobile bridge performance (Capacitor / React Native / PWA).**: Optimize web-to-mobile bridge performance (Capacitor / React Native / PWA).
3. **Ensure smooth mobile UX**: responsive layouts, gesture handling, and offline capabilities.

---

## 2. Standard Operating Procedures (SOP)

1. Configure AndroidManifest.xml: declare required permissions, intent filters, and hardware features.
2. Set up app icons, splash screens, and adaptive icon assets in android/app/src/main/res/.
3. Configure Gradle build scripts (build.gradle) with proper targetSdkVersion and compileSdkVersion.
4. Optimize WebView settings: enable hardware acceleration, safe browsing, and secure origin policies.
5. Test mobile viewports and touch interactions across simulated Android device profiles.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx cap sync android
./gradlew assembleDebug
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never request unnecessary dangerous permissions in AndroidManifest.xml.
- **Guard**: Never disable cleartext traffic or SSL validation in network security config.
- **Guard**: Ensure web app resources bundled in APK are optimized and minified.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify Gradle build compiles APK / AAB successfully with 0 errors.
- [ ] Verify Android app boots cleanly in emulator without native crashes.
- [ ] Verify web assets load properly within native Android WebView container.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `frontend-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
