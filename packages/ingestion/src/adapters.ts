import type { DataAdapter, DataSource } from "./adapter-types";
import { SyntheticAdapter } from "./synthetic-adapter";
import { FHIRAdapter } from "./fhir-adapter";

const adapterEntries: Array<[DataSource, DataAdapter]> = [
  ["synthetic", new SyntheticAdapter()],
  ["fhir", new FHIRAdapter()]
];

const adapters: Map<DataSource, DataAdapter> = new Map(adapterEntries);

export function getAdapter(source: DataSource): DataAdapter | undefined {
  return adapters.get(source);
}

export function detectAdapter(data: unknown): DataAdapter | undefined {
  for (const adapter of adapters.values()) {
    if (adapter.canHandle(data)) return adapter;
  }
  return undefined;
}

export { SyntheticAdapter, FHIRAdapter };
