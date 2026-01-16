/**
 * Alignment UI Components
 * 
 * Components for cross-modal alignment and evidence chain visualization.
 */

// Export types
export type {
  Location,
  ModalityData,
  CrossModalAlignment,
  EvidenceChainStep,
  EvidenceChain,
  SourceArtifact,
  AlignmentResponse,
  EvidenceChainResponse,
  FindingInfo
} from "./types.js";

// Export hooks
export {
  useAlignments,
  useEvidenceChain,
  useFindings,
  useCrossModalView
} from "./useCrossModal.js";

// Export components
export { 
  CrossModalView, 
  CrossModalEmpty, 
  CrossModalLoading 
} from "./CrossModalView.js";

export { 
  EvidenceChainView 
} from "./EvidenceChain.js";

export { 
  ModalityLink, 
  ModalityLinkCompact 
} from "./ModalityLink.js";
