/**
 * Type exports for the Atlas Graph package.
 * Re-exports all types for convenient imports.
 */

// Re-export from @medatlas/schemas
export type { EvidenceRef, Finding, MedAtlasOutput } from "@medatlas/schemas/types";

// Node types
export type {
  NodeType,
  GraphNode,
  NodeFilter,
} from "./node-types";

export { createNode, NodeFactory } from "./node-types";

// Edge types
export type {
  EdgeType,
  GraphEdge,
  EdgeFilter,
} from "./edge-types";

export { createEdge, EdgeFactory } from "./edge-types";

// Graph core
export type {
  GraphData,
  TimelineEvent,
  DateRange,
} from "./atlas-graph";

export { AtlasGraph } from "./atlas-graph";

// Query types
export type {
  QueryResult,
  PaginationOptions,
  SortOptions,
  ExtendedNodeQuery,
  ExtendedEdgeQuery,
} from "./graph-query";

// Storage types
export type { GraphStorage } from "./graph-storage";

export { InMemoryGraphStorage } from "./graph-storage";
