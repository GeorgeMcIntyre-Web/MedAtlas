# AGENT 3: Data Ingestion & Graph Population

**Status:** 🟡 Ready to Start (can work in parallel with Agent 1)  
**Priority:** 🟡 HIGH (Enables realistic demo data)  
**Dependencies:** Agent 1 (Graph API for population)

---

## 🎯 Your Mission

Build **data ingestion adapters** and **populate the graph** with rich, realistic demo data. You're creating the pipeline that transforms raw medical data (FHIR, synthetic) into the Atlas Graph structure.

---

## 📋 Task List

### 1. Create Ingestion Package Structure
- [ ] Create `packages/ingestion/` directory
- [ ] Add `package.json` with name `@medatlas/ingestion`
- [ ] Add `tsconfig.json`
- [ ] Set up exports

### 2. Define Adapter Interface (`src/adapter-types.ts`)
- [ ] Create `DataAdapter` interface:
  ```typescript
  interface DataAdapter {
    canHandle(source: string): boolean;
    transform(data: unknown, caseId: string): GraphData;
  }
  ```
- [ ] Define `GraphData` type (nodes + edges)
- [ ] Define `IngestionResult` type

### 3. Implement Synthetic Adapter (`src/synthetic-adapter.ts`)
- [ ] Create `SyntheticAdapter` class
- [ ] Transform synthetic case data → graph nodes/edges
- [ ] Handle multiple modalities:
  - Patient, encounters
  - Observations, labs
  - Medications, conditions
  - Imaging studies (references)
- [ ] Create temporal relationships (edges)
- [ ] Create cross-modal links (edges)

### 4. Implement FHIR Adapter (`src/fhir-adapter.ts`)
- [ ] Create `FHIRAdapter` class
- [ ] Parse FHIR Bundle
- [ ] Transform FHIR resources → graph nodes:
  - `Patient` → patient node
  - `Encounter` → encounter node
  - `Observation` → observation/lab nodes
  - `MedicationStatement` → medication node
  - `Condition` → condition node
  - `ImagingStudy` → study node
- [ ] Create relationships from FHIR references
- [ ] Extract evidence references

### 5. Enhanced Synthetic Data Generator (`scripts/seed-graph-demo.mjs`)
- [ ] Create rich synthetic case with:
  - Patient with demographics
  - Multiple encounters (ED visit, follow-up)
  - Observations (vitals, symptoms)
  - Labs (CBC, chemistry, CRP)
  - Medications (prescribed, active)
  - Conditions (diagnoses)
  - Imaging studies (CT, X-ray references)
  - Temporal relationships (all with timestamps)
  - Cross-modal links (lab ↔ finding ↔ image)
- [ ] Generate realistic medical scenarios
- [ ] Include evidence references for all entities

### 6. Graph Population Service (`workers/api/src/ingestion/`)
- [ ] `POST /ingestion/synthetic` - Generate and ingest synthetic case
  - Generate synthetic data
  - Transform to graph
  - Populate graph via Agent 1's API
  - Return ingestion result
- [ ] `POST /ingestion/fhir` - Ingest FHIR bundle
  - Parse FHIR bundle
  - Transform to graph
  - Populate graph
  - Return ingestion result
- [ ] `GET /ingestion/status/:caseId` - Get ingestion status

### 7. Graph Transformation Logic
- [ ] Patient → patient node
- [ ] Encounter → encounter node + `observed-in` edge to patient
- [ ] Observation → observation node + `observed-in` edge to encounter
- [ ] Lab → lab node + `observed-in` edge to encounter
- [ ] Medication → medication node + `observed-in` edge to encounter
- [ ] Condition → condition node + `observed-in` edge to encounter
- [ ] Study → study node + `observed-in` edge to encounter
- [ ] Findings → finding nodes + `derived-from` edges to studies
- [ ] Cross-modal links → `matches` edges between findings

### 8. Evidence Preservation
- [ ] Preserve source information in `EvidenceRef`
- [ ] Link nodes to source artifacts
- [ ] Maintain provenance chain

### 9. Integrate into API (`workers/api/src/index.ts`)
- [ ] Import ingestion routes
- [ ] Add ingestion routes to router

### 10. Create Demo Data Files
- [ ] Generate multiple demo cases (different scenarios)
- [ ] Store in `data/synthetic/` directory
- [ ] Include README explaining data structure

---

## 📁 Files to Create

