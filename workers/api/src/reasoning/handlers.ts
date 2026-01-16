/**
 * Reasoning API Handlers
 * 
 * Request handlers for reasoning-related endpoints.
 * Uses the mock adapter for demo purposes.
 */

import type { MedAtlasOutput } from "@medatlas/schemas/types";
import type { 
  ReasoningRequest, 
  ReasoningResponse,
  ReasoningStatusResponse,
  GraphData,
  GraphNode
} from "./types.js";

/**
 * Mock graph data for demo purposes
 * This will be replaced with calls to Agent 1's graph API
 */
const MOCK_GRAPH_DATA: GraphData = {
  nodes: [
    {
      id: "patient-001",
      type: "patient",
      label: "Demo Patient",
      properties: { age: 65, gender: "M" }
    },
    {
      id: "finding-001",
      type: "finding",
      label: "Right lower lobe pulmonary nodule",
      timestamp: "2025-01-15T10:30:00Z",
      properties: {
        probability: 0.85,
        location: { anatomy: "Right lower lobe", imageRef: "ct-001" }
      },
      evidence: [{ source: "dicom", id: "ct-series-001" }]
    },
    {
      id: "finding-002",
      type: "finding",
      label: "Elevated inflammatory markers",
      timestamp: "2025-01-15T08:30:00Z",
      properties: { probability: 0.92 },
      evidence: [{ source: "lab", id: "lab-crp-001" }]
    },
    {
      id: "condition-001",
      type: "condition",
      label: "Chronic cough",
      timestamp: "2025-01-10T00:00:00Z",
      evidence: [{ source: "note", id: "clinical-note-001" }]
    },
    {
      id: "lab-001",
      type: "lab",
      label: "C-Reactive Protein",
      timestamp: "2025-01-15T08:00:00Z",
      properties: {
        value: 45.2,
        unit: "mg/L",
        isAbnormal: true
      },
      evidence: [{ source: "lab", id: "lab-crp-001" }]
    },
    {
      id: "imaging-001",
      type: "imaging",
      label: "CT Chest with contrast",
      timestamp: "2025-01-15T09:00:00Z",
      properties: {
        modality: "CT",
        anatomy: "Chest"
      },
      evidence: [{ source: "dicom", id: "ct-series-001" }]
    },
    {
      id: "medication-001",
      type: "medication",
      label: "Amoxicillin 500mg",
      timestamp: "2025-01-12T00:00:00Z",
      evidence: [{ source: "fhir", id: "medication-001" }]
    }
  ],
  edges: [
    { id: "e1", source: "finding-001", target: "imaging-001", type: "derived_from" },
    { id: "e2", source: "finding-002", target: "lab-001", type: "derived_from" },
    { id: "e3", source: "condition-001", target: "finding-001", type: "supports" },
    { id: "e4", source: "medication-001", target: "condition-001", type: "treats" }
  ],
  patientId: "patient-001",
  caseId: "demo-001"
};

// Simple in-memory store for reasoning status
const reasoningStore = new Map<string, ReasoningStatusResponse>();

/**
 * Extract findings from graph nodes
 */
function extractFindings(nodes: GraphNode[]): MedAtlasOutput["findings"] {
  return nodes
    .filter(n => n.type.toLowerCase() === "finding")
    .map(node => {
      const props = node.properties || {};
      return {
        label: node.label,
        probability: props.probability as number | undefined,
        location: props.location as { anatomy?: string; imageRef?: string; sliceIndex?: number; coordinates?: [number, number, number] } | undefined,
        evidence: node.evidence || []
      };
    });
}

/**
 * Extract entities from graph nodes
 */
function extractEntities(nodes: GraphNode[]): MedAtlasOutput["extractedEntities"] {
  const entityTypes = ["condition", "medication", "symptom", "lab", "observation"];
  
  return nodes
    .filter(n => entityTypes.includes(n.type.toLowerCase()))
    .map(node => {
      const props = node.properties || {};
      return {
        type: node.type.toLowerCase(),
        text: node.label,
        value: props.value as number | undefined,
        unit: props.unit as string | undefined,
        evidence: node.evidence || []
      };
    });
}

/**
 * Calculate uncertainty level
 */
function calculateUncertainty(
  graphData: GraphData
): MedAtlasOutput["uncertainty"] {
  const reasons: string[] = [];
  let level: "low" | "medium" | "high" = "low";

  const nodeTypes = new Set(graphData.nodes.map(n => n.type.toLowerCase()));

  if (!nodeTypes.has("imaging") && !nodeTypes.has("study")) {
    reasons.push("No imaging data available");
    level = "medium";
  }

  if (!nodeTypes.has("lab")) {
    reasons.push("No lab results available");
    level = level === "low" ? "medium" : level;
  }

  const findings = graphData.nodes.filter(n => n.type.toLowerCase() === "finding");
  if (findings.length === 0) {
    reasons.push("No clinical findings extracted");
    level = "high";
  }

  // Check for synthetic data
  const hasSynthetic = graphData.nodes.some(
    n => n.evidence?.some(e => e.source === "synthetic")
  );
  if (hasSynthetic) {
    reasons.push("Contains synthetic/demo data");
    level = "high";
  }

  if (reasons.length === 0) {
    reasons.push("Routine analysis with adequate data coverage");
  }

  return { level, reasons };
}

/**
 * Generate recommendations
 */
