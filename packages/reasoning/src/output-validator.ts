/**
 * Output Validator for MedAtlas Reasoning Layer
 *
 * Validates and sanitizes MedAtlasOutput against the schema,
 * ensuring all outputs conform to expected structure.
 */

import type { MedAtlasOutput, Finding, EvidenceRef } from "@medatlas/schemas/types";
import type { ValidationResult, ValidationError } from "./model-adapter.js";

/**
 * Valid evidence source types
 */
const VALID_SOURCES = [
  "fhir",
  "dicom",
  "note",
  "lab",
  "device",
  "claims",
  "synthetic",
] as const;

/**
 * Valid uncertainty levels
 */
const VALID_UNCERTAINTY_LEVELS = ["low", "medium", "high"] as const;

/**
 * Validate an output against the MedAtlasOutput schema
 *
 * @param output - The output to validate
 * @returns ValidationResult with valid flag and any errors
 */
export function validateOutput(output: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!output || typeof output !== "object") {
    return {
      valid: false,
      errors: [{ path: "", message: "Output must be an object", value: output }],
    };
  }

  const obj = output as Record<string, unknown>;

  // Required string fields
  if (typeof obj.caseId !== "string" || obj.caseId.length === 0) {
    errors.push({
      path: "caseId",
      message: "caseId must be a non-empty string",
      value: obj.caseId,
    });
  }

  if (typeof obj.summary !== "string") {
    errors.push({
      path: "summary",
      message: "summary must be a string",
      value: obj.summary,
    });
  }

  // Modalities array
  if (!Array.isArray(obj.modalities)) {
    errors.push({
      path: "modalities",
      message: "modalities must be an array",
      value: obj.modalities,
    });
  } else {
    obj.modalities.forEach((m, i) => {
      if (typeof m !== "string") {
        errors.push({
          path: `modalities[${i}]`,
          message: "modality must be a string",
          value: m,
        });
      }
    });
  }

  // Findings array
  if (!Array.isArray(obj.findings)) {
    errors.push({
      path: "findings",
      message: "findings must be an array",
      value: obj.findings,
    });
  } else {
    obj.findings.forEach((f, i) => {
      const findingErrors = validateFinding(f, `findings[${i}]`);
      errors.push(...findingErrors);
    });
  }

  // Extracted entities array
  if (!Array.isArray(obj.extractedEntities)) {
    errors.push({
      path: "extractedEntities",
      message: "extractedEntities must be an array",
      value: obj.extractedEntities,
    });
  } else {
    obj.extractedEntities.forEach((e, i) => {
      const entityErrors = validateEntity(e, `extractedEntities[${i}]`);
      errors.push(...entityErrors);
    });
  }

  // Recommendations array
  if (!Array.isArray(obj.recommendations)) {
    errors.push({
      path: "recommendations",
      message: "recommendations must be an array",
      value: obj.recommendations,
    });
  } else {
    obj.recommendations.forEach((r, i) => {
      if (typeof r !== "string") {
        errors.push({
          path: `recommendations[${i}]`,
          message: "recommendation must be a string",
          value: r,
        });
      }
    });
  }

  // Uncertainty object
  const uncertaintyErrors = validateUncertainty(obj.uncertainty, "uncertainty");
  errors.push(...uncertaintyErrors);

  // Safety object
  const safetyErrors = validateSafety(obj.safety, "safety");
  errors.push(...safetyErrors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a Finding object
 */
function validateFinding(
  finding: unknown,
  path: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!finding || typeof finding !== "object") {
    return [{ path, message: "finding must be an object", value: finding }];
  }

  const f = finding as Record<string, unknown>;

  if (typeof f.label !== "string" || f.label.length === 0) {
    errors.push({
      path: `${path}.label`,
      message: "label must be a non-empty string",
      value: f.label,
    });
  }

  if (f.probability !== undefined) {
    if (typeof f.probability !== "number" || f.probability < 0 || f.probability > 1) {
      errors.push({
        path: `${path}.probability`,
        message: "probability must be a number between 0 and 1",
        value: f.probability,
      });
    }
  }

  if (!Array.isArray(f.evidence)) {
    errors.push({
      path: `${path}.evidence`,
      message: "evidence must be an array",
      value: f.evidence,
    });
  } else {
    f.evidence.forEach((e, i) => {
      const evidenceErrors = validateEvidenceRef(e, `${path}.evidence[${i}]`);
      errors.push(...evidenceErrors);
    });
  }

  if (f.location !== undefined) {
    const locationErrors = validateLocation(f.location, `${path}.location`);
    errors.push(...locationErrors);
  }

  return errors;
}

