# AGENT 5: Reasoning Layer & Demo Integration

**Status:** 🟡 Waiting for Agents 1 & 3  
**Priority:** 🟡 HIGH (Completes the demo)  
**Dependencies:** Agent 1 (Graph API), Agent 3 (Demo data)

---

## 🎯 Your Mission

Implement the **reasoning layer** that generates AI-powered structured outputs from the graph, and **integrate everything** into a complete demo. You're creating the "intelligence" that transforms graph data into actionable insights.

---

## 📋 Task List

### 1. Create Reasoning Package Structure
- [ ] Create `packages/reasoning/` directory
- [ ] Add `package.json` with name `@medatlas/reasoning`
- [ ] Add `tsconfig.json`
- [ ] Set up exports

### 2. Define Model Adapter Interface (`src/model-adapter.ts`)
- [ ] Create `ModelAdapter` interface:
  ```typescript
  interface ModelAdapter {
    generateInterpretation(input: ReasoningInput): Promise<MedAtlasOutput>;
    validateOutput(output: unknown): boolean;
  }
  ```
- [ ] Define `ReasoningInput`:
  ```typescript
  interface ReasoningInput {
    caseId: string;
    graphId: string;
    modalities: string[];
    graphData: GraphData; // nodes + edges
  }
  ```

### 3. Implement Mock Model Adapter (`src/mock-adapter.ts`)
- [ ] Create `MockModelAdapter` class (for demo)
- [ ] Generate structured output from graph data
- [ ] Extract findings from graph nodes
- [ ] Build evidence chains
- [ ] Generate summary
- [ ] Calculate uncertainty
- [ ] Return `MedAtlasOutput` conforming to schema

### 4. Implement MedGemma Adapter (Optional) (`src/medgemma-adapter.ts`)
- [ ] Create `MedGemmaAdapter` class
- [ ] Integrate with MedGemma 1.5 API (or mock for now)
- [ ] Build prompts from graph data
- [ ] Call model API
- [ ] Parse structured output
- [ ] Validate against schema

### 5. Implement Prompt Builder (`src/prompt-builder.ts`)
- [ ] `buildSystemPrompt(): string`
  - Use `packages/prompts/research_system_prompt.md`
- [ ] `buildTaskPrompt(graphData: GraphData, caseId: string): string`
  - Use `packages/prompts/task_prompts/multimodal_case_prompt.md`
  - Inject graph data into prompt template
- [ ] `formatGraphDataForPrompt(graphData: GraphData): string`
  - Convert graph to text format for prompt
  - Include nodes, edges, evidence

### 6. Implement Output Validator (`src/output-validator.ts`)
- [ ] `validateOutput(output: unknown): ValidationResult`
  - Validate against `@medatlas/schemas/medatlas-output.schema.json`
  - Check required fields
  - Validate evidence references
  - Check uncertainty levels
- [ ] `sanitizeOutput(output: unknown): MedAtlasOutput`
  - Fix common issues
  - Ensure schema compliance

### 7. Create Reasoning API Endpoints (`workers/api/src/reasoning/`)
- [ ] `POST /reasoning/interpret` - Generate interpretation
  - Input: `{ caseId, graphId, modalities }`
  - Fetch graph data from Agent 1's API
  - Build prompt
  - Call model adapter
  - Validate output
  - Return `MedAtlasOutput`
- [ ] `GET /reasoning/status/:caseId` - Get reasoning status

### 8. Create Demo Integration (`workers/api/src/demo/`)
- [ ] `GET /demo/case/:caseId` - Complete demo endpoint
  - Orchestrate full flow:
    1. Fetch graph data (Agent 1)
    2. Generate interpretation (reasoning layer)
    3. Return complete `MedAtlasOutput`
- [ ] `GET /demo/cases` - List available demo cases
- [ ] `POST /demo/generate` - Generate new demo case
  - Ingest synthetic data (Agent 3)
  - Generate interpretation
  - Return complete case

