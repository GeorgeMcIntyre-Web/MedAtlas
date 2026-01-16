import type { MedAtlasOutput, Finding } from "@medatlas/schemas/types";
import type { ModelAdapter, ReasoningInput, ReasoningOptions, GraphNode } from "./model-adapter";

export class MockModelAdapter implements ModelAdapter {
  readonly name = "mock";

  async isAvailable(): Promise<boolean> {
    return true;
  }

  validateOutput(output: unknown): boolean {
    if (!output || typeof output !== "object") return false;
    const o = output as Record<string, unknown>;
    return (
      typeof o.caseId === "string" &&
      Array.isArray(o.modalities) &&
      typeof o.summary === "string" &&
      Array.isArray(o.findings) &&
      Array.isArray(o.recommendations) &&
      typeof o.uncertainty === "object" &&
      typeof o.safety === "object"
    );
  }

  async generateInterpretation(input: ReasoningInput, options?: ReasoningOptions): Promise<MedAtlasOutput> {
    const { caseId, graphData, modalities } = input;
    const nodes = graphData.nodes;

    const findingNodes = nodes.filter(node => node.type === "finding");
    const labNodes = nodes.filter(node => node.type === "lab" && node.properties.isAbnormal);
    const patientNode = nodes.find(node => node.type === "patient");

    const findings: Finding[] = [
      ...findingNodes.map(node => ({
        label: node.label,
        probability: (node.properties.probability as number) ?? 0.5,
        location: node.properties.anatomy ? { anatomy: node.properties.anatomy as string } : undefined,
        evidence: node.evidence
      })),
      ...labNodes.map(node => ({
        label: `Abnormal ${node.label}: ${node.properties.value} ${node.properties.unit}`,
        probability: 0.9,
        evidence: node.evidence
      }))
    ];

    const encounterNodes = nodes.filter(node => node.type === "encounter");
    const age = patientNode?.properties.age ?? "unknown";
    const gender = patientNode?.properties.gender ?? "patient";
    const reasons = encounterNodes.map(enc => enc.properties.reason).filter(Boolean);

    const summary = `${age}yo ${gender} presenting with ${reasons.join(", ") || "clinical evaluation"}. ` +
      `${findings.length} finding(s) identified across ${modalities.length} modality(ies). ` +
      `Key findings include: ${findings.slice(0, 3).map(f => f.label).join(", ")}.`;

    const extractedEntities = [
      ...nodes.filter(node => node.type === "condition").map(node => ({
        type: "condition",
        text: node.label,
        evidence: node.evidence
      })),
      ...nodes.filter(node => node.type === "medication").map(node => ({
        type: "medication",
        text: node.label,
        evidence: node.evidence
      }))
    ];

    const recommendations = this.generateRecommendations(findings, nodes);
    const uncertaintyLevel = this.calculateUncertainty(nodes, modalities);

    return {
      caseId,
      modalities,
      summary: summary.slice(0, options?.maxSummaryLength ?? 500),
      findings,
      extractedEntities,
      recommendations,
      uncertainty: {
        level: uncertaintyLevel,
        reasons: this.getUncertaintyReasons(nodes, modalities)
      },
      safety: {
        notMedicalAdvice: true,
        requiresClinicianReview: true
      }
    };
  }

  private generateRecommendations(findings: Finding[], nodes: GraphNode[]): string[] {
    const recs: string[] = [];

    recs.push("Clinician review of all findings is required before clinical decision-making.");

    for (const finding of findings.slice(0, 3)) {
      const label = finding.label.toLowerCase();
      if (label.includes("nodule")) {
        recs.push("Consider follow-up imaging per Fleischner Society guidelines.");
      }
      if (label.includes("troponin")) {
        recs.push("Serial cardiac biomarkers and ECG monitoring recommended.");
      }
      if (label.includes("coronary")) {
        recs.push("Consider cardiology consultation for further evaluation.");
      }
    }

    if (recs.length < 3) {
      recs.push("Correlate with clinical presentation and additional workup as indicated.");
    }

    return recs;
  }

  private calculateUncertainty(nodes: GraphNode[], modalities: string[]): "low" | "medium" | "high" {
    const hasImaging = nodes.some(node => node.type === "study" || node.type === "image");
    const hasLabs = nodes.some(node => node.type === "lab");
    const hasNotes = nodes.some(node => node.type === "note");
    const modalityCount = modalities.length;

    if (modalityCount >= 3 && hasImaging && hasLabs && hasNotes) return "low";
    if (modalityCount >= 2) return "medium";
    return "high";
  }

  private getUncertaintyReasons(nodes: GraphNode[], modalities: string[]): string[] {
    const reasons: string[] = [];

    if (!nodes.some(node => node.type === "study")) {
      reasons.push("No imaging studies available for correlation.");
    }
    if (!nodes.some(node => node.type === "note")) {
      reasons.push("Limited clinical documentation.");
    }
    if (modalities.includes("synthetic")) {
      reasons.push("Synthetic/demo data used for demonstration.");
    }
    if (nodes.filter(node => node.type === "finding").length < 2) {
      reasons.push("Limited findings for comprehensive assessment.");
    }

    if (reasons.length === 0) {
      reasons.push("Standard uncertainty for AI-assisted interpretation.");
    }

    return reasons;
  }
}