/**
 * Validate an extracted entity
 */
function validateEntity(
  entity: unknown,
  path: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!entity || typeof entity !== "object") {
    return [{ path, message: "entity must be an object", value: entity }];
  }

  const e = entity as Record<string, unknown>;

  if (typeof e.type !== "string" || e.type.length === 0) {
    errors.push({
      path: `${path}.type`,
      message: "type must be a non-empty string",
      value: e.type,
    });
  }

  if (typeof e.text !== "string" || e.text.length === 0) {
    errors.push({
      path: `${path}.text`,
      message: "text must be a non-empty string",
      value: e.text,
    });
  }

  if (e.value !== undefined && typeof e.value !== "number") {
    errors.push({
      path: `${path}.value`,
      message: "value must be a number if provided",
      value: e.value,
    });
  }

  if (e.unit !== undefined && typeof e.unit !== "string") {
    errors.push({
      path: `${path}.unit`,
      message: "unit must be a string if provided",
      value: e.unit,
    });
  }

  if (!Array.isArray(e.evidence)) {
    errors.push({
      path: `${path}.evidence`,
      message: "evidence must be an array",
      value: e.evidence,
    });
  } else {
    e.evidence.forEach((ev, i) => {
      const evidenceErrors = validateEvidenceRef(ev, `${path}.evidence[${i}]`);
      errors.push(...evidenceErrors);
    });
  }

  return errors;
}

/**
 * Validate an EvidenceRef
 */
function validateEvidenceRef(
  evidence: unknown,
  path: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!evidence || typeof evidence !== "object") {
    return [{ path, message: "evidence must be an object", value: evidence }];
  }

  const e = evidence as Record<string, unknown>;

  if (typeof e.source !== "string" || !VALID_SOURCES.includes(e.source as typeof VALID_SOURCES[number])) {
    errors.push({
      path: `${path}.source`,
      message: `source must be one of: ${VALID_SOURCES.join(", ")}`,
      value: e.source,
    });
  }

  if (typeof e.id !== "string" || e.id.length === 0) {
    errors.push({
      path: `${path}.id`,
      message: "id must be a non-empty string",
      value: e.id,
    });
  }

  if (e.uri !== undefined && typeof e.uri !== "string") {
    errors.push({
      path: `${path}.uri`,
      message: "uri must be a string if provided",
      value: e.uri,
    });
  }

  if (e.capturedAt !== undefined && typeof e.capturedAt !== "string") {
    errors.push({
      path: `${path}.capturedAt`,
      message: "capturedAt must be a string if provided",
      value: e.capturedAt,
    });
  }

  return errors;
}

/**
 * Validate a location object
 */
function validateLocation(
  location: unknown,
  path: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!location || typeof location !== "object") {
    return [{ path, message: "location must be an object", value: location }];
  }

  const l = location as Record<string, unknown>;

  if (l.anatomy !== undefined && typeof l.anatomy !== "string") {
    errors.push({
      path: `${path}.anatomy`,
      message: "anatomy must be a string if provided",
      value: l.anatomy,
    });
  }

  if (l.imageRef !== undefined && typeof l.imageRef !== "string") {
    errors.push({
      path: `${path}.imageRef`,
      message: "imageRef must be a string if provided",
      value: l.imageRef,
    });
  }

  if (l.sliceIndex !== undefined) {
    if (typeof l.sliceIndex !== "number" || !Number.isInteger(l.sliceIndex) || l.sliceIndex < 0) {
      errors.push({
        path: `${path}.sliceIndex`,
        message: "sliceIndex must be a non-negative integer if provided",
        value: l.sliceIndex,
      });
    }
  }

  if (l.coordinates !== undefined) {
    if (
      !Array.isArray(l.coordinates) ||
      l.coordinates.length !== 3 ||
      !l.coordinates.every((c) => typeof c === "number")
    ) {
      errors.push({
        path: `${path}.coordinates`,
        message: "coordinates must be an array of 3 numbers if provided",
        value: l.coordinates,
      });
    }
  }

  return errors;
}

