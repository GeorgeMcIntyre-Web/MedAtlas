/**
 * Prompt Builder
 * 
 * Constructs prompts for AI models from graph data and templates.
 * Uses the research system prompt and task prompts from @medatlas/prompts.
 */

import type { GraphData, GraphNode, GraphEdge } from "./model-adapter.js";

/**
 * System prompt for MedAtlas reasoning
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

Return a single JSON object conforming to MedAtlasOutput schema.

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
 * Task prompt template
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

Return JSON conforming to MedAtlasOutput schema.`;

/**
 * Get the system prompt for reasoning
 */
export function buildSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

/**
 * Build a task prompt from graph data
 * @param graphData - Graph data to include
 * @param caseId - Case identifier
 * @returns Formatted task prompt
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
 * Extract modalities from graph data
 */
function extractModalities(graphData: GraphData): string[] {
  const modalities = new Set<string>();
  
  for (const node of graphData.nodes) {
    const nodeType = node.type.toLowerCase();
    
    if (nodeType === "imaging" || nodeType === "study" || nodeType === "dicomimage") {
      modalities.add("imaging");
    } else if (nodeType === "note" || nodeType === "text") {
      modalities.add("note");
    } else if (nodeType === "lab" || nodeType === "labresult") {
      modalities.add("lab");
    } else if (nodeType === "medication") {
      modalities.add("medication");
    } else if (nodeType === "condition") {
      modalities.add("condition");
    } else if (nodeType === "fhir") {
      modalities.add("fhir");
    }

    // Also check evidence sources
    for (const ev of node.evidence || []) {
      if (ev.source !== "synthetic") {
        modalities.add(ev.source);
      }
    }
  }

  return Array.from(modalities);
}

/**
 * Format graph data for inclusion in a prompt
 * @param graphData - Graph data to format
 * @returns Text representation of graph data
 */
export function formatGraphDataForPrompt(graphData: GraphData): string {
  const sections: string[] = [];

  // Group nodes by type
  const nodesByType = new Map<string, GraphNode[]>();
  for (const node of graphData.nodes) {
    const type = node.type.toLowerCase();
    if (!nodesByType.has(type)) {
      nodesByType.set(type, []);
    }
    nodesByType.get(type)!.push(node);
  }

  // Format each node type section
  for (const [type, nodes] of nodesByType) {
    const typeLabel = formatTypeLabel(type);
    sections.push(`### ${typeLabel} (${nodes.length})`);
    
    for (const node of nodes) {
      sections.push(formatNode(node));
    }
    
    sections.push("");
  }

  // Format edges/relationships
  if (graphData.edges.length > 0) {
    sections.push("### Relationships");
    for (const edge of graphData.edges) {
      sections.push(formatEdge(edge, graphData.nodes));
    }
    sections.push("");
  }

  return sections.join("\n");
}

/**
 * Format a type label for display
 */
function formatTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    patient: "Patient",
    encounter: "Encounters",
    observation: "Observations",
    finding: "Findings",
    imaging: "Imaging Studies",
    study: "Studies",
    dicomimage: "DICOM Images",
    note: "Clinical Notes",
    text: "Text Documents",
    lab: "Laboratory Results",
    labresult: "Lab Results",
    medication: "Medications",
    condition: "Conditions",
    symptom: "Symptoms"
  };
  
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Format a single node for the prompt
 */
function formatNode(node: GraphNode): string {
  const lines: string[] = [];
  
  lines.push(`- **${node.label}** (id: ${node.id})`);
  
  if (node.timestamp) {
    lines.push(`  - Timestamp: ${node.timestamp}`);
  }
  
  if (node.properties) {
    for (const [key, value] of Object.entries(node.properties)) {
      if (value !== undefined && value !== null && key !== "id" && key !== "label") {
        const formattedValue = typeof value === "object" 
          ? JSON.stringify(value) 
          : String(value);
        lines.push(`  - ${key}: ${formattedValue}`);
      }
    }
  }
  
  if (node.evidence && node.evidence.length > 0) {
    const evidenceStr = node.evidence
      .map(e => `${e.source}:${e.id}`)
      .join(", ");
    lines.push(`  - Evidence: [${evidenceStr}]`);
  }
  
  return lines.join("\n");
}

/**
 * Format an edge for the prompt
 */
function formatEdge(edge: GraphEdge, nodes: GraphNode[]): string {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  
  const sourceLabel = sourceNode?.label || edge.source;
  const targetLabel = targetNode?.label || edge.target;
  
  return `- ${sourceLabel} --[${edge.type}]--> ${targetLabel}`;
}

/**
 * Build a complete prompt (system + task) for model invocation
 */
export function buildCompletePrompt(
  graphData: GraphData, 
  caseId: string
): { system: string; user: string } {
  return {
    system: buildSystemPrompt(),
    user: buildTaskPrompt(graphData, caseId)
  };
}

/**
 * Estimate token count for a prompt (rough approximation)
 * Uses ~4 chars per token heuristic
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate graph data if prompt would be too long
 * @param graphData - Graph data to potentially truncate
 * @param maxNodes - Maximum number of nodes to include
 * @returns Truncated graph data
 */
export function truncateGraphData(
  graphData: GraphData, 
  maxNodes: number = 50
): GraphData {
  if (graphData.nodes.length <= maxNodes) {
    return graphData;
  }

  // Prioritize certain node types
  const priorityTypes = ["finding", "condition", "lab", "imaging", "study"];
  
  const priorityNodes = graphData.nodes.filter(n => 
    priorityTypes.includes(n.type.toLowerCase())
  );
  const otherNodes = graphData.nodes.filter(n => 
    !priorityTypes.includes(n.type.toLowerCase())
  );

  const selectedNodes = [
    ...priorityNodes.slice(0, Math.min(priorityNodes.length, maxNodes * 0.7)),
    ...otherNodes.slice(0, maxNodes - Math.min(priorityNodes.length, maxNodes * 0.7))
  ].slice(0, maxNodes);

  const selectedNodeIds = new Set(selectedNodes.map(n => n.id));
  
  const selectedEdges = graphData.edges.filter(
    e => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
  );

  return {
    nodes: selectedNodes,
    edges: selectedEdges,
    patientId: graphData.patientId,
    caseId: graphData.caseId
  };
}