```
packages/ingestion/
  package.json
  tsconfig.json
  src/
    adapter-types.ts         # Adapter interfaces
    synthetic-adapter.ts      # Synthetic data adapter
    fhir-adapter.ts          # FHIR adapter
    graph-transformer.ts     # Graph transformation logic
    index.ts                 # Package exports

scripts/
  seed-graph-demo.mjs        # Enhanced synthetic data generator

workers/api/src/
  ingestion/
    routes.ts                # Route definitions
    handlers.ts              # Request handlers
  index.ts                   # Add ingestion routes

data/synthetic/
  demo-case-001.json         # Rich demo case
  demo-case-002.json         # Another scenario
  README.md                  # Data documentation
```

---

## 🔗 Dependencies

- **Agent 1**: Graph API endpoints (`POST /graph/nodes`, `POST /graph/edges`)
- `@medatlas/graph` - Graph types (once Agent 1 creates it)
- `@medatlas/schemas` - Use `EvidenceRef` type

---

## 📝 Implementation Notes

### Synthetic Data Structure
Create realistic medical scenarios:
```typescript
interface SyntheticCase {
  caseId: string;
  patient: {
    id: string;
    demographics: { age: number; gender: string; };
  };
  encounters: Array<{
    id: string;
    type: 'ED' | 'outpatient' | 'inpatient';
    timestamp: string;
    observations: Array<{ id: string; type: string; value: unknown; }>;
    labs: Array<{ id: string; name: string; value: number; unit: string; }>;
    medications: Array<{ id: string; name: string; }>;
    conditions: Array<{ id: string; code: string; name: string; }>;
    studies: Array<{ id: string; type: string; findings: string[]; }>;
  }>;
}
```

### Graph Transformation Example
```typescript
// Patient
const patientNode: GraphNode = {
  id: `patient-${caseId}`,
  type: 'patient',
  label: 'Patient',
  properties: { demographics },
  evidence: [],
  createdAt: new Date().toISOString()
};

// Encounter
const encounterNode: GraphNode = {
  id: `encounter-${encounterId}`,
  type: 'encounter',
  label: 'ED Visit',
  properties: { type: 'ED', timestamp },
  evidence: [{ source: 'synthetic', id: encounterId }],
  createdAt: new Date().toISOString()
};

// Edge: encounter observed-in patient
const edge: GraphEdge = {
  id: `edge-${encounterId}-patient`,
  source: `patient-${caseId}`,
  target: `encounter-${encounterId}`,
  type: 'observed-in',
  label: 'observed in',
  properties: {},
  evidence: [],
  createdAt: new Date().toISOString()
};
```

### Cross-Modal Links
Create `matches` edges between:
- Lab finding ↔ Imaging finding
- Report text ↔ Image finding
- Symptom ↔ Lab value

Example:
```typescript
// Lab shows elevated CRP
const labNode = { id: 'lab-crp', type: 'lab', ... };

// CT shows inflammation
const findingNode = { id: 'finding-inflammation', type: 'finding', ... };

// Create match edge
const matchEdge: GraphEdge = {
  source: 'lab-crp',
  target: 'finding-inflammation',
  type: 'matches',
  label: 'matches',
  evidence: [
    { source: 'lab', id: 'lab-crp' },
    { source: 'dicom', id: 'ct-study-001' }
  ],
  ...
};
```

---

## ✅ Success Criteria

- [ ] Synthetic data generator creates realistic graph structure
- [ ] Data transforms correctly to graph nodes/edges
- [ ] Graph populated with temporal relationships
- [ ] Evidence links preserved
- [ ] Multiple modalities represented (notes, labs, imaging refs)
- [ ] Cross-modal links created
- [ ] Ingestion API endpoints work
- [ ] Demo data is rich enough for compelling demo

---

## 🚀 Getting Started

1. Review `scripts/seed-demo.mjs` for current structure
2. Review `docs/vision.md` to understand graph concept
3. Check `packages/schemas/src/types.ts` for `EvidenceRef`
4. Start with synthetic adapter (can work before Agent 1 completes)
5. Once Agent 1's API is ready, integrate graph population
6. Generate rich demo cases

---

## 📞 Coordination

- **You depend on:** Agent 1's graph API (for population)
- **You create:** Demo data that Agent 2 (UI) and Agent 4 (alignment) will use
- **Agent 4 needs:** Data with cross-modal relationships (create `matches` edges)
- **Agent 5 needs:** Rich data for reasoning layer

**You're creating the data foundation - make it realistic and comprehensive!** 📊
