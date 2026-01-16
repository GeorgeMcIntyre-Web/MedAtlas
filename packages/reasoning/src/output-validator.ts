import type { MedAtlasOutput, Finding, EvidenceRef } from "@medatlas/schemas/types";
import type { ValidationResult } from "./types";

/**
 * Valid evidence sources
 */
const VALID_SOURCES: EvidenceRef["source"][] = [
  "fhir",
  "dicom",
  "note",
  "lab",
  "device",
  "claims",
  "synthetic",
];

/**
 * Valid uncertainty levels
 */
const VALID_UNCERTAINTY_LEVELS = ["low", "medium", "high"] as const;

/**
 * Validate an EvidenceRef
 */
function validateEvidenceRef(ref: unknown, path: string): string[] {
  const errors: string[] = [];
  
  if (!ref || typeof ref !== "object") {
    errors.push(`${path}: must be an object`);
    return errors;
  }
  
  const obj = ref as Record<string, unknown>;
  
  if (typeof obj.source !== "string") {
    errors.push(`${path}.source: must be a string`);
  } else if (!VALID_SOURCES.includes(obj.source as EvidenceRef["source"])) {
    errors.push(`${path}.source: must be one of ${VALID_SOURCES.join(", ")}`);
  }
  
  if (typeof obj.id !== "string") {
    errors.push(`${path}.id: must be a string`);
  }
  
  if (obj.uri !== undefined && typeof obj.uri !== "string") {
    errors.push(`${path}.uri: must be a string if provided`);
  }
  
  if (obj.capturedAt !== undefined && typeof obj.capturedAt !== "string") {
    errors.push(`${path}.capturedAt: must be a string if provided`);
  }
  
  return errors;
}

/**
 * Validate a Finding
 */
function validateFinding(finding: unknown, index: number): string[] {
  const errors: string[] = [];
  const path = `findings[${index}]`;
  
  if (!finding || typeof finding !== "object") {
    errors.push(`${path}: must be an object`);
    return errors;
  }
  
  const obj = finding as Record<string, unknown>;
  
  if (typeof obj.label !== "string") {
    errors.push(`${path}.label: must be a string`);
  }
  
  if (obj.probability !== undefined) {
    if (typeof obj.probability !== "number") {
      errors.push(`${path}.probability: must be a number`);
    } else if (obj.probability < 0 || obj.probability > 1) {
      errors.push(`${path}.probability: must be between 0 and 1`);
    }
  }
  
  if (!Array.isArray(obj.evidence)) {
    errors.push(`${path}.evidence: must be an array`);
  } else {
    for (let i = 0; i < obj.evidence.length; i++) {
      errors.push(...validateEvidenceRef(obj.evidence[i], `${path}.evidence[${i}]`));
    }
  }
  
  return errors;
}

/**
 * Validate an extracted entity
 */
function validateEntity(entity: unknown, index: number): string[] {
  const errors: string[] = [];
  const path = `extractedEntities[${index}]`;
  
  if (!entity || typeof entity !== "object") {
    errors.push(`${path}: must be an object`);
    return errors;
  }
  
  const obj = entity as Record<string, unknown>;
  
  if (typeof obj.type !== "string") {
    errors.push(`${path}.type: must be a string`);
  }
  
  if (typeof obj.text !== "string") {
    errors.push(`${path}.text: must be a string`);
  }
  
  if (!Array.isArray(obj.evidence)) {
    errors.push(`${path}.evidence: must be an array`);
  } else {
    for (let i = 0; i < obj.evidence.length; i++) {
      errors.push(...validateEvidenceRef(obj.evidence[i], `${path}.evidence[${i}]`));
    }
  }
  
  return errors;
}

/**
 * Validate a complete MedAtlasOutput
 */
