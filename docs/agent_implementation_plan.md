# MedAtlas Demo: 5-Agent Parallel Implementation Plan

**Goal:** Complete a working demo that showcases the core MedAtlas vision: **unified graph-based navigation with cross-modal alignment and timeline visualization.**

**Timeline:** Parallel implementation by 5 agents, coordinated through shared interfaces.

---

## 🎯 Demo Success Criteria

The demo must demonstrate:
1. ✅ **Atlas Graph** - Entities, links, and evidence in a navigable graph
2. ✅ **Patient Timeline** - Chronological view of events with navigation
3. ✅ **Cross-Modal Alignment** - Image findings ↔ report text ↔ labs correlation
4. ✅ **Evidence Linking** - Click-through from findings to source artifacts
5. ✅ **Structured Output** - AI-generated interpretations with evidence chains

---

## 🤖 Agent Assignments

### **AGENT 1: Atlas Graph Core Engine**
**Owner:** Agent 1  
**Priority:** 🔴 CRITICAL (Foundation for all others)

#### Scope
Implement the core Atlas Graph in TypeScript with:
- Graph data structure (nodes, edges, evidence)
- Graph API endpoints
- Graph query/traversal capabilities
- Graph storage (Cloudflare D1 or in-memory for demo)
- Graph serialization/deserialization

#### Deliverables
1. **Graph Core Library** (`packages/graph/`)
   - `src/atlas-graph.ts` - Graph class with nodes/edges
   - `src/node-types.ts` - Entity types (patient, encounter, observation, study, etc.)
   - `src/edge-types.ts` - Link types (observed-in, derived-from, matches, etc.)
   - `src/graph-query.ts` - Query/traversal functions
   - `src/graph-storage.ts` - Storage abstraction (D1 or in-memory)

2. **Graph API Endpoints** (`workers/api/src/graph/`)
   - `GET /graph/nodes` - List nodes (with filters)
   - `GET /graph/edges` - List edges (with filters)
   - `GET /graph/node/:id` - Get node details
   - `GET /graph/query` - Graph query endpoint
   - `POST /graph/nodes` - Add node
   - `POST /graph/edges` - Add edge
   - `GET /graph/timeline/:patientId` - Timeline query (temporal ordering)

3. **Graph Types** (`packages/graph/src/types.ts`)
   - `GraphNode`, `GraphEdge`, `EvidenceRef` types
   - Query interfaces
   - Graph serialization format

#### Dependencies
- Uses existing `@medatlas/schemas` for EvidenceRef
- Creates foundation for Agent 2 (Timeline), Agent 3 (Ingestion), Agent 4 (Alignment)

#### Success Criteria
- [ ] Graph can store nodes and edges
- [ ] Graph queries work (find nodes by type, traverse edges)
- [ ] Timeline query returns chronologically ordered events
- [ ] API endpoints return proper JSON
- [ ] Graph can be serialized/deserialized

#### Files to Create/Modify
```
packages/graph/
  package.json
  tsconfig.json
  src/
    atlas-graph.ts
    node-types.ts
    edge-types.ts
    graph-query.ts
    graph-storage.ts
    types.ts
    index.ts

workers/api/src/
  graph/
    routes.ts
    handlers.ts
  index.ts (add graph routes)
```

#### Interface Contract
```typescript
// Graph API Response Format
interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata?: { totalNodes: number; totalEdges: number };
}

// Timeline Query Response
interface TimelineResponse {
  events: TimelineEvent[];
  patientId: string;
  dateRange: { start: string; end: string };
}
```

---

### **AGENT 2: Timeline & Navigation UI**
**Owner:** Agent 2  
**Priority:** 🔴 CRITICAL (Core UX feature)

#### Scope
Build the patient timeline visualization and navigation UI:
- Timeline component showing events chronologically
- Event cards (encounters, observations, studies, labs)
- Navigation (prev/next, jump to date, filter by type)
- Integration with graph API
- Evidence linking visualization

#### Deliverables
1. **Timeline Components** (`apps/web/src/ui/timeline/`)
   - `TimelineView.tsx` - Main timeline component
   - `TimelineEvent.tsx` - Individual event card
   - `TimelineFilters.tsx` - Filter controls
   - `TimelineNavigation.tsx` - Navigation controls
   - `useTimeline.ts` - Timeline data hook

