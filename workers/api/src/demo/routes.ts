/**
 * Demo API Routes
 * 
 * Route handlers for the demo API endpoints.
 */

import { 
  handleListCases, 
  handleGetCase, 
  handleGenerateDemo,
  handleGetDefaultDemo
} from "./handlers.js";
import type { GenerateDemoRequest } from "./types.js";

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
 * Handle demo routes
 * @param url - Request URL
 * @param request - Request object
 * @returns Response or null if not matched
 */
export async function handleDemoRoutes(
  url: URL, 
  request: Request
): Promise<Response | null> {
  const path = url.pathname;

  // GET /demo/cases - List all demo cases
  if (path === "/demo/cases" && request.method === "GET") {
    return json(handleListCases());
  }

  // GET /demo/case - Default demo case (backward compatibility)
  if (path === "/demo/case" && request.method === "GET") {
    return json(handleGetDefaultDemo());
  }

  // GET /demo/case/:caseId - Get specific demo case
  const caseMatch = path.match(/^\/demo\/case\/([^/]+)$/);
  if (caseMatch && request.method === "GET") {
    const caseId = caseMatch[1];
    const result = handleGetCase(caseId);
    
    if (!result) {
      return errorResponse(`Demo case not found: ${caseId}`, 404);
    }
    
    return json(result);
  }

  // POST /demo/generate - Generate new demo case
  if (path === "/demo/generate" && request.method === "POST") {
    try {
      let body: GenerateDemoRequest = {};
      
      // Handle empty body
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
      
      const result = handleGenerateDemo(body);
      return json(result, { status: 201 });
    } catch (e) {
      // If JSON parsing fails, use default options
      const result = handleGenerateDemo({});
      return json(result, { status: 201 });
    }
  }

  return null;
}
