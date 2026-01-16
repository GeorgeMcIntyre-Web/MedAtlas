/**
 * Alignment API Handlers
 * 
 * Request handlers for alignment-related endpoints.
 * Uses mock data until Agent 1's graph API is available.
 */

import type { 
  AlignmentResponse, 
  EvidenceChainResponse, 
  CompareResponse,
  CrossModalAlignment,
  EvidenceChain,
  SourceArtifact
} from "./types.js";

/**
 * Mock graph data for demo purposes
 * This will be replaced with calls to Agent 1's graph API
 */
const MOCK_GRAPH = {
  nodes: [
    {
      id: "finding-001",
      type: "finding",
      label: "Right lower lobe pulmonary nodule",
      timestamp: "2025-01-15T10:30:00Z",
      properties: {
        probability: 0.85,
        location: { anatomy: "Right lower lobe" }
      },
      evidence: [
        { source: "dicom" as const, id: "ct-series-001" }
      ]
    },
    {
      id: "imaging-001",
      type: "imaging",
      label: "CT Chest with contrast",
      timestamp: "2025-01-15T09:00:00Z",
      properties: {
        anatomy: "Right lower lobe",
        modality: "CT"
      },
      evidence: [
        { source: "dicom" as const, id: "ct-series-001" }
      ]
    },
    {
      id: "note-001",
      type: "note",
      label: "Radiology Report",
      timestamp: "2025-01-15T11:00:00Z",
      properties: {
        excerpt: "CT chest demonstrates a 1.2cm nodule in the right lower lobe, requiring follow-up.",
        documentType: "Radiology Report"
      },
      evidence: [
        { source: "note" as const, id: "radiology-report-001" }
      ]
    },
    {
      id: "lab-001",
      type: "lab",
      label: "C-Reactive Protein",
      timestamp: "2025-01-15T08:00:00Z",
      properties: {
        value: 45.2,
        unit: "mg/L",
        referenceRange: { low: 0, high: 10 },
        isAbnormal: true
      },
      evidence: [
        { source: "lab" as const, id: "lab-crp-001" }
      ]
    }
  ],
  edges: [
    { id: "e1", source: "finding-001", target: "imaging-001", type: "derived_from" },
    { id: "e2", source: "finding-001", target: "note-001", type: "matches" },
    { id: "e3", source: "finding-001", target: "lab-001", type: "correlates_with" }
  ]
};

/**
 * Get cross-modal alignments for a finding
 */
export function handleGetAlignment(findingId: string): AlignmentResponse {
  const findingNode = MOCK_GRAPH.nodes.find(n => n.id === findingId);
  
  if (!findingNode) {
    return { alignments: [], totalCount: 0 };
  }

  // Find connected nodes
  const connectedEdges = MOCK_GRAPH.edges.filter(
    e => e.source === findingId || e.target === findingId
  );
  
  const connectedNodeIds = new Set(
    connectedEdges.map(e => e.source === findingId ? e.target : e.source)
  );
  
  const connectedNodes = MOCK_GRAPH.nodes.filter(n => connectedNodeIds.has(n.id));

  // Build alignment
  const alignment: CrossModalAlignment = {
    findingId,
    findingLabel: findingNode.label,
    modalities: {},
    confidence: 0.85,
    evidence: [...(findingNode.evidence || [])],
    computedAt: new Date().toISOString()
  };

  // Map connected nodes to modalities
  for (const node of connectedNodes) {
    const nodeType = node.type.toLowerCase();
    const props = node.properties || {};

    if (nodeType === "imaging") {
      alignment.modalities.imaging = {
        nodeId: node.id,
        location: props.location as { anatomy?: string } | undefined,
        description: node.label
      };
    } else if (nodeType === "note") {
      alignment.modalities.text = {
        nodeId: node.id,
        excerpt: (props.excerpt as string) || node.label,
        documentType: props.documentType as string | undefined
      };
    } else if (nodeType === "lab") {
      alignment.modalities.lab = {
        nodeId: node.id,
        value: (props.value as number) || 0,
        unit: (props.unit as string) || "",
        referenceRange: props.referenceRange as { low?: number; high?: number },
        isAbnormal: (props.isAbnormal as boolean) || false
      };
    }

    // Collect evidence
    if (node.evidence) {
      alignment.evidence.push(...node.evidence);
    }
  }

  // Calculate confidence based on modality coverage
  const modalityCount = Object.keys(alignment.modalities).length;
  alignment.confidence = Math.min(0.5 + modalityCount * 0.15, 0.95);

  return {
    alignments: [alignment],
    totalCount: 1
  };
}