2. **Graph Visualization** (`apps/web/src/ui/graph/`)
   - `GraphView.tsx` - Graph visualization (optional, can use library like `react-force-graph` or `vis-network`)
   - `NodeCard.tsx` - Node detail view
   - `EdgeView.tsx` - Edge visualization

3. **Updated App** (`apps/web/src/ui/App.tsx`)
   - Replace static case view with timeline/graph view
   - Add routing/navigation
   - Integrate with Agent 1's graph API

#### Dependencies
- **Requires Agent 1** - Graph API endpoints must exist
- Uses `@medatlas/schemas` for types
- May use graph visualization library (optional)

#### Success Criteria
- [ ] Timeline displays events chronologically
- [ ] Events show correct data (type, date, source)
- [ ] Navigation works (prev/next, date jump)
- [ ] Filters work (by type, date range)
- [ ] Evidence links are clickable
- [ ] UI is responsive and visually clear

#### Files to Create/Modify
```
apps/web/src/ui/
  timeline/
    TimelineView.tsx
    TimelineEvent.tsx
    TimelineFilters.tsx
    TimelineNavigation.tsx
    useTimeline.ts
  graph/
    GraphView.tsx (optional)
    NodeCard.tsx
  App.tsx (refactor to use timeline)
```

#### Interface Contract
```typescript
// Timeline Event Format (from Agent 1)
interface TimelineEvent {
  id: string;
  type: 'encounter' | 'observation' | 'study' | 'lab' | 'medication' | 'condition';
  timestamp: string;
  title: string;
  summary?: string;
  evidence: EvidenceRef[];
  relatedNodes?: string[]; // node IDs
}
```

---

### **AGENT 3: Data Ingestion & Graph Population**
**Owner:** Agent 3  
**Priority:** 🟡 HIGH (Enables realistic demo data)

#### Scope
Build data ingestion adapters and populate the graph:
- Enhanced synthetic data generator (creates graph structure)
- FHIR adapter (or FHIR-like synthetic data)
- Graph population from ingested data
- Data → Graph node/edge transformation

#### Deliverables
1. **Ingestion Adapters** (`packages/ingestion/`)
   - `src/fhir-adapter.ts` - FHIR → Graph transformation
   - `src/synthetic-adapter.ts` - Enhanced synthetic data → Graph
   - `src/adapter-types.ts` - Adapter interfaces

2. **Enhanced Synthetic Data** (`scripts/`)
   - `seed-graph-demo.mjs` - Generate rich synthetic case with:
     - Patient, encounters, observations
     - Labs, medications, conditions
     - Imaging studies (references)
     - Temporal relationships
     - Cross-modal links

3. **Graph Population Service** (`workers/api/src/ingestion/`)
   - `POST /ingestion/fhir` - Ingest FHIR bundle
   - `POST /ingestion/synthetic` - Generate and ingest synthetic case
   - Graph transformation logic

#### Dependencies
- **Requires Agent 1** - Graph API to populate
- Uses `@medatlas/schemas` for validation
- May use FHIR libraries (optional, can use synthetic FHIR-like data)

#### Success Criteria
- [ ] Synthetic data generator creates realistic graph structure
- [ ] Data transforms correctly to graph nodes/edges
- [ ] Graph populated with temporal relationships
- [ ] Evidence links preserved
- [ ] Multiple modalities represented (notes, labs, imaging refs)

#### Files to Create/Modify
```
packages/ingestion/
  package.json
  tsconfig.json
  src/
    fhir-adapter.ts
    synthetic-adapter.ts
    adapter-types.ts
    index.ts

scripts/
  seed-graph-demo.mjs (enhance existing)

workers/api/src/
  ingestion/
    routes.ts
    handlers.ts
  index.ts (add ingestion routes)
```

#### Interface Contract
```typescript
// Ingestion Input
interface IngestionInput {
  source: 'fhir' | 'synthetic';
  data: unknown; // FHIR bundle or synthetic case
  caseId: string;
}

// Ingestion Output
interface IngestionOutput {
  caseId: string;
  nodesCreated: number;
  edgesCreated: number;
  graphId: string;
}
```

---

### **AGENT 4: Cross-Modal Alignment & Evidence Visualization**
**Owner:** Agent 4  
**Priority:** 🟡 HIGH (Core vision feature)

#### Scope
Implement cross-modal alignment and evidence chain visualization:
- Cross-modal relationship detection/display
- Evidence chain visualization
- Multi-modal correlation UI
- Image-to-text-to-lab linking

