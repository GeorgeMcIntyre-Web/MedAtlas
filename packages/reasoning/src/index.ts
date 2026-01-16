/**
 * @medatlas/reasoning - Reasoning Layer for MedAtlas
 * 
 * This package provides the AI reasoning capabilities for MedAtlas,
 * transforming graph data into structured clinical interpretations.
 */

// Model adapter interface and base class
export type {
  ReasoningInput,
  ReasoningStatus,
  ModelAdapter,
  ModelAdapterConfig,
} from "./model-adapter";

export { BaseModelAdapter } from "./model-adapter";

// Mock adapter for demo
export { MockModelAdapter } from "./mock-adapter";

// Prompt building utilities
export {
  buildSystemPrompt,
  buildTaskPrompt,
  buildFullPrompt,
  formatGraphDataForPrompt,
  estimateTokenCount,
  truncateGraphDataForPrompt,
} from "./prompt-builder";

// Output validation
export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "./output-validator";

export { validateOutput, sanitizeOutput } from "./output-validator";

// Re-export schema types for convenience
export type { EvidenceRef, Finding, MedAtlasOutput } from "@medatlas/schemas/types";
export type { GraphData, GraphNode, GraphEdge } from "@medatlas/graph";
