"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getLearningPathById } from "@/services/supabase/pathService";

export default function LearnCourseRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;

  useEffect(() => {
    if (!courseId) return;

    let mounted = true;

    async function redirect() {
      try {
        const course = await getLearningPathById(courseId);
        if (!mounted) return;

        if (course?.modules && course.modules.length > 0) {
          const firstModule = course.modules[0];
          if (firstModule.lessons && firstModule.lessons.length > 0) {
            router.replace(`/learn/${courseId}/${firstModule.lessons[0].id}`);
            return;
          }
        }
        // Fallback to course details if no modules or lessons found
        router.replace(`/courses/${courseId}`);
      } catch {
        router.replace(`/courses/${courseId}`);
      }
    }

    redirect();

    return () => {
      mounted = false;
    };
  }, [courseId, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
      <p className="font-label-md text-label-md text-on-surface-variant font-medium">
        Loading active study workspace...
      </p>
    </div>
  );
}
