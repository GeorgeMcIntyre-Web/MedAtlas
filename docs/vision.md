# MedAtlas Vision

MedAtlas is a unified **mapping layer** for medicine.

Modern healthcare is fragmented across:
- EHRs (often multiple vendors per health system)
- imaging archives
- labs
- devices and wearables
- claims/billing
- research datasets

**MedAtlas maps these into a single navigable structure** (the *Atlas Graph*) so that clinical reality becomes queryable, explainable, and auditable.

## Design principles

1. **Unification without flattening**: preserve provenance and raw truth; derive normalized views.
2. **Structured outputs by default**: machine-readable first, human-readable second.
3. **Explainability as a first-class feature**: every conclusion links to evidence.
4. **Auditability and privacy**: logs, policy gates, and separation of concerns.
5. **Workflow respect**: clinicians shouldn’t have to change everything to benefit.

## The “Atlas Graph” idea

At the core is a graph of:
- **Entities** (patient, encounter, observation, study, image series, note, medication, condition)
- **Links** (observed-in, derived-from, matches, contradicts, temporal-near, same-as)
- **Evidence** (source payload + provenance + timestamps)

The graph supports:
- patient timeline navigation
- cross-modal alignment (image findings ↔ report text ↔ labs)
- cohort queries
- research reproducibility

