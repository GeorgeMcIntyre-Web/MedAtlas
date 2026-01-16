import type { GraphData, GraphNode, GraphEdge, EdgeType } from "@medatlas/graph/types";
import type { DataAdapter, SyntheticCase, IngestionOptions } from "./adapter-types";

export class SyntheticAdapter implements DataAdapter {
  readonly name = "synthetic";
  readonly sourceType = "synthetic" as const;

  canHandle(source: unknown): boolean {
    return typeof source === "object" && source !== null && "caseId" in source && "patient" in source;
  }

  transform(data: unknown, caseId: string, _options?: IngestionOptions): GraphData {
    const synth = data as SyntheticCase;
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const now = new Date().toISOString();

    const patientId = synth.patient.id;
    nodes.push({
      id: patientId,
      type: "patient",
      label: `Patient ${synth.patient.demographics.mrn ?? patientId}`,
      properties: { ...synth.patient.demographics },
      evidence: [],
      createdAt: now
    });

    for (const enc of synth.encounters) {
      const encId = enc.id;
      nodes.push({
        id: encId,
        type: "encounter",
        label: `${enc.type} Visit`,
        properties: { patientId, type: enc.type, reason: enc.reason },
        evidence: [{ source: "synthetic", id: encId }],
        timestamp: enc.timestamp,
        createdAt: now
      });
      edges.push(createEdge(`${encId}-belongs`, encId, patientId, "belongs-to"));

      for (const lab of enc.labs) {
        nodes.push({
          id: lab.id,
          type: "lab",
          label: lab.name,
          properties: {
            patientId,
            value: lab.value,
            unit: lab.unit,
            isAbnormal: lab.isAbnormal,
            referenceRange: lab.referenceRange
          },
          evidence: [{ source: "lab", id: lab.id }],
          timestamp: lab.timestamp ?? enc.timestamp,
          createdAt: now
        });
        edges.push(createEdge(`${lab.id}-observed`, lab.id, encId, "observed-in"));
      }

      for (const study of enc.studies) {
        nodes.push({
          id: study.id,
          type: "study",
          label: `${study.modality} ${study.bodyPart ?? "Study"}`,
          properties: { patientId, modality: study.modality, bodyPart: study.bodyPart },
          evidence: [{ source: "dicom", id: study.id }],
          timestamp: study.timestamp ?? enc.timestamp,
          createdAt: now
        });
        edges.push(createEdge(`${study.id}-observed`, study.id, encId, "observed-in"));

        for (const finding of study.findings) {
          nodes.push({
            id: finding.id,
            type: "finding",
            label: finding.description,
            properties: {
              patientId,
              severity: finding.severity,
              probability: finding.confidence,
              anatomy: finding.anatomy
            },
            evidence: [{ source: "dicom", id: study.id }],
            timestamp: study.timestamp ?? enc.timestamp,
            createdAt: now
          });
          edges.push(createEdge(`${finding.id}-from`, study.id, finding.id, "has-finding"));
        }
      }

      for (const note of enc.notes) {
        nodes.push({
          id: note.id,
          type: "note",
          label: `${note.type} Note`,
          properties: { patientId, text: note.text, noteType: note.type },
          evidence: [{ source: "note", id: note.id }],
          timestamp: note.timestamp ?? enc.timestamp,
          createdAt: now
        });
        edges.push(createEdge(`${note.id}-observed`, note.id, encId, "observed-in"));
      }

      for (const med of enc.medications) {
        nodes.push({
          id: med.id,
          type: "medication",
          label: med.name,
          properties: { patientId, dosage: med.dosage, status: med.status },
          evidence: [{ source: "synthetic", id: med.id }],
          timestamp: enc.timestamp,
          createdAt: now
        });
        edges.push(createEdge(`${med.id}-observed`, med.id, encId, "observed-in"));
      }

      for (const cond of enc.conditions) {
        nodes.push({
          id: cond.id,
          type: "condition",
          label: cond.name,
          properties: { patientId, status: cond.status, severity: cond.severity },
          evidence: [{ source: "synthetic", id: cond.id }],
          timestamp: enc.timestamp,
          createdAt: now
        });
        edges.push(createEdge(`${cond.id}-observed`, cond.id, encId, "observed-in"));
      }
    }

    return {
      id: caseId,
      nodes,
      edges,
      metadata: { createdAt: now, updatedAt: now, nodeCount: nodes.length, edgeCount: edges.length }
    };
  }
}

function createEdge(id: string, source: string, target: string, type: EdgeType): GraphEdge {
  return {
    id,
    source,
    target,
    type,
    label: type.replace("-", " "),
    properties: {},
    evidence: [],
    createdAt: new Date().toISOString()
  };
}
