import type { MedAtlasOutput } from "@medatlas/schemas/types";
import { handleGraphRequest } from "./graph/routes";
import { handleReasoningRequest } from "./reasoning/routes";
import { handleDemoRequest } from "./demo/routes";

type Env = {
  APP_NAME: string;
};

const json = (value: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(value, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {})
    }
  });

const notFound = () => json({ error: "not_found" }, { status: 404 });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle graph API routes
    if (url.pathname.startsWith("/graph")) {
      const graphResponse = await handleGraphRequest(request);
      if (graphResponse) {
        return graphResponse;
      }
    }

    // Handle reasoning API routes
    if (url.pathname.startsWith("/reasoning")) {
      const reasoningResponse = await handleReasoningRequest(request);
      if (reasoningResponse) {
        return reasoningResponse;
      }
    }

    // Handle demo API routes (new endpoints with :caseId param)
    if (url.pathname.startsWith("/demo/") && url.pathname !== "/demo/case") {
      const demoResponse = await handleDemoRequest(request);
      if (demoResponse) {
        return demoResponse;
      }
    }

    // Health check endpoint
    if (url.pathname === "/health") {
      return json({ status: "ok", app: env.APP_NAME });
    }

    // Legacy demo endpoint: returns a schema-shaped example for UX wiring.
    // Maintained for backward compatibility
    if (url.pathname === "/demo/case") {
      const out: MedAtlasOutput = {
        caseId: "demo-001",
        modalities: ["synthetic", "note", "lab"],
        summary: "Synthetic demo case for MedAtlas UI wiring.",
        findings: [
          {
            label: "Example finding",
            probability: 0.62,
            evidence: [{ source: "synthetic", id: "synthetic-obs-001" }]
          }
        ],
        extractedEntities: [
          {
            type: "symptom",
            text: "headache",
            evidence: [{ source: "note", id: "note-001" }]
          }
        ],
        recommendations: [
          "Request clinician review and confirm key data points.",
          "Acquire imaging modality if clinically indicated."
        ],
        uncertainty: {
          level: "high",
          reasons: ["Synthetic data", "No imaging provided"]
        },
        safety: {
          notMedicalAdvice: true,
          requiresClinicianReview: true
        }
      };

      return json(out);
    }

    return notFound();
  }
};
