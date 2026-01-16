/**
 * Output Validator
 * 
 * Validates MedAtlasOutput against the schema and provides sanitization
 * to fix common issues.
 */

import type { MedAtlasOutput, Finding, EvidenceRef } from "@medatlas/schemas/types";

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Validation error detail
 */
export interface ValidationError {
  path: string;
  message: string;
  value?: unknown;
}

/**
 * Valid evidence sources
 */
const VALID_SOURCES: EvidenceRef["source"][] = [
  "fhir", "dicom", "note", "lab", "device", "claims", "synthetic"
];

/**
 * Valid uncertainty levels
 */
const VALID_UNCERTAINTY_LEVELS: MedAtlasOutput["uncertainty"]["level"][] = [
  "low", "medium", "high"
];

/**
 * Validate a MedAtlasOutput object
 * @param output - Output to validate
 * @returns Validation result
 */
export function validateMedAtlasOutput(output: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Check if output is an object
  if (!output || typeof output !== "object") {
    errors.push({ path: "", message: "Output must be an object" });
    return { valid: false, errors, warnings };
  }

  const obj = output as Record<string, unknown>;

  // Required fields
  validateRequired(obj, "caseId", "string", errors);
  validateRequired(obj, "modalities", "array", errors);
  validateRequired(obj, "summary", "string", errors);
  validateRequired(obj, "findings", "array", errors);
  validateRequired(obj, "extractedEntities", "array", errors);
  validateRequired(obj, "recommendations", "array", errors);
  validateRequired(obj, "uncertainty", "object", errors);
  validateRequired(obj, "safety", "object", errors);

  // Validate modalities array
  if (Array.isArray(obj.modalities)) {
    for (let i = 0; i < obj.modalities.length; i++) {
      if (typeof obj.modalities[i] !== "string") {
        errors.push({
          path: `modalities[${i}]`,
          message: "Modality must be a string",
          value: obj.modalities[i]
        });
      }
    }
  }

  // Validate findings
  if (Array.isArray(obj.findings)) {
    for (let i = 0; i < obj.findings.length; i++) {
      validateFinding(obj.findings[i] as Record<string, unknown>, `findings[${i}]`, errors);
    }
  }

  // Validate extracted entities
  if (Array.isArray(obj.extractedEntities)) {
    for (let i = 0; i < obj.extractedEntities.length; i++) {
      validateEntity(
        obj.extractedEntities[i] as Record<string, unknown>, 
        `extractedEntities[${i}]`, 
        errors
      );
    }
  }

  // Validate recommendations
  if (Array.isArray(obj.recommendations)) {
    for (let i = 0; i < obj.recommendations.length; i++) {
      if (typeof obj.recommendations[i] !== "string") {
        errors.push({
          path: `recommendations[${i}]`,
          message: "Recommendation must be a string",
          value: obj.recommendations[i]
        });
      }
    }
  }

  // Validate uncertainty
  if (typeof obj.uncertainty === "object" && obj.uncertainty !== null) {
    const uncertainty = obj.uncertainty as Record<string, unknown>;
    validateRequired(uncertainty, "level", "string", errors, "uncertainty.");
    validateRequired(uncertainty, "reasons", "array", errors, "uncertainty.");
    
    if (uncertainty.level && !VALID_UNCERTAINTY_LEVELS.includes(uncertainty.level as MedAtlasOutput["uncertainty"]["level"])) {
      errors.push({
        path: "uncertainty.level",
        message: `Invalid uncertainty level. Must be one of: ${VALID_UNCERTAINTY_LEVELS.join(", ")}`,
        value: uncertainty.level
      });
    }
  }

  // Validate safety
  if (typeof obj.safety === "object" && obj.safety !== null) {
    const safety = obj.safety as Record<string, unknown>;
    
    if (safety.notMedicalAdvice !== true) {
      errors.push({
        path: "safety.notMedicalAdvice",
        message: "safety.notMedicalAdvice must be true"
      });
    }
    
    if (safety.requiresClinicianReview !== true) {
      errors.push({
        path: "safety.requiresClinicianReview",
        message: "safety.requiresClinicianReview must be true"
      });
    }
  }

  // Add warnings for potential issues
  if (Array.isArray(obj.findings) && obj.findings.length === 0) {
    warnings.push("No findings present in output");
  }

  if (typeof obj.summary === "string" && obj.summary.length < 20) {
    warnings.push("Summary is very short");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate a required field
 */
function validateRequired(
  obj: Record<string, unknown>,
  field: string,
  expectedType: "string" | "array" | "object" | "number" | "boolean",
  errors: ValidationError[],
  pathPrefix: string = ""
): void {
  if (!(field in obj)) {
    errors.push({
      path: `${pathPrefix}${field}`,
      message: `Missing required field: ${field}`
    });
    return;
  }

  const value = obj[field];
  
  if (expectedType === "array" && !Array.isArray(value)) {
    errors.push({
      path: `${pathPrefix}${field}`,
      message: `${field} must be an array`,
      value
    });
  } else if (expectedType === "object" && (typeof value !== "object" || value === null || Array.isArray(value))) {
    errors.push({
      path: `${pathPrefix}${field}`,
      message: `${field} must be an object`,
      value
    });
  } else if (expectedType !== "array" && expectedType !== "object" && typeof value !== expectedType) {
    errors.push({
      path: `${pathPrefix}${field}`,
      message: `${field} must be a ${expectedType}`,
      value
    });
  }
}

/**
 * Validate a finding object
 */
function validateFinding(
  finding: Record<string, unknown>,
  path: string,
  errors: ValidationError[]
): void {
  if (typeof finding !== "object" || finding === null) {
    errors.push({ path, message: "Finding must be an object" });
    return;
  }

  validateRequired(finding, "label", "string", errors, `${path}.`);
  validateRequired(finding, "evidence", "array", errors, `${path}.`);

  // Validate probability if present
  if ("probability" in finding && finding.probability !== undefined) {
    if (typeof finding.probability !== "number") {
      errors.push({
        path: `${path}.probability`,
        message: "Probability must be a number",
        value: finding.probability
      });
    } else if (finding.probability < 0 || finding.probability > 1) {
      errors.push({
        path: `${path}.probability`,
        message: "Probability must be between 0 and 1",
        value: finding.probability
      });
    }
  }

  // Validate evidence array
  if (Array.isArray(finding.evidence)) {
    for (let i = 0; i < finding.evidence.length; i++) {
      validateEvidenceRef(
        finding.evidence[i] as Record<string, unknown>,
        `${path}.evidence[${i}]`,
        errors
      );
    }
  }

  // Validate location if present
  if ("location" in finding && finding.location !== undefined) {
    validateLocation(
      finding.location as Record<string, unknown>,
      `${path}.location`,
      errors
    );
  }
}

/**
 * Validate an entity object
 */
function validateEntity(
  entity: Record<string, unknown>,
  path: string,
  errors: ValidationError[]
): void {
  if (typeof entity !== "object" || entity === null) {
    errors.push({ path, message: "Entity must be an object" });
    return;
  }

  validateRequired(entity, "type", "string", errors, `${path}.`);
  validateRequired(entity, "text", "string", errors, `${path}.`);
  validateRequired(entity, "evidence", "array", errors, `${path}.`);

  // Validate evidence array
  if (Array.isArray(entity.evidence)) {
    for (let i = 0; i < entity.evidence.length; i++) {
      validateEvidenceRef(
        entity.evidence[i] as Record<string, unknown>,
        `${path}.evidence[${i}]`,
        errors
      );
    }
  }
}

/**
 * Validate an evidence reference
 */
function validateEvidenceRef(
  evidence: Record<string, unknown>,
  path: string,
  errors: ValidationError[]
): void {
  if (typeof evidence !== "object" || evidence === null) {
    errors.push({ path, message: "EvidenceRef must be an object" });
    return;
  }

  validateRequired(evidence, "source", "string", errors, `${path}.`);
  validateRequired(evidence, "id", "string", errors, `${path}.`);

  if (evidence.source && !VALID_SOURCES.includes(evidence.source as EvidenceRef["source"])) {
    errors.push({
      path: `${path}.source`,
      message: `Invalid source. Must be one of: ${VALID_SOURCES.join(", ")}`,
      value: evidence.source
    });
  }
}

/**
 * Validate a location object
 */
function validateLocation(
  location: Record<string, unknown>,
  path: string,
  errors: ValidationError[]
): void {
  if (typeof location !== "object" || location === null) {
    errors.push({ path, message: "Location must be an object" });
    return;
  }

  // Optional fields - just validate types if present
  if ("anatomy" in location && typeof location.anatomy !== "string") {
    errors.push({
      path: `${path}.anatomy`,
      message: "anatomy must be a string",
      value: location.anatomy
    });
  }

  if ("sliceIndex" in location && typeof location.sliceIndex !== "number") {
    errors.push({
      path: `${path}.sliceIndex`,
      message: "sliceIndex must be a number",
      value: location.sliceIndex
    });
  }

  if ("coordinates" in location) {
    const coords = location.coordinates;
    if (!Array.isArray(coords) || coords.length !== 3 || !coords.every(c => typeof c === "number")) {
      errors.push({
        path: `${path}.coordinates`,
        message: "coordinates must be an array of 3 numbers",
        value: coords
      });
    }
  }
}

/**
 * Sanitize an output to fix common issues
 * @param output - Output to sanitize
 * @returns Sanitized output
 */
export function sanitizeOutput(output: unknown): MedAtlasOutput {
  if (!output || typeof output !== "object") {
    throw new Error("Cannot sanitize non-object output");
  }

  const obj = output as Record<string, unknown>;

  // Ensure required fields
  const sanitized: MedAtlasOutput = {
    caseId: (obj.caseId as string) || "unknown",
    modalities: Array.isArray(obj.modalities) ? obj.modalities.filter(m => typeof m === "string") : [],
    summary: typeof obj.summary === "string" ? obj.summary : "No summary available.",
    findings: [],
    extractedEntities: [],
    recommendations: [],
    uncertainty: {
      level: "high",
      reasons: ["Output was sanitized due to validation errors"]
    },
    safety: {
      notMedicalAdvice: true,
      requiresClinicianReview: true
    }
  };

  // Sanitize findings
  if (Array.isArray(obj.findings)) {
    sanitized.findings = obj.findings
      .filter((f): f is Record<string, unknown> => typeof f === "object" && f !== null)
      .map(f => sanitizeFinding(f));
  }

  // Sanitize entities
  if (Array.isArray(obj.extractedEntities)) {
    sanitized.extractedEntities = obj.extractedEntities
      .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
      .map(e => sanitizeEntity(e));
  }

  // Sanitize recommendations
  if (Array.isArray(obj.recommendations)) {
    sanitized.recommendations = obj.recommendations
      .filter((r): r is string => typeof r === "string");
  }

  // Sanitize uncertainty
  if (typeof obj.uncertainty === "object" && obj.uncertainty !== null) {
    const u = obj.uncertainty as Record<string, unknown>;
    if (VALID_UNCERTAINTY_LEVELS.includes(u.level as MedAtlasOutput["uncertainty"]["level"])) {
      sanitized.uncertainty.level = u.level as MedAtlasOutput["uncertainty"]["level"];
    }
    if (Array.isArray(u.reasons)) {
      sanitized.uncertainty.reasons = u.reasons.filter(r => typeof r === "string");
    }
  }

  return sanitized;
}

/**
 * Sanitize a finding object
 */
function sanitizeFinding(finding: Record<string, unknown>): Finding {
  const result: Finding = {
    label: typeof finding.label === "string" ? finding.label : "Unknown finding",
    evidence: []
  };

  if (typeof finding.probability === "number" && finding.probability >= 0 && finding.probability <= 1) {
    result.probability = finding.probability;
  }

  if (Array.isArray(finding.evidence)) {
    result.evidence = finding.evidence
      .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
      .map(e => sanitizeEvidence(e));
  }

  if (typeof finding.location === "object" && finding.location !== null) {
    const loc = finding.location as Record<string, unknown>;
    result.location = {};
    if (typeof loc.anatomy === "string") result.location.anatomy = loc.anatomy;
    if (typeof loc.imageRef === "string") result.location.imageRef = loc.imageRef;
    if (typeof loc.sliceIndex === "number") result.location.sliceIndex = loc.sliceIndex;
    if (Array.isArray(loc.coordinates) && loc.coordinates.length === 3) {
      result.location.coordinates = loc.coordinates as [number, number, number];
    }
  }

  return result;
}

/**
 * Sanitize an entity object
 */
function sanitizeEntity(
  entity: Record<string, unknown>
): MedAtlasOutput["extractedEntities"][0] {
  const result: MedAtlasOutput["extractedEntities"][0] = {
    type: typeof entity.type === "string" ? entity.type : "unknown",
    text: typeof entity.text === "string" ? entity.text : "Unknown entity",
    evidence: []
  };

  if (typeof entity.value === "number") {
    result.value = entity.value;
  }

  if (typeof entity.unit === "string") {
    result.unit = entity.unit;
  }

  if (Array.isArray(entity.evidence)) {
    result.evidence = entity.evidence
      .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
      .map(e => sanitizeEvidence(e));
  }

  return result;
}

/**
 * Sanitize an evidence reference
 */
function sanitizeEvidence(evidence: Record<string, unknown>): EvidenceRef {
  const source = VALID_SOURCES.includes(evidence.source as EvidenceRef["source"])
    ? (evidence.source as EvidenceRef["source"])
    : "synthetic";

  const result: EvidenceRef = {
    source,
    id: typeof evidence.id === "string" ? evidence.id : "unknown"
  };

  if (typeof evidence.uri === "string") {
    result.uri = evidence.uri;
  }

  if (typeof evidence.capturedAt === "string") {
    result.capturedAt = evidence.capturedAt;
  }

  return result;
}
