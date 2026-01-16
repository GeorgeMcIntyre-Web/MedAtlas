/**
 * Reasoning API Handlers
 *
 * Handlers for the reasoning endpoints that generate AI-powered
 * interpretations from graph data.
 */

import type { MedAtlasOutput } from "@medatlas/schemas/types";
import {
  getDefaultAdapter,
  validateOutput,
  type GraphData,
  type ReasoningInput,
} from "@medatlas/reasoning";

/**
 * Request body for /reasoning/interpret endpoint
 */
export interface InterpretRequest {
  caseId: string;
  graphId?: string;
  modalities?: string[];
  graphData?: GraphData;
}

/**
 * Response for reasoning endpoints
 */
export interface ReasoningResponse {
  success: boolean;
  data?: MedAtlasOutput;
  error?: string;
  meta?: {
    adapter: string;
    processingTimeMs: number;
    validated: boolean;
  };
}

/**
 * Reasoning status response
 */
export interface ReasoningStatusResponse {
  caseId: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: MedAtlasOutput;
  error?: string;
  createdAt?: string;
  completedAt?: string;
}

// In-memory cache for demo purposes
// In production, this would use D1 or KV storage
const reasoningCache = new Map<string, ReasoningStatusResponse>();

/**
 * Handle POST /reasoning/interpret
 *
 * Generates an interpretation from graph data using the reasoning layer.
 */
