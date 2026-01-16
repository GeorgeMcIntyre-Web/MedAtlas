/**
 * Demo API handlers.
 * Complete demo endpoints that orchestrate the full MedAtlas flow.
 */

import {
  AtlasGraph,
  getGlobalStorage,
  getOrCreateGraph,
  NodeFactory,
  EdgeFactory,
  type GraphNode,
} from "@medatlas/graph";
import {
  MockModelAdapter,
  validateOutput,
  type MedAtlasOutput,
} from "@medatlas/reasoning";

const mockAdapter = new MockModelAdapter();

/**
 * Helper to create JSON responses.
 */
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

/**
 * Helper to create error responses.
 */
function errorResponse(message: string, status = 400): Response {
  return json({ error: message }, status);
}

/**
 * Demo case IDs available.
 */
const DEMO_CASES = [
  { id: "demo-001", name: "Synthetic Pulmonary Case", description: "CT with nodule finding" },
  { id: "demo-002", name: "Lab Correlation Case", description: "Labs with clinical notes" },
  { id: "demo-003", name: "Multi-Modal Case", description: "Imaging + labs + notes" },
];

/**
 * GET /demo/cases - List available demo cases
 */
export async function handleListCases(request: Request): Promise<Response> {
  return json({
    cases: DEMO_CASES,
    total: DEMO_CASES.length,
  });
}

/**
 * GET /demo/case/:caseId - Get complete demo case with interpretation
 */
export async function handleGetCase(
  request: Request,
  caseId: string
): Promise<Response> {
  try {
    const storage = getGlobalStorage();
    const graphId = `demo-graph-${caseId}`;

    // Try to load existing graph
    let graph = await storage.load(graphId);

    // If no graph, generate demo data
    if (!graph) {
      graph = await generateDemoGraph(caseId, graphId);
      await storage.save(graph);
    }

    // Generate interpretation
    const graphData = graph.serialize();
    const output = await mockAdapter.generateInterpretation({
      caseId,
      graphId,
      modalities: [],
      graphData,
    });

    // Validate output
    const validation = validateOutput(output);

    return json({
      caseId,
      graphId,
      graph: {
        nodeCount: graph.nodeCount,
        edgeCount: graph.edgeCount,
        nodes: graph.getAllNodes(),
        edges: graph.getAllEdges(),
      },
      interpretation: output,
      validation: {
        valid: validation.valid,
        warnings: validation.warnings,
      },
    });
  } catch (error) {
    return errorResponse(`Failed to get demo case: ${(error as Error).message}`, 500);
  }
}

/**
 * POST /demo/generate - Generate a new demo case
 */
export async function handleGenerateCase(request: Request): Promise<Response> {
  try {
    const body = await request.json() as {
      caseId?: string;
      type?: "simple" | "complex" | "multimodal";
    };

    const caseId = body.caseId ?? `demo-${Date.now()}`;
    const graphId = `demo-graph-${caseId}`;
    const type = body.type ?? "simple";

    // Generate graph based on type
    let graph: AtlasGraph;
    switch (type) {
      case "complex":
        graph = await generateComplexDemoGraph(caseId, graphId);
        break;
      case "multimodal":
        graph = await generateMultimodalDemoGraph(caseId, graphId);
        break;
      default:
        graph = await generateDemoGraph(caseId, graphId);
    }

    // Save the graph
    const storage = getGlobalStorage();
    await storage.save(graph);

    // Generate interpretation
    const graphData = graph.serialize();
    const output = await mockAdapter.generateInterpretation({
      caseId,
      graphId,
      modalities: [],
      graphData,
    });

    return json({
      caseId,
      graphId,
      type,
      graph: {
        nodeCount: graph.nodeCount,
        edgeCount: graph.edgeCount,
      },
      interpretation: output,
    }, 201);
  } catch (error) {
    return errorResponse(`Failed to generate demo case: ${(error as Error).message}`, 500);
  }
}

/**
 * Generate a simple demo graph.
 */
async function generateDemoGraph(caseId: string, graphId: string): Promise<AtlasGraph> {
  const graph = new AtlasGraph(graphId);
  const patientId = `patient-${caseId}`;
  const baseDate = new Date("2025-01-15");

  // Add patient
  graph.addNode(NodeFactory.patient(patientId, "Demo Patient", {
    age: 55,
    gender: "female",
  }));

  // Add encounter
  const encounterId = `encounter-${caseId}-001`;
  graph.addNode(NodeFactory.encounter(
    encounterId,
    "Outpatient Visit",
    patientId,
    baseDate.toISOString(),
    { type: "outpatient", reason: "Follow-up" },
    [{ source: "synthetic", id: encounterId }]
  ));

  // Add lab results
  const labId = `lab-${caseId}-001`;
  graph.addNode(NodeFactory.lab(
    labId,
    "Complete Blood Count",
    patientId,
    baseDate.toISOString(),
    12.5,
    "g/dL",
    { test: "hemoglobin", status: "normal" },
    [{ source: "lab", id: labId }]
  ));

  // Add clinical note
  const noteId = `note-${caseId}-001`;
  graph.addNode(NodeFactory.note(
    noteId,
    "Progress Note",
    patientId,
    baseDate.toISOString(),
    { summary: "Patient reports feeling well. No new symptoms." },
    [{ source: "note", id: noteId }]
  ));

  // Add finding
  const findingId = `finding-${caseId}-001`;
  graph.addNode(NodeFactory.finding(
    findingId,
    "Stable condition",
    patientId,
    baseDate.toISOString(),
    0.85,
    { category: "assessment" },
    [{ source: "synthetic", id: findingId }]
  ));

  // Add edges
  graph.addEdge(EdgeFactory.belongsTo(`edge-${caseId}-001`, encounterId, patientId));
  graph.addEdge(EdgeFactory.belongsTo(`edge-${caseId}-002`, labId, patientId));
  graph.addEdge(EdgeFactory.belongsTo(`edge-${caseId}-003`, noteId, patientId));
  graph.addEdge(EdgeFactory.observedIn(`edge-${caseId}-004`, labId, encounterId));
  graph.addEdge(EdgeFactory.hasFinding(`edge-${caseId}-005`, noteId, findingId));

  return graph;
}

