/**
 * Mock Model Adapter for MedAtlas Reasoning Layer
 *
 * Provides a mock implementation that generates structured outputs
 * from graph data without calling an actual AI model. Useful for
 * demo purposes and testing.
 */

import type { MedAtlasOutput, Finding, EvidenceRef } from "@medatlas/schemas/types";
import type {
  ModelAdapter,
  ReasoningInput,
  ReasoningOptions,
  GraphNode,
  GraphEdge,
} from "./model-adapter.js";
import { validateOutput, sanitizeOutput } from "./output-validator.js";

/**
 * Mock Model Adapter
 *
 * Generates structured outputs by analyzing graph structure
 * and extracting relevant information from nodes and edges.
 */
export class MockModelAdapter implements ModelAdapter {
  readonly name = "mock";

  /**
   * Generate an interpretation from graph data
   *
   * This mock implementation:
   * 1. Extracts findings from graph nodes
   * 2. Extracts entities (conditions, labs, medications, etc.)
   * 3. Builds evidence chains from edges
   * 4. Generates a summary
   * 5. Calculates uncertainty
   * 6. Generates recommendations
   */
  async generateInterpretation(
    input: ReasoningInput,
    _options?: ReasoningOptions
  ): Promise<MedAtlasOutput> {
    const { caseId, graphData } = input;
    const { nodes, edges, modalities } = graphData;

    // Extract findings from finding nodes and observations
    const findings = this.extractFindings(nodes, edges);

    // Extract entities (conditions, labs, medications, observations)
    const extractedEntities = this.extractEntities(nodes);

    // Generate summary from graph data
    const summary = this.generateSummary(nodes, findings, extractedEntities);

    // Calculate uncertainty based on graph completeness
    const uncertainty = this.calculateUncertainty(nodes, edges, modalities);

    // Generate recommendations
    const recommendations = this.generateRecommendations(nodes, findings, uncertainty);

    const output: MedAtlasOutput = {
      caseId,
      modalities,
      summary,
      findings,
      extractedEntities,
      recommendations,
      uncertainty,
      safety: {
        notMedicalAdvice: true,
        requiresClinicianReview: true,
      },
    };

    // Validate and sanitize output
    return sanitizeOutput(output);
  }

  /**
   * Validate output against schema
   */
  validateOutput(output: unknown): boolean {
    return validateOutput(output).valid;
  }

  /**
   * Mock adapter is always available
   */
  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Extract findings from graph nodes
   */
  private extractFindings(nodes: GraphNode[], edges: GraphEdge[]): Finding[] {
    const findings: Finding[] = [];
    const edgeMap = this.buildEdgeMap(edges);

    // Find explicit finding nodes
    const findingNodes = nodes.filter((n) => n.type === "finding");
    for (const node of findingNodes) {
      findings.push(this.nodeToFinding(node, edgeMap, nodes));
    }

    // Extract findings from imaging studies with reports
    const studyNodes = nodes.filter((n) => n.type === "study");
    for (const node of studyNodes) {
      const studyFindings = this.extractStudyFindings(node, edgeMap, nodes);
      findings.push(...studyFindings);
    }

    // Extract findings from clinical notes (look for notable patterns)
    const noteNodes = nodes.filter((n) => n.type === "note");
    for (const node of noteNodes) {
      const noteFindings = this.extractNoteFindings(node);
      findings.push(...noteFindings);
    }

    // Extract findings from abnormal labs
    const labNodes = nodes.filter((n) => n.type === "lab");
    for (const node of labNodes) {
      if (this.isAbnormalLab(node)) {
        findings.push(this.labToFinding(node));
      }
    }

    // Deduplicate findings by label
    return this.deduplicateFindings(findings);
  }

