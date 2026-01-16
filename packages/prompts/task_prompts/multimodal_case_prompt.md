# Task prompt: multimodal case interpretation

## INPUT

- caseId: {{caseId}}
- modalities: {{modalities}}

Artifacts:
{{artifacts}}

## TASK

1. Extract key entities (conditions, meds, labs, symptoms) with evidence links.
2. Identify notable findings in imaging descriptors (if present) and link evidence.
3. Provide a concise summary suitable for a clinician dashboard.
4. Provide recommendations as **next-steps questions** or **data requests**, not treatment.
5. Set uncertainty appropriately.

## OUTPUT

Return JSON conforming to MedAtlasOutput.
