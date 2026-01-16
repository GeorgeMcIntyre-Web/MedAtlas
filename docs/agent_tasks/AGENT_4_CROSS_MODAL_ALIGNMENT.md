# AGENT 4: Cross-Modal Alignment & Evidence Visualization

**Status:** 🟡 Waiting for Agents 1 & 3  
**Priority:** 🟡 HIGH (Core vision feature)  
**Dependencies:** Agent 1 (Graph API), Agent 3 (Data with cross-modal relationships)

---

## 🎯 Your Mission

Implement **cross-modal alignment** and **evidence chain visualization**. This is a core differentiator of MedAtlas - showing how findings from different sources (imaging, text, labs) align and correlate.

---

## 📋 Task List

### 1. Create Alignment Package Structure
- [ ] Create `packages/alignment/` directory
- [ ] Add `package.json` with name `@medatlas/alignment`
- [ ] Add `tsconfig.json`
- [ ] Set up exports

### 2. Define Alignment Types (`src/alignment-types.ts`)
- [ ] `CrossModalAlignment` interface:
  ```typescript
  interface CrossModalAlignment {
    findingId: string;
    modalities: {
      imaging?: { nodeId: string; location?: Location; };
      text?: { nodeId: string; excerpt: string; };
      lab?: { nodeId: string; value: number; unit: string; };
    };
    confidence: number;
    evidence: EvidenceRef[];
  }
  ```
- [ ] `EvidenceChain` interface:
  ```typescript
  interface EvidenceChain {
    rootNodeId: string;
    chain: Array<{
      nodeId: string;
      relationship: string;
      evidence: EvidenceRef[];
    }>;
  }
  ```
- [ ] `AlignmentMatch` interface for matching logic

### 3. Implement Cross-Modal Matcher (`src/cross-modal-matcher.ts`)
- [ ] `findAlignments(findingId: string, graph: AtlasGraph): CrossModalAlignment[]`
  - Query graph for nodes related to finding
  - Match across modalities (imaging ↔ text ↔ lab)
  - Calculate confidence scores
- [ ] `matchByLocation(imagingNode: GraphNode, textNode: GraphNode): boolean`
  - Match imaging findings to text mentions by anatomical location
- [ ] `matchByValue(labNode: GraphNode, findingNode: GraphNode): boolean`
  - Match lab values to findings (e.g., elevated CRP ↔ inflammation)
- [ ] `matchByTemporalProximity(node1: GraphNode, node2: GraphNode, threshold: number): boolean`
  - Match nodes that occur close in time

### 4. Implement Evidence Chain Builder (`src/evidence-chain-builder.ts`)
- [ ] `buildEvidenceChain(nodeId: string, graph: AtlasGraph, maxDepth?: number): EvidenceChain`
  - Traverse graph from node
  - Follow evidence edges
  - Build chain of evidence
- [ ] `getSourceArtifacts(chain: EvidenceChain, graph: AtlasGraph): SourceArtifact[]`
  - Extract source artifacts from evidence chain
- [ ] `validateChain(chain: EvidenceChain): boolean`
  - Validate evidence chain integrity

### 5. Create Alignment API Endpoints (`workers/api/src/alignment/`)
- [ ] `GET /alignment/:findingId` - Get cross-modal alignments for a finding
  - Query graph for finding
  - Find related nodes across modalities
  - Return alignments
- [ ] `GET /evidence-chain/:nodeId` - Get evidence chain for a node
  - Build evidence chain
  - Return chain with source artifacts
- [ ] `GET /alignment/compare?node1=...&node2=...` - Compare two nodes
  - Find relationships between nodes
  - Return alignment if exists

### 6. Build Cross-Modal View Component (`apps/web/src/ui/alignment/CrossModalView.tsx`)
- [ ] Display finding in center
- [ ] Show aligned modalities around it:
  - Imaging findings (with location)
  - Text excerpts (highlighted)
  - Lab values (with reference ranges)
- [ ] Show confidence scores
- [ ] Visual connections between modalities
- [ ] Click to navigate to source

### 7. Build Evidence Chain Component (`apps/web/src/ui/alignment/EvidenceChain.tsx`)
- [ ] Display evidence chain as connected nodes
- [ ] Show relationship types (edges)
- [ ] Highlight source artifacts
- [ ] Click to expand node details
- [ ] Visual flow (top to bottom or left to right)

