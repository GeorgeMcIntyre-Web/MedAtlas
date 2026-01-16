/**
 * Cross-Modal Alignment Types for MedAtlas
 * 
 * These types define the data structures for cross-modal alignment,
 * evidence chains, and matching logic between different medical data modalities.
 */

import type { EvidenceRef } from "@medatlas/schemas/types";

/**
 * Location information for imaging findings
 */
export interface Location {
  anatomy?: string;
  imageRef?: string;
  sliceIndex?: number;
  coordinates?: [number, number, number];
}

/**
 * Modality-specific data within an alignment
 */
export interface ModalityData {
  imaging?: {
    nodeId: string;
    location?: Location;
    description?: string;
  };
  text?: {
    nodeId: string;
    excerpt: string;
    documentType?: string;
  };
  lab?: {
    nodeId: string;
    value: number;
    unit: string;
    referenceRange?: {
      low?: number;
      high?: number;
    };
    isAbnormal?: boolean;
  };
}

/**
 * Cross-modal alignment representing correlated findings across modalities
 */
export interface CrossModalAlignment {
  /** Unique identifier for the finding being aligned */
  findingId: string;
  /** Label/name of the finding */
  findingLabel: string;
  /** Aligned data from different modalities */
  modalities: ModalityData;
  /** Confidence score for the alignment (0-1) */
  confidence: number;
  /** Evidence references supporting this alignment */
  evidence: EvidenceRef[];
  /** Timestamp when alignment was computed */
  computedAt?: string;
}

/**
 * A single step in an evidence chain
 */
export interface EvidenceChainStep {
  /** Node ID in the graph */
  nodeId: string;
  /** Type of relationship to this node */
  relationship: string;
  /** Label/description of the node */
  label?: string;
  /** Type of the node (finding, lab, imaging, etc.) */
  nodeType?: string;
  /** Evidence references for this step */
  evidence: EvidenceRef[];
}

/**
 * Evidence chain showing the path of evidence from a root node
 */
export interface EvidenceChain {
  /** Root node ID where the chain starts */
  rootNodeId: string;
  /** Label of the root node */
  rootLabel?: string;
  /** Chain of connected nodes with their relationships */
  chain: EvidenceChainStep[];
  /** Total depth of the chain */
  depth: number;
}

/**
 * Result of an alignment match operation
 */
export interface AlignmentMatch {
  /** First node ID in the match */
  node1Id: string;
  /** Second node ID in the match */
  node2Id: string;
  /** Type of match (location, value, temporal, semantic) */
  matchType: "location" | "value" | "temporal" | "semantic";
  /** Confidence score (0-1) */
  confidence: number;
  /** Reason for the match */
  reason: string;
}

/**
 * Source artifact referenced in an evidence chain
 */
export interface SourceArtifact {
  /** Unique identifier */
  id: string;
  /** Type of artifact */
  type: "dicom" | "note" | "lab" | "fhir" | "device" | "claims" | "synthetic";
  /** Display title */
  title: string;
  /** URI to access the artifact */
  uri?: string;
  /** Preview content (if available) */
  preview?: string;
  /** When the artifact was captured */
  capturedAt?: string;
}

/**
 * Graph node structure (simplified, matching Agent 1's expected types)
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
 * Graph edge structure
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties?: Record<string, unknown>;
}

/**
 * Graph data structure for alignment operations
 */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Query parameters for alignment API
 */
export interface AlignmentQuery {
  findingId: string;
  includeChain?: boolean;
  maxDepth?: number;
}

/**
 * Response from alignment API
 */
export interface AlignmentResponse {
  alignments: CrossModalAlignment[];
  totalCount: number;
}

/**
 * Response from evidence chain API
 */
export interface EvidenceChainResponse {
  chain: EvidenceChain;
  sourceArtifacts: SourceArtifact[];
}
