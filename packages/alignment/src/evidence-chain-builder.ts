/**
 * Evidence Chain Builder
 * 
 * Builds evidence chains by traversing the graph from a root node,
 * following evidence edges and collecting source artifacts.
 */

import type {
  EvidenceChain,
  EvidenceChainStep,
  SourceArtifact,
  GraphData,
  GraphNode,
  GraphEdge
} from "./alignment-types.js";
import type { EvidenceRef } from "@medatlas/schemas/types";

/**
 * Build an evidence chain starting from a root node
 * @param nodeId - Starting node ID
 * @param graph - Graph data
 * @param maxDepth - Maximum depth to traverse (default: 5)
 * @returns Evidence chain
 */
export function buildEvidenceChain(
  nodeId: string,
  graph: GraphData,
  maxDepth: number = 5
): EvidenceChain {
  const rootNode = graph.nodes.find(n => n.id === nodeId);
  if (!rootNode) {
    return {
      rootNodeId: nodeId,
      chain: [],
      depth: 0
    };
  }

  const visited = new Set<string>();
  const chain: EvidenceChainStep[] = [];

  // Add root node as first step
  chain.push({
    nodeId: rootNode.id,
    relationship: "root",
    label: rootNode.label,
    nodeType: rootNode.type,
    evidence: rootNode.evidence || []
  });
  visited.add(rootNode.id);

  // BFS traversal
  const queue: Array<{ nodeId: string; depth: number }> = [
    { nodeId: rootNode.id, depth: 0 }
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current.depth >= maxDepth) {
      continue;
    }

    // Find connected edges
    const connectedEdges = graph.edges.filter(
      e => e.source === current.nodeId || e.target === current.nodeId
    );

    for (const edge of connectedEdges) {
      const neighborId = edge.source === current.nodeId ? edge.target : edge.source;
      
      if (visited.has(neighborId)) {
        continue;
      }

      const neighborNode = graph.nodes.find(n => n.id === neighborId);
      if (!neighborNode) {
        continue;
      }

      visited.add(neighborId);
      
      chain.push({
        nodeId: neighborId,
        relationship: edge.type,
        label: neighborNode.label,
        nodeType: neighborNode.type,
        evidence: neighborNode.evidence || []
      });

      queue.push({ nodeId: neighborId, depth: current.depth + 1 });
    }
  }

  return {
    rootNodeId: nodeId,
    rootLabel: rootNode.label,
    chain,
    depth: calculateChainDepth(chain, graph)
  };
}

/**
 * Calculate the depth of the chain (longest path from root)
 */
function calculateChainDepth(
  chain: EvidenceChainStep[],
  graph: GraphData
): number {
  if (chain.length <= 1) {
    return chain.length;
  }

  // Simple depth calculation based on chain length
  return chain.length - 1;
}

/**
 * Extract source artifacts from an evidence chain
 * @param chain - Evidence chain
 * @param graph - Graph data (optional, for additional context)
 * @returns Array of source artifacts
 */
export function getSourceArtifacts(
  chain: EvidenceChain,
  graph?: GraphData
): SourceArtifact[] {
  const artifactsMap = new Map<string, SourceArtifact>();

  for (const step of chain.chain) {
    for (const evidence of step.evidence) {
      const artifactId = `${evidence.source}-${evidence.id}`;
      
      if (!artifactsMap.has(artifactId)) {
        artifactsMap.set(artifactId, {
          id: evidence.id,
          type: mapSourceToArtifactType(evidence.source),
          title: generateArtifactTitle(evidence, step),
          uri: evidence.uri,
          capturedAt: evidence.capturedAt
        });
      }
    }
  }

  return Array.from(artifactsMap.values());
}

/**
 * Map EvidenceRef source to SourceArtifact type
 */
function mapSourceToArtifactType(
  source: EvidenceRef["source"]
): SourceArtifact["type"] {
  return source;
}

/**
 * Generate a display title for an artifact
 */
function generateArtifactTitle(
  evidence: EvidenceRef,
  step: EvidenceChainStep
): string {
  const typeLabels: Record<string, string> = {
    dicom: "Imaging Study",
    note: "Clinical Note",
    lab: "Lab Result",
    fhir: "FHIR Resource",
    device: "Device Data",
    claims: "Claims Data",
    synthetic: "Synthetic Data"
  };

  const typeLabel = typeLabels[evidence.source] || evidence.source;
  
  if (step.label) {
    return `${typeLabel}: ${step.label}`;
  }
  
  return `${typeLabel} (${evidence.id})`;
}

/**
 * Validate an evidence chain for integrity
 * @param chain - Evidence chain to validate
 * @returns true if valid
 */
export function validateChain(chain: EvidenceChain): boolean {
  // Must have at least the root node
  if (chain.chain.length === 0) {
    return false;
  }

  // First step must be the root
  if (chain.chain[0].nodeId !== chain.rootNodeId) {
    return false;
  }

  // First step must have "root" relationship
  if (chain.chain[0].relationship !== "root") {
    return false;
  }

  // All steps must have nodeIds
  for (const step of chain.chain) {
    if (!step.nodeId) {
      return false;
    }
  }

  // Check for duplicates
  const nodeIds = chain.chain.map(s => s.nodeId);
  const uniqueIds = new Set(nodeIds);
  if (uniqueIds.size !== nodeIds.length) {
    return false;
  }

  return true;
}

/**
 * Merge multiple evidence chains into one
 * @param chains - Array of evidence chains
 * @returns Merged evidence chain
 */
export function mergeChains(chains: EvidenceChain[]): EvidenceChain {
  if (chains.length === 0) {
    return {
      rootNodeId: "",
      chain: [],
      depth: 0
    };
  }

  if (chains.length === 1) {
    return chains[0];
  }

  const mergedSteps = new Map<string, EvidenceChainStep>();
  
  for (const chain of chains) {
    for (const step of chain.chain) {
      if (!mergedSteps.has(step.nodeId)) {
        mergedSteps.set(step.nodeId, step);
      } else {
        // Merge evidence
        const existing = mergedSteps.get(step.nodeId)!;
        const mergedEvidence = [...existing.evidence];
        for (const ev of step.evidence) {
          if (!mergedEvidence.some(e => e.id === ev.id && e.source === ev.source)) {
            mergedEvidence.push(ev);
          }
        }
        mergedSteps.set(step.nodeId, { ...existing, evidence: mergedEvidence });
      }
    }
  }

  return {
    rootNodeId: chains[0].rootNodeId,
    rootLabel: chains[0].rootLabel,
    chain: Array.from(mergedSteps.values()),
    depth: Math.max(...chains.map(c => c.depth))
  };
}

/**
 * Get the direct evidence for a node (no traversal)
 * @param nodeId - Node ID
 * @param graph - Graph data
 * @returns Array of evidence refs
 */
export function getDirectEvidence(
  nodeId: string,
  graph: GraphData
): EvidenceRef[] {
  const node = graph.nodes.find(n => n.id === nodeId);
  return node?.evidence || [];
}

/**
 * Find all nodes that provide evidence for a given artifact
 * @param artifactId - Artifact ID
 * @param artifactSource - Artifact source type
 * @param graph - Graph data
 * @returns Array of node IDs
 */
export function findNodesWithEvidence(
  artifactId: string,
  artifactSource: EvidenceRef["source"],
  graph: GraphData
): string[] {
  return graph.nodes
    .filter(n => 
      n.evidence?.some(e => e.id === artifactId && e.source === artifactSource)
    )
    .map(n => n.id);
}