export async function handleInterpret(
  request: Request
): Promise<Response> {
  const startTime = Date.now();

  try {
    const body = await request.json() as InterpretRequest;

    // Validate request
    if (!body.caseId) {
      return jsonResponse(
        { success: false, error: "caseId is required" },
        { status: 400 }
      );
    }

    // Get graph data (from request or fetch from graph API)
    let graphData: GraphData;
    if (body.graphData) {
      graphData = body.graphData;
    } else {
      // In production, fetch from Agent 1's graph API
      // For now, generate mock graph data
      graphData = generateMockGraphData(body.caseId, body.modalities || ["synthetic"]);
    }

    // Build reasoning input
    const input: ReasoningInput = {
      caseId: body.caseId,
      graphId: body.graphId || graphData.id,
      modalities: body.modalities || graphData.modalities,
      graphData,
    };

    // Get adapter and generate interpretation
    const adapter = getDefaultAdapter();
    const result = await adapter.generateInterpretation(input);

    // Validate output
    const validationResult = validateOutput(result);
    if (!validationResult.valid) {
      console.warn("Output validation warnings:", validationResult.errors);
    }

    const processingTimeMs = Date.now() - startTime;

    // Cache result
    reasoningCache.set(body.caseId, {
      caseId: body.caseId,
      status: "completed",
      result,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });

    return jsonResponse({
      success: true,
      data: result,
      meta: {
        adapter: adapter.name,
        processingTimeMs,
        validated: validationResult.valid,
      },
    });
  } catch (error) {
    console.error("Interpretation error:", error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GET /reasoning/status/:caseId
 *
 * Gets the status of a reasoning request.
 */
export async function handleStatus(caseId: string): Promise<Response> {
  const cached = reasoningCache.get(caseId);

  if (!cached) {
    return jsonResponse(
      {
        caseId,
        status: "pending" as const,
      },
      { status: 404 }
    );
  }

  return jsonResponse(cached);
}

/**
 * Generate mock graph data for testing when no graph API is available
 */
function generateMockGraphData(
  caseId: string,
  modalities: string[]
): GraphData {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();

  return {
    id: `graph-${caseId}`,
    patientId: `patient-${caseId}`,
    modalities,
    nodes: [
      {
        id: `patient-${caseId}`,
        type: "patient",
        label: "Demo Patient",
        properties: {
          age: "45",
          gender: "Female",
        },
      },
      {
        id: `enc-${caseId}-001`,
        type: "encounter",
        label: "Emergency Department Visit",
        timestamp: yesterday,
        properties: {
          type: "emergency",
          reason: "Chest pain and shortness of breath",
        },
        evidence: [{ source: "fhir", id: `enc-${caseId}-001` }],
      },
      {
        id: `note-${caseId}-001`,
        type: "note",
        label: "ED Progress Note",
        timestamp: yesterday,
        properties: {
          text: "45-year-old female presenting with acute onset chest pain radiating to left arm. Pain described as pressure-like, 7/10 severity. Associated shortness of breath and diaphoresis. No prior cardiac history. Vitals: BP 145/92, HR 98, RR 22, SpO2 96% on RA.",
        },
        evidence: [{ source: "note", id: `note-${caseId}-001` }],
      },
      {
        id: `lab-${caseId}-001`,
        type: "lab",
        label: "Troponin I",
        timestamp: yesterday,
        properties: {
          value: 0.15,
          unit: "ng/mL",
          referenceRange: "0.00-0.04",
          interpretation: "High",
        },
        evidence: [{ source: "lab", id: `lab-${caseId}-001` }],
      },
      {
        id: `lab-${caseId}-002`,
        type: "lab",
        label: "BNP",
        timestamp: yesterday,
        properties: {
          value: 450,
          unit: "pg/mL",
          referenceRange: "0-100",
          interpretation: "High",
        },
        evidence: [{ source: "lab", id: `lab-${caseId}-002` }],
      },
      {
        id: `study-${caseId}-001`,
        type: "study",
        label: "Chest X-Ray",
        timestamp: yesterday,
        properties: {
          modality: "XR",
          bodyPart: "Chest",
          report: "Mild cardiomegaly noted. No acute pulmonary infiltrates. Small bilateral pleural effusions present.",
          findings: ["Cardiomegaly", "Bilateral pleural effusions"],
        },
        evidence: [{ source: "dicom", id: `study-${caseId}-001` }],
      },
      {
        id: `study-${caseId}-002`,
        type: "study",
        label: "ECG",
        timestamp: yesterday,
        properties: {
          modality: "ECG",
          report: "Sinus tachycardia. ST-segment depression in leads V4-V6. T-wave inversions in lateral leads.",
          findings: ["Sinus tachycardia", "ST-segment depression", "T-wave inversions"],
        },
        evidence: [{ source: "device", id: `study-${caseId}-002` }],
      },
      {
        id: `cond-${caseId}-001`,
        type: "condition",
        label: "Hypertension",
        timestamp: "2020-01-15",
        properties: {
          status: "active",
          code: "I10",
        },
        evidence: [{ source: "fhir", id: `cond-${caseId}-001` }],
      },
      {
        id: `med-${caseId}-001`,
        type: "medication",
        label: "Lisinopril",
        properties: {
          dosage: "10mg daily",
          route: "oral",
        },
        evidence: [{ source: "fhir", id: `med-${caseId}-001` }],
      },
      {
        id: `finding-${caseId}-001`,
        type: "finding",
        label: "Elevated cardiac biomarkers suggesting myocardial injury",
        properties: {
          probability: 0.85,
        },
        evidence: [
          { source: "lab", id: `lab-${caseId}-001` },
          { source: "lab", id: `lab-${caseId}-002` },
        ],
      },
    ],
    edges: [
      {
        id: `edge-${caseId}-001`,
        source: `enc-${caseId}-001`,
        target: `patient-${caseId}`,
        type: "observed-in",
      },
      {
        id: `edge-${caseId}-002`,
        source: `note-${caseId}-001`,
        target: `enc-${caseId}-001`,
        type: "derived-from",
      },
      {
        id: `edge-${caseId}-003`,
        source: `lab-${caseId}-001`,
        target: `enc-${caseId}-001`,
        type: "observed-in",
      },
      {
        id: `edge-${caseId}-004`,
        source: `lab-${caseId}-002`,
        target: `enc-${caseId}-001`,
        type: "observed-in",
      },
      {
        id: `edge-${caseId}-005`,
        source: `study-${caseId}-001`,
        target: `enc-${caseId}-001`,
        type: "observed-in",
      },
      {
        id: `edge-${caseId}-006`,
        source: `finding-${caseId}-001`,
        target: `lab-${caseId}-001`,
        type: "derived-from",
        confidence: 0.9,
      },
      {
        id: `edge-${caseId}-007`,
        source: `finding-${caseId}-001`,
        target: `lab-${caseId}-002`,
        type: "supports",
        confidence: 0.85,
      },
      {
        id: `edge-${caseId}-008`,
        source: `study-${caseId}-002`,
        target: `finding-${caseId}-001`,
        type: "supports",
        confidence: 0.8,
      },
    ],
    metadata: {
      createdAt: now,
      nodeCount: 10,
      edgeCount: 8,
    },
  };
}

/**
 * Helper to create JSON responses
 */
function jsonResponse(
  data: unknown,
  init?: ResponseInit
): Response {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
  });
}
