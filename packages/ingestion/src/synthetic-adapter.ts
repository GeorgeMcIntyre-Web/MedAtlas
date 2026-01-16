/**
 * Synthetic Data Adapter
 * 
 * Transforms synthetic case data into Atlas Graph structure.
 * This adapter handles demo data and testing scenarios.
 */

import type { EvidenceRef } from "@medatlas/schemas/types";
import type { GraphData, GraphNode, GraphEdge } from "./graph-types.js";
import type {
  DataAdapter,
  IngestionOptions,
  SyntheticCase,
  SyntheticEncounter,
} from "./adapter-types.js";
import {
  createPatientNode,
  createEncounterNode,
  createLabNode,
  createVitalNode,
  createObservationNode,
  createStudyNode,
  createFindingNode,
  createMedicationNode,
  createConditionNode,
  createNoteNode,
  createProcedureNode,
  createObservedInEdge,
  createDerivedFromEdge,
  createMatchesEdge,
  createPrecedesEdge,
  createTreatsEdge,
  generateNodeId,
} from "./graph-transformer.js";

/**
 * Synthetic Data Adapter
 * 
 * Transforms SyntheticCase data into graph nodes and edges.
 */
export class SyntheticAdapter implements DataAdapter {
  readonly name = "SyntheticAdapter";
  readonly sourceType = "synthetic" as const;

  /**
   * Check if this adapter can handle the given data
   */
  canHandle(source: string | unknown): boolean {
    if (typeof source === "string") {
      return source === "synthetic";
    }
    // Check if it looks like a SyntheticCase
    if (typeof source === "object" && source !== null) {
      const obj = source as Record<string, unknown>;
      return (
        typeof obj.caseId === "string" &&
        typeof obj.patient === "object" &&
        Array.isArray(obj.encounters)
      );
    }
    return false;
  }

  /**
   * Transform synthetic case data into graph structure
   */
  transform(data: unknown, caseId: string, options?: IngestionOptions): GraphData {
    const syntheticCase = data as SyntheticCase;
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Create patient node
    const patientNodeId = generateNodeId("patient", caseId, syntheticCase.patient.id);
    const patientEvidence: EvidenceRef[] = [
      { source: "synthetic", id: syntheticCase.patient.id }
    ];
    
    nodes.push(createPatientNode(
      caseId,
      syntheticCase.patient.id,
      syntheticCase.patient.demographics,
      patientEvidence
    ));

    // Track all encounter nodes for temporal edges
    const encounterNodeIds: { id: string; timestamp: string }[] = [];

    // Process each encounter
    for (const encounter of syntheticCase.encounters) {
      const encounterResult = this.processEncounter(
        caseId,
        encounter,
        patientNodeId,
        options
      );
      
      nodes.push(...encounterResult.nodes);
      edges.push(...encounterResult.edges);
      
      encounterNodeIds.push({
        id: generateNodeId("encounter", caseId, encounter.id),
        timestamp: encounter.timestamp,
      });
    }

    // Create temporal edges between encounters (precedes)
    const sortedEncounters = [...encounterNodeIds].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (let i = 0; i < sortedEncounters.length - 1; i++) {
      edges.push(createPrecedesEdge(
        sortedEncounters[i].id,
        sortedEncounters[i + 1].id
      ));
    }

    return { nodes, edges };
  }

  /**
   * Process a single encounter and return nodes/edges
   */
  private processEncounter(
    caseId: string,
    encounter: SyntheticEncounter,
    patientNodeId: string,
    options?: IngestionOptions
  ): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Create encounter node
    const encounterNodeId = generateNodeId("encounter", caseId, encounter.id);
    const encounterEvidence: EvidenceRef[] = [
      { source: "synthetic", id: encounter.id, capturedAt: encounter.timestamp }
    ];

    nodes.push(createEncounterNode(
      caseId,
      encounter.id,
      {
        type: encounter.type,
        status: "finished",
        reason: encounter.reason,
      },
      encounter.timestamp,
      encounterEvidence
    ));

