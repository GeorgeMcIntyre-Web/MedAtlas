import type { MedAtlasOutput, EvidenceRef } from "@medatlas/schemas/types";
import type { GraphData, GraphNode, GraphEdge } from "@medatlas/graph/types";

export interface ReasoningInput {
  caseId: string;
  graphId: string;
  modalities: string[];
  graphData: GraphData;
}

export interface ReasoningOptions {
  maxSummaryLength?: number;
  confidenceThreshold?: number;
  timeout?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ path: string; message: string }>;
}

export interface ModelAdapter {
  readonly name: string;
  generateInterpretation(input: ReasoningInput, options?: ReasoningOptions): Promise<MedAtlasOutput>;
  validateOutput(output: unknown): boolean;
  isAvailable(): Promise<boolean>;
}

// Re-export types
export type { MedAtlasOutput, EvidenceRef, GraphData, GraphNode, GraphEdge };
