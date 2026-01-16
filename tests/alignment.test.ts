import test from "node:test";
import assert from "node:assert/strict";
import { findAlignments, buildEvidenceChain } from "../packages/alignment/src/index.ts";
import type { GraphData, GraphNode } from "../packages/graph/src/types.ts";

const buildGraph = (): GraphData => {
  const nodes: GraphNode[] = [
    {
      id: "finding-1",
      type: "finding",
      label: "Pulmonary nodule",
      properties: { patientId: "patient-1", anatomy: "Right upper lobe", probability: 0.72 },
      evidence: [{ source: "dicom", id: "study-1" }],
      timestamp: "2025-01-01T10:00:00.000Z",
      createdAt: "2025-01-01T10:00:00.000Z"
    },
    {
      id: "lab-1",
      type: "lab",
      label: "CRP",
      properties: { patientId: "patient-1", value: 45, unit: "mg/L", isAbnormal: true },
      evidence: [{ source: "lab", id: "lab-1" }],
      timestamp: "2025-01-01T10:10:00.000Z",
      createdAt: "2025-01-01T10:10:00.000Z"
    },
    {
      id: "note-1",
      type: "note",
      label: "Progress Note",
      properties: { patientId: "patient-1", text: "Right upper lobe nodule noted.", noteType: "progress" },
      evidence: [{ source: "note", id: "note-1" }],
      timestamp: "2025-01-01T10:05:00.000Z",
      createdAt: "2025-01-01T10:05:00.000Z"
    }
  ];

  return {
    id: "graph-1",
    nodes,
    edges: [
      {
        id: "edge-1",
        source: "lab-1",
        target: "finding-1",
        type: "matches",
        label: "matches",
        properties: {},
        evidence: [],
        createdAt: "2025-01-01T10:20:00.000Z"
      }
    ],
    metadata: {
      createdAt: "2025-01-01T10:00:00.000Z",
      updatedAt: "2025-01-01T10:20:00.000Z",
      nodeCount: nodes.length,
      edgeCount: 1
    }
  };
};

test("findAlignments returns modality matches", () => {
  const graph = buildGraph();
  const finding = graph.nodes.find(node => node.id === "finding-1")!;
  const alignment = findAlignments(finding, graph);

  assert.equal(alignment.findingId, "finding-1");
  assert.ok(alignment.modalities.imaging);
  assert.ok(alignment.modalities.lab);
  assert.ok(alignment.modalities.text);
});

test("buildEvidenceChain traverses graph", () => {
  const graph = buildGraph();
  const chain = buildEvidenceChain("finding-1", graph, 2);

  assert.equal(chain.rootNodeId, "finding-1");
  assert.ok(chain.chain.length > 0);
});