/**
 * Validate uncertainty object
 */
function validateUncertainty(
  uncertainty: unknown,
  path: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!uncertainty || typeof uncertainty !== "object") {
    return [{ path, message: "uncertainty must be an object", value: uncertainty }];
  }

  const u = uncertainty as Record<string, unknown>;

  if (
    typeof u.level !== "string" ||
    !VALID_UNCERTAINTY_LEVELS.includes(u.level as typeof VALID_UNCERTAINTY_LEVELS[number])
  ) {
    errors.push({
      path: `${path}.level`,
      message: `level must be one of: ${VALID_UNCERTAINTY_LEVELS.join(", ")}`,
      value: u.level,
    });
  }

  if (!Array.isArray(u.reasons)) {
    errors.push({
      path: `${path}.reasons`,
      message: "reasons must be an array",
      value: u.reasons,
    });
  } else {
    u.reasons.forEach((r, i) => {
      if (typeof r !== "string") {
        errors.push({
          path: `${path}.reasons[${i}]`,
          message: "reason must be a string",
          value: r,
        });
      }
    });
  }

  return errors;
}

/**
 * Validate safety object
 */
function validateSafety(safety: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!safety || typeof safety !== "object") {
    return [{ path, message: "safety must be an object", value: safety }];
  }

  const s = safety as Record<string, unknown>;

  if (s.notMedicalAdvice !== true) {
    errors.push({
      path: `${path}.notMedicalAdvice`,
      message: "notMedicalAdvice must be true",
      value: s.notMedicalAdvice,
    });
  }

  if (s.requiresClinicianReview !== true) {
    errors.push({
      path: `${path}.requiresClinicianReview`,
      message: "requiresClinicianReview must be true",
      value: s.requiresClinicianReview,
    });
  }

  return errors;
}

/**
 * Sanitize and fix common issues in output to ensure schema compliance
 *
 * @param output - The output to sanitize
 * @returns A sanitized MedAtlasOutput
 */
