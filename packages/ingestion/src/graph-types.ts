/**
 * Graph Types for MedAtlas
 * 
 * These types define the core graph structure for the Atlas Graph.
 * They will be used by the ingestion module and should be compatible
 * with Agent 1's graph package when it's created.
 */

import type { EvidenceRef } from "@medatlas/schemas/types";

/**
 * Node types in the Atlas Graph
 */
export type NodeType =
  | "patient"
  | "encounter"
  | "observation"
  | "lab"
  | "medication"
  | "condition"
  | "study"
  | "finding"
  | "note"
  | "vital"
  | "procedure";

/**
 * Edge types in the Atlas Graph
 * - observed-in: entity observed in context (e.g., lab observed in encounter)
 * - derived-from: entity derived from another (e.g., finding derived from study)
 * - matches: cross-modal alignment (e.g., CT finding matches lab value)
 * - contradicts: conflicting information
 * - temporal-near: events close in time
 * - same-as: duplicate or equivalent entities
 * - precedes: temporal ordering
 * - follows: temporal ordering (reverse of precedes)
 * - caused-by: causal relationship
 * - treats: medication treats condition
 */
export type EdgeType =
  | "observed-in"
  | "derived-from"
  | "matches"
  | "contradicts"
  | "temporal-near"
  | "same-as"
  | "precedes"
  | "follows"
  | "caused-by"
  | "treats";

/**
 * A node in the Atlas Graph
 */
export interface GraphNode {
  /** Unique identifier for the node */
  id: string;
  /** Type of the node */
  type: NodeType;
  /** Display label */
  label: string;
  /** Arbitrary properties specific to node type */
  properties: Record<string, unknown>;
  /** Evidence references linking to source data */
  evidence: EvidenceRef[];
  /** Timestamp when the entity occurred/was captured */
  timestamp?: string;
  /** When the node was created in the graph */
  createdAt: string;
}

/**
 * An edge in the Atlas Graph
 */
export interface GraphEdge {
  /** Unique identifier for the edge */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Type of relationship */
  type: EdgeType;
  /** Display label */
  label: string;
  /** Arbitrary properties */
  properties: Record<string, unknown>;
  /** Evidence references */
  evidence: EvidenceRef[];
  /** When the edge was created */
  createdAt: string;
}

/**
 * Complete graph data structure
 */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Timeline event for patient timeline view
 */
export interface TimelineEvent {
  id: string;
  type: NodeType;
  timestamp: string;
  title: string;
  summary?: string;
  evidence: EvidenceRef[];
  relatedNodes?: string[];
}

/**
 * Patient demographics
 */
export interface PatientDemographics {
  age?: number;
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string;
  mrn?: string;
}

/**
 * Encounter details
 */
export interface EncounterDetails {
  type: "ED" | "outpatient" | "inpatient" | "virtual" | "other";
  status: "planned" | "in-progress" | "finished" | "cancelled";
  reason?: string;
  department?: string;
}

/**
 * Lab result details
 */
export interface LabDetails {
  name: string;
  code?: string;
  value: number;
  unit: string;
  referenceRange?: {
    low?: number;
    high?: number;
  };
  interpretation?: "normal" | "low" | "high" | "critical-low" | "critical-high";
}

/**
 * Vital signs details
 */
export interface VitalDetails {
  name: string;
  code?: string;
  value: number;
  unit: string;
}

/**
 * Imaging study details
 */
export interface StudyDetails {
  modality: "CT" | "MRI" | "XR" | "US" | "PET" | "other";
  bodyPart?: string;
  description?: string;
  accessionNumber?: string;
}

/**
 * Finding details
 */
export interface FindingDetails {
  description: string;
  severity?: "mild" | "moderate" | "severe";
  confidence?: number;
  anatomy?: string;
  imageRef?: string;
  sliceIndex?: number;
  coordinates?: [number, number, number];
}

/**
 * Medication details
 */
export interface MedicationDetails {
  name: string;
  code?: string;
  dosage?: string;
  route?: string;
  frequency?: string;
  status: "active" | "completed" | "stopped" | "on-hold";
}

/**
 * Condition details
 */
export interface ConditionDetails {
  name: string;
  code?: string;
  icdCode?: string;
  status: "active" | "resolved" | "inactive";
  severity?: "mild" | "moderate" | "severe";
}

/**
 * Clinical note details
 */
export interface NoteDetails {
  type: "progress" | "admission" | "discharge" | "consult" | "procedure" | "other";
  author?: string;
  text: string;
  excerpt?: string;
}

/**
 * Procedure details
 */
export interface ProcedureDetails {
  name: string;
  code?: string;
  status: "preparation" | "in-progress" | "completed" | "cancelled";
  outcome?: string;
}
