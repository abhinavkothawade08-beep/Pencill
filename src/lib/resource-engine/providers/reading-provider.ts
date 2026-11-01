import {
  RawCandidateResource,
  ResourceProvider,
  EducationalDomain,
} from '../types';

export class ReadingMaterialProvider implements ResourceProvider {
  readonly id = 'reading_catalog' as const;
  readonly name = 'Academic & Documentation Reading Provider';

  public async isAvailable(): Promise<boolean> {
    return true;
  }

  public async search(
    query: string,
    options?: {
      maxResults?: number;
      targetConcept?: string;
      domain?: EducationalDomain;
    }
  ): Promise<RawCandidateResource[]> {
    const limit = options?.maxResults || 3;
    const candidates: RawCandidateResource[] = [];
    const queryLower = query.toLowerCase();
    const domain = options?.domain || 'general';

    // 1. Check Official Developer & Framework Documentation (for CS & AI)
    const docCandidates = this.searchOfficialDocumentation(queryLower);
    candidates.push(...docCandidates);

    // 2. Check OpenStax & Curated Textbooks (for Math, Sciences, Econ)
    const textbookCandidates = this.searchTextbookCatalog(queryLower, domain);
    candidates.push(...textbookCandidates);

    // 3. Check arXiv for Scholarly Papers (for AI, Data, Quantum, Advanced Math & Physics)
    if (
      candidates.length < limit &&
      (domain === 'ai_and_data' ||
        domain === 'mathematics' ||
        domain === 'natural_sciences' ||
        queryLower.includes('transformer') ||
        queryLower.includes('neural') ||
        queryLower.includes('llm') ||
        queryLower.includes('quantum') ||
        queryLower.includes('deep learning'))
    ) {
      try {
        const arxivResults = await this.queryArxiv(query, 2);
        candidates.push(...arxivResults);
      } catch (e) {
        console.warn('[ReadingMaterialProvider] arXiv search notice:', (e as Error).message);
      }
    }

    // 4. University OER Repositories (MIT OCW, NCERT, Khan)
    const oerCandidates = this.searchUniversityOER(queryLower, domain);
    candidates.push(...oerCandidates);

    // Deduplicate by URL
    const seen = new Set<string>();
    const unique: RawCandidateResource[] = [];
    for (const c of candidates) {
      const key = c.url.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
      }
      if (unique.length >= limit) break;
    }

