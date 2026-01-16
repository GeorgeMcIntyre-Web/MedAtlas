import type { EvidenceRef } from "@medatlas/schemas/types";
import type { GraphEdge, EdgeType } from "./types";

const now = () => new Date().toISOString();

function createEdge(
  id: string,
  source: string,
  target: string,
  type: EdgeType,
  label: string,
  properties: Record<string, unknown> = {},
  evidence: EvidenceRef[] = []
): GraphEdge {
  return {
    id,
    source,
    target,
    type,
    label,
    properties,
    evidence,
    createdAt: now(),
  };
}

export const EdgeFactory = {
  observedIn(id: string, source: string, target: string, properties: Record<string, unknown> = {}, evidence: EvidenceRef[] = []) {
    return createEdge(id, source, target, "observed-in", "observed in", properties, evidence);
  },
  derivedFrom(id: string, source: string, target: string, properties: Record<string, unknown> = {}, evidence: EvidenceRef[] = []) {
    return createEdge(id, source, target, "derived-from", "derived from", properties, evidence);
  },
  matches(id: string, source: string, target: string, properties: Record<string, unknown> = {}, evidence: EvidenceRef[] = []) {
    return createEdge(id, source, target, "matches", "matches", properties, evidence);
  },
  contradicts(id: string, source: string, target: string, properties: Record<string, unknown> = {}, evidence: EvidenceRef[] = []) {
    return createEdge(id, source, target, "contradicts", "contradicts", properties, evidence);
  },
  temporalNear(id: string, source: string, target: string, properties: Record<string, unknown> = {}, evidence: EvidenceRef[] = []) {
    return createEdge(id, source, target, "temporal-near", "temporal near", properties, evidence);
  },
  sameAs(id: string, source: string, target: string, properties: Record<string, unknown> = {}, evidence: EvidenceRef[] = []) {
    return createEdge(id, source, target, "same-as", "same as", properties, evidence);
  },
  hasFinding(id: string, source: string, target: string, properties: Record<string, unknown> = {}, evidence: EvidenceRef[] = []) {
    return createEdge(id, source, target, "has-finding", "has finding", properties, evidence);
  },
  hasEvidence(id: string, source: string, target: string, properties: Record<string, unknown> = {}, evidence: EvidenceRef[] = []) {
    return createEdge(id, source, target, "has-evidence", "has evidence", properties, evidence);
  },
  belongsTo(id: string, source: string, target: string, properties: Record<string, unknown> = {}, evidence: EvidenceRef[] = []) {
    return createEdge(id, source, target, "belongs-to", "belongs to", properties, evidence);
  },
  partOf(id: string, source: string, target: string, properties: Record<string, unknown> = {}, evidence: EvidenceRef[] = []) {
    return createEdge(id, source, target, "part-of", "part of", properties, evidence);
  },
  references(id: string, source: string, target: string, properties: Record<string, unknown> = {}, evidence: EvidenceRef[] = []) {
    return createEdge(id, source, target, "references", "references", properties, evidence);
  },
};
