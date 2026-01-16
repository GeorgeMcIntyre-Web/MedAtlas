import type { MedAtlasOutput } from "@medatlas/schemas/types";
import type { ReasoningInput, GraphData, GraphNode, GraphEdge } from "@medatlas/reasoning/types";
import { createMockAdapter } from "@medatlas/reasoning/mock-adapter";
import { validateOutput } from "@medatlas/reasoning/output-validator";

/**
 * Helper to create JSON responses
 */
const json = (value: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(value, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      ...(init?.headers ?? {}),
    },
  });

/**
 * Generate sample graph data for demo purposes
 * In production, this would fetch from Agent 1's Graph API
 */
function generateSampleGraphData(caseId: string): GraphData {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const nodes: GraphNode[] = [
    {
      id: "patient-001",
      type: "patient",
      label: "Demo Patient",
      data: { age: 65, gender: "male" },
      evidence: [{ source: "synthetic", id: "patient-001" }],
    },
    {
      id: "encounter-001",
      type: "encounter",
      label: "Emergency Department Visit",
      timestamp: twoWeeksAgo.toISOString(),
      data: { type: "emergency", department: "ED" },
      evidence: [{ source: "fhir", id: "encounter-001" }],
    },
    {
      id: "encounter-002",
      type: "encounter",
      label: "Follow-up Outpatient Visit",
      timestamp: oneWeekAgo.toISOString(),
      data: { type: "outpatient", department: "Cardiology" },
      evidence: [{ source: "fhir", id: "encounter-002" }],
    },
    {
      id: "condition-001",
      type: "condition",
      label: "Chest Pain",
      timestamp: twoWeeksAgo.toISOString(),
      data: { status: "active", severity: "moderate" },
      evidence: [{ source: "fhir", id: "condition-001" }],
    },
    {
      id: "condition-002",
      type: "condition",
      label: "Hypertension",
      timestamp: twoWeeksAgo.toISOString(),
      data: { status: "active", severity: "mild" },
      evidence: [{ source: "fhir", id: "condition-002" }],
    },
    {
      id: "lab-001",
      type: "lab",
      label: "Troponin I",
      timestamp: twoWeeksAgo.toISOString(),
      data: { value: 0.04, unit: "ng/mL", referenceRange: "< 0.04", abnormal: true },
      evidence: [{ source: "lab", id: "lab-001" }],
    },
    {
      id: "lab-002",
      type: "lab",
      label: "BNP",
      timestamp: twoWeeksAgo.toISOString(),
      data: { value: 450, unit: "pg/mL", referenceRange: "< 100", abnormal: true },
      evidence: [{ source: "lab", id: "lab-002" }],
    },
    {
      id: "lab-003",
      type: "lab",
      label: "Hemoglobin",
      timestamp: twoWeeksAgo.toISOString(),
      data: { value: 13.5, unit: "g/dL", referenceRange: "12.0-16.0" },
      evidence: [{ source: "lab", id: "lab-003" }],
    },
    {
      id: "study-001",
      type: "study",
      label: "Chest X-Ray",
      timestamp: twoWeeksAgo.toISOString(),
      data: {
        modality: "XR",
        bodyPart: "Chest",
        findings: ["Cardiomegaly", "Mild pulmonary congestion"],
      },
      evidence: [{ source: "dicom", id: "study-001" }],
    },
    {
      id: "study-002",
      type: "study",
      label: "Echocardiogram",
      timestamp: oneWeekAgo.toISOString(),
      data: {
        modality: "US",
        bodyPart: "Heart",
        findings: ["Reduced ejection fraction (40%)", "Left ventricular hypertrophy"],
      },
      evidence: [{ source: "dicom", id: "study-002" }],
    },
    {
      id: "medication-001",
      type: "medication",
      label: "Lisinopril",
      timestamp: twoWeeksAgo.toISOString(),
      data: { dosage: 10, unit: "mg", frequency: "daily" },
      evidence: [{ source: "fhir", id: "medication-001" }],
    },
    {
      id: "medication-002",
      type: "medication",
      label: "Metoprolol",
      timestamp: twoWeeksAgo.toISOString(),
      data: { dosage: 25, unit: "mg", frequency: "twice daily" },
      evidence: [{ source: "fhir", id: "medication-002" }],
    },
    {
      id: "finding-001",
      type: "finding",
      label: "Elevated cardiac biomarkers",
      timestamp: twoWeeksAgo.toISOString(),
      data: { probability: 0.95, notable: true, category: "cardiac" },
      evidence: [
        { source: "lab", id: "lab-001" },
        { source: "lab", id: "lab-002" },
      ],
    },
    {
      id: "finding-002",
      type: "finding",
      label: "Cardiomegaly on imaging",
      timestamp: twoWeeksAgo.toISOString(),
      data: { probability: 0.88, notable: true, anatomy: "heart", category: "imaging" },
      evidence: [{ source: "dicom", id: "study-001" }],
    },
    {
      id: "finding-003",
      type: "finding",
      label: "Reduced left ventricular function",
      timestamp: oneWeekAgo.toISOString(),
      data: { probability: 0.92, notable: true, anatomy: "left ventricle", category: "cardiac" },
      evidence: [{ source: "dicom", id: "study-002" }],
    },
    {
      id: "note-001",
      type: "note",
      label: "ED Admission Note",
      timestamp: twoWeeksAgo.toISOString(),
      data: {
        excerpt: "65 y/o male presenting with acute chest pain radiating to left arm. History of hypertension.",
      },
      evidence: [{ source: "note", id: "note-001" }],
    },
  ];

  const edges: GraphEdge[] = [
    { id: "e1", source: "encounter-001", target: "patient-001", relationship: "part-of" },
    { id: "e2", source: "encounter-002", target: "patient-001", relationship: "part-of" },
    { id: "e3", source: "condition-001", target: "encounter-001", relationship: "observed-in" },
    { id: "e4", source: "condition-002", target: "encounter-001", relationship: "observed-in" },
    { id: "e5", source: "lab-001", target: "encounter-001", relationship: "observed-in" },
    { id: "e6", source: "lab-002", target: "encounter-001", relationship: "observed-in" },
    { id: "e7", source: "lab-003", target: "encounter-001", relationship: "observed-in" },
    { id: "e8", source: "study-001", target: "encounter-001", relationship: "observed-in" },
    { id: "e9", source: "study-002", target: "encounter-002", relationship: "observed-in" },
    { id: "e10", source: "finding-001", target: "lab-001", relationship: "derived-from" },
    { id: "e11", source: "finding-001", target: "lab-002", relationship: "derived-from" },
    { id: "e12", source: "finding-002", target: "study-001", relationship: "derived-from" },
    { id: "e13", source: "finding-003", target: "study-002", relationship: "derived-from" },
    { id: "e14", source: "finding-002", target: "finding-003", relationship: "supports" },
    { id: "e15", source: "note-001", target: "encounter-001", relationship: "part-of" },
    { id: "e16", source: "medication-001", target: "condition-002", relationship: "related-to" },
    { id: "e17", source: "medication-002", target: "condition-001", relationship: "related-to" },
  ];

  return {
    graphId: `graph-${caseId}`,
    patientId: "patient-001",
    nodes,
    edges,
    modalities: ["fhir", "lab", "dicom", "note", "synthetic"],
    metadata: {
      createdAt: now.toISOString(),
      version: "1.0.0",
    },
  };
}

