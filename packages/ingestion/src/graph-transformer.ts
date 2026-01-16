/**
 * Graph Transformation Logic
 * 
 * Common utilities for transforming data into graph nodes and edges.
 */

import type { EvidenceRef } from "@medatlas/schemas/types";
import type {
  GraphNode,
  GraphEdge,
  NodeType,
  EdgeType,
  PatientDemographics,
  EncounterDetails,
  LabDetails,
  VitalDetails,
  StudyDetails,
  FindingDetails,
  MedicationDetails,
  ConditionDetails,
  NoteDetails,
  ProcedureDetails,
} from "./graph-types.js";

/**
 * Generate a unique ID for a node
 */
export function generateNodeId(type: NodeType, caseId: string, entityId: string): string {
  return `${type}-${caseId}-${entityId}`;
}

/**
 * Generate a unique ID for an edge
 */
export function generateEdgeId(sourceId: string, targetId: string, type: EdgeType): string {
  return `edge-${sourceId}-${targetId}-${type}`;
}

/**
 * Get current ISO timestamp
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Create a patient node
 */
export function createPatientNode(
  caseId: string,
  patientId: string,
  demographics: PatientDemographics,
  evidence: EvidenceRef[] = []
): GraphNode {
  return {
    id: generateNodeId("patient", caseId, patientId),
    type: "patient",
    label: `Patient ${patientId}`,
    properties: {
      patientId,
      ...demographics,
    },
    evidence,
    createdAt: now(),
  };
}

/**
 * Create an encounter node
 */
export function createEncounterNode(
  caseId: string,
  encounterId: string,
  details: EncounterDetails,
  timestamp: string,
  evidence: EvidenceRef[] = []
): GraphNode {
  return {
    id: generateNodeId("encounter", caseId, encounterId),
    type: "encounter",
    label: `${details.type} Visit`,
    properties: {
      encounterId,
      ...details,
    },
    evidence,
    timestamp,
    createdAt: now(),
  };
}

/**
 * Create a lab result node
 */
export function createLabNode(
  caseId: string,
  labId: string,
  details: LabDetails,
  timestamp?: string,
  evidence: EvidenceRef[] = []
): GraphNode {
  return {
    id: generateNodeId("lab", caseId, labId),
    type: "lab",
    label: details.name,
    properties: {
      labId,
      ...details,
    },
    evidence,
    timestamp,
    createdAt: now(),
  };
}

/**
 * Create a vital sign node
 */
export function createVitalNode(
  caseId: string,
  vitalId: string,
  details: VitalDetails,
  timestamp?: string,
  evidence: EvidenceRef[] = []
): GraphNode {
  return {
    id: generateNodeId("vital", caseId, vitalId),
    type: "vital",
    label: details.name,
    properties: {
      vitalId,
      ...details,
    },
    evidence,
    timestamp,
    createdAt: now(),
  };
}

/**
 * Create an observation node
 */
export function createObservationNode(
  caseId: string,
  observationId: string,
  observationType: string,
  value: unknown,
  text?: string,
  timestamp?: string,
  evidence: EvidenceRef[] = []
): GraphNode {
  return {
    id: generateNodeId("observation", caseId, observationId),
    type: "observation",
    label: observationType,
    properties: {
      observationId,
      observationType,
      value,
      text,
    },
    evidence,
    timestamp,
    createdAt: now(),
  };
}

/**
 * Create an imaging study node
 */
export function createStudyNode(
  caseId: string,
  studyId: string,
  details: StudyDetails,
  timestamp?: string,
  evidence: EvidenceRef[] = []
): GraphNode {
  return {
    id: generateNodeId("study", caseId, studyId),
    type: "study",
    label: `${details.modality} ${details.bodyPart || "Study"}`,
    properties: {
      studyId,
      ...details,
    },
    evidence,
    timestamp,
    createdAt: now(),
  };
}

/**
 * Create a finding node
 */
export function createFindingNode(
  caseId: string,
  findingId: string,
  details: FindingDetails,
  timestamp?: string,
  evidence: EvidenceRef[] = []
): GraphNode {
  return {
    id: generateNodeId("finding", caseId, findingId),
    type: "finding",
    label: details.description,
    properties: {
      findingId,
      ...details,
    },
    evidence,
    timestamp,
    createdAt: now(),
  };
}

/**
 * Create a medication node
 */
export function createMedicationNode(
  caseId: string,
  medicationId: string,
  details: MedicationDetails,
  timestamp?: string,
  evidence: EvidenceRef[] = []
): GraphNode {
  return {
    id: generateNodeId("medication", caseId, medicationId),
    type: "medication",
    label: details.name,
    properties: {
      medicationId,
      ...details,
    },
    evidence,
    timestamp,
    createdAt: now(),
  };
}

