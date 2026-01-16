/**
 * Graph storage abstraction and implementations.
 * Provides persistence layer for Atlas graphs.
 */

import { AtlasGraph, type GraphData } from "./atlas-graph";

/**
 * Interface for graph storage implementations.
 */
export interface GraphStorage {
  /**
   * Save a graph to storage.
   */
  save(graph: AtlasGraph): Promise<void>;

  /**
   * Load a graph from storage by ID.
   */
  load(graphId: string): Promise<AtlasGraph | null>;

  /**
   * Delete a graph from storage.
   */
  delete(graphId: string): Promise<boolean>;

  /**
   * List all graph IDs in storage.
   */
  list(): Promise<string[]>;

  /**
   * Check if a graph exists in storage.
   */
  exists(graphId: string): Promise<boolean>;
}

/**
 * In-memory graph storage implementation.
 * Suitable for development and demo purposes.
 * Data is lost when the process restarts.
 */
export class InMemoryGraphStorage implements GraphStorage {
  private _graphs: Map<string, GraphData>;

  constructor() {
    this._graphs = new Map();
  }

  async save(graph: AtlasGraph): Promise<void> {
    const data = graph.serialize();
    this._graphs.set(data.id, data);
  }

  async load(graphId: string): Promise<AtlasGraph | null> {
    const data = this._graphs.get(graphId);
    if (!data) return null;
    return AtlasGraph.fromData(data);
  }

  async delete(graphId: string): Promise<boolean> {
    return this._graphs.delete(graphId);
  }

  async list(): Promise<string[]> {
    return Array.from(this._graphs.keys());
  }

  async exists(graphId: string): Promise<boolean> {
    return this._graphs.has(graphId);
  }

  /**
   * Clear all graphs from storage.
   */
  clear(): void {
    this._graphs.clear();
  }

  /**
   * Get the number of graphs in storage.
   */
  get size(): number {
    return this._graphs.size;
  }
}

/**
 * Global singleton instance for demo/development.
 * In production, use a proper storage backend.
 */
let _globalStorage: InMemoryGraphStorage | null = null;

/**
 * Get the global in-memory storage instance.
 */
export function getGlobalStorage(): InMemoryGraphStorage {
  if (!_globalStorage) {
    _globalStorage = new InMemoryGraphStorage();
  }
  return _globalStorage;
}

/**
 * Reset the global storage (useful for testing).
 */
export function resetGlobalStorage(): void {
  _globalStorage = new InMemoryGraphStorage();
}

/**
 * Helper to get or create a graph.
 */
export async function getOrCreateGraph(
  storage: GraphStorage,
  graphId: string
): Promise<AtlasGraph> {
  const existing = await storage.load(graphId);
  if (existing) return existing;
  
  const graph = new AtlasGraph(graphId);
  await storage.save(graph);
  return graph;
}
