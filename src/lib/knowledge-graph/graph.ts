/**
 * Pencill Knowledge Graph & Conceptual Dependency Engine
 * Models concepts, prerequisite directed acyclic graphs (DAGs), and automated remediation paths.
 */

export interface ConceptNode {
  id: string;
  label: string;
  domain: string;
  tier: 'foundation' | 'core' | 'advanced' | 'mastery';
  prerequisites: string[]; // Concept IDs
  unlockedConcepts: string[];
  masteryScore: number; // 0 to 100
  status: 'mastered' | 'learning' | 'gap' | 'unlocked' | 'locked';
  courseId?: string;
  courseTitle?: string;
  moduleId?: string;
  lessonId?: string;
  lessonCount?: number;
  completedLessonCount?: number;
  summary: string;
}

/**
 * Dynamically synthesizes an authentic Concept Dependency Directed Acyclic Graph (DAG)
 * from genuine learning paths, modules, and user lesson completions.
 */
export function buildKnowledgeGraphFromCourses(
  courses: Array<{
    id: string;
    title: string;
    domain?: string;
    modules?: Array<{
      id?: string;
      title: string;
      moduleNumber?: number;
      orderIndex?: number;
      lessons?: Array<{ id: string; title: string; durationMinutes?: number; type?: string }>;
      resources?: Array<{ id: string; title: string; durationMinutes?: number; type?: string }>;
      checkpointQuestions?: any[];
    }>;
  }>,
  completedLessonIds: string[] = []
): ConceptNode[] {
  if (!courses || courses.length === 0) return [];

  const nodes: ConceptNode[] = [];
  const completedSet = new Set(completedLessonIds);

  courses.forEach((course) => {
    const modules = course.modules || [];
    const totalModules = modules.length;
    const courseDomain = course.domain || "General Studies";

    modules.forEach((mod, modIdx) => {
      const lessons = mod.lessons || mod.resources || [];
      const totalLessons = lessons.length;
      const completedCount = lessons.filter((l) => completedSet.has(l.id)).length;

      // Determine tier based on module position in curriculum DAG
      let tier: ConceptNode['tier'] = 'foundation';
      if (totalModules <= 1) {
        tier = 'core';
      } else if (modIdx === 0) {
        tier = 'foundation';
      } else if (modIdx === totalModules - 1) {
        tier = 'mastery';
      } else if (modIdx >= Math.floor(totalModules / 2)) {
        tier = 'advanced';
      } else {
        tier = 'core';
      }

      // Compute mastery score (0 - 100)
      const masteryScore = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      // Determine pedagogical prerequisite links
      const prevModId = modIdx > 0 ? `${course.id}-mod-${modIdx - 1}` : null;
      const nextModId = modIdx < totalModules - 1 ? `${course.id}-mod-${modIdx + 1}` : null;
      const prerequisites: string[] = prevModId ? [prevModId] : [];
      const unlockedConcepts: string[] = nextModId ? [nextModId] : [];

      // Determine node status
      let status: ConceptNode['status'] = 'unlocked';
      if (masteryScore === 100) {
        status = 'mastered';
      } else if (masteryScore > 0) {
        status = 'learning';
      } else if (modIdx > 0) {
        // Check if previous module was mastered
        const prevLessons = modules[modIdx - 1]?.lessons || modules[modIdx - 1]?.resources || [];
        const prevCompleted = prevLessons.filter((l) => completedSet.has(l.id)).length;
        const prevMastered = prevLessons.length > 0 && prevCompleted >= prevLessons.length;
        status = prevMastered ? 'unlocked' : 'gap';
      } else {
        status = 'unlocked';
      }

      const nextIncompleteLesson = lessons.find((l) => !completedSet.has(l.id)) || lessons[0];

      nodes.push({
        id: `${course.id}-mod-${modIdx}`,
        label: mod.title,
        domain: courseDomain,
        tier,
        prerequisites,
        unlockedConcepts,
        masteryScore,
        status,
        courseId: course.id,
        courseTitle: course.title,
        moduleId: mod.id || `mod-${modIdx}`,
        lessonId: nextIncompleteLesson?.id,
        lessonCount: totalLessons,
        completedLessonCount: completedCount,
        summary: `${totalLessons} lessons · ${completedCount} completed · Part of "${course.title}"`,
      });
    });
  });

  return nodes;
}

export interface ConceptDependencyEdge {
  from: string;
  to: string;
  relationship: 'prerequisite' | 'reinforces' | 'applies';
}