/**
 * Get evidence chain for a node
 */
export function handleGetEvidenceChain(
  nodeId: string, 
  maxDepth: number = 5
): EvidenceChainResponse {
  const rootNode = MOCK_GRAPH.nodes.find(n => n.id === nodeId);
  
  if (!rootNode) {
    return {
      chain: { rootNodeId: nodeId, chain: [], depth: 0 },
      sourceArtifacts: []
    };
  }

  // Build chain by traversing graph
  const visited = new Set<string>();
  const chain: EvidenceChain = {
    rootNodeId: nodeId,
    rootLabel: rootNode.label,
    chain: [],
    depth: 0
  };

  // BFS traversal
  const queue: Array<{ id: string; depth: number }> = [{ id: nodeId, depth: 0 }];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (visited.has(current.id) || current.depth > maxDepth) {
      continue;
    }
    
    visited.add(current.id);
    
    const node = MOCK_GRAPH.nodes.find(n => n.id === current.id);
    if (!node) continue;

    // Determine relationship (root for first node)
    const incomingEdge = MOCK_GRAPH.edges.find(
      e => e.target === current.id && visited.has(e.source)
    );
    const relationship = current.depth === 0 ? "root" : (incomingEdge?.type || "related");

    chain.chain.push({
      nodeId: node.id,
      relationship,
      label: node.label,
      nodeType: node.type,
      evidence: node.evidence || []
    });

    chain.depth = Math.max(chain.depth, current.depth);

    // Find connected nodes
    const edges = MOCK_GRAPH.edges.filter(
      e => e.source === current.id || e.target === current.id
    );
    
    for (const edge of edges) {
      const neighborId = edge.source === current.id ? edge.target : edge.source;
      if (!visited.has(neighborId)) {
        queue.push({ id: neighborId, depth: current.depth + 1 });
      }
    }
  }

  // Extract source artifacts
  const artifactMap = new Map<string, SourceArtifact>();
  
  for (const step of chain.chain) {
    for (const ev of step.evidence) {
      const key = `${ev.source}-${ev.id}`;
      if (!artifactMap.has(key)) {
        artifactMap.set(key, {
          id: ev.id,
          type: ev.source,
          title: `${ev.source.charAt(0).toUpperCase() + ev.source.slice(1)}: ${step.label || ev.id}`,
          uri: ev.uri,
          capturedAt: ev.capturedAt
        });
      }
    }
  }

  return {
    chain,
    sourceArtifacts: Array.from(artifactMap.values())
  };
}

/**
 * Compare two nodes for alignment
 */
export function handleCompareNodes(
  node1Id: string, 
  node2Id: string
): CompareResponse {
  const node1 = MOCK_GRAPH.nodes.find(n => n.id === node1Id);
  const node2 = MOCK_GRAPH.nodes.find(n => n.id === node2Id);

  const response: CompareResponse = {
    node1Id,
    node2Id,
    hasAlignment: false,
    sharedEvidence: []
  };

  if (!node1 || !node2) {
    return response;
  }

  // Check for direct edge between nodes
  const directEdge = MOCK_GRAPH.edges.find(
    e => (e.source === node1Id && e.target === node2Id) ||
         (e.source === node2Id && e.target === node1Id)
  );

  if (directEdge) {
    response.hasAlignment = true;
    response.alignmentType = directEdge.type;
    response.confidence = 0.9;
  }

  // Find shared evidence
  const evidence1 = new Set(
    (node1.evidence || []).map(e => `${e.source}:${e.id}`)
  );
  
  for (const ev of node2.evidence || []) {
    const key = `${ev.source}:${ev.id}`;
    if (evidence1.has(key)) {
      response.sharedEvidence.push(ev);
      response.hasAlignment = true;
      response.confidence = response.confidence || 0.7;
    }
  }

  return response;
}

/**
 * List all available findings for alignment
 */
export function handleListFindings(): { findings: Array<{ id: string; label: string }> } {
  const findings = MOCK_GRAPH.nodes
    .filter(n => n.type.toLowerCase() === "finding")
    .map(n => ({ id: n.id, label: n.label }));
  
  return { findings };
}
