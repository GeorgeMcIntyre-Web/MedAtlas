import type { GraphNode, AlignmentMatch } from "./alignment-types";
import { matchByTemporalProximity } from "./cross-modal-matcher";

/**
 * Align nodes by temporal proximity for a single source node.
 */
export function alignByTemporal(
  sourceNode: GraphNode,
  candidates: GraphNode[],
  windowMs: number = 3600000
): AlignmentMatch[] {
  return matchByTemporalProximity(sourceNode, candidates, windowMs);
}

/**
 * Build temporal matches across a set of nodes grouped by type.
 */
export function alignAcrossTypes(
  sourceNodes: GraphNode[],
  candidateNodes: GraphNode[],
  windowMs: number = 3600000
): AlignmentMatch[] {
  const matches: AlignmentMatch[] = [];
  for (const source of sourceNodes) {
    matches.push(...matchByTemporalProximity(source, candidateNodes, windowMs));
  }
  return matches;
}
