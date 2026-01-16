/**
 * MedAtlas API Worker
 *
 * Main entry point for the Cloudflare Worker that serves the MedAtlas API.
 * Includes health, reasoning, and demo endpoints.
 */

import type { MedAtlasOutput } from "@medatlas/schemas/types";
import { handleReasoningRoutes } from "./reasoning/routes.js";
import { handleDemoRoutes } from "./demo/routes.js";

type Env = {
  APP_NAME: string;
};

const json = (value: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(value, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
  });

const notFound = () => json({ error: "not_found" }, { status: 404 });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Health endpoint
    if (pathname === "/health") {
      return json({ status: "ok", app: env.APP_NAME });
    }

    // Reasoning endpoints
    if (pathname.startsWith("/reasoning/")) {
      const response = await handleReasoningRoutes(request, pathname);
      if (response) return response;
    }

    // Demo endpoints
    if (pathname.startsWith("/demo/")) {
      const response = await handleDemoRoutes(request, pathname);
      if (response) return response;
    }

    // Legacy demo endpoint for backward compatibility
    if (pathname === "/demo/case" && request.method === "GET") {
      // Redirect to new endpoint with default case
      const out: MedAtlasOutput = {
        caseId: "demo-001",
        modalities: ["synthetic", "note", "lab"],
        summary: "Synthetic demo case for MedAtlas UI wiring.",
        findings: [
          {
            label: "Example finding",
            probability: 0.62,
            evidence: [{ source: "synthetic", id: "synthetic-obs-001" }],
          },
        ],
        extractedEntities: [
          {
            type: "symptom",
            text: "headache",
            evidence: [{ source: "note", id: "note-001" }],
          },
        ],
        recommendations: [
          "Request clinician review and confirm key data points.",
          "Acquire imaging modality if clinically indicated.",
        ],
        uncertainty: {
          level: "high",
          reasons: ["Synthetic data", "No imaging provided"],
        },
        safety: {
          notMedicalAdvice: true,
          requiresClinicianReview: true,
        },
      };
      return json(out);
    }

    return notFound();
  },
};
