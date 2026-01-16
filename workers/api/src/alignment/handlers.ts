import { demoGraph } from "../graph/handlers";
import {
  findAlignments,
  buildEvidenceChain,
  getSourceArtifacts,
  matchByLocation,
  matchByTemporalProximity
} from "@medatlas/alignment";
import type { AlignmentMatch } from "@medatlas/alignment";

const json = (value: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(value, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {})
    }
  });

export async function handleAlignmentForFinding(findingId: string): Promise<Response> {
  const graphData = demoGraph.serialize();
  const finding = graphData.nodes.find(node => node.id === findingId);
  if (!finding) return json({ error: "not_found" }, { status: 404 });

  const alignment = findAlignments(finding, graphData);
  return json({ alignment });
}

export async function handleAlignmentFindings(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const patientId = url.searchParams.get("patientId");

  const graphData = demoGraph.serialize();
  const findings = graphData.nodes.filter(node => node.type === "finding" && (!patientId || node.properties.patientId === patientId));
  const alignments = findings.map(finding => findAlignments(finding, graphData));

  return json({ alignments });
}

export async function handleEvidenceChain(nodeId: string): Promise<Response> {
  const graphData = demoGraph.serialize();
  const chain = buildEvidenceChain(nodeId, graphData);
  const sourceArtifacts = getSourceArtifacts(chain);
  return json({ chain, sourceArtifacts });
}

const semanticOverlap = (a: string, b: string): number => {
  const aWords = a.toLowerCase().split(/\W+/).filter(Boolean);
  const bWords = b.toLowerCase().split(/\W+/).filter(Boolean);
  if (aWords.length === 0 || bWords.length === 0) return 0;
  const bSet = new Set(bWords);
  const overlap = aWords.filter(word => bSet.has(word)).length;
  return overlap / Math.max(aWords.length, bWords.length);
};

export async function handleCompare(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const node1Id = url.searchParams.get("node1");
  const node2Id = url.searchParams.get("node2");
  if (!node1Id || !node2Id) {
    return json({ error: "missing_params" }, { status: 400 });
  }

  const graphData = demoGraph.serialize();
  const node1 = graphData.nodes.find(node => node.id === node1Id);
  const node2 = graphData.nodes.find(node => node.id === node2Id);
  if (!node1 || !node2) return json({ error: "not_found" }, { status: 404 });

  const matches: AlignmentMatch[] = [];

  matches.push(...matchByLocation(node1, [node2]));
  matches.push(...matchByTemporalProximity(node1, [node2]));

  const semanticScore = semanticOverlap(node1.label, node2.label);
  if (semanticScore >= 0.4) {
    matches.push({
      node1Id,
      node2Id,
      matchType: "semantic",
      confidence: Math.min(0.9, 0.5 + semanticScore / 2),
      reason: "Shared label terms"
    });
  }

  return json({ node1, node2, matches });
}
