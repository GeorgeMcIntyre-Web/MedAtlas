/**
 * Cross-Modal Matcher
 * 
 * Implements matching logic to find alignments across different medical data modalities.
 * Supports matching by location, value, temporal proximity, and semantic similarity.
 */

import type {
  CrossModalAlignment,
  AlignmentMatch,
  GraphNode,
  GraphData,
  ModalityData,
  Location
} from "./alignment-types.js";
import type { EvidenceRef } from "@medatlas/schemas/types";

/**
 * Find all cross-modal alignments for a given finding
 * @param findingId - The ID of the finding to align
 * @param graph - The graph data containing nodes and edges
 * @returns Array of cross-modal alignments
 */
export function findAlignments(
  findingId: string,
  graph: GraphData
): CrossModalAlignment[] {
  const findingNode = graph.nodes.find(n => n.id === findingId);
  if (!findingNode) {
    return [];
  }

  // Find all edges connected to this finding
  const connectedEdges = graph.edges.filter(
    e => e.source === findingId || e.target === findingId
  );

  // Get connected node IDs
  const connectedNodeIds = new Set(
    connectedEdges.map(e => 
      e.source === findingId ? e.target : e.source
    )
  );

  // Get connected nodes
  const connectedNodes = graph.nodes.filter(n => connectedNodeIds.has(n.id));

  // Build modalities object
  const modalities = buildModalitiesFromNodes(connectedNodes);

  // Calculate confidence based on number of modalities matched
  const modalityCount = Object.keys(modalities).filter(
    k => modalities[k as keyof ModalityData] !== undefined
  ).length;
  const confidence = Math.min(modalityCount / 3, 1);

  // Gather all evidence
  const evidence: EvidenceRef[] = [
    ...(findingNode.evidence || []),
    ...connectedNodes.flatMap(n => n.evidence || [])
  ];

  if (modalityCount === 0) {
    return [];
  }

  return [
    {
      findingId,
      findingLabel: findingNode.label,
      modalities,
      confidence,
      evidence,
      computedAt: new Date().toISOString()
    }
  ];
}

/**
 * Build modalities data from connected graph nodes
 */
function buildModalitiesFromNodes(nodes: GraphNode[]): ModalityData {
  const modalities: ModalityData = {};

  for (const node of nodes) {
    const nodeType = node.type.toLowerCase();
    const props = node.properties || {};

    if (nodeType === "imaging" || nodeType === "study" || nodeType === "dicomimage") {
      modalities.imaging = {
        nodeId: node.id,
        location: extractLocation(props),
        description: node.label
      };
    } else if (nodeType === "note" || nodeType === "text" || nodeType === "observation") {
      modalities.text = {
        nodeId: node.id,
        excerpt: (props.excerpt as string) || (props.text as string) || node.label,
        documentType: (props.documentType as string) || nodeType
      };
    } else if (nodeType === "lab" || nodeType === "labresult") {
      modalities.lab = {
        nodeId: node.id,
        value: (props.value as number) || 0,
        unit: (props.unit as string) || "",
        referenceRange: props.referenceRange as { low?: number; high?: number },
        isAbnormal: (props.isAbnormal as boolean) || false
      };
    }
  }

  return modalities;
}

/**
 * Extract location information from node properties
 */
function extractLocation(props: Record<string, unknown>): Location | undefined {
  if (!props.anatomy && !props.coordinates && !props.imageRef) {
    return undefined;
  }

  return {
    anatomy: props.anatomy as string | undefined,
    imageRef: props.imageRef as string | undefined,
    sliceIndex: props.sliceIndex as number | undefined,
    coordinates: props.coordinates as [number, number, number] | undefined
  };
}

/**
 * Match two nodes by anatomical location
 * @param imagingNode - Node with imaging data
 * @param textNode - Node with text data
 * @returns true if they match by location
 */
export function matchByLocation(
  imagingNode: GraphNode,
  textNode: GraphNode
): boolean {
  const imagingProps = imagingNode.properties || {};
  const textProps = textNode.properties || {};

  // Match by anatomy field
  const imagingAnatomy = (imagingProps.anatomy as string)?.toLowerCase();
  const textAnatomy = (textProps.anatomy as string)?.toLowerCase();

  if (imagingAnatomy && textAnatomy && imagingAnatomy === textAnatomy) {
    return true;
  }

  // Match by searching for anatomy terms in text
  if (imagingAnatomy) {
    const textContent = (textProps.text as string)?.toLowerCase() || 
                       textNode.label.toLowerCase();
    if (textContent.includes(imagingAnatomy)) {
      return true;
    }
  }

  return false;
}

