/**
 * Alignment UI Types
 * 
 * Types for the alignment visualization components.
 */

import type { EvidenceRef } from "@medatlas/schemas/types";

/**
 * Location information
 */
export interface Location {
  anatomy?: string;
  imageRef?: string;
  sliceIndex?: number;
  coordinates?: [number, number, number];
}

/**
 * Modality data for cross-modal alignment
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
 * Cross-modal alignment
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
 * Evidence chain
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
  type: string;
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
 * Finding info for selection
 */
export interface FindingInfo {
  id: string;
  label: string;
}
