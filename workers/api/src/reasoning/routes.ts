/**
 * Reasoning API Routes
 * 
 * Route handlers for the reasoning API endpoints.
 */

import { handleInterpret, handleGetStatus } from "./handlers.js";
import type { ReasoningRequest } from "./types.js";

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
 * Handle reasoning routes
 * @param url - Request URL
 * @param request - Request object
 * @returns Response or null if not matched
 */
export async function handleReasoningRoutes(
  url: URL, 
  request: Request
): Promise<Response | null> {
  const path = url.pathname;

  // POST /reasoning/interpret - Generate interpretation
  if (path === "/reasoning/interpret" && request.method === "POST") {
    try {
      const body = await request.json() as ReasoningRequest;
      
      if (!body.caseId) {
        return errorResponse("caseId is required");
      }
      
      if (!body.modalities || !Array.isArray(body.modalities)) {
        body.modalities = ["synthetic"];
      }

      const result = await handleInterpret(body);
      return json(result);
    } catch (e) {
      const error = e instanceof Error ? e.message : "Invalid request body";
      return errorResponse(error);
    }
  }

  // GET /reasoning/status/:caseId - Get reasoning status
  const statusMatch = path.match(/^\/reasoning\/status\/([^/]+)$/);
  if (statusMatch && request.method === "GET") {
    const caseId = statusMatch[1];
    const result = handleGetStatus(caseId);
    return json(result);
  }

  return null;
}
