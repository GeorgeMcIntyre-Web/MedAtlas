/**
 * @medatlas/alignment
 * 
 * Cross-Modal Alignment and Evidence Chain Visualization for MedAtlas
 */

// Export types
export type {
  Location,
  ModalityData,
  CrossModalAlignment,
  EvidenceChainStep,
  EvidenceChain,
  AlignmentMatch,
  SourceArtifact,
  GraphNode,
  GraphEdge,
  GraphData,
  AlignmentQuery,
  AlignmentResponse,
  EvidenceChainResponse
} from "./alignment-types.js";

// Export cross-modal matcher functions
export {
  findAlignments,
  matchByLocation,
  matchByValue,
  matchByTemporalProximity,
  findAllMatches,
  calculateAlignmentConfidence
} from "./cross-modal-matcher.js";

// Export evidence chain builder functions
export {
  buildEvidenceChain,
  getSourceArtifacts,
  validateChain,
  mergeChains,
  getDirectEvidence,
  findNodesWithEvidence
} from "./evidence-chain-builder.js";
