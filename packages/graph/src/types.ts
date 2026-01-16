/**
 * SHARED TYPE DEFINITIONS - DO NOT MODIFY
 * All agents must import types from @medatlas/graph
 */

import type { EvidenceRef } from "@medatlas/schemas/types";

// Re-export for convenience
export type { EvidenceRef } from "@medatlas/schemas/types";

/**
 * Node types in the Atlas Graph
 */
export type NodeType =
  | "patient"
  | "encounter"
  | "observation"
  | "study"
  | "image"
  | "note"
  | "lab"
  | "medication"
  | "condition"
  | "finding";

/**
 * Edge types in the Atlas Graph
 */
export type EdgeType =
  | "observed-in"
  | "derived-from"
  | "matches"
  | "contradicts"
  | "temporal-near"
  | "same-as"
  | "has-finding"
  | "has-evidence"
  | "belongs-to"
  | "part-of"
  | "references";

/**
 * A node in the Atlas Graph
 */
export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  properties: Record<string, unknown>;
  evidence: EvidenceRef[];
  timestamp?: string;
  createdAt: string;
}

/**
 * An edge in the Atlas Graph
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label: string;
  properties: Record<string, unknown>;
  evidence: EvidenceRef[];
  createdAt: string;
}

/**
 * Filter for querying nodes
 */
export interface NodeFilter {
  type?: NodeType | NodeType[];
  patientId?: string;
  dateRange?: { start?: string; end?: string };
  properties?: Record<string, unknown>;
}

/**
 * Filter for querying edges
 */
export interface EdgeFilter {
  type?: EdgeType | EdgeType[];
  source?: string;
  target?: string;
  properties?: Record<string, unknown>;
}

/**
 * Serialized graph data
 */
export interface GraphData {
  id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    nodeCount: number;
    edgeCount: number;
  };
}

/**
 * Timeline event for UI consumption
 */
export interface TimelineEvent {
  id: string;
  type: NodeType;
  timestamp: string;
  title: string;
  summary?: string;
  evidence: EvidenceRef[];
  relatedNodes: string[];
}

/**
 * Timeline API response
 */
export interface TimelineResponse {
  patientId: string;
  events: TimelineEvent[];
  dateRange: { start: string; end: string };
}
