/**
 * Pencill AI Service Entrypoint
 * Provides a clean, decoupled abstraction for server-side AI generation.
 * Application logic interacts only with AIProvider, allowing future provider swaps.
 */

import { AIProvider } from './types';
import { GeminiProvider } from './gemini/geminiProvider';

export * from './types';
export { GeminiClientError } from './gemini/client';

// Default singleton provider instance for Pencill
export const aiService: AIProvider = new GeminiProvider();

/**
 * Factory helper to obtain or configure custom AI provider instances
 */
export function getAIProvider(): AIProvider {
  return aiService;
}
