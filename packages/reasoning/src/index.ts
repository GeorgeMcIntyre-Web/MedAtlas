/**
 * @medatlas/reasoning
 * 
 * Reasoning Layer for MedAtlas
 * Provides AI model adapters for generating structured outputs from graph data.
 */

// Export types
export type {
  GraphNode,
  GraphEdge,
  GraphData,
  ReasoningInput,
  ReasoningResult,
  ModelAdapterConfig,
  ModelAdapter
} from "./model-adapter.js";

// Export model adapter utilities
export {
  extractFindingsFromGraph,
  extractEntitiesFromGraph,
  calculateUncertainty,
  generateRecommendations
} from "./model-adapter.js";

// Export mock adapter
export {
  MockModelAdapter,
  createMockAdapter,
  generateDemoCaseOutput
} from "./mock-adapter.js";

// Export prompt builder
export {
  buildSystemPrompt,
  buildTaskPrompt,
  buildCompletePrompt,
  formatGraphDataForPrompt,
  estimateTokenCount,
  truncateGraphData
} from "./prompt-builder.js";

// Export output validator
export type {
  ValidationResult,
  ValidationError
} from "./output-validator.js";

export {
  validateMedAtlasOutput,
  sanitizeOutput
} from "./output-validator.js";
