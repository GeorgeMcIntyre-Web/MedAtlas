/**
 * Prompt Builder for MedAtlas Reasoning Layer
 *
 * Constructs prompts from graph data for AI model consumption.
 * Uses templates from @medatlas/prompts package.
 */

import type { GraphData, GraphNode, GraphEdge } from "./model-adapter.js";

/**
 * System prompt for the MedAtlas reasoning agent
 * Based on packages/prompts/research_system_prompt.md
 */
const SYSTEM_PROMPT = `You are **MedAtlas Research Agent**. Your role is to produce **evidence-first** structured interpretations over medical inputs.

### Core constraints

1. **Do not invent data.** If a field is missing, say so.
2. **Every claim must link to evidence** (source + id).
3. **Separate observation from inference.**
4. **Express uncertainty** explicitly.
5. **Output must validate** against the MedAtlas JSON Schema.
6. **Safety:** You are not a clinician. Outputs are for research and clinician review only.

### Input modalities

You may receive any combination of:
- clinical notes
- labs / vitals
- imaging references (and optionally image-derived descriptors)
- medications, conditions
- structured FHIR resources

### Output requirement

Return a single JSON object conforming to MedAtlasOutput schema with these fields:
- caseId: string
- modalities: string[]
- summary: string (concise clinician-facing summary)
- findings: array of { label, probability?, location?, evidence[] }
- extractedEntities: array of { type, text, value?, unit?, evidence[] }
- recommendations: string[] (next-steps questions or data requests, NOT treatment)
- uncertainty: { level: "low"|"medium"|"high", reasons: string[] }
- safety: { notMedicalAdvice: true, requiresClinicianReview: true }

### Evidence linking format

Each finding/entity must include one or more EvidenceRefs:
- source: one of [fhir, dicom, note, lab, device, claims, synthetic]
- id: stable identifier within the case bundle
- uri: optional
- capturedAt: optional ISO8601

### Reasoning discipline

- If evidence is weak or contradictory, set uncertainty.level to "high" and explain why.
- If you can only summarize, summarize. Do not diagnose.`;

/**
 * Get the system prompt for reasoning
 */
export function buildSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

/**
 * Build the task prompt with graph data injected
 *
 * @param graphData - The graph data to reason over
 * @param caseId - The case identifier
 * @returns The formatted task prompt
 */
export function buildTaskPrompt(graphData: GraphData, caseId: string): string {
  const graphText = formatGraphDataForPrompt(graphData);
  const modalities = graphData.modalities.join(", ");

  return `## INPUT

- caseId: ${caseId}
- modalities: ${modalities}

Artifacts:
${graphText}

## TASK

1. Extract key entities (conditions, meds, labs, symptoms) with evidence links.
2. Identify notable findings in imaging descriptors (if present) and link evidence.
3. Provide a concise summary suitable for a clinician dashboard.
4. Provide recommendations as **next-steps questions** or **data requests**, not treatment.
5. Set uncertainty appropriately.

## OUTPUT

Return JSON conforming to MedAtlasOutput schema.`;
}

/**
 * Format graph data as text for inclusion in prompts
 *
 * @param graphData - The graph data to format
 * @returns Text representation of the graph
 */
export function formatGraphDataForPrompt(graphData: GraphData): string {
  const sections: string[] = [];

  // Group nodes by type
  const nodesByType = groupNodesByType(graphData.nodes);

  // Format patient info
  if (nodesByType.patient.length > 0) {
    sections.push(formatPatientNodes(nodesByType.patient));
  }

  // Format encounters
  if (nodesByType.encounter.length > 0) {
    sections.push(formatEncounterNodes(nodesByType.encounter));
  }

  // Format clinical notes
  if (nodesByType.note.length > 0) {
    sections.push(formatNoteNodes(nodesByType.note));
  }

  // Format labs
  if (nodesByType.lab.length > 0) {
    sections.push(formatLabNodes(nodesByType.lab));
  }

  // Format observations
  if (nodesByType.observation.length > 0) {
    sections.push(formatObservationNodes(nodesByType.observation));
  }

  // Format imaging studies
  if (nodesByType.study.length > 0) {
    sections.push(formatStudyNodes(nodesByType.study));
  }

  // Format medications
  if (nodesByType.medication.length > 0) {
    sections.push(formatMedicationNodes(nodesByType.medication));
  }

  // Format conditions
  if (nodesByType.condition.length > 0) {
    sections.push(formatConditionNodes(nodesByType.condition));
  }

  // Format findings (already identified)
  if (nodesByType.finding.length > 0) {
    sections.push(formatFindingNodes(nodesByType.finding));
  }

  // Format relationships
  if (graphData.edges.length > 0) {
    sections.push(formatEdges(graphData.edges, graphData.nodes));
  }

  return sections.join("\n\n");
}

