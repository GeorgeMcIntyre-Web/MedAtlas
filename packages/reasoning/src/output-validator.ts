import type { MedAtlasOutput } from "@medatlas/schemas/types";
import type { ValidationResult } from "./model-adapter";

export function validateOutput(output: unknown): ValidationResult {
  const errors: Array<{ path: string; message: string }> = [];

  if (!output || typeof output !== "object") {
    return { valid: false, errors: [{ path: "", message: "Output must be an object" }] };
  }

  const o = output as Record<string, unknown>;

  if (typeof o.caseId !== "string") errors.push({ path: "caseId", message: "Must be a string" });
  if (!Array.isArray(o.modalities)) errors.push({ path: "modalities", message: "Must be an array" });
  if (typeof o.summary !== "string") errors.push({ path: "summary", message: "Must be a string" });
  if (!Array.isArray(o.findings)) errors.push({ path: "findings", message: "Must be an array" });
  if (!Array.isArray(o.extractedEntities)) errors.push({ path: "extractedEntities", message: "Must be an array" });
  if (!Array.isArray(o.recommendations)) errors.push({ path: "recommendations", message: "Must be an array" });

  if (typeof o.uncertainty !== "object" || o.uncertainty === null) {
    errors.push({ path: "uncertainty", message: "Must be an object" });
  } else {
    const u = o.uncertainty as Record<string, unknown>;
    if (!["low", "medium", "high"].includes(u.level as string)) {
      errors.push({ path: "uncertainty.level", message: "Must be low, medium, or high" });
    }
    if (!Array.isArray(u.reasons)) {
      errors.push({ path: "uncertainty.reasons", message: "Must be an array" });
    }
  }

  if (typeof o.safety !== "object" || o.safety === null) {
    errors.push({ path: "safety", message: "Must be an object" });
  } else {
    const s = o.safety as Record<string, unknown>;
    if (s.notMedicalAdvice !== true) errors.push({ path: "safety.notMedicalAdvice", message: "Must be true" });
    if (s.requiresClinicianReview !== true) errors.push({ path: "safety.requiresClinicianReview", message: "Must be true" });
  }

  if (Array.isArray(o.findings)) {
    (o.findings as Array<Record<string, unknown>>).forEach((finding, i) => {
      if (typeof finding.label !== "string") {
        errors.push({ path: `findings[${i}].label`, message: "Must be a string" });
      }
      if (!Array.isArray(finding.evidence)) {
        errors.push({ path: `findings[${i}].evidence`, message: "Must be an array" });
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

export function sanitizeOutput(output: Partial<MedAtlasOutput>, caseId: string): MedAtlasOutput {
  return {
    caseId: output.caseId ?? caseId,
    modalities: output.modalities ?? ["unknown"],
    summary: output.summary ?? "No summary available.",
    findings: output.findings ?? [],
    extractedEntities: output.extractedEntities ?? [],
    recommendations: output.recommendations ?? ["Clinician review required."],
    uncertainty: {
      level: output.uncertainty?.level ?? "high",
      reasons: output.uncertainty?.reasons ?? ["Incomplete data"]
    },
    safety: {
      notMedicalAdvice: true,
      requiresClinicianReview: true
    }
  };
}
