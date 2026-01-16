import type { GraphData, GraphNode, GraphEdge } from "@medatlas/graph/types";

export type DataSource = "fhir" | "synthetic" | "csv" | "hl7v2";

export interface IngestionResult {
  caseId: string;
  graphId: string;
  nodesCreated: number;
  edgesCreated: number;
  ingestedAt: string;
  warnings?: string[];
  error?: string;
}

export interface IngestionOptions {
  mode?: "merge" | "replace";
  validate?: boolean;
  createCrossModalLinks?: boolean;
}

export interface DataAdapter {
  readonly name: string;
  readonly sourceType: DataSource;
  canHandle(source: string | unknown): boolean;
  transform(data: unknown, caseId: string, options?: IngestionOptions): GraphData;
}

// Synthetic case structure for demo data
export interface SyntheticCase {
  caseId: string;
  patient: {
    id: string;
    demographics: { age: number; gender: "male" | "female" | "other"; mrn?: string };
  };
  encounters: SyntheticEncounter[];
}

export interface SyntheticEncounter {
  id: string;
  type: "ED" | "outpatient" | "inpatient";
  timestamp: string;
  reason?: string;
  labs: SyntheticLab[];
  studies: SyntheticStudy[];
  notes: SyntheticNote[];
  medications: SyntheticMedication[];
  conditions: SyntheticCondition[];
}

export interface SyntheticLab {
  id: string;
  name: string;
  value: number;
  unit: string;
  referenceRange?: { low?: number; high?: number };
  isAbnormal?: boolean;
  timestamp?: string;
}

export interface SyntheticStudy {
  id: string;
  modality: "CT" | "MRI" | "XR" | "US";
  bodyPart?: string;
  findings: SyntheticFinding[];
  timestamp?: string;
}

export interface SyntheticFinding {
  id: string;
  description: string;
  severity?: "mild" | "moderate" | "severe";
  confidence?: number;
  anatomy?: string;
}

export interface SyntheticNote {
  id: string;
  type: "progress" | "admission" | "discharge";
  text: string;
  timestamp?: string;
}

export interface SyntheticMedication {
  id: string;
  name: string;
  dosage?: string;
  status: "active" | "completed";
}

export interface SyntheticCondition {
  id: string;
  name: string;
  status: "active" | "resolved";
  severity?: "mild" | "moderate" | "severe";
}
