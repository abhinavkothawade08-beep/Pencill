---
name: android-cli
description: >-
  Operate Android CLI developer tools: adb, avdmanager, logcat, and gradle command lines for mobile testing and device diagnostics. Use when interacting with Android devices, emulators, or build pipelines.
---

# Android CLI, ADB Diagnostics & Emulator Automation

> **Category**: Google Ecosystem, APIs & Mobile  
> **Specialist Subagent**: `qa-eng`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Manage Android virtual devices (AVD) and physical devices via adb CLI.**: Manage Android virtual devices (AVD) and physical devices via adb CLI.
2. **Capture and filter real-time device system logs via adb logcat.**: Capture and filter real-time device system logs via adb logcat.
3. **Automate APK installation, launching, and UI interaction on Android targets.**: Automate APK installation, launching, and UI interaction on Android targets.

---

## 2. Standard Operating Procedures (SOP)

1. List connected devices and running emulators using 'adb devices'.
2. Install and launch target APK on device using 'adb install' and 'adb shell am start'.
3. Stream filtered system logs using 'adb logcat *:E' to capture fatal crashes and ANRs.
4. Capture device screenshots and screen recordings via 'adb exec-out screencap -p'.
5. Automate device inputs using 'adb shell input' for end-to-end mobile testing.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
adb devices
adb logcat -d *:E
adb shell am start -n <package>/<activity>
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Never leave adb server running with open public network ports.
- **Guard**: Ensure test commands target the specific emulator instance (-s emulator-5554).
- **Guard**: Do not execute destructive adb shell commands on production or physical devices.

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify target application launches cleanly on connected Android device.
- [ ] Verify adb logcat confirms zero unhandled exceptions or ANRs.
- [ ] Verify automated CLI script exits cleanly with code 0.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `qa-eng`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
