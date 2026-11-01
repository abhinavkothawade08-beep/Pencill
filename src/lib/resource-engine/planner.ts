import { callGemini, GeminiClientError } from '@/services/ai/gemini/client';
import {
  LearnerGoalInput,
  AnalyzedObjective,
  CurriculumPlan,
  ModulePlan,
  EducationalDomain,
} from './types';

export async function planCurriculum(
  input: LearnerGoalInput,
  analyzed: AnalyzedObjective
): Promise<CurriculumPlan> {
  const totalTargetHours = (input.weeklyStudyHours || 10) * (input.targetWeeks || 4);
  const targetModuleCount = calculateTargetModuleCount(input.topic, input.depth, totalTargetHours);

  let plan: CurriculumPlan;

  try {
    const aiPlan = await planCurriculumWithGemini(input, analyzed, targetModuleCount, totalTargetHours);
    if (aiPlan && aiPlan.modules && aiPlan.modules.length >= 2) {
      plan = aiPlan;
    } else {
      plan = generateAdaptiveFallbackPlan(input, analyzed, targetModuleCount, totalTargetHours);
    }
  } catch (err) {
    console.warn('[CurriculumPlanner] Gemini planning unavailable or failed, utilizing topic-adaptive fallback planner:', (err as Error).message);
    plan = generateAdaptiveFallbackPlan(input, analyzed, targetModuleCount, totalTargetHours);
  }

  // Apply user-specified custom title if provided
  if (input.title && input.title.trim().length > 0) {
    plan.courseTitle = input.title.trim();
  }

  // Apply user learning objectives to modules if provided
  if (input.learningObjectives && input.learningObjectives.length > 0) {
    input.learningObjectives.forEach((lo, idx) => {
      const targetModule = plan.modules[idx % plan.modules.length];
      if (targetModule) {
        targetModule.learningObjectives.push({
          id: `custom-lo-${idx + 1}`,
          statement: lo.text,
          keyTerms: lo.text.toLowerCase().split(/\s+/).filter(w => w.length > 4),
        });
        if (lo.successCriteria) {
          targetModule.expectedOutcomes.push(lo.successCriteria);
        }
      }
    });
  }

  // Apply user blueprint overrides (renamed modules, customized topics)
  if (input.curriculumBlueprintOverrides && input.curriculumBlueprintOverrides.length > 0) {
    for (const override of input.curriculumBlueprintOverrides) {
      if (override.moduleIndex >= 0 && override.moduleIndex < plan.modules.length) {
        if (override.title) {
          plan.modules[override.moduleIndex].title = override.title;
        }
        if (override.customObjectives && override.customObjectives.length > 0) {
          plan.modules[override.moduleIndex].expectedOutcomes = override.customObjectives;
        }
      }
    }
  }

  return plan;
}

function calculateTargetModuleCount(
  topic: string,
  depth: string = 'comprehensive',
  totalHours: number
): number {
  const topicLower = topic.toLowerCase();
  
  // Dedicated RAG curriculum
  if (
    topicLower.includes('rag') ||
    topicLower.includes('retrieval-augmented') ||
    topicLower.includes('retrieval augmented')
  ) {
    return 4;
  }
  if (
    topicLower.includes('large language model') ||
    topicLower.includes('llm') ||
    topicLower.includes('full stack') ||
    topicLower.includes('deep learning') ||
    topicLower.includes('machine learning')
  ) {
    return Math.min(7, Math.max(5, Math.round(totalHours / 8)));
  }

  // Standard engineering / math / science topics
  if (
    topicLower.includes('differential equation') ||
    topicLower.includes('react') ||
    topicLower.includes('data structure') ||
    topicLower.includes('calculus')
  ) {
    return Math.min(6, Math.max(4, Math.round(totalHours / 10)));
  }

  // Focused / introductory subjects
  if (topicLower.includes('basic') || topicLower.includes('introduction') || depth === 'introductory') {
    return Math.min(4, Math.max(3, Math.round(totalHours / 10)));
  }

  return Math.min(5, Math.max(3, Math.round(totalHours / 10)));
}

