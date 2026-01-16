/**
 * Core Atlas Graph implementation.
 * A provenance-preserving graph of medical entities and their relationships.
 */

import type { GraphNode, NodeFilter, NodeType } from "./node-types";
import type { GraphEdge, EdgeFilter, EdgeType } from "./edge-types";

/**
 * Serialized graph data format for storage/transmission.
 */
export interface GraphData {
  id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    nodeCount: number;
    edgeCount: number;
  };
}

/**
 * Timeline event derived from graph nodes.
 */
export interface TimelineEvent {
  id: string;
  type: NodeType;
  timestamp: string;
  title: string;
  summary?: string;
  evidence: import("@medatlas/schemas/types").EvidenceRef[];
  relatedNodes: string[];
}

/**
 * Date range for filtering.
 */
export interface DateRange {
  start?: string;
  end?: string;
}

/**
 * AtlasGraph - Core graph class for managing medical knowledge graphs.
 */
export class AtlasGraph {
  private _id: string;
  private _nodes: Map<string, GraphNode>;
  private _edges: GraphEdge[];
  private _createdAt: string;
  private _updatedAt: string;

  constructor(id?: string) {
    this._id = id ?? crypto.randomUUID();
    this._nodes = new Map();
    this._edges = [];
    this._createdAt = new Date().toISOString();
    this._updatedAt = this._createdAt;
  }

  /** Get the graph ID */
  get id(): string {
    return this._id;
  }

  /** Get the number of nodes */
  get nodeCount(): number {
    return this._nodes.size;
  }

  /** Get the number of edges */
  get edgeCount(): number {
    return this._edges.length;
  }

  /**
   * Add a node to the graph.
   * If a node with the same ID exists, it will be updated.
   */
  addNode(node: GraphNode): void {
    this._nodes.set(node.id, node);
    this._updatedAt = new Date().toISOString();
  }

  /**
   * Add an edge to the graph.
   * Validates that source and target nodes exist.
   */
  addEdge(edge: GraphEdge): void {
    // Validate source and target nodes exist
    if (!this._nodes.has(edge.source)) {
      throw new Error(`Source node not found: ${edge.source}`);
    }
    if (!this._nodes.has(edge.target)) {
      throw new Error(`Target node not found: ${edge.target}`);
    }

    // Check for duplicate edge ID
    const existingIndex = this._edges.findIndex((e) => e.id === edge.id);
    if (existingIndex >= 0) {
      // Update existing edge
      this._edges[existingIndex] = edge;
    } else {
      this._edges.push(edge);
    }
    this._updatedAt = new Date().toISOString();
  }

  /**
   * Get a node by ID.
   */
  getNode(id: string): GraphNode | undefined {
    return this._nodes.get(id);
  }

  /**
   * Get an edge by ID.
   */
  getEdge(id: string): GraphEdge | undefined {
    return this._edges.find((e) => e.id === id);
  }

  /**
   * Get all edges connected to a node (incoming and/or outgoing).
   */
  getEdges(
    nodeId: string,
    direction: "in" | "out" | "both" = "both"
  ): GraphEdge[] {
    return this._edges.filter((edge) => {
      if (direction === "in") {
        return edge.target === nodeId;
      }
      if (direction === "out") {
        return edge.source === nodeId;
      }
      return edge.source === nodeId || edge.target === nodeId;
    });
  }

  /**
   * Get all nodes in the graph.
   */
  getAllNodes(): GraphNode[] {
    return Array.from(this._nodes.values());
  }

  /**
   * Get all edges in the graph.
   */
  getAllEdges(): GraphEdge[] {
    return [...this._edges];
  }

  /**
   * Query nodes with filter criteria.
   */
  queryNodes(filter: NodeFilter): GraphNode[] {
    let nodes = Array.from(this._nodes.values());

    // Filter by type
    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      nodes = nodes.filter((n) => types.includes(n.type));
    }

    // Filter by patient ID
    if (filter.patientId) {
      nodes = nodes.filter((n) => n.properties.patientId === filter.patientId);
    }

    // Filter by date range
    if (filter.dateRange) {
      nodes = nodes.filter((n) => {
        if (!n.timestamp) return false;
        const timestamp = new Date(n.timestamp).getTime();
        if (filter.dateRange?.start) {
          const start = new Date(filter.dateRange.start).getTime();
          if (timestamp < start) return false;
        }
        if (filter.dateRange?.end) {
          const end = new Date(filter.dateRange.end).getTime();
          if (timestamp > end) return false;
        }
        return true;
      });
    }

    // Filter by properties
    if (filter.properties) {
      nodes = nodes.filter((n) => {
        for (const [key, value] of Object.entries(filter.properties!)) {
          if (n.properties[key] !== value) return false;
        }
        return true;
      });
    }