### 8. Build Modality Link Component (`apps/web/src/ui/alignment/ModalityLink.tsx`)
- [ ] Display link between two modalities
- [ ] Show relationship type
- [ ] Show confidence/strength
- [ ] Visual indicator (line, arrow)
- [ ] Hover to show details

### 9. Create Alignment Hook (`apps/web/src/ui/alignment/useCrossModal.ts`)
- [ ] Fetch alignments from API
- [ ] Fetch evidence chains
- [ ] Handle loading/error states
- [ ] Cache results

### 10. Integrate into Timeline UI
- [ ] Add "Show Alignments" button to timeline events
- [ ] Open cross-modal view from timeline
- [ ] Show evidence chain from findings
- [ ] Highlight aligned events in timeline

---

## 📁 Files to Create

```
packages/alignment/
  package.json
  tsconfig.json
  src/
    alignment-types.ts         # Type definitions
    cross-modal-matcher.ts     # Matching logic
    evidence-chain-builder.ts  # Chain building
    index.ts                   # Package exports

apps/web/src/ui/
  alignment/
    CrossModalView.tsx         # Main alignment view
    EvidenceChain.tsx          # Evidence chain visualization
    ModalityLink.tsx           # Link component
    useCrossModal.ts           # Data hook
    types.ts                   # UI-specific types

workers/api/src/
  alignment/
    routes.ts                  # Route definitions
    handlers.ts                # Request handlers
  index.ts                     # Add alignment routes
```

---

## 🔗 Dependencies

- **Agent 1**: Graph API for queries
- **Agent 3**: Data with cross-modal relationships (`matches` edges)
- `@medatlas/graph` - Graph types
- `@medatlas/schemas` - EvidenceRef types

---

## 📝 Implementation Notes

### Cross-Modal Matching Strategy

1. **By Graph Edges**: If Agent 3 created `matches` edges, use those
2. **By Location**: Match imaging findings to text by anatomical location
3. **By Value**: Match lab values to findings (e.g., elevated CRP → inflammation)
4. **By Temporal Proximity**: Match nodes within time window
5. **By Semantic Similarity**: (Advanced) Use embeddings to match concepts

### Alignment Visualization

**Option 1: Radial View**
```
        [Imaging]
           |
    [Text] - [Finding] - [Lab]
           |
        [Study]
```

**Option 2: Side-by-Side**
```
[Finding] → [Imaging] (matches)
[Finding] → [Text] (matches)
[Finding] → [Lab] (matches)
```

**Option 3: Network Graph**
- Use graph visualization library
- Show nodes and edges
- Highlight alignment paths

### Evidence Chain Format
```typescript
{
  rootNodeId: "finding-001",
  chain: [
    {
      nodeId: "finding-001",
      relationship: "root",
      evidence: [{ source: "dicom", id: "ct-001" }]
    },
    {
      nodeId: "lab-crp",
      relationship: "matches",
      evidence: [{ source: "lab", id: "lab-001" }]
    },
    {
      nodeId: "note-001",
      relationship: "matches",
      evidence: [{ source: "note", id: "note-001" }]
    }
  ]
}
```

---

## ✅ Success Criteria

- [ ] Cross-modal alignments displayed (image ↔ text ↔ lab)
- [ ] Evidence chains visualized
- [ ] Click-through from finding to source artifacts
- [ ] Alignment relationships shown in UI
- [ ] Multi-modal correlation clearly visible
- [ ] Confidence scores displayed
- [ ] Integration with timeline works

---

## 🚀 Getting Started

1. Wait for Agent 1's graph API and Agent 3's data
2. Review graph structure to understand `matches` edges
3. Start with matching logic (can test with mock data)
4. Build API endpoints
5. Build UI components
6. Integrate with Agent 2's timeline

---

## 📞 Coordination

- **You depend on:** Agent 1 (graph API), Agent 3 (data with cross-modal links)
- **You enhance:** Agent 2's timeline UI (add alignment views)
- **You create:** Core differentiator feature

**You're building the "wow factor" - make cross-modal alignment shine!** ✨
