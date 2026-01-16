/**
 * Demo API Handlers
 *
 * Handlers for demo endpoints that orchestrate the complete
 * MedAtlas demo flow: data → graph → reasoning → output.
 */

import type { MedAtlasOutput } from "@medatlas/schemas/types";
import {
  getDefaultAdapter,
  type GraphData,
  type ReasoningInput,
} from "@medatlas/reasoning";

/**
 * Demo case metadata
 */
export interface DemoCaseInfo {
  caseId: string;
  title: string;
  description: string;
  modalities: string[];
  createdAt: string;
}

/**
 * Demo cases available for the demo
 */
const DEMO_CASES: Map<string, DemoCaseInfo> = new Map([
  [
    "demo-cardiac-001",
    {
      caseId: "demo-cardiac-001",
      title: "Acute Coronary Syndrome Workup",
      description: "45-year-old female with chest pain, elevated troponin, and ECG changes",
      modalities: ["note", "lab", "dicom", "device"],
      createdAt: "2026-01-15T10:30:00Z",
    },
  ],
  [
    "demo-pulmonary-001",
    {
      caseId: "demo-pulmonary-001",
      title: "Community-Acquired Pneumonia",
      description: "62-year-old male with fever, cough, and pulmonary infiltrates",
      modalities: ["note", "lab", "dicom"],
      createdAt: "2026-01-14T14:20:00Z",
    },
  ],
  [
    "demo-neuro-001",
    {
      caseId: "demo-neuro-001",
      title: "Stroke Alert Evaluation",
      description: "58-year-old female with acute onset left-sided weakness",
      modalities: ["note", "lab", "dicom"],
      createdAt: "2026-01-13T08:45:00Z",
    },
  ],
]);

/**
 * Handle GET /demo/cases
 *
 * Returns list of available demo cases.
 */
export async function handleListCases(): Promise<Response> {
  const cases = Array.from(DEMO_CASES.values());
  return jsonResponse({
    success: true,
    data: cases,
    meta: {
      count: cases.length,
    },
  });
}

/**
 * Handle GET /demo/case/:caseId
 *
 * Returns a complete demo case with reasoning output.
 * Orchestrates: graph data → reasoning → MedAtlasOutput
 */
export async function handleGetCase(caseId: string): Promise<Response> {
  const startTime = Date.now();

  // Check if this is a known demo case
  const caseInfo = DEMO_CASES.get(caseId);

  // Generate graph data for the case
  const graphData = generateDemoGraphData(caseId, caseInfo);

  // Build reasoning input
  const input: ReasoningInput = {
    caseId,
    graphId: graphData.id,
    modalities: graphData.modalities,
    graphData,
  };

  // Generate interpretation
  const adapter = getDefaultAdapter();
  const result = await adapter.generateInterpretation(input);

  const processingTimeMs = Date.now() - startTime;

  return jsonResponse({
    success: true,
    data: result,
    meta: {
      caseInfo: caseInfo || { caseId, title: "Custom Case", description: "User-provided case ID" },
      adapter: adapter.name,
      processingTimeMs,
      graphStats: {
        nodeCount: graphData.nodes.length,
        edgeCount: graphData.edges.length,
      },
    },
  });
}

/**
 * Handle POST /demo/generate
 *
 * Generates a new demo case with synthetic data.
 */