#### Deliverables
1. **Cross-Modal Components** (`apps/web/src/ui/alignment/`)
   - `CrossModalView.tsx` - Shows aligned findings across modalities
   - `EvidenceChain.tsx` - Evidence chain visualization
   - `ModalityLink.tsx` - Link between modalities
   - `useCrossModal.ts` - Cross-modal data hook

2. **Alignment Logic** (`packages/alignment/`)
   - `src/cross-modal-matcher.ts` - Match findings across modalities
   - `src/evidence-chain-builder.ts` - Build evidence chains
   - `src/alignment-types.ts` - Alignment types

3. **API Endpoints** (`workers/api/src/alignment/`)
   - `GET /alignment/:findingId` - Get cross-modal alignments for a finding
   - `GET /evidence-chain/:nodeId` - Get evidence chain for a node

#### Dependencies
- **Requires Agent 1** - Graph API for queries
- **Requires Agent 3** - Data with cross-modal relationships
- Uses `@medatlas/schemas` for Finding types

#### Success Criteria
- [ ] Cross-modal alignments displayed (image ↔ text ↔ lab)
- [ ] Evidence chains visualized
- [ ] Click-through from finding to source artifacts
- [ ] Alignment relationships shown in UI
- [ ] Multi-modal correlation clearly visible

#### Files to Create/Modify
```
packages/alignment/
  package.json
  tsconfig.json
  src/
    cross-modal-matcher.ts
    evidence-chain-builder.ts
    alignment-types.ts
    index.ts

apps/web/src/ui/
  alignment/
    CrossModalView.tsx
    EvidenceChain.tsx
    ModalityLink.tsx
    useCrossModal.ts

workers/api/src/
  alignment/
    routes.ts
    handlers.ts
  index.ts (add alignment routes)
```

#### Interface Contract
```typescript
// Cross-Modal Alignment
interface CrossModalAlignment {
  findingId: string;
  modalities: {
    imaging?: { nodeId: string; location?: Location };
    text?: { nodeId: string; excerpt: string };
    lab?: { nodeId: string; value: number; unit: string };
  };
  confidence: number;
  evidence: EvidenceRef[];
}

// Evidence Chain
interface EvidenceChain {
  rootNodeId: string;
  chain: Array<{
    nodeId: string;
    relationship: string;
    evidence: EvidenceRef[];
  }>;
}
```

---

### **AGENT 5: Reasoning Layer & Demo Integration**
**Owner:** Agent 5  
**Priority:** 🟡 HIGH (Completes the demo)

#### Scope
Implement reasoning layer integration and complete demo pipeline:
- Model adapter interface (for MedGemma 1.5 or mock)
- Structured output generation from graph
- Demo data pipeline (end-to-end)
- Integration testing

#### Deliverables
1. **Model Adapter** (`packages/reasoning/`)
   - `src/model-adapter.ts` - Model adapter interface
   - `src/medgemma-adapter.ts` - MedGemma 1.5 adapter (or mock)
   - `src/output-validator.ts` - Validate structured outputs
   - `src/prompt-builder.ts` - Build prompts from graph data

2. **Reasoning API** (`workers/api/src/reasoning/`)
   - `POST /reasoning/interpret` - Generate interpretation from graph
   - Uses graph data + prompts → MedAtlasOutput
   - Validates output against schema

3. **Demo Integration** (`workers/api/src/demo/`)
   - `GET /demo/case/:caseId` - Full demo endpoint
   - Orchestrates: graph → reasoning → output
   - Returns complete MedAtlasOutput

4. **Enhanced Demo Data** (coordinate with Agent 3)
   - Ensure synthetic data supports reasoning
   - Add test cases for different scenarios

#### Dependencies
- **Requires Agent 1** - Graph API for data
- **Requires Agent 3** - Demo data
- Uses `@medatlas/schemas` for MedAtlasOutput
- Uses `@medatlas/prompts` for prompts

#### Success Criteria
- [ ] Model adapter generates structured outputs
- [ ] Outputs validate against schema
- [ ] Evidence links preserved in outputs
- [ ] Uncertainty expressed correctly
- [ ] Demo endpoint returns complete case
- [ ] End-to-end flow works (data → graph → reasoning → UI)

#### Files to Create/Modify
```
packages/reasoning/
  package.json
  tsconfig.json
  src/
    model-adapter.ts
    medgemma-adapter.ts (or mock)
    output-validator.ts
    prompt-builder.ts
    index.ts

workers/api/src/
  reasoning/
    routes.ts
    handlers.ts
  demo/
    routes.ts
    handlers.ts
  index.ts (add routes)
```