    // Link encounter to patient
    edges.push(createObservedInEdge(encounterNodeId, patientNodeId, encounterEvidence));

    // Track nodes for potential cross-modal links
    const labNodeIds: Map<string, string> = new Map(); // labId -> nodeId
    const findingNodeIds: Map<string, string> = new Map(); // findingId -> nodeId
    const conditionNodeIds: Map<string, string> = new Map(); // conditionId -> nodeId
    const medicationNodeIds: Map<string, string> = new Map(); // medicationId -> nodeId

    // Process observations
    for (const obs of encounter.observations) {
      const obsNodeId = generateNodeId("observation", caseId, obs.id);
      const obsEvidence: EvidenceRef[] = [
        { source: "synthetic", id: obs.id, capturedAt: obs.timestamp || encounter.timestamp }
      ];

      nodes.push(createObservationNode(
        caseId,
        obs.id,
        obs.type,
        obs.value,
        obs.text,
        obs.timestamp || encounter.timestamp,
        obsEvidence
      ));

      edges.push(createObservedInEdge(obsNodeId, encounterNodeId, obsEvidence));
    }

    // Process labs
    for (const lab of encounter.labs) {
      const labNodeId = generateNodeId("lab", caseId, lab.id);
      labNodeIds.set(lab.id, labNodeId);
      
      const labEvidence: EvidenceRef[] = [
        { source: "lab", id: lab.id, capturedAt: lab.timestamp || encounter.timestamp }
      ];

      nodes.push(createLabNode(
        caseId,
        lab.id,
        {
          name: lab.name,
          code: lab.code,
          value: lab.value,
          unit: lab.unit,
          referenceRange: lab.referenceRange,
          interpretation: lab.interpretation,
        },
        lab.timestamp || encounter.timestamp,
        labEvidence
      ));

      edges.push(createObservedInEdge(labNodeId, encounterNodeId, labEvidence));
    }

    // Process vitals
    for (const vital of encounter.vitals) {
      const vitalNodeId = generateNodeId("vital", caseId, vital.id);
      const vitalEvidence: EvidenceRef[] = [
        { source: "synthetic", id: vital.id, capturedAt: vital.timestamp || encounter.timestamp }
      ];

      nodes.push(createVitalNode(
        caseId,
        vital.id,
        {
          name: vital.name,
          value: vital.value,
          unit: vital.unit,
        },
        vital.timestamp || encounter.timestamp,
        vitalEvidence
      ));

      edges.push(createObservedInEdge(vitalNodeId, encounterNodeId, vitalEvidence));
    }

    // Process medications
    for (const med of encounter.medications) {
      const medNodeId = generateNodeId("medication", caseId, med.id);
      medicationNodeIds.set(med.id, medNodeId);
      
      const medEvidence: EvidenceRef[] = [
        { source: "synthetic", id: med.id, capturedAt: med.startDate || encounter.timestamp }
      ];

      nodes.push(createMedicationNode(
        caseId,
        med.id,
        {
          name: med.name,
          dosage: med.dosage,
          route: med.route,
          frequency: med.frequency,
          status: med.status,
        },
        med.startDate || encounter.timestamp,
        medEvidence
      ));

      edges.push(createObservedInEdge(medNodeId, encounterNodeId, medEvidence));
    }

    // Process conditions
    for (const condition of encounter.conditions) {
      const condNodeId = generateNodeId("condition", caseId, condition.id);
      conditionNodeIds.set(condition.id, condNodeId);
      
      const condEvidence: EvidenceRef[] = [
        { source: "synthetic", id: condition.id, capturedAt: condition.onsetDate || encounter.timestamp }
      ];

      nodes.push(createConditionNode(
        caseId,
        condition.id,
        {
          name: condition.name,
          code: condition.code,
          icdCode: condition.icdCode,
          status: condition.status,
          severity: condition.severity,
        },
        condition.onsetDate || encounter.timestamp,
        condEvidence
      ));

      edges.push(createObservedInEdge(condNodeId, encounterNodeId, condEvidence));
    }

