import type { MedAtlasOutput } from "@medatlas/schemas/types";
import {
  handleInterpret,
  handleReasoningStatus,
  handleDemoCase,
  handleListDemoCases,
  handleGenerateDemoCase,
} from "./reasoning/handlers";

type Env = {
  APP_NAME: string;
};

const json = (value: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(value, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      ...(init?.headers ?? {}),
    },
  });

const notFound = () => json({ error: "not_found" }, { status: 404 });

/**
 * Parse path parameters from URL pathname
 */
function matchPath(pathname: string, pattern: string): Record<string, string> | null {
  const patternParts = pattern.split("/");
  const pathParts = pathname.split("/");

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      const key = patternParts[i].slice(1);
      params[key] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }

  return params;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // Handle CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, POST, OPTIONS",
          "access-control-allow-headers": "Content-Type",
        },
      });
    }

    // Health check
    if (pathname === "/health" && method === "GET") {
      return json({ status: "ok", app: env.APP_NAME });
    }

    // === REASONING API ===

    // POST /reasoning/interpret - Generate interpretation from graph
    if (pathname === "/reasoning/interpret" && method === "POST") {
      return handleInterpret(request);
    }

    // GET /reasoning/status/:caseId - Get reasoning status
    const reasoningStatusMatch = matchPath(pathname, "/reasoning/status/:caseId");
    if (reasoningStatusMatch && method === "GET") {
      return handleReasoningStatus(reasoningStatusMatch.caseId);
    }

    // === DEMO API ===

    // GET /demo/cases - List available demo cases
    if (pathname === "/demo/cases" && method === "GET") {
      return handleListDemoCases();
    }

    // POST /demo/generate - Generate new demo case
    if (pathname === "/demo/generate" && method === "POST") {
      return handleGenerateDemoCase(request);
    }

    // GET /demo/case/:caseId - Get complete demo case
    const demoCaseMatch = matchPath(pathname, "/demo/case/:caseId");
    if (demoCaseMatch && method === "GET") {
      return handleDemoCase(demoCaseMatch.caseId);
    }

    // GET /demo/case - Legacy endpoint (returns demo-001)
    if (pathname === "/demo/case" && method === "GET") {
      return handleDemoCase("demo-001");
    }

    // === GRAPH API (placeholder for Agent 1) ===

    // GET /graph/timeline/:patientId - Timeline query
    const timelineMatch = matchPath(pathname, "/graph/timeline/:patientId");
    if (timelineMatch && method === "GET") {
      // Return mock timeline data for Agent 2 UI development
      return json(generateMockTimeline(timelineMatch.patientId));
    }

    // GET /graph/nodes - List nodes
    if (pathname === "/graph/nodes" && method === "GET") {
      return json({
        nodes: [],
        metadata: { totalNodes: 0 },
        message: "Placeholder - waiting for Agent 1 implementation",
      });
    }

    // GET /graph/node/:id - Get node details
    const nodeMatch = matchPath(pathname, "/graph/node/:id");
    if (nodeMatch && method === "GET") {
      return json({
        error: "not_implemented",
        message: "Placeholder - waiting for Agent 1 implementation",
      }, { status: 501 });
    }

    return notFound();
  },
};

/**
 * Generate mock timeline data for Agent 2 UI development
 */
function generateMockTimeline(patientId: string) {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  interface TimelineEvent {
    id: string;
    type: "encounter" | "observation" | "study" | "lab" | "medication" | "condition";
    timestamp: string;
    title: string;
    summary?: string;
    evidence: Array<{ source: string; id: string }>;
    relatedNodes?: string[];
  }

  const events: TimelineEvent[] = [
    {
      id: "event-001",
      type: "encounter",
      timestamp: new Date(now.getTime() - 14 * oneDay).toISOString(),
      title: "Emergency Department Visit",
      summary: "Patient presented with acute chest pain radiating to left arm",
      evidence: [{ source: "fhir", id: "encounter-001" }],
      relatedNodes: ["condition-001", "lab-001", "lab-002"],
    },
    {
      id: "event-002",
      type: "condition",
      timestamp: new Date(now.getTime() - 14 * oneDay).toISOString(),
      title: "Chest Pain Diagnosed",
      summary: "Acute chest pain, moderate severity",
      evidence: [{ source: "fhir", id: "condition-001" }],
    },
    {
      id: "event-003",
      type: "lab",
      timestamp: new Date(now.getTime() - 14 * oneDay).toISOString(),
      title: "Troponin I: 0.04 ng/mL (elevated)",
      summary: "Cardiac biomarker above reference range",
      evidence: [{ source: "lab", id: "lab-001" }],
    },
    {
      id: "event-004",
      type: "lab",
      timestamp: new Date(now.getTime() - 14 * oneDay).toISOString(),
      title: "BNP: 450 pg/mL (elevated)",
      summary: "Heart failure marker significantly elevated",
      evidence: [{ source: "lab", id: "lab-002" }],
    },
    {
      id: "event-005",
      type: "study",
      timestamp: new Date(now.getTime() - 14 * oneDay).toISOString(),
      title: "Chest X-Ray",
      summary: "Cardiomegaly with mild pulmonary congestion",
      evidence: [{ source: "dicom", id: "study-001" }],
    },
    {
      id: "event-006",
      type: "medication",
      timestamp: new Date(now.getTime() - 14 * oneDay).toISOString(),
      title: "Lisinopril 10mg Started",
      summary: "ACE inhibitor for hypertension management",
      evidence: [{ source: "fhir", id: "medication-001" }],
    },
    {
      id: "event-007",
      type: "medication",
      timestamp: new Date(now.getTime() - 14 * oneDay).toISOString(),
      title: "Metoprolol 25mg Started",
      summary: "Beta blocker for cardiac protection",
      evidence: [{ source: "fhir", id: "medication-002" }],
    },
    {
      id: "event-008",
      type: "encounter",
      timestamp: new Date(now.getTime() - 7 * oneDay).toISOString(),
      title: "Cardiology Follow-up",
      summary: "Outpatient follow-up visit",
      evidence: [{ source: "fhir", id: "encounter-002" }],
      relatedNodes: ["study-002"],
    },
    {
      id: "event-009",
      type: "study",
      timestamp: new Date(now.getTime() - 7 * oneDay).toISOString(),
      title: "Echocardiogram",
      summary: "Reduced EF (40%), left ventricular hypertrophy",
      evidence: [{ source: "dicom", id: "study-002" }],
    },
    {
      id: "event-010",
      type: "observation",
      timestamp: new Date(now.getTime() - 7 * oneDay).toISOString(),
      title: "Blood Pressure: 138/88 mmHg",
      summary: "Slightly elevated, improving on medication",
      evidence: [{ source: "fhir", id: "observation-001" }],
    },
  ];

  // Sort by timestamp (newest first for display, but we return oldest first)
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return {
    patientId,
    events,
    dateRange: {
      start: events[0]?.timestamp ?? now.toISOString(),
      end: events[events.length - 1]?.timestamp ?? now.toISOString(),
    },
    metadata: {
      totalEvents: events.length,
      generated: true,
      message: "Mock timeline data for UI development",
    },
  };
}