/**
 * Create a condition node
 */
export function createConditionNode(
  caseId: string,
  conditionId: string,
  details: ConditionDetails,
  timestamp?: string,
  evidence: EvidenceRef[] = []
): GraphNode {
  return {
    id: generateNodeId("condition", caseId, conditionId),
    type: "condition",
    label: details.name,
    properties: {
      conditionId,
      ...details,
    },
    evidence,
    timestamp,
    createdAt: now(),
  };
}

/**
 * Create a clinical note node
 */
export function createNoteNode(
  caseId: string,
  noteId: string,
  details: NoteDetails,
  timestamp?: string,
  evidence: EvidenceRef[] = []
): GraphNode {
  return {
    id: generateNodeId("note", caseId, noteId),
    type: "note",
    label: `${details.type} Note`,
    properties: {
      noteId,
      ...details,
      // Store excerpt for quick display, full text in properties
      excerpt: details.text.substring(0, 200) + (details.text.length > 200 ? "..." : ""),
    },
    evidence,
    timestamp,
    createdAt: now(),
  };
}

/**
 * Create a procedure node
 */
export function createProcedureNode(
  caseId: string,
  procedureId: string,
  details: ProcedureDetails,
  timestamp?: string,
  evidence: EvidenceRef[] = []
): GraphNode {
  return {
    id: generateNodeId("procedure", caseId, procedureId),
    type: "procedure",
    label: details.name,
    properties: {
      procedureId,
      ...details,
    },
    evidence,
    timestamp,
    createdAt: now(),
  };
}

/**
 * Create an edge between two nodes
 */
export function createEdge(
  sourceId: string,
  targetId: string,
  type: EdgeType,
  label: string,
  properties: Record<string, unknown> = {},
  evidence: EvidenceRef[] = []
): GraphEdge {
  return {
    id: generateEdgeId(sourceId, targetId, type),
    source: sourceId,
    target: targetId,
    type,
    label,
    properties,
    evidence,
    createdAt: now(),
  };
}

/**
 * Create an "observed-in" edge (entity observed in encounter)
 */
export function createObservedInEdge(
  entityNodeId: string,
  encounterNodeId: string,
  evidence: EvidenceRef[] = []
): GraphEdge {
  return createEdge(
    entityNodeId,
    encounterNodeId,
    "observed-in",
    "observed in",
    {},
    evidence
  );
}

/**
 * Create a "derived-from" edge (finding derived from study)
 */
export function createDerivedFromEdge(
  findingNodeId: string,
  studyNodeId: string,
  evidence: EvidenceRef[] = []
): GraphEdge {
  return createEdge(
    findingNodeId,
    studyNodeId,
    "derived-from",
    "derived from",
    {},
    evidence
  );
}

/**
 * Create a "matches" edge (cross-modal alignment)
 */
export function createMatchesEdge(
  node1Id: string,
  node2Id: string,
  confidence?: number,
  evidence: EvidenceRef[] = []
): GraphEdge {
  return createEdge(
    node1Id,
    node2Id,
    "matches",
    "matches",
    { confidence },
    evidence
  );
}

/**
 * Create a "precedes" edge (temporal ordering)
 */
export function createPrecedesEdge(
  earlierNodeId: string,
  laterNodeId: string,
  evidence: EvidenceRef[] = []
): GraphEdge {
  return createEdge(
    earlierNodeId,
    laterNodeId,
    "precedes",
    "precedes",
    {},
    evidence
  );
}

/**
 * Create a "treats" edge (medication treats condition)
 */
export function createTreatsEdge(
  medicationNodeId: string,
  conditionNodeId: string,
  evidence: EvidenceRef[] = []
): GraphEdge {
  return createEdge(
    medicationNodeId,
    conditionNodeId,
    "treats",
    "treats",
    {},
    evidence
  );
}

/**
 * Determine lab interpretation based on value and reference range
 */
export function interpretLabValue(
  value: number,
  referenceRange?: { low?: number; high?: number }
): "normal" | "low" | "high" | "critical-low" | "critical-high" | undefined {
  if (!referenceRange) return undefined;
  
  const { low, high } = referenceRange;
  
  if (low !== undefined && value < low) {
    // More than 50% below low is critical
    if (value < low * 0.5) return "critical-low";
    return "low";
  }
  
  if (high !== undefined && value > high) {
    // More than 50% above high is critical
    if (value > high * 1.5) return "critical-high";
    return "high";
  }
  
  return "normal";
}
