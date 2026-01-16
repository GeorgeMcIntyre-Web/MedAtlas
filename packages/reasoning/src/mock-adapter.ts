/**
 * Mock model adapter for demo purposes.
 * Generates structured MedAtlasOutput from graph data without an AI model.
 */

import type { MedAtlasOutput, Finding, EvidenceRef } from "@medatlas/schemas/types";
import type { GraphData, GraphNode, GraphEdge } from "@medatlas/graph";
import { BaseModelAdapter, type ReasoningInput, type ModelAdapterConfig } from "./model-adapter";

/**
 * Mock model adapter that generates output directly from graph data.
 */
export class MockModelAdapter extends BaseModelAdapter {
  readonly name = "mock";

  constructor(config: ModelAdapterConfig = {}) {
    super(config);
  }

  async generateInterpretation(input: ReasoningInput): Promise<MedAtlasOutput> {
    const { caseId, graphData, modalities } = input;

    // Extract findings from graph nodes
    const findings = this.extractFindings(graphData);

    // Extract entities from graph nodes
    const extractedEntities = this.extractEntities(graphData);

    // Generate summary
    const summary = this.generateSummary(graphData, findings);

    // Calculate uncertainty
    const uncertainty = this.calculateUncertainty(graphData, findings);

    // Generate recommendations
    const recommendations = this.generateRecommendations(graphData, findings, uncertainty);

    return {
      caseId,
      modalities: modalities.length > 0 ? modalities : this.extractModalities(graphData),
      summary,
      findings,
      extractedEntities,
      recommendations,
      uncertainty,
      safety: this.createSafetyBlock(),
    };
  }

  /**
   * Extract findings from graph nodes.
   */
  private extractFindings(graphData: GraphData): Finding[] {
    const findings: Finding[] = [];

    // Get all finding nodes
    const findingNodes = graphData.nodes.filter((n) => n.type === "finding");

    for (const node of findingNodes) {
      const probability = typeof node.properties.probability === "number" 
        ? node.properties.probability 
        : undefined;

      const finding: Finding = {
        label: node.label,
        probability,
        evidence: node.evidence.length > 0 ? node.evidence : [
          { source: "synthetic", id: node.id }
        ],
      };

      // Add location if available
      if (node.properties.anatomy || node.properties.imageRef) {
        finding.location = {
          anatomy: node.properties.anatomy as string | undefined,
          imageRef: node.properties.imageRef as string | undefined,
          sliceIndex: node.properties.sliceIndex as number | undefined,
          coordinates: node.properties.coordinates as [number, number, number] | undefined,
        };
      }

      findings.push(finding);
    }

    // Also extract findings from observations
    const observationNodes = graphData.nodes.filter((n) => n.type === "observation");
    for (const node of observationNodes) {
      // Only include observations that seem like clinical findings
      if (node.properties.isFinding === true || node.properties.abnormal === true) {
        findings.push({
          label: node.label,
          probability: node.properties.probability as number | undefined,
          evidence: node.evidence.length > 0 ? node.evidence : [
            { source: "synthetic", id: node.id }
          ],
        });
      }
    }

    // If no findings, create a placeholder
    if (findings.length === 0) {
      findings.push({
        label: "No specific findings identified",
        evidence: [{ source: "synthetic", id: `${graphData.id}-no-findings` }],
      });
    }

    return findings;
  }

  /**
   * Extract entities from graph nodes.
   */
  private extractEntities(graphData: GraphData): MedAtlasOutput["extractedEntities"] {
    const entities: MedAtlasOutput["extractedEntities"] = [];

    for (const node of graphData.nodes) {
      // Skip finding nodes (handled separately)
      if (node.type === "finding") continue;

      // Map node types to entity types
      let entityType: string;
      switch (node.type) {
        case "condition":
          entityType = "condition";
          break;
        case "medication":
          entityType = "medication";
          break;
        case "lab":
          entityType = "lab";
          break;
        case "observation":
          entityType = "observation";
          break;
        case "study":
          entityType = "study";
          break;
        case "image":
          entityType = "image";
          break;
        case "note":
          entityType = "note";
          break;
        case "encounter":
          entityType = "encounter";
          break;
        default:
          continue; // Skip patient and other types
      }

      const entity: MedAtlasOutput["extractedEntities"][number] = {
        type: entityType,
        text: node.label,
        evidence: node.evidence.length > 0 ? node.evidence : [
          { source: "synthetic", id: node.id }
        ],
      };

      // Add value and unit for labs
      if (node.type === "lab") {
        if (typeof node.properties.value === "number") {
          entity.value = node.properties.value;
        }
        if (typeof node.properties.unit === "string") {
          entity.unit = node.properties.unit;
        }
      }

      entities.push(entity);
    }

    return entities;
  }

