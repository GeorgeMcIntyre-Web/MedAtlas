import type { GraphData, GraphNode, GraphEdge } from "./types";

/**
 * System prompt for MedAtlas reasoning
 */
export const SYSTEM_PROMPT = `# Research-grade system prompt (MedAtlas)

You are **MedAtlas Research Agent**. Your role is to produce **evidence-first** structured interpretations over medical inputs.

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

Return a single JSON object conforming to MedAtlasOutput schema.

### Evidence linking format

Each finding/entity must include one or more EvidenceRefs:
- source: one of [fhir, dicom, note, lab, device, claims, synthetic]
- id: stable identifier within the case bundle
- uri: optional
- capturedAt: optional ISO8601

### Reasoning discipline

- If evidence is weak or contradictory, set uncertainty.level to "high" and explain why.
- If you can only summarize, summarize. Do not diagnose.

Return JSON only.`;

/**
 * Format a single graph node for prompt inclusion
 */
function formatNode(node: GraphNode): string {
  const parts = [
    `[${node.type.toUpperCase()}] ${node.id}: ${node.label}`,
  ];
  
  if (node.timestamp) {
    parts.push(`  Timestamp: ${node.timestamp}`);
  }
  
  if (node.data && Object.keys(node.data).length > 0) {
    const dataStr = Object.entries(node.data)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(", ");
    parts.push(`  Data: ${dataStr}`);
  }
  
  if (node.evidence.length > 0) {
    const evidenceStr = node.evidence
      .map(e => `${e.source}:${e.id}`)
      .join(", ");
    parts.push(`  Evidence: ${evidenceStr}`);
  }
  
  return parts.join("\n");
}

/**
 * Format a single graph edge for prompt inclusion
 */
function formatEdge(edge: GraphEdge): string {
  return `  ${edge.source} --[${edge.relationship}]--> ${edge.target}`;
}

/**
 * Format complete graph data for prompt inclusion
 */
export function formatGraphDataForPrompt(graphData: GraphData): string {
  const sections: string[] = [];
  
  // Group nodes by type
  const nodesByType = new Map<string, GraphNode[]>();
  for (const node of graphData.nodes) {
    const existing = nodesByType.get(node.type) ?? [];
    existing.push(node);
    nodesByType.set(node.type, existing);
  }
  
  // Format nodes section
  sections.push("## GRAPH NODES\n");
  for (const [type, nodes] of nodesByType) {
    sections.push(`### ${type.charAt(0).toUpperCase() + type.slice(1)}s (${nodes.length})`);
    for (const node of nodes) {
      sections.push(formatNode(node));
    }
    sections.push("");
  }
  
  // Format edges section
  if (graphData.edges.length > 0) {
    sections.push("## GRAPH RELATIONSHIPS\n");
    for (const edge of graphData.edges) {
      sections.push(formatEdge(edge));
    }
    sections.push("");
  }
  
  // Format metadata
  if (graphData.metadata) {
    sections.push("## METADATA\n");
    sections.push(`Graph ID: ${graphData.graphId}`);
    if (graphData.patientId) {
      sections.push(`Patient ID: ${graphData.patientId}`);
    }
    sections.push(`Modalities: ${graphData.modalities.join(", ")}`);
    if (graphData.metadata.createdAt) {
      sections.push(`Created: ${graphData.metadata.createdAt}`);
    }
  }
  
  return sections.join("\n");
}

/**
 * Build the task-specific prompt for case interpretation
 */
export function buildTaskPrompt(graphData: GraphData, caseId: string): string {
  const graphText = formatGraphDataForPrompt(graphData);
  
  return `# Task prompt: multimodal case interpretation

## INPUT

- caseId: ${caseId}
- modalities: ${graphData.modalities.join(", ")}

Artifacts:
${graphText}

## TASK

1. Extract key entities (conditions, meds, labs, symptoms) with evidence links.
2. Identify notable findings in imaging descriptors (if present) and link evidence.
3. Provide a concise summary suitable for a clinician dashboard.
4. Provide recommendations as **next-steps questions** or **data requests**, not treatment.
5. Set uncertainty appropriately.

## OUTPUT

Return JSON conforming to MedAtlasOutput.`;
}

/**
 * Build complete prompt (system + task)
 */
export function buildFullPrompt(graphData: GraphData, caseId: string): {
  system: string;
  task: string;
} {
  return {
    system: SYSTEM_PROMPT,
    task: buildTaskPrompt(graphData, caseId),
  };
}