export function sanitizeOutput(output: unknown): MedAtlasOutput {
  const obj = (output && typeof output === "object" ? output : {}) as Record<
    string,
    unknown
  >;

  // Ensure safety flags are always correct
  const safety = {
    notMedicalAdvice: true as const,
    requiresClinicianReview: true as const,
  };

  // Ensure uncertainty has valid structure
  const rawUncertainty = obj.uncertainty as Record<string, unknown> | undefined;
  const uncertainty = {
    level: (
      rawUncertainty?.level &&
      VALID_UNCERTAINTY_LEVELS.includes(
        rawUncertainty.level as typeof VALID_UNCERTAINTY_LEVELS[number]
      )
        ? rawUncertainty.level
        : "high"
    ) as "low" | "medium" | "high",
    reasons: Array.isArray(rawUncertainty?.reasons)
      ? (rawUncertainty.reasons as unknown[]).filter((r): r is string => typeof r === "string")
      : ["Uncertainty level unknown"],
  };

  // Sanitize findings
  const findings: Finding[] = [];
  if (Array.isArray(obj.findings)) {
    for (const f of obj.findings as unknown[]) {
      if (f && typeof f === "object") {
        const finding = f as Record<string, unknown>;
        if (typeof finding.label === "string" && Array.isArray(finding.evidence)) {
          const sanitizedEvidence = sanitizeEvidenceArray(finding.evidence as unknown[]);
          if (sanitizedEvidence.length > 0) {
            const sanitizedFinding: Finding = {
              label: finding.label,
              evidence: sanitizedEvidence,
            };
            if (
              typeof finding.probability === "number" &&
              finding.probability >= 0 &&
              finding.probability <= 1
            ) {
              sanitizedFinding.probability = finding.probability;
            }
            if (finding.location && typeof finding.location === "object") {
              sanitizedFinding.location = sanitizeLocation(
                finding.location as Record<string, unknown>
              );
            }
            findings.push(sanitizedFinding);
          }
        }
      }
    }
  }

  // Sanitize extracted entities
  const extractedEntities: MedAtlasOutput["extractedEntities"] = [];
  if (Array.isArray(obj.extractedEntities)) {
    for (const e of obj.extractedEntities as unknown[]) {
      if (e && typeof e === "object") {
        const entity = e as Record<string, unknown>;
        if (
          typeof entity.type === "string" &&
          typeof entity.text === "string" &&
          Array.isArray(entity.evidence)
        ) {
          const sanitizedEvidence = sanitizeEvidenceArray(entity.evidence as unknown[]);
          if (sanitizedEvidence.length > 0) {
            const sanitizedEntity: MedAtlasOutput["extractedEntities"][number] = {
              type: entity.type,
              text: entity.text,
              evidence: sanitizedEvidence,
            };
            if (typeof entity.value === "number") {
              sanitizedEntity.value = entity.value;
            }
            if (typeof entity.unit === "string") {
              sanitizedEntity.unit = entity.unit;
            }
            extractedEntities.push(sanitizedEntity);
          }
        }
      }
    }
  }

  // Sanitize recommendations
  const recommendations: string[] = [];
  if (Array.isArray(obj.recommendations)) {
    for (const r of obj.recommendations as unknown[]) {
      if (typeof r === "string" && r.length > 0) {
        recommendations.push(r);
      }
    }
  }

  return {
    caseId: typeof obj.caseId === "string" ? obj.caseId : "unknown",
    modalities: Array.isArray(obj.modalities)
      ? (obj.modalities as unknown[]).filter((m): m is string => typeof m === "string")
      : [],
    summary: typeof obj.summary === "string" ? obj.summary : "No summary available.",
    findings,
    extractedEntities,
    recommendations,
    uncertainty,
    safety,
  };
}

/**
 * Sanitize an array of evidence refs
 */
function sanitizeEvidenceArray(evidence: unknown[]): EvidenceRef[] {
  const sanitized: EvidenceRef[] = [];
  for (const e of evidence) {
    if (e && typeof e === "object") {
      const ev = e as Record<string, unknown>;
      if (
        typeof ev.source === "string" &&
        VALID_SOURCES.includes(ev.source as typeof VALID_SOURCES[number]) &&
        typeof ev.id === "string"
      ) {
        const ref: EvidenceRef = {
          source: ev.source as EvidenceRef["source"],
          id: ev.id,
        };
        if (typeof ev.uri === "string") {
          ref.uri = ev.uri;
        }
        if (typeof ev.capturedAt === "string") {
          ref.capturedAt = ev.capturedAt;
        }
        sanitized.push(ref);
      }
    }
  }
  return sanitized;
}

/**
 * Sanitize a location object
 */
function sanitizeLocation(
  location: Record<string, unknown>
): Finding["location"] {
  const result: Finding["location"] = {};

  if (typeof location.anatomy === "string") {
    result.anatomy = location.anatomy;
  }
  if (typeof location.imageRef === "string") {
    result.imageRef = location.imageRef;
  }
  if (
    typeof location.sliceIndex === "number" &&
    Number.isInteger(location.sliceIndex) &&
    location.sliceIndex >= 0
  ) {
    result.sliceIndex = location.sliceIndex;
  }
  if (
    Array.isArray(location.coordinates) &&
    location.coordinates.length === 3 &&
    location.coordinates.every((c) => typeof c === "number")
  ) {
    result.coordinates = location.coordinates as [number, number, number];
  }

  return result;
}

/**
 * Quick check if output is valid (boolean return)
 */
export function isValidOutput(output: unknown): output is MedAtlasOutput {
  return validateOutput(output).valid;
}