/**
 * Group nodes by their type
 */
function groupNodesByType(nodes: GraphNode[]): Record<GraphNode["type"], GraphNode[]> {
  const grouped: Record<GraphNode["type"], GraphNode[]> = {
    patient: [],
    encounter: [],
    observation: [],
    study: [],
    lab: [],
    medication: [],
    condition: [],
    finding: [],
    note: [],
    artifact: [],
  };

  for (const node of nodes) {
    grouped[node.type].push(node);
  }

  return grouped;
}

/**
 * Format patient nodes
 */
function formatPatientNodes(nodes: GraphNode[]): string {
  const lines = ["### Patient Information"];
  for (const node of nodes) {
    lines.push(`- ID: ${node.id}`);
    if (node.properties.age) lines.push(`  - Age: ${node.properties.age}`);
    if (node.properties.gender) lines.push(`  - Gender: ${node.properties.gender}`);
    if (node.properties.demographics)
      lines.push(`  - Demographics: ${JSON.stringify(node.properties.demographics)}`);
  }
  return lines.join("\n");
}

/**
 * Format encounter nodes
 */
function formatEncounterNodes(nodes: GraphNode[]): string {
  const lines = ["### Encounters"];
  const sorted = [...nodes].sort((a, b) =>
    (a.timestamp || "").localeCompare(b.timestamp || "")
  );
  for (const node of sorted) {
    const date = node.timestamp ? ` (${node.timestamp})` : "";
    lines.push(`- [${node.id}] ${node.label}${date}`);
    if (node.properties.type) lines.push(`  - Type: ${node.properties.type}`);
    if (node.properties.reason) lines.push(`  - Reason: ${node.properties.reason}`);
    if (node.evidence) {
      lines.push(`  - Evidence: ${formatEvidence(node.evidence)}`);
    }
  }
  return lines.join("\n");
}

/**
 * Format clinical note nodes
 */
function formatNoteNodes(nodes: GraphNode[]): string {
  const lines = ["### Clinical Notes"];
  for (const node of nodes) {
    const date = node.timestamp ? ` (${node.timestamp})` : "";
    lines.push(`- [${node.id}] ${node.label}${date}`);
    if (node.properties.text) {
      const text = String(node.properties.text);
      const preview = text.length > 500 ? text.substring(0, 500) + "..." : text;
      lines.push(`  Content: "${preview}"`);
    }
    if (node.evidence) {
      lines.push(`  Evidence: ${formatEvidence(node.evidence)}`);
    }
  }
  return lines.join("\n");
}

/**
 * Format lab nodes
 */
function formatLabNodes(nodes: GraphNode[]): string {
  const lines = ["### Laboratory Results"];
  const sorted = [...nodes].sort((a, b) =>
    (a.timestamp || "").localeCompare(b.timestamp || "")
  );
  for (const node of sorted) {
    const date = node.timestamp ? ` (${node.timestamp})` : "";
    let valueStr = "";
    if (node.properties.value !== undefined) {
      valueStr = `: ${node.properties.value}`;
      if (node.properties.unit) valueStr += ` ${node.properties.unit}`;
    }
    lines.push(`- [${node.id}] ${node.label}${valueStr}${date}`);
    if (node.properties.referenceRange) {
      lines.push(`  - Reference: ${node.properties.referenceRange}`);
    }
    if (node.properties.interpretation) {
      lines.push(`  - Interpretation: ${node.properties.interpretation}`);
    }
    if (node.evidence) {
      lines.push(`  - Evidence: ${formatEvidence(node.evidence)}`);
    }
  }
  return lines.join("\n");
}

/**
 * Format observation nodes
 */
function formatObservationNodes(nodes: GraphNode[]): string {
  const lines = ["### Observations"];
  const sorted = [...nodes].sort((a, b) =>
    (a.timestamp || "").localeCompare(b.timestamp || "")
  );
  for (const node of sorted) {
    const date = node.timestamp ? ` (${node.timestamp})` : "";
    let valueStr = "";
    if (node.properties.value !== undefined) {
      valueStr = `: ${node.properties.value}`;
      if (node.properties.unit) valueStr += ` ${node.properties.unit}`;
    }
    lines.push(`- [${node.id}] ${node.label}${valueStr}${date}`);
    if (node.evidence) {
      lines.push(`  - Evidence: ${formatEvidence(node.evidence)}`);
    }
  }
  return lines.join("\n");
}

