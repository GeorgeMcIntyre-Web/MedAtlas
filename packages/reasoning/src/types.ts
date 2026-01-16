/**
 * Type exports for the reasoning package.
 */

// Re-export from @medatlas/schemas
export type { EvidenceRef, Finding, MedAtlasOutput } from "@medatlas/schemas/types";

// Re-export from @medatlas/graph
export type { GraphData, GraphNode, GraphEdge } from "@medatlas/graph";

// Model adapter types
export type {
  ReasoningInput,
  ReasoningStatus,
  ValidationResult as AdapterValidationResult,
  ModelAdapter,
  ModelAdapterConfig,
} from "./model-adapter";

export { BaseModelAdapter } from "./model-adapter";

// Mock adapter
export { MockModelAdapter } from "./mock-adapter";

// Prompt builder
export {
  buildSystemPrompt,
  buildTaskPrompt,
  buildFullPrompt,
  formatGraphDataForPrompt,
  estimateTokenCount,
  truncateGraphDataForPrompt,
} from "./prompt-builder";

// Output validator
export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "./output-validator";

export { validateOutput, sanitizeOutput } from "./output-validator";