### 9. Update Existing Demo Endpoint
- [ ] Update `GET /demo/case` in `workers/api/src/index.ts`
  - Use new reasoning layer
  - Return real graph-based output
  - Maintain backward compatibility (optional)

### 10. Integration Testing
- [ ] Test end-to-end flow:
  - Data ingestion → Graph population → Reasoning → Output
- [ ] Test with multiple demo cases
- [ ] Validate outputs against schema
- [ ] Test error handling

---

## 📁 Files to Create

```
packages/reasoning/
  package.json
  tsconfig.json
  src/
    model-adapter.ts          # Adapter interface
    mock-adapter.ts           # Mock implementation
    medgemma-adapter.ts       # MedGemma integration (optional)
    prompt-builder.ts         # Prompt construction
    output-validator.ts      # Output validation
    index.ts                  # Package exports

workers/api/src/
  reasoning/
    routes.ts                 # Route definitions
    handlers.ts               # Request handlers
  demo/
    routes.ts                 # Demo routes
    handlers.ts               # Demo handlers
  index.ts                    # Add routes
```

---

## 🔗 Dependencies

- **Agent 1**: Graph API for fetching graph data
- **Agent 3**: Demo data for testing
- `@medatlas/graph` - Graph types
- `@medatlas/schemas` - MedAtlasOutput schema
- `@medatlas/prompts` - Prompt templates

---

## 📝 Implementation Notes

### Mock Adapter Strategy
For the demo, the mock adapter should:
1. Extract findings from graph nodes (type: 'finding')
2. Extract entities from graph nodes (observations, labs, etc.)
3. Build evidence chains from graph edges
4. Generate summary from graph data
5. Calculate uncertainty based on:
   - Missing data
   - Contradictory findings
   - Low confidence evidence
6. Generate recommendations based on:
   - Missing data
   - Notable findings
   - Temporal patterns

### Prompt Building
```typescript
function buildTaskPrompt(graphData: GraphData, caseId: string): string {
  const template = readFile('packages/prompts/task_prompts/multimodal_case_prompt.md');
  
  const graphText = formatGraphForPrompt(graphData);
  
  return template
    .replace('{{caseId}}', caseId)
    .replace('{{modalities}}', graphData.modalities.join(', '))
    .replace('{{artifacts}}', graphText);
}
```

### Output Generation Flow
```
Graph Data → Prompt Builder → Model Adapter → Raw Output → Validator → MedAtlasOutput
```

### Error Handling
- If model fails, return structured error
- If validation fails, attempt to fix or return error
- Log all reasoning steps for debugging

---

## ✅ Success Criteria

- [ ] Model adapter generates structured outputs
- [ ] Outputs validate against schema
- [ ] Evidence links preserved in outputs
- [ ] Uncertainty expressed correctly
- [ ] Demo endpoint returns complete case
- [ ] End-to-end flow works (data → graph → reasoning → UI)
- [ ] Multiple demo cases work
- [ ] Error handling robust

---

## 🚀 Getting Started

1. Wait for Agent 1's graph API and Agent 3's data
2. Review `packages/prompts/` for prompt templates
3. Review `packages/schemas/src/medatlas-output.schema.json` for output format
4. Start with mock adapter (can work immediately)
5. Build prompt builder
6. Build output validator
7. Create reasoning API
8. Integrate into demo endpoint
9. Test end-to-end

---

## 📞 Coordination

- **You depend on:** Agent 1 (graph API), Agent 3 (demo data)
- **You complete:** The demo pipeline
- **You enhance:** Agent 2's UI will display your outputs
- **You create:** The "intelligence" layer

**You're the final piece - make the demo complete and compelling!** 🎯

---

## 🎁 Bonus: Advanced Features (if time permits)

- [ ] Caching of reasoning results
- [ ] Incremental reasoning (update output as graph changes)
- [ ] Reasoning explanations (why these findings?)
- [ ] Confidence scoring for findings
- [ ] Multi-model ensemble (combine multiple models)
