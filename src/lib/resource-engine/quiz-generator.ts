import { callGemini } from '@/services/ai/gemini/client';
import {
  ModulePlan,
  GeneratedQuiz,
  GeneratedQuizQuestion,
  GeneratedStudyNote,
  EducationalDomain,
} from './types';

export async function generateModuleQuiz(
  modulePlan: ModulePlan,
  domain: EducationalDomain,
  notes: GeneratedStudyNote[],
  topic: string
): Promise<GeneratedQuiz> {
  try {
    const aiQuiz = await generateQuizWithGemini(modulePlan, domain, notes, topic);
    if (aiQuiz && aiQuiz.questions.length >= 4) {
      return aiQuiz;
    }
  } catch (err) {
    console.warn(`[QuizGenerator] Gemini quiz generation failed for module "${modulePlan.title}":`, (err as Error).message);
  }

  return generateGroundedFallbackQuiz(modulePlan, domain, topic);
}

async function generateQuizWithGemini(
  modulePlan: ModulePlan,
  domain: EducationalDomain,
  notes: GeneratedStudyNote[],
  topic: string
): Promise<GeneratedQuiz | null> {
  const objectiveList = modulePlan.learningObjectives.map((o) => `- ${o.statement}`).join('\n');
  const notesOverview = notes.map((n) => n.overview).join('\n');

  const prompt = `
You are the Lead Psychometric Assessment Specialist and Principal Learning Scientist at Pencill.
Generate a rigorous, formative diagnostic assessment quiz for the following curriculum module:
- Course Topic: "${topic}"
- Module Title: "${modulePlan.title}"
- Domain: ${domain}
- Specific Learning Objectives:
${objectiveList}
${notesOverview ? `- Lesson Notes Summary:\n${notesOverview}` : ''}

ASSESSMENT SPECIFICATION:
1. Generate exactly 5 to 6 high-quality, non-trivial questions mapping directly to the module objectives.
2. Formats:
   - For Computer Science & AI: code behavior analysis, architectural trade-offs, vector search mechanics, boundary constraints, and error diagnoses.
   - For Mathematics: analytical conditions, derivation steps, initial/boundary condition verification, theorem applicability.
   - For Natural Sciences: physical invariances, vector dynamics, dimensional homogeneity, experimental deductions.
3. Every question MUST satisfy:
   - Clear, unambiguous prompt testing understanding or application (not mere trivia).
   - Exactly 4 plausible, distinct answer options (no silly or obvious giveaway distractors).
   - "correctOptionIndex": integer 0, 1, 2, or 3. Evenly distribute the correct option index across 0, 1, 2, and 3.
   - Thorough pedagogical explanation explaining why the correct choice is true AND specifically why common alternative distractors are incorrect.
   - "difficulty": "foundation", "intermediate", or "advanced".
   - "learningObjectiveReference": the exact statement of the objective being tested.
4. Eliminate redundant or duplicate questions.

Output pure, valid JSON with this exact schema:
{
  "title": "${modulePlan.title} Diagnostic Checkpoint",
  "timeLimitMinutes": 15,
  "questions": [
    {
      "prompt": "Question text...",
      "questionType": "multiple_choice",
      "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
      "correctOptionIndex": 1,
      "explanation": "In-depth pedagogical explanation...",
      "difficulty": "intermediate",
      "learningObjectiveReference": "Objective statement..."
    }
  ]
}
`.trim();

  const rawJson = await callGemini(prompt, undefined, {
    jsonMode: true,
    temperature: 0.25,
  });

  const parsed = JSON.parse(rawJson);
  if (!parsed || !Array.isArray(parsed.questions)) return null;

  const validatedQuestions: GeneratedQuizQuestion[] = [];
  const seenPrompts = new Set<string>();

  parsed.questions.forEach((q: any, idx: number) => {
    const promptText = (q.prompt || '').trim();
    if (
      promptText.length > 10 &&
      !seenPrompts.has(promptText.toLowerCase()) &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      q.options.every((opt: any) => typeof opt === 'string' && opt.trim().length > 0) &&
      typeof q.correctOptionIndex === 'number' &&
      q.correctOptionIndex >= 0 &&
      q.correctOptionIndex < 4
    ) {
      seenPrompts.add(promptText.toLowerCase());
      validatedQuestions.push({
        id: `q-${modulePlan.id}-${idx + 1}`,
        questionNumber: idx + 1,
        prompt: promptText,
        questionType: q.questionType || 'multiple_choice',
        options: q.options.map((opt: string) => opt.trim()),
        correctOptionIndex: q.correctOptionIndex,
        explanation: (q.explanation || 'Verified by module syllabus and reference materials.').trim(),
        difficulty: q.difficulty || (idx === 0 ? 'beginner' : idx >= 3 ? 'advanced' : 'intermediate'),
        learningObjectiveReference: q.learningObjectiveReference || modulePlan.learningObjectives[idx % modulePlan.learningObjectives.length]?.statement || 'Core module concept',
      });
    }
  });

  if (validatedQuestions.length < 4) return null;

  return {
    id: `quiz-${modulePlan.id}`,
    title: parsed.title || `${modulePlan.title} Diagnostic Checkpoint`,
    moduleId: modulePlan.id,
    moduleTitle: modulePlan.title,
    timeLimitMinutes: parsed.timeLimitMinutes || 15,
    questions: validatedQuestions,
  };
}

