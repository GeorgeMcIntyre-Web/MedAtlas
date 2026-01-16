/**
 * Reasoning API route definitions.
 */

import {
  handleInterpret,
  handleGetStatus,
  handleValidate,
  handleSanitize,
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
 * Define all reasoning routes.
 */
const routeDefinitions: Array<{ method: string; path: string; handler: RouteHandler }> = [
  // Interpretation
  { method: "POST", path: "/reasoning/interpret", handler: handleInterpret },
  
  // Status
  { method: "GET", path: "/reasoning/status/:caseId", handler: (req, params) => handleGetStatus(req, params?.caseId ?? "") },
  
  // Validation
  { method: "POST", path: "/reasoning/validate", handler: handleValidate },
  
  // Sanitization
  { method: "POST", path: "/reasoning/sanitize", handler: handleSanitize },
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
 * Handle a reasoning API request.
 */
export async function handleReasoningRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;

  // Check if this is a reasoning route
  if (!pathname.startsWith("/reasoning")) {
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
    console.error("Reasoning route error:", error);
    return new Response(JSON.stringify({ error: "internal_error", message: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
