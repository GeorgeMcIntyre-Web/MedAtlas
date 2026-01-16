import test from "node:test";
import assert from "node:assert/strict";
import { MockModelAdapter, validateOutput } from "../packages/reasoning/src/index.ts";
import type { GraphData } from "../packages/graph/src/types.ts";

const buildGraphData = (): GraphData => ({
  id: "graph-reasoning-1",
  nodes: [
    {
      id: "patient-1",
      type: "patient",
      label: "Patient",
      properties: { age: 60, gender: "male" },
      evidence: [],
      createdAt: "2025-01-01T00:00:00.000Z"
    },
    {
      id: "enc-1",
      type: "encounter",
      label: "ED Visit",
      properties: { patientId: "patient-1", reason: "Chest pain" },
      evidence: [{ source: "synthetic", id: "enc-1" }],
      timestamp: "2025-01-01T09:00:00.000Z",
      createdAt: "2025-01-01T09:00:00.000Z"
    },
    {
      id: "lab-1",
      type: "lab",
      label: "Troponin",
      properties: { patientId: "patient-1", value: 0.2, unit: "ng/mL", isAbnormal: true },
      evidence: [{ source: "lab", id: "lab-1" }],
      timestamp: "2025-01-01T09:10:00.000Z",
      createdAt: "2025-01-01T09:10:00.000Z"
    },
    {
      id: "finding-1",
      type: "finding",
      label: "Coronary calcification",
      properties: { patientId: "patient-1", probability: 0.85, anatomy: "LAD" },
      evidence: [{ source: "dicom", id: "study-1" }],
      timestamp: "2025-01-01T09:20:00.000Z",
      createdAt: "2025-01-01T09:20:00.000Z"
    }
  ],
  edges: [],
  metadata: {
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T09:20:00.000Z",
    nodeCount: 4,
    edgeCount: 0
  }
});

test("MockModelAdapter output validates", async () => {
  const adapter = new MockModelAdapter();
  const graphData = buildGraphData();
  const output = await adapter.generateInterpretation({
    caseId: "case-1",
    graphId: graphData.id,
    modalities: ["synthetic", "lab", "imaging"],
    graphData
  });

  const result = validateOutput(output);
  assert.equal(result.valid, true);
});
