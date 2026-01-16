/**
 * Mock Model Adapter
 * 
 * A mock implementation of the ModelAdapter interface for demo purposes.
 * Generates structured outputs directly from graph data without calling an external API.
 */

import type { MedAtlasOutput } from "@medatlas/schemas/types";
import type { 
  ModelAdapter, 
  ReasoningInput, 
  GraphData 
} from "./model-adapter.js";
import { 
  extractFindingsFromGraph, 
  extractEntitiesFromGraph, 
  calculateUncertainty, 
  generateRecommendations 
} from "./model-adapter.js";
import { validateMedAtlasOutput } from "./output-validator.js";

/**
 * Mock Model Adapter for demo/testing
 * Generates structured output directly from graph data
 */
export class MockModelAdapter implements ModelAdapter {
  readonly name = "mock-adapter";

  /**
   * Generate interpretation from graph data
   */
  async generateInterpretation(input: ReasoningInput): Promise<MedAtlasOutput> {
    // Simulate processing delay
    await this.simulateDelay(100, 300);

    const { caseId, modalities, graphData } = input;

    // Extract components from graph
    const findings = extractFindingsFromGraph(graphData);
    const entities = extractEntitiesFromGraph(graphData);
    const uncertainty = calculateUncertainty(graphData);
    const recommendations = generateRecommendations(graphData);
    const summary = this.generateSummary(graphData, findings.length, entities.length);

    const output: MedAtlasOutput = {
      caseId,
      modalities,
      summary,
      findings,
      extractedEntities: entities,
      recommendations,
      uncertainty,
      safety: {
        notMedicalAdvice: true,
        requiresClinicianReview: true
      }
    };

    return output;
  }

  /**
   * Validate output against schema
   */
  validateOutput(output: unknown): boolean {
    const result = validateMedAtlasOutput(output);
    return result.valid;
  }

  /**
   * Generate a summary from graph data
   */
  private generateSummary(
    graphData: GraphData, 
    findingCount: number, 
    entityCount: number
  ): string {
    const nodeTypes = new Set(graphData.nodes.map(n => n.type.toLowerCase()));
    const modalities: string[] = [];

    if (nodeTypes.has("imaging") || nodeTypes.has("study")) {
      modalities.push("imaging");
    }
    if (nodeTypes.has("note") || nodeTypes.has("text")) {
      modalities.push("clinical notes");
    }
    if (nodeTypes.has("lab") || nodeTypes.has("labresult")) {
      modalities.push("laboratory data");
    }
    if (nodeTypes.has("medication")) {
      modalities.push("medication records");
    }

    const modalityStr = modalities.length > 0 
      ? modalities.join(", ") 
      : "available clinical data";

    // Get patient context if available
    const patientNode = graphData.nodes.find(n => n.type.toLowerCase() === "patient");
    const patientContext = patientNode 
      ? `Patient ${patientNode.label}. ` 
      : "";

    // Look for key findings to highlight
    const keyFindings = graphData.nodes
      .filter(n => n.type.toLowerCase() === "finding")
      .slice(0, 3)
      .map(n => n.label);

    const findingsStr = keyFindings.length > 0
      ? ` Key findings include: ${keyFindings.join("; ")}.`
      : "";

    return `${patientContext}Analysis of ${modalityStr} identified ${findingCount} finding(s) and ${entityCount} clinical entities.${findingsStr} Clinician review recommended.`;
  }

  /**
   * Simulate async processing delay
   */
  private simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = minMs + Math.random() * (maxMs - minMs);
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

/**
 * Create a default mock adapter instance
 */
export function createMockAdapter(): ModelAdapter {
  return new MockModelAdapter();
}

/**
 * Generate a complete demo case output
 * Useful for testing and demo purposes
 */
export function generateDemoCaseOutput(caseId: string): MedAtlasOutput {
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
