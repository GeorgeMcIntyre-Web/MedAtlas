import type { MedAtlasOutput, Finding, EvidenceRef } from "@medatlas/schemas/types";
import type { ModelAdapter, ReasoningInput, ValidationResult, GraphNode, ReasoningConfig } from "./types";
import { validateOutput, sanitizeOutput } from "./output-validator";

/**
 * Default configuration for mock adapter
 */
const DEFAULT_CONFIG: Required<ReasoningConfig> = {
  maxFindings: 10,
  maxEntities: 20,
  includeRecommendations: true,
  confidenceThreshold: 0.3,
};

/**
 * Mock model adapter for demo purposes.
 * Generates structured MedAtlasOutput directly from graph data without calling an actual model.
 */
export class MockModelAdapter implements ModelAdapter {
  readonly name = "mock-adapter";
  private config: Required<ReasoningConfig>;

  constructor(config: ReasoningConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate interpretation from graph data
   */
  async generateInterpretation(input: ReasoningInput): Promise<MedAtlasOutput> {
    const { caseId, graphData } = input;
    const { nodes, edges, modalities } = graphData;

    // Extract findings from finding nodes
    const findings = this.extractFindings(nodes);

    // Extract entities from various node types
    const extractedEntities = this.extractEntities(nodes);

    // Generate summary from graph data
    const summary = this.generateSummary(nodes, modalities);

    // Generate recommendations
    const recommendations = this.config.includeRecommendations
      ? this.generateRecommendations(nodes, modalities)
      : [];

    // Calculate uncertainty based on data completeness
    const uncertainty = this.calculateUncertainty(nodes, modalities);

    const output: MedAtlasOutput = {
      caseId,
      modalities,
      summary,
      findings: findings.slice(0, this.config.maxFindings),
      extractedEntities: extractedEntities.slice(0, this.config.maxEntities),
      recommendations,
      uncertainty,
      safety: {
        notMedicalAdvice: true,
        requiresClinicianReview: true,
      },
    };

    return output;
  }

  /**
   * Validate output against schema
   */
  validateOutput(output: unknown): ValidationResult {
    return validateOutput(output);
  }

  /**
   * Extract findings from graph nodes
   */
  private extractFindings(nodes: GraphNode[]): Finding[] {
    const findings: Finding[] = [];

    // Look for explicit finding nodes
    const findingNodes = nodes.filter(n => n.type === "finding");
    for (const node of findingNodes) {
      findings.push({
        label: node.label,
        probability: typeof node.data.probability === "number" ? node.data.probability : undefined,
        location: this.extractLocation(node),
        evidence: node.evidence,
      });
    }

    // Also extract findings from observations with notable values
    const observationNodes = nodes.filter(n => n.type === "observation");
    for (const node of observationNodes) {
      if (node.data.notable === true || node.data.abnormal === true) {
        findings.push({
          label: `${node.label} (observation)`,
          probability: 0.8,
          evidence: node.evidence,
        });
      }
    }

    // Extract findings from study nodes (imaging)
    const studyNodes = nodes.filter(n => n.type === "study");
    for (const node of studyNodes) {
      if (node.data.findings && Array.isArray(node.data.findings)) {
        for (const finding of node.data.findings) {
          if (typeof finding === "string") {
            findings.push({
              label: finding,
              probability: 0.75,
              evidence: node.evidence,
            });
          }
        }
      }
    }

    return findings;
  }

  /**
   * Extract location information from a node
   */
  private extractLocation(node: GraphNode): Finding["location"] | undefined {
    if (!node.data.location && !node.data.anatomy) {
      return undefined;
    }

    return {
      anatomy: typeof node.data.anatomy === "string" ? node.data.anatomy : undefined,
      imageRef: typeof node.data.imageRef === "string" ? node.data.imageRef : undefined,
      sliceIndex: typeof node.data.sliceIndex === "number" ? node.data.sliceIndex : undefined,
      coordinates: Array.isArray(node.data.coordinates) && node.data.coordinates.length === 3
        ? node.data.coordinates as [number, number, number]
        : undefined,
    };
  }

  /**
   * Extract entities from graph nodes
   */
  private extractEntities(nodes: GraphNode[]): MedAtlasOutput["extractedEntities"] {
    const entities: MedAtlasOutput["extractedEntities"] = [];

    // Extract conditions
    const conditionNodes = nodes.filter(n => n.type === "condition");
    for (const node of conditionNodes) {
      entities.push({
        type: "condition",
        text: node.label,
        evidence: node.evidence,
      });
    }

    // Extract medications
    const medicationNodes = nodes.filter(n => n.type === "medication");
    for (const node of medicationNodes) {
      entities.push({
        type: "medication",
        text: node.label,
        value: typeof node.data.dosage === "number" ? node.data.dosage : undefined,
        unit: typeof node.data.unit === "string" ? node.data.unit : undefined,
        evidence: node.evidence,
      });
    }

    // Extract labs
    const labNodes = nodes.filter(n => n.type === "lab");
    for (const node of labNodes) {
      entities.push({
        type: "lab",
        text: node.label,
        value: typeof node.data.value === "number" ? node.data.value : undefined,
        unit: typeof node.data.unit === "string" ? node.data.unit : undefined,
        evidence: node.evidence,
      });
    }

    // Extract observations as entities
    const observationNodes = nodes.filter(n => n.type === "observation");
    for (const node of observationNodes) {
      entities.push({
        type: "observation",
        text: node.label,
        value: typeof node.data.value === "number" ? node.data.value : undefined,
        unit: typeof node.data.unit === "string" ? node.data.unit : undefined,
        evidence: node.evidence,
      });
    }

    return entities;
  }

  /**
   * Generate a summary from graph data
   */
  private generateSummary(nodes: GraphNode[], modalities: string[]): string {
    const patientNode = nodes.find(n => n.type === "patient");
    const encounterNodes = nodes.filter(n => n.type === "encounter");
    const findingNodes = nodes.filter(n => n.type === "finding");
    const conditionNodes = nodes.filter(n => n.type === "condition");

    const parts: string[] = [];

    // Patient info
    if (patientNode) {
      parts.push(`Patient ${patientNode.label}.`);
    }

    // Encounter count
    if (encounterNodes.length > 0) {
      parts.push(`${encounterNodes.length} encounter(s) in record.`);
    }

    // Modalities
    parts.push(`Data modalities: ${modalities.join(", ")}.`);

    // Findings summary
    if (findingNodes.length > 0) {
      parts.push(`${findingNodes.length} notable finding(s) identified.`);
    }

    // Conditions summary
    if (conditionNodes.length > 0) {
      const conditions = conditionNodes.map(n => n.label).join(", ");
      parts.push(`Active conditions: ${conditions}.`);
    }

    if (parts.length === 0) {
      return "Synthetic demo case for MedAtlas. Limited data available for interpretation.";
    }

    return parts.join(" ");
  }

  /**
   * Generate recommendations based on data gaps and findings
   */
  private generateRecommendations(nodes: GraphNode[], modalities: string[]): string[] {
    const recommendations: string[] = [];

    // Always add clinician review
    recommendations.push("Request clinician review and confirm key data points.");

    // Check for missing modalities
    const hasImaging = modalities.some(m => ["dicom", "imaging", "ct", "mri", "xray"].includes(m.toLowerCase()));
    const hasLabs = modalities.includes("lab") || nodes.some(n => n.type === "lab");
    const hasNotes = modalities.includes("note") || nodes.some(n => n.type === "note");

    if (!hasImaging) {
      recommendations.push("Consider acquiring imaging studies if clinically indicated.");
    }

    if (!hasLabs) {
      recommendations.push("Laboratory data not available - consider ordering relevant labs.");
    }

    if (!hasNotes) {
      recommendations.push("Clinical notes not available - consider reviewing patient history.");
    }

    // Check for notable findings that need follow-up
    const findingNodes = nodes.filter(n => n.type === "finding");
    if (findingNodes.length > 0) {
      recommendations.push("Review identified findings and correlate with clinical presentation.");
    }

    return recommendations;
  }

  /**
   * Calculate uncertainty based on data completeness
   */
  private calculateUncertainty(nodes: GraphNode[], modalities: string[]): MedAtlasOutput["uncertainty"] {
    const reasons: string[] = [];
    let score = 0; // Higher = more uncertain

    // Check data completeness
    if (nodes.length < 5) {
      score += 2;
      reasons.push("Limited data points available");
    }

    // Check modality coverage
    if (modalities.length < 2) {
      score += 1;
      reasons.push("Single modality limits cross-validation");
    }

    // Check for synthetic data
    if (modalities.includes("synthetic")) {
      score += 2;
      reasons.push("Synthetic data - not real patient data");
    }

    // Check for imaging data
    const hasImaging = modalities.some(m => ["dicom", "imaging"].includes(m.toLowerCase()));
    if (!hasImaging) {
      score += 1;
      reasons.push("No imaging data available");
    }

    // Check for findings with low confidence
    const findingNodes = nodes.filter(n => n.type === "finding");
    const lowConfidenceFindings = findingNodes.filter(
      n => typeof n.data.probability === "number" && n.data.probability < 0.5
    );
    if (lowConfidenceFindings.length > 0) {
      score += 1;
      reasons.push("Some findings have low confidence");
    }

    // Determine level
    let level: "low" | "medium" | "high";
    if (score >= 4) {
      level = "high";
    } else if (score >= 2) {
      level = "medium";
    } else {
      level = "low";
    }

    if (reasons.length === 0) {
      reasons.push("Standard uncertainty for AI-generated output");
    }

    return { level, reasons };
  }
}

/**
 * Create a mock adapter with optional configuration
 */
export function createMockAdapter(config?: ReasoningConfig): MockModelAdapter {
  return new MockModelAdapter(config);
}
