import type { GraphNode, GraphEdge, NodeFilter, EdgeFilter, TimelineResponse } from "@medatlas/graph/types";
import { AtlasGraph, NodeFactory, EdgeFactory } from "@medatlas/graph";

type EvidenceChainStep = {
  nodeId: string;
  relationship: string;
  label?: string;
  nodeType?: string;
  evidence: Array<{ source: string; id: string; uri?: string; capturedAt?: string }>;
};

type EvidenceChain = {
  rootNodeId: string;
  rootLabel?: string;
  chain: EvidenceChainStep[];
  depth: number;
};

const json = (value: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(value, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {})
    }
  });

// Global demo graph instance
const demoGraph = new AtlasGraph("demo-graph");

// Initialize with demo data
function initDemoGraph() {
  if (demoGraph.nodeCount > 0) return;

  const patientId = "patient-001";
  const now = new Date();

  demoGraph.addNode(NodeFactory.patient(patientId, "Demo Patient", {
    age: 55,
    gender: "male",
    mrn: "MRN-12345"
  }));

  const encounterId = "encounter-001";
  demoGraph.addNode(NodeFactory.encounter(
    encounterId,
    "ED Visit",
    patientId,
    new Date(now.getTime() - 86400000).toISOString(),
    { reason: "Chest pain", type: "ED" }
  ));

  demoGraph.addNode(NodeFactory.lab(
    "lab-001",
    "Troponin I",
    patientId,
    new Date(now.getTime() - 82800000).toISOString(),
    0.15,
    "ng/mL",
    { referenceRange: { low: 0, high: 0.04 }, isAbnormal: true }
  ));

  demoGraph.addNode(NodeFactory.study(
    "study-001",
    "Chest CT",
    patientId,
    new Date(now.getTime() - 79200000).toISOString(),
    { modality: "CT", bodyPart: "Chest" }
  ));

  demoGraph.addNode(NodeFactory.finding(
    "finding-001",
    "Pulmonary Nodule",
    patientId,
    new Date(now.getTime() - 79200000).toISOString(),
    0.72,
    { anatomy: "Right upper lobe", size: "8mm" },
    [{ source: "dicom", id: "study-001-series-1" }]
  ));

  demoGraph.addEdge(EdgeFactory.belongsTo("edge-001", encounterId, patientId));
  demoGraph.addEdge(EdgeFactory.observedIn("edge-002", "lab-001", encounterId));
  demoGraph.addEdge(EdgeFactory.observedIn("edge-003", "study-001", encounterId));
  demoGraph.addEdge(EdgeFactory.hasFinding("edge-004", "study-001", "finding-001"));
}

initDemoGraph();

const parseTypeFilter = <T extends string>(value: string | null): T | T[] | undefined => {
  if (!value) return undefined;
  const items = value.split(",").map(part => part.trim()).filter(Boolean) as T[];
  return items.length > 1 ? items : items[0];
};

const readJson = async <T>(request: Request): Promise<T | null> => {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
};

const buildEvidenceChain = (startNodeId: string, maxDepth = 3): EvidenceChain => {
  const data = demoGraph.serialize();
  const nodeMap = new Map(data.nodes.map(node => [node.id, node]));
  const startNode = nodeMap.get(startNodeId);

  if (!startNode) {
    return { rootNodeId: startNodeId, chain: [], depth: 0 };
  }

  const visited = new Set<string>();
  const chain: EvidenceChainStep[] = [];
  const queue: Array<{ nodeId: string; depth: number; relationship: string }> = [
    { nodeId: startNodeId, depth: 0, relationship: "root" }
  ];
  let maxSeenDepth = 0;

  while (queue.length > 0) {
    const { nodeId, depth, relationship } = queue.shift()!;
    if (visited.has(nodeId) || depth > maxDepth) continue;
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) continue;

    maxSeenDepth = Math.max(maxSeenDepth, depth);
    chain.push({
      nodeId: node.id,
      relationship,
      label: node.label,
      nodeType: node.type,
      evidence: node.evidence
    });

    const connectedEdges = data.edges.filter(
      edge => edge.source === nodeId || edge.target === nodeId
    );

    for (const edge of connectedEdges) {
      const nextNodeId = edge.source === nodeId ? edge.target : edge.source;
      if (!visited.has(nextNodeId)) {
        queue.push({ nodeId: nextNodeId, depth: depth + 1, relationship: edge.type });
      }
    }
  }

  return {
    rootNodeId: startNodeId,
    rootLabel: startNode.label,
    chain,
    depth: maxSeenDepth
  };
};

