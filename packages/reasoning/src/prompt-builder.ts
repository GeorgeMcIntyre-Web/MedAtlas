/**
 * Prompt builder for AI model integration.
 * Constructs prompts from graph data for model inference.
 */

import type { GraphData, GraphNode, GraphEdge } from "@medatlas/graph";

/**
 * System prompt for the MedAtlas Research Agent.
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
- summary: string
- findings: Array<{label, probability?, location?, evidence[]}>
- extractedEntities: Array<{type, text, value?, unit?, evidence[]}>
- recommendations: string[]
- uncertainty: {level: "low"|"medium"|"high", reasons: string[]}
- safety: {notMedicalAdvice: true, requiresClinicianReview: true}

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
 * Task prompt template.
 * Based on packages/prompts/task_prompts/multimodal_case_prompt.md
 */
const TASK_PROMPT_TEMPLATE = `## INPUT

- caseId: {{caseId}}
- modalities: {{modalities}}

Artifacts:
{{artifacts}}

## TASK

1. Extract key entities (conditions, meds, labs, symptoms) with evidence links.
2. Identify notable findings in imaging descriptors (if present) and link evidence.
3. Provide a concise summary suitable for a clinician dashboard.
4. Provide recommendations as **next-steps questions** or **data requests**, not treatment.
5. Set uncertainty appropriately.

## OUTPUT

Return JSON conforming to MedAtlasOutput.`;

/**
 * Build the system prompt.
 */
export function buildSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

/**
 * Build a task prompt from graph data.
 */
export function buildTaskPrompt(graphData: GraphData, caseId: string): string {
  const modalities = extractModalities(graphData);
  const artifacts = formatGraphDataForPrompt(graphData);

  return TASK_PROMPT_TEMPLATE
    .replace("{{caseId}}", caseId)
    .replace("{{modalities}}", modalities.join(", "))
    .replace("{{artifacts}}", artifacts);
}

/**
 * Extract modalities from graph data.
 */
function extractModalities(graphData: GraphData): string[] {
  const modalities = new Set<string>();

  for (const node of graphData.nodes) {
    // Add node type as modality for relevant types
    if (["image", "study", "lab", "note"].includes(node.type)) {
      modalities.add(node.type);
    }

    // Check evidence sources
    for (const evidence of node.evidence) {
      modalities.add(evidence.source);
    }
  }

  return Array.from(modalities);
}

/**
 * Format graph data as text for prompt injection.
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

  // Format each node type section
  const typeOrder = ["patient", "encounter", "condition", "medication", "lab", "study", "image", "note", "observation", "finding"];
  
  for (const type of typeOrder) {
    const nodes = nodesByType.get(type);
    if (!nodes || nodes.length === 0) continue;

    sections.push(`### ${capitalizeFirst(type)}${nodes.length > 1 ? "s" : ""}`);
    
    for (const node of nodes) {
      sections.push(formatNode(node));
    }
    
    sections.push(""); // Empty line between sections
  }

  // Format relationships (edges)
  if (graphData.edges.length > 0) {
    sections.push("### Relationships");
    
    // Group edges by type
    const edgesByType = new Map<string, GraphEdge[]>();
    for (const edge of graphData.edges) {
      const existing = edgesByType.get(edge.type) ?? [];
      existing.push(edge);
      edgesByType.set(edge.type, existing);
    }

    for (const [type, edges] of edgesByType) {
      sections.push(`\n**${formatEdgeType(type)}:**`);
      for (const edge of edges.slice(0, 10)) { // Limit to 10 per type
        sections.push(`- ${edge.source} → ${edge.target}`);
      }
      if (edges.length > 10) {
        sections.push(`- ... and ${edges.length - 10} more`);
      }
    }
  }

  return sections.join("\n");
}

/**
 * Format a single node for the prompt.
 */
function formatNode(node: GraphNode): string {
  const lines: string[] = [];
  
  lines.push(`**${node.label}** (id: ${node.id})`);
  
  // Add timestamp if available
  if (node.timestamp) {
    lines.push(`  - Date: ${node.timestamp}`);
  }

  // Add key properties
  const importantProps = ["value", "unit", "status", "result", "severity", "summary"];
  for (const prop of importantProps) {
    if (node.properties[prop] !== undefined) {
      lines.push(`  - ${capitalizeFirst(prop)}: ${node.properties[prop]}`);
    }
  }

  // Add evidence references
  if (node.evidence.length > 0) {
    const evidenceStr = node.evidence
      .map((e) => `${e.source}:${e.id}`)
      .join(", ");
    lines.push(`  - Evidence: [${evidenceStr}]`);
  }

  return lines.join("\n");
}

/**
 * Format edge type for display.
 */
function formatEdgeType(type: string): string {
  return type
    .split("-")
    .map(capitalizeFirst)
    .join(" ");
}

/**
 * Capitalize first letter.
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Build a complete prompt with system and task parts.
 */
export function buildFullPrompt(graphData: GraphData, caseId: string): {
  systemPrompt: string;
  taskPrompt: string;
} {
  return {
    systemPrompt: buildSystemPrompt(),
    taskPrompt: buildTaskPrompt(graphData, caseId),
  };
}

/**
 * Estimate token count for a prompt (rough approximation).
 * Uses ~4 characters per token as a rough estimate.
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate graph data if it would exceed token limits.
 */
export function truncateGraphDataForPrompt(
  graphData: GraphData,
  maxTokens: number = 4000
): GraphData {
  const formatted = formatGraphDataForPrompt(graphData);
  const tokens = estimateTokenCount(formatted);

  if (tokens <= maxTokens) {
    return graphData;
  }

  // Need to truncate - prioritize recent and important nodes
  const truncated: GraphData = {
    ...graphData,
    nodes: [],
    edges: [],
  };

  // Sort nodes by importance and recency
  const sortedNodes = [...graphData.nodes].sort((a, b) => {
    // Prioritize findings and observations
    const typeOrder: Record<string, number> = {
      finding: 0,
      observation: 1,
      lab: 2,
      condition: 3,
      medication: 4,
      note: 5,
      study: 6,
      image: 7,
      encounter: 8,
      patient: 9,
    };

    const aOrder = typeOrder[a.type] ?? 10;
    const bOrder = typeOrder[b.type] ?? 10;

    if (aOrder !== bOrder) return aOrder - bOrder;

    // Then by timestamp (recent first)
    if (a.timestamp && b.timestamp) {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    return 0;
  });

  // Add nodes until we approach the limit
  const includedNodeIds = new Set<string>();
  for (const node of sortedNodes) {
    truncated.nodes.push(node);
    includedNodeIds.add(node.id);

    const currentFormatted = formatGraphDataForPrompt(truncated);
    if (estimateTokenCount(currentFormatted) > maxTokens * 0.8) {
      // Remove the last node and stop
      truncated.nodes.pop();
      includedNodeIds.delete(node.id);
      break;
    }
  }

  // Add edges that connect included nodes
  for (const edge of graphData.edges) {
    if (includedNodeIds.has(edge.source) && includedNodeIds.has(edge.target)) {
      truncated.edges.push(edge);
    }
  }

  return truncated;
}