/**
 * Generate a complex demo graph with more data points.
 */
async function generateComplexDemoGraph(caseId: string, graphId: string): Promise<AtlasGraph> {
  const graph = new AtlasGraph(graphId);
  const patientId = `patient-${caseId}`;
  const baseDate = new Date("2025-01-10");

  // Add patient
  graph.addNode(NodeFactory.patient(patientId, "Complex Demo Patient", {
    age: 67,
    gender: "male",
    conditions: ["hypertension", "type 2 diabetes"],
  }));

  // Add multiple encounters
  for (let i = 0; i < 3; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i * 7);
    const encounterId = `encounter-${caseId}-${i.toString().padStart(3, "0")}`;
    
    graph.addNode(NodeFactory.encounter(
      encounterId,
      `Visit ${i + 1}`,
      patientId,
      date.toISOString(),
      { type: "outpatient", visitNumber: i + 1 },
      [{ source: "synthetic", id: encounterId }]
    ));
    
    graph.addEdge(EdgeFactory.belongsTo(`edge-enc-${caseId}-${i}`, encounterId, patientId));
  }

  // Add multiple labs
  const labTests = [
    { name: "Hemoglobin A1c", value: 7.2, unit: "%", status: "elevated" },
    { name: "Blood Glucose", value: 145, unit: "mg/dL", status: "elevated" },
    { name: "Creatinine", value: 1.1, unit: "mg/dL", status: "normal" },
    { name: "Blood Pressure Systolic", value: 142, unit: "mmHg", status: "elevated" },
  ];

  for (let i = 0; i < labTests.length; i++) {
    const lab = labTests[i];
    const labId = `lab-${caseId}-${i.toString().padStart(3, "0")}`;
    
    graph.addNode(NodeFactory.lab(
      labId,
      lab.name,
      patientId,
      baseDate.toISOString(),
      lab.value,
      lab.unit,
      { status: lab.status, abnormal: lab.status !== "normal" },
      [{ source: "lab", id: labId }]
    ));
    
    graph.addEdge(EdgeFactory.belongsTo(`edge-lab-${caseId}-${i}`, labId, patientId));
  }

  // Add conditions
  const conditions = ["Hypertension", "Type 2 Diabetes Mellitus"];
  for (let i = 0; i < conditions.length; i++) {
    const condId = `condition-${caseId}-${i.toString().padStart(3, "0")}`;
    
    graph.addNode(NodeFactory.condition(
      condId,
      conditions[i],
      patientId,
      baseDate.toISOString(),
      { active: true },
      [{ source: "synthetic", id: condId }]
    ));
    
    graph.addEdge(EdgeFactory.belongsTo(`edge-cond-${caseId}-${i}`, condId, patientId));
  }

  // Add medications
  const medications = ["Metformin 500mg", "Lisinopril 10mg"];
  for (let i = 0; i < medications.length; i++) {
    const medId = `medication-${caseId}-${i.toString().padStart(3, "0")}`;
    
    graph.addNode(NodeFactory.medication(
      medId,
      medications[i],
      patientId,
      baseDate.toISOString(),
      { active: true },
      [{ source: "synthetic", id: medId }]
    ));
    
    graph.addEdge(EdgeFactory.belongsTo(`edge-med-${caseId}-${i}`, medId, patientId));
  }

  // Add findings
  const findings = [
    { label: "Suboptimal glycemic control", probability: 0.82 },
    { label: "Borderline hypertension", probability: 0.75 },
  ];

  for (let i = 0; i < findings.length; i++) {
    const finding = findings[i];
    const findingId = `finding-${caseId}-${i.toString().padStart(3, "0")}`;
    
    graph.addNode(NodeFactory.finding(
      findingId,
      finding.label,
      patientId,
      baseDate.toISOString(),
      finding.probability,
      { category: "clinical-finding" },
      [{ source: "synthetic", id: findingId }]
    ));
    
    graph.addEdge(EdgeFactory.belongsTo(`edge-find-${caseId}-${i}`, findingId, patientId));
  }

  return graph;
}

