import type { GraphData, GraphNode, AlignmentMatch, CrossModalAlignment, ModalityData } from "./alignment-types";

/**
 * Find cross-modal alignments for a finding node
 */
export function findAlignments(findingNode: GraphNode, graphData: GraphData): CrossModalAlignment {
  const modalities: ModalityData = {};
  const matches: AlignmentMatch[] = [];

  if (findingNode.properties.anatomy) {
    modalities.imaging = {
      nodeId: findingNode.id,
      location: { anatomy: findingNode.properties.anatomy as string },
      description: findingNode.label
    };
  }

  const labMatches = matchByValue(findingNode, graphData.nodes.filter(n => n.type === "lab"));
  if (labMatches.length > 0) {
    const bestLab = labMatches[0];
    const labNode = graphData.nodes.find(n => n.id === bestLab.node2Id)!;
    modalities.lab = {
      nodeId: labNode.id,
      value: labNode.properties.value as number,
      unit: labNode.properties.unit as string,
      isAbnormal: labNode.properties.isAbnormal as boolean
    };
    matches.push(bestLab);
  }

  const noteMatches = matchByLocation(findingNode, graphData.nodes.filter(n => n.type === "note"));
  if (noteMatches.length > 0) {
    const bestNote = noteMatches[0];
    const noteNode = graphData.nodes.find(n => n.id === bestNote.node2Id)!;
    modalities.text = {
      nodeId: noteNode.id,
      excerpt: (noteNode.properties.text as string)?.slice(0, 200) ?? "",
      documentType: noteNode.properties.noteType as string
    };
    matches.push(bestNote);
  }

  const confidence = matches.length > 0
    ? matches.reduce((sum, match) => sum + match.confidence, 0) / matches.length
    : 0.5;

  return {
    findingId: findingNode.id,
    findingLabel: findingNode.label,
    modalities,
    confidence,
    evidence: findingNode.evidence,
    computedAt: new Date().toISOString()
  };
}

/**
 * Match nodes by anatomical location
 */
export function matchByLocation(sourceNode: GraphNode, candidates: GraphNode[]): AlignmentMatch[] {
  const sourceAnatomy = (sourceNode.properties.anatomy as string)?.toLowerCase();
  if (!sourceAnatomy) return [];

  return candidates
    .filter(node => {
      const text = (node.properties.text as string)?.toLowerCase() ?? "";
      return text.includes(sourceAnatomy);
    })
    .map(node => ({
      node1Id: sourceNode.id,
      node2Id: node.id,
      matchType: "location" as const,
      confidence: 0.7,
      reason: `Location match: ${sourceAnatomy}`
    }));
}

/**
 * Match nodes by value correlation (e.g., elevated CRP to inflammation)
 */
export function matchByValue(findingNode: GraphNode, labNodes: GraphNode[]): AlignmentMatch[] {
  const matches: AlignmentMatch[] = [];
  const findingLabel = findingNode.label.toLowerCase();

  const correlations: Record<string, string[]> = {
    inflammation: ["crp", "esr", "procalcitonin"],
    cardiac: ["troponin", "bnp", "ck-mb"],
    infection: ["wbc", "procalcitonin", "lactate"],
    nodule: ["crp"],
    coronary: ["troponin", "ldl", "cholesterol"]
  };

  for (const [condition, labs] of Object.entries(correlations)) {
    if (findingLabel.includes(condition)) {
      for (const labNode of labNodes) {
        const labName = labNode.label.toLowerCase();
        if (labs.some(lab => labName.includes(lab)) && labNode.properties.isAbnormal) {
          matches.push({
            node1Id: findingNode.id,
            node2Id: labNode.id,
            matchType: "value",
            confidence: 0.75,
            reason: `${condition} correlates with abnormal ${labNode.label}`
          });
        }
      }
    }
  }

  return matches;
}

/**
 * Match nodes by temporal proximity
 */
export function matchByTemporalProximity(
  sourceNode: GraphNode,
  candidates: GraphNode[],
  windowMs: number = 3600000
): AlignmentMatch[] {
  if (!sourceNode.timestamp) return [];
  const sourceTime = new Date(sourceNode.timestamp).getTime();

  return candidates
    .filter(node => {
      if (!node.timestamp) return false;
      const nodeTime = new Date(node.timestamp).getTime();
      return Math.abs(nodeTime - sourceTime) <= windowMs;
    })
    .map(node => ({
      node1Id: sourceNode.id,
      node2Id: node.id,
      matchType: "temporal" as const,
      confidence: 0.6,
      reason: `Within ${windowMs / 60000} minutes`
    }));
}