export function generateGroundedFallbackQuiz(
  modulePlan: ModulePlan,
  domain: EducationalDomain,
  topic: string
): GeneratedQuiz {
  const modTitleLower = modulePlan.title.toLowerCase();
  const topicLower = topic.toLowerCase();
  const objectives = modulePlan.learningObjectives.length > 0
    ? modulePlan.learningObjectives
    : [
        { id: 'o1', statement: `Master foundational principles of ${modulePlan.title}`, keyTerms: [] },
        { id: 'o2', statement: `Apply analytical methods and system architectures in ${modulePlan.title}`, keyTerms: [] },
        { id: 'o3', statement: `Evaluate trade-offs, edge cases, and performance in ${modulePlan.title}`, keyTerms: [] },
        { id: 'o4', statement: `Diagnose failures and optimize implementation of ${modulePlan.title}`, keyTerms: [] },
        { id: 'o5', statement: `Synthesize production-grade solutions for ${modulePlan.title}`, keyTerms: [] },
      ];

  // Specific question banks for key technical domains
  const questions: GeneratedQuizQuestion[] = [];

  // 1. RAG Module 1: Foundations of Vector Search and Embedding Spaces
  if (modTitleLower.includes('vector search') || (topicLower.includes('rag') && modTitleLower.includes('foundation'))) {
    questions.push(
      createQuestion(
        modulePlan.id,
        1,
        `When comparing Cosine Similarity and Dot Product for normalized vector embeddings, which statement is mathematically accurate?`,
        [
          `Cosine similarity equals dot product when vectors have unit L2 norm, making dot product computationally faster.`,
          `Cosine similarity is strictly scale-dependent while dot product normalizes vector magnitude automatically.`,
          `Dot product is always bounded in [-1, 1] regardless of vector norm while cosine similarity can be unbounded.`,
          `Cosine similarity cannot be computed in Euclidean spaces with dimensionality exceeding 512 dimensions.`,
        ],
        0,
        `For L2-normalized embeddings, ||u|| = ||v|| = 1, so cos(u, v) = (u · v) / (||u|| ||v||) = u · v. Hardware accelerators calculate dot products faster by avoiding square root and division operations.`,
        'foundation',
        'Analyze embedding spaces and similarity metrics',
        'conceptual'
      ),
      createQuestion(
        modulePlan.id,
        2,
        `What trade-off distinguishes Hierarchical Navigable Small World (HNSW) graphs from Inverted File (IVF) index structures in vector databases?`,
        [
          `HNSW offers higher query recall and lower query latency at the expense of higher memory footprint and index build time.`,
          `IVF requires no pre-clustering training phase while HNSW requires computing Voronoi centroids on full data.`,
          `HNSW guarantees 100% exact nearest neighbor recall while IVF is an approximate nearest neighbor (ANN) method.`,
          `IVF indices cannot be updated dynamically while HNSW requires recreating the entire graph on each insertion.`,
        ],
        1,
        `HNSW maintains multi-layer proximity graphs offering superior recall-vs-latency curves for ANN search, but consumes significantly more RAM per vector than IVF indices which cluster embeddings into coarse inverted lists.`,
        'intermediate',
        'Compare ANN indexing strategies and algorithmic trade-offs',
        'architectural_trade_off'
      ),
      createQuestion(
        modulePlan.id,
        3,
        `Which metric correctly measures the retrieval accuracy of an Approximate Nearest Neighbor (ANN) index against an exact brute-force k-NN baseline?`,
        [
          `Recall@K: the fraction of true exact nearest neighbors found within the top-K returned candidates.`,
          `Cosine distance loss: the average Euclidean norm between query vector and centroid coordinates.`,
          `Perplexity: the exponential of the cross-entropy of the embedding projection matrix.`,
          `BLEU score: the n-gram overlap between document chunk embeddings and query tokens.`,
        ],
        2,
        `Recall@K is the standard benchmark metric evaluating ANN algorithms, defined as |Retrieved_ANN ∩ True_KNN| / K, measuring how many true nearest neighbors were successfully recovered.`,
        'intermediate',
        'Evaluate ANN retrieval metrics against exact baselines',
        'evaluation'
      ),
      createQuestion(
        modulePlan.id,
        4,
        `In dense vector retrieval, why does dimensionality reduction (such as Matryoshka Representation Learning or PCA) risk degraded semantic discrimination?`,
        [
          `Truncating embedding dimensions discards fine-grained variance, leading to potential semantic collisions among nuanced document passages.`,
          `Lower-dimensional vectors cannot be indexed using hierarchical proximity graphs like HNSW.`,
          `Cosine similarity becomes mathematically undefined in dimensional spaces below 768.`,
          `Vector databases strictly require embedding dimensions to be exact powers of 2 for memory alignment.`,
        ],
        3,
        `Reducing embedding dimensionality collapses subspace variance, increasing the probability that passages discussing distinct subtopics map to near-identical coordinate representations.`,
        'advanced',
        'Understand embedding dimensional trade-offs and capacity limits',
        'failure_diagnosis'
      ),
      createQuestion(
        modulePlan.id,
        5,
        `When constructing an embedding index for a RAG system, what is the impact of asymmetric vs symmetric embedding models?`,
        [
          `Asymmetric models optimize distinct query and document encoders to account for length and intent discrepancy between short queries and detailed text chunks.`,
          `Symmetric models encode queries and documents into entirely disjoint non-comparable vector spaces.`,
          `Asymmetric models can only evaluate similarity using Manhattan (L1) distance.`,
          `Symmetric models require document chunks to match the exact word count of user search queries.`,
        ],
        0,
        `Asymmetric dual-encoders (e.g. prefixing queries with "query:" and passages with "passage:") map short interrogative queries and substantive factual chunks into a shared latent space despite structural differences.`,
        'advanced',
        'Select appropriate embedding model architectures for retrieval',
        'architectural_trade_off'
      )
    );
  }
  // 2. RAG Module 2: Advanced Chunking, Parsing, and Hybrid Search Strategies
  else if (modTitleLower.includes('chunking') || modTitleLower.includes('hybrid search') || (topicLower.includes('rag') && modTitleLower.includes('parsing'))) {
    questions.push(
      createQuestion(
        modulePlan.id,
        1,
        `Why is naive fixed-size character chunking problematic for retrieval-augmented generation on complex documents?`,
        [
          `It routinely splits coherent semantic propositions, tables, and sentence boundaries across adjacent chunks, causing context fragmentation.`,
          `Fixed-size chunking makes it mathematically impossible to calculate dense vector embeddings.`,
          `Vector databases cannot index chunks that have identical character counts.`,
          `Character-based chunking always exceeds LLM context windows regardless of chunk length.`,
        ],
        0,
        `Arbitrary character boundaries sever natural syntactic and logical units, divorcing pronouns from antecedents and splitting tables or formulas across disconnected chunks.`,
        'foundation',
        'Identify chunking strategies and semantic boundary preservation',
        'failure_diagnosis'
      ),
      createQuestion(
        modulePlan.id,
        2,
        `How does Hybrid Search (combining BM25 lexical search with dense vector retrieval) mitigate the "vocabulary mismatch" and "semantic drift" problems?`,
        [
          `BM25 catches exact keyword matches (part numbers, technical jargon) while dense vectors capture conceptual synonyms and paraphrasing.`,
          `BM25 generates new embeddings dynamically for words that the vector database has never encountered.`,
          `Hybrid search replaces LLM inference by generating synthesized answers directly from inverted index postings.`,
          `BM25 eliminates the need to maintain vector indices by compressing embeddings into text strings.`,
        ],
        1,
        `Dense retrieval excels at semantic meaning and conceptual queries but struggles with rare entities, exact IDs, and specialized terminology. BM25 provides precise lexical matching, creating complementary coverage.`,
        'intermediate',
        'Implement and compare hybrid dense and sparse retrieval pipelines',
        'architectural_trade_off'
      ),
      createQuestion(
        modulePlan.id,
        3,
        `What is the primary role of Reciprocal Rank Fusion (RRF) when combining candidate lists from sparse BM25 and dense vector retrievers?`,
        [
          `RRF merges ranked lists without requiring score normalization by weighting candidate rank positions inversely: RRF_score = Σ 1 / (k + rank).`,
          `RRF converts all BM25 scores into exact cosine similarity values between 0 and 1.`,
          `RRF retrains the dense embedding model based on user feedback received during the query.`,
          `RRF multiplies the raw BM25 score by the raw L2 distance to produce an absolute probability.`,
        ],
        2,
        `RRF is a robust, parameter-free rank aggregation method that operates purely on positional ranks rather than incomparable raw score scales (like BM25 unbounded scores vs cosine values in [-1, 1]).`,
        'intermediate',
        'Apply rank fusion algorithms to merge multi-modal candidate rankings',
        'algorithmic_mechanism'
      ),
      createQuestion(
        modulePlan.id,
        4,
        `In semantic chunking, how are chunk boundaries determined dynamically rather than using static token counts?`,
        [
          `By computing cosine distance between adjacent sentence embeddings and placing boundaries where distance exceeds a percentile threshold.`,
          `By counting the number of syllables in each paragraph and breaking when syllables exceed a fixed threshold.`,
          `By parsing document HTML tags and enforcing breaks only at <h1> heading elements.`,
          `By measuring the reading time in seconds and inserting breaks every 30 seconds of read pace.`,
        ],
        3,
        `Semantic chunking splits text into sentences, embeds each sentence, evaluates consecutive embedding distance, and creates new chunks whenever there is a significant semantic divergence spike.`,
        'advanced',
        'Design adaptive boundary detection algorithms for document ingestion',
        'algorithmic_mechanism'
      ),
      createQuestion(
        modulePlan.id,
        5,
        `What metadata enrichment practice yields the highest retrieval precision for multi-document enterprise RAG systems?`,
        [
          `Attaching document title, section hierarchy, creation date, access permissions, and summary abstracts to each passage chunk payload.`,
          `Stripping all metadata to minimize vector database storage overhead per document vector.`,
          `Encoding only the raw file path and file extension in the vector metadata payload.`,
          `Concatenating the entire document text into every individual chunk payload.`,
        ],
        0,
        `Hierarchical metadata allows pre-filtering and post-filtering (e.g. scoping retrieval to specific documents, departments, or dates) while providing vital context to the downstream LLM generator.`,
        'intermediate',
        'Structure document metadata payloads for filtered vector retrieval',
        'architectural_trade_off'
      )
    );
  }
  // 3. RAG Module 3: Re-ranking, Query Transformation, and Routing
  else if (modTitleLower.includes('re-ranking') || modTitleLower.includes('reranking') || modTitleLower.includes('routing') || modTitleLower.includes('query transformation')) {
    questions.push(
      createQuestion(
        modulePlan.id,
        1,
        `How does a Cross-Encoder re-ranker differ fundamentally from a Bi-Encoder vector retriever in scoring query-document relevance?`,
        [
          `A cross-encoder processes the query and document jointly through full cross-attention layers, capturing rich token-level interactions.`,
          `A bi-encoder evaluates cross-attention between query and passage tokens during real-time retrieval.`,
          `Cross-encoders generate isolated vector embeddings that can be pre-computed and stored in offline vector databases.`,
          `Cross-encoders are faster than bi-encoders because they do not use neural network attention layers.`,
        ],
        0,
        `Bi-encoders map query and document to independent vector representations (query-independent passage encoding), enabling sub-millisecond ANN search. Cross-encoders feed query and document jointly into self-attention, modeling all pairwise token interactions with higher accuracy at higher latency.`,
        'foundation',
        'Analyze cross-encoder vs bi-encoder attention architectures',
        'architectural_trade_off'
      ),
      createQuestion(
        modulePlan.id,
        2,
        `What is the primary mechanism of Hypothetical Document Embeddings (HyDE) in query transformation?`,
        [
          `The LLM generates a hypothetical answer to the query, which is embedded to search for real documents with similar semantic style and terminology.`,
          `The LLM deletes all interrogative words from the query and converts it into a regex boolean query.`,
          `The LLM translates the user query into SQL statements executed against a relational database.`,
          `The LLM extracts keywords and expands them using a static dictionary thesaurus.`,
        ],
        1,
        `HyDE uses an instruction-tuned LLM to generate an ungrounded, hypothetical answer. While factually unverified, the hypothetical answer shares the embedding manifold and vocabulary of real answer documents, bridging the query-document gap.`,
        'intermediate',
        'Implement query transformation pipelines including HyDE and multi-query rewriting',
        'algorithmic_mechanism'
      ),
      createQuestion(
        modulePlan.id,
        3,
        `In a production two-stage retrieval pipeline, what is the standard recommended topology balancing latency and precision?`,
        [
          `Stage 1: Retrieve top 50–100 candidate chunks via hybrid ANN search; Stage 2: Re-rank candidates using a cross-encoder to select top 3–5 chunks for LLM context.`,
          `Stage 1: Run cross-encoder over all 10 million chunks in database; Stage 2: Verify candidate embeddings with cosine distance.`,
          `Stage 1: Query an LLM to hallucinate all source texts; Stage 2: Filter answers using regex patterns.`,
          `Stage 1: Run BM25 search to return 1 chunk; Stage 2: Skip all re-ranking and pass directly to generation.`,
        ],
        2,
        `Scanning millions of chunks with a cross-encoder is computationally prohibitive. A two-stage pipeline uses fast hybrid retrieval to narrow candidate space to 50-100 chunks, then applies a compute-intensive cross-encoder for high-precision final ranking.`,
        'intermediate',
        'Design two-stage retrieval and re-ranking pipelines',
        'architectural_trade_off'
      ),
      createQuestion(
        modulePlan.id,
        4,
        `How does Semantic Routing improve query processing in multi-domain RAG applications?`,
        [
          `It inspects query intent and routes to specialized vector indices, tools, or structured databases before running retrieval.`,
          `It routes network packets across physical data centers using TCP header inspection.`,
          `It dynamically changes the LLM temperature parameter between 0 and 1 during sentence generation.`,
          `It splits long user questions into individual words and sends each word to a separate API server.`,
        ],
        3,
        `Semantic routing uses embedding classification or fast classifier models to determine whether a query requires general knowledge, company policy retrieval, tabular SQL querying, or customer ticket search, preventing cross-domain noise.`,
        'advanced',
        'Implement dynamic query routing across multi-index retrieval architectures',
        'architectural_trade_off'
      ),
      createQuestion(
        modulePlan.id,
        5,
        `What failure mode occurs when re-ranker score calibration is ignored in a dynamic retrieval thresholding system?`,
        [
          `Cross-encoder logits can drift across different queries, meaning a 0.7 score on query A may represent lower relevance than 0.5 on query B.`,
          `The cross-encoder will crash with a division by zero error whenever score calibration is omitted.`,
          `Vector databases will reject embedding insertions if re-ranker scores are uncalibrated.`,
          `The LLM context window will automatically contract to zero tokens.`,
        ],
        0,
        `Cross-encoder raw logits are uncalibrated across query lengths and distribution shifts. Setting hard absolute thresholds without sigmoid normalization or relative margin comparison can cause valid documents to be dropped or poor documents to pass.`,
        'advanced',
        'Calibrate re-ranker confidence scores and thresholding logic',
        'failure_diagnosis'
      )
    );
  }
  // 4. RAG Module 4: Production Evaluation, Guardrails, and Observability
  else if (modTitleLower.includes('evaluation') || modTitleLower.includes('observability') || modTitleLower.includes('guardrail') || (topicLower.includes('rag') && modTitleLower.includes('production'))) {
    questions.push(
      createQuestion(
        modulePlan.id,
        1,
        `In the RAG Triad framework (e.g. evaluated by Ragas or TruLens), what does the "Context Relevance" metric measure?`,
        [
          `The degree to which the retrieved context chunks contain only information pertinent to answering the user query, penalizing extraneous noise.`,
          `The percentage of grammar and punctuation errors present in the user query.`,
          `The latency in milliseconds required to execute the vector search query.`,
          `The financial cost in dollars incurred by the embedding model API call.`,
        ],
        0,
        `Context Relevance evaluates whether the retrieved text chunks are focused and relevant to the user's question, ensuring the LLM is not distracted or confused by irrelevant noise in its context window.`,
        'foundation',
        'Formulate the RAG Triad evaluation framework',
        'evaluation'
      ),
      createQuestion(
        modulePlan.id,
        2,
        `How is "Groundedness" (or Faithfulness) evaluated in automated RAG benchmarking?`,
        [
          `By verifying that all factual claims made in the generated response can be directly inferred from the provided context chunks, detecting hallucinations.`,
          `By checking whether the generated response matches the exact length of the user prompt.`,
          `By counting the number of citations and hyperlinks included in the footer of the answer.`,
          `By testing whether the embedding vector of the response has zero cosine distance to the prompt.`,
        ],
        1,
        `Groundedness / Faithfulness decomposes the generated answer into atomic propositions and verifies whether each proposition is supported by the retrieved context, flagging ungrounded hallucinations.`,
        'intermediate',
        'Measure faithfulness and groundedness to detect LLM hallucinations',
        'evaluation'
      ),
      createQuestion(
        modulePlan.id,
        3,
        `What observability mechanism is essential for debugging retrieval failures in multi-stage RAG pipelines in production?`,
        [
          `Distributed tracing tracking query transformation, retrieved chunk IDs, similarity scores, re-ranker scores, prompt payloads, and generation latency.`,
          `Logging only the final status code (200 OK) without persisting candidate chunk IDs or scores.`,
          `Restarting the vector database container whenever a user reports an unsatisfactory answer.`,
          `Printing the raw user password and API keys into server console logs.`,
        ],
        2,
        `End-to-end tracing (using tools like OpenInference, Langfuse, or Arize Phoenix) captures the intermediate state of each stage (query rewrite -> retrieved candidates -> re-ranked selection -> LLM generation), allowing engineers to pinpoint whether failures stem from retrieval or generation.`,
        'intermediate',
        'Implement distributed tracing and telemetry across RAG stages',
        'observability'
      ),
      createQuestion(
        modulePlan.id,
        4,
        `How do runtime Guardrails protect production RAG applications against prompt injection and data exfiltration?`,
        [
          `By intercepting inputs and outputs with pattern detectors and classifier models to block prompt jailbreaks, PII leakage, and toxic content.`,
          `By disabling all user input fields and allowing users to select only pre-approved buttons.`,
          `By encrypting the vector database so the LLM cannot read retrieved passages.`,
          `By running vector search exclusively in offline batch mode once every 24 hours.`,
        ],
        3,
        `Guardrails (such as NeMo Guardrails or Llama Guard) act as programmable filters evaluating incoming user queries for prompt injections and inspecting outgoing completions for PII leaks or safety policy violations before returning responses.`,
        'advanced',
        'Deploy input and output guardrails to mitigate injection and data leakage',
        'security_guardrails'
      ),
      createQuestion(
        modulePlan.id,
        5,
        `What strategy best mitigates the "Lost in the Middle" phenomenon where LLMs overlook information placed in the center of long context windows?`,
        [
          `Reordering retrieved chunks so that the highest-ranked, most critical passages are positioned at the very beginning and very end of the context prompt.`,
          `Concatenating 500 chunks indiscriminately and relying on model self-attention to parse the center.`,
          `Truncating all retrieved context chunks to exactly 10 words each.`,
          `Encoding the entire context into base64 before passing it into the system prompt.`,
        ],
        0,
        `Research (Liu et al.) demonstrates that LLM retrieval accuracy degrades when key evidence is positioned in the middle of long contexts. Placing top evidence at the prompt boundaries (start and end) maximizes attention utilization.`,
        'advanced',
        'Optimize context window placement and mitigate attention degradation',
        'architectural_trade_off'
      )
    );
  }
  // 5. Python / Programming Modules
  else if (domain === 'computer_science' && (topicLower.includes('python') || topicLower.includes('program') || topicLower.includes('code'))) {
    questions.push(
      createQuestion(
        modulePlan.id,
        1,
        `In ${modulePlan.title}, what is the key invariant regarding mutable vs immutable data types when passed as function arguments in Python?`,
        [
          `Arguments are passed by object reference: mutating a mutable object (like a list or dict) within a function modifies the caller's object in-place.`,
          `Python passes all arguments by deep copy, preventing any function from modifying caller state.`,
          `Immutable objects (integers, strings, tuples) can have their internal bytes modified using the 'mut' keyword.`,
          `Mutable objects cannot be passed as arguments to user-defined functions in Python 3.`,
        ],
        0,
        `Python evaluates parameters via pass-by-object-reference. Modifying a mutable object (such as list.append) directly mutates the referenced object, whereas reassigning a variable creates a new local binding.`,
        'foundation',
        objectives[0]?.statement || 'Data types and function parameter mechanics',
        'code_interpretation'
      ),
      createQuestion(
        modulePlan.id,
        2,
        `What represents the optimal idiomatic pattern when managing file I/O or network connections in ${topic}?`,
        [
          `Using 'with' context manager statements to guarantee deterministic resource cleanup even if exceptions are raised.`,
          `Relying on the Python garbage collector to automatically close file descriptors upon script termination.`,
          `Calling file.close() inside an infinite while loop without error handling blocks.`,
          `Storing all open file descriptors in global variables across module boundaries.`,
        ],
        1,
        `Context managers (__enter__ and __exit__) guarantee that underlying file descriptors and sockets are safely closed even when unexpected exceptions occur, preventing resource leaks.`,
        'intermediate',
        objectives[1]?.statement || 'Resource management and exception safety',
        'architectural_trade_off'
      ),
      createQuestion(
        modulePlan.id,
        3,
        `When designing algorithms involving collections in ${modulePlan.title}, what gives dictionaries and sets O(1) average-time complexity for lookups?`,
        [
          `They use underlying hash tables with collision resolution strategies rather than sequential linear scans.`,
          `They maintain elements in strictly sorted linked list nodes traversed via binary search.`,
          `They store elements in contiguous arrays indexed strictly by sequential integers.`,
          `They run background threads that cache all possible query keys in hardware registers.`,
        ],
        2,
        `Python dicts and sets compute the hash() of the lookup key to index directly into an internal sparse hash table, providing O(1) average lookup and insertion time.`,
        'intermediate',
        objectives[2]?.statement || 'Algorithmic time complexity of collections',
        'problem_solving'
      ),
      createQuestion(
        modulePlan.id,
        4,
        `What is the difference between a generator function using 'yield' and a standard function returning a list in ${topic}?`,
        [
          `Generators yield items lazily on demand with O(1) memory footprint, whereas list returns materialize all elements eagerly in RAM.`,
          `Generators execute faster than lists because they bypass Python bytecode interpretation.`,
          `Generators can only produce integer values, while lists can store any object.`,
          `Functions using yield cannot be iterated over using standard 'for' loops.`,
        ],
        3,
        `Generators maintain their execution state across calls and produce values lazily upon next(), allowing processing of massive streams without storing the full dataset in memory.`,
        'advanced',
        objectives[3]?.statement || 'Memory efficiency with lazy evaluation and generators',
        'code_interpretation'
      ),
      createQuestion(
        modulePlan.id,
        5,
        `How does Python's Global Interpreter Lock (GIL) influence multi-threaded CPU-bound programs, and what is the standard architectural remedy?`,
        [
          `The GIL prevents multiple native threads from executing Python bytecodes simultaneously; CPU-bound tasks should use multiprocessing or C-extensions.`,
          `The GIL accelerates CPU-bound operations by automatically vectorizing loops across all available cores.`,
          `The GIL only affects I/O-bound operations and has zero impact on mathematical computation.`,
          `The GIL terminates any program that launches more than two operating system threads.`,
        ],
        0,
        `Because CPython's memory management is not thread-safe, the GIL restricts execution to one thread at a time. For CPU-bound parallel speedup, developers utilize the multiprocessing module to launch separate OS processes.`,
        'advanced',
        objectives[4]?.statement || 'Concurrency models and execution runtimes',
        'architectural_trade_off'
      )
    );
  }
  // 6. React / Frontend Modules
  else if (domain === 'computer_science' && (topicLower.includes('react') || topicLower.includes('frontend') || topicLower.includes('hook'))) {
    questions.push(
      createQuestion(
        modulePlan.id,
        1,
        `In ${modulePlan.title}, what triggers a React component to re-render in the Virtual DOM lifecycle?`,
        [
          `A change in the component's internal state (useState/useReducer) or a change in the props passed by its parent.`,
          `Directly mutating a local JavaScript variable declared with 'let' inside the function body.`,
          `Calling document.getElementById() inside the component render function.`,
          `Executing a console.log statement within a custom helper function.`,
        ],
        0,
        `React components re-render whenever state updates via setter dispatch or when props change. Local mutable variables do not notify React of state transitions.`,
        'foundation',
        objectives[0]?.statement || 'Component rendering lifecycles and reactivity',
        'code_interpretation'
      ),
      createQuestion(
        modulePlan.id,
        2,
        `What fatal bug occurs if a reactive dependency is omitted from the dependency array of useEffect in React?`,
        [
          `The effect closure will capture stale values from previous renders, causing subtle desynchronization bugs.`,
          `The browser will throw a syntax error and refuse to compile the JSX bundle.`,
          `The component will immediately enter an infinite re-render loop on every frame.`,
          `The React DOM tree will automatically unmount all ancestor components.`,
        ],
        1,
        `Omitting dependencies causes the effect to reference stale closures from earlier renders, failing to update when state or props transition to new values.`,
        'intermediate',
        objectives[1]?.statement || 'Managing side effects and dependency arrays safely',
        'failure_diagnosis'
      ),
      createQuestion(
        modulePlan.id,
        3,
        `When should useMemo or useCallback be applied in production React architecture?`,
        [
          `To preserve referential identity of objects or functions passed to memoized children (React.memo) or avoid expensive recalculations.`,
          `To wrap every single function and variable in the application without profiling.`,
          `To fetch asynchronous API data directly without using useEffect or query libraries.`,
          `To replace the useState hook for simple primitive counters.`,
        ],
        2,
        `Indiscriminate memoization adds memory overhead. It should be applied when computations are demonstrably expensive or when function/object identity must be stable to prevent unnecessary re-renders in memoized child trees.`,
        'intermediate',
        objectives[2]?.statement || 'Performance optimization and referential stability',
        'architectural_trade_off'
      ),
      createQuestion(
        modulePlan.id,
        4,
        `How does React's reconciliation algorithm optimize DOM updates using the 'key' prop on list items?`,
        [
          `Keys give elements a stable identity across renders, allowing React to match existing DOM nodes and minimize expensive DOM insertions or deletions.`,
          `Keys automatically sort the array alphabetically before rendering to the DOM.`,
          `Keys encrypt the item data so other browser extensions cannot inspect list contents.`,
          `Keys convert functional components into class components behind the scenes.`,
        ],
        3,
        `Without stable keys (e.g. using array index when lists reorder), React cannot distinguish which items changed, resulting in state bugs and suboptimal full re-creations of DOM subtrees.`,
        'advanced',
        objectives[3]?.statement || 'Reconciliation algorithm and list keys',
        'algorithmic_mechanism'
      ),
      createQuestion(
        modulePlan.id,
        5,
        `Why is lifting state up or using Context API preferred over prop drilling in deeply nested component hierarchies?`,
        [
          `It decouples intermediate components from passing down props they do not consume, improving maintainability and refactorability.`,
          `It makes all application components re-render 10 times faster than local state.`,
          `It eliminates the need to use TypeScript or PropTypes for component validation.`,
          `It automatically persists application state to backend database tables without API calls.`,
        ],
        0,
        `Prop drilling pollutes intermediate components with pass-through properties. Context API or dedicated state stores provide clean data access directly where required.`,
        'intermediate',
        objectives[4]?.statement || 'Component composition and state management',
        'architectural_trade_off'
      )
    );
  }
  // 7. Mathematics / Differential Equations Modules
  else if (domain === 'mathematics' || topicLower.includes('differential equation') || topicLower.includes('calculus')) {
    questions.push(
      createQuestion(
        modulePlan.id,
        1,
        `In ${modulePlan.title}, what condition guarantees the existence and uniqueness of solutions to the initial value problem y' = f(x, y), y(x0) = y0?`,
        [
          `f(x, y) and its partial derivative ∂f/∂y must be continuous in a rectangle containing the initial point (x0, y0) (Picard-Lindelöf theorem).`,
          `The function f(x, y) must be a strictly linear polynomial with only integer coefficients.`,
          `The integration constant C must equal zero at all coordinate points.`,
          `The initial point (x0, y0) must lie exactly on the x-axis.`,
        ],
        0,
        `The Picard-Lindelöf theorem requires continuity of f and its partial derivative with respect to y in a neighborhood of the initial condition to guarantee a unique local solution.`,
        'foundation',
        objectives[0]?.statement || 'Existence and uniqueness theorems for ODEs',
        'problem_solving'
      ),
      createQuestion(
        modulePlan.id,
        2,
        `When solving a linear first-order differential equation dy/dx + P(x)y = Q(x), how is the integrating factor μ(x) derived?`,
        [
          `μ(x) = exp(∫ P(x) dx), transforming the left-hand side into the derivative of a product: d/dx [μ(x)y].`,
          `μ(x) = ∫ Q(x) dx, multiplying all terms by the anti-derivative of the forcing function.`,
          `μ(x) = P(x) / Q(x), dividing the homogeneous term by the non-homogeneous term.`,
          `μ(x) = d/dx [P(x) + Q(x)], taking the differential of the coefficient functions.`,
        ],
        1,
        `Multiplying by μ(x) = e^(∫ P(x) dx) enables application of the product rule: μ(x)y' + μ(x)P(x)y = d/dx[μ(x)y] = μ(x)Q(x), which can then be directly integrated.`,
        'intermediate',
        objectives[1]?.statement || 'Integrating factor derivation and solution methods',
        'problem_solving'
      ),
      createQuestion(
        modulePlan.id,
        3,
        `For a second-order linear homogeneous differential equation ay'' + by' + cy = 0 with characteristic roots r1, r2, what is the general solution when the roots are complex conjugate pairs α ± iβ?`,
        [
          `y(x) = e^(αx) [ C1 cos(βx) + C2 sin(βx) ]`,
          `y(x) = C1 e^(αx) + C2 e^(βx)`,
          `y(x) = (C1 + C2 x) e^(αx)`,
          `y(x) = C1 cosh(αx) + C2 sinh(βx)`,
        ],
        2,
        `Euler's formula e^(iβx) = cos(βx) + i sin(βx) converts complex exponential solutions into real-valued sinusoidal oscillations modulated by the exponential decay or growth term e^(αx).`,
        'intermediate',
        objectives[2]?.statement || 'Second-order linear ODEs and characteristic equations',
        'problem_solving'
      ),
      createQuestion(
        modulePlan.id,
        4,
        `Why is the Laplace Transform particularly powerful for solving non-homogeneous differential equations in engineering?`,
        [
          `It converts linear differential equations with initial values into algebraic equations and naturally handles discontinuous or impulse forcing functions.`,
          `It eliminates all integration constants by proving all equations evaluate to zero.`,
          `It can only be computed for equations that have trivial polynomial solutions.`,
          `It replaces analytical calculus with numerical finite-element approximations.`,
        ],
        3,
        `The Laplace transform converts differential operators into algebraic multiplication by s (L{y'} = sY(s) - y(0)), simplifying initial value problems with step functions (Heaviside) or impulses (Dirac delta).`,
        'advanced',
        objectives[3]?.statement || 'Laplace transform techniques for discontinuous inputs',
        'problem_solving'
      ),
      createQuestion(
        modulePlan.id,
        5,
        `In a 2D autonomous linear system dx/dt = Ax, what property of the matrix eigenvalues λ1, λ2 classifies an equilibrium point at the origin as a saddle point?`,
        [
          `The eigenvalues are real and have opposite algebraic signs (one positive, one negative).`,
          `Both eigenvalues are strictly negative real numbers.`,
          `Both eigenvalues are pure imaginary numbers with zero real part.`,
          `The eigenvalues are identical positive real numbers.`,
        ],
        0,
        `When eigenvalues have opposite signs (λ1 < 0 < λ2), trajectories approach the origin along the stable eigenvector and diverge along the unstable eigenvector, creating a hyperbolic saddle topology.`,
        'advanced',
        objectives[4]?.statement || 'Phase plane analysis and equilibrium point stability',
        'problem_solving'
      )
    );
  }
  // 8. General Domain-Adaptive Generator
  else {
    for (let i = 0; i < 5; i++) {
      const obj = objectives[i % objectives.length];
      const objStatement = obj.statement;
      let prompt = `In the context of ${modulePlan.title}, what is the foundational consideration when analyzing "${objStatement}"?`;
      let optA = `Verifying underlying boundary constraints and structural invariants to ensure systematic correctness.`;
      let optB = `Executing operations directly without checking required prerequisite conditions or initial states.`;
      let optC = `Treating the system components as completely isolated without considering interaction dynamics.`;
      let optD = `Relying solely on informal descriptive terminology without formal analytical validation.`;
      let explanation = `Mastery of "${modulePlan.title}" requires rigorously satisfying the prerequisite conditions and governing constraints of: ${objStatement}.`;

      if (i === 1) {
        prompt = `When applying "${objStatement}" in ${topic}, which methodology yields the highest reliability and performance?`;
        optA = `Implementing modular separation of concerns with deterministic error handling and validation at interface boundaries.`;
        optB = `Coupling all subsystem states into a single mutable global context to minimize abstraction layers.`;
        optC = `Suppressing non-critical error notifications to avoid interrupting algorithmic flow.`;
        optD = `Hardcoding operational parameters without allowing environmental configuration.`;
        explanation = `Modular design and explicit error handling at interface boundaries are essential for maintainable, testable implementations of ${objStatement}.`;
      } else if (i === 2) {
        prompt = `What critical trade-off must be evaluated when selecting methods to implement "${objStatement}"?`;
        optA = `Balancing execution latency and computational resource overhead against output precision and robustness.`;
        optB = `Assuming infinite computing resources and prioritizing exclusively theoretical elegance.`;
        optC = `Sacrificing system safety guarantees in favor of minor cosmetic improvements.`;
        optD = `Ignoring scale requirements under the assumption that system load will never increase.`;
        explanation = `System engineering requires balancing throughput, memory efficiency, and accuracy according to project operational constraints.`;
      } else if (i === 3) {
        prompt = `Which failure mode is most commonly encountered when "${objStatement}" is improperly configured?`;
        optA = `Cascading edge-case errors caused by unhandled state transitions and boundary violations.`;
        optB = `Spontaneous self-healing of data corruptions without logging diagnostic evidence.`;
        optC = `Instantaneous memory consumption reduction to absolute zero.`;
        optD = `Immediate automatic conversion of all errors into successful responses.`;
        explanation = `Boundary violations and unhandled edge transitions are the predominant root cause of downstream failures when working with ${objStatement}.`;
      } else if (i === 4) {
        prompt = `How is the efficacy and correctness of "${objStatement}" verified in production environments?`;
        optA = `Through automated diagnostic test suites, quantitative benchmark metrics, and continuous observability tracing.`;
        optB = `By subjective casual review without quantitative measurement or verifiable telemetry.`;
        optC = `By assuming correctness if no end users submit negative feedback within the first hour.`;
        optD = `By disabling all logging and metrics to prevent recording test failures.`;
        explanation = `Rigorous verification demands quantifiable metrics, unit and regression testing, and production telemetry.`;
      }

      questions.push(
        createQuestion(
          modulePlan.id,
          i + 1,
          prompt,
          [optA, optB, optC, optD],
          i % 4, // rotate correct index across 0, 1, 2, 3
          explanation,
          i === 0 ? 'foundation' : i >= 3 ? 'advanced' : 'intermediate',
          objStatement,
          'conceptual'
        )
      );
    }
  }

  return {
    id: `quiz-${modulePlan.id}`,
    title: `${modulePlan.title} Diagnostic Checkpoint`,
    moduleId: modulePlan.id,
    moduleTitle: modulePlan.title,
    timeLimitMinutes: 15,
    questions,
  };
}

function createQuestion(
  moduleId: string,
  num: number,
  prompt: string,
  options: [string, string, string, string],
  correctIndex: number,
  explanation: string,
  difficulty: 'foundation' | 'beginner' | 'intermediate' | 'advanced',
  objectiveRef: string,
  type: 'multiple_choice' | 'conceptual' | 'code_interpretation' | 'problem_solving' | string
): GeneratedQuizQuestion {
  const correctOptionText = options[0];
  const distractors = [options[1], options[2], options[3]];
  const finalOptions = [...distractors];
  finalOptions.splice(correctIndex, 0, correctOptionText);

  const mappedType: GeneratedQuizQuestion['questionType'] =
    type === 'conceptual' || type === 'code_interpretation' || type === 'problem_solving'
      ? type
      : 'multiple_choice';

  const mappedDifficulty: GeneratedQuizQuestion['difficulty'] =
    difficulty === 'foundation' ? 'beginner' : difficulty;

  return {
    id: `q-${moduleId}-${num}`,
    questionNumber: num,
    prompt,
    questionType: mappedType,
    options: finalOptions,
    correctOptionIndex: correctIndex,
    explanation,
    difficulty: mappedDifficulty,
    learningObjectiveReference: objectiveRef,
  };
}
