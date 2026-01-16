import { AtlasGraph } from "./atlas-graph";
import type { GraphData } from "./types";

export class InMemoryGraphStore {
  private graphs: Map<string, AtlasGraph> = new Map();

  create(id?: string): AtlasGraph {
    const graph = new AtlasGraph(id);
    this.graphs.set(graph.id, graph);
    return graph;
  }

  get(id: string): AtlasGraph | undefined {
    return this.graphs.get(id);
  }

  list(): AtlasGraph[] {
    return Array.from(this.graphs.values());
  }

  upsert(data: GraphData): AtlasGraph {
    const graph = this.graphs.get(data.id) ?? new AtlasGraph(data.id);
    graph.deserialize(data);
    this.graphs.set(graph.id, graph);
    return graph;
  }

  remove(id: string): boolean {
    return this.graphs.delete(id);
  }

  clear(): void {
    this.graphs.clear();
  }
}