export async function handleGenerateCase(request: Request): Promise<Response> {
  const startTime = Date.now();

  try {
    const body = (await request.json()) as {
      scenario?: string;
      modalities?: string[];
    };

    // Generate unique case ID
    const caseId = `demo-generated-${Date.now()}`;
    const scenario = body.scenario || "general";
    const modalities = body.modalities || ["synthetic", "note", "lab"];

    // Generate graph data based on scenario
    const graphData = generateScenarioGraphData(caseId, scenario, modalities);

    // Generate interpretation
    const input: ReasoningInput = {
      caseId,
      graphId: graphData.id,
      modalities,
      graphData,
    };

    const adapter = getDefaultAdapter();
    const result = await adapter.generateInterpretation(input);

    const processingTimeMs = Date.now() - startTime;

    return jsonResponse({
      success: true,
      data: result,
      meta: {
        caseId,
        scenario,
        adapter: adapter.name,
        processingTimeMs,
        graphStats: {
          nodeCount: graphData.nodes.length,
          edgeCount: graphData.edges.length,
        },
      },
    });
  } catch (error) {
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
 * Generate demo graph data for a specific case
 */
function generateDemoGraphData(
  caseId: string,
  caseInfo?: DemoCaseInfo
): GraphData {
  if (caseId === "demo-cardiac-001") {
    return generateCardiacCaseData(caseId);
  } else if (caseId === "demo-pulmonary-001") {
    return generatePulmonaryCaseData(caseId);
  } else if (caseId === "demo-neuro-001") {
    return generateNeuroCaseData(caseId);
  }

  // Default generic case
  return generateGenericCaseData(caseId, caseInfo?.modalities || ["synthetic"]);
}

/**
 * Generate cardiac case graph data
 */
function generateCardiacCaseData(caseId: string): GraphData {
  const timestamp = new Date().toISOString();
  const encounterTime = new Date(Date.now() - 86400000).toISOString();

  return {
    id: `graph-${caseId}`,
    patientId: `patient-${caseId}`,
    modalities: ["note", "lab", "dicom", "device"],
    nodes: [
      {
        id: `patient-${caseId}`,
        type: "patient",
        label: "Demo Patient - Cardiac Case",
        properties: { age: "45", gender: "Female" },
      },
      {
        id: `enc-${caseId}`,
        type: "encounter",
        label: "Emergency Department Visit",
        timestamp: encounterTime,
        properties: { type: "emergency", reason: "Chest pain and shortness of breath" },
        evidence: [{ source: "fhir", id: `enc-${caseId}` }],
      },
      {
        id: `note-${caseId}-001`,
        type: "note",
        label: "ED Progress Note",
        timestamp: encounterTime,
        properties: {
          text: "45-year-old female presenting with acute onset chest pain radiating to left arm. Pain described as pressure-like, 7/10 severity. Associated shortness of breath and diaphoresis. No prior cardiac history. Vitals: BP 145/92, HR 98, RR 22, SpO2 96% on RA. Physical exam reveals diaphoretic patient in moderate distress. Heart sounds regular, no murmurs. Lungs with bibasilar crackles.",
        },
        evidence: [{ source: "note", id: `note-${caseId}-001` }],
      },
      {
        id: `lab-${caseId}-troponin`,
        type: "lab",
        label: "Troponin I",
        timestamp: encounterTime,
        properties: { value: 0.15, unit: "ng/mL", referenceRange: "0.00-0.04", interpretation: "High" },
        evidence: [{ source: "lab", id: `lab-${caseId}-troponin` }],
      },
      {
        id: `lab-${caseId}-bnp`,
        type: "lab",
        label: "BNP",
        timestamp: encounterTime,
        properties: { value: 450, unit: "pg/mL", referenceRange: "0-100", interpretation: "High" },
        evidence: [{ source: "lab", id: `lab-${caseId}-bnp` }],
      },
      {
        id: `lab-${caseId}-creatinine`,
        type: "lab",
        label: "Creatinine",
        timestamp: encounterTime,
        properties: { value: 1.1, unit: "mg/dL", referenceRange: "0.6-1.2", interpretation: "Normal" },
        evidence: [{ source: "lab", id: `lab-${caseId}-creatinine` }],
      },
      {
        id: `study-${caseId}-cxr`,
        type: "study",
        label: "Chest X-Ray PA and Lateral",
        timestamp: encounterTime,
        properties: {
          modality: "XR",
          bodyPart: "Chest",
          report: "Mild cardiomegaly with cardiothoracic ratio of 0.55. No acute pulmonary infiltrates or consolidation. Small bilateral pleural effusions, left greater than right. No pneumothorax. Mediastinal contours within normal limits.",
          findings: ["Cardiomegaly", "Bilateral pleural effusions"],
        },
        evidence: [{ source: "dicom", id: `study-${caseId}-cxr` }],
      },
      {
        id: `study-${caseId}-ecg`,
        type: "study",
        label: "12-Lead ECG",
        timestamp: encounterTime,
        properties: {
          modality: "ECG",
          report: "Sinus tachycardia at 98 bpm. Normal axis. PR interval 160ms. ST-segment depression of 1-2mm in leads V4-V6 and leads I, aVL. T-wave inversions in lateral leads. No pathological Q waves. QTc 440ms.",
          findings: ["Sinus tachycardia", "ST-segment depression", "T-wave inversions"],
        },
        evidence: [{ source: "device", id: `study-${caseId}-ecg` }],
      },
      {
        id: `cond-${caseId}-htn`,
        type: "condition",
        label: "Essential Hypertension",
        properties: { status: "active", code: "I10", severity: "moderate" },
        evidence: [{ source: "fhir", id: `cond-${caseId}-htn` }],
      },
      {
        id: `cond-${caseId}-dm`,
        type: "condition",
        label: "Type 2 Diabetes Mellitus",
        properties: { status: "active", code: "E11.9" },
        evidence: [{ source: "fhir", id: `cond-${caseId}-dm` }],
      },
      {
        id: `med-${caseId}-lisinopril`,
        type: "medication",
        label: "Lisinopril",
        properties: { dosage: "10mg", frequency: "daily", route: "oral" },
        evidence: [{ source: "fhir", id: `med-${caseId}-lisinopril` }],
      },
      {
        id: `med-${caseId}-metformin`,
        type: "medication",
        label: "Metformin",
        properties: { dosage: "500mg", frequency: "twice daily", route: "oral" },
        evidence: [{ source: "fhir", id: `med-${caseId}-metformin` }],
      },
      {
        id: `finding-${caseId}-acs`,
        type: "finding",
        label: "Elevated cardiac biomarkers suggesting acute myocardial injury",
        properties: { probability: 0.88 },
        evidence: [
          { source: "lab", id: `lab-${caseId}-troponin` },
          { source: "lab", id: `lab-${caseId}-bnp` },
        ],
      },
      {
        id: `finding-${caseId}-ischemia`,
        type: "finding",
        label: "ECG changes consistent with myocardial ischemia",
        properties: { probability: 0.82 },
        evidence: [{ source: "device", id: `study-${caseId}-ecg` }],
      },
    ],
    edges: [
      { id: "e1", source: `enc-${caseId}`, target: `patient-${caseId}`, type: "observed-in" },
      { id: "e2", source: `note-${caseId}-001`, target: `enc-${caseId}`, type: "derived-from" },
      { id: "e3", source: `lab-${caseId}-troponin`, target: `enc-${caseId}`, type: "observed-in" },
      { id: "e4", source: `lab-${caseId}-bnp`, target: `enc-${caseId}`, type: "observed-in" },
      { id: "e5", source: `study-${caseId}-cxr`, target: `enc-${caseId}`, type: "observed-in" },
      { id: "e6", source: `study-${caseId}-ecg`, target: `enc-${caseId}`, type: "observed-in" },
      { id: "e7", source: `finding-${caseId}-acs`, target: `lab-${caseId}-troponin`, type: "derived-from", confidence: 0.9 },
      { id: "e8", source: `finding-${caseId}-acs`, target: `lab-${caseId}-bnp`, type: "supports", confidence: 0.85 },
      { id: "e9", source: `finding-${caseId}-ischemia`, target: `study-${caseId}-ecg`, type: "derived-from", confidence: 0.85 },
      { id: "e10", source: `finding-${caseId}-ischemia`, target: `finding-${caseId}-acs`, type: "supports", confidence: 0.8 },
      { id: "e11", source: `study-${caseId}-cxr`, target: `finding-${caseId}-acs`, type: "supports", confidence: 0.7 },
    ],
    metadata: { createdAt: timestamp, nodeCount: 14, edgeCount: 11 },
  };
}

/**
 * Generate pulmonary case graph data
 */
function generatePulmonaryCaseData(caseId: string): GraphData {
  const timestamp = new Date().toISOString();
  const encounterTime = new Date(Date.now() - 172800000).toISOString();

  return {
    id: `graph-${caseId}`,
    patientId: `patient-${caseId}`,
    modalities: ["note", "lab", "dicom"],
    nodes: [
      {
        id: `patient-${caseId}`,
        type: "patient",
        label: "Demo Patient - Pulmonary Case",
        properties: { age: "62", gender: "Male" },
      },
      {
        id: `enc-${caseId}`,
        type: "encounter",
        label: "Urgent Care Visit",
        timestamp: encounterTime,
        properties: { type: "urgent", reason: "Fever, productive cough, dyspnea" },
        evidence: [{ source: "fhir", id: `enc-${caseId}` }],
      },
      {
        id: `note-${caseId}-001`,
        type: "note",
        label: "Urgent Care Note",
        timestamp: encounterTime,
        properties: {
          text: "62-year-old male with 3-day history of worsening cough productive of yellow-green sputum, fever (101.8°F at home), and increasing dyspnea on exertion. History of COPD. Current smoker (40 pack-years). Vitals: T 102.1°F, BP 138/85, HR 105, RR 24, SpO2 91% on RA. Decreased breath sounds right lower lobe with crackles.",
        },
        evidence: [{ source: "note", id: `note-${caseId}-001` }],
      },
      {
        id: `lab-${caseId}-wbc`,
        type: "lab",
        label: "WBC",
        timestamp: encounterTime,
        properties: { value: 14.8, unit: "K/uL", referenceRange: "4.5-11.0", interpretation: "High" },
        evidence: [{ source: "lab", id: `lab-${caseId}-wbc` }],
      },
      {
        id: `lab-${caseId}-crp`,
        type: "lab",
        label: "CRP",
        timestamp: encounterTime,
        properties: { value: 85, unit: "mg/L", referenceRange: "0-10", interpretation: "High" },
        evidence: [{ source: "lab", id: `lab-${caseId}-crp` }],
      },
      {
        id: `lab-${caseId}-procalcitonin`,
        type: "lab",
        label: "Procalcitonin",
        timestamp: encounterTime,
        properties: { value: 1.2, unit: "ng/mL", referenceRange: "0-0.5", interpretation: "High" },
        evidence: [{ source: "lab", id: `lab-${caseId}-procalcitonin` }],
      },
      {
        id: `study-${caseId}-cxr`,
        type: "study",
        label: "Chest X-Ray",
        timestamp: encounterTime,
        properties: {
          modality: "XR",
          bodyPart: "Chest",
          report: "Right lower lobe consolidation with air bronchograms, consistent with pneumonia. No pleural effusion. No pneumothorax. Heart size normal. COPD changes noted with hyperinflation.",
          findings: ["Right lower lobe consolidation", "COPD changes"],
        },
        evidence: [{ source: "dicom", id: `study-${caseId}-cxr` }],
      },
      {
        id: `cond-${caseId}-copd`,
        type: "condition",
        label: "Chronic Obstructive Pulmonary Disease",
        properties: { status: "active", code: "J44.9", severity: "moderate" },
        evidence: [{ source: "fhir", id: `cond-${caseId}-copd` }],
      },
      {
        id: `finding-${caseId}-pneumonia`,
        type: "finding",
        label: "Community-acquired pneumonia with bacterial infection markers",
        properties: { probability: 0.9 },
        evidence: [
          { source: "dicom", id: `study-${caseId}-cxr` },
          { source: "lab", id: `lab-${caseId}-wbc` },
          { source: "lab", id: `lab-${caseId}-procalcitonin` },
        ],
      },
    ],
    edges: [
      { id: "e1", source: `enc-${caseId}`, target: `patient-${caseId}`, type: "observed-in" },
      { id: "e2", source: `note-${caseId}-001`, target: `enc-${caseId}`, type: "derived-from" },
      { id: "e3", source: `lab-${caseId}-wbc`, target: `enc-${caseId}`, type: "observed-in" },
      { id: "e4", source: `study-${caseId}-cxr`, target: `enc-${caseId}`, type: "observed-in" },
      { id: "e5", source: `finding-${caseId}-pneumonia`, target: `study-${caseId}-cxr`, type: "derived-from", confidence: 0.9 },
      { id: "e6", source: `finding-${caseId}-pneumonia`, target: `lab-${caseId}-wbc`, type: "supports", confidence: 0.85 },
      { id: "e7", source: `finding-${caseId}-pneumonia`, target: `lab-${caseId}-procalcitonin`, type: "supports", confidence: 0.88 },
    ],
    metadata: { createdAt: timestamp, nodeCount: 9, edgeCount: 7 },
  };
}

/**
 * Generate neuro case graph data
 */
function generateNeuroCaseData(caseId: string): GraphData {
  const timestamp = new Date().toISOString();
  const encounterTime = new Date(Date.now() - 259200000).toISOString();

  return {
    id: `graph-${caseId}`,
    patientId: `patient-${caseId}`,
    modalities: ["note", "lab", "dicom"],
    nodes: [
      {
        id: `patient-${caseId}`,
        type: "patient",
        label: "Demo Patient - Neuro Case",
        properties: { age: "58", gender: "Female" },
      },
      {
        id: `enc-${caseId}`,
        type: "encounter",
        label: "Emergency Department - Stroke Alert",
        timestamp: encounterTime,
        properties: { type: "emergency", reason: "Acute onset left-sided weakness and facial droop" },
        evidence: [{ source: "fhir", id: `enc-${caseId}` }],
      },
      {
        id: `note-${caseId}-001`,
        type: "note",
        label: "Stroke Alert Note",
        timestamp: encounterTime,
        properties: {
          text: "58-year-old female with sudden onset left-sided weakness and facial droop starting 2 hours ago. Last known well at 0800. History of atrial fibrillation, not on anticoagulation. NIHSS score: 12. Left facial droop, left arm drift, dysarthria, left-sided neglect. BP 168/95, HR irregular 92.",
        },
        evidence: [{ source: "note", id: `note-${caseId}-001` }],
      },
      {
        id: `lab-${caseId}-glucose`,
        type: "lab",
        label: "Glucose",
        timestamp: encounterTime,
        properties: { value: 142, unit: "mg/dL", referenceRange: "70-100", interpretation: "High" },
        evidence: [{ source: "lab", id: `lab-${caseId}-glucose` }],
      },
      {
        id: `lab-${caseId}-inr`,
        type: "lab",
        label: "INR",
        timestamp: encounterTime,
        properties: { value: 1.1, unit: "", referenceRange: "0.9-1.1", interpretation: "Normal" },
        evidence: [{ source: "lab", id: `lab-${caseId}-inr` }],
      },
      {
        id: `study-${caseId}-ct`,
        type: "study",
        label: "CT Head without Contrast",
        timestamp: encounterTime,
        properties: {
          modality: "CT",
          bodyPart: "Head",
          report: "No acute intracranial hemorrhage. Early subtle hypodensity in right MCA territory, involving right insula and frontal operculum. No midline shift. Dense MCA sign on right. Consider acute right MCA territory infarct.",
          findings: ["Early ischemic changes right MCA territory", "Dense MCA sign"],
        },
        evidence: [{ source: "dicom", id: `study-${caseId}-ct` }],
      },
      {
        id: `study-${caseId}-cta`,
        type: "study",
        label: "CT Angiography Head and Neck",
        timestamp: encounterTime,
        properties: {
          modality: "CTA",
          bodyPart: "Head/Neck",
          report: "Occlusion of right M1 segment of MCA. Right ICA patent. Left-sided circulation patent. No evidence of dissection. Good collateral flow via leptomeningeal vessels.",
          findings: ["Right M1 MCA occlusion"],
        },
        evidence: [{ source: "dicom", id: `study-${caseId}-cta` }],
      },
      {
        id: `cond-${caseId}-afib`,
        type: "condition",
        label: "Atrial Fibrillation",
        properties: { status: "active", code: "I48.91" },
        evidence: [{ source: "fhir", id: `cond-${caseId}-afib` }],
      },
      {
        id: `finding-${caseId}-stroke`,
        type: "finding",
        label: "Acute ischemic stroke, right MCA territory, likely cardioembolic",
        properties: { probability: 0.92 },
        evidence: [
          { source: "dicom", id: `study-${caseId}-ct` },
          { source: "dicom", id: `study-${caseId}-cta` },
          { source: "fhir", id: `cond-${caseId}-afib` },
        ],
      },
    ],
    edges: [
      { id: "e1", source: `enc-${caseId}`, target: `patient-${caseId}`, type: "observed-in" },
      { id: "e2", source: `note-${caseId}-001`, target: `enc-${caseId}`, type: "derived-from" },
      { id: "e3", source: `study-${caseId}-ct`, target: `enc-${caseId}`, type: "observed-in" },
      { id: "e4", source: `study-${caseId}-cta`, target: `enc-${caseId}`, type: "observed-in" },
      { id: "e5", source: `finding-${caseId}-stroke`, target: `study-${caseId}-ct`, type: "derived-from", confidence: 0.85 },
      { id: "e6", source: `finding-${caseId}-stroke`, target: `study-${caseId}-cta`, type: "derived-from", confidence: 0.95 },
      { id: "e7", source: `cond-${caseId}-afib`, target: `finding-${caseId}-stroke`, type: "caused-by", confidence: 0.75 },
    ],
    metadata: { createdAt: timestamp, nodeCount: 9, edgeCount: 7 },
  };
}

/**
 * Generate generic case graph data
 */
function generateGenericCaseData(caseId: string, modalities: string[]): GraphData {
  const timestamp = new Date().toISOString();

  return {
    id: `graph-${caseId}`,
    patientId: `patient-${caseId}`,
    modalities,
    nodes: [
      {
        id: `patient-${caseId}`,
        type: "patient",
        label: "Demo Patient",
        properties: { age: "50", gender: "Unknown" },
      },
      {
        id: `enc-${caseId}`,
        type: "encounter",
        label: "Clinical Encounter",
        timestamp,
        properties: { type: "outpatient", reason: "General evaluation" },
        evidence: [{ source: "synthetic", id: `enc-${caseId}` }],
      },
    ],
    edges: [
      { id: "e1", source: `enc-${caseId}`, target: `patient-${caseId}`, type: "observed-in" },
    ],
    metadata: { createdAt: timestamp, nodeCount: 2, edgeCount: 1 },
  };
}

/**
 * Generate scenario-based graph data
 */
function generateScenarioGraphData(
  caseId: string,
  scenario: string,
  modalities: string[]
): GraphData {
  switch (scenario) {
    case "cardiac":
      return generateCardiacCaseData(caseId);
    case "pulmonary":
      return generatePulmonaryCaseData(caseId);
    case "neuro":
      return generateNeuroCaseData(caseId);
    default:
      return generateGenericCaseData(caseId, modalities);
  }
}

/**
 * Helper to create JSON responses
 */
function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
  });
}
