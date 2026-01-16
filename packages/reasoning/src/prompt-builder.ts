import type { GraphData } from "@medatlas/graph/types";

export function buildSystemPrompt(): string {
  return `You are MedAtlas, a medical AI assistant that synthesizes multi-modal clinical data into structured outputs.

CRITICAL RULES:
1. Always output valid JSON matching the MedAtlasOutput schema
2. Every finding MUST have evidence references
3. Always include uncertainty assessment
4. Never provide medical advice - always require clinician review
5. Preserve provenance - link findings to source data`;
}

export function buildTaskPrompt(graphData: GraphData): string {
  const nodes = graphData.nodes;

  const sections: string[] = [
    "## Clinical Data\n",
  ];

  const patient = nodes.find(node => node.type === "patient");
  if (patient) {
    sections.push(`### Patient\n- Age: ${patient.properties.age}\n- Gender: ${patient.properties.gender}\n`);
  }

  const encounters = nodes.filter(node => node.type === "encounter");
  if (encounters.length > 0) {
    sections.push("### Encounters\n");
    for (const enc of encounters) {
      sections.push(`- ${enc.label}: ${enc.properties.reason ?? "N/A"} (${enc.timestamp})\n`);
    }
  }

  const labs = nodes.filter(node => node.type === "lab");
  if (labs.length > 0) {
    sections.push("### Laboratory Results\n");
    for (const lab of labs) {
      const abnormal = lab.properties.isAbnormal ? " [ABNORMAL]" : "";
      sections.push(`- ${lab.label}: ${lab.properties.value} ${lab.properties.unit}${abnormal}\n`);
    }
  }

  const studies = nodes.filter(node => node.type === "study");
  if (studies.length > 0) {
    sections.push("### Imaging Studies\n");
    for (const study of studies) {
      sections.push(`- ${study.label} (${study.timestamp})\n`);
    }
  }

  const findings = nodes.filter(node => node.type === "finding");
  if (findings.length > 0) {
    sections.push("### Findings\n");
    for (const finding of findings) {
      sections.push(`- ${finding.label} (confidence: ${finding.properties.probability ?? "N/A"})\n`);
    }
  }

  sections.push("\n## Task\nSynthesize the above data into a structured MedAtlasOutput JSON.");

  return sections.join("");
}

export function formatGraphDataForPrompt(graphData: GraphData): string {
  return buildTaskPrompt(graphData);
}
