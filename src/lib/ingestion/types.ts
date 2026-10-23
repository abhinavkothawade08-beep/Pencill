import { z } from "zod";

export interface AcademicProviderAdapter {
  readonly id: string;
  readonly name: string;
  readonly institution: string;
  readonly license: string;
  readonly apiBaseUrl: string;
  fetchCourses(options?: { limit?: number; department?: string; query?: string }): Promise<NormalizedCourse[]>;
}

export const NormalizedSourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  publisher: z.string().min(1),
  sourceType: z.string().default("oer_curriculum"),
  license: z.string().optional(),
  verificationStatus: z.enum(["verified", "unverified", "pending", "rejected"]).default("verified"),
  lastVerifiedAt: z.string(),
});

export type NormalizedSource = z.infer<typeof NormalizedSourceSchema>;

export const NormalizedLessonSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  type: z.enum(["video", "monograph", "practice", "quiz", "paper", "formulae"]).default("monograph"),
  durationMinutes: z.number().int().min(0).default(30),
  sourceName: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  orderIndex: z.number().int().min(0),
  summaryPoints: z.array(z.string()).default([]),
});

export type NormalizedLesson = z.infer<typeof NormalizedLessonSchema>;

export const NormalizedModuleSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  moduleNumber: z.number().int().min(1),
  orderIndex: z.number().int().min(0),
  status: z.enum(["completed", "in_progress", "locked"]).default("locked"),
  lessons: z.array(NormalizedLessonSchema).default([]),
});

export type NormalizedModule = z.infer<typeof NormalizedModuleSchema>;

export const NormalizedCourseSchema = z.object({
  id: z.string().min(1),
  externalId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  domain: z.string().min(1),
  level: z.enum(["Beginner", "Foundation", "Intermediate", "Advanced", "Undergraduate", "Graduate"]),
  durationHours: z.number().min(1),
  moduleCount: z.number().int().min(1),
  verified: z.boolean().default(true),
  publisher: z.string().min(1),
  canonicalUrl: z.string().url(),
  courseNumber: z.string().optional(),
  instructors: z.array(z.string()).default([]),
  license: z.string().default("Creative Commons BY-NC-SA 4.0"),
  tags: z.array(z.string()).default([]),
  modules: z.array(NormalizedModuleSchema).default([]),
  sources: z.array(NormalizedSourceSchema).default([]),
});

export type NormalizedCourse = z.infer<typeof NormalizedCourseSchema>;

export interface IngestionResult {
  providerId: string;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ externalId: string; error: string }>;
  courses: Array<{ id: string; title: string; canonicalUrl: string }>;
}
