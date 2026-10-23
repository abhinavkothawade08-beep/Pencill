import Link from "next/link";
import PublicNavbar from "@/components/layout/PublicNavbar";
import { getLearningPaths } from "@/services/supabase";
import { LearningPath } from "@/types";
import PathCard from "@/components/cards/PathCard";

export default async function LandingPage() {
  let livePaths: LearningPath[] = [];
  try {
    livePaths = await getLearningPaths();
  } catch (err) {
    console.error("Could not fetch paths for landing page:", err);
  }
  const featuredPaths = livePaths.slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <PublicNavbar />

      <main className="w-full pt-16 bg-background">
        <div className="max-w-7xl mx-auto px-margin">
          {/* Ambient Glow */}
          <div className="relative w-full overflow-hidden">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[980px] h-[480px] bg-gradient-to-b from-primary-fixed/30 via-secondary-fixed/20 to-transparent blur-3xl pointer-events-none rounded-full" />

            {/* Hero Section */}
            <section className="relative pt-16 pb-20 px-2 md:px-0">
              <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-space-md">
                {/* Category Pill */}
                <div className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-secondary-container/30 text-on-secondary-container border border-secondary/20 shadow-sm transition-all hover:bg-secondary-container/40">
                  <span className="material-symbols-outlined text-[16px] text-secondary">
                    auto_stories
                  </span>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold text-secondary">
                    AI-Guided Academic Syllabus Architecture
                  </span>
                </div>

                {/* Headline */}
                <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight max-w-3xl pt-2 font-serif">
                  Learn smarter. Find everything you need in one place.
                </h1>

                {/* Subtitle */}
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                  Pencill turns your learning goal into a structured path using relevant free learning resources from across the open web.
                </p>

                {/* CTA Action Group */}
                <div className="flex flex-col sm:flex-row items-center gap-space-md pt-4">
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-space-sm px-6 py-3.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:bg-primary-container transition-all active:scale-[0.98]"
                  >
                    <span>Start Learning</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </Link>
                  <Link
                    href="/explore"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-space-sm px-6 py-3.5 rounded-lg bg-surface-container-lowest text-primary font-label-lg text-label-lg shadow-sm border border-surface-container-high hover:bg-surface-container-low transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">explore</span>
                    <span>Explore Curricula</span>
                  </Link>
                </div>

                {/* Trust Indicators */}
                <div className="pt-8 flex flex-col items-center space-y-space-sm">
                  <div className="flex items-center gap-space-xs text-secondary font-label-md text-label-md">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span className="font-semibold tracking-wide">Free forever for students worldwide</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-outline">
                    Curated from YouTube • MIT OpenCourseWare • NPTEL • Khan Academy • arXiv • Stanford Online
                  </p>
                </div>
              </div>

              {/* Transformation Canvas / Hero Mockup Card */}
              <div className="mt-16 w-full max-w-5xl mx-auto rounded-xl bg-surface-container-lowest shadow-xl p-4 sm:p-8 relative border border-surface-container-high/60">
                <div className="flex items-center justify-between pb-6 mb-6 bg-surface-container-low/40 -mx-4 -mt-4 sm:-mx-8 sm:-mt-8 px-6 py-4 rounded-t-xl border-b border-surface-container-high/60">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-surface-variant" />
                      <span className="w-3 h-3 rounded-full bg-surface-variant" />
                      <span className="w-3 h-3 rounded-full bg-surface-variant" />
                    </div>
                    <div className="flex items-center gap-2 pl-4">
                      <span className="text-xs text-outline font-label-sm uppercase tracking-widest font-semibold">
                        Pencill Syllabus Engine v2.4
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-label-sm text-secondary bg-secondary-fixed/40 px-2.5 py-1 rounded-full font-medium">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    Live Academic Graph
                  </span>
                </div>

                {/* 3-Column Pipeline Architecture */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Left: Student Intent Input */}
                  <div className="lg:col-span-4 bg-surface-container-low p-5 rounded-lg flex flex-col justify-between h-full space-y-4 border border-surface-container-high/40">
                    <div>
                      <div className="flex items-center justify-between text-outline text-xs font-label-sm uppercase tracking-wider mb-2">
                        <span>01 • Query Input</span>
                        <span className="material-symbols-outlined text-[16px] text-primary">edit_note</span>
                      </div>
                      <p className="font-headline-sm text-headline-sm text-on-surface">Target Syllabus</p>
                      <div className="mt-4 bg-surface-container-lowest rounded-md p-3.5 shadow-sm border border-surface-container-high/40">
                        <div className="flex items-center gap-2 text-xs font-label-md text-secondary font-medium">
                          <span className="material-symbols-outlined text-[15px]">school</span>
                          <span>Competitive Exam Prep</span>
                        </div>
                        <div className="font-headline-sm text-[16px] text-primary mt-1 font-semibold">
                          JEE Physics • Class 11
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-2 text-xs font-label-sm text-outline border-t border-surface-container-high/40">
                          <span className="bg-surface-container px-2 py-0.5 rounded text-on-surface">English Medium</span>
                          <span className="bg-surface-container px-2 py-0.5 rounded text-on-surface">Calculus-based</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-on-surface-variant flex items-center gap-2 pt-2">
                      <span className="material-symbols-outlined text-[16px] text-secondary">tune</span>
                      <span>180+ Open Source syllabi matched</span>
                    </div>
                  </div>

                  {/* Center: AI Synthesis Flow */}
                  <div className="lg:col-span-4 flex flex-col items-center justify-center p-3 text-center space-y-3">
                    <div className="w-full bg-surface-container-high/60 rounded-md py-2 px-3 text-left shadow-xs flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-primary font-medium">1. Deconstruct Topics</span>
                      <span className="material-symbols-outlined text-[16px] text-secondary">account_tree</span>
                    </div>
                    <span className="material-symbols-outlined text-outline-variant text-base">arrow_downward</span>
                    <div className="w-full bg-surface-container-high/60 rounded-md py-2 px-3 text-left shadow-xs flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-primary font-medium">2. Sequence Prerequisites</span>
                      <span className="material-symbols-outlined text-[16px] text-secondary">hub</span>
                    </div>
                    <span className="material-symbols-outlined text-outline-variant text-base">arrow_downward</span>
                    <div className="w-full bg-surface-container-high/60 rounded-md py-2 px-3 text-left shadow-xs flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-primary font-medium">3. Harvest & Audit Free Content</span>
                      <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                    </div>
                  </div>

                  {/* Right: Output Path Blueprint */}
                  <div className="lg:col-span-4 bg-primary text-on-primary p-5 rounded-lg flex flex-col justify-between h-full space-y-4 shadow-md">
                    <div>
                      <div className="flex items-center justify-between text-primary-fixed-dim text-xs font-label-sm uppercase tracking-wider mb-2">
                        <span>03 • Structured Output</span>
                        <span className="material-symbols-outlined text-[16px] text-secondary-fixed">route</span>
                      </div>
                      <h4 className="font-headline-sm text-headline-sm text-white">Kinematics & Mechanics</h4>
                      <p className="font-body-sm text-body-sm text-primary-fixed-dim mt-1">
                        4 Modules · 24 Lectures · 110 Ranked Problems
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="bg-primary-container p-2.5 rounded text-xs flex items-center justify-between">
                          <span>Mod 1: Physical World & Vectors</span>
                          <span className="text-secondary-fixed font-semibold">100% Free</span>
                        </div>
                        <div className="bg-primary-container p-2.5 rounded text-xs flex items-center justify-between">
                          <span>Mod 2: Differential Kinematics</span>
                          <span className="text-secondary-fixed font-semibold">100% Free</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/explore"
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded bg-secondary text-on-secondary font-label-sm font-semibold hover:bg-secondary-container hover:text-on-secondary-container transition-colors"
                    >
                      <span>Explore Verified Syllabi</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Featured Academic Pathways Showcase */}
            <section className="py-16 border-t border-surface-container-high/60">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-space-lg">
                <div>
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
                    Curated Tracks
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-primary mt-1 font-serif">
                    Featured Learning Pathways
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    Sequenced from trusted open-access curricula, textbook archives, and university faculty.
                  </p>
                </div>
                <Link
                  href="/explore"
                  className="font-label-lg text-label-lg text-primary hover:text-primary-container font-semibold flex items-center gap-1"
                >
                  <span>View All Published Tracks</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
              </div>

              {featuredPaths.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
                  {featuredPaths.map((path) => (
                    <PathCard key={path.id} path={path} />
                  ))}
                </div>
              ) : (
                <div className="bg-surface-container-lowest p-8 rounded-xl border border-surface-container-high/60 text-center max-w-lg mx-auto">
                  <span className="material-symbols-outlined text-4xl text-primary mb-2">auto_stories</span>
                  <h3 className="font-headline-sm text-headline-sm font-serif text-primary">Ready to Map Your Learning Goal</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 mb-4">
                    Be the first to synthesize an AI-guided curriculum for your target topic, subject, or competitive examination.
                  </p>
                  <Link
                    href="/new-goal"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md font-semibold hover:bg-primary-container transition-colors"
                  >
                    <span>Synthesize Custom Curriculum</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              )}
            </section>

            {/* Academic Contrast / Value Pillars */}
            <section className="py-16 border-t border-surface-container-high/60" id="philosophy">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
                  Why Pencill Exists
                </span>
                <h2 className="font-headline-lg text-headline-lg text-primary mt-1 font-serif">
                  The internet has all the information. What you need is direction.
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-surface-container-high/60 flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-4">
                    <span className="material-symbols-outlined text-xl">clear_all</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-primary mb-2 font-serif">
                      Curation over Search Engines
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Search algorithms prioritize engagement and ad revenue. Pencill sequences only verified academic literature, MIT OCW, NPTEL, and high-yield open lecture archives.
                    </p>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-surface-container-high/60 flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-4">
                    <span className="material-symbols-outlined text-xl">done_all</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-primary mb-2 font-serif">
                      Completion over Engagement
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      No endless feeds, no notification spam. We measure success when you complete your course and master the discipline, not how many hours you spend browsing.
                    </p>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-surface-container-high/60 flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-4">
                    <span className="material-symbols-outlined text-xl">lock_open</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-primary mb-2 font-serif">
                      Free Forever for Students
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Knowledge created by human civilization should be accessible to any dedicated learner with motivation and curiosity. No subscriptions, no surprise paywalls.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Public Footer */}
        <footer className="mt-20 border-t border-surface-container-high/60 bg-surface-container-low py-12">
          <div className="max-w-7xl mx-auto px-margin flex flex-col md:flex-row items-center justify-between gap-6 text-on-surface-variant font-label-sm text-label-sm">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>Pencill: The Open Academic Wayfinding Platform.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/explore" className="hover:text-primary transition-colors">Catalog</Link>
              <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
              <a href="#philosophy" className="hover:text-primary transition-colors">Manifesto</a>
              <span className="text-outline">© 2026 Pencill</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
