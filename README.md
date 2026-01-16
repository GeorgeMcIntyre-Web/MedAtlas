# MedAtlas

**MedAtlas** is a research-grade, Cloudflare-first platform concept for **mapping clinical reality** into a unified, navigable health intelligence graph.

> **Goal:** unify *all medical data types* (EHR/FHIR, imaging/DICOM, labs, genomics, notes, wearables, claims) into a single **Atlas Graph** that can be queried, explained, audited, and visualized.

## What’s in this starter

- **Cloudflare Pages UI** (React + Vite)
- **Cloudflare Worker API** (TypeScript)
- **Shared schemas** (JSON Schema + TypeScript types)
- **Research-grade prompting pack** (MedGemma 1.5 oriented)
- **Synthetic demo data generator** (minimal, extendable)
- **Docs** for vision, clinical use-cases, and a stakeholder pitch

## Quickstart (Cursor-friendly)

### Prereqs
- Node.js (LTS)
- pnpm (recommended) or npm
- Cloudflare Wrangler (optional for local Worker dev)

### Install
```bash
pnpm install
```

### Run UI (local)
```bash
pnpm --filter @medatlas/web dev
```

### Run API Worker (local)
```bash
pnpm --filter @medatlas/api dev
```

### Generate synthetic demo bundle
```bash
pnpm demo:seed
```

## Architecture (high level)

- **Atlas Graph**: canonical entities + links across modalities (patient, encounter, observation, image study, finding, etc.)
- **Ingestion adapters**: FHIR, DICOM, text, devices
- **Reasoning layer**: model adapters (e.g., MedGemma 1.5), tool-based validation, structured outputs
- **UX layer**: patient timeline, imaging + text correlation, explainability/audit views

## Repo layout

- `apps/web` – Cloudflare Pages frontend
- `workers/api` – Cloudflare Worker API
- `packages/schemas` – JSON Schema + TS types
- `packages/prompts` – research-grade prompting pack
- `scripts` – synthetic data + utilities
- `docs` – vision + pitch + research scope

## 🚀 Agent Implementation Plan

This project is being built by **5 parallel AI agents**. See:

- **Master Plan:** [`docs/agent_implementation_plan.md`](docs/agent_implementation_plan.md)
- **Coordination Guide:** [`docs/AGENT_COORDINATION.md`](docs/AGENT_COORDINATION.md)
- **Agent Tasks:**
  - [Agent 1: Atlas Graph Core](docs/agent_tasks/AGENT_1_ATLAS_GRAPH_CORE.md)
  - [Agent 2: Timeline UI](docs/agent_tasks/AGENT_2_TIMELINE_UI.md)
  - [Agent 3: Data Ingestion](docs/agent_tasks/AGENT_3_DATA_INGESTION.md)
  - [Agent 4: Cross-Modal Alignment](docs/agent_tasks/AGENT_4_CROSS_MODAL_ALIGNMENT.md)
  - [Agent 5: Reasoning Layer](docs/agent_tasks/AGENT_5_REASONING_LAYER.md)

## Safety & clinical use

This repository is an **R&D prototype starter**. It is **not** a medical device and must not be used for diagnosis or treatment without proper validation, approvals, and clinical governance.

## License

Choose a license that matches your intent (Apache-2.0 is common for permissive R&D). See `docs/research_scope.md` for notes.