/**
 * Match lab values to findings based on correlation
 * @param labNode - Node with lab data
 * @param findingNode - Node with finding data
 * @returns true if they correlate
 */
export function matchByValue(
  labNode: GraphNode,
  findingNode: GraphNode
): boolean {
  const labProps = labNode.properties || {};
  const findingProps = findingNode.properties || {};

  // Check if lab value is abnormal
  const isAbnormal = labProps.isAbnormal as boolean;
  if (!isAbnormal) {
    return false;
  }

  // Common correlations
  const labName = labNode.label.toLowerCase();
  const findingLabel = findingNode.label.toLowerCase();

  // CRP/inflammation correlation
  if (
    (labName.includes("crp") || labName.includes("c-reactive protein")) &&
    findingLabel.includes("inflamm")
  ) {
    return true;
  }

  // WBC/infection correlation
  if (
    (labName.includes("wbc") || labName.includes("white blood cell")) &&
    (findingLabel.includes("infect") || findingLabel.includes("sepsis"))
  ) {
    return true;
  }

  // Troponin/cardiac correlation
  if (
    labName.includes("troponin") &&
    (findingLabel.includes("cardiac") || findingLabel.includes("heart") || findingLabel.includes("infarct"))
  ) {
    return true;
  }

  // Check if finding mentions the lab marker
  if (findingLabel.includes(labName) || 
      (findingProps.relatedLabs as string[])?.includes(labNode.id)) {
    return true;
  }

  return false;
}

/**
 * Match nodes by temporal proximity
 * @param node1 - First node
 * @param node2 - Second node
 * @param thresholdMs - Time threshold in milliseconds
 * @returns true if within threshold
 */
export function matchByTemporalProximity(
  node1: GraphNode,
  node2: GraphNode,
  thresholdMs: number = 24 * 60 * 60 * 1000 // 24 hours default
): boolean {
  if (!node1.timestamp || !node2.timestamp) {
    return false;
  }

  const time1 = new Date(node1.timestamp).getTime();
  const time2 = new Date(node2.timestamp).getTime();

  return Math.abs(time1 - time2) <= thresholdMs;
}

/**
 * Find all alignment matches between nodes in a graph
 * @param graph - The graph data
 * @returns Array of alignment matches
 */
export function findAllMatches(graph: GraphData): AlignmentMatch[] {
  const matches: AlignmentMatch[] = [];

  // Get nodes by type
  const imagingNodes = graph.nodes.filter(n => 
    ["imaging", "study", "dicomimage"].includes(n.type.toLowerCase())
  );
  const textNodes = graph.nodes.filter(n => 
    ["note", "text", "observation"].includes(n.type.toLowerCase())
  );
  const labNodes = graph.nodes.filter(n => 
    ["lab", "labresult"].includes(n.type.toLowerCase())
  );
  const findingNodes = graph.nodes.filter(n => 
    n.type.toLowerCase() === "finding"
  );

  // Match imaging to text by location
  for (const imaging of imagingNodes) {
    for (const text of textNodes) {
      if (matchByLocation(imaging, text)) {
        matches.push({
          node1Id: imaging.id,
          node2Id: text.id,
          matchType: "location",
          confidence: 0.8,
          reason: "Anatomical location match"
        });
      }
      if (matchByTemporalProximity(imaging, text)) {
        matches.push({
          node1Id: imaging.id,
          node2Id: text.id,
          matchType: "temporal",
          confidence: 0.6,
          reason: "Within 24 hours"
        });
      }
    }
  }

  // Match labs to findings by value
  for (const lab of labNodes) {
    for (const finding of findingNodes) {
      if (matchByValue(lab, finding)) {
        matches.push({
          node1Id: lab.id,
          node2Id: finding.id,
          matchType: "value",
          confidence: 0.75,
          reason: "Lab value correlates with finding"
        });
      }
    }
  }

  return matches;
}

/**
 * Get alignment confidence based on multiple match types
 * @param matches - Array of matches for this alignment
 * @returns Confidence score (0-1)
 */
export function calculateAlignmentConfidence(matches: AlignmentMatch[]): number {
  if (matches.length === 0) {
    return 0;
  }

  // Weight by match type
  const weights: Record<string, number> = {
    location: 0.35,
    value: 0.30,
    temporal: 0.20,
    semantic: 0.15
  };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const match of matches) {
    const weight = weights[match.matchType] || 0.1;
    totalWeight += weight;
    weightedSum += match.confidence * weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
