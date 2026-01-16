/**
 * Edge type definitions for the Atlas Graph.
 * Edges represent relationships between nodes.
 */

import type { EvidenceRef } from "@medatlas/schemas/types";

/**
 * Types of edges (relationships) that can exist in the Atlas Graph.
 * Each type represents a different kind of relationship between entities.
 */
export type EdgeType =
  | "observed-in"      // Observation found in encounter/study
  | "derived-from"     // Finding derived from another source
  | "matches"          // Cross-modal match (image finding matches text)
  | "contradicts"      // Contradictory findings
  | "temporal-near"    // Events close in time
  | "same-as"          // Same entity from different sources
  | "has-finding"      // Study/note has a finding
  | "has-evidence"     // Node has supporting evidence
  | "belongs-to"       // Entity belongs to patient
  | "part-of"          // Image part of study
  | "references";      // Generic reference

/**
 * An edge in the Atlas Graph representing a relationship between nodes.
 */
export interface GraphEdge {
  /** Unique identifier for this edge */
  id: string;
  /** ID of the source node */
  source: string;
  /** ID of the target node */
  target: string;
  /** The type of relationship this edge represents */
  type: EdgeType;
  /** Human-readable label for this edge */
  label: string;
  /** Arbitrary properties associated with this edge */
  properties: Record<string, unknown>;
  /** Evidence references supporting this relationship */
  evidence: EvidenceRef[];
  /** When this edge was created in the graph */
  createdAt: string;
}

/**
 * Filter options for querying edges.
 */
export interface EdgeFilter {
  /** Filter by edge type */
  type?: EdgeType | EdgeType[];
  /** Filter by source node ID */
  source?: string;
  /** Filter by target node ID */
  target?: string;
  /** Filter by properties (partial match) */
  properties?: Record<string, unknown>;
}

/**
 * Create a new graph edge with default values.
 */
export function createEdge(
  id: string,
  source: string,
  target: string,
  type: EdgeType,
  label: string,
  options: {
    properties?: Record<string, unknown>;
    evidence?: EvidenceRef[];
  } = {}
): GraphEdge {
  return {
    id,
    source,
    target,
    type,
    label,
    properties: options.properties ?? {},
    evidence: options.evidence ?? [],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Factory functions for creating specific edge types.
 */
export const EdgeFactory = {
  observedIn(
    id: string,
    observationId: string,
    encounterId: string,
    evidence: EvidenceRef[] = []
  ): GraphEdge {
    return createEdge(id, observationId, encounterId, "observed-in", "observed in", {
      evidence,
    });
  },

  derivedFrom(
    id: string,
    derivedId: string,
    sourceId: string,
    evidence: EvidenceRef[] = []
  ): GraphEdge {
    return createEdge(id, derivedId, sourceId, "derived-from", "derived from", {
      evidence,
    });
  },

  matches(
    id: string,
    node1Id: string,
    node2Id: string,
    confidence: number,
    evidence: EvidenceRef[] = []
  ): GraphEdge {
    return createEdge(id, node1Id, node2Id, "matches", "matches", {
      properties: { confidence },
      evidence,
    });
  },

  contradicts(
    id: string,
    node1Id: string,
    node2Id: string,
    reason?: string,
    evidence: EvidenceRef[] = []
  ): GraphEdge {
    return createEdge(id, node1Id, node2Id, "contradicts", "contradicts", {
      properties: { reason },
      evidence,
    });
  },

  temporalNear(
    id: string,
    node1Id: string,
    node2Id: string,
    timeDeltaMs: number,
    evidence: EvidenceRef[] = []
  ): GraphEdge {
    return createEdge(id, node1Id, node2Id, "temporal-near", "temporal near", {
      properties: { timeDeltaMs },
      evidence,
    });
  },

  sameAs(
    id: string,
    node1Id: string,
    node2Id: string,
    evidence: EvidenceRef[] = []
  ): GraphEdge {
    return createEdge(id, node1Id, node2Id, "same-as", "same as", {
      evidence,
    });
  },

  hasFinding(
    id: string,
    sourceId: string,
    findingId: string,
    evidence: EvidenceRef[] = []
  ): GraphEdge {
    return createEdge(id, sourceId, findingId, "has-finding", "has finding", {
      evidence,
    });
  },

  hasEvidence(
    id: string,
    nodeId: string,
    evidenceNodeId: string,
    evidence: EvidenceRef[] = []
  ): GraphEdge {
    return createEdge(id, nodeId, evidenceNodeId, "has-evidence", "has evidence", {
      evidence,
    });
  },

  belongsTo(
    id: string,
    entityId: string,
    patientId: string,
    evidence: EvidenceRef[] = []
  ): GraphEdge {
    return createEdge(id, entityId, patientId, "belongs-to", "belongs to", {
      evidence,
    });
  },

  partOf(
    id: string,
    partId: string,
    wholeId: string,
    evidence: EvidenceRef[] = []
  ): GraphEdge {
    return createEdge(id, partId, wholeId, "part-of", "part of", {
      evidence,
    });
  },

  references(
    id: string,
    fromId: string,
    toId: string,
    evidence: EvidenceRef[] = []
  ): GraphEdge {
    return createEdge(id, fromId, toId, "references", "references", {
      evidence,
    });
  },
};
