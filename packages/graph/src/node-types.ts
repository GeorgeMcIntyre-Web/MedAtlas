import type { EvidenceRef } from "@medatlas/schemas/types";
import type { GraphNode } from "./types";

const now = () => new Date().toISOString();

export const NodeFactory = {
  patient(id: string, label: string, properties: Record<string, unknown>, evidence: EvidenceRef[] = []): GraphNode {
    return {
      id,
      type: "patient",
      label,
      properties,
      evidence,
      createdAt: now(),
    };
  },

  encounter(
    id: string,
    label: string,
    patientId: string,
    timestamp: string,
    properties: Record<string, unknown> = {},
    evidence: EvidenceRef[] = []
  ): GraphNode {
    return {
      id,
      type: "encounter",
      label,
      properties: { patientId, ...properties },
      evidence,
      timestamp,
      createdAt: now(),
    };
  },

  observation(
    id: string,
    label: string,
    patientId: string,
    timestamp: string,
    properties: Record<string, unknown> = {},
    evidence: EvidenceRef[] = []
  ): GraphNode {
    return {
      id,
      type: "observation",
      label,
      properties: { patientId, ...properties },
      evidence,
      timestamp,
      createdAt: now(),
    };
  },

  study(
    id: string,
    label: string,
    patientId: string,
    timestamp: string,
    properties: Record<string, unknown> = {},
    evidence: EvidenceRef[] = []
  ): GraphNode {
    return {
      id,
      type: "study",
      label,
      properties: { patientId, ...properties },
      evidence,
      timestamp,
      createdAt: now(),
    };
  },

  image(
    id: string,
    label: string,
    patientId: string,
    timestamp: string,
    properties: Record<string, unknown> = {},
    evidence: EvidenceRef[] = []
  ): GraphNode {
    return {
      id,
      type: "image",
      label,
      properties: { patientId, ...properties },
      evidence,
      timestamp,
      createdAt: now(),
    };
  },

  note(
    id: string,
    label: string,
    patientId: string,
    timestamp: string,
    properties: Record<string, unknown> = {},
    evidence: EvidenceRef[] = []
  ): GraphNode {
    return {
      id,
      type: "note",
      label,
      properties: { patientId, ...properties },
      evidence,
      timestamp,
      createdAt: now(),
    };
  },

  lab(
    id: string,
    label: string,
    patientId: string,
    timestamp: string,
    value: number,
    unit: string,
    properties: Record<string, unknown> = {},
    evidence: EvidenceRef[] = []
  ): GraphNode {
    return {
      id,
      type: "lab",
      label,
      properties: { patientId, value, unit, ...properties },
      evidence,
      timestamp,
      createdAt: now(),
    };
  },

  medication(
    id: string,
    label: string,
    patientId: string,
    timestamp: string,
    properties: Record<string, unknown> = {},
    evidence: EvidenceRef[] = []
  ): GraphNode {
    return {
      id,
      type: "medication",
      label,
      properties: { patientId, ...properties },
      evidence,
      timestamp,
      createdAt: now(),
    };
  },

  condition(
    id: string,
    label: string,
    patientId: string,
    timestamp: string,
    properties: Record<string, unknown> = {},
    evidence: EvidenceRef[] = []
  ): GraphNode {
    return {
      id,
      type: "condition",
      label,
      properties: { patientId, ...properties },
      evidence,
      timestamp,
      createdAt: now(),
    };
  },

  finding(
    id: string,
    label: string,
    patientId: string,
    timestamp: string,
    confidence: number,
    properties: Record<string, unknown> = {},
    evidence: EvidenceRef[] = []
  ): GraphNode {
    return {
      id,
      type: "finding",
      label,
      properties: { patientId, probability: confidence, ...properties },
      evidence,
      timestamp,
      createdAt: now(),
    };
  },
};
