/**
 * Alignment API Routes
 * 
 * Route handlers for the alignment API endpoints.
 */

import { 
  handleGetAlignment, 
  handleGetEvidenceChain, 
  handleCompareNodes,
  handleListFindings
} from "./handlers.js";

/**
 * JSON response helper
 */
const json = (value: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(value, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      ...(init?.headers ?? {})
    }
  });

/**
 * Error response helper
 */
const errorResponse = (message: string, status: number = 400) =>
  json({ error: message }, { status });

/**
 * Handle alignment routes
 * @param url - Request URL
 * @param request - Request object
 * @returns Response or null if not matched
 */
export function handleAlignmentRoutes(
  url: URL, 
  request: Request
): Response | null {
  const path = url.pathname;

  // GET /alignment/findings - List all findings
  if (path === "/alignment/findings" && request.method === "GET") {
    return json(handleListFindings());
  }

  // GET /alignment/:findingId - Get alignments for a finding
  const alignmentMatch = path.match(/^\/alignment\/([^/]+)$/);
  if (alignmentMatch && request.method === "GET") {
    const findingId = alignmentMatch[1];
    
    if (findingId === "findings") {
      return null; // Already handled above
    }
    
    const result = handleGetAlignment(findingId);
    
    if (result.totalCount === 0) {
      return errorResponse(`Finding not found: ${findingId}`, 404);
    }
    
    return json(result);
  }

  // GET /evidence-chain/:nodeId - Get evidence chain for a node
  const chainMatch = path.match(/^\/evidence-chain\/([^/]+)$/);
  if (chainMatch && request.method === "GET") {
    const nodeId = chainMatch[1];
    const maxDepth = parseInt(url.searchParams.get("maxDepth") || "5");
    
    const result = handleGetEvidenceChain(nodeId, maxDepth);
    
    if (result.chain.chain.length === 0) {
      return errorResponse(`Node not found: ${nodeId}`, 404);
    }
    
    return json(result);
  }

  // GET /alignment/compare?node1=...&node2=... - Compare two nodes
  if (path === "/alignment/compare" && request.method === "GET") {
    const node1 = url.searchParams.get("node1");
    const node2 = url.searchParams.get("node2");
    
    if (!node1 || !node2) {
      return errorResponse("Both node1 and node2 query parameters are required");
    }
    
    const result = handleCompareNodes(node1, node2);
    return json(result);
  }

  return null;
}
