import type { EvidenceRef } from "@medatlas/schemas/types";
import type { GraphNode, GraphEdge, GraphData } from "@medatlas/graph/types";

export interface Location {
  anatomy?: string;
  imageRef?: string;
  sliceIndex?: number;
  coordinates?: [number, number, number];
}

export interface ModalityData {
  imaging?: { nodeId: string; location?: Location; description?: string };
  text?: { nodeId: string; excerpt: string; documentType?: string };
  lab?: { nodeId: string; value: number; unit: string; referenceRange?: { low?: number; high?: number }; isAbnormal?: boolean };
}

export interface CrossModalAlignment {
  findingId: string;
  findingLabel: string;
  modalities: ModalityData;
  confidence: number;
  evidence: EvidenceRef[];
  computedAt?: string;
}

export interface EvidenceChainStep {
  nodeId: string;
  relationship: string;
  label?: string;
  nodeType?: string;
  evidence: EvidenceRef[];
}

export interface EvidenceChain {
  rootNodeId: string;
  rootLabel?: string;
  chain: EvidenceChainStep[];
  depth: number;
}

export interface AlignmentMatch {
  node1Id: string;
  node2Id: string;
  matchType: "location" | "value" | "temporal" | "semantic";
  confidence: number;
  reason: string;
}

export interface SourceArtifact {
  id: string;
  type: "dicom" | "note" | "lab" | "fhir";
  title: string;
  uri?: string;
  preview?: string;
  capturedAt?: string;
}

// Re-export for convenience
export type { GraphNode, GraphEdge, GraphData };
