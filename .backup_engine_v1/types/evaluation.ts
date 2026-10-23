import { EngineResource, ResourceQualityBreakdown } from './resource';

export interface EvaluationRequest {
  resource: EngineResource;
  queryContext: {
    topic: string;
    targetLevel?: string;
    examContext?: string;
    intent?: string;
  };
}

export interface EvaluationResult {
  resourceId: string;
  score: ResourceQualityBreakdown;
  strengths: string[];
  weaknesses: string[];
  recommendedUse: string;
  evaluator: 'gemini' | 'heuristic' | 'hybrid';
  evaluatedAt: string;
}

export interface ValidationResult {
  isValid: boolean;
  resourceId: string;
  errors: string[];
  warnings: string[];
}
