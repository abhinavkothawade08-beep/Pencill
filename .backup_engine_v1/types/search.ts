import { EngineResourceType, ResourceDifficulty } from './resource';
import { SequenceType } from './sequence';
import { ContentType } from './quality';

export interface ParsedQuery {
  rawQuery: string;
  topic: string;
  subject?: string;
  domain?: string;
  targetLevel?: ResourceDifficulty;
  examContext?: string; // 'JEE' | 'NEET' | 'UPSC' | 'GATE' | 'CBSE 11' | etc.
  targetResourceTypes?: EngineResourceType[];
  language?: string;
  intent?: 'concept_learning' | 'revision' | 'exam_prep' | 'problem_solving' | 'quick_summary';
  keywords?: string[];
  isAcademic?: boolean;
  needsVisual?: boolean;
  needsMonograph?: boolean;
  needsPractice?: boolean;
  needsStructuredCourse?: boolean;
}

export interface SearchPlanItem {
  provider: 'google' | 'youtube' | 'web' | 'practice' | 'quiz' | 'notes' | 'academic_notes' | 'arxiv' | 'openalex' | 'wikimedia';
  query: string;
  targetTypes: EngineResourceType[];
  maxResults: number;
  filters?: Record<string, unknown>;
}

export interface SearchPlan {
  originalQuery: string;
  parsedQuery: ParsedQuery;
  queries: SearchPlanItem[];
  createdAt: string;
}

export interface SearchOptions {
  limit?: number;
  providers?: ('google' | 'youtube' | 'web' | 'practice' | 'quiz' | 'notes' | 'academic_notes' | 'arxiv' | 'openalex' | 'wikimedia')[];
  resourceTypes?: EngineResourceType[];
  difficulty?: ResourceDifficulty;
  examContext?: string;
  minQualityScore?: number;
  enableAiEvaluation?: boolean;
  saveToDatabase?: boolean;
  timeoutMs?: number;
  sequenceType?: SequenceType;
  contentType?: ContentType;
}
