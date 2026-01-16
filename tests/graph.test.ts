import test from "node:test";
import assert from "node:assert/strict";
import { AtlasGraph, NodeFactory, EdgeFactory } from "../packages/graph/src/index.ts";

test("AtlasGraph queries and timeline ordering", () => {
  const graph = new AtlasGraph("test-graph");

  const patient = NodeFactory.patient("patient-1", "Patient One", { age: 52, gender: "female" });
  graph.addNode(patient);

  const encounter = NodeFactory.encounter(
    "enc-1",
    "ED Visit",
    "patient-1",
    "2025-01-05T10:00:00.000Z",
    { type: "ED", reason: "Chest pain" }
  );
  graph.addNode(encounter);

  const lab = NodeFactory.lab(
    "lab-1",
    "Troponin",
    "patient-1",
    "2025-01-05T10:30:00.000Z",
    0.12,
    "ng/mL",
    { isAbnormal: true }
  );
  graph.addNode(lab);

  graph.addEdge(EdgeFactory.belongsTo("edge-1", encounter.id, patient.id));
  graph.addEdge(EdgeFactory.observedIn("edge-2", lab.id, encounter.id));

  const labs = graph.queryNodes({ type: "lab", properties: { isAbnormal: true } });
  assert.equal(labs.length, 1);
  assert.equal(labs[0].id, "lab-1");

  const timeline = graph.getTimeline("patient-1");
  assert.equal(timeline.length, 2);
  assert.equal(timeline[0].id, "enc-1");
  assert.equal(timeline[1].id, "lab-1");
});
