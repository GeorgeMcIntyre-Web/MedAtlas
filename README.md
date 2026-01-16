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

## Safety & clinical use

This repository is an **R&D prototype starter**. It is **not** a medical device and must not be used for diagnosis or treatment without proper validation, approvals, and clinical governance.

## License

Choose a license that matches your intent (Apache-2.0 is common for permissive R&D). See `docs/research_scope.md` for notes.