function generateRecommendations(graphData: GraphData): string[] {
  const recommendations: string[] = [];
  const nodeTypes = new Set(graphData.nodes.map(n => n.type.toLowerCase()));

  if (!nodeTypes.has("imaging")) {
    recommendations.push("Consider ordering imaging studies if clinically indicated.");
  }

  if (!nodeTypes.has("lab")) {
    recommendations.push("Review lab work to support clinical assessment.");
  }

  recommendations.push("Clinician review required before any clinical action.");
  recommendations.push("Verify all findings against source documentation.");

  return recommendations;
}

/**
 * Generate summary from graph data
 */
function generateSummary(graphData: GraphData): string {
  const findingCount = graphData.nodes.filter(n => n.type.toLowerCase() === "finding").length;
  const entityCount = graphData.nodes.filter(n => 
    ["condition", "medication", "symptom", "lab"].includes(n.type.toLowerCase())
  ).length;

  const nodeTypes = new Set(graphData.nodes.map(n => n.type.toLowerCase()));
  const modalities: string[] = [];
  
  if (nodeTypes.has("imaging")) modalities.push("imaging");
  if (nodeTypes.has("note")) modalities.push("clinical notes");
  if (nodeTypes.has("lab")) modalities.push("laboratory data");
  if (nodeTypes.has("medication")) modalities.push("medication records");

  const modalityStr = modalities.length > 0 ? modalities.join(", ") : "available clinical data";

  const keyFindings = graphData.nodes
    .filter(n => n.type.toLowerCase() === "finding")
    .slice(0, 3)
    .map(n => n.label);

  const findingsStr = keyFindings.length > 0
    ? ` Key findings include: ${keyFindings.join("; ")}.`
    : "";

  return `Analysis of ${modalityStr} identified ${findingCount} finding(s) and ${entityCount} clinical entities.${findingsStr} Clinician review recommended.`;
}

/**
 * Handle reasoning interpretation request
 */
export async function handleInterpret(
  request: ReasoningRequest
): Promise<ReasoningResponse> {
  const startTime = Date.now();
  
  // Use provided graph data or mock data
  const graphData = request.graphData || MOCK_GRAPH_DATA;
  
  // Generate output using mock adapter logic
  const output: MedAtlasOutput = {
    caseId: request.caseId,
    modalities: request.modalities.length > 0 ? request.modalities : ["synthetic", "note", "lab", "imaging"],
    summary: generateSummary(graphData),
    findings: extractFindings(graphData.nodes),
    extractedEntities: extractEntities(graphData.nodes),
    recommendations: generateRecommendations(graphData),
    uncertainty: calculateUncertainty(graphData),
    safety: {
      notMedicalAdvice: true,
      requiresClinicianReview: true
    }
  };

  const processingTimeMs = Date.now() - startTime;

  // Store status
  reasoningStore.set(request.caseId, {
    caseId: request.caseId,
    status: "completed",
    output,
    completedAt: new Date().toISOString()
  });

  return {
    output,
    model: "mock-adapter",
    processingTimeMs,
    validationPassed: true
  };
}

/**
 * Handle reasoning status request
 */
export function handleGetStatus(caseId: string): ReasoningStatusResponse {
  const stored = reasoningStore.get(caseId);
  
  if (stored) {
    return stored;
  }

  return {
    caseId,
    status: "pending"
  };
}

/**
 * Generate demo case output
 */
export function generateDemoOutput(caseId: string): MedAtlasOutput {
  return {
    caseId,
    modalities: ["synthetic", "note", "lab", "imaging"],
    summary: "Demo case showing multi-modal data integration. This synthetic case includes imaging findings, laboratory results, and clinical notes for demonstration purposes.",
    findings: [
      {
        label: "Right lower lobe pulmonary nodule",
        probability: 0.85,
        location: {
          anatomy: "Right lower lobe",
          imageRef: "ct-chest-001"
        },
        evidence: [
          { source: "dicom", id: "ct-series-001" },
          { source: "note", id: "radiology-report-001" }
        ]
      },
      {
        label: "Elevated inflammatory markers",
        probability: 0.92,
        evidence: [
          { source: "lab", id: "lab-crp-001" },
          { source: "lab", id: "lab-wbc-001" }
        ]
      }
    ],
    extractedEntities: [
      {
        type: "condition",
        text: "Pulmonary nodule",
        evidence: [{ source: "note", id: "clinical-note-001" }]
      },
      {
        type: "symptom",
        text: "Persistent cough",
        evidence: [{ source: "note", id: "clinical-note-001" }]
      },
      {
        type: "lab",
        text: "C-reactive protein",
        value: 45.2,
        unit: "mg/L",
        evidence: [{ source: "lab", id: "lab-crp-001" }]
      },
      {
        type: "medication",
        text: "Amoxicillin",
        evidence: [{ source: "fhir", id: "medication-001" }]
      }
    ],
    recommendations: [
      "Follow-up CT scan recommended in 3-6 months to assess nodule stability.",
      "Review inflammatory markers trend over time.",
      "Clinician review required for treatment decisions.",
      "Verify findings against source documentation."
    ],
    uncertainty: {
      level: "medium",
      reasons: [
        "Synthetic demo data",
        "Nodule size requires follow-up for characterization"
      ]
    },
    safety: {
      notMedicalAdvice: true,
      requiresClinicianReview: true
    }
  };
}
