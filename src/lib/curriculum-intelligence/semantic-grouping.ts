import { EducationalDomain } from '../resource-engine/types';
import { SemanticCluster } from './types';
import { isNarrowFocusedTopic } from './objective-analyzer';
import {
  detectTopicDomainArchetype,
  evaluateTopicConsistency,
} from './topic-consistency-validator';

/**
 * Intelligent Semantic Clustering Engine
 * Groups closely related learning objectives and concepts into cohesive modules.
 * Invariant: ONE COHERENT LEARNING UNIT = ONE MODULE.
 */
export function clusterConceptsSemantically(
  concepts: readonly string[],
  domain: EducationalDomain,
  courseTopic: string
): SemanticCluster[] {
  if (!concepts || concepts.length === 0) {
    return [];
  }

  const rawClean = Array.from(
    new Set(concepts.map((c) => c.trim()).filter((c) => c.length > 0))
  );

  if (rawClean.length === 0) return [];

  // Filter out cross-domain collision concepts that leaked from other courses
  const archetype = detectTopicDomainArchetype(courseTopic);
  const filtered = rawClean.filter((c) => {
    const evalRes = evaluateTopicConsistency(c, courseTopic, archetype);
    return evalRes.detectedCollisions.length === 0;
  });
  const cleanConcepts = filtered.length > 0 ? filtered : [courseTopic];

  const tLower = courseTopic.toLowerCase();
  const isNarrow = isNarrowFocusedTopic(courseTopic);
  const isPython = domain === 'computer_science' || /python/i.test(tLower);

  // 0. PUBLIC SPEAKING & COMMUNICATION SPECIALIZATION
  if (
    /public speaking|presentation|speech|rhetoric|communication skills|oratory|debate/i.test(tLower)
  ) {
    return [
      {
        clusterId: 'cluster-ps-1',
        clusterName: 'Foundations of Speech Architecture, Audience Psychology & Message Crafting',
        concepts: [
          'Audience analysis & demographic profiling',
          'Core message formulation & the central thesis',
          'Aristotelian rhetoric: Ethos, Pathos, and Logos',
          'Speech structuring frameworks: Monroe Motivated Sequence & Problem-Cause-Solution',
        ],
        rationale: 'Foundational speech design, audience psychology, persuasive rhetorical frameworks, and structural architectures.',
        suggestedTitle: 'Speech Architecture, Audience Psychology & Narrative Structuring',
        priority: 1,
        searchQueries: {
          videoQueries: [
            'Public speaking speech structure Monroe motivated sequence tutorial',
            'Audience analysis ethos pathos logos persuasive speech lecture',
          ],
          readingQueries: [
            'Aristotle rhetoric speech structure communication handbook',
            'Monroe motivated sequence speech outline template reference',
          ],
        },
      },
      {
        clusterId: 'cluster-ps-2',
        clusterName: 'Vocal Dynamics, Articulation, Pacing & Non-Verbal Body Language',
        concepts: [
          'Diaphragmatic breathing & vocal resonance',
          'Pitch modulation, inflection & tone dynamics',
          'Pacing, cadence & strategic pause mastery',
          'Kinesics: purposeful stage movement, gestures & eye contact matrix',
        ],
        rationale: 'Physiological vocal delivery mechanisms, pitch inflection, pacing control, and commanding non-verbal presence.',
        suggestedTitle: 'Vocal Dynamics, Cadence & Non-Verbal Presence',
        priority: 2,
        searchQueries: {
          videoQueries: [
            'Vocal variety public speaking diaphragmatic breathing pitch tutorial',
            'Body language stage movement eye contact presentation skills lecture',
          ],
          readingQueries: [
            'Voice and speech training diaphragmatic breathing practical guide',
            'Non-verbal communication body language in public speaking manual',
          ],
        },
      },
      {
        clusterId: 'cluster-ps-3',
        clusterName: 'Visual Presentation Architecture, Slide Design & Narrative Storytelling',
        concepts: [
          'Cognitive load theory in slide design',
          'Data visualization & executive chart simplification',
          'Narrative arc & storytelling hooks (The Hero Journey)',
          'Eliminating text density: assertion-evidence slide model',
        ],
        rationale: 'High-impact slide aesthetics, visual cognitive ergonomics, executive data storytelling, and the assertion-evidence visual paradigm.',
        suggestedTitle: 'Visual Slide Ergonomics, Data Storytelling & Narrative Arcs',
        priority: 3,
        searchQueries: {
          videoQueries: [
            'Assertion evidence slide design presentation masterclass',
            'Storytelling techniques in business presentations lecture',
          ],
          readingQueries: [
            'Assertion-evidence presentation design research guidelines',
            'Data storytelling and cognitive load in visual presentations guide',
          ],
        },
      },
      {
        clusterId: 'cluster-ps-4',
        clusterName: 'Stage Mastery, Impromptu Speaking, Handling Hostile Q&A & Anxiety Control',
        concepts: [
          'Neurobiology of stage fright & adrenaline regulation',
          'Impromptu speaking frameworks: PREP (Point, Reason, Example, Point) & STAR',
          'Handling tough objections, hostile questions & audience derailment',
          'Microphone technique, stage positioning & keynote delivery protocols',
        ],
        rationale: 'Psychological performance anxiety regulation, impromptu speaking frameworks, hostile Q&A navigation, and stage command.',
        suggestedTitle: 'Stage Command, Impromptu Frameworks & High-Stakes Q&A',
        priority: 4,
        searchQueries: {
          videoQueries: [
            'Overcoming stage fright performance anxiety public speaking lecture',
            'Handling difficult questions hostile Q&A impromptu speaking tutorial',
          ],
          readingQueries: [
            'Impromptu speaking frameworks PREP model communication handbook',
            'Performance anxiety management for public speakers clinical protocol',
          ],
        },
      },
    ];
  }

  // 1. NARROW FOCUSED SINGLE CONCEPTS (binary search, single skill, etc.)
  if (isNarrow) {
    const isSingle = cleanConcepts.length === 1;
    return [
      {
        clusterId: 'cluster-1',
        clusterName: isSingle ? `${cleanConcepts[0]} Mastery` : `${cleanConcepts[0]} & ${cleanConcepts[1]}`,
        concepts: cleanConcepts,
        rationale: `Cohesive foundational instructional unit mastering ${cleanConcepts.join(' and ')}.`,
        suggestedTitle: isSingle ? `${cleanConcepts[0]} Core & Practice` : `${cleanConcepts[0]} & ${cleanConcepts[1]}`,
        priority: 1,
      },
    ];
  }

  // 2. PYTHON FUNDAMENTALS ONLY (variables, control flow, functions, lists)
  // If user requested Python basics / fundamentals only, group into 1 or 2 modules maximum
  const isPythonFundamentalsOnly =
    isPython &&
    (/python fundamentals|python basics|intro to python|learn python basics/i.test(tLower) ||
      (cleanConcepts.length <= 6 &&
        cleanConcepts.every((c) =>
          /\b(variable|syntax|type|operator|loop|condition|if|else|function|list|print|input)\b/i.test(c)
        )));

  if (isPythonFundamentalsOnly) {
    if (cleanConcepts.length <= 3) {
      return [
        {
          clusterId: 'cluster-py-1',
          clusterName: 'Python Core Syntax & Control Protocols',
          concepts: cleanConcepts,
          rationale: 'Unified beginner module covering syntax, variables, and control flow.',
          suggestedTitle: 'Python Syntax, Variables & Control Flow',
          priority: 1,
        },
      ];
    }
    // Split into at most 2 cohesive modules
    const mod1Concepts = cleanConcepts.filter((c) =>
      /\b(syntax|variable|type|operator|print|input|data type|primitive)\b/i.test(c)
    );
    const mod2Concepts = cleanConcepts.filter(
      (c) => !mod1Concepts.includes(c)
    );

    if (mod1Concepts.length > 0 && mod2Concepts.length > 0) {
      return [
        {
          clusterId: 'cluster-py-1',
          clusterName: 'Syntax, Variables & Data Types',
          concepts: mod1Concepts,
          rationale: 'Foundational syntax and primitive data representations.',
          suggestedTitle: 'Python Foundations: Syntax, Variables & Types',
          priority: 1,
        },
        {
          clusterId: 'cluster-py-2',
          clusterName: 'Control Flow, Functions & Sequences',
          concepts: mod2Concepts,
          rationale: 'Core logic execution, branching, and modular structures.',
          suggestedTitle: 'Logic Execution: Branching, Iteration & Functions',
          priority: 2,
        },
      ];
    }
  }

  // 3. LOOPS ONLY (while, for, nested loops, break, continue)
  const isLoopsOnly =
    isPython &&
    /loop|iteration|iterate/i.test(tLower) &&
    cleanConcepts.every((c) => /\b(loop|while|for|break|continue|range|nested|iteration)\b/i.test(c));

  if (isLoopsOnly) {
    return [
      {
        clusterId: 'cluster-loops-1',
        clusterName: 'Iteration Control & Loop Architectures',
        concepts: cleanConcepts,
        rationale: 'Comprehensive single-module mastery of iterative control structures.',
        suggestedTitle: 'Loop Architectures: For, While & Iteration Controls',
        priority: 1,
      },
    ];
  }

  // 4. FILE HANDLING & EXCEPTION HANDLING
  const isFilesAndExceptions =
    isPython &&
    cleanConcepts.every((c) => /\b(file|io|stream|read|write|open|close|exception|error|try|catch|except|finally)\b/i.test(c));

  if (isFilesAndExceptions) {
    return [
      {
        clusterId: 'cluster-io-err-1',
        clusterName: 'File I/O Streams & Robust Exception Recovery',
        concepts: cleanConcepts,
        rationale: 'Combined unit pairing I/O operations with fault-tolerant exception handling.',
        suggestedTitle: 'File I/O Operations & Robust Exception Recovery',
        priority: 1,
      },
    ];
  }

  // 5. COMPREHENSIVE PYTHON PROGRAMMING
  if (tLower.includes('python')) {
    return [
      {
        clusterId: 'cluster-py-full-1',
        clusterName: 'Python Syntax, Variables & Data Types',
        concepts: ['Variables & primitives', 'Arithmetic & logical operators', 'Input/output', 'Type casting'],
        rationale: 'Core syntax and fundamental data representations in Python.',
        suggestedTitle: 'Python Syntax, Variables & Fundamental Data Types',
        priority: 1,
      },
      {
        clusterId: 'cluster-py-full-2',
        clusterName: 'Control Flow, Branching & Modular Functions',
        concepts: ['If/else conditionals', 'While & for loops', 'Function parameters & returns', 'Scope & lambda expressions'],
        rationale: 'Procedural control structures, iteration, and functional decomposition.',
        suggestedTitle: 'Control Flow, Iteration & Modular Functions',
        priority: 2,
      },
      {
        clusterId: 'cluster-py-full-3',
        clusterName: 'Composite Data Structures & Memory Models',
        concepts: ['Lists & indexing', 'Dictionaries & hashing', 'Tuples & sets', 'List comprehensions'],
        rationale: 'Efficient collections, hashing mechanics, and idiomatic comprehensions.',
        suggestedTitle: 'Composite Data Structures, Collections & Comprehensions',
        priority: 3,
      },
      {
        clusterId: 'cluster-py-full-4',
        clusterName: 'Object-Oriented Architecture & Robust Exception Recovery',
        concepts: ['Classes & instance state', 'Inheritance & polymorphism', 'File I/O streams', 'Exception handling (try/except)'],
        rationale: 'Object-oriented software design, safe stream I/O, and error handling.',
        suggestedTitle: 'Object-Oriented Architecture, File I/O & Exception Handling',
        priority: 4,
      },
    ];
  }

  // 6. RETRIEVAL-AUGMENTED GENERATION (RAG) ARCHITECTURES
  if (
    tLower.includes('rag') ||
    tLower.includes('retrieval-augmented') ||
    tLower.includes('retrieval augmented')
  ) {
    return [
      {
        clusterId: 'cluster-rag-1',
        clusterName: 'Foundations of Vector Search and Embedding Spaces',
        concepts: ['Vector search', 'Embedding spaces', 'Vector index', 'Cosine similarity', 'Vector database'],
        rationale: 'Mathematical properties of dense embeddings, vector distance metrics, index quantization, and HNSW graphs.',
        suggestedTitle: 'Foundations of Vector Search and Embedding Spaces',
        priority: 1,
        searchQueries: {
          videoQueries: [
            'Vector search Approximate Nearest Neighbors FAISS HNSW tutorial',
            'Embedding spaces vector similarity cosine dot product lecture',
          ],
          readingQueries: [
            'FAISS vector search documentation index types wiki',
            'Pinecone vector similarity metrics and HNSW index architecture',
          ],
        },
      },
      {
        clusterId: 'cluster-rag-2',
        clusterName: 'Advanced Chunking, Parsing, and Hybrid Search Strategies',
        concepts: ['Semantic chunking', 'Document parsing', 'Hybrid search', 'BM25 sparse retrieval', 'Reciprocal rank fusion (RRF)'],
        rationale: 'Document decomposition, semantic chunk boundary detection, multi-modal parsing, and hybrid retrieval fusing lexical BM25 with dense vector embeddings.',
        suggestedTitle: 'Advanced Chunking, Parsing, and Hybrid Search Strategies',
        priority: 2,
        searchQueries: {
          videoQueries: [
            'Advanced chunking strategies document parsing LangChain LlamaIndex',
            'Hybrid search BM25 dense vectors reciprocal rank fusion tutorial',
          ],
          readingQueries: [
            'LlamaIndex document chunking and node parsing official documentation',
            'Elasticsearch hybrid search RRF reciprocal rank fusion guide',
          ],
        },
      },
      {
        clusterId: 'cluster-rag-3',
        clusterName: 'Advanced RAG Architectures: Re-ranking, Query Transformation, and Routing',
        concepts: ['Cross-encoder re-ranking', 'ColBERT neural reranker', 'HyDE query expansion', 'Multi-query rewriting', 'Semantic routing'],
        rationale: 'Two-stage retrieval optimization using cross-encoder re-ranking, query expansion with HyDE and multi-query synthesis, and dynamic semantic routing.',
        suggestedTitle: 'Advanced RAG Architectures: Re-ranking, Query Transformation, and Routing',
        priority: 3,
        searchQueries: {
          videoQueries: [
            'Cross-encoder re-ranking ColBERT Cohere re-rank tutorial',
            'Query transformation HyDE multi-query routing RAG architecture',
          ],
          readingQueries: [
            'Cohere re-rank documentation cross-encoder retrieval guide',
            'LangChain query transformation and semantic routing documentation',
          ],
        },
      },
      {
        clusterId: 'cluster-rag-4',
        clusterName: 'Production Evaluation, Guardrails, and Observability in RAG',
        concepts: ['RAG triad evaluation', 'Ragas & TruLens benchmarking', 'Faithfulness & hallucination detection', 'Safety guardrails', 'Telemetry tracing'],
        rationale: 'Comprehensive evaluation frameworks, automated benchmarking of context relevance and faithfulness, input/output guardrails, and distributed telemetry.',
        suggestedTitle: 'Production Evaluation, Guardrails, and Observability in RAG',
        priority: 4,
        searchQueries: {
          videoQueries: [
            'RAG evaluation Ragas TruLens metrics tutorial',
            'NeMo Guardrails hallucination detection production RAG lecture',
          ],
          readingQueries: [
            'Ragas evaluation metrics documentation context precision faithfulness',
            'OpenInference distributed tracing observability for LLM and RAG',
          ],
        },
      },
    ];
  }

  // 7. CA FINAL FINANCIAL REPORTING & IND AS
  if (
    tLower.includes('ca final') ||
    tLower.includes('ind as') ||
    tLower.includes('financial reporting')
  ) {
    return [
      {
        clusterId: 'cluster-indas-1',
        clusterName: 'Ind AS 109: Financial Instruments - Recognition, Measurement & ECL Model',
        concepts: ['Ind AS 109', 'Ind AS 32', 'Amortised cost & EIR', 'FVTOCI & FVTPL', 'Expected Credit Loss (ECL 3-Stage Model)', 'Hedge accounting'],
        rationale: 'Comprehensive study of Ind AS 109 and Ind AS 32: classification of financial assets and liabilities, amortised cost using EIR, and Expected Credit Loss provisioning.',
        suggestedTitle: 'Ind AS 109: Financial Instruments - Recognition, Measurement & ECL Model',
        priority: 1,
        searchQueries: {
          videoQueries: [
            'CA Final Financial Reporting Ind AS 109 Financial Instruments lecture revision',
            'Ind AS 109 ECL Model Expected Credit Loss solved problems ICAI',
          ],
          readingQueries: [
            'ICAI Educational Material Ind AS 109 Financial Instruments',
            'CA Final Financial Reporting Ind AS 109 ICAI Study Material',
          ],
        },
      },
      {
        clusterId: 'cluster-indas-2',
        clusterName: 'Ind AS 115: Revenue from Contracts with Customers - 5-Step Model',
        concepts: ['Ind AS 115', '5-Step revenue recognition model', 'Distinct performance obligations', 'Transaction price allocation', 'Variable consideration & warranties'],
        rationale: 'End-to-end framework of Ind AS 115: identifying contracts, standalone selling prices, contract modifications, and practical examination case studies.',
        suggestedTitle: 'Ind AS 115: Revenue from Contracts with Customers - 5-Step Model',
        priority: 2,
        searchQueries: {
          videoQueries: [
            'CA Final Financial Reporting Ind AS 115 Revenue Contracts lecture',
            'Ind AS 115 5-Step Model practical questions CA Final',
          ],
          readingQueries: [
            'ICAI Guidance Note Ind AS 115 Revenue from Contracts with Customers',
            'CA Final FR Ind AS 115 Study Material ICAI Illustrations',
          ],
        },
      },
      {
        clusterId: 'cluster-indas-3',
        clusterName: 'Ind AS 116: Leases - Lessee & Lessor Accounting, ROU Asset & Lease Liability',
        concepts: ['Ind AS 116', 'Right-of-Use (ROU) asset', 'Lease liability amortisation', 'Discount rate & incremental borrowing rate', 'Sale and leaseback transactions'],
        rationale: 'Comprehensive lease accounting under Ind AS 116: initial recognition of ROU asset and lease liability, remeasurement for lease modifications, and lessor accounting.',
        suggestedTitle: 'Ind AS 116: Leases - Lessee & Lessor Accounting, ROU Asset & Lease Liability',
        priority: 3,
        searchQueries: {
          videoQueries: [
            'CA Final Ind AS 116 Leases lecture revision Ajay Agarwal Bhavik Chokshi',
            'Ind AS 116 ROU asset lease liability modification questions CA Final',
          ],
          readingQueries: [
            'ICAI Educational Material Ind AS 116 Leases',
            'CA Final FR Ind AS 116 Study Material ICAI Chapter',
          ],
        },
      },
      {
        clusterId: 'cluster-indas-4',
        clusterName: 'Ind AS 103: Business Combinations & Consolidated Financial Statements (Ind AS 110)',
        concepts: ['Ind AS 103', 'Acquisition method', 'Purchase consideration fair value', 'Non-Controlling Interest (NCI) valuation', 'Goodwill / Bargain purchase gain', 'Group consolidation adjustments'],
        rationale: 'Accounting for business combinations under Ind AS 103 and group accounts under Ind AS 110: purchase consideration, identifiable net assets, and elimination of intra-group balances.',
        suggestedTitle: 'Ind AS 103: Business Combinations & Consolidated Financial Statements (Ind AS 110)',
        priority: 4,
        searchQueries: {
          videoQueries: [
            'CA Final Ind AS 103 Business Combinations Consolidation lecture revision',
            'CA Final Consolidation Ind AS 110 comprehensive problem ICAI',
          ],
          readingQueries: [
            'ICAI Study Material CA Final FR Business Combinations Ind AS 103',
            'ICAI Guidance Note Consolidated Financial Statements Ind AS 110',
          ],
        },
      },
    ];
  }

  // 8. LARGE LANGUAGE MODELS & TRANSFORMERS
  if (
    tLower.includes('large language model') ||
    tLower.includes('transformer') ||
    tLower.includes('llm') ||
    (domain === 'ai_and_data' && /model|deep learning|language/i.test(tLower))
  ) {
    return [
      {
        clusterId: 'cluster-llm-1',
        clusterName: 'Statistical Language Modeling, Tokenization & Embeddings',
        concepts: ['N-gram & neural language models', 'BPE & WordPiece tokenization', 'Dense vector embeddings', 'Positional encodings'],
        rationale: 'Theoretical foundations of language representation and vector space modeling.',
        suggestedTitle: 'Language Representations: Tokenization, Word Vectors & Embeddings',
        priority: 1,
      },
      {
        clusterId: 'cluster-llm-2',
        clusterName: 'Transformer Architecture & Self-Attention Mechanisms',
        concepts: ['Scaled dot-product attention', 'Multi-head self-attention', 'Encoder-decoder vs decoder-only architectures', 'Feedforward sub-layers & normalization'],
        rationale: 'Mathematical and structural deconstruction of the canonical Transformer model.',
        suggestedTitle: 'Transformer Architecture, Attention Mechanisms & Scaling Laws',
        priority: 2,
      },
      {
        clusterId: 'cluster-llm-3',
        clusterName: 'Pre-training Objectives, Fine-Tuning & Alignment',
        concepts: ['Causal & masked language modeling', 'Parameter-efficient fine-tuning (LoRA, QLoRA)', 'Reinforcement Learning from Human Feedback (RLHF)', 'Direct Preference Optimization (DPO)'],
        rationale: 'Training pipelines, parameter-efficient adaptation, and safety alignment techniques.',
        suggestedTitle: 'Model Pre-training, Parameter-Efficient Fine-Tuning & Alignment',
        priority: 3,
      },
      {
        clusterId: 'cluster-llm-4',
        clusterName: 'Retrieval-Augmented Generation & Autonomous Agent Systems',
        concepts: ['RAG architecture & vector indexing', 'Chunking strategies & hybrid retrieval', 'Tool use & function calling', 'Autonomous agent reasoning loops'],
        rationale: 'Applied enterprise deployments, grounded information retrieval, and agent workflows.',
        suggestedTitle: 'Retrieval-Augmented Generation (RAG) & Autonomous LLM Agents',
        priority: 4,
      },
    ];
  }

  // 7. DIFFERENTIAL EQUATIONS SPECIALIZATION
  if (tLower.includes('differential equation')) {
    return [
      {
        clusterId: 'cluster-ode-1',
        clusterName: 'First-Order Differential Equations & Modeling',
        concepts: ['Separable equations', 'Integrating factors', 'Exact equations', 'Autonomous models'],
        rationale: 'Cohesive foundation covering formulation and analytic solutions of first-order ODEs.',
        suggestedTitle: 'First-Order Differential Equations & Modeling',
        priority: 1,
      },
      {
        clusterId: 'cluster-ode-2',
        clusterName: 'Second-Order Linear Equations & Undetermined Coefficients',
        concepts: ['Homogeneous linear equations', 'Method of undetermined coefficients', 'Variation of parameters', 'Mechanical vibrations'],
        rationale: 'Rigorous analysis of higher-order linear equations and oscillator systems.',
        suggestedTitle: 'Second-Order Linear Equations & Undetermined Coefficients',
        priority: 2,
      },
      {
        clusterId: 'cluster-ode-3',
        clusterName: 'Laplace Transforms & Initial Value Problems',
        concepts: ['Laplace definition & properties', 'Inverse transforms', 'Discontinuous forcing & step functions', 'Dirac delta & convolutions'],
        rationale: 'Operational calculus applied to non-smooth and impulse initial value problems.',
        suggestedTitle: 'Laplace Transforms & Initial Value Problems',
        priority: 3,
      },
      {
        clusterId: 'cluster-ode-4',
        clusterName: 'Series Solutions & Linear Systems of ODEs',
        concepts: ['Power series near ordinary points', 'Singular points & Frobenius', 'Eigenvalue method for linear systems', 'Phase plane & stability'],
        rationale: 'Advanced analytical series and qualitative phase plane dynamics.',
        suggestedTitle: 'Series Solutions & Systems of Differential Equations',
        priority: 4,
      },
    ];
  }

  // 8. REAL ANALYSIS SPECIALIZATION
  if (tLower.includes('real analysis')) {
    return [
      {
        clusterId: 'cluster-ra-1',
        clusterName: 'Topology of the Real Line & Completeness',
        concepts: ['Axiom of completeness', 'Supremum & infimum', 'Open & closed sets', 'Compactness & Heine-Borel'],
        rationale: 'Topological foundations of the real number system.',
        suggestedTitle: 'Topology of the Real Line & Completeness',
        priority: 1,
      },
      {
        clusterId: 'cluster-ra-2',
        clusterName: 'Sequences, Series & Bolzano-Weierstrass Theorem',
        concepts: ['Limit of a sequence', 'Monotone convergence', 'Bolzano-Weierstrass theorem', 'Cauchy sequences', 'Absolute & conditional convergence'],
        rationale: 'Rigorous epsilon-N analysis of sequential convergence and infinite series.',
        suggestedTitle: 'Sequences, Series & Bolzano-Weierstrass Theorem',
        priority: 2,
      },
      {
        clusterId: 'cluster-ra-3',
        clusterName: 'Functional Continuity, Limits & Uniform Continuity',
        concepts: ['Epsilon-delta continuity', 'Intermediate Value Theorem', 'Extreme Value Theorem', 'Uniform continuity'],
        rationale: 'Topological and metric analysis of continuous mappings on R.',
        suggestedTitle: 'Continuity, Topological Mapping & Uniform Continuity',
        priority: 3,
      },
      {
        clusterId: 'cluster-ra-4',
        clusterName: 'Differentiability & Mean Value Theorems',
        concepts: ['Derivative definition', 'Mean Value Theorem', 'Taylor polynomials with remainder', 'L’Hopital’s rule rigor'],
        rationale: 'Theoretical differentiation and polynomial approximation theorems.',
        suggestedTitle: 'Theoretical Differentiation & Mean Value Theorems',
        priority: 4,
      },
      {
        clusterId: 'cluster-ra-5',
        clusterName: 'Riemann Integration & Fundamental Theorem of Calculus',
        concepts: ['Darboux sums & partition refinements', 'Riemann integrability criteria', 'Fundamental Theorem of Calculus', 'Improper integrals'],
        rationale: 'Measure-theoretic and partition foundations of Riemann integration.',
        suggestedTitle: 'Riemann Integration & Fundamental Theorem of Calculus',
        priority: 5,
      },
    ];
  }

  // 9. REACT SPECIALIZATION
  if (tLower.includes('react')) {
    return [
      {
        clusterId: 'cluster-react-1',
        clusterName: 'React Core Architecture: JSX, Components & Unidirectional State',
        concepts: ['JSX syntax', 'Functional components', 'Props & immutable state', 'Event handling & rendering cycles'],
        rationale: 'Foundational declarative UI primitives and component contracts.',
        suggestedTitle: 'React Primitives: Components, Props & State Cycles',
        priority: 1,
      },
      {
        clusterId: 'cluster-react-2',
        clusterName: 'Hooks Mastery, Side Effects & Memory Optimization',
        concepts: ['useState & useReducer', 'useEffect synchronization', 'useMemo & useCallback', 'Custom reusable hooks'],
        rationale: 'Mastery of reactive functional lifecycle management and memoization.',
        suggestedTitle: 'Hooks Mastery, Synchronization & Custom Hooks',
        priority: 2,
      },
      {
        clusterId: 'cluster-react-3',
        clusterName: 'Global State Management & Client-Side Routing',
        concepts: ['Context API & compound components', 'State machines & external stores', 'React Router navigation', 'Protected routes'],
        rationale: 'Architecting scalable application-level routing and state propagation.',
        suggestedTitle: 'Global State Management & Application Routing',
        priority: 3,
      },
      {
        clusterId: 'cluster-react-4',
        clusterName: 'Performance Profiling, Next.js & Server Components',
        concepts: ['React Server Components (RSC)', 'Suspense & streaming SSR', 'Virtual DOM reconciliation profiling', 'Production builds'],
        rationale: 'Enterprise production architectures, modern streaming SSR, and performance auditing.',
        suggestedTitle: 'Production React: Server Components, Streaming & Profiling',
        priority: 4,
      },
    ];
  }

  // 10. ANALOG CIRCUITS SPECIALIZATION
  if (tLower.includes('analog circuit') || tLower.includes('analog electronics')) {
    return [
      {
        clusterId: 'cluster-ac-1',
        clusterName: 'Fundamental Circuit Laws & Network Theorems',
        concepts: ['Kirchhoff’s laws (KCL/KVL)', 'Thévenin & Norton equivalent circuits', 'Superposition theorem', 'Transient RC & RL response'],
        rationale: 'Linear network fundamentals and equivalent circuit modeling.',
        suggestedTitle: 'Linear Network Analysis & Circuit Theorems',
        priority: 1,
      },
      {
        clusterId: 'cluster-ac-2',
        clusterName: 'Semiconductor Diodes & Transistor Biasing (BJT & MOSFET)',
        concepts: ['Diode I-V characteristics & rectifiers', 'Bipolar Junction Transistors (BJT) biasing', 'MOSFET small-signal models', 'Common-emitter & common-source amplifiers'],
        rationale: 'Non-linear semiconductor modeling and active small-signal amplification.',
        suggestedTitle: 'Diodes, Transistor Modeling & Small-Signal Amplifiers',
        priority: 2,
      },
      {
        clusterId: 'cluster-ac-3',
        clusterName: 'Operational Amplifiers & Negative Feedback Architectures',
        concepts: ['Ideal op-amp characteristics', 'Inverting & non-inverting configurations', 'Differential amplifiers & CMRR', 'Active filters & feedback stability'],
        rationale: 'Operational amplifier architectures and closed-loop feedback systems.',
        suggestedTitle: 'Operational Amplifiers, Feedback Systems & Active Filters',
        priority: 3,
      },
      {
        clusterId: 'cluster-ac-4',
        clusterName: 'Frequency Response, Oscillators & Signal Conditioning',
        concepts: ['Bode plots & gain-bandwidth product', 'Barkhausen criteria & sinusoidal oscillators', 'Multivibrators & 555 timers', 'Analog-to-digital interface conditioning'],
        rationale: 'Frequency-domain stability, harmonic waveform synthesis, and signal processing.',
        suggestedTitle: 'Frequency Response, Oscillators & Signal Conditioning',
        priority: 4,
      },
    ];
  }

  // 11. CLASSICAL MECHANICS / PHYSICS SPECIALIZATION
  if (
    tLower.includes('classical mechanics') ||
    tLower.includes('mechanics and motion') ||
    (tLower.includes('mechanics') && domain === 'natural_sciences') ||
    (tLower.includes('physics') && /motion|mechanic|force/i.test(tLower))
  ) {
    return [
      {
        clusterId: 'cluster-cm-1',
        clusterName: 'Kinematics & Newtonian Dynamics',
        concepts: ['Vectors & coordinate systems', '1D and multi-dimensional kinematics', 'Newton’s three laws of motion', 'Friction & drag forces'],
        rationale: 'Vector description of motion and fundamental dynamic laws of force.',
        suggestedTitle: 'Vector Kinematics & Newtonian Dynamics',
        priority: 1,
      },
      {
        clusterId: 'cluster-cm-2',
        clusterName: 'Work, Kinetic Energy & Conservation of Momentum',
        concepts: ['Work-energy theorem', 'Conservative forces & potential energy landscapes', 'Conservation of linear momentum', 'Center of mass & collisions'],
        rationale: 'Conservation theorems and energetic analysis of multi-particle systems.',
        suggestedTitle: 'Work-Energy Principles & Conservation of Momentum',
        priority: 2,
      },
      {
        clusterId: 'cluster-cm-3',
        clusterName: 'Rotational Dynamics & Angular Momentum',
        concepts: ['Rigid body rotation & moment of inertia', 'Torque & angular acceleration', 'Conservation of angular momentum', 'Rolling without slipping & gyroscopic motion'],
        rationale: 'Rotational inertia, torque cross products, and angular momentum conservation.',
        suggestedTitle: 'Rotational Kinematics, Torque & Angular Momentum',
        priority: 3,
      },
      {
        clusterId: 'cluster-cm-4',
        clusterName: 'Gravitation & Harmonic Oscillations',
        concepts: ['Universal gravitation & Keplerian orbits', 'Simple harmonic motion (SHM)', 'Damped & driven oscillations', 'Resonance phenomena'],
        rationale: 'Central-force gravitational field orbits and linear oscillatory dynamics.',
        suggestedTitle: 'Central Gravitational Fields & Harmonic Oscillations',
        priority: 4,
      },
    ];
  }

  // 12. MACHINE LEARNING SPECIALIZATION
  if (
    /machine learning|ml foundations|applied machine learning|intro to ml/i.test(tLower) &&
    !tLower.includes('llm') &&
    !tLower.includes('rag')
  ) {
    return [
      {
        clusterId: 'cluster-ml-1',
        clusterName: 'Mathematical Foundations, Optimization & Supervised Linear Models',
        concepts: ['Cost functions & gradient descent', 'Linear regression & closed-form solutions', 'Logistic regression & classification boundaries', 'Feature scaling & regularization (L1/L2)'],
        rationale: 'Fundamental mathematical formulations, objective functions, optimization landscapes, and linear hypothesis spaces.',
        suggestedTitle: 'Mathematical Foundations, Gradient Descent & Linear Models',
        priority: 1,
        searchQueries: {
          videoQueries: ['Machine Learning gradient descent linear regression lecture', 'Logistic regression decision boundaries cost function tutorial'],
          readingQueries: ['Supervised learning linear regression gradient descent lecture notes', 'Loss functions and regularization in machine learning guide'],
        },
      },
      {
        clusterId: 'cluster-ml-2',
        clusterName: 'Non-Linear Models, Decision Trees & Ensemble Architectures',
        concepts: ['Decision tree induction & information gain', 'Random forests & bagging', 'Gradient boosting machines (XGBoost & LightGBM)', 'Support vector machines & kernel methods'],
        rationale: 'Non-linear hypothesis spaces, partition mechanics, variance reduction via bagging, and sequential residual minimization.',
        suggestedTitle: 'Decision Trees, Random Forests & Gradient Boosting Systems',
        priority: 2,
        searchQueries: {
          videoQueries: ['Decision trees and random forests ensemble methods lecture', 'Gradient boosting XGBoost LightGBM mathematics tutorial'],
          readingQueries: ['Ensemble learning random forests boosting documentation', 'Decision tree splitting criteria entropy Gini index guide'],
        },
      },
      {
        clusterId: 'cluster-ml-3',
        clusterName: 'Unsupervised Learning, Clustering & Dimensionality Reduction',
        concepts: ['K-Means clustering & Voronoi partitions', 'Hierarchical clustering & dendrograms', 'Principal Component Analysis (PCA) & SVD', 't-SNE & UMAP manifold learning'],
        rationale: 'Unlabeled data structure discovery, geometric distance clustering, covariance decomposition, and non-linear manifold projection.',
        suggestedTitle: 'Unsupervised Learning: Clustering, PCA & Dimensionality Reduction',
        priority: 3,
        searchQueries: {
          videoQueries: ['K-Means clustering algorithm Voronoi lecture', 'Principal Component Analysis PCA SVD derivation StatQuest'],
          readingQueries: ['Unsupervised learning K-Means clustering textbook notes', 'PCA dimensionality reduction eigenvalues covariance matrix reference'],
        },
      },
      {
        clusterId: 'cluster-ml-4',
        clusterName: 'Deep Neural Networks, Backpropagation & Modern Optimization',
        concepts: ['Multi-layer perceptron (MLP) architecture', 'Backpropagation & matrix chain rule', 'Activation functions & vanishing gradients', 'Stochastic optimizers (Adam, RMSProp)'],
        rationale: 'Universal function approximation, computational graphs, reverse-mode automatic differentiation, and adaptive moment estimation.',
        suggestedTitle: 'Deep Neural Networks, Backpropagation & Adaptive Optimization',
        priority: 4,
        searchQueries: {
          videoQueries: ['Neural networks backpropagation 3Blue1Brown calculus lecture', 'Adam optimizer learning rate schedules deep learning tutorial'],
          readingQueries: ['Deep learning multi-layer perceptron backpropagation textbook', 'Neural network optimization vanishing gradients activation functions'],
        },
      },
      {
        clusterId: 'cluster-ml-5',
        clusterName: 'Model Validation, Bias-Variance Tradeoff & Production Deployment',
        concepts: ['Cross-validation & data leakage prevention', 'ROC-AUC, Precision-Recall & F1 score metrics', 'Hyperparameter tuning & Bayesian optimization', 'Model serving, drift monitoring & pipeline inference'],
        rationale: 'Rigorous empirical evaluation, hyperparameter search strategies, generalization bounds, and production deployment pipelines.',
        suggestedTitle: 'Model Evaluation, Validation Protocols & Production Serving',
        priority: 5,
        searchQueries: {
          videoQueries: ['Model evaluation cross validation ROC AUC precision recall tutorial', 'Machine learning pipeline production deployment drift lecture'],
          readingQueries: ['Model evaluation metrics cross-validation guidelines', 'Production machine learning pipeline deployment and monitoring guide'],
        },
      },
    ];
  }

  // 13. OPERATING SYSTEMS SPECIALIZATION
  if (
    /operating system|operating systems|os architecture|os internals/i.test(tLower)
  ) {
    return [
      {
        clusterId: 'cluster-os-1',
        clusterName: 'Operating System Architecture, Kernel Traps & System Call Interfaces',
        concepts: ['Kernel mode vs user mode', 'Hardware traps and interrupt handlers', 'System call execution flow', 'Dual-mode CPU protection'],
        rationale: 'Foundational architectural boundaries between hardware, privileged kernel space, and unprivileged user space processes.',
        suggestedTitle: 'OS Architecture: Kernel Traps, Interrupts & System Calls',
        priority: 1,
        searchQueries: {
          videoQueries: ['Operating system architecture user vs kernel mode lecture', 'System calls interrupt vector table OS internals tutorial'],
          readingQueries: ['Operating systems kernel architecture system calls textbook', 'Hardware privilege levels and trap handlers OSPP reference'],
        },
      },
      {
        clusterId: 'cluster-os-2',
        clusterName: 'Process Lifecycle, Thread Concurrency & CPU Paging/Scheduling',
        concepts: ['Process Control Block (PCB) & context switching', 'User-level vs kernel-level threads', 'CPU scheduling algorithms (CFS, Multi-level feedback)', 'Inter-process communication (Pipes, Shared Memory)'],
        rationale: 'Resource virtualization across CPUs: process state machines, scheduling heuristics, thread synchronization, and IPC protocols.',
        suggestedTitle: 'Process Lifecycle, Multithreading & CPU Scheduling',
        priority: 2,
        searchQueries: {
          videoQueries: ['Process control block PCB context switch scheduling lecture', 'CPU scheduling algorithms CFS round robin multi-level queue'],
          readingQueries: ['Operating systems process scheduling algorithms textbook chapter', 'POSIX threads and inter-process communication IPC reference'],
        },
      },
      {
        clusterId: 'cluster-os-3',
        clusterName: 'Concurrency Control, Synchronization Primitives & Deadlock Prevention',
        concepts: ['Critical sections & race conditions', 'Mutexes, spinlocks & semaphores', 'Classical concurrency problems (Dining Philosophers)', 'Deadlock detection & Banker’s algorithm'],
        rationale: 'Atomic instruction execution, mutual exclusion protocols, race condition mitigation, and deadlock avoidance frameworks.',
        suggestedTitle: 'Synchronization Primitives, Mutexes & Deadlock Prevention',
        priority: 3,
        searchQueries: {
          videoQueries: ['Operating systems race conditions mutex semaphores lecture', 'Deadlock Banker algorithm Coffman conditions OS tutorial'],
          readingQueries: ['Concurrency synchronization primitives mutex semaphores textbook', 'Deadlock detection recovery and Banker algorithm chapter'],
        },
      },
      {
        clusterId: 'cluster-os-4',
        clusterName: 'Virtual Memory Architecture, Page Tables & Translation Lookaside Buffers',
        concepts: ['Virtual address spaces & MMU translation', 'Multi-level page tables & TLB caching', 'Page fault lifecycle & demand paging', 'Page replacement algorithms (LRU, FIFO, Clock)'],
        rationale: 'Memory virtualization: address translation mechanics, hardware caching in TLBs, page fault handling, and replacement heuristics.',
        suggestedTitle: 'Virtual Memory Architecture, Paging & Page Replacement',
        priority: 4,
        searchQueries: {
          videoQueries: ['Virtual memory page tables TLB address translation lecture', 'Page fault handling LRU page replacement algorithm tutorial'],
          readingQueries: ['Operating systems virtual memory paging TLB architecture', 'Page replacement algorithms and memory management unit reference'],
        },
      },
      {
        clusterId: 'cluster-os-5',
        clusterName: 'Storage Subsystems, File System Implementations & I/O Protection',
        concepts: ['Inodes & directory hierarchies', 'File allocation methods & journaling', 'Disk scheduling algorithms', 'Virtual file system (VFS) abstraction'],
        rationale: 'Persistent secondary storage abstractions, crash consistency through write-ahead logging, and block allocation structures.',
        suggestedTitle: 'File System Architecture, Inodes & Journaling Recovery',
        priority: 5,
        searchQueries: {
          videoQueries: ['File system architecture inodes directory structures lecture', 'Crash consistency and journaling file systems OS tutorial'],
          readingQueries: ['Operating systems file system implementation inodes textbook', 'Virtual file system VFS and storage I/O architecture reference'],
        },
      },
    ];
  }

  // 14. DATA STRUCTURES & ALGORITHMS SPECIALIZATION
  if (
    /data structure|dsa|algorithms and data/i.test(tLower) &&
    !tLower.includes('dijkstra') &&
    !tLower.includes('binary search')
  ) {
    return [
      {
        clusterId: 'cluster-dsa-1',
        clusterName: 'Asymptotic Analysis, Dynamic Arrays & Two-Pointer Strategies',
        concepts: ['Big-O, Omega, and Theta asymptotic notation', 'Dynamic array memory reallocation & amortized analysis', 'Two-pointer traversal & sliding window techniques', 'Prefix sums & difference arrays'],
        rationale: 'Algorithmic efficiency foundations, contiguous memory models, and optimal linear time window scanning.',
        suggestedTitle: 'Asymptotic Complexity, Arrays & Two-Pointer Techniques',
        priority: 1,
        searchQueries: {
          videoQueries: ['Asymptotic notation Big-O time space complexity MIT OCW lecture', 'Two pointer technique and sliding window algorithm tutorial'],
          readingQueries: ['MIT OCW 6.006 asymptotic complexity and array amortized analysis', 'Algorithm design manual asymptotic efficiency arrays chapter'],
        },
      },
      {
        clusterId: 'cluster-dsa-2',
        clusterName: 'Linked Data Structures, Stacks, Queues & Hash Table Mechanics',
        concepts: ['Singly and doubly linked list pointer manipulations', 'LIFO stacks & monotonic stack patterns', 'FIFO queues, deques & circular ring buffers', 'Hash tables, collision resolution & load factors'],
        rationale: 'Pointer-based dynamic chaining, bounded buffer protocols, and O(1) expected hashing lookup architectures.',
        suggestedTitle: 'Linked Structures, Monotonic Stacks, Queues & Hash Tables',
        priority: 2,
        searchQueries: {
          videoQueries: ['Linked lists stacks and queues implementation tutorial', 'Hash tables collision resolution separate chaining open addressing'],
          readingQueries: ['Introduction to algorithms hash tables and chained hashing notes', 'Monotonic stack algorithm patterns and queue architectures'],
        },
      },
      {
        clusterId: 'cluster-dsa-3',
        clusterName: 'Hierarchical Trees, Binary Search Trees & Priority Queues (Heaps)',
        concepts: ['Binary tree traversals (Pre, In, Post, Level-order)', 'Binary Search Tree invariants & balanced AVL/Red-Black ideas', 'Binary heap structure & priority queue operations', 'Heapify algorithm & Heapsort analysis'],
        rationale: 'Hierarchical branching invariants, logarithmic search bounds, balanced rotations, and priority heap mechanics.',
        suggestedTitle: 'Binary Trees, Balanced Search Trees & Priority Heaps',
        priority: 3,
        searchQueries: {
          videoQueries: ['Binary tree traversals and binary search tree BST lecture', 'Binary heap priority queue heapify algorithm explained'],
          readingQueries: ['Binary search trees and balanced tree invariants textbook chapter', 'Heaps and priority queues implementation guide'],
        },
      },
      {
        clusterId: 'cluster-dsa-4',
        clusterName: 'Graph Representations, Breadth/Depth-First Search & Shortest Paths',
        concepts: ['Adjacency list & matrix representations', 'Breadth-First Search (BFS) for unweighted shortest paths', 'Depth-First Search (DFS) & topological sort DAGs', 'Dijkstra and Bellman-Ford shortest path algorithms'],
        rationale: 'Topological connectivity, exhaustive traversal invariants, cycle detection, and greedy path relaxation algorithms.',
        suggestedTitle: 'Graph Theory: BFS, DFS, Topological Sorting & Shortest Paths',
        priority: 4,
        searchQueries: {
          videoQueries: ['Graph traversal BFS and DFS algorithms lecture MIT OCW', 'Dijkstra shortest path algorithm priority queue tutorial'],
          readingQueries: ['Graph representations BFS DFS and shortest path algorithms notes', 'Topological sort directed acyclic graphs DAG reference'],
        },
      },
      {
        clusterId: 'cluster-dsa-5',
        clusterName: 'Dynamic Programming, Memoization & Divide-and-Conquer Strategies',
        concepts: ['Optimal substructure & overlapping subproblems', 'Top-down memoization vs bottom-up tabulation', '1D and 2D DP state transitions (Knapsack, LCS, LIS)', 'Divide-and-conquer recurrences & Master Theorem'],
        rationale: 'State-space formulation, DAG traversal of subproblems, sub-exponential dynamic programming, and recurrence relations.',
        suggestedTitle: 'Dynamic Programming, Tabulation & Divide-and-Conquer',
        priority: 5,
        searchQueries: {
          videoQueries: ['Dynamic programming memoization tabulation lecture freeCodeCamp', 'Knapsack problem longest common subsequence DP tutorial'],
          readingQueries: ['Introduction to algorithms dynamic programming chapter notes', 'Divide and conquer recurrences Master theorem reference'],
        },
      },
    ];
  }

  // 15. COMPUTER NETWORKS SPECIALIZATION
  if (
    /computer network|computer networks|networking|tcp\/ip|osi model/i.test(tLower)
  ) {
    return [
      {
        clusterId: 'cluster-net-1',
        clusterName: 'Network Architecture, Layered Models & Physical/Data Link Layers',
        concepts: ['OSI 7-layer vs TCP/IP 5-layer architecture', 'Packet switching vs circuit switching', 'Ethernet framing & MAC addressing', 'CSMA/CD protocol & ARP resolution'],
        rationale: 'Layered communication abstractions, encapsulation mechanisms, framing, and physical link transmission.',
        suggestedTitle: 'Layered Network Architectures, Ethernet & Data Link Protocols',
        priority: 1,
        searchQueries: {
          videoQueries: ['Computer networks OSI model TCP IP layers lecture', 'Ethernet framing MAC addressing ARP protocol tutorial'],
          readingQueries: ['Computer networking a top-down approach layered architecture', 'Data link layer framing and error detection textbook chapter'],
        },
      },
      {
        clusterId: 'cluster-net-2',
        clusterName: 'Network Layer: IPv4/IPv6 Addressing, Subnetting & Routing Protocols',
        concepts: ['IPv4 packet structure & CIDR subnetting', 'IPv6 address architecture & migration', 'Intra-domain routing (OSPF, RIP)', 'Inter-domain routing (BGP) & ICMP control'],
        rationale: 'Global host addressing, hierarchical prefix forwarding, path calculation algorithms, and autonomous system routing.',
        suggestedTitle: 'Network Layer: IP Addressing, Subnetting & Routing Protocols',
        priority: 2,
        searchQueries: {
          videoQueries: ['Subnetting CIDR IP addressing computer networks lecture', 'OSPF BGP routing algorithms network layer explained'],
          readingQueries: ['Network layer IP addressing and subnetting handbook', 'Routing algorithms link-state distance-vector BGP reference'],
        },
      },
      {
        clusterId: 'cluster-net-3',
        clusterName: 'Transport Layer: TCP Reliability, Flow Control & UDP Sockets',
        concepts: ['TCP 3-way handshake & connection teardown', 'Sliding window flow control', 'TCP congestion control (AIMD, Slow Start, Reno)', 'UDP connectionless protocol & multiplexing'],
        rationale: 'End-to-end process multiplexing, reliable byte stream delivery over unreliable IP networks, and congestion mitigation.',
        suggestedTitle: 'Transport Layer: TCP Reliability, Congestion Control & UDP',
        priority: 3,
        searchQueries: {
          videoQueries: ['TCP 3-way handshake sliding window flow control lecture', 'TCP congestion control AIMD slow start transport layer'],
          readingQueries: ['Transport layer TCP flow control congestion control textbook', 'UDP vs TCP protocol mechanics socket programming reference'],
        },
      },
      {
        clusterId: 'cluster-net-4',
        clusterName: 'Application Layer Protocols: DNS, HTTP/1.1 to HTTP/3, TLS & Web Security',
        concepts: ['Domain Name System (DNS) recursive resolution', 'HTTP/1.1, HTTP/2 multiplexing & HTTP/3 QUIC', 'TLS 1.3 handshake & cryptographic session keys', 'Socket programming & client-server architectures'],
        rationale: 'High-level application protocols, secure transport encapsulation via TLS, and low-latency QUIC streams.',
        suggestedTitle: 'Application Protocols: DNS, HTTP/3, TLS Encryption & Sockets',
        priority: 4,
        searchQueries: {
          videoQueries: ['DNS resolution how the internet works computer networks', 'HTTP 1 2 3 QUIC TLS handshake web protocol lecture'],
          readingQueries: ['Application layer DNS HTTP TLS official RFC overview', 'Socket programming and secure application protocols guide'],
        },
      },
    ];
  }

  // 16. DATABASE SYSTEMS & SQL SPECIALIZATION
  if (
    /database|sql|relational database|dbms/i.test(tLower) &&
    !tLower.includes('sql joins')
  ) {
    return [
      {
        clusterId: 'cluster-db-1',
        clusterName: 'Relational Model, Entity-Relationship Design & Schema Normalization',
        concepts: ['Relational algebra & relational calculus', 'Entity-Relationship (ER) modeling', 'Functional dependencies & anomaly prevention', 'Normal forms (1NF, 2NF, 3NF, BCNF)'],
        rationale: 'Formal mathematical relational theory, conceptual data modeling, and mathematical elimination of redundancy via normalization.',
        suggestedTitle: 'Relational Model, ER Modeling & Schema Normalization',
        priority: 1,
        searchQueries: {
          videoQueries: ['Relational algebra and normalization 1NF 2NF 3NF BCNF lecture', 'Entity relationship ER diagram database design tutorial'],
          readingQueries: ['Database system concepts relational model normalization textbook', 'Functional dependencies and normal forms guide'],
        },
      },
      {
        clusterId: 'cluster-db-2',
        clusterName: 'SQL Mastery: Advanced Queries, Joins, Window Functions & CTEs',
        concepts: ['Complex multi-table INNER/OUTER joins', 'GROUP BY, HAVING & aggregation semantics', 'Window functions (ROW_NUMBER, RANK, DENSE_RANK)', 'Common Table Expressions (CTEs) & recursive queries'],
        rationale: 'Declarative query formulation, analytical windowing partitions, set operations, and hierarchical query synthesis.',
        suggestedTitle: 'Advanced SQL: Joins, Window Functions, Grouping & CTEs',
        priority: 2,
        searchQueries: {
          videoQueries: ['Advanced SQL joins window functions CTEs tutorial', 'SQL query optimization grouping window partitions explained'],
          readingQueries: ['PostgreSQL documentation SQL query syntax and window functions', 'Advanced SQL joins grouping and common table expressions guide'],
        },
      },
      {
        clusterId: 'cluster-db-3',
        clusterName: 'Storage Engine Internals, B+ Tree Indexes & Query Execution Plans',
        concepts: ['Page storage & slotted page architecture', 'B+ Tree index structure & range scan mechanics', 'Hash indexes & inverted indexes', 'Query planning, cost estimation & EXPLAIN ANALYZE'],
        rationale: 'Physical storage layout on disk, tree-based indexing invariants, and optimizer cost estimation heuristics.',
        suggestedTitle: 'Storage Engines, B+ Tree Indexing & Query Execution Plans',
        priority: 3,
        searchQueries: {
          videoQueries: ['Database storage engine B+ Tree indexing internal lecture', 'PostgreSQL EXPLAIN ANALYZE query plan optimization tutorial'],
          readingQueries: ['Database internals B+ Tree index structures and storage engine', 'PostgreSQL query optimizer and index scan mechanics documentation'],
        },
      },
      {
        clusterId: 'cluster-db-4',
        clusterName: 'Transaction Management, ACID Guarantees & Concurrency Control',
        concepts: ['ACID properties & isolation anomalies', 'Two-Phase Locking (2PL) & strict serializability', 'Multi-Version Concurrency Control (MVCC)', 'Write-Ahead Logging (WAL) & crash recovery (ARIES)'],
        rationale: 'Transaction boundary semantics, isolation levels, optimistic vs pessimistic concurrency, and durable recovery protocols.',
        suggestedTitle: 'Transactions, ACID Properties, MVCC & Crash Recovery',
        priority: 4,
        searchQueries: {
          videoQueries: ['ACID transactions isolation levels MVCC database lecture', 'Write-ahead logging WAL crash recovery ARIES algorithm'],
          readingQueries: ['Transaction management concurrency control MVCC textbook', 'Write-ahead logging and database crash recovery reference'],
        },
      },
    ];
  }

  // 17. CALCULUS & MATHEMATICAL ANALYSIS SPECIALIZATION
  if (
    /calculus|differential and integral|multivariable calculus/i.test(tLower) &&
    !tLower.includes('real analysis') &&
    !tLower.includes('differential equation')
  ) {
    return [
      {
        clusterId: 'cluster-calc-1',
        clusterName: 'Limits, Continuity & Derivative Foundations',
        concepts: ['Epsilon-delta limit definitions', 'Continuity & Intermediate Value Theorem', 'Derivative definition & tangent slopes', 'Differentiation rules (Product, Quotient, Chain)'],
        rationale: 'Infinitesimal analysis, functional limits, local linearity, and formal differentiation rules.',
        suggestedTitle: 'Limits, Continuity & Differential Foundations',
        priority: 1,
        searchQueries: {
          videoQueries: ['Limits and continuity derivative definition 3Blue1Brown calculus', 'Product rule chain rule differentiation tutorial lecture'],
          readingQueries: ['OpenStax Calculus Volume 1 limits derivatives textbook', 'MIT OCW single variable calculus derivative foundations notes'],
        },
      },
      {
        clusterId: 'cluster-calc-2',
        clusterName: 'Applications of Derivatives, Optimization & Curve Sketching',
        concepts: ['Mean Value Theorem & Rolle’s theorem', 'Critical points, concavity & inflection', 'Applied optimization problems', 'Related rates & linear approximations'],
        rationale: 'Differential geometry of curves, extreme value analysis, rate coupling, and applied optimization.',
        suggestedTitle: 'Applications of Derivatives: Optimization & Curve Analysis',
        priority: 2,
        searchQueries: {
          videoQueries: ['Applications of derivatives optimization related rates lecture', 'Mean value theorem concavity curve sketching calculus'],
          readingQueries: ['Optimization and applied derivatives textbook chapter OpenStax', 'Linear approximations and related rates calculus notes'],
        },
      },
      {
        clusterId: 'cluster-calc-3',
        clusterName: 'Integral Calculus, Fundamental Theorem & Integration Techniques',
        concepts: ['Riemann sums & definite integral definition', 'Fundamental Theorem of Calculus (FTC Part 1 & 2)', 'Integration by substitution & integration by parts', 'Trigonometric integrals & partial fractions'],
        rationale: 'Accumulation functions, partition limits, anti-differentiation duality, and analytical integration techniques.',
        suggestedTitle: 'Integral Calculus, Fundamental Theorem & Analytic Techniques',
        priority: 3,
        searchQueries: {
          videoQueries: ['Fundamental Theorem of Calculus Riemann sums 3Blue1Brown', 'Integration by parts and substitution calculus lecture'],
          readingQueries: ['OpenStax Calculus Volume 2 integration techniques FTC', 'Definite integrals and anti-differentiation textbook chapter'],
        },
      },
      {
        clusterId: 'cluster-calc-4',
        clusterName: 'Multivariable Functions, Partial Derivatives & Multiple Integrals',
        concepts: ['Functions of several variables & contour plots', 'Partial derivatives & gradient vectors', 'Directional derivatives & tangent planes', 'Double and triple integrals in polar/cylindrical coordinates'],
        rationale: 'Scalar field geometry, multi-dimensional rate of change, gradient directional ascent, and volume integration.',
        suggestedTitle: 'Multivariable Calculus: Gradients, Extrema & Multiple Integrals',
        priority: 4,
        searchQueries: {
          videoQueries: ['Multivariable calculus partial derivatives gradients 3Blue1Brown', 'Double integrals polar coordinates volume calculation lecture'],
          readingQueries: ['OpenStax Calculus Volume 3 multivariable functions gradients', 'Multiple integrals and coordinate transformations chapter notes'],
        },
      },
    ];
  }

  // 18. LINEAR ALGEBRA SPECIALIZATION
  if (
    /linear algebra|matrix algebra|matrices and vectors/i.test(tLower)
  ) {
    return [
      {
        clusterId: 'cluster-la-1',
        clusterName: 'Vectors, Linear Combinations & Systems of Linear Equations',
        concepts: ['Vector spaces in R^n & linear combinations', 'Systems of linear equations & augmented matrices', 'Gaussian elimination & row echelon forms', 'Matrix-vector multiplication as linear mapping'],
        rationale: 'Geometric and algebraic descriptions of vectors, systems of equations, and systematic elimination.',
        suggestedTitle: 'Vectors, Linear Combinations & Gaussian Elimination',
        priority: 1,
        searchQueries: {
          videoQueries: ['Linear combinations vectors span 3Blue1Brown linear algebra', 'Gaussian elimination augmented matrices lecture Gilbert Strang'],
          readingQueries: ['Linear algebra systems of linear equations textbook Gilbert Strang', 'Gaussian elimination and row operations lecture notes'],
        },
      },
      {
        clusterId: 'cluster-la-2',
        clusterName: 'Matrix Algebra, Invertibility, Determinants & Transposes',
        concepts: ['Matrix multiplication properties & block matrices', 'Matrix invertibility & elementary matrices', 'Determinant properties, area/volume scaling & minors', 'Cramer’s rule & inverse computation'],
        rationale: 'Linear transformations, operator composition, determinant scaling factors, and invertibility criteria.',
        suggestedTitle: 'Matrix Transformations, Inverses & Determinant Geometry',
        priority: 2,
        searchQueries: {
          videoQueries: ['Matrix multiplication as transformation determinant 3Blue1Brown', 'Matrix invertibility elementary matrices lecture Strang'],
          readingQueries: ['Matrix algebra determinants and inverse matrices textbook chapter', 'Determinants and geometric volume transformations notes'],
        },
      },
      {
        clusterId: 'cluster-la-3',
        clusterName: 'Vector Spaces, Subspaces, Span, Basis & Dimension',
        concepts: ['Abstract vector spaces & subspace verification', 'Linear independence & spanning sets', 'Basis & dimension of a vector space', 'Fundamental subspaces (Nullspace, Column space, Row space)'],
        rationale: 'Abstract coordinate-free spaces, structural dimension, linear independence, and the Rank-Nullity Theorem.',
        suggestedTitle: 'Vector Spaces, Nullspaces, Column Spaces & Basis/Dimension',
        priority: 3,
        searchQueries: {
          videoQueries: ['Vector spaces nullspace column space basis dimension lecture Strang', 'Linear independence and basis linear algebra explained'],
          readingQueries: ['Subspaces null space column space Rank-Nullity theorem notes', 'Vector space basis and coordinate systems textbook chapter'],
        },
      },
      {
        clusterId: 'cluster-la-4',
        clusterName: 'Eigenvalues, Eigenvectors, Diagonalization & Singular Value Decomposition',
        concepts: ['Characteristic polynomial & eigenvalue computation', 'Eigenvectors & invariant directional subspaces', 'Matrix diagonalization & spectral theorem', 'Singular Value Decomposition (SVD) foundations'],
        rationale: 'Invariant directions of linear transformations, spectral decomposition of symmetric operators, and SVD factoring.',
        suggestedTitle: 'Eigenvalues, Eigenvectors, Diagonalization & SVD',
        priority: 4,
        searchQueries: {
          videoQueries: ['Eigenvalues and eigenvectors 3Blue1Brown linear algebra', 'Diagonalization and Singular Value Decomposition SVD lecture Strang'],
          readingQueries: ['Eigenvalues eigenvectors and diagonalization textbook chapter', 'Spectral theorem and singular value decomposition SVD reference'],
        },
      },
    ];
  }

  // 19. ORGANIC CHEMISTRY SPECIALIZATION
  if (
    /organic chemistry|organic synthesis|reaction mechanism/i.test(tLower)
  ) {
    return [
      {
        clusterId: 'cluster-org-1',
        clusterName: 'Molecular Structure, Hybridization, Resonance & Acid-Base Theory',
        concepts: ['Lewis structures, formal charge & resonance hybrids', 'sp3, sp2, and sp hybridization & molecular geometry', 'Electronegativity, dipole moments & intermolecular forces', 'Brønsted-Lowry & Lewis acid-base equilibria (pKa trends)'],
        rationale: 'Electronic structure, molecular orbitals, electron delocalization, and thermodynamic acid-base driving forces.',
        suggestedTitle: 'Structure, Hybridization, Resonance & Acid-Base Equilibria',
        priority: 1,
        searchQueries: {
          videoQueries: ['Organic chemistry hybridization resonance formal charge lecture', 'Acid base reactions pKa trends organic chemistry tutorial'],
          readingQueries: ['Organic chemistry bonding hybridization resonance textbook', 'Acid base theory and resonance stabilization study notes'],
        },
      },
      {
        clusterId: 'cluster-org-2',
        clusterName: 'Alkanes, Stereochemistry & Conformation Analysis',
        concepts: ['IUPAC nomenclature protocols', 'Newman projections & cyclohexane chair conformations', 'Chirality, enantiomers, diastereomers & meso compounds', 'Cahn-Ingold-Prelog (R/S) configuration assignments'],
        rationale: 'Three-dimensional molecular architecture, steric energy landscapes, optical activity, and stereochemical relationships.',
        suggestedTitle: 'Alkanes, Cyclohexane Chairs & Stereochemistry (R/S)',
        priority: 2,
        searchQueries: {
          videoQueries: ['Stereochemistry enantiomers diastereomers R S configuration lecture', 'Cyclohexane chair conformations ring flip Newman projections'],
          readingQueries: ['Stereochemistry chirality and optical activity textbook chapter', 'Conformational analysis of alkanes and cycloalkanes notes'],
        },
      },
      {
        clusterId: 'cluster-org-3',
        clusterName: 'Alkyl Halides: Nucleophilic Substitution (SN1/SN2) & Elimination (E1/E2)',
        concepts: ['Substrate sterics & nucleophile/base strength', 'SN2 bimolecular substitution & Walden inversion', 'SN1 unimolecular substitution & carbocation stability', 'E1 vs E2 elimination & Zaitsev/Hofmann regioselectivity'],
        rationale: 'Fundamental polar reaction mechanisms, transition state geometries, kinetics, and competing substitution/elimination pathways.',
        suggestedTitle: 'Nucleophilic Substitution (SN1/SN2) & Elimination (E1/E2)',
        priority: 3,
        searchQueries: {
          videoQueries: ['SN1 SN2 E1 E2 mechanism comparison organic chemistry lecture', 'Walden inversion and carbocation rearrangement tutorial'],
          readingQueries: ['Nucleophilic substitution and elimination reactions textbook notes', 'Alkyl halide reactivity SN1 SN2 E1 E2 decision matrix'],
        },
      },
      {
        clusterId: 'cluster-org-4',
        clusterName: 'Alkenes, Alkynes, Aromatic Compounds & Carbonyl Synthesis',
        concepts: ['Electrophilic alkene addition & Markovnikov regioselectivity', 'Alkyne reduction & terminal acidity', 'Benzene aromaticity (Hückel’s 4n+2 rule) & EAS reactions', 'Carbonyl additions & multi-step retro-synthetic strategy'],
        rationale: 'Pi-bond reactivity, aromatic stability, functional group interconversions, and systematic retro-synthetic design.',
        suggestedTitle: 'Electrophilic Additions, Aromaticity & Carbonyl Chemistry',
        priority: 4,
        searchQueries: {
          videoQueries: ['Electrophilic addition alkenes Markovnikov rule lecture', 'Electrophilic aromatic substitution EAS benzene chemistry tutorial'],
          readingQueries: ['Alkene chemistry electrophilic addition and aromaticity textbook', 'Carbonyl additions and multi-step organic synthesis guide'],
        },
      },
    ];
  }

  // 20. GENERAL DYNAMIC PEDAGOGICAL EXPANSION (Fallback for any unlisted subject)
  // Decomposes arbitrary single/double concept inputs into 4 progressive, non-overlapping pedagogical modules:
  // Fundamentals -> Core Architectures -> Practical Applications -> Advanced Integration
  if (cleanConcepts.length <= 2) {
    const topicLabel = courseTopic.trim();
    return [
      {
        clusterId: 'cluster-dyn-1',
        clusterName: `${topicLabel}: Foundational Principles & Core Invariants`,
        concepts: [
          `${topicLabel} Foundational Invariants`,
          `${topicLabel} Terminology & Structural Baseline`,
          `${topicLabel} Core Theoretical Assumptions`,
        ],
        rationale: `Foundational instruction establishing baseline literacy, essential vocabulary, and fundamental invariants for ${topicLabel}.`,
        suggestedTitle: `${topicLabel}: Core Foundations & First Principles`,
        priority: 1,
        searchQueries: {
          videoQueries: [
            `${topicLabel} foundations introduction lecture tutorial`,
            `${topicLabel} core principles explained beginners`,
          ],
          readingQueries: [
            `${topicLabel} textbook fundamentals reference notes`,
            `${topicLabel} introduction and core concepts overview`,
          ],
        },
      },
      {
        clusterId: 'cluster-dyn-2',
        clusterName: `${topicLabel}: Core Architectures & Primary Mechanisms`,
        concepts: [
          `${topicLabel} Structural Architecture`,
          `${topicLabel} Key Internal Mechanisms`,
          `${topicLabel} Primary Methodologies & Protocols`,
        ],
        rationale: `Rigorous deconstruction of central mechanisms, component relationships, and primary architectures in ${topicLabel}.`,
        suggestedTitle: `${topicLabel}: Architecture, Internal Mechanisms & Protocols`,
        priority: 2,
        searchQueries: {
          videoQueries: [
            `${topicLabel} architecture mechanisms lecture`,
            `${topicLabel} core methodologies explained in detail`,
          ],
          readingQueries: [
            `${topicLabel} architecture design documentation reference`,
            `${topicLabel} primary mechanisms and protocols handbook`,
          ],
        },
      },
      {
        clusterId: 'cluster-dyn-3',
        clusterName: `${topicLabel}: Practical Implementation & Problem Solving`,
        concepts: [
          `${topicLabel} Practical Workflows`,
          `${topicLabel} Problem Solving Techniques`,
          `${topicLabel} Applied Case Scenarios`,
        ],
        rationale: `Hands-on application, problem-solving strategies, and practical implementation patterns for ${topicLabel}.`,
        suggestedTitle: `${topicLabel}: Practical Implementation & Applied Problem Solving`,
        priority: 3,
        searchQueries: {
          videoQueries: [
            `${topicLabel} practical implementation tutorial`,
            `${topicLabel} worked examples and problem solving`,
          ],
          readingQueries: [
            `${topicLabel} practical implementation guide and exercises`,
            `${topicLabel} applied problem solving case studies`,
          ],
        },
      },
      {
        clusterId: 'cluster-dyn-4',
        clusterName: `${topicLabel}: Advanced Techniques, Optimization & System Integration`,
        concepts: [
          `${topicLabel} Advanced Techniques`,
          `${topicLabel} Performance Optimization & Edge Cases`,
          `${topicLabel} Production-Ready System Integration`,
        ],
        rationale: `Advanced patterns, optimization tradeoffs, edge-case mitigation, and production integration in ${topicLabel}.`,
        suggestedTitle: `${topicLabel}: Advanced Systems, Optimization & Production Integration`,
        priority: 4,
        searchQueries: {
          videoQueries: [
            `${topicLabel} advanced techniques and optimization lecture`,
            `${topicLabel} real world systems and edge cases`,
          ],
          readingQueries: [
            `${topicLabel} advanced systems reference and best practices`,
            `${topicLabel} optimization tradeoffs and edge case diagnostics`,
          ],
        },
      },
    ];
  }

  // 13. GENERAL COMPUTER SCIENCE DOMAIN GROUPING
  if (domain === 'computer_science' || domain === 'ai_and_data') {
    const buckets: { [key: string]: { name: string; items: string[]; priority: number } } = {
      syntax: { name: 'Syntax, Variables, Types & Fundamental Operators', items: [], priority: 1 },
      control: { name: 'Control Flow, Conditional Branching & Iteration Protocols', items: [], priority: 2 },
      functions: { name: 'Modular Functions, Scope & Functional Primitives', items: [], priority: 3 },
      collections: { name: 'Composite Data Structures, Collections & Memory Models', items: [], priority: 4 },
      oop: { name: 'Object-Oriented Architecture, Classes & Design Patterns', items: [], priority: 5 },
      io_errors: { name: 'Error Recovery, Exceptions & File I/O Workflows', items: [], priority: 6 },
      advanced: { name: 'Advanced Engineering, Optimization & Real-World Integration', items: [], priority: 7 },
    };

    const unmatched: string[] = [];

    for (const top of cleanConcepts) {
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

    const activeBuckets = Object.values(buckets)
      .filter((b) => b.items.length > 0)
      .sort((a, b) => a.priority - b.priority);

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
      // Consolidate if over-fragmented (> 6)
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
        clusterId: `cluster-cs-${idx + 1}`,
        clusterName: b.name,
        concepts: b.items,
        rationale: `Instructional unit covering ${b.items.join(', ')}.`,
        suggestedTitle: b.items.length <= 3 ? b.items.join(' & ') : b.name,
        priority: idx + 1,
      }));
    }
  }

  // 14. GENERAL CHUNKING ALGORITHM (2 to 3 concepts per module)
  const chunkSize = cleanConcepts.length <= 4 ? 2 : 3;
  const clusters: SemanticCluster[] = [];

  for (let i = 0; i < cleanConcepts.length; i += chunkSize) {
    const chunk = cleanConcepts.slice(i, i + chunkSize);
    const title = chunk.length === 1 ? chunk[0] : chunk.join(' & ');
    clusters.push({
      clusterId: `cluster-gen-${Math.floor(i / chunkSize) + 1}`,
      clusterName: title,
      concepts: chunk,
      rationale: `Academic instructional unit integrating ${chunk.join(', ')}.`,
      suggestedTitle: title,
      priority: Math.floor(i / chunkSize) + 1,
    });
  }

  return clusters;
}