/**
 * Format imaging study nodes
 */
function formatStudyNodes(nodes: GraphNode[]): string {
  const lines = ["### Imaging Studies"];
  const sorted = [...nodes].sort((a, b) =>
    (a.timestamp || "").localeCompare(b.timestamp || "")
  );
  for (const node of sorted) {
    const date = node.timestamp ? ` (${node.timestamp})` : "";
    lines.push(`- [${node.id}] ${node.label}${date}`);
    if (node.properties.modality) {
      lines.push(`  - Modality: ${node.properties.modality}`);
    }
    if (node.properties.bodyPart) {
      lines.push(`  - Body Part: ${node.properties.bodyPart}`);
    }
    if (node.properties.report) {
      const report = String(node.properties.report);
      const preview = report.length > 500 ? report.substring(0, 500) + "..." : report;
      lines.push(`  - Report: "${preview}"`);
    }
    if (node.properties.findings) {
      lines.push(`  - Findings: ${JSON.stringify(node.properties.findings)}`);
    }
    if (node.evidence) {
      lines.push(`  - Evidence: ${formatEvidence(node.evidence)}`);
    }
  }
  return lines.join("\n");
}

/**
 * Format medication nodes
 */
function formatMedicationNodes(nodes: GraphNode[]): string {
  const lines = ["### Medications"];
  for (const node of nodes) {
    const date = node.timestamp ? ` (started: ${node.timestamp})` : "";
    lines.push(`- [${node.id}] ${node.label}${date}`);
    if (node.properties.dosage) lines.push(`  - Dosage: ${node.properties.dosage}`);
    if (node.properties.frequency)
      lines.push(`  - Frequency: ${node.properties.frequency}`);
    if (node.properties.route) lines.push(`  - Route: ${node.properties.route}`);
    if (node.evidence) {
      lines.push(`  - Evidence: ${formatEvidence(node.evidence)}`);
    }
  }
  return lines.join("\n");
}

/**
 * Format condition nodes
 */
function formatConditionNodes(nodes: GraphNode[]): string {
  const lines = ["### Conditions / Diagnoses"];
  for (const node of nodes) {
    const date = node.timestamp ? ` (${node.timestamp})` : "";
    lines.push(`- [${node.id}] ${node.label}${date}`);
    if (node.properties.status) lines.push(`  - Status: ${node.properties.status}`);
    if (node.properties.severity)
      lines.push(`  - Severity: ${node.properties.severity}`);
    if (node.properties.code) lines.push(`  - Code: ${node.properties.code}`);
    if (node.evidence) {
      lines.push(`  - Evidence: ${formatEvidence(node.evidence)}`);
    }
  }
  return lines.join("\n");
}

/**
 * Format finding nodes
 */
function formatFindingNodes(nodes: GraphNode[]): string {
  const lines = ["### Identified Findings"];
  for (const node of nodes) {
    lines.push(`- [${node.id}] ${node.label}`);
    if (node.properties.probability !== undefined) {
      lines.push(`  - Probability: ${node.properties.probability}`);
    }
    if (node.properties.location) {
      lines.push(`  - Location: ${JSON.stringify(node.properties.location)}`);
    }
    if (node.evidence) {
      lines.push(`  - Evidence: ${formatEvidence(node.evidence)}`);
    }
  }
  return lines.join("\n");
}

/**
 * Format graph edges (relationships)
 */
function formatEdges(edges: GraphEdge[], nodes: GraphNode[]): string {
  const lines = ["### Relationships"];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  for (const edge of edges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    const sourceLabel = sourceNode ? sourceNode.label : edge.source;
    const targetLabel = targetNode ? targetNode.label : edge.target;
    const confidence = edge.confidence !== undefined ? ` (confidence: ${edge.confidence})` : "";
    lines.push(`- "${sourceLabel}" --[${edge.type}]--> "${targetLabel}"${confidence}`);
  }

  return lines.join("\n");
}

/**
 * Format evidence references
 */
function formatEvidence(evidence: NonNullable<GraphNode["evidence"]>): string {
  return evidence.map((e) => `${e.source}:${e.id}`).join(", ");
}

/**
 * Create a complete prompt combining system and task prompts
 *
 * @param graphData - The graph data
 * @param caseId - The case identifier
 * @returns Object with system and user prompts
 */
export function buildCompletePrompt(
  graphData: GraphData,
  caseId: string
): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt: buildSystemPrompt(),
    userPrompt: buildTaskPrompt(graphData, caseId),
  };
}
