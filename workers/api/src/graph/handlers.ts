/**
 * Graph API request handlers.
 * Handles all graph-related HTTP requests.
 */

import {
  AtlasGraph,
  getGlobalStorage,
  getOrCreateGraph,
  queryNodesExtended,
  queryEdgesExtended,
  getPatientFindings,
  getNodeEvidence,
  getCrossModalLinks,
  buildEvidenceChain,
  getTimelineSummary,
  type GraphNode,
  type GraphEdge,
  type NodeType,
  type EdgeType,
  type NodeFilter,
  type EdgeFilter,
  type TimelineEvent,
} from "@medatlas/graph";

const DEFAULT_GRAPH_ID = "demo-graph";

/**
 * Helper to create JSON responses.
 */
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

/**
 * Helper to create error responses.
 */
function errorResponse(message: string, status = 400): Response {
  return json({ error: message }, status);
}

/**
 * Get or create the demo graph.
 */
async function getGraph(graphId?: string): Promise<AtlasGraph> {
  const storage = getGlobalStorage();
  return getOrCreateGraph(storage, graphId ?? DEFAULT_GRAPH_ID);
}

/**
 * GET /graph/nodes - List nodes with optional filters
 */
export async function handleListNodes(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const graph = await getGraph(url.searchParams.get("graphId") ?? undefined);

  // Parse filters from query params
  const typeParam = url.searchParams.get("type");
  const patientId = url.searchParams.get("patientId") ?? undefined;
  const startDate = url.searchParams.get("startDate") ?? undefined;
  const endDate = url.searchParams.get("endDate") ?? undefined;
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "100", 10);

  const filter: NodeFilter = {};
  if (typeParam) {
    filter.type = typeParam.split(",") as NodeType[];
  }
  if (patientId) {
    filter.patientId = patientId;
  }
  if (startDate || endDate) {
    filter.dateRange = { start: startDate, end: endDate };
  }

  const result = queryNodesExtended(graph, {
    ...filter,
    pagination: { offset, limit },
    sort: { field: "timestamp", direction: "desc" },
  });

  return json({
    nodes: result.data,
    total: result.total,
    offset: result.offset,
    limit: result.limit,
  });
}

/**
 * GET /graph/node/:id - Get a single node by ID
 */
export async function handleGetNode(
  request: Request,
  nodeId: string
): Promise<Response> {
  const url = new URL(request.url);
  const graph = await getGraph(url.searchParams.get("graphId") ?? undefined);

  const node = graph.getNode(nodeId);
  if (!node) {
    return errorResponse(`Node not found: ${nodeId}`, 404);
  }

  // Get connected edges and evidence
  const evidence = getNodeEvidence(graph, nodeId);
  const crossModal = getCrossModalLinks(graph, nodeId);

  return json({
    node,
    evidence: evidence.evidence,
    linkedNodes: evidence.linkedNodes,
    crossModalLinks: crossModal,
  });
}

/**
 * GET /graph/edges - List edges with optional filters
 */
export async function handleListEdges(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const graph = await getGraph(url.searchParams.get("graphId") ?? undefined);

  // Parse filters from query params
  const typeParam = url.searchParams.get("type");
  const source = url.searchParams.get("source") ?? undefined;
  const target = url.searchParams.get("target") ?? undefined;
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "100", 10);

  const filter: EdgeFilter = {};
  if (typeParam) {
    filter.type = typeParam.split(",") as EdgeType[];
  }
  if (source) {
    filter.source = source;
  }
  if (target) {
    filter.target = target;
  }

  const result = queryEdgesExtended(graph, {
    ...filter,
    pagination: { offset, limit },
  });

  return json({
    edges: result.data,
    total: result.total,
    offset: result.offset,
    limit: result.limit,
  });
}

/**
 * GET /graph/edge/:id - Get a single edge by ID
 */
export async function handleGetEdge(
  request: Request,
  edgeId: string
): Promise<Response> {
  const url = new URL(request.url);
  const graph = await getGraph(url.searchParams.get("graphId") ?? undefined);

  const edge = graph.getEdge(edgeId);
  if (!edge) {
    return errorResponse(`Edge not found: ${edgeId}`, 404);
  }

  // Get source and target nodes
  const sourceNode = graph.getNode(edge.source);
  const targetNode = graph.getNode(edge.target);

  return json({
    edge,
    sourceNode,
    targetNode,
  });
}

/**
 * GET /graph/timeline/:patientId - Get timeline events for a patient
 */
export async function handleGetTimeline(
  request: Request,
  patientId: string
): Promise<Response> {
  const url = new URL(request.url);
  const graph = await getGraph(url.searchParams.get("graphId") ?? undefined);

  const startDate = url.searchParams.get("start") ?? undefined;
  const endDate = url.searchParams.get("end") ?? undefined;

  const events = graph.getTimeline(patientId, {
    start: startDate,
    end: endDate,
  });

  const summary = getTimelineSummary(graph, patientId);

  return json({
    patientId,
    events,
    dateRange: summary.dateRange ?? { start: null, end: null },
    totalEvents: summary.totalEvents,
    eventsByType: summary.eventsByType,
  });
}

/**
 * POST /graph/nodes - Add a new node
 */
