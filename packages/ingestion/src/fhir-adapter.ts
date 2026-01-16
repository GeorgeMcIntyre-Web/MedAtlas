import type { GraphData, GraphNode, GraphEdge, EvidenceRef } from "@medatlas/graph/types";
import type { DataAdapter, IngestionOptions } from "./adapter-types";
import { createNode, createEdge } from "./graph-transformer";

type FhirBundle = {
  resourceType: string;
  entry?: Array<{ resource?: FhirResource }>;
};

type FhirResource = {
  resourceType: string;
  id?: string;
  subject?: { reference?: string };
  encounter?: { reference?: string };
  [key: string]: unknown;
};

const getRefId = (reference?: string): string | undefined => {
  if (!reference) return undefined;
  const parts = reference.split("/");
  return parts.length > 1 ? parts[1] : reference;
};

const getEvidence = (resource: FhirResource): EvidenceRef[] => {
  if (!resource.id) return [];
  return [{ source: "fhir", id: resource.id }];
};

const getPatientLabel = (patient: any): string => {
  const name = Array.isArray(patient.name) ? patient.name[0] : undefined;
  if (name?.text) return name.text as string;
  if (Array.isArray(name?.given) || name?.family) {
    const given = Array.isArray(name?.given) ? name.given.join(" ") : "";
    const family = name?.family ?? "";
    return `${given} ${family}`.trim() || "Patient";
  }
  return "Patient";
};

const isLabObservation = (obs: any): boolean => {
  const categories = Array.isArray(obs.category) ? obs.category : [];
  return categories.some((cat: any) =>
    Array.isArray(cat.coding) && cat.coding.some((coding: any) => {
      const code = (coding.code ?? "").toString().toLowerCase();
      const display = (coding.display ?? "").toString().toLowerCase();
      return code === "laboratory" || display.includes("laboratory");
    })
  );
};

const isAbnormal = (obs: any): boolean => {
  const interpretations = Array.isArray(obs.interpretation) ? obs.interpretation : [];
  return interpretations.some((interp: any) =>
    Array.isArray(interp.coding) && interp.coding.some((coding: any) => {
      const code = (coding.code ?? "").toString().toUpperCase();
      return ["H", "L", "A", "HH", "LL", "AA"].includes(code);
    })
  );
};

export class FHIRAdapter implements DataAdapter {
  readonly name = "fhir";
  readonly sourceType = "fhir" as const;

  canHandle(source: unknown): boolean {
    return typeof source === "object" && source !== null && (source as FhirBundle).resourceType === "Bundle";
  }

