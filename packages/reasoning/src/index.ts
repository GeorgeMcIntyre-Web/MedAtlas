/**
 * @medatlas/reasoning - AI reasoning layer for MedAtlas
 *
 * This package provides model adapters and utilities for generating
 * structured interpretations from graph data.
 */

// Types
export type {
  GraphNode,
  GraphEdge,
  GraphData,
  ReasoningInput,
  ValidationResult,
  ModelAdapter,
  ReasoningConfig,
} from "./types";

// Mock adapter
export { MockModelAdapter, createMockAdapter } from "./mock-adapter";

// Prompt builder
export {
  SYSTEM_PROMPT,
  formatGraphDataForPrompt,
  buildTaskPrompt,
  buildFullPrompt,
} from "./prompt-builder";

// Output validator
export { validateOutput, sanitizeOutput } from "./output-validator";