  /**
   * Generate a summary from graph data.
   */
  private generateSummary(graphData: GraphData, findings: Finding[]): string {
    const nodeCount = graphData.nodes.length;
    const edgeCount = graphData.edges.length;

    // Get patient info if available
    const patientNode = graphData.nodes.find((n) => n.type === "patient");
    const patientLabel = patientNode?.label ?? "Patient";

    // Count different types
    const typeCounts: Record<string, number> = {};
    for (const node of graphData.nodes) {
      typeCounts[node.type] = (typeCounts[node.type] ?? 0) + 1;
    }

    // Build summary parts
    const parts: string[] = [];

    parts.push(`Case analysis for ${patientLabel} based on ${nodeCount} data points.`);

    if (typeCounts.encounter) {
      parts.push(`${typeCounts.encounter} encounter${typeCounts.encounter > 1 ? "s" : ""} recorded.`);
    }

    if (typeCounts.lab) {
      parts.push(`${typeCounts.lab} lab result${typeCounts.lab > 1 ? "s" : ""} analyzed.`);
    }

    if (typeCounts.study || typeCounts.image) {
      const imgCount = (typeCounts.study ?? 0) + (typeCounts.image ?? 0);
      parts.push(`${imgCount} imaging reference${imgCount > 1 ? "s" : ""} included.`);
    }

    if (typeCounts.note) {
      parts.push(`${typeCounts.note} clinical note${typeCounts.note > 1 ? "s" : ""} reviewed.`);
    }

    const significantFindings = findings.filter(
      (f) => f.probability === undefined || f.probability > 0.5
    );
    if (significantFindings.length > 0) {
      parts.push(`${significantFindings.length} notable finding${significantFindings.length > 1 ? "s" : ""} identified.`);
    }

    return parts.join(" ");
  }

  /**
   * Calculate uncertainty level based on graph data.
   */
  private calculateUncertainty(
    graphData: GraphData,
    findings: Finding[]
  ): MedAtlasOutput["uncertainty"] {
    const reasons: string[] = [];
    let score = 0; // Higher = more uncertain

    // Check for missing data
    const hasLabs = graphData.nodes.some((n) => n.type === "lab");
    const hasImaging = graphData.nodes.some((n) => n.type === "study" || n.type === "image");
    const hasNotes = graphData.nodes.some((n) => n.type === "note");

    if (!hasLabs) {
      reasons.push("No lab results available");
      score += 1;
    }

    if (!hasImaging) {
      reasons.push("No imaging data available");
      score += 1;
    }

    if (!hasNotes) {
      reasons.push("No clinical notes available");
      score += 1;
    }

    // Check for contradictory findings
    const contradictions = graphData.edges.filter((e) => e.type === "contradicts");
    if (contradictions.length > 0) {
      reasons.push(`${contradictions.length} contradictory finding${contradictions.length > 1 ? "s" : ""} detected`);
      score += 2;
    }

    // Check for low confidence findings
    const lowConfidenceFindings = findings.filter(
      (f) => f.probability !== undefined && f.probability < 0.5
    );
    if (lowConfidenceFindings.length > 0) {
      reasons.push(`${lowConfidenceFindings.length} finding${lowConfidenceFindings.length > 1 ? "s" : ""} with low confidence`);
      score += 1;
    }

    // Check for synthetic data
    const hasSynthetic = graphData.nodes.some((n) =>
      n.evidence.some((e) => e.source === "synthetic")
    );
    if (hasSynthetic) {
      reasons.push("Synthetic/demo data present");
      score += 1;
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

    // Add default reason if none
    if (reasons.length === 0) {
      reasons.push("Standard analysis uncertainty");
    }

    return { level, reasons };
  }

  /**
   * Generate recommendations based on findings and uncertainty.
   */
  private generateRecommendations(
    graphData: GraphData,
    findings: Finding[],
    uncertainty: MedAtlasOutput["uncertainty"]
  ): string[] {
    const recommendations: string[] = [];

    // Always recommend clinician review
    recommendations.push("Request clinician review and validate key findings.");

    // Check for missing modalities
    const hasImaging = graphData.nodes.some((n) => n.type === "study" || n.type === "image");
    const hasLabs = graphData.nodes.some((n) => n.type === "lab");
    const hasNotes = graphData.nodes.some((n) => n.type === "note");

    if (!hasImaging) {
      recommendations.push("Consider acquiring imaging studies if clinically indicated.");
    }

    if (!hasLabs) {
      recommendations.push("Request relevant laboratory studies for comprehensive assessment.");
    }

    if (!hasNotes) {
      recommendations.push("Include clinical notes for complete context.");
    }

    // High uncertainty recommendations
    if (uncertainty.level === "high") {
      recommendations.push("Additional data collection recommended due to high uncertainty.");
    }

    // Contradiction handling
    const contradictions = graphData.edges.filter((e) => e.type === "contradicts");
    if (contradictions.length > 0) {
      recommendations.push("Resolve contradictory findings before proceeding with analysis.");
    }

    // Finding-specific recommendations
    const significantFindings = findings.filter(
      (f) => f.probability === undefined || f.probability > 0.7
    );
    if (significantFindings.length > 0) {
      recommendations.push("Follow up on significant findings identified in this analysis.");
    }

    return recommendations;
  }
}
