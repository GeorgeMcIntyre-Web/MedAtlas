/**
 * Node type definitions for the Atlas Graph.
 * Nodes represent entities in the medical knowledge graph.
 */

import type { EvidenceRef } from "@medatlas/schemas/types";

/**
 * Types of nodes that can exist in the Atlas Graph.
 * Each type represents a different kind of medical entity.
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
 * A node in the Atlas Graph representing a medical entity.
 */
export interface GraphNode {
  /** Unique identifier for this node */
  id: string;
  /** The type of entity this node represents */
  type: NodeType;
  /** Human-readable label for this node */
  label: string;
  /** Arbitrary properties associated with this node */
  properties: Record<string, unknown>;
  /** Evidence references linking to source data */
  evidence: EvidenceRef[];
  /** Optional timestamp when the medical event occurred */
  timestamp?: string;
  /** When this node was created in the graph */
  createdAt: string;
}

/**
 * Filter options for querying nodes.
 */
export interface NodeFilter {
  /** Filter by node type */
  type?: NodeType | NodeType[];
  /** Filter by date range (uses timestamp field) */
  dateRange?: {
    start?: string;
    end?: string;
  };
  /** Filter by properties (partial match) */
  properties?: Record<string, unknown>;
  /** Filter by patient ID (looks in properties.patientId) */
  patientId?: string;
}

/**
 * Create a new graph node with default values.
 */
export function createNode(
  id: string,
  type: NodeType,
  label: string,
  options: {
    properties?: Record<string, unknown>;
    evidence?: EvidenceRef[];
    timestamp?: string;
  } = {}
): GraphNode {
  return {
    id,
    type,
    label,
    properties: options.properties ?? {},
    evidence: options.evidence ?? [],
    timestamp: options.timestamp,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Factory functions for creating specific node types.
 */
export const NodeFactory = {
  patient(id: string, label: string, properties: Record<string, unknown> = {}): GraphNode {
    return createNode(id, "patient", label, { properties });
  },

  encounter(
    id: string,
    label: string,
    patientId: string,
    timestamp: string,
    properties: Record<string, unknown> = {},
    evidence: EvidenceRef[] = []
  ): GraphNode {
    return createNode(id, "encounter", label, {
      properties: { ...properties, patientId },
      evidence,
      timestamp,
    });
  },

  observation(
    id: string,
    label: string,
    patientId: string,
    timestamp: string,
    properties: Record<string, unknown> = {},
    evidence: EvidenceRef[] = []
  ): GraphNode {
    return createNode(id, "observation", label, {
      properties: { ...properties, patientId },
      evidence,
      timestamp,
    });
  },

  study(
    id: string,
    label: string,
    patientId: string,
    timestamp: string,
    properties: Record<string, unknown> = {},
    evidence: EvidenceRef[] = []
  ): GraphNode {
    return createNode(id, "study", label, {
      properties: { ...properties, patientId },
      evidence,
      timestamp,
    });
  },

  image(
    id: string,
    label: string,
    studyId: string,
    properties: Record<string, unknown> = {},
    evidence: EvidenceRef[] = []
  ): GraphNode {
    return createNode(id, "image", label, {
      properties: { ...properties, studyId },
      evidence,
    });
  },

  note(
    id: string,
    label: string,
    patientId: string,
    timestamp: string,
    properties: Record<string, unknown> = {},
    evidence: EvidenceRef[] = []
  ): GraphNode {
    return createNode(id, "note", label, {
      properties: { ...properties, patientId },
      evidence,
      timestamp,
    });
  },

  lab(
    id: string,
    label: string,
    patientId: string,
    timestamp: string,
    value: number,
    unit: string,
    properties: Record<string, unknown> = {},
    evidence: EvidenceRef[] = []
  ): GraphNode {
    return createNode(id, "lab", label, {
      properties: { ...properties, patientId, value, unit },
      evidence,
      timestamp,
    });
  },

  medication(
    id: string,
    label: string,
    patientId: string,
    timestamp: string,
    properties: Record<string, unknown> = {},
    evidence: EvidenceRef[] = []
  ): GraphNode {
    return createNode(id, "medication", label, {
      properties: { ...properties, patientId },
      evidence,
      timestamp,
    });
  },

  condition(
    id: string,
    label: string,
    patientId: string,
    timestamp: string,
    properties: Record<string, unknown> = {},
    evidence: EvidenceRef[] = []
  ): GraphNode {
    return createNode(id, "condition", label, {
      properties: { ...properties, patientId },
      evidence,
      timestamp,
    });
  },

  finding(
    id: string,
    label: string,
    patientId: string,
    timestamp: string,
    probability?: number,
    properties: Record<string, unknown> = {},
    evidence: EvidenceRef[] = []
  ): GraphNode {
    return createNode(id, "finding", label, {
      properties: { ...properties, patientId, probability },
      evidence,
      timestamp,
    });
  },
};
