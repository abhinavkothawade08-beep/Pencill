import { planIntelligentCurriculum } from '@/lib/curriculum-intelligence';
import {
  isNarrowFocusedTopic,
  isComprehensiveSubject,
  calculateRecommendedModuleCount,
} from '@/lib/curriculum-intelligence/objective-analyzer';
import {
  LearnerGoalInput,
  AnalyzedObjective,
  CurriculumPlan,
  ModulePlan,
  EducationalDomain,
  AcademicLevel,
} from './types';
import {
  sanitizeInputSubtopics,
  evaluateTopicConsistency,
} from '@/lib/curriculum-intelligence/topic-consistency-validator';

export { isNarrowFocusedTopic, isComprehensiveSubject };

export interface ClusteredModulePlan {
  title: string;
  description: string;
  concepts: string[];
  prerequisites: string[];
  objectives: string[];
}

/**
 * Intelligent Semantic Concept Clustering Engine.
 * Evaluates a list of input topics or concepts, analyzes semantic relationships,
 * and groups tightly coupled ideas into cohesive learning units.
 * Rule of Thumb: ONE COHERENT LEARNING UNIT = ONE MODULE.
 */
export function clusterTopicsIntoCoherentModules(
  topics: string[],
  domain: EducationalDomain,
  courseTopic: string
): ClusteredModulePlan[] {
  if (!topics || topics.length === 0) {
    return [];
  }

  const rawClean = Array.from(new Set(topics.map((t) => t.trim()).filter(Boolean)));
  if (rawClean.length === 0) return [];

  // Filter out cross-domain collision topics that leaked from other courses
  const filtered = rawClean.filter((t) => evaluateTopicConsistency(t, courseTopic).isConsistent);
  const cleanTopics = filtered.length > 0 ? filtered : [courseTopic];

  // If 1 or 2 concepts provided, combine into 1 module
  if (cleanTopics.length <= 2) {
    return [
      {
        title:
          cleanTopics.length === 1
            ? `${cleanTopics[0]} Foundations & Implementation`
            : `${cleanTopics[0]} & ${cleanTopics[1]} Core Unit`,
        description: `Cohesive instructional unit covering ${cleanTopics.join(' and ')}.`,
        concepts: cleanTopics,
        prerequisites: ['Foundational literacy in the discipline'],
        objectives: cleanTopics.map((c) => `Explain, implement and apply ${c} with precision`),
      },
    ];
  }

  // Domain-specific affinity clustering
  const isCS =
    domain === 'computer_science' ||
    domain === 'ai_and_data' ||
    /python|react|javascript|code|programming|algorithm|data structure/i.test(courseTopic);

  if (isCS) {
    const buckets: { [key: string]: { name: string; items: string[]; priority: number } } = {
      syntax: { name: 'Syntax, Variables, Types & Fundamental Operators', items: [], priority: 1 },
      control: { name: 'Control Flow, Conditional Branching & Iteration Protocols', items: [], priority: 2 },
      functions: { name: 'Modular Functions, Scope & Functional Primitives', items: [], priority: 3 },
      collections: { name: 'Composite Data Structures, Collections & Memory Models', items: [], priority: 4 },
      oop: { name: 'Object-Oriented Architecture, Classes & Design Patterns', items: [], priority: 5 },
      io_errors: { name: 'Error Recovery, Exceptions & File I/O Workflows', items: [], priority: 6 },
      advanced: { name: 'Advanced Techniques, Optimization & Applied Integration', items: [], priority: 7 },
    };

    const unmatched: string[] = [];

    for (const top of cleanTopics) {
      const topLower = top.toLowerCase();
      if (/variable|syntax|data type|primitive|operator|input|output|expression|string|casting/i.test(topLower)) {
        buckets.syntax.items.push(top);
      } else if (/control|flow|if|else|branch|conditional|loop|while|for|range|break|continue/i.test(topLower)) {
        buckets.control.items.push(top);
      } else if (/function|method|argument|parameter|return|lambda|scope|recursion|modular/i.test(topLower)) {
        buckets.functions.items.push(top);
      } else if (/list|array|tuple|dict|dictionary|set|hash|map|stack|queue|collection/i.test(topLower)) {
        buckets.collections.items.push(top);
      } else if (/class|object|oop|inherit|polymorph|encapsulat|property/i.test(topLower)) {
        buckets.oop.items.push(top);
      } else if (/file|error|exception|try|catch|except|io|stream|logging/i.test(topLower)) {
        buckets.io_errors.items.push(top);
      } else {
        unmatched.push(top);
      }
    }

    // Merge buckets that have items
    const activeBuckets = Object.values(buckets)
      .filter((b) => b.items.length > 0)
      .sort((a, b) => a.priority - b.priority);

    // If we have unmatched topics, distribute them into active buckets or create an applied module
    if (unmatched.length > 0) {
      if (activeBuckets.length > 0 && activeBuckets.length <= 3) {
        activeBuckets[activeBuckets.length - 1].items.push(...unmatched);
      } else {
        activeBuckets.push({
          name: `${courseTopic}: Applied Concepts & Problem Sets`,
          items: unmatched,
          priority: 99,
        });
      }
    }

    if (activeBuckets.length > 0) {
      // If we have more than 6 active buckets, merge adjacent buckets to prevent fragmentation
      let consolidated = activeBuckets;
      if (consolidated.length > 6) {
        const merged: typeof activeBuckets = [];
        for (let i = 0; i < consolidated.length; i += 2) {
          if (i + 1 < consolidated.length) {
            merged.push({
              name: `${consolidated[i].items[0]} & ${consolidated[i + 1].items[0]} Systems`,
              items: [...consolidated[i].items, ...consolidated[i + 1].items],
              priority: consolidated[i].priority,
            });
          } else {
            merged.push(consolidated[i]);
          }
        }
        consolidated = merged;
      }

      return consolidated.map((b, idx) => ({
        title: b.items.length <= 3 ? b.items.join(' & ') : b.name,
        description: `Comprehensive instruction covering ${b.items.join(', ')}.`,
        concepts: b.items,
        prerequisites: idx === 0 ? ['Foundational computer literacy'] : [consolidated[idx - 1].name],
        objectives: b.items.map((c) => `Master and implement ${c} in practical scenarios`),
      }));
    }
  }

  // General clustering: Group concepts into units of 2 to 3 concepts each
  const clusters: ClusteredModulePlan[] = [];
  const chunkSize = cleanTopics.length <= 4 ? 2 : 3;

  for (let i = 0; i < cleanTopics.length; i += chunkSize) {
    const chunk = cleanTopics.slice(i, i + chunkSize);
    const title = chunk.length === 1 ? chunk[0] : chunk.join(' & ');
    clusters.push({
      title,
      description: `Instructional unit covering core principles and problem solving in ${chunk.join(', ')}.`,
      concepts: chunk,
      prerequisites: i === 0 ? ['General domain fundamentals'] : [clusters[clusters.length - 1].title],
      objectives: chunk.map((c) => `Understand and apply concepts of ${c}`),
    });
  }

  return clusters;
}

