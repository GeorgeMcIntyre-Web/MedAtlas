/**
 * Model adapter interface for reasoning layer.
 * Defines the contract for AI model integrations.
 */

import type { MedAtlasOutput, EvidenceRef } from "@medatlas/schemas/types";
import type { GraphData } from "@medatlas/graph";

/**
 * Input for the reasoning layer.
 */
export interface ReasoningInput {
  /** Unique case identifier */
  caseId: string;
  /** Graph ID containing the case data */
  graphId: string;
  /** List of modalities present in the case */
  modalities: string[];
  /** Graph data containing nodes and edges */
  graphData: GraphData;
}

/**
 * Reasoning status for tracking progress.
 */
export interface ReasoningStatus {
  caseId: string;
  status: "pending" | "processing" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

/**
 * Result of output validation.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Model adapter interface.
 * Implement this interface to integrate different AI models.
 */
export interface ModelAdapter {
  /** Adapter name for identification */
  readonly name: string;

  /**
   * Generate an interpretation from graph data.
   * @param input - The reasoning input containing case and graph data
   * @returns A MedAtlasOutput structured response
   */
  generateInterpretation(input: ReasoningInput): Promise<MedAtlasOutput>;

  /**
   * Validate an output against the MedAtlasOutput schema.
   * @param output - The output to validate
   * @returns True if valid, false otherwise
   */
  validateOutput(output: unknown): boolean;
}

/**
 * Configuration for model adapters.
 */
export interface ModelAdapterConfig {
  /** API endpoint for remote models */
  apiEndpoint?: string;
  /** API key for authentication */
  apiKey?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum retries on failure */
  maxRetries?: number;
  /** Additional model-specific options */
  options?: Record<string, unknown>;
}

/**
 * Base class for model adapters with common functionality.
 */
export abstract class BaseModelAdapter implements ModelAdapter {
  abstract readonly name: string;
  protected config: ModelAdapterConfig;

  constructor(config: ModelAdapterConfig = {}) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      ...config,
    };
  }

  abstract generateInterpretation(input: ReasoningInput): Promise<MedAtlasOutput>;

  /**
   * Basic output validation.
   * Override for more sophisticated validation.
   */
  validateOutput(output: unknown): boolean {
    if (typeof output !== "object" || output === null) return false;

    const obj = output as Record<string, unknown>;

    // Check required fields
    const requiredFields = [
      "caseId",
      "modalities",
      "summary",
      "findings",
      "extractedEntities",
      "recommendations",
      "uncertainty",
      "safety",
    ];

    for (const field of requiredFields) {
      if (!(field in obj)) return false;
    }

    // Check safety constants
    const safety = obj.safety as Record<string, unknown> | undefined;
    if (!safety) return false;
    if (safety.notMedicalAdvice !== true) return false;
    if (safety.requiresClinicianReview !== true) return false;

    // Check uncertainty structure
    const uncertainty = obj.uncertainty as Record<string, unknown> | undefined;
    if (!uncertainty) return false;
    if (!["low", "medium", "high"].includes(uncertainty.level as string)) return false;
    if (!Array.isArray(uncertainty.reasons)) return false;

    return true;
  }

  /**
   * Extract modalities from graph data.
   */
  protected extractModalities(graphData: GraphData): string[] {
    const modalities = new Set<string>();

    for (const node of graphData.nodes) {
      // Add node type as modality
      if (["image", "study", "lab", "note"].includes(node.type)) {
        modalities.add(node.type);
      }

      // Check evidence sources
      for (const evidence of node.evidence) {
        modalities.add(evidence.source);
      }
    }

    return Array.from(modalities);
  }

  /**
   * Create safety block (always required).
   */
  protected createSafetyBlock(): MedAtlasOutput["safety"] {
    return {
      notMedicalAdvice: true,
      requiresClinicianReview: true,
    };
  }
}
