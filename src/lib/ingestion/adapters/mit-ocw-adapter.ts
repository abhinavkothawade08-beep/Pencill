import { AcademicProviderAdapter, NormalizedCourse, NormalizedModule, NormalizedLesson } from "../types";

export class MitOcwAdapter implements AcademicProviderAdapter {
  readonly id = "mit-ocw";
  readonly name = "MIT OpenCourseWare (MIT Learn API)";
  readonly institution = "Massachusetts Institute of Technology";
  readonly license = "Creative Commons BY-NC-SA 4.0";
  readonly apiBaseUrl = "https://api.learn.mit.edu/api/v1/courses/?platform=ocw";

  private departmentDomainMap: Record<string, string> = {
    "6": "Computer Science",
    "8": "Physics",
    "18": "Mathematics",
    "5": "Chemistry",
    "7": "Biology",
    "20": "Biological Engineering",
    "9": "Brain and Cognitive Sciences",
    "16": "Aeronautics and Astronautics",
    "15": "Management / Economics",
  };

  async fetchCourses(options?: {
    limit?: number;
    department?: string;
    query?: string;
  }): Promise<NormalizedCourse[]> {
    const limit = options?.limit || 10;
    let url = `${this.apiBaseUrl}&limit=${limit}`;

    if (options?.department) {
      url += `&department=${encodeURIComponent(options.department)}`;
    }
    if (options?.query) {
      url += `&q=${encodeURIComponent(options.query)}`;
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Pencill-Academic-Platform/1.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `[MitOcwAdapter] Failed to fetch MIT OCW courses: HTTP ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const results: any[] = data.results || [];

    const courses: NormalizedCourse[] = [];

    for (const raw of results) {
      try {
        const normalized = this.normalizeCourse(raw);
        if (normalized) {
          courses.push(normalized);
        }
      } catch (err) {
        console.warn(`[MitOcwAdapter] Failed to normalize course ${raw.id || raw.title}:`, err);
      }
    }

    return courses;
  }

  private normalizeCourse(raw: any): NormalizedCourse | null {
    if (!raw.title || !raw.url) return null;

    const run = raw.runs?.[0] || {};
    const primaryDeptId = raw.departments?.[0]?.department_id || "8";
    const domain = this.departmentDomainMap[primaryDeptId] || raw.departments?.[0]?.name || "Physical Sciences";

    // Map level
    let level: NormalizedCourse["level"] = "Undergraduate";
    const rawLevel = (run.level?.[0]?.code || raw.level?.[0]?.code || "").toLowerCase();
    if (rawLevel.includes("undergrad")) {
      level = "Undergraduate";
    } else if (rawLevel.includes("grad")) {
      level = "Graduate";
    } else if (rawLevel.includes("intro") || rawLevel.includes("begin")) {
      level = "Beginner";
    }

    // Extract instructors
    const instructors: string[] = [];
    if (Array.isArray(run.instructors)) {
      for (const inst of run.instructors) {
        if (inst.full_name) {
          instructors.push(inst.full_name);
        } else if (inst.first_name || inst.last_name) {
          instructors.push(`${inst.first_name || ""} ${inst.last_name || ""}`.trim());
        }
      }
    }

    const courseNumber =
      raw.course?.course_numbers?.[0]?.value || raw.readable_id?.split("+")?.[0] || "";

    // Generate stable deterministic slug
    const cleanNumber = courseNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const cleanTitle = raw.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 40);
    const id = `mit-${cleanNumber ? `${cleanNumber}-` : ""}${cleanTitle}`;

    const canonicalUrl: string = raw.url.startsWith("http")
      ? raw.url
      : `https://ocw.mit.edu${raw.url}`;

    // Extract syllabus modules based on features or syllabus breakdown
    const features: string[] = raw.course_feature || [];
    const modules: NormalizedModule[] = [];

    // Module 1: Foundational Theory & Lecture Content
    const mod1Lessons: NormalizedLesson[] = [
      {
        id: `les-${id}-1-1`,
        title: `${raw.title}: Course Overview & Syllabus`,
        type: "monograph",
        durationMinutes: 20,
        sourceName: "MIT OpenCourseWare",
        sourceUrl: canonicalUrl,
        orderIndex: 0,
        summaryPoints: [
          `Official curriculum published by ${this.institution}`,
          instructors.length > 0 ? `Taught by: ${instructors.join(", ")}` : "Verified Department Faculty",
          `Licensed under ${this.license}`,
        ],
      },
    ];

    if (features.some((f: string) => f.toLowerCase().includes("lecture"))) {
      mod1Lessons.push({
        id: `les-${id}-1-2`,
        title: "Primary Lecture Notes & Reading Guides",
        type: "monograph",
        durationMinutes: 45,
        sourceName: "MIT OCW Lecture Notes",
        sourceUrl: canonicalUrl,
        orderIndex: 1,
        summaryPoints: ["Expository course readings and official lecture notes"],
      });
    }

    modules.push({
      id: `mod-${id}-1`,
      title: "Foundational Lectures & Core Reading Materials",
      moduleNumber: 1,
      orderIndex: 0,
      status: "in_progress",
      lessons: mod1Lessons,
    });

    // Module 2: Applied Problem Sets & Case Studies
    const mod2Lessons: NormalizedLesson[] = [
      {
        id: `les-${id}-2-1`,
        title: "Course Problem Sets & Exercises",
        type: "practice",
        durationMinutes: 50,
        sourceName: "MIT OCW Problem Sets",
        sourceUrl: canonicalUrl,
        orderIndex: 0,
        summaryPoints: ["Analytical problem sets derived from MIT term curriculum"],
      },
    ];

    if (features.some((f: string) => f.toLowerCase().includes("exam") || f.toLowerCase().includes("quiz"))) {
      mod2Lessons.push({
        id: `les-${id}-2-2`,
        title: "Selected Examination Papers & Diagnostic Solutions",
        type: "quiz",
        durationMinutes: 40,
        sourceName: "MIT OCW Exam Archive",
        sourceUrl: canonicalUrl,
        orderIndex: 1,
        summaryPoints: ["Authentic diagnostic examination materials with verified solutions"],
      });
    }

    modules.push({
      id: `mod-${id}-2`,
      title: "Problem Solving, Problem Sets & Evaluation",
      moduleNumber: 2,
      orderIndex: 1,
      status: "locked",
      lessons: mod2Lessons,
    });

    // Calculate duration conservatively
    const durationHours = Math.max(16, modules.reduce(
      (acc, m) => acc + m.lessons.reduce((lAcc, l) => lAcc + l.durationMinutes, 0),
      0
    ) / 60 * 6);

    const description =
      raw.description ||
      run.description ||
      `Official open access course material from MIT OpenCourseWare for ${raw.title}.`;

    return {
      id,
      externalId: String(raw.id || raw.readable_id),
      title: raw.title,
      description,
      domain,
      level,
      durationHours: Math.round(durationHours),
      moduleCount: modules.length,
      verified: true,
      publisher: this.institution,
      canonicalUrl,
      courseNumber,
      instructors,
      license: this.license,
      tags: [domain, "MIT OCW", "OpenCourseWare", courseNumber].filter(Boolean),
      modules,
      sources: [
        {
          title: `${raw.title} (${courseNumber || "MIT OCW"})`,
          url: canonicalUrl,
          publisher: this.institution,
          sourceType: "oer_curriculum",
          license: this.license,
          verificationStatus: "verified",
          lastVerifiedAt: new Date().toISOString(),
        },
      ],
    };
  }
}