async function planCurriculumWithGemini(
  input: LearnerGoalInput,
  analyzed: AnalyzedObjective,
  targetModuleCount: number,
  totalHours: number
): Promise<CurriculumPlan> {
  const prompt = `
You are the Chief Learning Experience Designer and Academic Architect at Pencill.
Your task is to design a rigorous, logically sequenced curriculum for:
- Topic: "${input.topic}"
- Domain: ${analyzed.detectedDomain}
- Academic Level: ${analyzed.normalizedLevel}
- Learning Goal: ${input.learningGoal}
- Preferred Style: ${input.learningStyle}
- Total Target Study Hours: ${totalHours} hours
- Recommended Module Count: ${targetModuleCount} modules (adapt appropriately to concept complexity)
- Target Language: ${input.language || 'English'}
${input.targetExam ? `- Target Examination / Certification: ${input.targetExam}` : ''}
${input.priorKnowledge ? `- Learner Prior Knowledge: ${input.priorKnowledge}` : ''}

PEDAGOGICAL INVARIANTS:
1. Progress logically from foundational prerequisites to advanced applications.
2. For programming / engineering: prioritize practical tutorials, real projects, and code architecture.
3. For mathematics: prioritize mathematical foundations, analytical methods, derivations, and worked problem-solving.
4. For natural sciences: prioritize physical intuition, formal laws, and problem applications.
5. Every module MUST have:
   - Meaningful, specific title (no generic placeholders like "Module 1" or "Basics")
   - Clear description
   - 3 to 4 specific learning objectives (actionable, stating what the learner will be able to do)
   - Prerequisites
   - Realistic estimated study hours (sum of module hours should approximate total hours)
   - 2-3 focused YouTube video search queries
   - 2 focused reading/documentation search queries
   - Expected learning outcomes

Output pure, valid JSON with this exact schema:
{
  "courseTitle": "Concise Course Title",
  "description": "Comprehensive course description",
  "domain": "${analyzed.detectedDomain}",
  "level": "${analyzed.normalizedLevel}",
  "totalEstimatedHours": ${totalHours},
  "pedagogicalRationale": "Brief explanation of sequencing strategy",
  "modules": [
    {
      "moduleNumber": 1,
      "title": "Module Title",
      "description": "Module overview",
      "estimatedHours": 8,
      "prerequisites": ["Prerequisite 1"],
      "learningObjectives": [
        {
          "statement": "Apply...",
          "bloomTaxonomyLevel": "understand",
          "keyTerms": ["term1", "term2"]
        }
      ],
      "expectedOutcomes": ["Outcome 1"],
      "searchQueries": {
        "videoQueries": ["focused search query 1", "focused search query 2"],
        "readingQueries": ["documentation or textbook search query"]
      }
    }
  ]
}
`.trim();

  const responseText = await callGemini(prompt, undefined, {
    jsonMode: true,
    temperature: 0.2,
  });

  const parsed = extractJson<CurriculumPlan>(responseText);
  if (!parsed || !Array.isArray(parsed.modules)) {
    throw new Error('Gemini response did not contain a valid modules array');
  }

  // Format module IDs and ensure search queries exist
  const formattedModules: ModulePlan[] = parsed.modules.map((m, idx) => ({
    id: `mod-plan-${idx + 1}`,
    moduleNumber: idx + 1,
    title: m.title || `Module ${idx + 1}: Foundations`,
    description: m.description || '',
    estimatedHours: m.estimatedHours || Math.round(totalHours / parsed.modules.length),
    prerequisites: m.prerequisites || [],
    expectedOutcomes: m.expectedOutcomes || [],
    learningObjectives: (m.learningObjectives || []).map((obj: any, oIdx: number) => ({
      id: `obj-${idx + 1}-${oIdx + 1}`,
      statement: typeof obj === 'string' ? obj : obj.statement || 'Understand core module concept',
      bloomTaxonomyLevel: obj.bloomTaxonomyLevel || 'understand',
      keyTerms: obj.keyTerms || [],
    })),
    searchQueries: {
      videoQueries: m.searchQueries?.videoQueries || [`${input.topic} ${m.title} tutorial lecture`],
      readingQueries: m.searchQueries?.readingQueries || [`${input.topic} ${m.title} documentation textbook`],
    },
  }));

  return {
    courseTitle: parsed.courseTitle || `${input.topic} Complete Mastery Path`,
    description: parsed.description || `Comprehensive structured path for ${input.topic}`,
    domain: analyzed.detectedDomain,
    level: analyzed.normalizedLevel,
    totalEstimatedHours: totalHours,
    modules: formattedModules,
    pedagogicalRationale: parsed.pedagogicalRationale || 'Systematic progression from principles to applications.',
  };
}

function extractJson<T>(raw: string): T {
  let clean = raw.trim();
  if (clean.startsWith('```')) {
    const firstNewline = clean.indexOf('\n');
    const lastFence = clean.lastIndexOf('```');
    if (firstNewline !== -1 && lastFence > firstNewline) {
      clean = clean.substring(firstNewline + 1, lastFence).trim();
    }
  }
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(clean) as T;
}

