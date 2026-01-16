import {
  handleListNodes,
  handleGetNode,
  handleAddNode,
  handleDeleteNode,
  handleListEdges,
  handleGetEdge,
  handleAddEdge,
  handleDeleteEdge,
  handleGetTimeline,
  handleQuery,
  handleGetFindings,
  handleGetEvidence,
  handleSerialize
} from "./handlers";

export async function handleGraphRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method.toUpperCase();

  if (!pathname.startsWith("/graph")) return null;

  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "graph") return null;

  if (parts.length === 2 && parts[1] === "nodes") {
    if (method === "GET") return handleListNodes(request);
    if (method === "POST") return handleAddNode(request);
  }

  if (parts.length === 3 && parts[1] === "node") {
    if (method === "GET") return handleGetNode(parts[2]);
    if (method === "DELETE") return handleDeleteNode(parts[2]);
  }

  if (parts.length === 2 && parts[1] === "edges") {
    if (method === "GET") return handleListEdges(request);
    if (method === "POST") return handleAddEdge(request);
  }

  if (parts.length === 3 && parts[1] === "edge") {
    if (method === "GET") return handleGetEdge(parts[2]);
    if (method === "DELETE") return handleDeleteEdge(parts[2]);
  }

  if (parts.length === 3 && parts[1] === "timeline" && method === "GET") {
    return handleGetTimeline(request, parts[2]);
  }

  if (parts.length === 2 && parts[1] === "query" && method === "POST") {
    return handleQuery(request);
  }

  if (parts.length === 3 && parts[1] === "findings" && method === "GET") {
    return handleGetFindings(parts[2]);
  }

  if (parts.length === 3 && parts[1] === "evidence" && method === "GET") {
    return handleGetEvidence(parts[2]);
  }

  if (parts.length === 2 && parts[1] === "serialize" && method === "GET") {
    return handleSerialize();
  }

  return null;
}
