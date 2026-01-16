/**
 * Reasoning API Types
 * 
 * Request and response types for the reasoning API endpoints.
 */

import type { MedAtlasOutput, EvidenceRef } from "@medatlas/schemas/types";

/**
 * Graph node for reasoning input
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
 * Graph edge for reasoning input
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties?: Record<string, unknown>;
}

/**
 * Graph data for reasoning
 */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  patientId?: string;
  caseId?: string;
}

/**
 * Reasoning request body
 */
export interface ReasoningRequest {
  caseId: string;
  graphId?: string;
  modalities: string[];
  graphData?: GraphData;
}

/**
 * Reasoning response
 */
export interface ReasoningResponse {
  output: MedAtlasOutput;
  model: string;
  processingTimeMs: number;
  validationPassed: boolean;
  warnings?: string[];
}

/**
 * Reasoning status response
 */
export interface ReasoningStatusResponse {
  caseId: string;
  status: "pending" | "processing" | "completed" | "failed";
  output?: MedAtlasOutput;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}
