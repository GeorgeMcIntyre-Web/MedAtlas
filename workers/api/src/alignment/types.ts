/**
 * Alignment API Types
 * 
 * Request and response types for the alignment API endpoints.
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
 * Cross-modal alignment API response
 */
export interface CrossModalAlignment {
  findingId: string;
  findingLabel: string;
  modalities: ModalityData;
  confidence: number;
  evidence: EvidenceRef[];
  computedAt?: string;
}

/**
 * Evidence chain step
 */
export interface EvidenceChainStep {
  nodeId: string;
  relationship: string;
  label?: string;
  nodeType?: string;
  evidence: EvidenceRef[];
}

/**
 * Evidence chain response
 */
export interface EvidenceChain {
  rootNodeId: string;
  rootLabel?: string;
  chain: EvidenceChainStep[];
  depth: number;
}

/**
 * Source artifact
 */
export interface SourceArtifact {
  id: string;
  type: "dicom" | "note" | "lab" | "fhir" | "device" | "claims" | "synthetic";
  title: string;
  uri?: string;
  preview?: string;
  capturedAt?: string;
}

/**
 * Alignment API response
 */
export interface AlignmentResponse {
  alignments: CrossModalAlignment[];
  totalCount: number;
}

/**
 * Evidence chain API response
 */
export interface EvidenceChainResponse {
  chain: EvidenceChain;
  sourceArtifacts: SourceArtifact[];
}

/**
 * Compare API response
 */
export interface CompareResponse {
  node1Id: string;
  node2Id: string;
  hasAlignment: boolean;
  alignmentType?: string;
  confidence?: number;
  sharedEvidence: EvidenceRef[];
}
