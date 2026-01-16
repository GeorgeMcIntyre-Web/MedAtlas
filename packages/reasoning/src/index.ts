/**
 * @medatlas/reasoning
 *
 * Reasoning layer for MedAtlas that generates AI-powered structured
 * outputs from medical graph data.
 */

// Model adapter interface and types
export type {
  ModelAdapter,
  ModelAdapterFactory,
  ReasoningInput,
  ReasoningOptions,
  GraphData,
  GraphNode,
  GraphEdge,
  ValidationResult,
  ValidationError,
} from "./model-adapter.js";

// Mock adapter for demo/testing
export { MockModelAdapter, createMockAdapter } from "./mock-adapter.js";

// MedGemma adapter (when available)
export { MedGemmaAdapter, createMedGemmaAdapter } from "./medgemma-adapter.js";

// Prompt building utilities
export {
  buildSystemPrompt,
  buildTaskPrompt,
  buildCompletePrompt,
  formatGraphDataForPrompt,
} from "./prompt-builder.js";

// Output validation utilities
export {
  validateOutput,
  sanitizeOutput,
  isValidOutput,
} from "./output-validator.js";

// Convenience function to get default adapter
import { createMockAdapter } from "./mock-adapter.js";
import type { ModelAdapter } from "./model-adapter.js";

/**
 * Get the default model adapter
 *
 * In production, this could be configured via environment variables
 * to return a MedGemma adapter or other real model adapter.
 *
 * @returns The default ModelAdapter instance
 */
export function getDefaultAdapter(): ModelAdapter {
  // For now, always return mock adapter
  // In production: check env vars, return MedGemma if configured
  return createMockAdapter();
}