  transform(data: unknown, caseId: string, _options?: IngestionOptions): GraphData {
    const bundle = data as FhirBundle;
    const entries = bundle.entry ?? [];
    const resources = entries.map(entry => entry.resource).filter(Boolean) as FhirResource[];

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const now = new Date().toISOString();
    const seenNodes = new Set<string>();

    const patient = resources.find(r => r.resourceType === "Patient") as any;
    const patientId = patient?.id ?? `patient-${caseId}`;

    if (!seenNodes.has(patientId)) {
      nodes.push(createNode(
        patientId,
        "patient",
        patient ? getPatientLabel(patient) : "Patient",
        {
          gender: patient?.gender,
          birthDate: patient?.birthDate,
          mrn: Array.isArray(patient?.identifier) ? patient.identifier[0]?.value : undefined
        },
        patient ? getEvidence(patient) : [],
        undefined
      ));
      seenNodes.add(patientId);
    }

    const encounterMap = new Map<string, string>();

    for (const resource of resources) {
      if (!resource.id) continue;
      const evidence = getEvidence(resource);

      if (resource.resourceType === "Encounter") {
        const encounter = resource as any;
        const encId = encounter.id as string;
        const label = encounter.type?.[0]?.text ?? encounter.class?.code ?? "Encounter";
        const timestamp = encounter.period?.start ?? encounter.period?.end;
        nodes.push(createNode(
          encId,
          "encounter",
          label,
          {
            patientId,
            type: encounter.class?.code,
            reason: encounter.reasonCode?.[0]?.text
          },
          evidence,
          timestamp
        ));
        edges.push(createEdge(`${encId}-belongs`, encId, patientId, "belongs-to"));
        encounterMap.set(encId, encId);
        continue;
      }

      if (resource.resourceType === "Observation") {
        const obs = resource as any;
        const obsId = obs.id as string;
        const label = obs.code?.text ?? obs.code?.coding?.[0]?.display ?? "Observation";
        const timestamp = obs.effectiveDateTime ?? obs.issued;
        const encId = getRefId(obs.encounter?.reference);
        const abnormal = isAbnormal(obs);

        if (isLabObservation(obs)) {
          nodes.push(createNode(
            obsId,
            "lab",
            label,
            {
              patientId,
              value: obs.valueQuantity?.value,
              unit: obs.valueQuantity?.unit,
              isAbnormal: abnormal,
              referenceRange: Array.isArray(obs.referenceRange) ? obs.referenceRange[0] : undefined
            },
            evidence,
            timestamp
          ));
        } else {
          nodes.push(createNode(
            obsId,
            "observation",
            label,
            {
              patientId,
              value: obs.valueQuantity?.value,
              unit: obs.valueQuantity?.unit,
              interpretation: obs.interpretation?.[0]?.text
            },
            evidence,
            timestamp
          ));
        }

        if (encId && encounterMap.has(encId)) {
          edges.push(createEdge(`${obsId}-observed`, obsId, encId, "observed-in"));
        } else {
          edges.push(createEdge(`${obsId}-belongs`, obsId, patientId, "belongs-to"));
        }
        continue;
      }

      if (resource.resourceType === "Condition") {
        const condition = resource as any;
        const condId = condition.id as string;
        const label = condition.code?.text ?? condition.code?.coding?.[0]?.display ?? "Condition";
        const timestamp = condition.onsetDateTime ?? condition.recordedDate;
        const encId = getRefId(condition.encounter?.reference);
        nodes.push(createNode(
          condId,
          "condition",
          label,
          {
            patientId,
            status: condition.clinicalStatus?.coding?.[0]?.code,
            severity: condition.severity?.coding?.[0]?.display
          },
          evidence,
          timestamp
        ));
        if (encId && encounterMap.has(encId)) {
          edges.push(createEdge(`${condId}-observed`, condId, encId, "observed-in"));
        } else {
          edges.push(createEdge(`${condId}-belongs`, condId, patientId, "belongs-to"));
        }
        continue;
      }

      if (resource.resourceType === "MedicationRequest") {
        const med = resource as any;
        const medId = med.id as string;
        const label = med.medicationCodeableConcept?.text ??
          med.medicationCodeableConcept?.coding?.[0]?.display ??
          "Medication";
        const timestamp = med.authoredOn;
        const encId = getRefId(med.encounter?.reference);
        nodes.push(createNode(
          medId,
          "medication",
          label,
          {
            patientId,
            status: med.status,
            dosage: med.dosageInstruction?.[0]?.text
          },
          evidence,
          timestamp
        ));
        if (encId && encounterMap.has(encId)) {
          edges.push(createEdge(`${medId}-observed`, medId, encId, "observed-in"));
        } else {
          edges.push(createEdge(`${medId}-belongs`, medId, patientId, "belongs-to"));
        }
        continue;
      }

      if (resource.resourceType === "ImagingStudy") {
        const study = resource as any;
        const studyId = study.id as string;
        const label = study.description ?? "Imaging Study";
        const timestamp = study.started;
        const encId = getRefId(study.encounter?.reference);
        nodes.push(createNode(
          studyId,
          "study",
          label,
          {
            patientId,
            modality: Array.isArray(study.modality) ? study.modality[0]?.code : undefined,
            bodyPart: Array.isArray(study.series) ? study.series[0]?.bodySite?.display : undefined
          },
          evidence,
          timestamp
        ));
        if (encId && encounterMap.has(encId)) {
          edges.push(createEdge(`${studyId}-observed`, studyId, encId, "observed-in"));
        } else {
          edges.push(createEdge(`${studyId}-belongs`, studyId, patientId, "belongs-to"));
        }
      }
    }

    return {
      id: caseId,
      nodes,
      edges,
      metadata: {
        createdAt: now,
        updatedAt: now,
        nodeCount: nodes.length,
        edgeCount: edges.length
      }
    };
  }
}
