/**
 * Data Ingestion Adapter Types
 * 
 * These types define the interface for data adapters that transform
 * various data sources into Atlas Graph structure.
 */

import type { GraphData, GraphNode, GraphEdge } from "./graph-types.js";

/**
 * Data source types supported by the ingestion system
 */
export type DataSource = "fhir" | "synthetic" | "csv" | "hl7v2";

/**
 * Result of an ingestion operation
 */
export interface IngestionResult {
  /** Case ID for the ingested data */
  caseId: string;
  /** ID of the created/updated graph */
  graphId: string;
  /** Number of nodes created */
  nodesCreated: number;
  /** Number of edges created */
  edgesCreated: number;
  /** Ingestion timestamp */
  ingestedAt: string;
  /** Any warnings during ingestion */
  warnings?: string[];
  /** Error if ingestion failed */
  error?: string;
}

/**
 * Options for ingestion operations
 */
export interface IngestionOptions {
  /** Whether to merge with existing data or replace */
  mode?: "merge" | "replace";
  /** Validate data before ingestion */
  validate?: boolean;
  /** Generate cross-modal links */
  createCrossModalLinks?: boolean;
}

/**
 * Data Adapter Interface
 * 
 * Adapters transform raw data from various sources into the
 * Atlas Graph structure (nodes and edges).
 */
export interface DataAdapter {
  /** Name of the adapter */
  readonly name: string;
  
  /** Data source type this adapter handles */
  readonly sourceType: DataSource;
  
  /**
   * Check if this adapter can handle the given data source
   * @param source - Source identifier or data to check
   */
  canHandle(source: string | unknown): boolean;
  
  /**
   * Transform raw data into graph structure
   * @param data - Raw data to transform
   * @param caseId - Case ID for the data
   * @param options - Optional ingestion options
   */
  transform(data: unknown, caseId: string, options?: IngestionOptions): GraphData;
}

/**
 * Synthetic case data structure for generating demo data
 */
export interface SyntheticCase {
  caseId: string;
  patient: {
    id: string;
    demographics: {
      age: number;
      gender: "male" | "female" | "other";
      birthDate?: string;
      mrn?: string;
    };
  };
  encounters: SyntheticEncounter[];
}

/**
 * Synthetic encounter data
 */
export interface SyntheticEncounter {
  id: string;
  type: "ED" | "outpatient" | "inpatient" | "virtual";
  timestamp: string;
  reason?: string;
  observations: SyntheticObservation[];
  labs: SyntheticLab[];
  vitals: SyntheticVital[];
  medications: SyntheticMedication[];
  conditions: SyntheticCondition[];
  studies: SyntheticStudy[];
  notes: SyntheticNote[];
  procedures: SyntheticProcedure[];
}

/**
 * Synthetic observation
 */
export interface SyntheticObservation {
  id: string;
  type: string;
  value: unknown;
  text?: string;
  timestamp?: string;
}

/**
 * Synthetic lab result
 */
export interface SyntheticLab {
  id: string;
  name: string;
  code?: string;
  value: number;
  unit: string;
  referenceRange?: { low?: number; high?: number };
  interpretation?: "normal" | "low" | "high" | "critical-low" | "critical-high";
  timestamp?: string;
}

/**
 * Synthetic vital sign
 */
export interface SyntheticVital {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp?: string;
}

/**
 * Synthetic medication
 */
export interface SyntheticMedication {
  id: string;
  name: string;
  dosage?: string;
  route?: string;
  frequency?: string;
  status: "active" | "completed" | "stopped";
  startDate?: string;
}

/**
 * Synthetic condition/diagnosis
 */
export interface SyntheticCondition {
  id: string;
  code?: string;
  icdCode?: string;
  name: string;
  status: "active" | "resolved" | "inactive";
  severity?: "mild" | "moderate" | "severe";
  onsetDate?: string;
}

/**
 * Synthetic imaging study
 */
export interface SyntheticStudy {
  id: string;
  modality: "CT" | "MRI" | "XR" | "US" | "PET";
  bodyPart?: string;
  description?: string;
  accessionNumber?: string;
  findings: SyntheticFinding[];
  timestamp?: string;
}

/**
 * Synthetic imaging finding
 */
export interface SyntheticFinding {
  id: string;
  description: string;
  severity?: "mild" | "moderate" | "severe";
  confidence?: number;
  anatomy?: string;
  /** Reference to lab or other modality for cross-modal link */
  crossModalRef?: string;
}

