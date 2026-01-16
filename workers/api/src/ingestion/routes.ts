/**
 * Ingestion API Routes
 * 
 * Route handler for data ingestion endpoints.
 */

import {
  handleSyntheticIngestion,
  handleFHIRIngestion,
  handleIngestionStatus,
} from "./handlers.js";

/**
 * Handle ingestion routes
 * 
 * @param request - The incoming request
 * @param pathname - The URL pathname
 * @returns Response if route matches, undefined otherwise
 */
export async function handleIngestionRoutes(
  request: Request,
  pathname: string
): Promise<Response | undefined> {
  // POST /ingestion/synthetic - Generate and ingest synthetic case
  if (pathname === "/ingestion/synthetic" && request.method === "POST") {
    return handleSyntheticIngestion(request);
  }

  // POST /ingestion/fhir - Ingest FHIR bundle
  if (pathname === "/ingestion/fhir" && request.method === "POST") {
    return handleFHIRIngestion(request);
  }

  // GET /ingestion/status/:caseId - Get ingestion status
  const statusMatch = pathname.match(/^\/ingestion\/status\/([^/]+)$/);
  if (statusMatch && request.method === "GET") {
    const caseId = statusMatch[1];
    return handleIngestionStatus(caseId);
  }

  // Route not matched
  return undefined;
}
