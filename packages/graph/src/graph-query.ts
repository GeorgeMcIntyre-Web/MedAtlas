import type { GraphNode, GraphEdge, NodeFilter, EdgeFilter } from "./types";

export function filterNodes(nodes: GraphNode[], filter: NodeFilter): GraphNode[] {
  let result = [...nodes];

  if (filter.type) {
    const types = Array.isArray(filter.type) ? filter.type : [filter.type];
    result = result.filter(node => types.includes(node.type));
  }
  if (filter.patientId) {
    result = result.filter(node => node.properties.patientId === filter.patientId);
  }
  if (filter.dateRange) {
    result = result.filter(node => {
      if (!node.timestamp) return false;
      const ts = new Date(node.timestamp).getTime();
      if (filter.dateRange?.start && ts < new Date(filter.dateRange.start).getTime()) return false;
      if (filter.dateRange?.end && ts > new Date(filter.dateRange.end).getTime()) return false;
      return true;
    });
  }
  if (filter.properties) {
    const entries = Object.entries(filter.properties);
    result = result.filter(node =>
      entries.every(([key, value]) => node.properties[key] === value)
    );
  }

  return result;
}

export function filterEdges(edges: GraphEdge[], filter: EdgeFilter): GraphEdge[] {
  let result = [...edges];

  if (filter.type) {
    const types = Array.isArray(filter.type) ? filter.type : [filter.type];
    result = result.filter(edge => types.includes(edge.type));
  }
  if (filter.source) result = result.filter(edge => edge.source === filter.source);
  if (filter.target) result = result.filter(edge => edge.target === filter.target);
  if (filter.properties) {
    const entries = Object.entries(filter.properties);
    result = result.filter(edge =>
      entries.every(([key, value]) => edge.properties[key] === value)
    );
  }

  return result;
}

export function collectRelatedNodeIds(edges: GraphEdge[], nodeId: string): string[] {
  const related = new Set<string>();
  for (const edge of edges) {
    if (edge.source === nodeId) related.add(edge.target);
    if (edge.target === nodeId) related.add(edge.source);
  }
  return [...related];
}
