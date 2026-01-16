/**
 * Model Adapter Interface
 * 
 * Defines the interface for AI model adapters that generate structured outputs
 * from graph data. Supports MedGemma, Claude, or mock implementations.
 */

import type { MedAtlasOutput, EvidenceRef, Finding } from "@medatlas/schemas/types";

/**
 * Graph node structure for reasoning input
 */
export interface GraphNode {
  id: string;
  type: string;
  label: string;
  timestamp?: string;
  properties?: Record<string, unknown>;
  evidence?: EvidenceRef[];
}

/**
 * Graph edge structure for reasoning input
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties?: Record<string, unknown>;
}

/**
 * Graph data provided to the reasoning layer
 */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  patientId?: string;
  caseId?: string;
}

/**
 * Input to the reasoning layer
 */
export interface ReasoningInput {
  /** Case identifier */
  caseId: string;
  /** Graph identifier (optional) */
  graphId?: string;
  /** Modalities present in the case */
  modalities: string[];
  /** Graph data with nodes and edges */
  graphData: GraphData;
}

/**
 * Result of reasoning including metadata
 */
export interface ReasoningResult {
  /** The generated output */
  output: MedAtlasOutput;
  /** Model used for generation */
  model: string;
  /** Processing time in milliseconds */
  processingTimeMs: number;
  /** Whether validation passed */
  validationPassed: boolean;
  /** Any warnings during processing */
  warnings?: string[];
}

/**
 * Model adapter configuration
 */
export interface ModelAdapterConfig {
  /** Model name/identifier */
  modelName: string;
  /** API endpoint (if applicable) */
  apiEndpoint?: string;
  /** API key (if applicable) */
  apiKey?: string;
  /** Maximum tokens for generation */
  maxTokens?: number;
  /** Temperature for generation */
  temperature?: number;
}

/**
 * Interface for model adapters
 */
export interface ModelAdapter {
  /** Adapter name */
  readonly name: string;
  
  /**
   * Generate a MedAtlas interpretation from reasoning input
   * @param input - Reasoning input with graph data
   * @returns MedAtlas output
   */
  generateInterpretation(input: ReasoningInput): Promise<MedAtlasOutput>;
  
  /**
   * Validate that an output conforms to the schema
   * @param output - Output to validate
   * @returns true if valid
   */
  validateOutput(output: unknown): boolean;
}

/**
 * Extract findings from graph nodes
 */
export function extractFindingsFromGraph(graphData: GraphData): Finding[] {
  const findingNodes = graphData.nodes.filter(n => 
    n.type.toLowerCase() === "finding"
  );

  return findingNodes.map(node => {
    const props = node.properties || {};
    
    return {
      label: node.label,
      probability: (props.probability as number) || undefined,
      location: props.location ? {
        anatomy: (props.location as Record<string, unknown>).anatomy as string | undefined,
        imageRef: (props.location as Record<string, unknown>).imageRef as string | undefined,
        sliceIndex: (props.location as Record<string, unknown>).sliceIndex as number | undefined,
        coordinates: (props.location as Record<string, unknown>).coordinates as [number, number, number] | undefined
      } : undefined,
      evidence: node.evidence || []
    };
  });
}

/**
 * Extract entities from graph nodes
 */
export function extractEntitiesFromGraph(
  graphData: GraphData
): MedAtlasOutput["extractedEntities"] {
  const entityTypes = ["condition", "medication", "symptom", "lab", "observation"];
  
  const entityNodes = graphData.nodes.filter(n => 
    entityTypes.includes(n.type.toLowerCase())
  );

  return entityNodes.map(node => {
    const props = node.properties || {};
    
    return {
      type: node.type.toLowerCase(),
      text: node.label,
      value: props.value as number | undefined,
      unit: props.unit as string | undefined,
      evidence: node.evidence || []
    };
  });
}

/**
 * Calculate uncertainty based on graph data
 */
export function calculateUncertainty(
  graphData: GraphData
): MedAtlasOutput["uncertainty"] {
  const reasons: string[] = [];
  let level: "low" | "medium" | "high" = "low";

  // Check for missing data
  const modalities = new Set(graphData.nodes.map(n => n.type.toLowerCase()));
  
  if (!modalities.has("imaging") && !modalities.has("study")) {
    reasons.push("No imaging data available");
    level = level === "low" ? "medium" : level;
  }
  
  if (!modalities.has("lab") && !modalities.has("labresult")) {
    reasons.push("No lab results available");
    level = level === "low" ? "medium" : level;
  }

  // Check for contradictory findings
  const findings = graphData.nodes.filter(n => n.type.toLowerCase() === "finding");
  if (findings.length === 0) {
    reasons.push("No clinical findings extracted");
    level = "high";
  }

  // Check evidence coverage
  const nodesWithoutEvidence = graphData.nodes.filter(
    n => !n.evidence || n.evidence.length === 0
  );
  if (nodesWithoutEvidence.length > graphData.nodes.length * 0.5) {
    reasons.push("Limited evidence linkage in graph data");
    level = level === "low" ? "medium" : level;
  }

  // Check for synthetic data
  const hasSyntheticData = graphData.nodes.some(
    n => n.evidence?.some(e => e.source === "synthetic")
  );
  if (hasSyntheticData) {
    reasons.push("Contains synthetic/demo data");
    level = "high";
  }

  if (reasons.length === 0) {
    reasons.push("Routine analysis with adequate data coverage");
  }

  return { level, reasons };
}

/**
 * Generate recommendations based on graph data
 */
export function generateRecommendations(graphData: GraphData): string[] {
  const recommendations: string[] = [];
  const modalities = new Set(graphData.nodes.map(n => n.type.toLowerCase()));

  // Missing data recommendations
  if (!modalities.has("imaging") && !modalities.has("study")) {
    recommendations.push("Consider ordering imaging studies if clinically indicated.");
  }

  if (!modalities.has("lab") && !modalities.has("labresult")) {
    recommendations.push("Review lab work to support clinical assessment.");
  }

  // Standard recommendations
  recommendations.push("Clinician review required before any clinical action.");
  recommendations.push("Verify all findings against source documentation.");

  // Finding-specific recommendations
  const findings = graphData.nodes.filter(n => n.type.toLowerCase() === "finding");
  if (findings.some(f => f.label.toLowerCase().includes("urgent") || 
                        f.label.toLowerCase().includes("critical"))) {
    recommendations.unshift("Urgent findings detected - prioritize clinician review.");
  }

  return recommendations;
}