function generateAdaptiveFallbackPlan(
  input: LearnerGoalInput,
  analyzed: AnalyzedObjective,
  moduleCount: number,
  totalHours: number
): CurriculumPlan {
  const topic = input.topic;
  const topicLower = topic.toLowerCase();
  const hoursPerModule = Math.max(4, Math.round(totalHours / moduleCount));

  const modules: ModulePlan[] = [];

  if (topicLower.includes('python')) {
    const titles = [
      'Python Language Foundations & Control Flow',
      'Data Structures, Functions & Modular Architecture',
      'Object-Oriented Programming & File Systems',
      'Error Handling, Generators & Functional Primitives',
      'Real-World Projects, Packages & Ecosystem Tooling',
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
  } else if (topicLower.includes('react')) {
    const titles = [
      'React Core Architecture, JSX & Virtual DOM',
      'Components, Props & State Management with Hooks',
      'Side Effects, Lifecycle & Asynchronous Data Fetching',
      'Routing, Component Composition & UI Design Systems',
      'Performance Optimization, Testing & Production Deployment',
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
        description: 'Mathematical foundations of dense embeddings, vector spaces, distance metrics, and Approximate Nearest Neighbor (ANN) indexing structures.',
        prerequisites: ['Basic Python programming', 'Fundamental linear algebra (vectors and dot products)'],
        outcomes: ['Build and benchmark vector retrieval pipelines using FAISS and HNSW graphs'],
        objectives: [
          { statement: 'Analyze high-dimensional embedding spaces, cosine similarity, dot products, and Euclidean distance metrics', keyTerms: ['embeddings', 'vector space', 'cosine similarity', 'dot product', 'euclidean distance'] },
          { statement: 'Compare Approximate Nearest Neighbor (ANN) index structures including HNSW, IVF-PQ, and ScaNN', keyTerms: ['ann', 'hnsw', 'ivf', 'pq', 'faiss', 'indexing'] },
          { statement: 'Implement dense vector indexing and measure retrieval recall@k and query latency', keyTerms: ['vector index', 'recall@k', 'latency', 'vector database'] },
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
        description: 'Document decomposition, semantic chunk boundary detection, multi-modal parsing, and hybrid retrieval fusing lexical BM25 with dense vector embeddings.',
        prerequisites: ['Foundations of Vector Search and Embedding Spaces'],
        outcomes: ['Implement and compare hybrid dense and sparse retrieval pipelines with Reciprocal Rank Fusion'],
        objectives: [
          { statement: 'Design semantic and recursive character chunking strategies that preserve sentence boundaries and table structure', keyTerms: ['chunking', 'chunk size', 'chunk overlap', 'semantic chunking', 'token splitting'] },
          { statement: 'Enrich document chunks with hierarchical metadata, document summaries, and entity tags for filtered retrieval', keyTerms: ['metadata filtering', 'payload enrichment', 'document hierarchy'] },
          { statement: 'Implement hybrid search combining BM25 keyword matching with dense vector retrieval using Reciprocal Rank Fusion (RRF)', keyTerms: ['hybrid search', 'bm25', 'sparse retrieval', 'dense retrieval', 'rrf', 'reciprocal rank fusion'] },
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
        description: 'Two-stage retrieval optimization using cross-encoder re-ranking, query expansion with HyDE and multi-query synthesis, and dynamic semantic routing.',
        prerequisites: ['Advanced Chunking, Parsing, and Hybrid Search Strategies'],
        outcomes: ['Deploy a two-stage re-ranking pipeline and dynamic query router optimizing context relevance'],
        objectives: [
          { statement: 'Implement cross-encoder re-ranking pipelines using ColBERT and modern neural re-rankers to maximize top-k precision', keyTerms: ['re-ranking', 'reranker', 'cross-encoder', 'colbert', 'cohere rerank', 'flashrank'] },
          { statement: 'Construct query transformation workflows including Hypothetical Document Embeddings (HyDE) and multi-query expansion', keyTerms: ['query transformation', 'hyde', 'multi-query', 'query rewriting', 'sub-queries'] },
          { statement: 'Design semantic routing mechanisms directing incoming queries to specialized vector indices and domain tools', keyTerms: ['semantic routing', 'retrieval routing', 'query intent', 'multi-index'] },
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
        description: 'Comprehensive evaluation frameworks (Ragas, TruLens), automated benchmarking of context relevance and faithfulness, input/output guardrails, and distributed telemetry.',
        prerequisites: ['Advanced RAG Architectures: Re-ranking, Query Transformation, and Routing'],
        outcomes: ['Benchmark, trace, and secure an end-to-end production RAG system with verifiable quality metrics'],
        objectives: [
          { statement: 'Evaluate the RAG Triad: Context Relevance, Groundedness (Faithfulness), and Answer Relevance using automated evaluation harnesses', keyTerms: ['ragas', 'trulens', 'rag triad', 'groundedness', 'faithfulness', 'context relevance', 'hallucination'] },
          { statement: 'Implement input validation and output guardrails mitigating prompt injection, jailbreaks, and PII leakage', keyTerms: ['guardrails', 'nemo guardrails', 'prompt injection', 'safety', 'pii'] },
          { statement: 'Deploy distributed tracing and observability monitoring latency, token budgets, retrieval scores, and failure patterns', keyTerms: ['observability', 'distributed tracing', 'telemetry', 'openinference', 'langfuse'] },
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
    ];

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
  } else {
    // Universal domain-adaptive synthesis
    for (let i = 1; i <= moduleCount; i++) {
      let stagePrefix = 'Foundations & Core Principles of';
      if (i === 2) stagePrefix = 'Key Mechanisms & Essential Techniques of';
      if (i === 3) stagePrefix = 'Advanced Methods & Applied Practice in';
      if (i === 4) stagePrefix = 'Systems Integration & Case Studies in';
      if (i >= 5) stagePrefix = 'Capstone Mastery & Advanced Frontiers of';

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
