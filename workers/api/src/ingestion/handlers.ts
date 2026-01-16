/**
 * Ingestion API Handlers
 * 
 * Handlers for data ingestion endpoints. These transform incoming data
 * into Atlas Graph structure and return the result.
 */

import type { EvidenceRef } from "@medatlas/schemas/types";

// Re-define types inline to avoid import issues with Cloudflare Workers
// These match the types from @medatlas/ingestion

type NodeType =
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

type EdgeType =
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

interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  properties: Record<string, unknown>;
  evidence: EvidenceRef[];
  timestamp?: string;
  createdAt: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label: string;
  properties: Record<string, unknown>;
  evidence: EvidenceRef[];
  createdAt: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface IngestionResult {
  caseId: string;
  graphId: string;
  nodesCreated: number;
  edgesCreated: number;
  ingestedAt: string;
  warnings?: string[];
  error?: string;
}

interface SyntheticCase {
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

interface SyntheticEncounter {
  id: string;
  type: "ED" | "outpatient" | "inpatient" | "virtual";
  timestamp: string;
  reason?: string;
  observations?: Array<{ id: string; type: string; value: unknown; text?: string; timestamp?: string }>;
  labs?: Array<{ id: string; name: string; code?: string; value: number; unit: string; referenceRange?: { low?: number; high?: number }; interpretation?: string; timestamp?: string }>;
  vitals?: Array<{ id: string; name: string; value: number; unit: string; timestamp?: string }>;
  medications?: Array<{ id: string; name: string; dosage?: string; route?: string; frequency?: string; status: "active" | "completed" | "stopped"; startDate?: string }>;
  conditions?: Array<{ id: string; code?: string; icdCode?: string; name: string; status: "active" | "resolved" | "inactive"; severity?: "mild" | "moderate" | "severe"; onsetDate?: string }>;
  studies?: Array<{ id: string; modality: "CT" | "MRI" | "XR" | "US" | "PET" | "other"; bodyPart?: string; description?: string; accessionNumber?: string; findings: Array<{ id: string; description: string; severity?: string; confidence?: number; anatomy?: string; crossModalRef?: string }>; timestamp?: string }>;
  notes?: Array<{ id: string; type: "progress" | "admission" | "discharge" | "consult" | "procedure"; author?: string; text: string; timestamp?: string }>;
  procedures?: Array<{ id: string; name: string; code?: string; status: "completed" | "cancelled"; outcome?: string; timestamp?: string }>;
}

/**
 * Generate node ID
 */
function generateNodeId(type: string, caseId: string, entityId: string): string {
  return `${type}-${caseId}-${entityId}`;
}

/**
 * Generate edge ID
 */
function generateEdgeId(sourceId: string, targetId: string, type: string): string {
  return `edge-${sourceId}-${targetId}-${type}`;
}

/**
 * Get current timestamp
 */
function now(): string {
  return new Date().toISOString();
}

/**
 * Transform synthetic case to graph data
 */
function transformSyntheticCase(syntheticCase: SyntheticCase): GraphData {
  const { caseId, patient, encounters } = syntheticCase;
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Create patient node
  const patientNodeId = generateNodeId("patient", caseId, patient.id);
  nodes.push({
    id: patientNodeId,
    type: "patient",
    label: `Patient ${patient.id}`,
    properties: { patientId: patient.id, ...patient.demographics },
    evidence: [{ source: "synthetic", id: patient.id }],
    createdAt: now(),
  });

  // Track encounter node IDs for temporal edges
  const encounterNodeIds: { id: string; timestamp: string }[] = [];

  // Process each encounter
  for (const encounter of encounters) {
    const encounterNodeId = generateNodeId("encounter", caseId, encounter.id);
    encounterNodeIds.push({ id: encounterNodeId, timestamp: encounter.timestamp });

    // Create encounter node
    nodes.push({
      id: encounterNodeId,
      type: "encounter",
      label: `${encounter.type} Visit`,
      properties: { encounterId: encounter.id, type: encounter.type, reason: encounter.reason, status: "finished" },
      evidence: [{ source: "synthetic", id: encounter.id, capturedAt: encounter.timestamp }],
      timestamp: encounter.timestamp,
      createdAt: now(),
    });

    // Link encounter to patient
    edges.push({
      id: generateEdgeId(encounterNodeId, patientNodeId, "observed-in"),
      source: encounterNodeId,
      target: patientNodeId,
      type: "observed-in",
      label: "observed in",
      properties: {},
      evidence: [{ source: "synthetic", id: encounter.id }],
      createdAt: now(),
    });

    // Track lab nodes for cross-modal links
    const labNodeIds = new Map<string, string>();

    // Process labs
    for (const lab of encounter.labs || []) {
      const labNodeId = generateNodeId("lab", caseId, lab.id);
      labNodeIds.set(lab.id, labNodeId);
      
      nodes.push({
        id: labNodeId,
        type: "lab",
        label: lab.name,
        properties: {
          labId: lab.id,
          name: lab.name,
          code: lab.code,
          value: lab.value,
          unit: lab.unit,
          referenceRange: lab.referenceRange,
          interpretation: lab.interpretation,
        },
        evidence: [{ source: "lab", id: lab.id, capturedAt: lab.timestamp || encounter.timestamp }],
        timestamp: lab.timestamp || encounter.timestamp,
        createdAt: now(),
      });
      
      edges.push({
        id: generateEdgeId(labNodeId, encounterNodeId, "observed-in"),
        source: labNodeId,
        target: encounterNodeId,
        type: "observed-in",
        label: "observed in",
        properties: {},
        evidence: [{ source: "lab", id: lab.id }],
        createdAt: now(),
      });
    }

    // Process vitals
    for (const vital of encounter.vitals || []) {
      const vitalNodeId = generateNodeId("vital", caseId, vital.id);
      
      nodes.push({
        id: vitalNodeId,
        type: "vital",
        label: vital.name,
        properties: { vitalId: vital.id, name: vital.name, value: vital.value, unit: vital.unit },
        evidence: [{ source: "synthetic", id: vital.id, capturedAt: vital.timestamp || encounter.timestamp }],
        timestamp: vital.timestamp || encounter.timestamp,
        createdAt: now(),
      });
      
      edges.push({
        id: generateEdgeId(vitalNodeId, encounterNodeId, "observed-in"),
        source: vitalNodeId,
        target: encounterNodeId,
        type: "observed-in",
        label: "observed in",
        properties: {},
        evidence: [{ source: "synthetic", id: vital.id }],
        createdAt: now(),
      });
    }

    // Process observations
    for (const obs of encounter.observations || []) {
      const obsNodeId = generateNodeId("observation", caseId, obs.id);
      
      nodes.push({
        id: obsNodeId,
        type: "observation",
        label: obs.type,
        properties: { observationId: obs.id, observationType: obs.type, value: obs.value, text: obs.text },
        evidence: [{ source: "synthetic", id: obs.id, capturedAt: obs.timestamp || encounter.timestamp }],
        timestamp: obs.timestamp || encounter.timestamp,
        createdAt: now(),
      });
      
      edges.push({
        id: generateEdgeId(obsNodeId, encounterNodeId, "observed-in"),
        source: obsNodeId,
        target: encounterNodeId,
        type: "observed-in",
        label: "observed in",
        properties: {},
        evidence: [{ source: "synthetic", id: obs.id }],
        createdAt: now(),
      });
    }

    // Process medications
    for (const med of encounter.medications || []) {
      const medNodeId = generateNodeId("medication", caseId, med.id);
      
      nodes.push({
        id: medNodeId,
        type: "medication",
        label: med.name,
        properties: {
          medicationId: med.id,
          name: med.name,
          dosage: med.dosage,
          route: med.route,
          frequency: med.frequency,
          status: med.status,
        },
        evidence: [{ source: "synthetic", id: med.id, capturedAt: med.startDate || encounter.timestamp }],
        timestamp: med.startDate || encounter.timestamp,
        createdAt: now(),
      });
      
      edges.push({
        id: generateEdgeId(medNodeId, encounterNodeId, "observed-in"),
        source: medNodeId,
        target: encounterNodeId,
        type: "observed-in",
        label: "observed in",
        properties: {},
        evidence: [{ source: "synthetic", id: med.id }],
        createdAt: now(),
      });
    }

    // Process conditions
    for (const condition of encounter.conditions || []) {
      const condNodeId = generateNodeId("condition", caseId, condition.id);
      
      nodes.push({
        id: condNodeId,
        type: "condition",
        label: condition.name,
        properties: {
          conditionId: condition.id,
          name: condition.name,
          code: condition.code,
          icdCode: condition.icdCode,
          status: condition.status,
          severity: condition.severity,
        },
        evidence: [{ source: "synthetic", id: condition.id, capturedAt: condition.onsetDate || encounter.timestamp }],
        timestamp: condition.onsetDate || encounter.timestamp,
        createdAt: now(),
      });
      
      edges.push({
        id: generateEdgeId(condNodeId, encounterNodeId, "observed-in"),
        source: condNodeId,
        target: encounterNodeId,
        type: "observed-in",
        label: "observed in",
        properties: {},
        evidence: [{ source: "synthetic", id: condition.id }],
        createdAt: now(),
      });
    }

    // Process studies and findings
    for (const study of encounter.studies || []) {
      const studyNodeId = generateNodeId("study", caseId, study.id);
      
      nodes.push({
        id: studyNodeId,
        type: "study",
        label: `${study.modality} ${study.bodyPart || "Study"}`,
        properties: {
          studyId: study.id,
          modality: study.modality,
          bodyPart: study.bodyPart,
          description: study.description,
          accessionNumber: study.accessionNumber,
        },
        evidence: [{ source: "dicom", id: study.id, capturedAt: study.timestamp || encounter.timestamp }],
        timestamp: study.timestamp || encounter.timestamp,
        createdAt: now(),
      });
      
      edges.push({
        id: generateEdgeId(studyNodeId, encounterNodeId, "observed-in"),
        source: studyNodeId,
        target: encounterNodeId,
        type: "observed-in",
        label: "observed in",
        properties: {},
        evidence: [{ source: "dicom", id: study.id }],
        createdAt: now(),
      });

      // Process findings
      for (const finding of study.findings) {
        const findingNodeId = generateNodeId("finding", caseId, finding.id);
        
        nodes.push({
          id: findingNodeId,
          type: "finding",
          label: finding.description,
          properties: {
            findingId: finding.id,
            description: finding.description,
            severity: finding.severity,
            confidence: finding.confidence,
            anatomy: finding.anatomy,
            imageRef: study.id,
          },
          evidence: [{ source: "dicom", id: study.id, capturedAt: study.timestamp || encounter.timestamp }],
          timestamp: study.timestamp || encounter.timestamp,
          createdAt: now(),
        });
        
        // Finding derived from study
        edges.push({
          id: generateEdgeId(findingNodeId, studyNodeId, "derived-from"),
          source: findingNodeId,
          target: studyNodeId,
          type: "derived-from",
          label: "derived from",
          properties: {},
          evidence: [{ source: "dicom", id: study.id }],
          createdAt: now(),
        });

        // Cross-modal link if specified
        if (finding.crossModalRef) {
          const targetLabNodeId = labNodeIds.get(finding.crossModalRef);
          if (targetLabNodeId) {
            edges.push({
              id: generateEdgeId(findingNodeId, targetLabNodeId, "matches"),
              source: findingNodeId,
              target: targetLabNodeId,
              type: "matches",
              label: "matches",
              properties: { confidence: finding.confidence },
              evidence: [
                { source: "dicom", id: study.id },
                { source: "lab", id: finding.crossModalRef },
              ],
              createdAt: now(),
            });
          }
        }
      }
    }

    // Process notes
    for (const note of encounter.notes || []) {
      const noteNodeId = generateNodeId("note", caseId, note.id);
      const excerpt = note.text.length > 200 ? note.text.substring(0, 200) + "..." : note.text;
      
      nodes.push({
        id: noteNodeId,
        type: "note",
        label: `${note.type} Note`,
        properties: {
          noteId: note.id,
          type: note.type,
          author: note.author,
          text: note.text,
          excerpt,
        },
        evidence: [{ source: "note", id: note.id, capturedAt: note.timestamp || encounter.timestamp }],
        timestamp: note.timestamp || encounter.timestamp,
        createdAt: now(),
      });
      
      edges.push({
        id: generateEdgeId(noteNodeId, encounterNodeId, "observed-in"),
        source: noteNodeId,
        target: encounterNodeId,
        type: "observed-in",
        label: "observed in",
        properties: {},
        evidence: [{ source: "note", id: note.id }],
        createdAt: now(),
      });
    }

    // Process procedures
    for (const procedure of encounter.procedures || []) {
      const procNodeId = generateNodeId("procedure", caseId, procedure.id);
      
      nodes.push({
        id: procNodeId,
        type: "procedure",
        label: procedure.name,
        properties: {
          procedureId: procedure.id,
          name: procedure.name,
          code: procedure.code,
          status: procedure.status,
          outcome: procedure.outcome,
        },
        evidence: [{ source: "synthetic", id: procedure.id, capturedAt: procedure.timestamp || encounter.timestamp }],
        timestamp: procedure.timestamp || encounter.timestamp,
        createdAt: now(),
      });
      
      edges.push({
        id: generateEdgeId(procNodeId, encounterNodeId, "observed-in"),
        source: procNodeId,
        target: encounterNodeId,
        type: "observed-in",
        label: "observed in",
        properties: {},
        evidence: [{ source: "synthetic", id: procedure.id }],
        createdAt: now(),
      });
    }
  }

  // Create temporal edges between encounters
  const sortedEncounters = [...encounterNodeIds].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  for (let i = 0; i < sortedEncounters.length - 1; i++) {
    edges.push({
      id: generateEdgeId(sortedEncounters[i].id, sortedEncounters[i + 1].id, "precedes"),
      source: sortedEncounters[i].id,
      target: sortedEncounters[i + 1].id,
      type: "precedes",
      label: "precedes",
      properties: {},
      evidence: [],
      createdAt: now(),
    });
  }

  return { nodes, edges };
}

/**
 * Sample synthetic case for demo generation
 */
function generateSampleCase(caseId: string): SyntheticCase {
  const timestamp = new Date().toISOString();
  
  return {
    caseId,
    patient: {
      id: `patient-${caseId}`,
      demographics: {
        age: 45,
        gender: "female",
        birthDate: "1979-03-15",
        mrn: `MRN-${caseId}`,
      },
    },
    encounters: [
      {
        id: `enc-${caseId}-001`,
        type: "ED",
        timestamp,
        reason: "Demo encounter",
        observations: [
          {
            id: `obs-${caseId}-001`,
            type: "chief_complaint",
            value: "Demo symptom",
            text: "Patient presents for demo purposes",
            timestamp,
          },
        ],
        labs: [
          {
            id: `lab-${caseId}-001`,
            name: "Demo Lab",
            code: "0000-0",
            value: 10.0,
            unit: "units",
            referenceRange: { low: 5, high: 15 },
            interpretation: "normal",
            timestamp,
          },
        ],
        vitals: [
          {
            id: `vital-${caseId}-001`,
            name: "Heart Rate",
            value: 72,
            unit: "bpm",
            timestamp,
          },
        ],
        medications: [],
        conditions: [],
        studies: [],
        notes: [
          {
            id: `note-${caseId}-001`,
            type: "progress",
            author: "Demo Physician",
            text: "This is a demo progress note for testing purposes.",
            timestamp,
          },
        ],
        procedures: [],
      },
    ],
  };
}

/**
 * Handle POST /ingestion/synthetic
 * Generate and ingest a synthetic case
 */
export async function handleSyntheticIngestion(request: Request): Promise<Response> {
  try {
    let syntheticCase: SyntheticCase;
    
    // Check if case data is provided in request body
    const contentType = request.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const body = await request.json() as Record<string, unknown>;
      if (body && typeof body === "object" && "caseId" in body && "patient" in body) {
        syntheticCase = body as unknown as SyntheticCase;
      } else {
        // Generate a new sample case
        const caseId = typeof body?.caseId === "string" ? body.caseId : `demo-${Date.now()}`;
        syntheticCase = generateSampleCase(caseId);
      }
    } else {
      // Generate a new sample case
      syntheticCase = generateSampleCase(`demo-${Date.now()}`);
    }

    // Transform to graph
    const graphData = transformSyntheticCase(syntheticCase);
    
    const result: IngestionResult = {
      caseId: syntheticCase.caseId,
      graphId: `graph-${syntheticCase.caseId}`,
      nodesCreated: graphData.nodes.length,
      edgesCreated: graphData.edges.length,
      ingestedAt: now(),
    };

    return new Response(JSON.stringify({
      result,
      graph: graphData,
    }, null, 2), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({
      error: "Ingestion failed",
      message,
    }, null, 2), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}

/**
 * Handle POST /ingestion/fhir
 * Ingest a FHIR bundle (simplified implementation)
 */
export async function handleFHIRIngestion(request: Request): Promise<Response> {
  try {
    const body = await request.json() as Record<string, unknown>;
    
    // Validate it looks like a FHIR bundle
    if (!body || body.resourceType !== "Bundle" || !Array.isArray(body.entry)) {
      return new Response(JSON.stringify({
        error: "Invalid FHIR Bundle",
        message: "Request body must be a valid FHIR Bundle with resourceType and entry array",
      }, null, 2), {
        status: 400,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const entries = body.entry as unknown[];

    // For now, return a placeholder response
    // Full FHIR transformation would require the FHIR adapter from the ingestion package
    const caseId = `fhir-${Date.now()}`;
    
    const result: IngestionResult = {
      caseId,
      graphId: `graph-${caseId}`,
      nodesCreated: entries.length,
      edgesCreated: 0,
      ingestedAt: now(),
      warnings: ["Full FHIR transformation requires @medatlas/ingestion package integration"],
    };

    return new Response(JSON.stringify({
      result,
      message: "FHIR ingestion endpoint ready. Full transformation pending package integration.",
    }, null, 2), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({
      error: "FHIR ingestion failed",
      message,
    }, null, 2), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}

/**
 * Handle GET /ingestion/status/:caseId
 * Get ingestion status for a case
 */
export async function handleIngestionStatus(caseId: string): Promise<Response> {
  // In a real implementation, this would query a database
  // For now, return a placeholder response
  return new Response(JSON.stringify({
    caseId,
    status: "completed",
    message: "Ingestion status endpoint ready. Requires graph storage integration.",
  }, null, 2), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