/**
 * Generate a multimodal demo graph with imaging.
 */
async function generateMultimodalDemoGraph(caseId: string, graphId: string): Promise<AtlasGraph> {
  const graph = new AtlasGraph(graphId);
  const patientId = `patient-${caseId}`;
  const baseDate = new Date("2025-01-12");

  // Add patient
  graph.addNode(NodeFactory.patient(patientId, "Multimodal Demo Patient", {
    age: 52,
    gender: "female",
  }));

  // Add encounter
  const encounterId = `encounter-${caseId}-001`;
  graph.addNode(NodeFactory.encounter(
    encounterId,
    "Emergency Visit",
    patientId,
    baseDate.toISOString(),
    { type: "emergency", chiefComplaint: "Chest pain" },
    [{ source: "fhir", id: encounterId }]
  ));
  graph.addEdge(EdgeFactory.belongsTo(`edge-enc-${caseId}`, encounterId, patientId));

  // Add imaging study
  const studyId = `study-${caseId}-001`;
  graph.addNode(NodeFactory.study(
    studyId,
    "Chest CT with Contrast",
    patientId,
    baseDate.toISOString(),
    { modality: "CT", bodyPart: "Chest" },
    [{ source: "dicom", id: studyId }]
  ));
  graph.addEdge(EdgeFactory.belongsTo(`edge-study-${caseId}`, studyId, patientId));
  graph.addEdge(EdgeFactory.observedIn(`edge-study-enc-${caseId}`, studyId, encounterId));

  // Add imaging finding
  const imgFindingId = `finding-${caseId}-001`;
  graph.addNode(NodeFactory.finding(
    imgFindingId,
    "5mm pulmonary nodule in right lower lobe",
    patientId,
    baseDate.toISOString(),
    0.72,
    {
      category: "imaging-finding",
      anatomy: "Right lower lobe",
      imageRef: studyId,
      size: "5mm",
    },
    [{ source: "dicom", id: imgFindingId }]
  ));
  graph.addEdge(EdgeFactory.hasFinding(`edge-img-find-${caseId}`, studyId, imgFindingId));
  graph.addEdge(EdgeFactory.belongsTo(`edge-find-${caseId}`, imgFindingId, patientId));

  // Add clinical note
  const noteId = `note-${caseId}-001`;
  graph.addNode(NodeFactory.note(
    noteId,
    "Radiology Report",
    patientId,
    baseDate.toISOString(),
    {
      summary: "CT chest shows 5mm nodule in RLL. No lymphadenopathy. Heart size normal.",
      author: "Dr. Smith",
    },
    [{ source: "note", id: noteId }]
  ));
  graph.addEdge(EdgeFactory.belongsTo(`edge-note-${caseId}`, noteId, patientId));
  graph.addEdge(EdgeFactory.references(`edge-note-study-${caseId}`, noteId, studyId));

  // Add text finding from note
  const textFindingId = `finding-${caseId}-002`;
  graph.addNode(NodeFactory.finding(
    textFindingId,
    "Pulmonary nodule noted on imaging",
    patientId,
    baseDate.toISOString(),
    0.88,
    { category: "text-finding" },
    [{ source: "note", id: textFindingId }]
  ));
  graph.addEdge(EdgeFactory.hasFinding(`edge-note-find-${caseId}`, noteId, textFindingId));

  // Add cross-modal match between image finding and text finding
  graph.addEdge(EdgeFactory.matches(
    `edge-match-${caseId}`,
    imgFindingId,
    textFindingId,
    0.92,
    [{ source: "synthetic", id: `match-${caseId}` }]
  ));

  // Add labs
  const labs = [
    { name: "D-Dimer", value: 0.4, unit: "mg/L", status: "normal" },
    { name: "Troponin I", value: 0.01, unit: "ng/mL", status: "normal" },
  ];

  for (let i = 0; i < labs.length; i++) {
    const lab = labs[i];
    const labId = `lab-${caseId}-${i.toString().padStart(3, "0")}`;
    
    graph.addNode(NodeFactory.lab(
      labId,
      lab.name,
      patientId,
      baseDate.toISOString(),
      lab.value,
      lab.unit,
      { status: lab.status },
      [{ source: "lab", id: labId }]
    ));
    
    graph.addEdge(EdgeFactory.belongsTo(`edge-lab-${caseId}-${i}`, labId, patientId));
    graph.addEdge(EdgeFactory.observedIn(`edge-lab-enc-${caseId}-${i}`, labId, encounterId));
  }

  return graph;
}

/**
 * POST /demo/reset - Reset demo data
 */
export async function handleResetDemo(request: Request): Promise<Response> {
  const storage = getGlobalStorage();
  
  // Clear all demo graphs
  const graphIds = await storage.list();
  let deleted = 0;
  
  for (const graphId of graphIds) {
    if (graphId.startsWith("demo-graph-")) {
      await storage.delete(graphId);
      deleted++;
    }
  }

  return json({
    success: true,
    message: `Reset demo data. Deleted ${deleted} demo graphs.`,
  });
}
