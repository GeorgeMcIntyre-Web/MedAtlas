# MedAtlas Demo: Agent Coordination Guide

**Status:** 🚀 Ready for Parallel Implementation  
**Created:** 2025-01-29

---

## 🎯 Mission Overview

5 agents working in parallel to build a complete MedAtlas demo showcasing:
- ✅ Atlas Graph (navigable graph of medical data)
- ✅ Patient Timeline (chronological navigation)
- ✅ Cross-Modal Alignment (image ↔ text ↔ lab correlation)
- ✅ Evidence Linking (click-through to sources)
- ✅ AI Reasoning (structured outputs with evidence)

---

## 🤖 Agent Assignments

| Agent | Task | Status | Dependencies |
|-------|------|--------|--------------|
| **Agent 1** | Atlas Graph Core | 🟡 Ready | None (foundation) |
| **Agent 2** | Timeline UI | 🟡 Waiting | Agent 1 |
| **Agent 3** | Data Ingestion | 🟡 Ready | Agent 1 (for population) |
| **Agent 4** | Cross-Modal Alignment | 🟡 Waiting | Agents 1 & 3 |
| **Agent 5** | Reasoning Layer | 🟡 Waiting | Agents 1 & 3 |

---

## 📋 Quick Start for Each Agent

### Agent 1: Start Immediately
- **Task File:** `docs/agent_tasks/AGENT_1_ATLAS_GRAPH_CORE.md`
- **Can Start:** ✅ Now
- **Blocking:** Everyone else (critical path)

### Agent 2: Wait for Agent 1
- **Task File:** `docs/agent_tasks/AGENT_2_TIMELINE_UI.md`
- **Can Start:** ⏳ After Agent 1 completes `/graph/timeline` endpoint
- **Can Prepare:** UI components, styling (mock data)

### Agent 3: Start in Parallel with Agent 1
- **Task File:** `docs/agent_tasks/AGENT_3_DATA_INGESTION.md`
- **Can Start:** ✅ Now (can build adapters, wait for API)
- **Blocking:** None (but needs Agent 1 for population)

### Agent 4: Wait for Agents 1 & 3
- **Task File:** `docs/agent_tasks/AGENT_4_CROSS_MODAL_ALIGNMENT.md`
- **Can Start:** ⏳ After Agents 1 & 3 complete
- **Can Prepare:** UI components, matching logic (mock data)

### Agent 5: Wait for Agents 1 & 3
- **Task File:** `docs/agent_tasks/AGENT_5_REASONING_LAYER.md`
- **Can Start:** ⏳ After Agents 1 & 3 complete
- **Can Prepare:** Mock adapter, prompt builder (no API needed)

---

## 🔄 Integration Points

### Phase 1: Foundation (Week 1)
```
Agent 1 (Graph Core) ──┐
                       ├──> Graph API Ready
Agent 3 (Ingestion) ───┘
```

### Phase 2: Features (Week 1-2)
```
Agent 1 ──> Agent 2 (Timeline UI)
Agent 1 ──> Agent 4 (Alignment)
Agent 1 ──> Agent 5 (Reasoning)
Agent 3 ──> Agent 4 (Data with cross-modal links)
Agent 3 ──> Agent 5 (Demo data)
```

### Phase 3: Integration (Week 2)
```
All Agents ──> End-to-End Demo
```

---

## 📞 Communication Protocol

### Shared Interfaces
All agents must use:
- `@medatlas/schemas` - For `EvidenceRef`, `MedAtlasOutput` types
- Graph API format (defined by Agent 1)
- Error response format: `{ error: string; code?: string }`

### API Contracts
- **Agent 1** defines: Graph API endpoints
- **Agent 3** defines: Ingestion API endpoints
- **Agent 4** defines: Alignment API endpoints
- **Agent 5** defines: Reasoning API endpoints

### Code Style
- TypeScript strict mode
- Use existing patterns from codebase
- Add JSDoc comments for public APIs
- Write unit tests

---

## 🚨 Critical Path

**Agent 1 is on the critical path** - all other agents depend on it.

**Recommended order:**
1. **Agent 1** starts immediately (foundation)
2. **Agent 3** starts in parallel (can build adapters, wait for API)
3. **Agent 2** starts after Agent 1's `/graph/timeline` endpoint
4. **Agent 4** starts after Agents 1 & 3 complete
5. **Agent 5** starts after Agents 1 & 3 complete

---

## ✅ Success Checklist

### Agent 1 Complete When:
- [ ] Graph API endpoints working
- [ ] `/graph/timeline/:patientId` returns timeline data
- [ ] Graph can store/query nodes and edges
- [ ] Other agents can use the API

### Agent 2 Complete When:
- [ ] Timeline displays events chronologically
- [ ] Navigation works (prev/next, date jump)
- [ ] Filters work
- [ ] Evidence links clickable

### Agent 3 Complete When:
- [ ] Synthetic data generator creates rich graph
- [ ] Graph populated with demo data
- [ ] Cross-modal links created
- [ ] Ingestion API works

### Agent 4 Complete When:
- [ ] Cross-modal alignments displayed
- [ ] Evidence chains visualized
- [ ] Alignment API works
- [ ] Integrated with timeline

### Agent 5 Complete When:
- [ ] Reasoning API generates structured outputs
- [ ] Outputs validate against schema
- [ ] Demo endpoint works end-to-end
- [ ] Complete flow: data → graph → reasoning → UI

---

## 🐛 Troubleshooting

### If Agent 1 is Blocked
- Other agents can use mock data/APIs
- Agent 1 should prioritize `/graph/timeline` endpoint first

### If Integration Fails
- Check API contracts match
- Verify types are compatible
- Test with sample data first

### If Demo Doesn't Work
- Test each component independently
- Check API endpoints with curl/Postman
- Verify data flow: ingestion → graph → reasoning → UI

---

## 📚 Reference Documents

- **Master Plan:** `docs/agent_implementation_plan.md`
- **Agent 1:** `docs/agent_tasks/AGENT_1_ATLAS_GRAPH_CORE.md`
- **Agent 2:** `docs/agent_tasks/AGENT_2_TIMELINE_UI.md`
- **Agent 3:** `docs/agent_tasks/AGENT_3_DATA_INGESTION.md`
- **Agent 4:** `docs/agent_tasks/AGENT_4_CROSS_MODAL_ALIGNMENT.md`
- **Agent 5:** `docs/agent_tasks/AGENT_5_REASONING_LAYER.md`
- **Vision:** `docs/vision.md`
- **Code Review:** `docs/code_review.md`

---

## 🎯 Demo End State

When all agents complete, the demo should:

1. **Show a patient timeline** with multiple events (encounters, labs, studies)
2. **Display cross-modal alignments** (e.g., "CT finding matches report text and elevated lab")
3. **Allow navigation** through timeline (prev/next, date jump, filters)
4. **Show evidence chains** (click finding → see sources)
5. **Display AI-generated structured output** with evidence links
6. **Demonstrate the "unified mapping layer"** concept

---

## 🚀 Let's Build!

**Agents, you have your assignments. Let's make MedAtlas shine!** ✨

**Questions?** Check your task file or the master plan document.

**Stuck?** Review the vision document to understand the "why" behind your task.

**Ready?** Start coding! 🎉