    return unique;
  }

  private searchOfficialDocumentation(queryLower: string): RawCandidateResource[] {
    const docs: RawCandidateResource[] = [];

    if (queryLower.includes('python')) {
      if (queryLower.includes('data structure') || queryLower.includes('list') || queryLower.includes('dict')) {
        docs.push({
          providerId: 'official_docs',
          externalId: 'python-docs-datastructures',
          title: 'Python Official Documentation: Data Structures (Lists, Tuples, Dictionaries & Sets)',
          url: 'https://docs.python.org/3/tutorial/datastructures.html',
          description: 'The authoritative Python tutorial on standard data structures, list comprehensions, and looping techniques.',
          modality: 'documentation',
          authorOrChannel: 'Python Software Foundation',
          durationSeconds: 1200,
          sourceRepository: 'Python Official Documentation',
          licenseOrAttribution: 'Python Software Foundation License',
        });
      } else if (queryLower.includes('class') || queryLower.includes('object') || queryLower.includes('oop')) {
        docs.push({
          providerId: 'official_docs',
          externalId: 'python-docs-classes',
          title: 'Python Official Documentation: Classes and Object-Oriented Programming',
          url: 'https://docs.python.org/3/tutorial/classes.html',
          description: 'Official guide covering namespaces, class definition syntax, inheritance, and iterator protocols.',
          modality: 'documentation',
          authorOrChannel: 'Python Software Foundation',
          durationSeconds: 1500,
          sourceRepository: 'Python Official Documentation',
          licenseOrAttribution: 'Python Software Foundation License',
        });
      } else {
        docs.push({
          providerId: 'official_docs',
          externalId: 'python-docs-tutorial',
          title: 'The Python Tutorial: Official Guide to Language Primitives',
          url: 'https://docs.python.org/3/tutorial/',
          description: 'Definitive reference and guided walkthrough for Python syntax, control flow, modules, and standard libraries.',
          modality: 'documentation',
          authorOrChannel: 'Python Software Foundation',
          durationSeconds: 1800,
          sourceRepository: 'Python Official Documentation',
          licenseOrAttribution: 'Python Software Foundation License',
        });
      }
    }

    // RAG & Generative AI Official Documentation
    if (
      queryLower.includes('rag') ||
      queryLower.includes('retrieval') ||
      queryLower.includes('vector') ||
      queryLower.includes('embedding') ||
      queryLower.includes('chunk') ||
      queryLower.includes('rerank') ||
      queryLower.includes('evaluation')
    ) {
      if (
        queryLower.includes('vector') ||
        queryLower.includes('faiss') ||
        queryLower.includes('ann') ||
        queryLower.includes('embedding space')
      ) {
        docs.push({
          providerId: 'official_docs',
          externalId: 'faiss-official-docs',
          title: 'Meta AI FAISS Official Documentation: Indexes, Clustering & GPU Search',
          url: 'https://github.com/facebookresearch/faiss/wiki',
          description: 'Official architectural wiki and guides for FAISS: IVF, HNSW, Product Quantization, and exact L2/Inner Product search.',
          modality: 'documentation',
          authorOrChannel: 'Meta AI Research',
          durationSeconds: 1500,
          sourceRepository: 'Meta Research FAISS Repository',
          licenseOrAttribution: 'MIT License',
        });
        docs.push({
          providerId: 'official_docs',
          externalId: 'pinecone-ann-guide',
          title: 'Pinecone Architecture Guide: Approximate Nearest Neighbor Search in Production',
          url: 'https://docs.pinecone.io/guides/indexes/vector-indexes',
          description: 'Production vector indexing guide covering trade-offs between recall, latency, memory footprints, and indexing algorithms.',
          modality: 'documentation',
          authorOrChannel: 'Pinecone Systems',
          durationSeconds: 1200,
          sourceRepository: 'Pinecone Documentation',
          licenseOrAttribution: 'Commercial Educational Material',
        });
      }

      if (
        queryLower.includes('chunk') ||
        queryLower.includes('hybrid') ||
        queryLower.includes('bm25') ||
        queryLower.includes('parsing')
      ) {
        docs.push({
          providerId: 'official_docs',
          externalId: 'llamaindex-chunking-docs',
          title: 'LlamaIndex Official Documentation: Document Parsing, Node Parsing & Semantic Splitters',
          url: 'https://docs.llamaindex.ai/en/stable/module_guides/loading/documents_and_nodes/',
          description: 'Authoritative guide to data parsing, sentence window retrieval, chunk overlap tuning, and semantic document splitting.',
          modality: 'documentation',
          authorOrChannel: 'LlamaIndex Team',
          durationSeconds: 1400,
          sourceRepository: 'LlamaIndex Documentation',
          licenseOrAttribution: 'MIT License',
        });
        docs.push({
          providerId: 'official_docs',
          externalId: 'langchain-hybrid-search',
          title: 'LangChain Documentation: Ensemble Retrieval & Reciprocal Rank Fusion (RRF)',
          url: 'https://python.langchain.com/docs/modules/data_connection/retrievers/ensemble',
          description: 'Implementing ensemble retrievers combining dense semantic embeddings with sparse BM25 keyword matching.',
          modality: 'documentation',
          authorOrChannel: 'LangChain AI',
          durationSeconds: 1200,
          sourceRepository: 'LangChain Documentation',
          licenseOrAttribution: 'MIT License',
        });
      }

      if (
        queryLower.includes('rerank') ||
        queryLower.includes('cross-encoder') ||
        queryLower.includes('query transformation') ||
        queryLower.includes('hyde') ||
        queryLower.includes('routing')
      ) {
        docs.push({
          providerId: 'official_docs',
          externalId: 'cohere-rerank-docs',
          title: 'Cohere Rerank Official Documentation: Two-Stage Retrieval Architectures',
          url: 'https://docs.cohere.com/docs/reranking',
          description: 'Architectural documentation on boosting RAG precision using cross-encoder re-ranking models on top of dense search.',
          modality: 'documentation',
          authorOrChannel: 'Cohere AI',
          durationSeconds: 1300,
          sourceRepository: 'Cohere Documentation',
          licenseOrAttribution: 'Commercial Educational Material',
        });
        docs.push({
          providerId: 'official_docs',
          externalId: 'sbert-cross-encoder-guide',
          title: 'Sentence-Transformers Guide: Cross-Encoder Architectures for Information Retrieval',
          url: 'https://sbert.net/examples/applications/cross-encoder/README.html',
          description: 'Technical guide on training and deploying cross-encoders for passage re-ranking and semantic search relevance.',
          modality: 'documentation',
          authorOrChannel: 'UKP Lab / Hugging Face',
          durationSeconds: 1400,
          sourceRepository: 'Sentence-Transformers Documentation',
          licenseOrAttribution: 'Apache 2.0',
        });
      }

      if (
        queryLower.includes('evaluation') ||
        queryLower.includes('ragas') ||
        queryLower.includes('trulens') ||
        queryLower.includes('guardrails') ||
        queryLower.includes('observability')
      ) {
        docs.push({
          providerId: 'official_docs',
          externalId: 'ragas-official-docs',
          title: 'Ragas Official Documentation: Automated Metrics for RAG Evaluation',
          url: 'https://docs.ragas.io/en/stable/',
          description: 'Definitive guide to quantifying RAG performance: Faithfulness, Answer Relevance, Context Precision, and Context Recall.',
          modality: 'documentation',
          authorOrChannel: 'Exploding Gradients / Ragas Community',
          durationSeconds: 1500,
          sourceRepository: 'Ragas Documentation',
          licenseOrAttribution: 'Apache 2.0',
        });
        docs.push({
          providerId: 'official_docs',
          externalId: 'trulens-rag-triad-docs',
          title: 'TruLens Evaluation Guide: The RAG Triad Framework & Observability',
          url: 'https://www.trulens.org/trulens_eval/getting_started/core_concepts/rag_triad/',
          description: 'Systematic observability and evaluation of hallucination, groundedness, and context retrieval in production LLM applications.',
          modality: 'documentation',
          authorOrChannel: 'TruEra / TruLens Team',
          durationSeconds: 1400,
          sourceRepository: 'TruLens Documentation',
          licenseOrAttribution: 'Apache 2.0',
        });
      }
    }

    if (queryLower.includes('react')) {
      if (queryLower.includes('hook') || queryLower.includes('state') || queryLower.includes('effect')) {
        docs.push({
          providerId: 'official_docs',
          externalId: 'react-docs-hooks',
          title: 'React.dev Official Documentation: Managing State with Built-in Hooks',
          url: 'https://react.dev/learn/managing-state',
          description: 'Authoritative guide on useState, useReducer, sharing state between components, and preserving state.',
          modality: 'documentation',
          authorOrChannel: 'React Core Team / Meta Open Source',
          durationSeconds: 1400,
          sourceRepository: 'React.dev',
          licenseOrAttribution: 'CC BY 4.0',
        });
      } else {
        docs.push({
          providerId: 'official_docs',
          externalId: 'react-docs-quickstart',
          title: 'React.dev Official Documentation: Quick Start & Core Architecture',
          url: 'https://react.dev/learn',
          description: 'Modern guide to React components, props, JSX syntax, pure functions, and the virtual DOM lifecycle.',
          modality: 'documentation',
          authorOrChannel: 'React Core Team / Meta Open Source',
          durationSeconds: 1500,
          sourceRepository: 'React.dev',
          licenseOrAttribution: 'CC BY 4.0',
        });
      }
    }

    if (queryLower.includes('javascript') || queryLower.includes('js') || queryLower.includes('async')) {
      docs.push({
        providerId: 'official_docs',
        externalId: 'mdn-js-guide',
        title: 'MDN Web Docs: JavaScript Language Overview and Guide',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
        description: 'Comprehensive, peer-reviewed developer documentation covering closures, asynchronous control flow, and prototypes.',
        modality: 'documentation',
        authorOrChannel: 'MDN Web Docs / Mozilla Foundation',
        durationSeconds: 1600,
        sourceRepository: 'MDN Web Docs',
        licenseOrAttribution: 'CC-BY-SA 2.5',
      });
    }

    if (queryLower.includes('sql') || queryLower.includes('postgres')) {
      docs.push({
        providerId: 'official_docs',
        externalId: 'postgresql-docs-tutorial',
        title: 'PostgreSQL Official Documentation: The SQL Language & Architecture',
        url: 'https://www.postgresql.org/docs/current/tutorial.html',
        description: 'Official relational database documentation covering schemas, table design, queries, and transactions.',
        modality: 'documentation',
        authorOrChannel: 'PostgreSQL Global Development Group',
        durationSeconds: 1500,
        sourceRepository: 'PostgreSQL Documentation',
        licenseOrAttribution: 'PostgreSQL License',
      });
    }

    if (queryLower.includes('git')) {
      docs.push({
        providerId: 'official_docs',
        externalId: 'pro-git-book',
        title: 'Pro Git Book: Distributed Version Control & Internal Object Storage',
        url: 'https://git-scm.com/book/en/v2',
        description: 'Comprehensive reference on Git branching models, rebasing, remote collaboration, and plumbing commands.',
        modality: 'documentation',
        authorOrChannel: 'Scott Chacon & Ben Straub',
        durationSeconds: 1800,
        sourceRepository: 'Pro Git / Git-SCM',
        licenseOrAttribution: 'Creative Commons Attribution-NonCommercial-ShareAlike 3.0',
      });
    }

    return docs;
  }

  private searchTextbookCatalog(queryLower: string, domain: EducationalDomain): RawCandidateResource[] {
    const textbooks: RawCandidateResource[] = [];

    if (queryLower.includes('differential equation') || queryLower.includes('calculus')) {
      textbooks.push({
        providerId: 'openstax',
        externalId: 'openstax-calc-vol2-diff-eq',
        title: 'OpenStax Calculus Volume 2: First-Order and Second-Order Differential Equations',
        url: 'https://openstax.org/books/calculus-volume-2/pages/8-introduction',
        description: 'Peer-reviewed collegiate textbook chapter covering separable equations, linear equations, direction fields, and applications.',
        modality: 'monograph',
        authorOrChannel: 'Rice University / OpenStax',
        durationSeconds: 2400,
        sourceRepository: 'OpenStax University Textbooks',
        licenseOrAttribution: 'CC BY 4.0',
      });
    }

    if (queryLower.includes('linear algebra') || queryLower.includes('matrix')) {
      textbooks.push({
        providerId: 'openstax',
        externalId: 'openstax-linear-algebra',
        title: 'OpenStax University Physics: Vectors, Coordinate Systems and Matrices',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/2-introduction',
        description: 'Vector spaces, dot products, cross products, coordinate transformations, and matrix representations.',
        modality: 'monograph',
        authorOrChannel: 'Rice University / OpenStax',
        durationSeconds: 1800,
        sourceRepository: 'OpenStax University Textbooks',
        licenseOrAttribution: 'CC BY 4.0',
      });
    }

    if (domain === 'natural_sciences' || queryLower.includes('physics') || queryLower.includes('mechanics')) {
      textbooks.push({
        providerId: 'openstax',
        externalId: 'openstax-university-physics-vol1',
        title: "OpenStax University Physics Vol 1: Newton's Laws and Classical Mechanics",
        url: 'https://openstax.org/books/university-physics-volume-1/pages/5-introduction',
        description: 'Rigorous collegiate textbook on inertial frames, force interactions, equilibrium, and rotational motion.',
        modality: 'monograph',
        authorOrChannel: 'Rice University / OpenStax',
        durationSeconds: 2200,
        sourceRepository: 'OpenStax University Textbooks',
        licenseOrAttribution: 'CC BY 4.0',
      });
    }

    return textbooks;
  }

  private searchUniversityOER(queryLower: string, domain: EducationalDomain): RawCandidateResource[] {
    const oer: RawCandidateResource[] = [];

    if (queryLower.includes('differential equation')) {
      oer.push({
        providerId: 'curated_directory',
        externalId: 'mit-ocw-18-03',
        title: 'MIT OpenCourseWare: 18.03 Differential Equations Lecture Handouts',
        url: 'https://ocw.mit.edu/courses/18-03-differential-equations-spring-2010/',
        description: 'Official MIT course monograph, problem sets, and solutions authored by Prof. Arthur Mattuck.',
        modality: 'monograph',
        authorOrChannel: 'Massachusetts Institute of Technology (MIT OCW)',
        durationSeconds: 2000,
        sourceRepository: 'MIT OpenCourseWare',
        licenseOrAttribution: 'CC BY-NC-SA 4.0',
      });
    }

    if (queryLower.includes('algorithm') || queryLower.includes('data structure')) {
      oer.push({
        providerId: 'curated_directory',
        externalId: 'mit-ocw-6-006',
        title: 'MIT OpenCourseWare: 6.006 Introduction to Algorithms Course Notes',
        url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/',
        description: 'Rigorous algorithmic proofs, asymptotic analysis, sorting, search trees, and dynamic programming.',
        modality: 'monograph',
        authorOrChannel: 'Massachusetts Institute of Technology (MIT OCW)',
        durationSeconds: 2200,
        sourceRepository: 'MIT OpenCourseWare',
        licenseOrAttribution: 'CC BY-NC-SA 4.0',
      });
    }

    if (domain === 'natural_sciences' && (queryLower.includes('class 11') || queryLower.includes('class 12') || queryLower.includes('ncert'))) {
      oer.push({
        providerId: 'curated_directory',
        externalId: 'ncert-physics-handout',
        title: 'NCERT Official Textbook: Units, Measurements, Laws of Motion & Energy',
        url: 'https://ncert.nic.in/textbook.php',
        description: 'National curriculum standard theoretical chapter with worked examples and numerical problems.',
        modality: 'monograph',
        authorOrChannel: 'NCERT (National Council of Educational Research and Training)',
        durationSeconds: 1800,
        sourceRepository: 'NCERT',
        licenseOrAttribution: 'Government of India Public Educational Standard',
      });
    }

    return oer;
  }

  private async queryArxiv(query: string, limit: number): Promise<RawCandidateResource[]> {
    try {
      const cleanQuery = encodeURIComponent(query.replace(/[^a-zA-Z0-9\s]/g, ' ').trim());
      const endpoint = `https://export.arxiv.org/api/query?search_query=all:${cleanQuery}&start=0&max_results=${limit}`;

      const res = await fetch(endpoint, {
        headers: { Accept: 'application/atom+xml' },
        signal: AbortSignal.timeout(3500),
      });

      if (!res.ok) return [];

      const xml = await res.text();
      const entries = xml.split('<entry>');
      const results: RawCandidateResource[] = [];

      for (let i = 1; i < entries.length; i++) {
        const entry = entries[i];
        const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
        const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
        const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
        const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/);
        const authorMatch = entry.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/);

        const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : 'Scholarly Research Publication';
        const summary = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : '';
        const arxivUrl = idMatch ? idMatch[1].trim() : '';
        const published = publishedMatch ? publishedMatch[1].trim() : undefined;
        const author = authorMatch ? authorMatch[1].trim() : 'Research Authors';

        if (arxivUrl) {
          results.push({
            providerId: 'arxiv',
            externalId: arxivUrl.split('/').pop() || `arxiv-${i}`,
            title: `arXiv Research Paper: ${title}`,
            url: arxivUrl,
            description: summary.slice(0, 300) + (summary.length > 300 ? '...' : ''),
            modality: 'paper',
            authorOrChannel: author,
            durationSeconds: 2700, // 45 mins reading
            publishedDate: published,
            sourceRepository: 'arXiv.org e-Print Archive',
            licenseOrAttribution: 'arXiv Open Access',
          });
        }
      }

      return results;
    } catch {
      return [];
    }
  }
}
