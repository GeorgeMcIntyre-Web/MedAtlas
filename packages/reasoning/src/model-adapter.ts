/**
 * Model Adapter Interface for MedAtlas Reasoning Layer
 *
 * Defines the contract for AI model adapters that generate structured
 * medical interpretations from graph data.
 */

import type { MedAtlasOutput, EvidenceRef } from "@medatlas/schemas/types";

/**
 * Represents a node in the Atlas Graph
 */
export interface GraphNode {
  id: string;
  type:
    | "patient"
    | "encounter"
    | "observation"
    | "study"
    | "lab"
    | "medication"
    | "condition"
    | "finding"
    | "note"
    | "artifact";
  label: string;
  timestamp?: string;
  properties: Record<string, unknown>;
  evidence?: EvidenceRef[];
}

/**
 * Represents an edge in the Atlas Graph
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type:
    | "observed-in"
    | "derived-from"
    | "matches"
    | "supports"
    | "contradicts"
    | "temporal"
    | "caused-by"
    | "related-to";
  properties?: Record<string, unknown>;
  confidence?: number;
}

/**
 * Complete graph data structure for reasoning
 */
export interface GraphData {
  id: string;
  patientId?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  modalities: string[];
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    nodeCount?: number;
    edgeCount?: number;
  };
}

/**
 * Input to the reasoning layer
 */
export interface ReasoningInput {
  caseId: string;
  graphId: string;
  modalities: string[];
  graphData: GraphData;
}

/**
 * Configuration options for reasoning
 */
export interface ReasoningOptions {
  /** Maximum length of generated summary */
  maxSummaryLength?: number;
  /** Include detailed uncertainty analysis */
  includeDetailedUncertainty?: boolean;
  /** Minimum confidence threshold for findings */
  confidenceThreshold?: number;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Result of output validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  value?: unknown;
}

/**
 * Abstract interface for model adapters
 *
 * Implement this interface to create adapters for different AI models
 * (e.g., MedGemma, GPT-4, mock adapter for testing)
 */
export interface ModelAdapter {
  /** Unique identifier for this adapter */
  readonly name: string;

  /**
   * Generate a structured interpretation from graph data
   *
   * @param input - The reasoning input containing case and graph data
   * @param options - Optional configuration for reasoning
   * @returns A promise resolving to a MedAtlasOutput
   */
  generateInterpretation(
    input: ReasoningInput,
    options?: ReasoningOptions
  ): Promise<MedAtlasOutput>;

  /**
   * Validate that an output conforms to the MedAtlasOutput schema
   *
   * @param output - The output to validate
   * @returns true if valid, false otherwise
   */
  validateOutput(output: unknown): boolean;

  /**
   * Check if the adapter is available and ready
   *
   * @returns true if the adapter can generate interpretations
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Factory function type for creating model adapters
 */
export type ModelAdapterFactory = (config?: Record<string, unknown>) => ModelAdapter;
