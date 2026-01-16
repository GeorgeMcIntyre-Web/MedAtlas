/**
 * Demo API route definitions.
 */

import {
  handleListCases,
  handleGetCase,
  handleGenerateCase,
  handleResetDemo,
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
 * Define all demo routes.
 */
const routeDefinitions: Array<{ method: string; path: string; handler: RouteHandler }> = [
  // List cases
  { method: "GET", path: "/demo/cases", handler: handleListCases },
  
  // Get case with interpretation
  { method: "GET", path: "/demo/case/:caseId", handler: (req, params) => handleGetCase(req, params?.caseId ?? "") },
  
  // Generate new case
  { method: "POST", path: "/demo/generate", handler: handleGenerateCase },
  
  // Reset demo data
  { method: "POST", path: "/demo/reset", handler: handleResetDemo },
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
 * Handle a demo API request.
 */
export async function handleDemoRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;

  // Check if this is a demo route (but not the legacy /demo/case without ID)
  if (!pathname.startsWith("/demo/")) {
    return null;
  }

  // Skip legacy endpoint (handled separately in index.ts)
  if (pathname === "/demo/case") {
    return null;
  }

  const match = matchRoute(method, pathname);
  if (!match) {
    return null; // Let it fall through to 404
  }

  try {
    return await match.handler(request, match.params);
  } catch (error) {
    console.error("Demo route error:", error);
    return new Response(JSON.stringify({ error: "internal_error", message: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