export function calculateTargetModuleCount(
  topic: string,
  depth: string = 'comprehensive',
  totalHours: number = 40,
  topicList?: string[]
): number {
  const academicLevel: AcademicLevel =
    depth === 'introductory'
      ? 'beginner'
      : depth === 'rigorous'
      ? 'advanced'
      : 'intermediate';

  return calculateRecommendedModuleCount(topic, academicLevel, totalHours, topicList);
}

export async function planCurriculum(
  input: LearnerGoalInput,
  analyzed?: AnalyzedObjective
): Promise<CurriculumPlan> {
  return planIntelligentCurriculum(input);
}

export function generateAdaptiveFallbackPlan(
  input: LearnerGoalInput,
  analyzed: AnalyzedObjective,
  moduleCount: number,
  totalHours: number
): CurriculumPlan {
  const topic = input.topic;
  const topicLower = topic.toLowerCase();
  const hoursPerModule = Math.max(3, Math.round(totalHours / moduleCount));

  // 1. Topic Clustering: If user provided a list of topics, synthesize directly from semantic clusters!
  const validTopics = sanitizeInputSubtopics(input.topics, topic);
  if (validTopics.length > 0) {
    const clusters = clusterTopicsIntoCoherentModules(validTopics, analyzed.detectedDomain, topic);
    if (clusters.length > 0) {
      const clusteredModules: ModulePlan[] = clusters.map((cl, idx) => ({
        id: `mod-clustered-${idx + 1}`,
        moduleNumber: idx + 1,
        title: cl.title,
        description: cl.description,
        estimatedHours: Math.max(3, Math.round(totalHours / clusters.length)),
        prerequisites: cl.prerequisites,
        expectedOutcomes: [`Demonstrate practical mastery and problem-solving capability in ${cl.title}`],
        learningObjectives: cl.objectives.map((obj, oIdx) => ({
          id: `obj-${idx + 1}-${oIdx + 1}`,
          statement: obj,
          keyTerms: cl.concepts,
        })),
        searchQueries: {
          videoQueries: cl.concepts.map((c) => `${topic} ${c} tutorial lecture`),
          readingQueries: cl.concepts.map((c) => `${topic} ${c} documentation reference`),
        },
      }));

      return {
        courseTitle: `${topic}: Modular Learning Pathway`,
        description: `Cohesive structured curriculum covering ${(input.topics || [topic]).join(', ')} grouped into ${clusteredModules.length} comprehensive units.`,
        domain: analyzed.detectedDomain,
        level: analyzed.normalizedLevel,
        totalEstimatedHours: totalHours,
        modules: clusteredModules,
        pedagogicalRationale:
          'Semantic concept clustering ensuring closely coupled topics are taught together without unnecessary fragmentation.',
      };
    }
  }

  // 2. Narrow Focused / Single Concept Topics (e.g. Binary Search, Git Rebase, Python Decorators, Regex)
  if (isNarrowFocusedTopic(topicLower)) {
    if (moduleCount === 1) {
      return {
        courseTitle: `${topic}: Intensive Mastery Unit`,
        description: `A focused, rigorous instructional unit covering core mechanics, implementation, invariants, and edge cases for ${topic}.`,
        domain: analyzed.detectedDomain,
        level: analyzed.normalizedLevel,
        totalEstimatedHours: Math.min(totalHours, 8),
        modules: [
          {
            id: 'mod-focused-1',
            moduleNumber: 1,
            title: `${topic}: Core Foundations, Implementation & Problem Solving`,
            description: `Complete algorithmic principles, implementation details, invariants, and edge-case diagnostics for ${topic}.`,
            estimatedHours: Math.min(totalHours, 8),
            prerequisites: ['Foundational syntax in programming language'],
            expectedOutcomes: [
              `Complete proficiency in implementing and applying ${topic} in production and problem-solving scenarios`,
            ],
            learningObjectives: [
              {
                id: 'obj-1-1',
                statement: `Explain and implement the fundamental mechanics and architecture of ${topic}`,
                keyTerms: [topic.toLowerCase(), 'mechanics', 'syntax'],
              },
              {
                id: 'obj-1-2',
                statement: `Identify loop invariants, bounds, and edge cases in ${topic}`,
                keyTerms: [topic.toLowerCase(), 'invariants', 'edge cases'],
              },
              {
                id: 'obj-1-3',
                statement: `Solve representative technical challenges and optimize solutions using ${topic}`,
                keyTerms: [topic.toLowerCase(), 'optimization', 'problem solving'],
              },
            ],
            searchQueries: {
              videoQueries: [`${topic} tutorial complete guide`, `${topic} explained with code implementation`],
              readingQueries: [`${topic} official documentation guide`, `${topic} reference and practice`],
            },
          },
        ],
        pedagogicalRationale:
          'Focused single-unit architecture avoiding unnecessary module fragmentation for a single concept.',
      };
    } else {
      return {
        courseTitle: `${topic}: Core Foundations & Advanced Patterns`,
        description: `A two-part rigorous learning path covering foundational mechanics and advanced problem patterns for ${topic}.`,
        domain: analyzed.detectedDomain,
        level: analyzed.normalizedLevel,
        totalEstimatedHours: totalHours,
        modules: [
          {
            id: 'mod-focused-1',
            moduleNumber: 1,
            title: `${topic}: Core Mechanics, Syntax & Implementation`,
            description: `Foundational principles, execution model, syntactic invariants, and canonical implementations of ${topic}.`,
            estimatedHours: Math.round(totalHours / 2),
            prerequisites: ['Basic programming syntax'],
            expectedOutcomes: [`Implement canonical ${topic} patterns with zero edge-case bugs`],
            learningObjectives: [
              {
                id: 'obj-1-1',
                statement: `Implement canonical ${topic} with robust boundary checking`,
                keyTerms: [topic.toLowerCase(), 'implementation'],
              },
              {
                id: 'obj-1-2',
                statement: `Analyze time and space complexity of ${topic}`,
                keyTerms: [topic.toLowerCase(), 'complexity'],
              },
            ],
            searchQueries: {
              videoQueries: [`${topic} implementation tutorial`, `${topic} step by step guide`],
              readingQueries: [`${topic} documentation guide`, `${topic} reference guide`],
            },
          },
          {
            id: 'mod-focused-2',
            moduleNumber: 2,
            title: `${topic}: Advanced Patterns, Optimization & Applied Problem Solving`,
            description: `Advanced variations, monotonic predicates, interview problems, and real-world system applications of ${topic}.`,
            estimatedHours: Math.round(totalHours / 2),
            prerequisites: [`${topic}: Core Mechanics, Syntax & Implementation`],
            expectedOutcomes: [`Apply ${topic} to complex problem scenarios and production code`],
            learningObjectives: [
              {
                id: 'obj-2-1',
                statement: `Apply ${topic} to multi-condition and advanced algorithmic challenges`,
                keyTerms: [topic.toLowerCase(), 'advanced', 'patterns'],
              },
              {
                id: 'obj-2-2',
                statement: `Optimize performance and resolve production edge cases involving ${topic}`,
                keyTerms: [topic.toLowerCase(), 'optimization'],
              },
            ],
            searchQueries: {
              videoQueries: [`${topic} advanced patterns tutorial`, `${topic} problem solving practice`],
              readingQueries: [`${topic} advanced techniques documentation`, `${topic} design patterns`],
            },
          },
        ],
        pedagogicalRationale:
          'Two-stage progression: foundational implementation followed by advanced optimization and problem patterns.',
      };
    }
  }

  const modules: ModulePlan[] = [];

  // 3. Subject-Specific Adaptive Fallbacks
  if (topicLower.includes('python')) {
    if (moduleCount === 1) {
      modules.push({
        id: 'mod-fallback-1',
        moduleNumber: 1,
        title: 'Python Core Syntax, Data Structures & Applied Programming',
        description:
          'Comprehensive instruction covering syntax, control flow, functions, built-in collections, and practical problem solving in Python.',
        estimatedHours: totalHours,
        prerequisites: ['Basic computer literacy'],
        expectedOutcomes: ['Write idiomatic, modular Python scripts applying core data structures and control flow'],
        learningObjectives: [
          {
            id: 'obj-1-1',
            statement: 'Implement Python syntax, primitive types, and conditional logic',
            keyTerms: ['python', 'syntax', 'variables'],
          },
          {
            id: 'obj-1-2',
            statement: 'Manipulate lists, dictionaries, tuples, and sets with functions',
            keyTerms: ['functions', 'collections', 'loops'],
          },
          {
            id: 'obj-1-3',
            statement: 'Build practical scripts with error handling and modular design',
            keyTerms: ['exceptions', 'modular', 'scripting'],
          },
        ],
        searchQueries: {
          videoQueries: ['Python full course for beginners tutorial', 'Python programming complete guide'],
          readingQueries: ['Python official documentation tutorial', 'Automate the Boring Stuff with Python'],
        },
      });
    } else if (moduleCount === 2) {
      modules.push(
        {
          id: 'mod-fallback-1',
          moduleNumber: 1,
          title: 'Python Syntax, Control Flow & Modular Functions',
          description:
            'Fundamental syntax, primitive types, loops, branching statements, and function architecture in Python.',
          estimatedHours: Math.round(totalHours / 2),
          prerequisites: ['Basic computer literacy'],
          expectedOutcomes: ['Write modular Python functions with robust control flow'],
          learningObjectives: [
            {
              id: 'obj-1-1',
              statement: 'Initialize variables and implement conditional branching and loops',
              keyTerms: ['syntax', 'loops', 'conditionals'],
            },
            {
              id: 'obj-1-2',
              statement: 'Design reusable functions with positional and keyword arguments',
              keyTerms: ['functions', 'parameters', 'scope'],
            },
          ],
          searchQueries: {
            videoQueries: ['Python syntax functions loops tutorial', 'Python basics tutorial'],
            readingQueries: ['Python tutorial official docs', 'Python functions guide'],
          },
        },
        {
          id: 'mod-fallback-2',
          moduleNumber: 2,
          title: 'Composite Data Structures, OOP & Real-World Projects',
          description:
            'Lists, dictionaries, sets, object-oriented programming, and file handling in Python.',
          estimatedHours: Math.round(totalHours / 2),
          prerequisites: ['Python Syntax, Control Flow & Modular Functions'],
          expectedOutcomes: ['Design object-oriented classes and data processing pipelines'],
          learningObjectives: [
            {
              id: 'obj-2-1',
              statement: 'Manipulate dynamic collections including lists, tuples, and dictionaries',
              keyTerms: ['lists', 'dictionaries', 'collections'],
            },
            {
              id: 'obj-2-2',
              statement: 'Construct object-oriented classes and handle exceptions cleanly',
              keyTerms: ['classes', 'oop', 'exceptions'],
            },
          ],
          searchQueries: {
            videoQueries: ['Python data structures OOP tutorial', 'Python classes file handling'],
            readingQueries: ['Python data structures documentation', 'Python OOP official guide'],
          },
        }
      );
    } else {
      const titles = [
        'Python Language Foundations & Control Flow',
        'Data Structures, Functions & Modular Architecture',
        'Object-Oriented Programming & File Systems',
        'Error Handling, Generators & Functional Primitives',
        'Real-World Projects, Packages & Ecosystem Tooling',
        'Advanced Metaprogramming, Asyncio & Concurrency',
        'Design Patterns & Production Software Architecture',
      ].slice(0, moduleCount);

      titles.forEach((title, idx) => {
        modules.push({
          id: `mod-fallback-${idx + 1}`,
          moduleNumber: idx + 1,
          title,
          description: `Comprehensive instruction and practical exercises covering ${title}.`,
          estimatedHours: hoursPerModule,
          prerequisites: idx === 0 ? ['Basic computer literacy'] : [titles[idx - 1]],
          expectedOutcomes: [`Proficiency in applying ${title} concepts to production-grade Python scripts`],
          learningObjectives: [
            {
              id: `obj-${idx + 1}-1`,
              statement: `Explain and implement fundamental concepts of ${title}`,
              keyTerms: ['python', 'syntax', 'logic'],
            },
            {
              id: `obj-${idx + 1}-2`,
              statement: `Design modular, testable solutions utilizing ${title}`,
              keyTerms: ['functions', 'data structures'],
            },
          ],
          searchQueries: {
            videoQueries: [`Python ${title} tutorial full course`, `Python ${title} explained with examples`],
            readingQueries: [`Python official docs ${title}`, `Python tutorial ${title}`],
          },
        });
      });
    }
  } else if (topicLower.includes('react')) {
    const titles = [
      'React Core Architecture, JSX & Virtual DOM',
      'Components, Props & State Management with Hooks',
      'Side Effects, Lifecycle & Asynchronous Data Fetching',
      'Routing, Component Composition & UI Design Systems',
      'Performance Optimization, Testing & Production Deployment',
      'Advanced State Architecture, Redux & Server Components',
    ].slice(0, moduleCount);

    titles.forEach((title, idx) => {
      modules.push({
        id: `mod-fallback-${idx + 1}`,
        moduleNumber: idx + 1,
        title,
        description: `Hands-on development of modern user interfaces with ${title}.`,
        estimatedHours: hoursPerModule,
        prerequisites: idx === 0 ? ['Modern JavaScript (ES6+)', 'HTML & CSS basics'] : [titles[idx - 1]],
        expectedOutcomes: [`Ability to build responsive and performant React components using ${title}`],
        learningObjectives: [
          {
            id: `obj-${idx + 1}-1`,
            statement: `Master component patterns and reactive state management in ${title}`,
            keyTerms: ['react', 'hooks', 'virtual dom'],
          },
          {
            id: `obj-${idx + 1}-2`,
            statement: `Build and debug real-world applications applying ${title}`,
            keyTerms: ['components', 'state'],
          },
        ],
        searchQueries: {
          videoQueries: [`React ${title} full tutorial`, `React.dev ${title} practical guide`],
          readingQueries: [`React official documentation ${title}`, `React hooks ${title}`],
        },
      });
    });
  } else if (topicLower.includes('differential equation')) {
    const titles = [
      'First-Order Differential Equations & Separable Solutions',
      'Linear Second-Order Equations & Homogeneous Systems',
      'Non-Homogeneous Equations & Method of Undetermined Coefficients',
      'Laplace Transforms & Initial Value Problems',
      'Series Solutions & Systems of Differential Equations',
    ].slice(0, moduleCount);

    titles.forEach((title, idx) => {
      modules.push({
        id: `mod-fallback-${idx + 1}`,
        moduleNumber: idx + 1,
        title,
        description: `Mathematical derivations, analytical techniques, and worked examples for ${title}.`,
        estimatedHours: hoursPerModule,
        prerequisites: idx === 0 ? ['Single-variable calculus (derivatives & integrals)'] : [titles[idx - 1]],
        expectedOutcomes: [`Analytical problem-solving skills for differential equations of type ${title}`],
        learningObjectives: [
          {
            id: `obj-${idx + 1}-1`,
            statement: `Derive and solve analytical formulations for ${title}`,
            keyTerms: ['derivatives', 'integrals', 'differential equation'],
          },
          {
            id: `obj-${idx + 1}-2`,
            statement: `Apply ${title} to physical and engineering problem sets`,
            keyTerms: ['laplace', 'homogeneous', 'solutions'],
          },
        ],
        searchQueries: {
          videoQueries: [`Differential equations ${title} lecture worked examples`, `3Blue1Brown Khan Academy ${title}`],
          readingQueries: [`Differential equations textbook ${title}`, `MIT OpenCourseWare ${title}`],
        },
      });
    });
  } else if (
    topicLower.includes('retrieval-augmented') ||
    topicLower.includes('retrieval augmented') ||
    topicLower.includes('rag') ||
    topicLower.includes('vector search')
  ) {
    const ragModulesData = [
      {
        title: 'Foundations of Vector Search and Embedding Spaces',
        description:
          'Mathematical foundations of dense embeddings, vector spaces, distance metrics, and Approximate Nearest Neighbor (ANN) indexing structures.',
        prerequisites: ['Basic Python programming', 'Fundamental linear algebra (vectors and dot products)'],
        outcomes: ['Build and benchmark vector retrieval pipelines using FAISS and HNSW graphs'],
        objectives: [
          {
            statement: 'Analyze high-dimensional embedding spaces, cosine similarity, dot products, and Euclidean distance metrics',
            keyTerms: ['embeddings', 'vector space', 'cosine similarity', 'dot product', 'euclidean distance'],
          },
          {
            statement: 'Compare Approximate Nearest Neighbor (ANN) index structures including HNSW, IVF-PQ, and ScaNN',
            keyTerms: ['ann', 'hnsw', 'ivf', 'pq', 'faiss', 'indexing'],
          },
          {
            statement: 'Implement dense vector indexing and measure retrieval recall@k and query latency',
            keyTerms: ['vector index', 'recall@k', 'latency', 'vector database'],
          },
        ],
        videoQueries: [
          'Vector search Approximate Nearest Neighbors FAISS HNSW tutorial',
          'Embedding spaces vector similarity cosine dot product lecture',
        ],
        readingQueries: [
          'FAISS vector search documentation index types wiki',
          'Pinecone vector similarity metrics and HNSW index architecture',
        ],
      },
      {
        title: 'Advanced Chunking, Parsing, and Hybrid Search Strategies',
        description:
          'Document decomposition, semantic chunk boundary detection, multi-modal parsing, and hybrid retrieval fusing lexical BM25 with dense vector embeddings.',
        prerequisites: ['Foundations of Vector Search and Embedding Spaces'],
        outcomes: ['Implement and compare hybrid dense and sparse retrieval pipelines with Reciprocal Rank Fusion'],
        objectives: [
          {
            statement: 'Design semantic and recursive character chunking strategies that preserve sentence boundaries and table structure',
            keyTerms: ['chunking', 'chunk size', 'chunk overlap', 'semantic chunking', 'token splitting'],
          },
          {
            statement: 'Enrich document chunks with hierarchical metadata, document summaries, and entity tags for filtered retrieval',
            keyTerms: ['metadata filtering', 'payload enrichment', 'document hierarchy'],
          },
          {
            statement: 'Implement hybrid search combining BM25 keyword matching with dense vector retrieval using Reciprocal Rank Fusion (RRF)',
            keyTerms: ['hybrid search', 'bm25', 'sparse retrieval', 'dense retrieval', 'rrf', 'reciprocal rank fusion'],
          },
        ],
        videoQueries: [
          'Advanced chunking strategies document parsing LangChain LlamaIndex',
          'Hybrid search BM25 dense vectors reciprocal rank fusion tutorial',
        ],
        readingQueries: [
          'LlamaIndex document chunking and node parsing official documentation',
          'Elasticsearch hybrid search RRF reciprocal rank fusion guide',
        ],
      },
      {
        title: 'Advanced RAG Architectures: Re-ranking, Query Transformation, and Routing',
        description:
          'Two-stage retrieval optimization using cross-encoder re-ranking, query expansion with HyDE and multi-query synthesis, and dynamic semantic routing.',
        prerequisites: ['Advanced Chunking, Parsing, and Hybrid Search Strategies'],
        outcomes: ['Deploy a two-stage re-ranking pipeline and dynamic query router optimizing context relevance'],
        objectives: [
          {
            statement: 'Implement cross-encoder re-ranking pipelines using ColBERT and modern neural re-rankers to maximize top-k precision',
            keyTerms: ['re-ranking', 'reranker', 'cross-encoder', 'colbert', 'cohere rerank', 'flashrank'],
          },
          {
            statement: 'Construct query transformation workflows including Hypothetical Document Embeddings (HyDE) and multi-query expansion',
            keyTerms: ['query transformation', 'hyde', 'multi-query', 'query rewriting', 'sub-queries'],
          },
          {
            statement: 'Design semantic routing mechanisms directing incoming queries to specialized vector indices and domain tools',
            keyTerms: ['semantic routing', 'retrieval routing', 'query intent', 'multi-index'],
          },
        ],
        videoQueries: [
          'Cross-encoder re-ranking ColBERT Cohere re-rank tutorial',
          'Query transformation HyDE multi-query routing RAG architecture',
        ],
        readingQueries: [
          'Cohere re-rank documentation cross-encoder retrieval guide',
          'LangChain query transformation and semantic routing documentation',
        ],
      },
      {
        title: 'Production Evaluation, Guardrails, and Observability in RAG',
        description:
          'Comprehensive evaluation frameworks (Ragas, TruLens), automated benchmarking of context relevance and faithfulness, input/output guardrails, and distributed telemetry.',
        prerequisites: ['Advanced RAG Architectures: Re-ranking, Query Transformation, and Routing'],
        outcomes: ['Benchmark, trace, and secure an end-to-end production RAG system with verifiable quality metrics'],
        objectives: [
          {
            statement: 'Evaluate the RAG Triad: Context Relevance, Groundedness (Faithfulness), and Answer Relevance using automated evaluation harnesses',
            keyTerms: ['ragas', 'trulens', 'rag triad', 'groundedness', 'faithfulness', 'context relevance', 'hallucination'],
          },
          {
            statement: 'Implement input validation and output guardrails mitigating prompt injection, jailbreaks, and PII leakage',
            keyTerms: ['guardrails', 'nemo guardrails', 'prompt injection', 'safety', 'pii'],
          },
          {
            statement: 'Deploy distributed tracing and observability monitoring latency, token budgets, retrieval scores, and failure patterns',
            keyTerms: ['observability', 'distributed tracing', 'telemetry', 'openinference', 'langfuse'],
          },
        ],
        videoQueries: [
          'RAG evaluation Ragas TruLens metrics groundedness tutorial',
          'Production RAG guardrails observability tracing Langfuse',
        ],
        readingQueries: [
          'Ragas documentation RAG evaluation metrics and benchmarking',
          'NeMo Guardrails and OpenInference tracing documentation',
        ],
      },
    ].slice(0, moduleCount);

    ragModulesData.forEach((mData, idx) => {
      modules.push({
        id: `mod-fallback-${idx + 1}`,
        moduleNumber: idx + 1,
        title: mData.title,
        description: mData.description,
        estimatedHours: hoursPerModule,
        prerequisites: mData.prerequisites,
        expectedOutcomes: mData.outcomes,
        learningObjectives: mData.objectives.map((obj, oIdx) => ({
          id: `obj-${idx + 1}-${oIdx + 1}`,
          statement: obj.statement,
          keyTerms: obj.keyTerms,
        })),
        searchQueries: {
          videoQueries: mData.videoQueries,
          readingQueries: mData.readingQueries,
        },
      });
    });
  } else if (topicLower.includes('large language model') || topicLower.includes('llm')) {
    const titles = [
      'Foundations of Large Language Models & Self-Attention',
      'Transformer Architecture, Multi-Head Attention & Positional Encoding',
      'Tokenization, Byte-Pair Encoding & Pretraining Objectives',
      'Prompt Engineering, In-Context Learning & Inference Optimization',
      'Retrieval-Augmented Generation (RAG) & Vector Databases',
      'Supervised Fine-Tuning, RLHF & Direct Preference Optimization',
      'Evaluation, Guardrails & Production Deployment',
    ].slice(0, moduleCount);

    titles.forEach((title, idx) => {
      modules.push({
        id: `mod-fallback-${idx + 1}`,
        moduleNumber: idx + 1,
        title,
        description: `Theoretical principles and engineering implementations for ${title}.`,
        estimatedHours: hoursPerModule,
        prerequisites: idx === 0 ? ['Python programming', 'Basic neural networks and matrix algebra'] : [titles[idx - 1]],
        expectedOutcomes: [`Expertise in designing, tuning, and deploying systems utilizing ${title}`],
        learningObjectives: [
          {
            id: `obj-${idx + 1}-1`,
            statement: `Analyze and implement technical architectures for ${title}`,
            keyTerms: ['transformers', 'attention', 'llm'],
          },
          {
            id: `obj-${idx + 1}-2`,
            statement: `Evaluate performance and trade-offs of ${title}`,
            keyTerms: ['inference', 'fine-tuning', 'rag'],
          },
        ],
        searchQueries: {
          videoQueries: [`Large language models ${title} Andrej Karpathy lecture`, `Transformers ${title} explained`],
          readingQueries: [`Attention Is All You Need arXiv paper ${title}`, `Hugging Face documentation ${title}`],
        },
      });
    });
  } else if (
    topicLower.includes('ca final') ||
    topicLower.includes('financial reporting') ||
    topicLower.includes('ind as')
  ) {
    const caFinalModulesData = [
      {
        title: 'Ind AS 109: Financial Instruments — Recognition, Measurement & ECL Model',
        description:
          'Comprehensive study of Ind AS 109 and Ind AS 32: classification of financial assets and liabilities, amortised cost using EIR, FVTOCI, FVTPL, Expected Credit Loss (ECL 3-Stage Model), and hedge accounting.',
        prerequisites: ['Ind AS 1: Presentation of Financial Statements', 'Time Value of Money & Present Value calculations'],
        outcomes: ['Solve complex examination problems on Ind AS 109 amortised cost, compound financial instruments, and ECL provisioning'],
        objectives: [
          { statement: 'Classify financial instruments using contractual cash flow characteristics and business model test', keyTerms: ['classification', 'business model', 'amortised cost', 'fvtpl', 'fvtoci'] },
          { statement: 'Calculate amortised cost, effective interest rate (EIR), and transaction costs allocation', keyTerms: ['eir', 'effective interest', 'transaction costs', 'amortised cost'] },
          { statement: 'Apply the 3-stage Expected Credit Loss (ECL) impairment model and compute provision matrix', keyTerms: ['ecl', 'expected credit loss', 'impairment', 'provision matrix', 'default'] },
          { statement: 'Document and account for fair value hedges and cash flow hedges under Ind AS 109', keyTerms: ['hedge accounting', 'hedged item', 'hedging instrument', 'cash flow hedge'] },
        ],
        videoQueries: [
          'CA Final Financial Reporting Ind AS 109 Financial Instruments lecture revision',
          'Ind AS 109 ECL Model Expected Credit Loss solved problems ICAI',
        ],
        readingQueries: [
          'ICAI Educational Material Ind AS 109 Financial Instruments',
          'CA Final Financial Reporting Ind AS 109 ICAI Study Material',
        ],
      },
      {
        title: 'Ind AS 115: Revenue from Contracts with Customers & 5-Step Model',
        description:
          'Rigorous application of Ind AS 115: identifying contracts, performance obligations, transaction price determination, variable consideration, allocating price, and revenue recognition over time vs point in time.',
        prerequisites: ['Basic revenue concepts under AS 9 and Ind AS framework'],
        outcomes: ['Apply the 5-step model to complex multi-element customer contracts and contract modifications'],
        objectives: [
          { statement: 'Master the 5-step revenue recognition model under Ind AS 115', keyTerms: ['5-step model', 'contract', 'performance obligation', 'transaction price'] },
          { statement: 'Identify distinct goods and services and account for contract bundling and warranties', keyTerms: ['distinct', 'performance obligations', 'bundling', 'warranty'] },
          { statement: 'Estimate variable consideration with constraint and account for significant financing components', keyTerms: ['variable consideration', 'constraint', 'financing component'] },
          { statement: 'Account for contract asset, contract liability, and capitalisation of contract acquisition costs', keyTerms: ['contract asset', 'contract liability', 'contract costs'] },
        ],
        videoQueries: [
          'CA Final FR Ind AS 115 Revenue from Contracts with Customers playlist',
          'Ind AS 115 5-Step Model practical questions CA Final ICAI',
        ],
        readingQueries: [
          'ICAI Educational Material on Ind AS 115 Revenue from Contracts with Customers',
          'ICAI CA Final Study Material Paper 1 Financial Reporting Ind AS 115',
        ],
      },
      {
        title: 'Ind AS 116 & Leases: Right-of-Use Asset & Lease Liability Measurement',
        description:
          'In-depth coverage of Ind AS 116: lease definition, exemptions, initial and subsequent measurement of Right-of-Use (ROU) asset and lease liability, lease modifications, and sale & leaseback transactions.',
        prerequisites: ['Ind AS 109 Financial Instruments (EIR calculation)'],
        outcomes: ['Account for complex lease contracts, variable lease payments, lease remeasurement, and disclosures'],
        objectives: [
          { statement: 'Identify leases and distinguish lease components from non-lease components', keyTerms: ['lease identification', 'right-of-use', 'rou asset', 'non-lease'] },
          { statement: 'Measure lease liability and ROU asset at commencement date using incremental borrowing rate', keyTerms: ['lease liability', 'incremental borrowing rate', 'commencement date'] },
          { statement: 'Account for lease modifications, reassessment of lease term, and sale and leaseback transactions', keyTerms: ['lease modification', 'sale and leaseback', 'remeasurement'] },
        ],
        videoQueries: [
          'CA Final Ind AS 116 Leases full revision lecture ICAI',
          'Ind AS 116 Right of Use Asset Lease Liability solved questions',
        ],
        readingQueries: [
          'ICAI Technical Guide on Ind AS 116 Leases',
          'CA Final FR Study Material Ind AS 116 Leases ICAI',
        ],
      },
      {
        title: 'Consolidated Financial Statements & Business Combinations (Ind AS 103 & 110)',
        description:
          'Advanced corporate consolidation under Ind AS 103 and Ind AS 110: acquisition method, purchase consideration, non-controlling interest (NCI), goodwill/capital reserve, elimination of intra-group transactions, and joint arrangements (Ind AS 111).',
        prerequisites: ['Ind AS 109 Financial Instruments', 'Corporate accounting basics'],
        outcomes: ['Prepare consolidated balance sheet and statement of profit and loss with step acquisitions and foreign subsidiaries'],
        objectives: [
          { statement: 'Apply the acquisition method under Ind AS 103: purchase consideration, identifiable assets, and liabilities', keyTerms: ['acquisition method', 'purchase consideration', 'business combination', 'ind as 103'] },
          { statement: 'Calculate goodwill and non-controlling interest (NCI) using proportionate share and fair value methods', keyTerms: ['goodwill', 'capital reserve', 'nci', 'non-controlling interest'] },
          { statement: 'Prepare consolidated balance sheets eliminating intra-group balances and unrealized profits', keyTerms: ['consolidation', 'intra-group', 'unrealized profit', 'ind as 110'] },
        ],
        videoQueries: [
          'CA Final FR Business Combinations Ind AS 103 Consolidation Ind AS 110 full course',
          'Consolidated Financial Statements CA Final FR questions ICAI',
        ],
        readingQueries: [
          'ICAI Educational Material on Ind AS 103 Business Combinations',
          'ICAI CA Final Study Material Paper 1 Consolidation Ind AS 110',
        ],
      },
    ].slice(0, moduleCount);

    caFinalModulesData.forEach((mData, idx) => {
      modules.push({
        id: `mod-fallback-${idx + 1}`,
        moduleNumber: idx + 1,
        title: mData.title,
        description: mData.description,
        estimatedHours: hoursPerModule,
        prerequisites: mData.prerequisites,
        expectedOutcomes: mData.outcomes,
        learningObjectives: mData.objectives.map((obj, oIdx) => ({
          id: `obj-${idx + 1}-${oIdx + 1}`,
          statement: obj.statement,
          keyTerms: obj.keyTerms,
        })),
        searchQueries: {
          videoQueries: mData.videoQueries,
          readingQueries: mData.readingQueries,
        },
      });
    });
  } else {
    // Universal domain-adaptive synthesis
    for (let i = 1; i <= moduleCount; i++) {
      let stagePrefix = 'Foundations & Core Principles of';
      if (moduleCount === 1) stagePrefix = 'Comprehensive Mastery of';
      else if (moduleCount === 2) stagePrefix = i === 1 ? 'Foundations & Mechanics of' : 'Applied Methods & Synthesis in';
      else {
        if (i === 2) stagePrefix = 'Key Mechanisms & Essential Techniques of';
        if (i === 3) stagePrefix = 'Advanced Methods & Applied Practice in';
        if (i === 4) stagePrefix = 'Systems Integration & Case Studies in';
        if (i >= 5) stagePrefix = 'Capstone Mastery & Advanced Frontiers of';
      }

      const title = `${stagePrefix} ${topic}`;
      modules.push({
        id: `mod-fallback-${i}`,
        moduleNumber: i,
        title,
        description: `In-depth academic exploration of ${title} with practical and theoretical rigor.`,
        estimatedHours: hoursPerModule,
        prerequisites: i === 1 ? ['Foundational knowledge in the discipline'] : [`Module ${i - 1}`],
        expectedOutcomes: [`Demonstrated proficiency in ${title}`],
        learningObjectives: [
          {
            id: `obj-${i}-1`,
            statement: `Synthesize and apply core principles of ${title}`,
            keyTerms: [topic.toLowerCase()],
          },
          {
            id: `obj-${i}-2`,
            statement: `Solve complex problem scenarios involving ${title}`,
            keyTerms: [topic.toLowerCase(), 'application'],
          },
        ],
        searchQueries: {
          videoQueries: [`${topic} ${title} comprehensive tutorial lecture`, `${topic} full course`],
          readingQueries: [`${topic} official documentation textbook`, `${topic} reference guide`],
        },
      });
    }
  }

  return {
    courseTitle: `${topic}: Complete ${analyzed.normalizedLevel.charAt(0).toUpperCase() + analyzed.normalizedLevel.slice(1)} Pathway`,
    description: `A topic-adaptive, pedagogy-first learning path designed to master ${topic} systematically through verified lectures, reading materials, and assessments.`,
    domain: analyzed.detectedDomain,
    level: analyzed.normalizedLevel,
    totalEstimatedHours: totalHours,
    modules,
    pedagogicalRationale: `Structured sequential mastery designed for ${analyzed.detectedDomain} with domain-specific pedagogical emphasis.`,
  };
}
