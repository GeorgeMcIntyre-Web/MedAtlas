import type { MedAtlasOutput, EvidenceRef } from "@medatlas/schemas/types";

/**
 * Graph node representation for reasoning input
 */
export interface GraphNode {
  id: string;
  type: 'patient' | 'encounter' | 'observation' | 'study' | 'lab' | 'medication' | 'condition' | 'finding' | 'note';
  label: string;
  timestamp?: string;
  data: Record<string, unknown>;
  evidence: EvidenceRef[];
}

/**
 * Graph edge representation for reasoning input
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: 'observed-in' | 'derived-from' | 'matches' | 'part-of' | 'caused-by' | 'related-to' | 'supports';
  weight?: number;
  evidence?: EvidenceRef[];
}

/**
 * Complete graph data structure
 */
export interface GraphData {
  graphId: string;
  patientId?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  modalities: string[];
  metadata?: {
    createdAt: string;
    updatedAt?: string;
    version?: string;
  };
}

/**
 * Input for reasoning/interpretation
 */
export interface ReasoningInput {
  caseId: string;
  graphId: string;
  modalities: string[];
  graphData: GraphData;
}

/**
 * Result of output validation
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Model adapter interface for generating interpretations
 */
export interface ModelAdapter {
  /**
   * Generate a structured interpretation from graph data
   */
  generateInterpretation(input: ReasoningInput): Promise<MedAtlasOutput>;

  /**
   * Validate that an output conforms to the schema
   */
  validateOutput(output: unknown): ValidationResult;

  /**
   * Get adapter name/identifier
   */
  readonly name: string;
}

/**
 * Configuration for reasoning operations
 */
export interface ReasoningConfig {
  /** Maximum number of findings to extract */
  maxFindings?: number;
  /** Maximum number of entities to extract */
  maxEntities?: number;
  /** Include recommendations in output */
  includeRecommendations?: boolean;
  /** Confidence threshold for findings */
  confidenceThreshold?: number;
}
