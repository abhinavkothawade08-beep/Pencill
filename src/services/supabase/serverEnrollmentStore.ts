import fs from "fs";
import path from "path";
import { UserEnrollment } from "./enrollmentService";

export interface StoredEnrollmentRecord {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  completionStatus: "enrolled" | "in_progress" | "completed" | "archived";
  progressPercent: number;
  lastAccessedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const ENROLLMENTS_FILE = path.join(DATA_DIR, "enrollments.json");

function ensureDataFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ENROLLMENTS_FILE)) {
      fs.writeFileSync(ENROLLMENTS_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  } catch (err) {
    console.error("[serverEnrollmentStore] Failed to initialize enrollments.json:", err);
  }
}

export function readServerEnrollments(): StoredEnrollmentRecord[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(ENROLLMENTS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("[serverEnrollmentStore] Warning reading enrollments.json:", err);
    return [];
  }
}

export function writeServerEnrollments(records: StoredEnrollmentRecord[]): void {
  ensureDataFile();
  try {
    const content = JSON.stringify(records, null, 2);
    try {
      const tmpFile = `${ENROLLMENTS_FILE}.${Date.now()}-${Math.random().toString(36).substring(2, 6)}.tmp`;
      fs.writeFileSync(tmpFile, content, "utf-8");
      try {
        if (fs.existsSync(ENROLLMENTS_FILE)) {
          fs.unlinkSync(ENROLLMENTS_FILE);
        }
        fs.renameSync(tmpFile, ENROLLMENTS_FILE);
      } catch {
        fs.writeFileSync(ENROLLMENTS_FILE, content, "utf-8");
        try {
          if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
        } catch {}
      }
    } catch {
      fs.writeFileSync(ENROLLMENTS_FILE, content, "utf-8");
    }
  } catch (err) {
    console.error("[serverEnrollmentStore] Failed to write enrollments.json:", err);
  }
}

export function getServerUserEnrollments(userId: string): StoredEnrollmentRecord[] {
  if (!userId) return [];
  const all = readServerEnrollments();
  return all
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.lastAccessedAt || b.enrolledAt).getTime() - new Date(a.lastAccessedAt || a.enrolledAt).getTime());
}

export function isServerUserEnrolled(userId: string, courseId: string): boolean {
  if (!userId || !courseId) return false;
  const all = readServerEnrollments();
  return all.some((r) => r.userId === userId && r.courseId === courseId);
}

export function addServerEnrollment(
  userId: string,
  courseId: string,
  options?: { completionStatus?: StoredEnrollmentRecord["completionStatus"] }
): StoredEnrollmentRecord {
  const all = readServerEnrollments();
  const existing = all.find((r) => r.userId === userId && r.courseId === courseId);
  const now = new Date().toISOString();

  if (existing) {
    existing.lastAccessedAt = now;
    if (options?.completionStatus) {
      existing.completionStatus = options.completionStatus;
    }
    writeServerEnrollments(all);
    return existing;
  }

  const newRecord: StoredEnrollmentRecord = {
    id: `enrollment-${userId}-${courseId}`,
    userId,
    courseId,
    enrolledAt: now,
    completionStatus: options?.completionStatus || "in_progress",
    progressPercent: 0,
    lastAccessedAt: now,
  };

  all.unshift(newRecord);
  writeServerEnrollments(all);
  return newRecord;
}

export function removeServerEnrollment(userId: string, courseId: string): boolean {
  const all = readServerEnrollments();
  const filtered = all.filter((r) => !(r.userId === userId && r.courseId === courseId));
  if (filtered.length !== all.length) {
    writeServerEnrollments(filtered);
    return true;
  }
  return false;
}

export function removeAllCourseServerEnrollments(courseId: string): void {
  const all = readServerEnrollments();
  const filtered = all.filter((r) => r.courseId !== courseId);
  if (filtered.length !== all.length) {
    writeServerEnrollments(filtered);
  }
}
