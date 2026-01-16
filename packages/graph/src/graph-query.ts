/**
 * Graph query utilities and helpers.
 * Extends the core AtlasGraph with additional query capabilities.
 */

import type { AtlasGraph, DateRange, TimelineEvent } from "./atlas-graph";
import type { GraphNode, NodeFilter, NodeType } from "./node-types";
import type { GraphEdge, EdgeFilter, EdgeType } from "./edge-types";
import type { EvidenceRef } from "@medatlas/schemas/types";

/**
 * Result of a graph query with pagination info.
 */
export interface QueryResult<T> {
  data: T[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * Pagination options for queries.
 */
export interface PaginationOptions {
  offset?: number;
  limit?: number;
}

/**
 * Sort options for queries.
 */
export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

/**
 * Extended query options for nodes.
 */
export interface ExtendedNodeQuery extends NodeFilter {
  pagination?: PaginationOptions;
  sort?: SortOptions;
}

/**
 * Extended query options for edges.
 */
export interface ExtendedEdgeQuery extends EdgeFilter {
  pagination?: PaginationOptions;
  sort?: SortOptions;
}

/**
 * Query nodes with pagination and sorting.
 */
export function queryNodesExtended(
  graph: AtlasGraph,
  query: ExtendedNodeQuery
): QueryResult<GraphNode> {
  // Get filtered nodes using base query
  let nodes = graph.queryNodes(query);
  const total = nodes.length;

  // Sort if specified
  if (query.sort) {
    const { field, direction } = query.sort;
    nodes = nodes.sort((a, b) => {
      const aVal = getNestedValue(a, field);
      const bVal = getNestedValue(b, field);
      
      if ((aVal === undefined || aVal === null) && (bVal === undefined || bVal === null)) return 0;
      if (aVal === undefined || aVal === null) return direction === "asc" ? 1 : -1;
      if (bVal === undefined || bVal === null) return direction === "asc" ? -1 : 1;
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return direction === "asc" 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      // TypeScript now knows aVal and bVal are not null/undefined
      const aNum = typeof aVal === "number" ? aVal : String(aVal);
      const bNum = typeof bVal === "number" ? bVal : String(bVal);
      if (aNum < bNum) return direction === "asc" ? -1 : 1;
      if (aNum > bNum) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  // Paginate
  const offset = query.pagination?.offset ?? 0;
  const limit = query.pagination?.limit ?? nodes.length;
  nodes = nodes.slice(offset, offset + limit);

  return {
    data: nodes,
    total,
    offset,
    limit,
  };
}

/**
 * Query edges with pagination and sorting.
 */
export function queryEdgesExtended(
  graph: AtlasGraph,
  query: ExtendedEdgeQuery
): QueryResult<GraphEdge> {
  // Get filtered edges using base query
  let edges = graph.queryEdges(query);
  const total = edges.length;

  // Sort if specified
  if (query.sort) {
    const { field, direction } = query.sort;
    edges = edges.sort((a, b) => {
      const aVal = getNestedValue(a, field);
      const bVal = getNestedValue(b, field);
      
      if ((aVal === undefined || aVal === null) && (bVal === undefined || bVal === null)) return 0;
      if (aVal === undefined || aVal === null) return direction === "asc" ? 1 : -1;
      if (bVal === undefined || bVal === null) return direction === "asc" ? -1 : 1;
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return direction === "asc" 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      // TypeScript now knows aVal and bVal are not null/undefined
      const aNum = typeof aVal === "number" ? aVal : String(aVal);
      const bNum = typeof bVal === "number" ? bVal : String(bVal);
      if (aNum < bNum) return direction === "asc" ? -1 : 1;
      if (aNum > bNum) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  // Paginate
  const offset = query.pagination?.offset ?? 0;
  const limit = query.pagination?.limit ?? edges.length;
  edges = edges.slice(offset, offset + limit);

  return {
    data: edges,
    total,
    offset,
    limit,
  };
}

/**
 * Get all findings for a patient.
 */
export function getPatientFindings(
  graph: AtlasGraph,
  patientId: string
): GraphNode[] {
  return graph.queryNodes({
    type: "finding",
    patientId,
  });
}

/**
 * Get all evidence for a node.
 */
export function getNodeEvidence(
  graph: AtlasGraph,
  nodeId: string
): { node: GraphNode | undefined; evidence: EvidenceRef[]; linkedNodes: GraphNode[] } {
  const node = graph.getNode(nodeId);
  if (!node) {
    return { node: undefined, evidence: [], linkedNodes: [] };
  }

  // Get evidence from the node itself
  const evidence = [...node.evidence];

  // Get evidence from connected edges
  const edges = graph.getEdges(nodeId);
  for (const edge of edges) {
    evidence.push(...edge.evidence);
  }

  // Get linked nodes
  const linkedNodeIds = new Set<string>();
  for (const edge of edges) {
    linkedNodeIds.add(edge.source === nodeId ? edge.target : edge.source);
  }
  const linkedNodes = Array.from(linkedNodeIds)
    .map((id) => graph.getNode(id))
    .filter((n): n is GraphNode => n !== undefined);

  return { node, evidence, linkedNodes };
}

/**
 * Get cross-modal links for a node (finds matching nodes across modalities).
 */
export function getCrossModalLinks(
  graph: AtlasGraph,
  nodeId: string
): Array<{ node: GraphNode; edge: GraphEdge; confidence?: number }> {
  const edges = graph.queryEdges({
    type: "matches",
  });

  const results: Array<{ node: GraphNode; edge: GraphEdge; confidence?: number }> = [];

  for (const edge of edges) {
    let linkedNodeId: string | null = null;
    if (edge.source === nodeId) {
      linkedNodeId = edge.target;
    } else if (edge.target === nodeId) {
      linkedNodeId = edge.source;
    }

    if (linkedNodeId) {
      const linkedNode = graph.getNode(linkedNodeId);
      if (linkedNode) {
        results.push({
          node: linkedNode,
          edge,
          confidence: edge.properties.confidence as number | undefined,
        });
      }
    }
  }

  return results;
}

/**
 * Build an evidence chain starting from a node.
 * Follows derived-from and has-evidence edges.
 */
export function buildEvidenceChain(
  graph: AtlasGraph,
  startNodeId: string,
  maxDepth: number = 5
): Array<{ nodeId: string; node?: GraphNode; edge?: GraphEdge; depth: number }> {
  const chain: Array<{ nodeId: string; node?: GraphNode; edge?: GraphEdge; depth: number }> = [];
  const visited = new Set<string>();
  const queue: Array<{ nodeId: string; depth: number; edge?: GraphEdge }> = [
    { nodeId: startNodeId, depth: 0 },
  ];

  while (queue.length > 0) {
    const { nodeId, depth, edge } = queue.shift()!;

    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = graph.getNode(nodeId);
    chain.push({ nodeId, node, edge, depth });

    if (depth < maxDepth) {
      // Follow derived-from and has-evidence edges
      const edges = graph.getEdges(nodeId, "out").filter(
        (e) => e.type === "derived-from" || e.type === "has-evidence"
      );

      for (const nextEdge of edges) {
        if (!visited.has(nextEdge.target)) {
          queue.push({ nodeId: nextEdge.target, depth: depth + 1, edge: nextEdge });
        }
      }
    }
  }

  return chain;
}

/**
 * Get nodes connected to a specific node by edge type.
 */
export function getConnectedNodes(
  graph: AtlasGraph,
  nodeId: string,
  edgeType?: EdgeType,
  direction: "in" | "out" | "both" = "both"
): GraphNode[] {
  let edges = graph.getEdges(nodeId, direction);
  
  if (edgeType) {
    edges = edges.filter((e) => e.type === edgeType);
  }

  const connectedIds = new Set<string>();
  for (const edge of edges) {
    if (edge.source === nodeId) {
      connectedIds.add(edge.target);
    } else {
      connectedIds.add(edge.source);
    }
  }

  return Array.from(connectedIds)
    .map((id) => graph.getNode(id))
    .filter((n): n is GraphNode => n !== undefined);
}

/**
 * Get timeline summary statistics.
 */
export function getTimelineSummary(
  graph: AtlasGraph,
  patientId: string
): {
  totalEvents: number;
  dateRange?: { start: string; end: string };
  eventsByType: Record<NodeType, number>;
} {
  const events = graph.getTimeline(patientId);
  
  const eventsByType: Record<string, number> = {};
  for (const event of events) {
    eventsByType[event.type] = (eventsByType[event.type] ?? 0) + 1;
  }

  const dateRange = events.length > 0
    ? {
        start: events[0].timestamp,
        end: events[events.length - 1].timestamp,
      }
    : undefined;

  return {
    totalEvents: events.length,
    dateRange,
    eventsByType: eventsByType as Record<NodeType, number>,
  };
}

/**
 * Helper to get nested property value.
 */
function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  
  return current;
}