export function validateOutput(output: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!output || typeof output !== "object") {
    return { valid: false, errors: ["Output must be an object"] };
  }
  
  const obj = output as Record<string, unknown>;
  
  // Required string fields
  if (typeof obj.caseId !== "string" || obj.caseId.length === 0) {
    errors.push("caseId: must be a non-empty string");
  }
  
  if (typeof obj.summary !== "string") {
    errors.push("summary: must be a string");
  }
  
  // Modalities array
  if (!Array.isArray(obj.modalities)) {
    errors.push("modalities: must be an array");
  } else if (obj.modalities.length === 0) {
    warnings.push("modalities: array is empty");
  }
  
  // Findings array
  if (!Array.isArray(obj.findings)) {
    errors.push("findings: must be an array");
  } else {
    for (let i = 0; i < obj.findings.length; i++) {
      errors.push(...validateFinding(obj.findings[i], i));
    }
  }
  
  // Extracted entities array
  if (!Array.isArray(obj.extractedEntities)) {
    errors.push("extractedEntities: must be an array");
  } else {
    for (let i = 0; i < obj.extractedEntities.length; i++) {
      errors.push(...validateEntity(obj.extractedEntities[i], i));
    }
  }
  
  // Recommendations array
  if (!Array.isArray(obj.recommendations)) {
    errors.push("recommendations: must be an array");
  }
  
  // Uncertainty object
  if (!obj.uncertainty || typeof obj.uncertainty !== "object") {
    errors.push("uncertainty: must be an object");
  } else {
    const unc = obj.uncertainty as Record<string, unknown>;
    if (!VALID_UNCERTAINTY_LEVELS.includes(unc.level as typeof VALID_UNCERTAINTY_LEVELS[number])) {
      errors.push(`uncertainty.level: must be one of ${VALID_UNCERTAINTY_LEVELS.join(", ")}`);
    }
    if (!Array.isArray(unc.reasons)) {
      errors.push("uncertainty.reasons: must be an array");
    }
  }
  
  // Safety object
  if (!obj.safety || typeof obj.safety !== "object") {
    errors.push("safety: must be an object");
  } else {
    const safety = obj.safety as Record<string, unknown>;
    if (safety.notMedicalAdvice !== true) {
      errors.push("safety.notMedicalAdvice: must be true");
    }
    if (safety.requiresClinicianReview !== true) {
      errors.push("safety.requiresClinicianReview: must be true");
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Sanitize and fix common issues in output
 */
export function sanitizeOutput(output: unknown): MedAtlasOutput {
  if (!output || typeof output !== "object") {
    throw new Error("Cannot sanitize non-object output");
  }
  
  const obj = output as Record<string, unknown>;
  
  // Ensure required fields exist with defaults
  const sanitized: MedAtlasOutput = {
    caseId: typeof obj.caseId === "string" ? obj.caseId : "unknown",
    modalities: Array.isArray(obj.modalities) ? obj.modalities.filter(m => typeof m === "string") : [],
    summary: typeof obj.summary === "string" ? obj.summary : "",
    findings: [],
    extractedEntities: [],
    recommendations: [],
    uncertainty: {
      level: "high",
      reasons: ["Output was sanitized - original may have had issues"],
    },
    safety: {
      notMedicalAdvice: true,
      requiresClinicianReview: true,
    },
  };
  
  // Sanitize findings
  if (Array.isArray(obj.findings)) {
    for (const finding of obj.findings) {
      if (finding && typeof finding === "object") {
        const f = finding as Record<string, unknown>;
        if (typeof f.label === "string" && Array.isArray(f.evidence)) {
          sanitized.findings.push({
            label: f.label,
            probability: typeof f.probability === "number" ? Math.max(0, Math.min(1, f.probability)) : undefined,
            evidence: f.evidence.filter(
              (e: unknown) => e && typeof e === "object" && typeof (e as Record<string, unknown>).source === "string" && typeof (e as Record<string, unknown>).id === "string"
            ) as EvidenceRef[],
          });
        }
      }
    }
  }
  
  // Sanitize entities
  if (Array.isArray(obj.extractedEntities)) {
    for (const entity of obj.extractedEntities) {
      if (entity && typeof entity === "object") {
        const e = entity as Record<string, unknown>;
        if (typeof e.type === "string" && typeof e.text === "string" && Array.isArray(e.evidence)) {
          sanitized.extractedEntities.push({
            type: e.type,
            text: e.text,
            value: typeof e.value === "number" ? e.value : undefined,
            unit: typeof e.unit === "string" ? e.unit : undefined,
            evidence: e.evidence.filter(
              (ev: unknown) => ev && typeof ev === "object" && typeof (ev as Record<string, unknown>).source === "string" && typeof (ev as Record<string, unknown>).id === "string"
            ) as EvidenceRef[],
          });
        }
      }
    }
  }
  
  // Sanitize recommendations
  if (Array.isArray(obj.recommendations)) {
    sanitized.recommendations = obj.recommendations.filter(r => typeof r === "string");
  }
  
  // Sanitize uncertainty
  if (obj.uncertainty && typeof obj.uncertainty === "object") {
    const unc = obj.uncertainty as Record<string, unknown>;
    if (VALID_UNCERTAINTY_LEVELS.includes(unc.level as typeof VALID_UNCERTAINTY_LEVELS[number])) {
      sanitized.uncertainty.level = unc.level as "low" | "medium" | "high";
    }
    if (Array.isArray(unc.reasons)) {
      sanitized.uncertainty.reasons = unc.reasons.filter(r => typeof r === "string");
    }
  }
  
  return sanitized;
}