export const CANONICAL_KNOWLEDGE_NODES: ConceptNode[] = [
  // Computer Science & AI Branch
  {
    id: "cs-vars",
    label: "Variables & Memory Allocation",
    domain: "Computer Science",
    tier: "foundation",
    prerequisites: [],
    unlockedConcepts: ["cs-control", "cs-funcs"],
    masteryScore: 95,
    status: "mastered",
    summary: "Primitive data types, references, stack vs heap allocation.",
  },
  {
    id: "cs-control",
    label: "Control Flow & Conditionals",
    domain: "Computer Science",
    tier: "foundation",
    prerequisites: ["cs-vars"],
    unlockedConcepts: ["cs-loops"],
    masteryScore: 90,
    status: "mastered",
    summary: "Boolean logic, branching, truth tables, short-circuit evaluation.",
  },
  {
    id: "cs-loops",
    label: "Iteration & Invariants",
    domain: "Computer Science",
    tier: "foundation",
    prerequisites: ["cs-control"],
    unlockedConcepts: ["cs-arrays", "cs-recursion"],
    masteryScore: 85,
    status: "mastered",
    summary: "Definite vs indefinite loops, loop invariants, termination conditions.",
  },
  {
    id: "cs-funcs",
    label: "Functions & Scope",
    domain: "Computer Science",
    tier: "core",
    prerequisites: ["cs-vars"],
    unlockedConcepts: ["cs-recursion", "cs-closures"],
    masteryScore: 88,
    status: "mastered",
    summary: "Lexical scope, parameter passing, return semantics, purity.",
  },
  {
    id: "cs-recursion",
    label: "Recursion & Call Stack",
    domain: "Computer Science",
    tier: "core",
    prerequisites: ["cs-loops", "cs-funcs"],
    unlockedConcepts: ["cs-trees", "cs-dp"],
    masteryScore: 45,
    status: "gap",
    summary: "Base cases, recursive step, stack frames, call stack overflow prevention.",
  },
  {
    id: "cs-arrays",
    label: "Contiguous Arrays & Strings",
    domain: "Computer Science",
    tier: "core",
    prerequisites: ["cs-loops"],
    unlockedConcepts: ["cs-hashing", "cs-trees"],
    masteryScore: 92,
    status: "mastered",
    summary: "Zero-indexed indexing, time complexity of slicing, buffer boundaries.",
  },
  {
    id: "cs-trees",
    label: "Hierarchical Trees & BSTs",
    domain: "Computer Science",
    tier: "advanced",
    prerequisites: ["cs-recursion", "cs-arrays"],
    unlockedConcepts: ["cs-graphs", "ai-hnsw"],
    masteryScore: 30,
    status: "learning",
    summary: "Binary search tree invariants, pre/in/post-order traversal, balance.",
  },
  {
    id: "math-vectors",
    label: "Vector Spaces & Dot Products",
    domain: "Mathematics",
    tier: "foundation",
    prerequisites: [],
    unlockedConcepts: ["math-matrices", "ai-embeddings"],
    masteryScore: 94,
    status: "mastered",
    summary: "Direction, magnitude, basis vectors, inner products, orthogonality.",
  },
  {
    id: "math-matrices",
    label: "Matrix Transformations & Inverses",
    domain: "Mathematics",
    tier: "core",
    prerequisites: ["math-vectors"],
    unlockedConcepts: ["math-eigen", "ai-embeddings"],
    masteryScore: 80,
    status: "mastered",
    summary: "Linear mappings, determinants, column space, invertible operators.",
  },
  {
    id: "ai-embeddings",
    label: "Dense Vector Embeddings",
    domain: "AI & Machine Learning",
    tier: "core",
    prerequisites: ["math-vectors", "cs-arrays"],
    unlockedConcepts: ["ai-ann", "ai-rag"],
    masteryScore: 85,
    status: "mastered",
    summary: "Semantic vector projection, cosine similarity, dimensionality reduction.",
  },
  {
    id: "ai-ann",
    label: "Approximate Nearest Neighbors (ANN)",
    domain: "AI & Machine Learning",
    tier: "advanced",
    prerequisites: ["ai-embeddings", "cs-trees"],
    unlockedConcepts: ["ai-hnsw", "ai-rag"],
    masteryScore: 65,
    status: "learning",
    summary: "Inverted file index (IVF), Voronoi centroids, vector indexing speedup.",
  },
  {
    id: "ai-hnsw",
    label: "Hierarchical Navigable Small Worlds (HNSW)",
    domain: "AI & Machine Learning",
    tier: "mastery",
    prerequisites: ["ai-ann", "cs-trees"],
    unlockedConcepts: ["ai-rag"],
    masteryScore: 20,
    status: "gap",
    summary: "Multi-layer skip graph, logarithmic vector traversal, metric spaces.",
  },
  {
    id: "ai-rag",
    label: "Production RAG Architecture",
    domain: "AI & Machine Learning",
    tier: "mastery",
    prerequisites: ["ai-embeddings", "ai-hnsw"],
    unlockedConcepts: [],
    masteryScore: 40,
    status: "learning",
    summary: "Query routing, hybrid retrieval, reciprocal rank fusion, evaluation trilemma.",
  },
];

/**
 * Traces backwards through the prerequisite DAG to identify missing prerequisites
 * when a student struggles with a target concept.
 */
export function identifyPrerequisiteGaps(
  targetConceptId: string,
  nodes: ConceptNode[] = CANONICAL_KNOWLEDGE_NODES
): {
  targetNode: ConceptNode | undefined;
  missingPrerequisites: ConceptNode[];
  remediationRoadmap: ConceptNode[];
} {
  const nodeMap = new Map<string, ConceptNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const targetNode = nodeMap.get(targetConceptId);
  if (!targetNode) {
    return { targetNode: undefined, missingPrerequisites: [], remediationRoadmap: [] };
  }

  const visited = new Set<string>();
  const missingPrerequisites: ConceptNode[] = [];
  const remediationRoadmap: ConceptNode[] = [];

  function traverse(conceptId: string) {
    if (visited.has(conceptId)) return;
    visited.add(conceptId);

    const node = nodeMap.get(conceptId);
    if (!node) return;

    for (const prereqId of node.prerequisites) {
      traverse(prereqId);
      const prereqNode = nodeMap.get(prereqId);
      if (prereqNode && prereqNode.masteryScore < 70) {
        if (!missingPrerequisites.some((m) => m.id === prereqNode.id)) {
          missingPrerequisites.push(prereqNode);
        }
      }
    }

    if (node.id !== targetConceptId && node.masteryScore < 70) {
      if (!remediationRoadmap.some((r) => r.id === node.id)) {
        remediationRoadmap.push(node);
      }
    }
  }

  traverse(targetConceptId);

  return {
    targetNode,
    missingPrerequisites,
    remediationRoadmap,
  };
}
