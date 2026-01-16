/**
 * FHIR Data Adapter
 * 
 * Transforms FHIR Bundle data into Atlas Graph structure.
 * Supports common FHIR resources: Patient, Encounter, Observation,
 * MedicationStatement, Condition, ImagingStudy, DiagnosticReport.
 */

import type { EvidenceRef } from "@medatlas/schemas/types";
import type { GraphData, GraphNode, GraphEdge } from "./graph-types.js";
import type {
  DataAdapter,
  IngestionOptions,
  FHIRBundle,
  FHIRResource,
  FHIRPatient,
  FHIREncounter,
  FHIRObservation,
  FHIRMedicationStatement,
  FHIRCondition,
  FHIRImagingStudy,
  FHIRDiagnosticReport,
} from "./adapter-types.js";
import {
  createPatientNode,
  createEncounterNode,
  createLabNode,
  createObservationNode,
  createStudyNode,
  createFindingNode,
  createMedicationNode,
  createConditionNode,
  createObservedInEdge,
  createDerivedFromEdge,
  generateNodeId,
  interpretLabValue,
} from "./graph-transformer.js";

/**
 * Extract the ID from a FHIR reference string (e.g., "Patient/123" -> "123")
 */
function extractIdFromReference(reference?: string): string | undefined {
  if (!reference) return undefined;
  const parts = reference.split("/");
  return parts.length > 1 ? parts[1] : parts[0];
}

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate?: string): number | undefined {
  if (!birthDate) return undefined;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Map FHIR encounter class to our encounter type
 */
function mapEncounterType(classCode?: string): "ED" | "outpatient" | "inpatient" | "virtual" | "other" {
  switch (classCode?.toLowerCase()) {
    case "emer":
    case "emergency":
      return "ED";
    case "amb":
    case "ambulatory":
    case "outpatient":
      return "outpatient";
    case "imp":
    case "inpatient":
    case "acute":
      return "inpatient";
    case "vr":
    case "virtual":
      return "virtual";
    default:
      return "other";
  }
}

/**
 * Map FHIR clinical status to our condition status
 */
function mapConditionStatus(statusCode?: string): "active" | "resolved" | "inactive" {
  switch (statusCode?.toLowerCase()) {
    case "active":
    case "recurrence":
    case "relapse":
      return "active";
    case "resolved":
    case "remission":
      return "resolved";
    case "inactive":
    default:
      return "inactive";
  }
}

/**
 * Map FHIR medication status to our medication status
 */
function mapMedicationStatus(status?: string): "active" | "completed" | "stopped" | "on-hold" {
  switch (status?.toLowerCase()) {
    case "active":
      return "active";
    case "completed":
      return "completed";
    case "stopped":
    case "not-taken":
      return "stopped";
    case "on-hold":
    case "intended":
      return "on-hold";
    default:
      return "active";
  }
}

/**
 * Map FHIR interpretation to our interpretation
 */
function mapInterpretation(
  code?: string
): "normal" | "low" | "high" | "critical-low" | "critical-high" | undefined {
  switch (code?.toUpperCase()) {
    case "N":
    case "NORMAL":
      return "normal";
    case "L":
    case "LOW":
      return "low";
    case "H":
    case "HIGH":
      return "high";
    case "LL":
    case "CRITICAL-LOW":
      return "critical-low";
    case "HH":
    case "CRITICAL-HIGH":
      return "critical-high";
    default:
      return undefined;
  }
}

/**
 * Map FHIR imaging modality to our modality type
 */
function mapImagingModality(code?: string): "CT" | "MRI" | "XR" | "US" | "PET" | "other" {
  switch (code?.toUpperCase()) {
    case "CT":
      return "CT";
    case "MR":
    case "MRI":
      return "MRI";
    case "XR":
    case "CR":
    case "DX":
      return "XR";
    case "US":
      return "US";
    case "PT":
    case "PET":
      return "PET";
    default:
      return "other";
  }
}

/**
 * FHIR Data Adapter
 * 
 * Transforms FHIR Bundle data into graph nodes and edges.
 */
export class FHIRAdapter implements DataAdapter {
  readonly name = "FHIRAdapter";
  readonly sourceType = "fhir" as const;

  /**
   * Check if this adapter can handle the given data
   */
  canHandle(source: string | unknown): boolean {
    if (typeof source === "string") {
      return source === "fhir";
    }
    // Check if it looks like a FHIR Bundle
    if (typeof source === "object" && source !== null) {
      const obj = source as Record<string, unknown>;
      return obj.resourceType === "Bundle" && Array.isArray(obj.entry);
    }
    return false;
  }

  /**
   * Transform FHIR Bundle into graph structure
   */
  transform(data: unknown, caseId: string, options?: IngestionOptions): GraphData {
    const bundle = data as FHIRBundle;
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Group resources by type for processing
    const resourcesByType = new Map<string, FHIRResource[]>();
    for (const entry of bundle.entry) {
      const resource = entry.resource;
      const type = resource.resourceType;
      if (!resourcesByType.has(type)) {
        resourcesByType.set(type, []);
      }
      resourcesByType.get(type)!.push(resource);
    }

    // Track node IDs for linking
    const patientNodeIds = new Map<string, string>();
    const encounterNodeIds = new Map<string, string>();
    const studyNodeIds = new Map<string, string>();
    const conditionNodeIds = new Map<string, string>();
    const labNodeIds = new Map<string, string>();

    // Process Patients
    const patients = resourcesByType.get("Patient") as FHIRPatient[] | undefined;
    if (patients) {
      for (const patient of patients) {
        const patientId = patient.id || `patient-${Date.now()}`;
        const nodeId = generateNodeId("patient", caseId, patientId);
        patientNodeIds.set(patientId, nodeId);

        const evidence: EvidenceRef[] = [
          { source: "fhir", id: patientId }
        ];

        nodes.push(createPatientNode(
          caseId,
          patientId,
          {
            age: calculateAge(patient.birthDate),
            gender: patient.gender as "male" | "female" | "other" | "unknown" | undefined,
            birthDate: patient.birthDate,
            mrn: patient.identifier?.[0]?.value,
          },
          evidence
        ));
      }
    }

    // Process Encounters
    const encounters = resourcesByType.get("Encounter") as FHIREncounter[] | undefined;
    if (encounters) {
      for (const encounter of encounters) {
        const encounterId = encounter.id || `encounter-${Date.now()}`;
        const nodeId = generateNodeId("encounter", caseId, encounterId);
        encounterNodeIds.set(encounterId, nodeId);

        const evidence: EvidenceRef[] = [
          { source: "fhir", id: encounterId, capturedAt: encounter.period?.start }
        ];

        nodes.push(createEncounterNode(
          caseId,
          encounterId,
          {
            type: mapEncounterType(encounter.class?.code),
            status: encounter.status as "planned" | "in-progress" | "finished" | "cancelled",
            reason: encounter.reasonCode?.[0]?.coding?.[0]?.display,
          },
          encounter.period?.start || new Date().toISOString(),
          evidence
        ));

        // Link encounter to patient
        const patientRef = extractIdFromReference(encounter.subject?.reference);
        if (patientRef && patientNodeIds.has(patientRef)) {
          edges.push(createObservedInEdge(
            nodeId,
            patientNodeIds.get(patientRef)!,
            evidence
          ));
        }
      }
    }

    // Process Observations (labs and vitals)
    const observations = resourcesByType.get("Observation") as FHIRObservation[] | undefined;
    if (observations) {
      for (const obs of observations) {
        const obsId = obs.id || `obs-${Date.now()}`;
        const isLab = obs.code?.coding?.some(c => 
          c.system?.includes("loinc") || 
          c.display?.toLowerCase().includes("lab")
        );

        const evidence: EvidenceRef[] = [
          { source: isLab ? "lab" : "fhir", id: obsId, capturedAt: obs.effectiveDateTime }
        ];

        if (isLab && obs.valueQuantity) {
          const nodeId = generateNodeId("lab", caseId, obsId);
          labNodeIds.set(obsId, nodeId);

          const referenceRange = obs.referenceRange?.[0];
          const interpretation = obs.interpretation?.[0]?.coding?.[0]?.code;

          nodes.push(createLabNode(
            caseId,
            obsId,
            {
              name: obs.code?.coding?.[0]?.display || obs.code?.text || "Unknown Lab",
              code: obs.code?.coding?.[0]?.code,
              value: obs.valueQuantity.value || 0,
              unit: obs.valueQuantity.unit || "",
              referenceRange: referenceRange ? {
                low: referenceRange.low?.value,
                high: referenceRange.high?.value,
              } : undefined,
              interpretation: mapInterpretation(interpretation) || 
                interpretLabValue(obs.valueQuantity.value || 0, referenceRange ? {
                  low: referenceRange.low?.value,
                  high: referenceRange.high?.value,
                } : undefined),
            },
            obs.effectiveDateTime,
            evidence
          ));

          // Link to encounter
          const encounterRef = extractIdFromReference(obs.encounter?.reference);
          if (encounterRef && encounterNodeIds.has(encounterRef)) {
            edges.push(createObservedInEdge(
              nodeId,
              encounterNodeIds.get(encounterRef)!,
              evidence
            ));
          }
        } else {
          const nodeId = generateNodeId("observation", caseId, obsId);

          nodes.push(createObservationNode(
            caseId,
            obsId,
            obs.code?.coding?.[0]?.display || obs.code?.text || "Observation",
            obs.valueQuantity?.value || obs.valueString,
            obs.code?.text,
            obs.effectiveDateTime,
            evidence
          ));

          // Link to encounter
          const encounterRef = extractIdFromReference(obs.encounter?.reference);
          if (encounterRef && encounterNodeIds.has(encounterRef)) {
            edges.push(createObservedInEdge(
              nodeId,
              encounterNodeIds.get(encounterRef)!,
              evidence
            ));
          }
        }
      }
    }

    // Process MedicationStatements
    const medications = resourcesByType.get("MedicationStatement") as FHIRMedicationStatement[] | undefined;
    if (medications) {
      for (const med of medications) {
        const medId = med.id || `med-${Date.now()}`;
        const nodeId = generateNodeId("medication", caseId, medId);

        const evidence: EvidenceRef[] = [
          { source: "fhir", id: medId, capturedAt: med.effectivePeriod?.start }
        ];

        nodes.push(createMedicationNode(
          caseId,
          medId,
          {
            name: med.medicationCodeableConcept?.coding?.[0]?.display || 
                  med.medicationCodeableConcept?.text || "Unknown Medication",
            dosage: med.dosage?.[0]?.text,
            route: med.dosage?.[0]?.route?.text,
            status: mapMedicationStatus(med.status),
          },
          med.effectivePeriod?.start,
          evidence
        ));

        // Link to patient (medications often reference patient directly)
        const patientRef = extractIdFromReference(med.subject?.reference);
        if (patientRef && patientNodeIds.has(patientRef)) {
          // Find any encounter for this patient to link to
          const patientEncounters = Array.from(encounterNodeIds.values());
          if (patientEncounters.length > 0) {
            edges.push(createObservedInEdge(
              nodeId,
              patientEncounters[0],
              evidence
            ));
          }
        }
      }
    }

    // Process Conditions
    const conditions = resourcesByType.get("Condition") as FHIRCondition[] | undefined;
    if (conditions) {
      for (const condition of conditions) {
        const condId = condition.id || `condition-${Date.now()}`;
        const nodeId = generateNodeId("condition", caseId, condId);
        conditionNodeIds.set(condId, nodeId);

        const evidence: EvidenceRef[] = [
          { source: "fhir", id: condId, capturedAt: condition.onsetDateTime }
        ];

        nodes.push(createConditionNode(
          caseId,
          condId,
          {
            name: condition.code?.coding?.[0]?.display || condition.code?.text || "Unknown Condition",
            code: condition.code?.coding?.[0]?.code,
            icdCode: condition.code?.coding?.find(c => c.system?.includes("icd"))?.code,
            status: mapConditionStatus(condition.clinicalStatus?.coding?.[0]?.code),
            severity: condition.severity?.coding?.[0]?.code as "mild" | "moderate" | "severe" | undefined,
          },
          condition.onsetDateTime,
          evidence
        ));

        // Link to encounter
        const encounterRef = extractIdFromReference(condition.encounter?.reference);
        if (encounterRef && encounterNodeIds.has(encounterRef)) {
          edges.push(createObservedInEdge(
            nodeId,
            encounterNodeIds.get(encounterRef)!,
            evidence
          ));
        }
      }
    }

    // Process ImagingStudies
    const studies = resourcesByType.get("ImagingStudy") as FHIRImagingStudy[] | undefined;
    if (studies) {
      for (const study of studies) {
        const studyId = study.id || `study-${Date.now()}`;
        const nodeId = generateNodeId("study", caseId, studyId);
        studyNodeIds.set(studyId, nodeId);

        const evidence: EvidenceRef[] = [
          { source: "dicom", id: studyId, capturedAt: study.started }
        ];

        const modality = study.modality?.[0]?.code || study.series?.[0]?.modality?.code;
        const bodyPart = study.series?.[0]?.bodySite?.display;

        nodes.push(createStudyNode(
          caseId,
          studyId,
          {
            modality: mapImagingModality(modality),
            bodyPart,
            description: study.description,
          },
          study.started,
          evidence
        ));

        // Link to encounter
        const encounterRef = extractIdFromReference(study.encounter?.reference);
        if (encounterRef && encounterNodeIds.has(encounterRef)) {
          edges.push(createObservedInEdge(
            nodeId,
            encounterNodeIds.get(encounterRef)!,
            evidence
          ));
        }
      }
    }

    // Process DiagnosticReports (create findings from conclusions)
    const reports = resourcesByType.get("DiagnosticReport") as FHIRDiagnosticReport[] | undefined;
    if (reports) {
      for (const report of reports) {
        if (report.conclusion) {
          const findingId = `finding-${report.id || Date.now()}`;
          const nodeId = generateNodeId("finding", caseId, findingId);

          const evidence: EvidenceRef[] = [
            { source: "fhir", id: report.id || findingId, capturedAt: report.effectiveDateTime }
          ];

          nodes.push(createFindingNode(
            caseId,
            findingId,
            {
              description: report.conclusion,
            },
            report.effectiveDateTime,
            evidence
          ));

          // Link to encounter
          const encounterRef = extractIdFromReference(report.encounter?.reference);
          if (encounterRef && encounterNodeIds.has(encounterRef)) {
            edges.push(createObservedInEdge(
              nodeId,
              encounterNodeIds.get(encounterRef)!,
              evidence
            ));
          }

          // If there's an associated study, create derived-from edge
          const studyNodeId = Array.from(studyNodeIds.values())[0];
          if (studyNodeId) {
            edges.push(createDerivedFromEdge(nodeId, studyNodeId, evidence));
          }
        }
      }
    }

    return { nodes, edges };
  }
}

/**
 * Create a default FHIR adapter instance
 */
export function createFHIRAdapter(): FHIRAdapter {
  return new FHIRAdapter();
}