    return nodes;
  }

  /**
   * Query edges with filter criteria.
   */
  queryEdges(filter: EdgeFilter): GraphEdge[] {
    let edges = [...this._edges];

    // Filter by type
    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      edges = edges.filter((e) => types.includes(e.type));
    }

    // Filter by source
    if (filter.source) {
      edges = edges.filter((e) => e.source === filter.source);
    }

    // Filter by target
    if (filter.target) {
      edges = edges.filter((e) => e.target === filter.target);
    }

    // Filter by properties
    if (filter.properties) {
      edges = edges.filter((e) => {
        for (const [key, value] of Object.entries(filter.properties!)) {
          if (e.properties[key] !== value) return false;
        }
        return true;
      });
    }

    return edges;
  }

  /**
   * Get timeline events for a patient, sorted chronologically.
   */
  getTimeline(patientId: string, dateRange?: DateRange): TimelineEvent[] {
    // Get all nodes for this patient that have timestamps
    let nodes = this.queryNodes({ patientId });
    nodes = nodes.filter((n) => n.timestamp);

    // Apply date range filter
    if (dateRange) {
      nodes = nodes.filter((n) => {
        const timestamp = new Date(n.timestamp!).getTime();
        if (dateRange.start) {
          const start = new Date(dateRange.start).getTime();
          if (timestamp < start) return false;
        }
        if (dateRange.end) {
          const end = new Date(dateRange.end).getTime();
          if (timestamp > end) return false;
        }
        return true;
      });
    }

    // Convert to timeline events
    const events: TimelineEvent[] = nodes.map((node) => {
      // Find related nodes through edges
      const edges = this.getEdges(node.id);
      const relatedNodes = edges.map((e) =>
        e.source === node.id ? e.target : e.source
      );

      return {
        id: node.id,
        type: node.type,
        timestamp: node.timestamp!,
        title: node.label,
        summary: node.properties.summary as string | undefined,
        evidence: node.evidence,
        relatedNodes: [...new Set(relatedNodes)],
      };
    });

    // Sort by timestamp (chronological order)
    events.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return events;
  }

  /**
   * Traverse the graph from a starting node using BFS.
   */
  traverse(
    startNodeId: string,
    direction: "in" | "out" | "both" = "both",
    maxDepth: number = 3
  ): GraphNode[] {
    const startNode = this._nodes.get(startNodeId);
    if (!startNode) return [];

    const visited = new Set<string>();
    const result: GraphNode[] = [];
    const queue: Array<{ nodeId: string; depth: number }> = [
      { nodeId: startNodeId, depth: 0 },
    ];

    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = this._nodes.get(nodeId);
      if (node) {
        result.push(node);
      }

      if (depth < maxDepth) {
        const edges = this.getEdges(nodeId, direction);
        for (const edge of edges) {
          const nextNodeId = edge.source === nodeId ? edge.target : edge.source;
          if (!visited.has(nextNodeId)) {
            queue.push({ nodeId: nextNodeId, depth: depth + 1 });
          }
        }
      }
    }

    return result;
  }

  /**
   * Remove a node and all its connected edges.
   */
  removeNode(nodeId: string): boolean {
    if (!this._nodes.has(nodeId)) return false;

    // Remove all edges connected to this node
    this._edges = this._edges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );

    // Remove the node
    this._nodes.delete(nodeId);
    this._updatedAt = new Date().toISOString();
    return true;
  }

  /**
   * Remove an edge by ID.
   */
  removeEdge(edgeId: string): boolean {
    const index = this._edges.findIndex((e) => e.id === edgeId);
    if (index < 0) return false;

    this._edges.splice(index, 1);
    this._updatedAt = new Date().toISOString();
    return true;
  }

  /**
   * Serialize the graph to a portable format.
   */
  serialize(): GraphData {
    return {
      id: this._id,
      nodes: Array.from(this._nodes.values()),
      edges: [...this._edges],
      metadata: {
        createdAt: this._createdAt,
        updatedAt: this._updatedAt,
        nodeCount: this._nodes.size,
        edgeCount: this._edges.length,
      },
    };
  }

  /**
   * Deserialize graph data and populate this graph.
   * This replaces the current graph content.
   */
  deserialize(data: GraphData): void {
    this._id = data.id;
    this._nodes.clear();
    this._edges = [];

    for (const node of data.nodes) {
      this._nodes.set(node.id, node);
    }

    this._edges = [...data.edges];
    this._createdAt = data.metadata.createdAt;
    this._updatedAt = data.metadata.updatedAt;
  }

  /**
   * Create a new AtlasGraph from serialized data.
   */
  static fromData(data: GraphData): AtlasGraph {
    const graph = new AtlasGraph(data.id);
    graph.deserialize(data);
    return graph;
  }

  /**
   * Clear all nodes and edges from the graph.
   */
  clear(): void {
    this._nodes.clear();
    this._edges = [];
    this._updatedAt = new Date().toISOString();
  }
}
