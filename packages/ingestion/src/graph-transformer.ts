import type { GraphNode, GraphEdge, EvidenceRef, NodeType, EdgeType } from "@medatlas/graph/types";

const now = () => new Date().toISOString();

export function createNode(
  id: string,
  type: NodeType,
  label: string,
  properties: Record<string, unknown>,
  evidence: EvidenceRef[] = [],
  timestamp?: string
): GraphNode {
  return {
    id,
    type,
    label,
    properties,
    evidence,
    timestamp,
    createdAt: now()
  };
}

export function createEdge(
  id: string,
  source: string,
  target: string,
  type: EdgeType,
  properties: Record<string, unknown> = {},
  evidence: EvidenceRef[] = []
): GraphEdge {
  return {
    id,
    source,
    target,
    type,
    label: type.replace("-", " "),
    properties,
    evidence,
    createdAt: now()
  };
}

export function ensureEvidence(evidence?: EvidenceRef[]): EvidenceRef[] {
  return Array.isArray(evidence) ? evidence : [];
}