export async function handleListNodes(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const start = url.searchParams.get("start") ?? undefined;
  const end = url.searchParams.get("end") ?? undefined;
  const filter: NodeFilter = {
    type: parseTypeFilter<GraphNode["type"]>(url.searchParams.get("type")),
    patientId: url.searchParams.get("patientId") ?? undefined,
    dateRange: start || end ? { start, end } : undefined
  };

  const nodes = demoGraph.queryNodes(filter);
  return json({ nodes });
}

export async function handleGetNode(id: string): Promise<Response> {
  const node = demoGraph.getNode(id);
  if (!node) return json({ error: "not_found" }, { status: 404 });
  const edges = demoGraph.getEdges(id);
  return json({ node, edges });
}

export async function handleAddNode(request: Request): Promise<Response> {
  const body = await readJson<GraphNode>(request);
  if (!body || typeof body.id !== "string") {
    return json({ error: "invalid_body" }, { status: 400 });
  }

  const node: GraphNode = {
    ...body,
    createdAt: body.createdAt ?? new Date().toISOString(),
    evidence: body.evidence ?? [],
    properties: body.properties ?? {}
  };

  demoGraph.addNode(node);
  return json({ node }, { status: 201 });
}

export async function handleDeleteNode(id: string): Promise<Response> {
  const removed = demoGraph.removeNode(id);
  return json({ removed });
}

export async function handleListEdges(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const filter: EdgeFilter = {
    type: parseTypeFilter<GraphEdge["type"]>(url.searchParams.get("type")),
    source: url.searchParams.get("source") ?? undefined,
    target: url.searchParams.get("target") ?? undefined
  };

  const edges = demoGraph.queryEdges(filter);
  return json({ edges });
}

export async function handleGetEdge(id: string): Promise<Response> {
  const edge = demoGraph.getEdge(id);
  if (!edge) return json({ error: "not_found" }, { status: 404 });
  return json({ edge });
}

export async function handleAddEdge(request: Request): Promise<Response> {
  const body = await readJson<GraphEdge>(request);
  if (!body || typeof body.id !== "string") {
    return json({ error: "invalid_body" }, { status: 400 });
  }

  const edge: GraphEdge = {
    ...body,
    createdAt: body.createdAt ?? new Date().toISOString(),
    evidence: body.evidence ?? [],
    properties: body.properties ?? {}
  };

  try {
    demoGraph.addEdge(edge);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "invalid_edge" }, { status: 400 });
  }

  return json({ edge }, { status: 201 });
}

export async function handleDeleteEdge(id: string): Promise<Response> {
  const removed = demoGraph.removeEdge(id);
  return json({ removed });
}

export async function handleGetTimeline(request: Request, patientId: string): Promise<Response> {
  const url = new URL(request.url);
  const range = {
    start: url.searchParams.get("start") ?? undefined,
    end: url.searchParams.get("end") ?? undefined
  };

  const events = demoGraph.getTimeline(patientId, range);
  const timestamps = events.map(event => new Date(event.timestamp).getTime()).sort((a, b) => a - b);
  const start = range.start ?? (timestamps[0] ? new Date(timestamps[0]).toISOString() : new Date().toISOString());
  const end = range.end ?? (timestamps[timestamps.length - 1] ? new Date(timestamps[timestamps.length - 1]).toISOString() : start);

  const response: TimelineResponse = {
    patientId,
    events,
    dateRange: { start, end }
  };

  return json(response);
}

export async function handleQuery(request: Request): Promise<Response> {
  const body = await readJson<{ nodes?: NodeFilter; edges?: EdgeFilter }>(request);
  if (!body) return json({ error: "invalid_body" }, { status: 400 });

  const nodes = body.nodes ? demoGraph.queryNodes(body.nodes) : demoGraph.getAllNodes();
  const edges = body.edges ? demoGraph.queryEdges(body.edges) : demoGraph.getAllEdges();

  return json({ nodes, edges });
}

export async function handleGetFindings(patientId: string): Promise<Response> {
  const nodes = demoGraph.queryNodes({ patientId, type: "finding" });
  return json({ nodes });
}

export async function handleGetEvidence(nodeId: string): Promise<Response> {
  const chain = buildEvidenceChain(nodeId, 3);
  return json({ chain });
}

export async function handleSerialize(): Promise<Response> {
  return json(demoGraph.serialize());
}

export { demoGraph };
