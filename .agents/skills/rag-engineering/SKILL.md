---
name: rag-engineering
description: >-
  Design and implement Retrieval-Augmented Generation pipelines: document chunking, embeddings, vector indexing, hybrid search, and context assembly. Use when building search engines, document QA, or syllabus retrievers.
---

# Retrieval-Augmented Generation (RAG) & Vector Search

> **Category**: AI Systems, LLMs & Agentic Engineering  
> **Specialist Subagent**: `ai-engineer`  
> **Standard**: Production-ready, verified software with zero mock data.

---

## 1. Scope & Core Objectives

1. **Build high-precision RAG pipelines retrieving verified context for LLM generation.**: Build high-precision RAG pipelines retrieving verified context for LLM generation.
2. **Optimize text chunking strategies (semantic chunking, sentence-window) with metadata tagging.**: Optimize text chunking strategies (semantic chunking, sentence-window) with metadata tagging.
3. **Implement hybrid search combining dense vector embeddings with BM25 lexical keyword search.**: Implement hybrid search combining dense vector embeddings with BM25 lexical keyword search.

---

## 2. Standard Operating Procedures (SOP)

1. Ingest documents and segment text into cohesive chunks (500-1000 tokens) with 10% overlap.
2. Generate text embeddings using text-embedding-004 or modern embedding models.
3. Store and index vectors in PostgreSQL using pgvector (HNSW / IVFFlat indexes).
4. Execute hybrid queries combining vector similarity (<=> cosine distance) with full-text search.
5. Rerank retrieved chunks and assemble compact, relevant context windows for generation.

---

## 3. Toolchain & Execution Commands

When executing this skill, employ the following standard command sequences:

```bash
npx tsx scripts/compile-taxonomy.js
npm test -- tests/rag-*.test.ts
```

---

## 4. Defensive Rules & Anti-Patterns

- **Guard**: Avoid stuffing excessive retrieved context that causes 'lost in the middle' model degradation.
- **Guard**: Never store un-sanitized source documents containing sensitive PII in public vector stores.
- **Guard**: Ensure all retrieved chunks carry source attribution metadata (title, URL, page, author).

---

## 5. Hermetic Verification Gates

Before concluding work under this skill, verify each assertion:

- [ ] Verify retrieval recall and precision on benchmark question-answering evaluation datasets.
- [ ] Verify generated answers cite specific source chunks accurately without hallucination.
- [ ] Verify vector similarity search executes in < 20ms using pgvector HNSW indexes.

---

## 6. Subagent Coordination Matrix

- **Primary Role**: `ai-engineer`
- **Orchestrator**: `engineering-orchestrator`
- **Escalation Trigger**: If requirements cross domain boundaries, dispatch subtasks via `invoke_subagent` following single-writer rules.