  /**
   * Convert a finding node to a Finding object
   */
  private nodeToFinding(
    node: GraphNode,
    edgeMap: Map<string, GraphEdge[]>,
    allNodes: GraphNode[]
  ): Finding {
    const evidence = this.buildEvidenceChain(node, edgeMap, allNodes);

    const finding: Finding = {
      label: node.label,
      evidence,
    };

    if (typeof node.properties.probability === "number") {
      finding.probability = node.properties.probability;
    }

    if (node.properties.location && typeof node.properties.location === "object") {
      const loc = node.properties.location as Record<string, unknown>;
      finding.location = {
        anatomy: typeof loc.anatomy === "string" ? loc.anatomy : undefined,
        imageRef: typeof loc.imageRef === "string" ? loc.imageRef : undefined,
        sliceIndex: typeof loc.sliceIndex === "number" ? loc.sliceIndex : undefined,
        coordinates: Array.isArray(loc.coordinates) ? loc.coordinates as [number, number, number] : undefined,
      };
    }

    return finding;
  }

  /**
   * Extract findings from imaging study
   */
  private extractStudyFindings(
    node: GraphNode,
    edgeMap: Map<string, GraphEdge[]>,
    allNodes: GraphNode[]
  ): Finding[] {
    const findings: Finding[] = [];
    const evidence = this.buildEvidenceChain(node, edgeMap, allNodes);

    // Check for findings in properties
    if (Array.isArray(node.properties.findings)) {
      for (const f of node.properties.findings) {
        if (typeof f === "string") {
          findings.push({
            label: f,
            evidence,
          });
        } else if (f && typeof f === "object") {
          const findingObj = f as Record<string, unknown>;
          if (typeof findingObj.label === "string") {
            const finding: Finding = {
              label: findingObj.label,
              evidence,
            };
            if (typeof findingObj.probability === "number") {
              finding.probability = findingObj.probability;
            }
            findings.push(finding);
          }
        }
      }
    }

    // Extract from report text using simple pattern matching
    if (typeof node.properties.report === "string") {
      const reportFindings = this.extractFindingsFromText(
        node.properties.report,
        evidence
      );
      findings.push(...reportFindings);
    }

    return findings;
  }

  /**
   * Extract findings from clinical note
   */
  private extractNoteFindings(node: GraphNode): Finding[] {
    const findings: Finding[] = [];
    const evidence: EvidenceRef[] = node.evidence || [
      { source: "note", id: node.id },
    ];

    if (typeof node.properties.text === "string") {
      const noteFindings = this.extractFindingsFromText(node.properties.text, evidence);
      findings.push(...noteFindings);
    }

    return findings;
  }

  /**
   * Extract findings from text using pattern matching
   */
  private extractFindingsFromText(text: string, evidence: EvidenceRef[]): Finding[] {
    const findings: Finding[] = [];
    const lowerText = text.toLowerCase();

    // Medical finding patterns (simplified for demo)
    const patterns = [
      { pattern: /nodule|mass|lesion/i, label: "Nodule/Mass identified" },
      { pattern: /opacity|consolidation/i, label: "Pulmonary opacity" },
      { pattern: /effusion/i, label: "Effusion present" },
      { pattern: /fracture/i, label: "Fracture identified" },
      { pattern: /stenosis/i, label: "Stenosis noted" },
      { pattern: /enlarged|enlargement/i, label: "Organ enlargement" },
      { pattern: /atelectasis/i, label: "Atelectasis present" },
      { pattern: /pneumonia/i, label: "Pneumonia suspected" },
      { pattern: /cardiomegaly/i, label: "Cardiomegaly" },
      { pattern: /edema/i, label: "Edema present" },
    ];

    for (const { pattern, label } of patterns) {
      if (pattern.test(lowerText)) {
        findings.push({
          label,
          probability: 0.75, // Default probability for text-extracted findings
          evidence,
        });
      }
    }

    return findings;
  }

