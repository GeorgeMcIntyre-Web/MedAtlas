/**
 * Reasoning API request handlers.
 * Handles interpretation generation and validation.
 */

import { getGlobalStorage } from "@medatlas/graph";
import {
  MockModelAdapter,
  validateOutput,
  sanitizeOutput,
  type ReasoningInput,
  type ReasoningStatus,
  type MedAtlasOutput,
} from "@medatlas/reasoning";

// In-memory status store (for demo)
const reasoningStatusStore = new Map<string, ReasoningStatus>();

// Create singleton adapter
const mockAdapter = new MockModelAdapter();

/**
 * Helper to create JSON responses.
 */
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

/**
 * Helper to create error responses.
 */
function errorResponse(message: string, status = 400): Response {
  return json({ error: message }, status);
}

/**
 * POST /reasoning/interpret - Generate interpretation from graph data
 */
export async function handleInterpret(request: Request): Promise<Response> {
  try {
    const body = await request.json() as {
      caseId: string;
      graphId?: string;
      modalities?: string[];
    };

    if (!body.caseId) {
      return errorResponse("Missing required field: caseId");
    }

    const graphId = body.graphId ?? "demo-graph";
    const storage = getGlobalStorage();
    const graph = await storage.load(graphId);

    if (!graph) {
      return errorResponse(`Graph not found: ${graphId}`, 404);
    }

    // Update status
    const statusKey = `${body.caseId}-${Date.now()}`;
    reasoningStatusStore.set(body.caseId, {
      caseId: body.caseId,
      status: "processing",
      startedAt: new Date().toISOString(),
    });

    try {
      // Prepare reasoning input
      const input: ReasoningInput = {
        caseId: body.caseId,
        graphId,
        modalities: body.modalities ?? [],
        graphData: graph.serialize(),
      };

      // Generate interpretation
      const output = await mockAdapter.generateInterpretation(input);

      // Validate output
      const validation = validateOutput(output);
      if (!validation.valid) {
        // Try to sanitize
        const sanitized = sanitizeOutput(output);
        
        // Update status
        reasoningStatusStore.set(body.caseId, {
          caseId: body.caseId,
          status: "completed",
          startedAt: reasoningStatusStore.get(body.caseId)?.startedAt,
          completedAt: new Date().toISOString(),
        });

        return json({
          output: sanitized,
          validation: {
            originalValid: false,
            sanitized: true,
            errors: validation.errors,
            warnings: validation.warnings,
          },
        });
      }

      // Update status
      reasoningStatusStore.set(body.caseId, {
        caseId: body.caseId,
        status: "completed",
        startedAt: reasoningStatusStore.get(body.caseId)?.startedAt,
        completedAt: new Date().toISOString(),
      });

      return json({
        output,
        validation: {
          valid: true,
          errors: [],
          warnings: validation.warnings,
        },
      });
    } catch (error) {
      // Update status
      reasoningStatusStore.set(body.caseId, {
        caseId: body.caseId,
        status: "failed",
        startedAt: reasoningStatusStore.get(body.caseId)?.startedAt,
        completedAt: new Date().toISOString(),
        error: (error as Error).message,
      });

      throw error;
    }
  } catch (error) {
    return errorResponse(`Interpretation failed: ${(error as Error).message}`, 500);
  }
}

/**
 * GET /reasoning/status/:caseId - Get reasoning status
 */
export async function handleGetStatus(
  request: Request,
  caseId: string
): Promise<Response> {
  const status = reasoningStatusStore.get(caseId);

  if (!status) {
    return json({
      caseId,
      status: "not_found",
    }, 404);
  }

  return json(status);
}

/**
 * POST /reasoning/validate - Validate a MedAtlasOutput
 */
export async function handleValidate(request: Request): Promise<Response> {
  try {
    const body = await request.json();

    const validation = validateOutput(body);

    return json({
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
    });
  } catch (error) {
    return errorResponse(`Validation failed: ${(error as Error).message}`);
  }
}

/**
 * POST /reasoning/sanitize - Sanitize and fix a MedAtlasOutput
 */
export async function handleSanitize(request: Request): Promise<Response> {
  try {
    const body = await request.json();

    // First validate
    const validation = validateOutput(body);

    if (validation.valid) {
      return json({
        sanitized: false,
        output: body,
        message: "Output is already valid",
      });
    }

    // Try to sanitize
    const sanitized = sanitizeOutput(body);

    // Validate the sanitized output
    const sanitizedValidation = validateOutput(sanitized);

    return json({
      sanitized: true,
      output: sanitized,
      originalErrors: validation.errors,
      validation: sanitizedValidation,
    });
  } catch (error) {
    return errorResponse(`Sanitization failed: ${(error as Error).message}`);
  }
}
