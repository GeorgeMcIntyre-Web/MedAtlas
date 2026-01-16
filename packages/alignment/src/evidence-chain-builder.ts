import type { GraphData, GraphNode, GraphEdge, EvidenceChain, EvidenceChainStep, SourceArtifact } from "./alignment-types";

/**
 * Build an evidence chain from a starting node using BFS
 */
export function buildEvidenceChain(
  startNodeId: string,
  graphData: GraphData,
  maxDepth: number = 3
): EvidenceChain {
  const nodeMap = new Map(graphData.nodes.map(node => [node.id, node]));
  const startNode = nodeMap.get(startNodeId);

  if (!startNode) {
    return { rootNodeId: startNodeId, chain: [], depth: 0 };
  }

  const visited = new Set<string>();
  const chain: EvidenceChainStep[] = [];
  const queue: Array<{ nodeId: string; depth: number; relationship: string }> = [
    { nodeId: startNodeId, depth: 0, relationship: "root" }
  ];
  let maxSeenDepth = 0;

  while (queue.length > 0) {
    const { nodeId, depth, relationship } = queue.shift()!;

    if (visited.has(nodeId) || depth > maxDepth) continue;
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) continue;

    chain.push({
      nodeId: node.id,
      relationship,
      label: node.label,
      nodeType: node.type,
      evidence: node.evidence
    });
    maxSeenDepth = Math.max(maxSeenDepth, depth);

    const connectedEdges = graphData.edges.filter(
      edge => edge.source === nodeId || edge.target === nodeId
    );

    for (const edge of connectedEdges) {
      const nextNodeId = edge.source === nodeId ? edge.target : edge.source;
      if (!visited.has(nextNodeId)) {
        queue.push({ nodeId: nextNodeId, depth: depth + 1, relationship: edge.type });
      }
    }
  }

  return {
    rootNodeId: startNodeId,
    rootLabel: startNode.label,
    chain,
    depth: maxSeenDepth
  };
}

/**
 * Extract source artifacts from an evidence chain
 */
export function getSourceArtifacts(chain: EvidenceChain): SourceArtifact[] {
  const artifacts: SourceArtifact[] = [];
  const seen = new Set<string>();

  for (const step of chain.chain) {
    for (const ev of step.evidence) {
      if (seen.has(ev.id)) continue;
      seen.add(ev.id);

      artifacts.push({
        id: ev.id,
        type: ev.source as SourceArtifact["type"],
        title: `${ev.source.toUpperCase()}: ${ev.id}`,
        uri: ev.uri,
        capturedAt: ev.capturedAt
      });
    }
  }

  return artifacts;
}

/**
 * Validate chain integrity
 */
export function validateChain(chain: EvidenceChain, graphData: GraphData): boolean {
  const nodeIds = new Set(graphData.nodes.map(node => node.id));
  return chain.chain.every(step => nodeIds.has(step.nodeId));
}