  /**
   * Check if a lab result is abnormal
   */
  private isAbnormalLab(node: GraphNode): boolean {
    const interpretation = String(node.properties.interpretation || "").toLowerCase();
    const referenceRange = String(node.properties.referenceRange || "");
    const value = node.properties.value;

    // Check interpretation flag
    if (
      interpretation.includes("high") ||
      interpretation.includes("low") ||
      interpretation.includes("abnormal") ||
      interpretation.includes("critical")
    ) {
      return true;
    }

    // Check if value is outside reference range
    if (typeof value === "number" && referenceRange) {
      const rangeMatch = referenceRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);
        if (value < min || value > max) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Convert an abnormal lab to a finding
   */
  private labToFinding(node: GraphNode): Finding {
    const interpretation = String(node.properties.interpretation || "abnormal");
    const value = node.properties.value;
    const unit = node.properties.unit || "";

    let label = `${node.label}`;
    if (value !== undefined) {
      label += `: ${value} ${unit}`;
    }
    label += ` (${interpretation})`;

    return {
      label,
      evidence: node.evidence || [{ source: "lab", id: node.id }],
    };
  }

  /**
   * Deduplicate findings by label
   */
  private deduplicateFindings(findings: Finding[]): Finding[] {
    const seen = new Map<string, Finding>();
    for (const finding of findings) {
      const key = finding.label.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, finding);
      } else {
        // Merge evidence
        const existing = seen.get(key)!;
        const existingIds = new Set(existing.evidence.map((e) => `${e.source}:${e.id}`));
        for (const e of finding.evidence) {
          if (!existingIds.has(`${e.source}:${e.id}`)) {
            existing.evidence.push(e);
          }
        }
        // Use higher probability if available
        if (
          finding.probability !== undefined &&
          (existing.probability === undefined || finding.probability > existing.probability)
        ) {
          existing.probability = finding.probability;
        }
      }
    }
    return Array.from(seen.values());
  }

  /**
   * Extract entities from graph nodes
   */
  private extractEntities(
    nodes: GraphNode[]
  ): MedAtlasOutput["extractedEntities"] {
    const entities: MedAtlasOutput["extractedEntities"] = [];

    // Extract conditions
    for (const node of nodes.filter((n) => n.type === "condition")) {
      entities.push({
        type: "condition",
        text: node.label,
        evidence: node.evidence || [{ source: "fhir", id: node.id }],
      });
    }

    // Extract medications
    for (const node of nodes.filter((n) => n.type === "medication")) {
      const entity: MedAtlasOutput["extractedEntities"][number] = {
        type: "medication",
        text: node.label,
        evidence: node.evidence || [{ source: "fhir", id: node.id }],
      };
      if (typeof node.properties.dosage === "string") {
        entity.text += ` (${node.properties.dosage})`;
      }
      entities.push(entity);
    }

    // Extract labs as entities
    for (const node of nodes.filter((n) => n.type === "lab")) {
      const entity: MedAtlasOutput["extractedEntities"][number] = {
        type: "lab",
        text: node.label,
        evidence: node.evidence || [{ source: "lab", id: node.id }],
      };
      if (typeof node.properties.value === "number") {
        entity.value = node.properties.value;
      }
      if (typeof node.properties.unit === "string") {
        entity.unit = node.properties.unit;
      }
      entities.push(entity);
    }

    // Extract observations as entities
    for (const node of nodes.filter((n) => n.type === "observation")) {
      const entity: MedAtlasOutput["extractedEntities"][number] = {
        type: "observation",
        text: node.label,
        evidence: node.evidence || [{ source: "fhir", id: node.id }],
      };
      if (typeof node.properties.value === "number") {
        entity.value = node.properties.value;
      }
      if (typeof node.properties.unit === "string") {
        entity.unit = node.properties.unit;
      }
      entities.push(entity);
    }

    return entities;
  }

  /**
   * Generate a summary from graph data
   */
  private generateSummary(
    nodes: GraphNode[],
    findings: Finding[],
    entities: MedAtlasOutput["extractedEntities"]
  ): string {
    const parts: string[] = [];

    // Patient info
    const patient = nodes.find((n) => n.type === "patient");
    if (patient) {
      let patientInfo = "Patient";
      if (patient.properties.age) {
        patientInfo += `, ${patient.properties.age}`;
      }
      if (patient.properties.gender) {
        patientInfo += ` ${patient.properties.gender}`;
      }
      parts.push(patientInfo);
    }

    // Encounter info
    const encounters = nodes.filter((n) => n.type === "encounter");
    if (encounters.length > 0) {
      const latest = encounters[encounters.length - 1];
      if (latest.properties.reason) {
        parts.push(`presenting with ${latest.properties.reason}`);
      }
    }

    // Modalities available
    const studies = nodes.filter((n) => n.type === "study");
    if (studies.length > 0) {
      const modalities = studies
        .map((s) => s.properties.modality || s.label)
        .filter(Boolean);
      if (modalities.length > 0) {
        parts.push(`Imaging: ${modalities.join(", ")}`);
      }
    }

    // Key findings
    if (findings.length > 0) {
      const topFindings = findings.slice(0, 3).map((f) => f.label);
      parts.push(`Key findings: ${topFindings.join("; ")}`);
    }

    // Active conditions
    const conditions = entities.filter((e) => e.type === "condition");
    if (conditions.length > 0) {
      const conditionNames = conditions.slice(0, 3).map((c) => c.text);
      parts.push(`Active conditions: ${conditionNames.join(", ")}`);
    }

    // Abnormal labs
    const abnormalLabs = entities.filter(
      (e) =>
        e.type === "lab" &&
        (e.text.toLowerCase().includes("high") ||
          e.text.toLowerCase().includes("low") ||
          e.text.toLowerCase().includes("abnormal"))
    );
    if (abnormalLabs.length > 0) {
      parts.push(`${abnormalLabs.length} abnormal lab value(s) noted`);
    }

    if (parts.length === 0) {
      return "Synthetic case for demonstration. Limited data available.";
    }

    return parts.join(". ") + ".";
  }

  /**
   * Calculate uncertainty based on graph completeness
   */
  private calculateUncertainty(
    nodes: GraphNode[],
    edges: GraphEdge[],
    modalities: string[]
  ): MedAtlasOutput["uncertainty"] {
    const reasons: string[] = [];
    let score = 0; // Lower is better

    // Check for missing modalities
    const nodeTypes = new Set(nodes.map((n) => n.type));
    if (!nodeTypes.has("study")) {
      reasons.push("No imaging studies available");
      score += 2;
    }
    if (!nodeTypes.has("note")) {
      reasons.push("No clinical notes available");
      score += 2;
    }
    if (!nodeTypes.has("lab")) {
      reasons.push("No laboratory results available");
      score += 1;
    }

    // Check for thin data
    if (nodes.length < 5) {
      reasons.push("Limited data points in case");
      score += 2;
    }

    // Check for weak evidence chains
    if (edges.length < 3) {
      reasons.push("Few cross-modal correlations established");
      score += 1;
    }

    // Check for contradictions
    const contradictions = edges.filter((e) => e.type === "contradicts");
    if (contradictions.length > 0) {
      reasons.push(`${contradictions.length} contradictory finding(s) present`);
      score += contradictions.length * 2;
    }

    // Check for low confidence edges
    const lowConfidenceEdges = edges.filter(
      (e) => e.confidence !== undefined && e.confidence < 0.5
    );
    if (lowConfidenceEdges.length > 0) {
      reasons.push("Some correlations have low confidence");
      score += 1;
    }

    // Check for synthetic data
    if (modalities.includes("synthetic")) {
      reasons.push("Contains synthetic/demo data");
      score += 1;
    }

    // Determine level
    let level: "low" | "medium" | "high";
    if (score >= 5) {
      level = "high";
    } else if (score >= 2) {
      level = "medium";
    } else {
      level = "low";
    }

    // Always add at least one reason for high uncertainty
    if (reasons.length === 0) {
      if (level === "high") {
        reasons.push("Insufficient data for confident interpretation");
      } else {
        reasons.push("Standard uncertainty for clinical data");
      }
    }

    return { level, reasons };
  }

  /**
   * Generate recommendations based on findings and uncertainty
   */
  private generateRecommendations(
    nodes: GraphNode[],
    findings: Finding[],
    uncertainty: MedAtlasOutput["uncertainty"]
  ): string[] {
    const recommendations: string[] = [];

    // Always include clinician review
    recommendations.push(
      "Clinician review required to validate findings and clinical correlation."
    );

    // Suggest missing data acquisition
    const nodeTypes = new Set(nodes.map((n) => n.type));
    if (!nodeTypes.has("study")) {
      recommendations.push(
        "Consider acquiring imaging if clinically indicated."
      );
    }
    if (!nodeTypes.has("lab")) {
      recommendations.push(
        "Laboratory workup may provide additional diagnostic clarity."
      );
    }

    // Suggest follow-up based on findings
    if (findings.some((f) => f.label.toLowerCase().includes("nodule"))) {
      recommendations.push(
        "Follow-up imaging may be indicated for nodule surveillance."
      );
    }
    if (findings.some((f) => f.label.toLowerCase().includes("effusion"))) {
      recommendations.push(
        "Consider clinical correlation for effusion significance."
      );
    }

    // Add uncertainty-specific recommendations
    if (uncertainty.level === "high") {
      recommendations.push(
        "High uncertainty: additional data collection recommended before clinical decision-making."
      );
    }

    // Limit to 5 recommendations
    return recommendations.slice(0, 5);
  }

  /**
   * Build a map of node ID to outgoing edges
   */
  private buildEdgeMap(edges: GraphEdge[]): Map<string, GraphEdge[]> {
    const map = new Map<string, GraphEdge[]>();
    for (const edge of edges) {
      if (!map.has(edge.source)) {
        map.set(edge.source, []);
      }
      map.get(edge.source)!.push(edge);

      // Also add reverse lookup for bidirectional traversal
      if (!map.has(edge.target)) {
        map.set(edge.target, []);
      }
      map.get(edge.target)!.push(edge);
    }
    return map;
  }

  /**
   * Build evidence chain for a node by traversing edges
   */
  private buildEvidenceChain(
    node: GraphNode,
    edgeMap: Map<string, GraphEdge[]>,
    allNodes: GraphNode[]
  ): EvidenceRef[] {
    const evidence: EvidenceRef[] = [];
    const seen = new Set<string>();
    const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

    // Add node's own evidence
    if (node.evidence) {
      for (const e of node.evidence) {
        const key = `${e.source}:${e.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          evidence.push(e);
        }
      }
    }

    // Add default evidence based on node type
    if (evidence.length === 0) {
      const source = this.nodeTypeToEvidenceSource(node.type);
      evidence.push({ source, id: node.id });
      seen.add(`${source}:${node.id}`);
    }

    // Traverse edges to find supporting evidence (1 level deep)
    const edges = edgeMap.get(node.id) || [];
    for (const edge of edges) {
      if (edge.type === "derived-from" || edge.type === "supports") {
        const targetId = edge.target === node.id ? edge.source : edge.target;
        const targetNode = nodeMap.get(targetId);
        if (targetNode) {
          if (targetNode.evidence) {
            for (const e of targetNode.evidence) {
              const key = `${e.source}:${e.id}`;
              if (!seen.has(key)) {
                seen.add(key);
                evidence.push(e);
              }
            }
          } else {
            const source = this.nodeTypeToEvidenceSource(targetNode.type);
            const key = `${source}:${targetNode.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              evidence.push({ source, id: targetNode.id });
            }
          }
        }
      }
    }

    return evidence;
  }

  /**
   * Map node type to evidence source
   */
  private nodeTypeToEvidenceSource(type: GraphNode["type"]): EvidenceRef["source"] {
    const mapping: Record<GraphNode["type"], EvidenceRef["source"]> = {
      patient: "fhir",
      encounter: "fhir",
      observation: "fhir",
      study: "dicom",
      lab: "lab",
      medication: "fhir",
      condition: "fhir",
      finding: "synthetic",
      note: "note",
      artifact: "synthetic",
    };
    return mapping[type] || "synthetic";
  }
}

/**
 * Create a new MockModelAdapter instance
 */
export function createMockAdapter(): MockModelAdapter {
  return new MockModelAdapter();
}