    // Process studies and findings
    for (const study of encounter.studies) {
      const studyNodeId = generateNodeId("study", caseId, study.id);
      const studyEvidence: EvidenceRef[] = [
        { source: "dicom", id: study.id, capturedAt: study.timestamp || encounter.timestamp }
      ];

      nodes.push(createStudyNode(
        caseId,
        study.id,
        {
          modality: study.modality,
          bodyPart: study.bodyPart,
          description: study.description,
          accessionNumber: study.accessionNumber,
        },
        study.timestamp || encounter.timestamp,
        studyEvidence
      ));

      edges.push(createObservedInEdge(studyNodeId, encounterNodeId, studyEvidence));

      // Process findings
      for (const finding of study.findings) {
        const findingNodeId = generateNodeId("finding", caseId, finding.id);
        findingNodeIds.set(finding.id, findingNodeId);
        
        const findingEvidence: EvidenceRef[] = [
          { source: "dicom", id: study.id, capturedAt: study.timestamp || encounter.timestamp }
        ];

        nodes.push(createFindingNode(
          caseId,
          finding.id,
          {
            description: finding.description,
            severity: finding.severity,
            confidence: finding.confidence,
            anatomy: finding.anatomy,
            imageRef: study.id,
          },
          study.timestamp || encounter.timestamp,
          findingEvidence
        ));

        // Finding derived from study
        edges.push(createDerivedFromEdge(findingNodeId, studyNodeId, findingEvidence));

        // Create cross-modal links if enabled and crossModalRef is specified
        if (options?.createCrossModalLinks !== false && finding.crossModalRef) {
          const targetLabNodeId = labNodeIds.get(finding.crossModalRef);
          if (targetLabNodeId) {
            const crossModalEvidence: EvidenceRef[] = [
              { source: "dicom", id: study.id },
              { source: "lab", id: finding.crossModalRef },
            ];
            edges.push(createMatchesEdge(
              findingNodeId,
              targetLabNodeId,
              finding.confidence,
              crossModalEvidence
            ));
          }
        }
      }
    }

    // Process notes
    for (const note of encounter.notes) {
      const noteNodeId = generateNodeId("note", caseId, note.id);
      const noteEvidence: EvidenceRef[] = [
        { source: "note", id: note.id, capturedAt: note.timestamp || encounter.timestamp }
      ];

      nodes.push(createNoteNode(
        caseId,
        note.id,
        {
          type: note.type,
          author: note.author,
          text: note.text,
        },
        note.timestamp || encounter.timestamp,
        noteEvidence
      ));

      edges.push(createObservedInEdge(noteNodeId, encounterNodeId, noteEvidence));
    }

    // Process procedures
    for (const procedure of encounter.procedures) {
      const procNodeId = generateNodeId("procedure", caseId, procedure.id);
      const procEvidence: EvidenceRef[] = [
        { source: "synthetic", id: procedure.id, capturedAt: procedure.timestamp || encounter.timestamp }
      ];

      nodes.push(createProcedureNode(
        caseId,
        procedure.id,
        {
          name: procedure.name,
          code: procedure.code,
          status: procedure.status,
          outcome: procedure.outcome,
        },
        procedure.timestamp || encounter.timestamp,
        procEvidence
      ));

      edges.push(createObservedInEdge(procNodeId, encounterNodeId, procEvidence));
    }

    // Create medication-treats-condition edges
    // This is a simplistic approach - in reality would need NLP/clinical knowledge
    for (const [, medNodeId] of medicationNodeIds) {
      for (const [, condNodeId] of conditionNodeIds) {
        // For demo, create treats edges between medications and conditions
        // In production, would use clinical knowledge base
        edges.push(createTreatsEdge(medNodeId, condNodeId));
      }
    }

    return { nodes, edges };
  }
}

/**
 * Create a default synthetic adapter instance
 */
export function createSyntheticAdapter(): SyntheticAdapter {
  return new SyntheticAdapter();
}
