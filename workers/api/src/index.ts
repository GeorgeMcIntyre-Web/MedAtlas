/**
 * MedAtlas API Worker
 * 
 * Main entry point for the Cloudflare Worker API.
 * Includes routes for:
 * - /health - Health check
 * - /demo/* - Demo cases
 * - /alignment/* - Cross-modal alignment
 * - /evidence-chain/* - Evidence chain traversal
 * - /reasoning/* - AI reasoning layer
 */

import { handleAlignmentRoutes } from "./alignment/routes.js";
import { handleReasoningRoutes } from "./reasoning/routes.js";
import { handleDemoRoutes } from "./demo/routes.js";

type Env = {
  APP_NAME: string;
};

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
 * Not found response
 */
const notFound = () => json({ error: "not_found" }, { status: 404 });

/**
 * Handle CORS preflight requests
 */
const handleCORS = () =>
  new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
      "access-control-allow-headers": "Content-Type, Authorization",
      "access-control-max-age": "86400"
    }
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return handleCORS();
    }

    // Health check
    if (url.pathname === "/health") {
      return json({ 
        status: "ok", 
        app: env.APP_NAME,
        version: "0.1.0",
        features: ["alignment", "reasoning", "demo"]
      });
    }

    // API routes index
    if (url.pathname === "/" || url.pathname === "/api") {
      return json({
        name: "MedAtlas API",
        version: "0.1.0",
        endpoints: {
          health: "/health",
          demo: {
            list: "/demo/cases",
            get: "/demo/case/:caseId",
            default: "/demo/case",
            generate: "/demo/generate"
          },
          alignment: {
            findings: "/alignment/findings",
            get: "/alignment/:findingId",
            compare: "/alignment/compare?node1=...&node2=..."
          },
          evidenceChain: {
            get: "/evidence-chain/:nodeId"
          },
          reasoning: {
            interpret: "/reasoning/interpret",
            status: "/reasoning/status/:caseId"
          }
        }
      });
    }

    // Try alignment routes (includes /evidence-chain)
    const alignmentResponse = handleAlignmentRoutes(url, request);
    if (alignmentResponse) {
      return alignmentResponse;
    }

    // Try reasoning routes
    const reasoningResponse = await handleReasoningRoutes(url, request);
    if (reasoningResponse) {
      return reasoningResponse;
    }

    // Try demo routes
    const demoResponse = await handleDemoRoutes(url, request);
    if (demoResponse) {
      return demoResponse;
    }

    // Not found
    return notFound();
  }
};
