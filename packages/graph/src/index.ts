/**
 * @medatlas/graph - Atlas Graph Core Engine
 * 
 * A provenance-preserving graph of medical entities and their relationships.
 * This package provides the core graph data structure, query capabilities,
 * and storage abstraction for the MedAtlas knowledge graph.
 */

// Core graph class
export { AtlasGraph } from "./atlas-graph";
export type { GraphData, TimelineEvent, DateRange } from "./atlas-graph";

// Node types and factories
export type { NodeType, GraphNode, NodeFilter } from "./node-types";
export { createNode, NodeFactory } from "./node-types";

// Edge types and factories
export type { EdgeType, GraphEdge, EdgeFilter } from "./edge-types";
export { createEdge, EdgeFactory } from "./edge-types";

// Query utilities
export {
  queryNodesExtended,
  queryEdgesExtended,
  getPatientFindings,
  getNodeEvidence,
  getCrossModalLinks,
  buildEvidenceChain,
  getConnectedNodes,
  getTimelineSummary,
} from "./graph-query";
export type {
  QueryResult,
  PaginationOptions,
  SortOptions,
  ExtendedNodeQuery,
  ExtendedEdgeQuery,
} from "./graph-query";

// Storage
export type { GraphStorage } from "./graph-storage";
export {
  InMemoryGraphStorage,
  getGlobalStorage,
  resetGlobalStorage,
  getOrCreateGraph,
} from "./graph-storage";

// Re-export schema types for convenience
export type { EvidenceRef, Finding, MedAtlasOutput } from "@medatlas/schemas/types";
