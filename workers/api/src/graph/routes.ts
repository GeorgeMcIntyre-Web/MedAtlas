/**
 * Graph API route definitions.
 * Maps URL patterns to handlers.
 */

import {
  handleListNodes,
  handleGetNode,
  handleListEdges,
  handleGetEdge,
  handleGetTimeline,
  handleAddNode,
  handleAddEdge,
  handleQuery,
  handleGetFindings,
  handleGetEvidence,
  handleSerialize,
  handleDeleteNode,
  handleDeleteEdge,
} from "./handlers";

/**
 * Route handler type.
 */
type RouteHandler = (request: Request, params?: Record<string, string>) => Promise<Response>;

/**
 * Route definition.
 */
interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

/**
 * Create a route pattern from a path template.
 * Converts :param to named capture groups.
 */
function createPattern(path: string): { pattern: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const regexStr = path.replace(/:([a-zA-Z]+)/g, (_, name) => {
    paramNames.push(name);
    return "([^/]+)";
  });
  return {
    pattern: new RegExp(`^${regexStr}$`),
    paramNames,
  };
}

/**
 * Define all graph routes.
 */
const routeDefinitions: Array<{ method: string; path: string; handler: RouteHandler }> = [
  // Node routes
  { method: "GET", path: "/graph/nodes", handler: handleListNodes },
  { method: "GET", path: "/graph/node/:id", handler: (req, params) => handleGetNode(req, params?.id ?? "") },
  { method: "POST", path: "/graph/nodes", handler: handleAddNode },
  { method: "DELETE", path: "/graph/node/:id", handler: (req, params) => handleDeleteNode(req, params?.id ?? "") },
  
  // Edge routes
  { method: "GET", path: "/graph/edges", handler: handleListEdges },
  { method: "GET", path: "/graph/edge/:id", handler: (req, params) => handleGetEdge(req, params?.id ?? "") },
  { method: "POST", path: "/graph/edges", handler: handleAddEdge },
  { method: "DELETE", path: "/graph/edge/:id", handler: (req, params) => handleDeleteEdge(req, params?.id ?? "") },
  
  // Timeline route
  { method: "GET", path: "/graph/timeline/:patientId", handler: (req, params) => handleGetTimeline(req, params?.patientId ?? "") },
  
  // Query route
  { method: "POST", path: "/graph/query", handler: handleQuery },
  
  // Findings route
  { method: "GET", path: "/graph/findings/:patientId", handler: (req, params) => handleGetFindings(req, params?.patientId ?? "") },
  
  // Evidence route
  { method: "GET", path: "/graph/evidence/:nodeId", handler: (req, params) => handleGetEvidence(req, params?.nodeId ?? "") },
  
  // Serialize route
  { method: "GET", path: "/graph/serialize", handler: handleSerialize },
];

/**
 * Compiled routes with regex patterns.
 */
const routes: Route[] = routeDefinitions.map((def) => {
  const { pattern, paramNames } = createPattern(def.path);
  return {
    method: def.method,
    pattern,
    paramNames,
    handler: def.handler,
  };
});

/**
 * Match a request to a route.
 */
export function matchRoute(
  method: string,
  pathname: string
): { handler: RouteHandler; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) continue;

    const match = pathname.match(route.pattern);
    if (match) {
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });
      return { handler: route.handler, params };
    }
  }

  return null;
}

/**
 * Handle a graph API request.
 */
export async function handleGraphRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;

  // Check if this is a graph route
  if (!pathname.startsWith("/graph")) {
    return null;
  }

  const match = matchRoute(method, pathname);
  if (!match) {
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    return await match.handler(request, match.params);
  } catch (error) {
    console.error("Graph route error:", error);
    return new Response(JSON.stringify({ error: "internal_error", message: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
