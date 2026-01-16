/**
 * Demo API Routes
 *
 * Route definitions for demo endpoints.
 */

import {
  handleListCases,
  handleGetCase,
  handleGenerateCase,
} from "./handlers.js";

/**
 * Handle demo routes
 *
 * Routes:
 * - GET /demo/cases - List available demo cases
 * - GET /demo/case/:caseId - Get complete demo case with reasoning
 * - POST /demo/generate - Generate new demo case
 *
 * @param request - The incoming request
 * @param pathname - The request pathname
 * @returns Response or null if route not matched
 */
export async function handleDemoRoutes(
  request: Request,
  pathname: string
): Promise<Response | null> {
  // GET /demo/cases
  if (pathname === "/demo/cases" && request.method === "GET") {
    return handleListCases();
  }

  // GET /demo/case/:caseId
  const caseMatch = pathname.match(/^\/demo\/case\/([^/]+)$/);
  if (caseMatch && request.method === "GET") {
    const caseId = decodeURIComponent(caseMatch[1]);
    return handleGetCase(caseId);
  }

  // POST /demo/generate
  if (pathname === "/demo/generate" && request.method === "POST") {
    return handleGenerateCase(request);
  }

  return null;
}
