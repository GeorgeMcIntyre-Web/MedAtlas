import type { GraphNode, GraphEdge, GraphData, NodeFilter, EdgeFilter, TimelineEvent } from "./types";

export class AtlasGraph {
  private _id: string;
  private _nodes: Map<string, GraphNode> = new Map();
  private _edges: GraphEdge[] = [];
  private _createdAt: string;
  private _updatedAt: string;

  constructor(id?: string) {
    this._id = id ?? crypto.randomUUID();
    this._createdAt = new Date().toISOString();
    this._updatedAt = this._createdAt;
  }

  get id(): string { return this._id; }
  get nodeCount(): number { return this._nodes.size; }
  get edgeCount(): number { return this._edges.length; }

  addNode(node: GraphNode): void {
    this._nodes.set(node.id, node);
    this._updatedAt = new Date().toISOString();
  }

  addEdge(edge: GraphEdge): void {
    if (!this._nodes.has(edge.source)) throw new Error(`Source node not found: ${edge.source}`);
    if (!this._nodes.has(edge.target)) throw new Error(`Target node not found: ${edge.target}`);

    const existingIndex = this._edges.findIndex(e => e.id === edge.id);
    if (existingIndex >= 0) {
      this._edges[existingIndex] = edge;
    } else {
      this._edges.push(edge);
    }
    this._updatedAt = new Date().toISOString();
  }

  getNode(id: string): GraphNode | undefined { return this._nodes.get(id); }
  getEdge(id: string): GraphEdge | undefined { return this._edges.find(e => e.id === id); }
  getAllNodes(): GraphNode[] { return Array.from(this._nodes.values()); }
  getAllEdges(): GraphEdge[] { return [...this._edges]; }

  getEdges(nodeId: string, direction: "in" | "out" | "both" = "both"): GraphEdge[] {
    return this._edges.filter(edge => {
      if (direction === "in") return edge.target === nodeId;
      if (direction === "out") return edge.source === nodeId;
      return edge.source === nodeId || edge.target === nodeId;
    });
  }

  queryNodes(filter: NodeFilter): GraphNode[] {
    let nodes = Array.from(this._nodes.values());

    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      nodes = nodes.filter(n => types.includes(n.type));
    }
    if (filter.patientId) {
      nodes = nodes.filter(n => n.properties.patientId === filter.patientId);
    }
    if (filter.dateRange) {
      nodes = nodes.filter(n => {
        if (!n.timestamp) return false;
        const ts = new Date(n.timestamp).getTime();
        if (filter.dateRange?.start && ts < new Date(filter.dateRange.start).getTime()) return false;
        if (filter.dateRange?.end && ts > new Date(filter.dateRange.end).getTime()) return false;
        return true;
      });
    }
    if (filter.properties) {
      const entries = Object.entries(filter.properties);
      nodes = nodes.filter(node =>
        entries.every(([key, value]) => node.properties[key] === value)
      );
    }
    return nodes;
  }

  queryEdges(filter: EdgeFilter): GraphEdge[] {
    let edges = [...this._edges];
    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      edges = edges.filter(e => types.includes(e.type));
    }
    if (filter.source) edges = edges.filter(e => e.source === filter.source);
    if (filter.target) edges = edges.filter(e => e.target === filter.target);
    if (filter.properties) {
      const entries = Object.entries(filter.properties);
      edges = edges.filter(edge =>
        entries.every(([key, value]) => edge.properties[key] === value)
      );
    }
    return edges;
  }

  getTimeline(patientId: string, dateRange?: { start?: string; end?: string }): TimelineEvent[] {
    let nodes = this.queryNodes({ patientId });
    nodes = nodes.filter(n => n.timestamp);

    if (dateRange) {
      nodes = nodes.filter(n => {
        const ts = new Date(n.timestamp!).getTime();
        if (dateRange.start && ts < new Date(dateRange.start).getTime()) return false;
        if (dateRange.end && ts > new Date(dateRange.end).getTime()) return false;
        return true;
      });
    }

    const events: TimelineEvent[] = nodes.map(node => {
      const edges = this.getEdges(node.id);
      const relatedNodes = [...new Set(edges.map(e => e.source === node.id ? e.target : e.source))];
      return {
        id: node.id,
        type: node.type,
        timestamp: node.timestamp!,
        title: node.label,
        summary: node.properties.summary as string | undefined,
        evidence: node.evidence,
        relatedNodes,
      };
    });

    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return events;
  }

  traverse(startNodeId: string, direction: "in" | "out" | "both" = "both", maxDepth = 3): GraphNode[] {
    const startNode = this._nodes.get(startNodeId);
    if (!startNode) return [];

    const visited = new Set<string>();
    const result: GraphNode[] = [];
    const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: startNodeId, depth: 0 }];

    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = this._nodes.get(nodeId);
      if (node) result.push(node);

      if (depth < maxDepth) {
        const edges = this.getEdges(nodeId, direction);
        for (const edge of edges) {
          const nextId = edge.source === nodeId ? edge.target : edge.source;
          if (!visited.has(nextId)) queue.push({ nodeId: nextId, depth: depth + 1 });
        }
      }
    }
    return result;
  }

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

  deserialize(data: GraphData): void {
    this._id = data.id;
    this._nodes.clear();
    this._edges = [];
    for (const node of data.nodes) this._nodes.set(node.id, node);
    this._edges = [...data.edges];
    this._createdAt = data.metadata.createdAt;
    this._updatedAt = data.metadata.updatedAt;
  }

  static fromData(data: GraphData): AtlasGraph {
    const graph = new AtlasGraph(data.id);
    graph.deserialize(data);
    return graph;
  }

  removeNode(nodeId: string): boolean {
    if (!this._nodes.has(nodeId)) return false;
    this._edges = this._edges.filter(e => e.source !== nodeId && e.target !== nodeId);
    this._nodes.delete(nodeId);
    this._updatedAt = new Date().toISOString();
    return true;
  }

  removeEdge(edgeId: string): boolean {
    const idx = this._edges.findIndex(e => e.id === edgeId);
    if (idx < 0) return false;
    this._edges.splice(idx, 1);
    this._updatedAt = new Date().toISOString();
    return true;
  }

  clear(): void {
    this._nodes.clear();
    this._edges = [];
    this._updatedAt = new Date().toISOString();
  }
}
