# AGENT 1: Atlas Graph Core Engine

**Status:** 🟡 Ready to Start  
**Priority:** 🔴 CRITICAL (Foundation for all others)  
**Dependencies:** None (creates foundation)

---

## 🎯 Your Mission

Build the **core Atlas Graph engine** in TypeScript. This is the foundation that all other agents will build upon. You're creating the graph data structure, API endpoints, and query capabilities.

---

## 📋 Task List

### 1. Create Graph Package Structure
- [ ] Create `packages/graph/` directory
- [ ] Add `package.json` with name `@medatlas/graph`
- [ ] Add `tsconfig.json` (copy from `packages/schemas/`)
- [ ] Set up exports in `src/index.ts`

### 2. Implement Graph Core (`src/atlas-graph.ts`)
- [ ] Create `AtlasGraph` class with:
  - `nodes: Map<string, GraphNode>`
  - `edges: GraphEdge[]`
  - `addNode(node: GraphNode): void`
  - `addEdge(edge: GraphEdge): void`
  - `getNode(id: string): GraphNode | undefined`
  - `getEdges(nodeId: string): GraphEdge[]` (incoming/outgoing)
  - `queryNodes(filter: NodeFilter): GraphNode[]`
  - `queryEdges(filter: EdgeFilter): GraphEdge[]`
  - `serialize(): GraphData`
  - `deserialize(data: GraphData): void`

### 3. Define Node Types (`src/node-types.ts`)
- [ ] Define `GraphNode` interface:
  ```typescript
  interface GraphNode {
    id: string;
    type: NodeType;
    label: string;
    properties: Record<string, unknown>;
    evidence: EvidenceRef[];
    timestamp?: string;
    createdAt: string;
  }
  ```
- [ ] Define `NodeType` enum:
  - `patient`, `encounter`, `observation`, `study`, `image`, `note`, `lab`, `medication`, `condition`, `finding`
- [ ] Create node factory functions

### 4. Define Edge Types (`src/edge-types.ts`)
- [ ] Define `GraphEdge` interface:
  ```typescript
  interface GraphEdge {
    id: string;
    source: string; // node ID
    target: string; // node ID
    type: EdgeType;
    label: string;
    properties: Record<string, unknown>;
    evidence: EvidenceRef[];
    createdAt: string;
  }
  ```
- [ ] Define `EdgeType` enum:
  - `observed-in`, `derived-from`, `matches`, `contradicts`, `temporal-near`, `same-as`, `has-finding`, `has-evidence`
- [ ] Create edge factory functions

### 5. Implement Graph Queries (`src/graph-query.ts`)
- [ ] `queryNodes(filter: NodeFilter): GraphNode[]`
  - Filter by: type, date range, properties
- [ ] `queryEdges(filter: EdgeFilter): GraphEdge[]`
  - Filter by: type, source, target
- [ ] `getTimeline(patientId: string, dateRange?: DateRange): TimelineEvent[]`
  - Returns chronologically ordered events for a patient
- [ ] `traverse(startNodeId: string, direction: 'in' | 'out' | 'both', maxDepth?: number): GraphNode[]`
  - Graph traversal (BFS)

### 6. Implement Graph Storage (`src/graph-storage.ts`)
- [ ] Create `GraphStorage` interface
- [ ] Implement `InMemoryGraphStorage` (for demo)
  - Stores graph in memory
  - Can be replaced with D1 later
- [ ] Methods: `save(graph: AtlasGraph): Promise<void>`, `load(graphId: string): Promise<AtlasGraph>`

### 7. Create Graph API Endpoints (`workers/api/src/graph/`)
- [ ] `GET /graph/nodes?type=...&patientId=...` - List nodes
- [ ] `GET /graph/edges?source=...&target=...&type=...` - List edges
- [ ] `GET /graph/node/:id` - Get node details
- [ ] `GET /graph/edge/:id` - Get edge details
- [ ] `GET /graph/query` - Graph query endpoint (POST body with query)
- [ ] `GET /graph/timeline/:patientId?start=...&end=...` - Timeline query
- [ ] `POST /graph/nodes` - Add node
- [ ] `POST /graph/edges` - Add edge

### 8. Integrate into API (`workers/api/src/index.ts`)
- [ ] Import graph routes
- [ ] Add graph routes to router
- [ ] Initialize graph storage (in-memory for demo)

### 9. Create Types Package (`src/types.ts`)
- [ ] Export all types for other packages to use
- [ ] Ensure compatibility with `@medatlas/schemas`

### 10. Write Tests
- [ ] Unit tests for `AtlasGraph` class
- [ ] Unit tests for graph queries
- [ ] API endpoint tests (optional, can use manual testing)

---

## 📁 Files to Create

```
packages/graph/
  package.json
  tsconfig.json
  src/
    atlas-graph.ts          # Core graph class
    node-types.ts           # Node type definitions
    edge-types.ts           # Edge type definitions
    graph-query.ts          # Query functions
    graph-storage.ts        # Storage abstraction
    types.ts                # Type exports
    index.ts                # Package exports

workers/api/src/
  graph/
    routes.ts               # Route definitions
    handlers.ts             # Request handlers
  index.ts                  # Add graph routes here
```

---

## 🔗 Dependencies

- `@medatlas/schemas` - Use `EvidenceRef` type from here
- TypeScript 5.6+
- Cloudflare Workers types

---

## 📝 Implementation Notes

### Graph Storage Strategy
For the demo, use **in-memory storage**. This is fine because:
- Demo data is small
- Can be replaced with D1 later
- Simpler to implement

### API Response Format
```typescript
// GET /graph/nodes
{
  nodes: GraphNode[];
  total: number;
}

// GET /graph/timeline/:patientId
{
  patientId: string;
  events: TimelineEvent[];
  dateRange: {
    start: string;
    end: string;
  };
}

// TimelineEvent
interface TimelineEvent {
  id: string;
  type: NodeType;
  timestamp: string;
  title: string;
  summary?: string;
  evidence: EvidenceRef[];
  relatedNodes: string[];
}
```

### Error Handling
Return proper HTTP status codes:
- `200` - Success
- `400` - Bad request (invalid query)
- `404` - Node/edge not found
- `500` - Server error

---

## ✅ Success Criteria

- [ ] Graph can store nodes and edges
- [ ] Graph queries work (find nodes by type, traverse edges)
- [ ] Timeline query returns chronologically ordered events
- [ ] API endpoints return proper JSON
- [ ] Graph can be serialized/deserialized
- [ ] Other agents can import and use `@medatlas/graph`

---

## 🚀 Getting Started

1. Read `docs/vision.md` to understand the graph concept
2. Review `src/core/atlas_graph.py` for Python reference (but implement in TS)
3. Check `packages/schemas/src/types.ts` for `EvidenceRef` type
4. Start with `packages/graph/src/atlas-graph.ts` - build the core class
5. Then build API endpoints
6. Test with sample data

---

## 📞 Coordination

- **You create:** Graph foundation
- **Agent 2 needs:** Your `/graph/timeline` endpoint
- **Agent 3 needs:** Your `POST /graph/nodes` and `POST /graph/edges` endpoints
- **Agent 4 needs:** Your graph query endpoints
- **Agent 5 needs:** Your graph data for reasoning

**You're the foundation - get this right and everyone else can build on top!** 🏗️