/**
 * Synthetic clinical note
 */
export interface SyntheticNote {
  id: string;
  type: "progress" | "admission" | "discharge" | "consult" | "procedure";
  author?: string;
  text: string;
  timestamp?: string;
}

/**
 * Synthetic procedure
 */
export interface SyntheticProcedure {
  id: string;
  name: string;
  code?: string;
  status: "completed" | "cancelled";
  outcome?: string;
  timestamp?: string;
}

/**
 * FHIR Bundle type (simplified)
 */
export interface FHIRBundle {
  resourceType: "Bundle";
  type: "collection" | "document" | "message" | "transaction";
  entry: FHIRBundleEntry[];
}

/**
 * FHIR Bundle entry
 */
export interface FHIRBundleEntry {
  fullUrl?: string;
  resource: FHIRResource;
}

/**
 * FHIR Resource (simplified base type)
 */
export interface FHIRResource {
  resourceType: string;
  id?: string;
  [key: string]: unknown;
}

/**
 * FHIR Patient resource (simplified)
 */
export interface FHIRPatient extends FHIRResource {
  resourceType: "Patient";
  birthDate?: string;
  gender?: "male" | "female" | "other" | "unknown";
  name?: Array<{
    family?: string;
    given?: string[];
  }>;
  identifier?: Array<{
    system?: string;
    value?: string;
  }>;
}

/**
 * FHIR Encounter resource (simplified)
 */
export interface FHIREncounter extends FHIRResource {
  resourceType: "Encounter";
  status: string;
  class?: {
    code?: string;
  };
  period?: {
    start?: string;
    end?: string;
  };
  subject?: {
    reference?: string;
  };
  reasonCode?: Array<{
    coding?: Array<{
      code?: string;
      display?: string;
    }>;
  }>;
}

/**
 * FHIR Observation resource (simplified)
 */
export interface FHIRObservation extends FHIRResource {
  resourceType: "Observation";
  status: string;
  code: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  valueQuantity?: {
    value?: number;
    unit?: string;
  };
  valueString?: string;
  effectiveDateTime?: string;
  encounter?: {
    reference?: string;
  };
  subject?: {
    reference?: string;
  };
  interpretation?: Array<{
    coding?: Array<{
      code?: string;
      display?: string;
    }>;
  }>;
  referenceRange?: Array<{
    low?: { value?: number; unit?: string };
    high?: { value?: number; unit?: string };
  }>;
}

/**
 * FHIR MedicationStatement resource (simplified)
 */
export interface FHIRMedicationStatement extends FHIRResource {
  resourceType: "MedicationStatement";
  status: string;
  medicationCodeableConcept?: {
    coding?: Array<{
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  effectivePeriod?: {
    start?: string;
    end?: string;
  };
  dosage?: Array<{
    text?: string;
    route?: {
      text?: string;
    };
  }>;
  subject?: {
    reference?: string;
  };
}

/**
 * FHIR Condition resource (simplified)
 */
export interface FHIRCondition extends FHIRResource {
  resourceType: "Condition";
  clinicalStatus?: {
    coding?: Array<{
      code?: string;
    }>;
  };
  severity?: {
    coding?: Array<{
      code?: string;
      display?: string;
    }>;
  };
  code?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  onsetDateTime?: string;
  subject?: {
    reference?: string;
  };
  encounter?: {
    reference?: string;
  };
}

/**
 * FHIR ImagingStudy resource (simplified)
 */
export interface FHIRImagingStudy extends FHIRResource {
  resourceType: "ImagingStudy";
  status: string;
  modality?: Array<{
    code?: string;
    display?: string;
  }>;
  description?: string;
  started?: string;
  subject?: {
    reference?: string;
  };
  encounter?: {
    reference?: string;
  };
  series?: Array<{
    uid?: string;
    modality?: {
      code?: string;
    };
    bodySite?: {
      code?: string;
      display?: string;
    };
  }>;
}

/**
 * FHIR DiagnosticReport resource (simplified)
 */
export interface FHIRDiagnosticReport extends FHIRResource {
  resourceType: "DiagnosticReport";
  status: string;
  code?: {
    coding?: Array<{
      code?: string;
      display?: string;
    }>;
  };
  conclusion?: string;
  effectiveDateTime?: string;
  subject?: {
    reference?: string;
  };
  encounter?: {
    reference?: string;
  };
}
