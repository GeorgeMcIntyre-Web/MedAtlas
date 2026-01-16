import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SyntheticAdapter, FHIRAdapter } from "../packages/ingestion/src/index.ts";

const loadJson = async (path: string) => {
  const raw = await readFile(new URL(path, import.meta.url), "utf-8");
  return JSON.parse(raw);
};

test("SyntheticAdapter transforms fixture case", async () => {
  const syntheticCase = await loadJson("./fixtures/synthetic-case.json");
  const adapter = new SyntheticAdapter();
  const graph = adapter.transform(syntheticCase, syntheticCase.caseId);

  assert.ok(graph.nodes.length > 0);
  assert.ok(graph.edges.length > 0);
  assert.ok(graph.nodes.some((node: any) => node.type === "patient"));
  assert.ok(graph.nodes.some((node: any) => node.type === "finding"));
});

test("FHIRAdapter transforms a basic bundle", async () => {
  const bundle = await loadJson("./fixtures/fhir-bundle.json");
  const adapter = new FHIRAdapter();
  const graph = adapter.transform(bundle, "fhir-case-001");

  assert.ok(graph.nodes.some((node: any) => node.type === "patient"));
  assert.ok(graph.nodes.some((node: any) => node.type === "lab"));
  assert.ok(graph.nodes.some((node: any) => node.type === "condition"));
});