#### Interface Contract
```typescript
// Reasoning Input
interface ReasoningInput {
  caseId: string;
  graphId: string;
  modalities: string[];
}

// Reasoning Output (MedAtlasOutput from schema)
// Already defined in @medatlas/schemas
```

---

## 🔄 Coordination & Integration

### Shared Interfaces
All agents must agree on:
1. **Graph Node/Edge Format** - Defined by Agent 1
2. **EvidenceRef Format** - Already in `@medatlas/schemas`
3. **API Response Formats** - Defined in each agent's contract
4. **Error Handling** - Standard error response format

### Integration Points
1. **Agent 1 → Agent 2**: Graph API endpoints
2. **Agent 1 → Agent 3**: Graph population API
3. **Agent 1 → Agent 4**: Graph query API for alignments
4. **Agent 1 → Agent 5**: Graph data for reasoning
5. **Agent 3 → Agent 4**: Data with cross-modal relationships
6. **Agent 5 → Agent 2**: MedAtlasOutput for UI display

### Testing Strategy
Each agent should:
- Write unit tests for their components
- Test against mock data initially
- Integration tests after Agent 1 completes
- End-to-end test after all agents complete

---

## 📋 Implementation Order (Recommended)

### Phase 1: Foundation (Agents 1 & 3 in parallel)
- **Agent 1**: Build graph core and API
- **Agent 3**: Build ingestion and synthetic data
- **Integration**: Agent 3 populates Agent 1's graph

### Phase 2: UI & Features (Agents 2, 4, 5 in parallel)
- **Agent 2**: Build timeline UI (uses Agent 1)
- **Agent 4**: Build cross-modal alignment (uses Agent 1, 3)
- **Agent 5**: Build reasoning layer (uses Agent 1, 3)
- **Integration**: All connect to graph API

### Phase 3: Demo Integration
- Connect all pieces
- End-to-end testing
- Demo data refinement
- UI polish

---

## 🚀 Quick Start for Each Agent

### Agent 1 Checklist
- [ ] Create `packages/graph/` package
- [ ] Implement `AtlasGraph` class
- [ ] Create graph API endpoints
- [ ] Test with sample nodes/edges
- [ ] Document API contract

### Agent 2 Checklist
- [ ] Create timeline components
- [ ] Connect to Agent 1's `/graph/timeline` endpoint
- [ ] Build event cards and navigation
- [ ] Test with sample timeline data
- [ ] Integrate into App.tsx

### Agent 3 Checklist
- [ ] Create `packages/ingestion/` package
- [ ] Build synthetic data generator (enhanced)
- [ ] Create graph transformation logic
- [ ] Test graph population
- [ ] Generate rich demo case

### Agent 4 Checklist
- [ ] Create `packages/alignment/` package
- [ ] Build cross-modal matching logic
- [ ] Create evidence chain builder
- [ ] Build UI components
- [ ] Test with multi-modal data

### Agent 5 Checklist
- [ ] Create `packages/reasoning/` package
- [ ] Build model adapter (mock or real)
- [ ] Implement prompt builder
- [ ] Create reasoning API
- [ ] Test end-to-end flow

---

## 📝 Notes for Agents

1. **Use TypeScript** - All new code should be TypeScript
2. **Follow Existing Patterns** - Match code style in existing files
3. **Schema Validation** - Validate inputs/outputs against schemas
4. **Error Handling** - Return proper error responses
5. **Documentation** - Add JSDoc comments for public APIs
6. **Testing** - Write tests as you go (unit tests at minimum)

---

## 🎯 Demo End State

When complete, the demo should:
1. Show a patient timeline with multiple events
2. Display cross-modal alignments (e.g., "CT finding matches report text and elevated lab")
3. Allow navigation through timeline
4. Show evidence chains (click finding → see sources)
5. Display AI-generated structured output with evidence links
6. Demonstrate the "unified mapping layer" concept

---

## ❓ Questions for Agents

If you encounter ambiguity:
1. **Graph Storage**: Use in-memory for demo (can migrate to D1 later)
2. **Model Integration**: Mock the model adapter initially (return structured output from prompts)
3. **FHIR**: Use synthetic FHIR-like data (don't need real FHIR parser for demo)
4. **Visualization**: Use simple React components (no heavy graph libraries needed for MVP)

---

**Good luck, agents! Let's build the MedAtlas demo! 🚀**