/**
 * POST /reasoning/interpret
 * Generate interpretation from graph data
 */
export async function handleInterpret(request: Request): Promise<Response> {
  try {
    // Parse request body
    let body: { caseId?: string; graphId?: string; modalities?: string[]; graphData?: GraphData };
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const caseId = body.caseId ?? "demo-001";
    const modalities = body.modalities ?? ["synthetic"];

    // Get graph data - use provided data or generate sample
    let graphData: GraphData;
    if (body.graphData) {
      graphData = body.graphData;
    } else {
      // In production, this would fetch from Agent 1's Graph API
      graphData = generateSampleGraphData(caseId);
    }

    // Create reasoning input
    const input: ReasoningInput = {
      caseId,
      graphId: body.graphId ?? graphData.graphId,
      modalities: graphData.modalities,
      graphData,
    };

    // Create mock adapter and generate interpretation
    const adapter = createMockAdapter();
    const output = await adapter.generateInterpretation(input);

    // Validate output
    const validation = validateOutput(output);
    if (!validation.valid) {
      return json(
        {
          error: "Generated output failed validation",
          validationErrors: validation.errors,
        },
        { status: 500 }
      );
    }

    return json(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, { status: 500 });
  }
}

/**
 * GET /reasoning/status/:caseId
 * Get reasoning status for a case
 */
export async function handleReasoningStatus(caseId: string): Promise<Response> {
  // For demo, always return completed status
  return json({
    caseId,
    status: "completed",
    message: "Reasoning complete (mock adapter)",
    completedAt: new Date().toISOString(),
  });
}

/**
 * GET /demo/case/:caseId
 * Full demo endpoint - orchestrates graph → reasoning → output
 */
export async function handleDemoCase(caseId: string): Promise<Response> {
  try {
    // Generate sample graph data
    const graphData = generateSampleGraphData(caseId);

    // Create reasoning input
    const input: ReasoningInput = {
      caseId,
      graphId: graphData.graphId,
      modalities: graphData.modalities,
      graphData,
    };

    // Generate interpretation
    const adapter = createMockAdapter();
    const output = await adapter.generateInterpretation(input);

    return json(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, { status: 500 });
  }
}

/**
 * GET /demo/cases
 * List available demo cases
 */
export async function handleListDemoCases(): Promise<Response> {
  const cases = [
    {
      caseId: "demo-001",
      title: "Cardiac Case - Chest Pain Workup",
      description: "65 y/o male with acute chest pain, elevated cardiac biomarkers, and cardiomegaly",
      modalities: ["fhir", "lab", "dicom", "note"],
    },
    {
      caseId: "demo-002",
      title: "Respiratory Case - Pneumonia",
      description: "Synthetic respiratory case with imaging findings",
      modalities: ["fhir", "lab", "dicom"],
    },
  ];

  return json({ cases });
}

/**
 * POST /demo/generate
 * Generate a new demo case (synthetic data)
 */
export async function handleGenerateDemoCase(request: Request): Promise<Response> {
  try {
    let body: { caseType?: string };
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const caseId = `generated-${Date.now()}`;
    const graphData = generateSampleGraphData(caseId);

    // Generate interpretation
    const adapter = createMockAdapter();
    const input: ReasoningInput = {
      caseId,
      graphId: graphData.graphId,
      modalities: graphData.modalities,
      graphData,
    };

    const output = await adapter.generateInterpretation(input);

    return json({
      caseId,
      graphId: graphData.graphId,
      nodesCreated: graphData.nodes.length,
      edgesCreated: graphData.edges.length,
      interpretation: output,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, { status: 500 });
  }
}
