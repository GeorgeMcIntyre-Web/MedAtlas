# Research scope & evaluation

## What “research-grade” means here

- **Transparent outputs**: structured JSON + citations to evidence nodes.
- **Measurable**: evaluation harness + datasets + scoring.
- **Reproducible**: pinned model versions, deterministic pipelines where possible.
- **Ethical**: privacy boundaries, audit logs, and clear human oversight.

## Evaluation tracks

1. **Extraction accuracy** (notes → problems, meds, labs)
2. **Imaging alignment** (findings ↔ locations ↔ report)
3. **Consistency checks** (lab values vs narrative claims)
4. **Longitudinal delta correctness** (study-to-study change summaries)
5. **Safety** (uncertainty expression, refusal on missing data, no hallucinated certainty)

## Synthetic data policy

Use synthetic data for:
- demos
- pipeline testing
- UX development

When moving to real data:
- establish governance
- de-identification / secure enclaves
- compliance review (HIPAA/GDPR/etc)

## Licensing notes

If you plan open-source:
- permissive: Apache-2.0 / MIT
- protection: AGPL / SSPL (be careful)

Choose based on your commercialization intent.
