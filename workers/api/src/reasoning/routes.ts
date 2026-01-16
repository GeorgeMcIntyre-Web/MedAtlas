/**
 * Reasoning API Routes
 *
 * Route definitions for the reasoning API endpoints.
 */

import { handleInterpret, handleStatus } from "./handlers.js";

/**
 * Handle reasoning routes
 *
 * Routes:
 * - POST /reasoning/interpret - Generate interpretation
 * - GET /reasoning/status/:caseId - Get reasoning status
 *
 * @param request - The incoming request
 * @param pathname - The request pathname
 * @returns Response or null if route not matched
 */
export async function handleReasoningRoutes(
  request: Request,
  pathname: string
): Promise<Response | null> {
  // POST /reasoning/interpret
  if (pathname === "/reasoning/interpret" && request.method === "POST") {
    return handleInterpret(request);
  }

  // GET /reasoning/status/:caseId
  const statusMatch = pathname.match(/^\/reasoning\/status\/([^/]+)$/);
  if (statusMatch && request.method === "GET") {
    const caseId = decodeURIComponent(statusMatch[1]);
    return handleStatus(caseId);
  }

  return null;
}
