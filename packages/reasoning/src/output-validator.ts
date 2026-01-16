/**
 * Output validator for MedAtlasOutput schema.
 * Validates and sanitizes model outputs.
 */

import type { MedAtlasOutput, Finding, EvidenceRef } from "@medatlas/schemas/types";

/**
 * Validation result with detailed error information.
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * A validation error that prevents output from being valid.
 */
export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

/**
 * A validation warning that doesn't prevent output from being valid.
 */
export interface ValidationWarning {
  path: string;
  message: string;
  code: string;
}

/**
 * Valid evidence sources.
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
 * Valid uncertainty levels.
 */
const VALID_UNCERTAINTY_LEVELS = ["low", "medium", "high"] as const;

/**
 * Validate a MedAtlasOutput object.
 */
export function validateOutput(output: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (typeof output !== "object" || output === null) {
    errors.push({
      path: "",
      message: "Output must be an object",
      code: "INVALID_TYPE",
    });
    return { valid: false, errors, warnings };
  }

  const obj = output as Record<string, unknown>;

  // Validate required fields
  validateRequiredField(obj, "caseId", "string", errors);
  validateRequiredField(obj, "modalities", "array", errors);
  validateRequiredField(obj, "summary", "string", errors);
  validateRequiredField(obj, "findings", "array", errors);
  validateRequiredField(obj, "extractedEntities", "array", errors);
  validateRequiredField(obj, "recommendations", "array", errors);
  validateRequiredField(obj, "uncertainty", "object", errors);
  validateRequiredField(obj, "safety", "object", errors);

  // Validate modalities array
  if (Array.isArray(obj.modalities)) {
    for (let i = 0; i < obj.modalities.length; i++) {
      if (typeof obj.modalities[i] !== "string") {
        errors.push({
          path: `modalities[${i}]`,
          message: "Modality must be a string",
          code: "INVALID_MODALITY",
        });
      }
    }
  }

  // Validate findings array
  if (Array.isArray(obj.findings)) {
    for (let i = 0; i < obj.findings.length; i++) {
      validateFinding(obj.findings[i], `findings[${i}]`, errors, warnings);
    }
  }

  // Validate extracted entities array
  if (Array.isArray(obj.extractedEntities)) {
    for (let i = 0; i < obj.extractedEntities.length; i++) {
      validateEntity(obj.extractedEntities[i], `extractedEntities[${i}]`, errors, warnings);
    }
  }

  // Validate recommendations array
  if (Array.isArray(obj.recommendations)) {
    for (let i = 0; i < obj.recommendations.length; i++) {
      if (typeof obj.recommendations[i] !== "string") {
        errors.push({
          path: `recommendations[${i}]`,
          message: "Recommendation must be a string",
          code: "INVALID_RECOMMENDATION",
        });
      }
    }
  }

  // Validate uncertainty
  validateUncertainty(obj.uncertainty, errors, warnings);

  // Validate safety
  validateSafety(obj.safety, errors);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a required field exists and has correct type.
 */
function validateRequiredField(
  obj: Record<string, unknown>,
  field: string,
  expectedType: "string" | "array" | "object" | "number",
  errors: ValidationError[]
): void {
  if (!(field in obj)) {
    errors.push({
      path: field,
      message: `Required field '${field}' is missing`,
      code: "MISSING_REQUIRED",
    });
    return;
  }

  const value = obj[field];
  let isValid = false;

  switch (expectedType) {
    case "string":
      isValid = typeof value === "string";
      break;
    case "array":
      isValid = Array.isArray(value);
      break;
    case "object":
      isValid = typeof value === "object" && value !== null && !Array.isArray(value);
      break;
    case "number":
      isValid = typeof value === "number";
      break;
  }

  if (!isValid) {
    errors.push({
      path: field,
      message: `Field '${field}' must be of type ${expectedType}`,
      code: "INVALID_TYPE",
    });
  }
}

/**
 * Validate a finding object.
 */
function validateFinding(
  finding: unknown,
  path: string,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (typeof finding !== "object" || finding === null) {
    errors.push({
      path,
      message: "Finding must be an object",
      code: "INVALID_FINDING",
    });
    return;
  }

  const f = finding as Record<string, unknown>;

  // Required: label
  if (typeof f.label !== "string") {
    errors.push({
      path: `${path}.label`,
      message: "Finding label must be a string",
      code: "INVALID_FINDING_LABEL",
    });
  }

  // Required: evidence array
  if (!Array.isArray(f.evidence)) {
    errors.push({
      path: `${path}.evidence`,
      message: "Finding must have an evidence array",
      code: "MISSING_EVIDENCE",
    });
  } else {
    for (let i = 0; i < f.evidence.length; i++) {
      validateEvidenceRef(f.evidence[i], `${path}.evidence[${i}]`, errors);
    }

    if (f.evidence.length === 0) {
      warnings.push({
        path: `${path}.evidence`,
        message: "Finding has no evidence references",
        code: "EMPTY_EVIDENCE",
      });
    }
  }

  // Optional: probability
  if (f.probability !== undefined) {
    if (typeof f.probability !== "number") {
      errors.push({
        path: `${path}.probability`,
        message: "Probability must be a number",
        code: "INVALID_PROBABILITY",
      });
    } else if (f.probability < 0 || f.probability > 1) {
      errors.push({
        path: `${path}.probability`,
        message: "Probability must be between 0 and 1",
        code: "PROBABILITY_OUT_OF_RANGE",
      });
    }
  }

  // Optional: location
  if (f.location !== undefined) {
    validateLocation(f.location, `${path}.location`, errors);
  }
}

/**
 * Validate an evidence reference.
 */
function validateEvidenceRef(
  evidence: unknown,
  path: string,
  errors: ValidationError[]
): void {
  if (typeof evidence !== "object" || evidence === null) {
    errors.push({
      path,
      message: "Evidence reference must be an object",
      code: "INVALID_EVIDENCE_REF",
    });
    return;
  }

  const e = evidence as Record<string, unknown>;

  // Required: source
  if (typeof e.source !== "string") {
    errors.push({
      path: `${path}.source`,
      message: "Evidence source must be a string",
      code: "INVALID_EVIDENCE_SOURCE",
    });
  } else if (!VALID_SOURCES.includes(e.source as EvidenceRef["source"])) {
    errors.push({
      path: `${path}.source`,
      message: `Evidence source must be one of: ${VALID_SOURCES.join(", ")}`,
      code: "INVALID_EVIDENCE_SOURCE_VALUE",
    });
  }

  // Required: id
  if (typeof e.id !== "string") {
    errors.push({
      path: `${path}.id`,
      message: "Evidence id must be a string",
      code: "INVALID_EVIDENCE_ID",
    });
  }

  // Optional: uri (must be string if present)
  if (e.uri !== undefined && typeof e.uri !== "string") {
    errors.push({
      path: `${path}.uri`,
      message: "Evidence uri must be a string",
      code: "INVALID_EVIDENCE_URI",
    });
  }

  // Optional: capturedAt (must be string if present)
  if (e.capturedAt !== undefined && typeof e.capturedAt !== "string") {
    errors.push({
      path: `${path}.capturedAt`,
      message: "Evidence capturedAt must be a string",
      code: "INVALID_EVIDENCE_CAPTURED_AT",
    });
  }
}

/**
 * Validate a location object.
 */
function validateLocation(
  location: unknown,
  path: string,
  errors: ValidationError[]
): void {
  if (typeof location !== "object" || location === null) {
    errors.push({
      path,
      message: "Location must be an object",
      code: "INVALID_LOCATION",
    });
    return;
  }

  const loc = location as Record<string, unknown>;

  // Optional fields - validate types if present
  if (loc.anatomy !== undefined && typeof loc.anatomy !== "string") {
    errors.push({
      path: `${path}.anatomy`,
      message: "Location anatomy must be a string",
      code: "INVALID_LOCATION_ANATOMY",
    });
  }

  if (loc.imageRef !== undefined && typeof loc.imageRef !== "string") {
    errors.push({
      path: `${path}.imageRef`,
      message: "Location imageRef must be a string",
      code: "INVALID_LOCATION_IMAGE_REF",
    });
  }

  if (loc.sliceIndex !== undefined) {
    if (typeof loc.sliceIndex !== "number" || !Number.isInteger(loc.sliceIndex)) {
      errors.push({
        path: `${path}.sliceIndex`,
        message: "Location sliceIndex must be an integer",
        code: "INVALID_LOCATION_SLICE_INDEX",
      });
    } else if (loc.sliceIndex < 0) {
      errors.push({
        path: `${path}.sliceIndex`,
        message: "Location sliceIndex must be non-negative",
        code: "SLICE_INDEX_NEGATIVE",
      });
    }
  }

  if (loc.coordinates !== undefined) {
    if (!Array.isArray(loc.coordinates) || loc.coordinates.length !== 3) {
      errors.push({
        path: `${path}.coordinates`,
        message: "Location coordinates must be an array of 3 numbers",
        code: "INVALID_LOCATION_COORDINATES",
      });
    } else {
      for (let i = 0; i < 3; i++) {
        if (typeof loc.coordinates[i] !== "number") {
          errors.push({
            path: `${path}.coordinates[${i}]`,
            message: "Coordinate must be a number",
            code: "INVALID_COORDINATE",
          });
        }
      }
    }
  }
}

/**
 * Validate an extracted entity.
 */
function validateEntity(
  entity: unknown,
  path: string,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (typeof entity !== "object" || entity === null) {
    errors.push({
      path,
      message: "Entity must be an object",
      code: "INVALID_ENTITY",
    });
    return;
  }

  const e = entity as Record<string, unknown>;

  // Required: type
  if (typeof e.type !== "string") {
    errors.push({
      path: `${path}.type`,
      message: "Entity type must be a string",
      code: "INVALID_ENTITY_TYPE",
    });
  }

  // Required: text
  if (typeof e.text !== "string") {
    errors.push({
      path: `${path}.text`,
      message: "Entity text must be a string",
      code: "INVALID_ENTITY_TEXT",
    });
  }

  // Required: evidence array
  if (!Array.isArray(e.evidence)) {
    errors.push({
      path: `${path}.evidence`,
      message: "Entity must have an evidence array",
      code: "MISSING_EVIDENCE",
    });
  } else {
    for (let i = 0; i < e.evidence.length; i++) {
      validateEvidenceRef(e.evidence[i], `${path}.evidence[${i}]`, errors);
    }
  }

  // Optional: value (must be number if present)
  if (e.value !== undefined && typeof e.value !== "number") {
    errors.push({
      path: `${path}.value`,
      message: "Entity value must be a number",
      code: "INVALID_ENTITY_VALUE",
    });
  }

  // Optional: unit (must be string if present)
  if (e.unit !== undefined && typeof e.unit !== "string") {
    errors.push({
      path: `${path}.unit`,
      message: "Entity unit must be a string",
      code: "INVALID_ENTITY_UNIT",
    });
  }

  // Warning: unit without value
  if (e.unit !== undefined && e.value === undefined) {
    warnings.push({
      path,
      message: "Entity has unit but no value",
      code: "UNIT_WITHOUT_VALUE",
    });
  }
}

/**
 * Validate uncertainty object.
 */
function validateUncertainty(
  uncertainty: unknown,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (typeof uncertainty !== "object" || uncertainty === null) {
    errors.push({
      path: "uncertainty",
      message: "Uncertainty must be an object",
      code: "INVALID_UNCERTAINTY",
    });
    return;
  }

  const u = uncertainty as Record<string, unknown>;

  // Required: level
  if (typeof u.level !== "string") {
    errors.push({
      path: "uncertainty.level",
      message: "Uncertainty level must be a string",
      code: "INVALID_UNCERTAINTY_LEVEL",
    });
  } else if (!VALID_UNCERTAINTY_LEVELS.includes(u.level as typeof VALID_UNCERTAINTY_LEVELS[number])) {
    errors.push({
      path: "uncertainty.level",
      message: `Uncertainty level must be one of: ${VALID_UNCERTAINTY_LEVELS.join(", ")}`,
      code: "INVALID_UNCERTAINTY_LEVEL_VALUE",
    });
  }

  // Required: reasons array
  if (!Array.isArray(u.reasons)) {
    errors.push({
      path: "uncertainty.reasons",
      message: "Uncertainty reasons must be an array",
      code: "INVALID_UNCERTAINTY_REASONS",
    });
  } else {
    for (let i = 0; i < u.reasons.length; i++) {
      if (typeof u.reasons[i] !== "string") {
        errors.push({
          path: `uncertainty.reasons[${i}]`,
          message: "Uncertainty reason must be a string",
          code: "INVALID_UNCERTAINTY_REASON",
        });
      }
    }

    if (u.reasons.length === 0) {
      warnings.push({
        path: "uncertainty.reasons",
        message: "Uncertainty has no reasons specified",
        code: "EMPTY_UNCERTAINTY_REASONS",
      });
    }
  }
}

/**
 * Validate safety object.
 */
function validateSafety(
  safety: unknown,
  errors: ValidationError[]
): void {
  if (typeof safety !== "object" || safety === null) {
    errors.push({
      path: "safety",
      message: "Safety must be an object",
      code: "INVALID_SAFETY",
    });
    return;
  }

  const s = safety as Record<string, unknown>;

  // Required: notMedicalAdvice must be true
  if (s.notMedicalAdvice !== true) {
    errors.push({
      path: "safety.notMedicalAdvice",
      message: "Safety notMedicalAdvice must be true",
      code: "INVALID_SAFETY_NOT_MEDICAL_ADVICE",
    });
  }

  // Required: requiresClinicianReview must be true
  if (s.requiresClinicianReview !== true) {
    errors.push({
      path: "safety.requiresClinicianReview",
      message: "Safety requiresClinicianReview must be true",
      code: "INVALID_SAFETY_REQUIRES_REVIEW",
    });
  }
}

/**
 * Sanitize output to fix common issues.
 * Returns a valid MedAtlasOutput or throws if not fixable.
 */
export function sanitizeOutput(output: unknown): MedAtlasOutput {
  if (typeof output !== "object" || output === null) {
    throw new Error("Cannot sanitize: output is not an object");
  }

  const obj = output as Record<string, unknown>;

  // Ensure required fields with defaults
  const sanitized: MedAtlasOutput = {
    caseId: typeof obj.caseId === "string" ? obj.caseId : "unknown",
    modalities: Array.isArray(obj.modalities)
      ? obj.modalities.filter((m): m is string => typeof m === "string")
      : [],
    summary: typeof obj.summary === "string" ? obj.summary : "No summary available",
    findings: [],
    extractedEntities: [],
    recommendations: [],
    uncertainty: {
      level: "high",
      reasons: ["Output required sanitization"],
    },
    safety: {
      notMedicalAdvice: true,
      requiresClinicianReview: true,
    },
  };

  // Sanitize findings
  if (Array.isArray(obj.findings)) {
    for (const finding of obj.findings) {
      const sanitizedFinding = sanitizeFinding(finding);
      if (sanitizedFinding) {
        sanitized.findings.push(sanitizedFinding);
      }
    }
  }

  // Sanitize entities
  if (Array.isArray(obj.extractedEntities)) {
    for (const entity of obj.extractedEntities) {
      const sanitizedEntity = sanitizeEntity(entity);
      if (sanitizedEntity) {
        sanitized.extractedEntities.push(sanitizedEntity);
      }
    }
  }

  // Sanitize recommendations
  if (Array.isArray(obj.recommendations)) {
    sanitized.recommendations = obj.recommendations.filter(
      (r): r is string => typeof r === "string"
    );
  }

  // Sanitize uncertainty
  if (typeof obj.uncertainty === "object" && obj.uncertainty !== null) {
    const u = obj.uncertainty as Record<string, unknown>;
    if (VALID_UNCERTAINTY_LEVELS.includes(u.level as typeof VALID_UNCERTAINTY_LEVELS[number])) {
      sanitized.uncertainty.level = u.level as "low" | "medium" | "high";
    }
    if (Array.isArray(u.reasons)) {
      sanitized.uncertainty.reasons = u.reasons.filter(
        (r): r is string => typeof r === "string"
      );
    }
  }

  return sanitized;
}

/**
 * Sanitize a finding.
 */
function sanitizeFinding(finding: unknown): Finding | null {
  if (typeof finding !== "object" || finding === null) return null;

  const f = finding as Record<string, unknown>;

  if (typeof f.label !== "string") return null;

  const sanitized: Finding = {
    label: f.label,
    evidence: [],
  };

  // Sanitize probability
  if (typeof f.probability === "number" && f.probability >= 0 && f.probability <= 1) {
    sanitized.probability = f.probability;
  }

  // Sanitize evidence
  if (Array.isArray(f.evidence)) {
    for (const e of f.evidence) {
      const sanitizedEvidence = sanitizeEvidenceRef(e);
      if (sanitizedEvidence) {
        sanitized.evidence.push(sanitizedEvidence);
      }
    }
  }

  // Add default evidence if none
  if (sanitized.evidence.length === 0) {
    sanitized.evidence.push({ source: "synthetic", id: "sanitized" });
  }

  // Sanitize location if present
  if (typeof f.location === "object" && f.location !== null) {
    const loc = f.location as Record<string, unknown>;
    sanitized.location = {};
    if (typeof loc.anatomy === "string") sanitized.location.anatomy = loc.anatomy;
    if (typeof loc.imageRef === "string") sanitized.location.imageRef = loc.imageRef;
    if (typeof loc.sliceIndex === "number") sanitized.location.sliceIndex = loc.sliceIndex;
    if (Array.isArray(loc.coordinates) && loc.coordinates.length === 3) {
      const coords = loc.coordinates.map((c) => typeof c === "number" ? c : 0);
      sanitized.location.coordinates = coords as [number, number, number];
    }
  }

  return sanitized;
}

/**
 * Sanitize an evidence reference.
 */
function sanitizeEvidenceRef(evidence: unknown): EvidenceRef | null {
  if (typeof evidence !== "object" || evidence === null) return null;

  const e = evidence as Record<string, unknown>;

  if (typeof e.id !== "string") return null;

  const source = VALID_SOURCES.includes(e.source as EvidenceRef["source"])
    ? (e.source as EvidenceRef["source"])
    : "synthetic";

  const sanitized: EvidenceRef = {
    source,
    id: e.id,
  };

  if (typeof e.uri === "string") sanitized.uri = e.uri;
  if (typeof e.capturedAt === "string") sanitized.capturedAt = e.capturedAt;

  return sanitized;
}

/**
 * Sanitize an entity.
 */
function sanitizeEntity(entity: unknown): MedAtlasOutput["extractedEntities"][number] | null {
  if (typeof entity !== "object" || entity === null) return null;

  const e = entity as Record<string, unknown>;

  if (typeof e.type !== "string" || typeof e.text !== "string") return null;

  const sanitized: MedAtlasOutput["extractedEntities"][number] = {
    type: e.type,
    text: e.text,
    evidence: [],
  };

  // Sanitize evidence
  if (Array.isArray(e.evidence)) {
    for (const ev of e.evidence) {
      const sanitizedEvidence = sanitizeEvidenceRef(ev);
      if (sanitizedEvidence) {
        sanitized.evidence.push(sanitizedEvidence);
      }
    }
  }

  // Add default evidence if none
  if (sanitized.evidence.length === 0) {
    sanitized.evidence.push({ source: "synthetic", id: "sanitized" });
  }

  // Optional fields
  if (typeof e.value === "number") sanitized.value = e.value;
  if (typeof e.unit === "string") sanitized.unit = e.unit;

  return sanitized;
}