export async function handleAddNode(request: Request): Promise<Response> {
  try {
    const body = await request.json() as Partial<GraphNode> & { graphId?: string };
    const { graphId, ...nodeData } = body;
    const graph = await getGraph(graphId);

    // Validate required fields
    if (!nodeData.id || !nodeData.type || !nodeData.label) {
      return errorResponse("Missing required fields: id, type, label");
    }

    const node: GraphNode = {
      id: nodeData.id,
      type: nodeData.type as NodeType,
      label: nodeData.label,
      properties: nodeData.properties ?? {},
      evidence: nodeData.evidence ?? [],
      timestamp: nodeData.timestamp,
      createdAt: nodeData.createdAt ?? new Date().toISOString(),
    };

    graph.addNode(node);

    // Save the graph
    const storage = getGlobalStorage();
    await storage.save(graph);

    return json({ success: true, node }, 201);
  } catch (error) {
    return errorResponse(`Invalid request body: ${(error as Error).message}`);
  }
}

/**
 * POST /graph/edges - Add a new edge
 */
export async function handleAddEdge(request: Request): Promise<Response> {
  try {
    const body = await request.json() as Partial<GraphEdge> & { graphId?: string };
    const { graphId, ...edgeData } = body;
    const graph = await getGraph(graphId);

    // Validate required fields
    if (!edgeData.id || !edgeData.source || !edgeData.target || !edgeData.type || !edgeData.label) {
      return errorResponse("Missing required fields: id, source, target, type, label");
    }

    const edge: GraphEdge = {
      id: edgeData.id,
      source: edgeData.source,
      target: edgeData.target,
      type: edgeData.type as EdgeType,
      label: edgeData.label,
      properties: edgeData.properties ?? {},
      evidence: edgeData.evidence ?? [],
      createdAt: edgeData.createdAt ?? new Date().toISOString(),
    };

    graph.addEdge(edge);

    // Save the graph
    const storage = getGlobalStorage();
    await storage.save(graph);

    return json({ success: true, edge }, 201);
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("not found")) {
      return errorResponse(message, 400);
    }
    return errorResponse(`Invalid request body: ${message}`);
  }
}

/**
 * POST /graph/query - Execute a graph query
 */
export async function handleQuery(request: Request): Promise<Response> {
  try {
    const body = await request.json() as {
      graphId?: string;
      nodes?: NodeFilter;
      edges?: EdgeFilter;
      traverse?: {
        startNodeId: string;
        direction?: "in" | "out" | "both";
        maxDepth?: number;
      };
      evidenceChain?: {
        startNodeId: string;
        maxDepth?: number;
      };
    };

    const graph = await getGraph(body.graphId);

    const result: {
      nodes?: GraphNode[];
      edges?: GraphEdge[];
      traversal?: GraphNode[];
      evidenceChain?: Array<{ nodeId: string; depth: number }>;
    } = {};

    if (body.nodes) {
      result.nodes = graph.queryNodes(body.nodes);
    }

    if (body.edges) {
      result.edges = graph.queryEdges(body.edges);
    }

    if (body.traverse) {
      result.traversal = graph.traverse(
        body.traverse.startNodeId,
        body.traverse.direction ?? "both",
        body.traverse.maxDepth ?? 3
      );
    }

    if (body.evidenceChain) {
      result.evidenceChain = buildEvidenceChain(
        graph,
        body.evidenceChain.startNodeId,
        body.evidenceChain.maxDepth ?? 5
      ).map((item) => ({ nodeId: item.nodeId, depth: item.depth }));
    }

    return json(result);
  } catch (error) {
    return errorResponse(`Query error: ${(error as Error).message}`);
  }
}

/**
 * GET /graph/findings/:patientId - Get all findings for a patient
 */
export async function handleGetFindings(
  request: Request,
  patientId: string
): Promise<Response> {
  const url = new URL(request.url);
  const graph = await getGraph(url.searchParams.get("graphId") ?? undefined);

  const findings = getPatientFindings(graph, patientId);

  return json({
    patientId,
    findings,
    total: findings.length,
  });
}

/**
 * GET /graph/evidence/:nodeId - Get evidence chain for a node
 */
export async function handleGetEvidence(
  request: Request,
  nodeId: string
): Promise<Response> {
  const url = new URL(request.url);
  const graph = await getGraph(url.searchParams.get("graphId") ?? undefined);

  const maxDepth = parseInt(url.searchParams.get("maxDepth") ?? "5", 10);
  const chain = buildEvidenceChain(graph, nodeId, maxDepth);
  const evidence = getNodeEvidence(graph, nodeId);

  return json({
    nodeId,
    node: evidence.node,
    directEvidence: evidence.evidence,
    linkedNodes: evidence.linkedNodes,
    evidenceChain: chain,
  });
}

/**
 * GET /graph/serialize - Get full graph data
 */
export async function handleSerialize(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const graph = await getGraph(url.searchParams.get("graphId") ?? undefined);

  return json(graph.serialize());
}

/**
 * DELETE /graph/node/:id - Delete a node
 */
export async function handleDeleteNode(
  request: Request,
  nodeId: string
): Promise<Response> {
  const url = new URL(request.url);
  const graph = await getGraph(url.searchParams.get("graphId") ?? undefined);

  const deleted = graph.removeNode(nodeId);
  if (!deleted) {
    return errorResponse(`Node not found: ${nodeId}`, 404);
  }

  // Save the graph
  const storage = getGlobalStorage();
  await storage.save(graph);

  return json({ success: true, deleted: nodeId });
}

/**
 * DELETE /graph/edge/:id - Delete an edge
 */
export async function handleDeleteEdge(
  request: Request,
  edgeId: string
): Promise<Response> {
  const url = new URL(request.url);
  const graph = await getGraph(url.searchParams.get("graphId") ?? undefined);

  const deleted = graph.removeEdge(edgeId);
  if (!deleted) {
    return errorResponse(`Edge not found: ${edgeId}`, 404);
  }

  // Save the graph
  const storage = getGlobalStorage();
  await storage.save(graph);

  return json({ success: true, deleted: edgeId });
}
