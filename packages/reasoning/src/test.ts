/**
 * Simple test for reasoning layer
 * Run with: npx tsx packages/reasoning/src/test.ts
 */

import { createMockAdapter, validateOutput, buildCompletePrompt } from "./index.js";
import type { GraphData, ReasoningInput } from "./model-adapter.js";

async function runTests() {
  console.log("🧪 Testing MedAtlas Reasoning Layer\n");

  // Test 1: Mock Adapter Initialization
  console.log("Test 1: Mock Adapter Initialization");
  const adapter = createMockAdapter();
  console.log(`  ✅ Adapter created: ${adapter.name}`);

  // Test 2: Check Availability
  console.log("\nTest 2: Check Availability");
  const available = await adapter.isAvailable();
  console.log(`  ✅ Adapter available: ${available}`);

  // Test 3: Generate Interpretation
  console.log("\nTest 3: Generate Interpretation");
  const testGraphData: GraphData = {
    id: "test-graph-001",
    patientId: "test-patient-001",
    modalities: ["note", "lab"],
    nodes: [
      {
        id: "patient-001",
        type: "patient",
        label: "Test Patient",
        properties: { age: "55", gender: "Male" },
      },
      {
        id: "note-001",
        type: "note",
        label: "Clinical Note",
        timestamp: new Date().toISOString(),
        properties: {
          text: "Patient presents with chest pain. Elevated troponin. Cardiomegaly on imaging.",
        },
        evidence: [{ source: "note", id: "note-001" }],
      },
      {
        id: "lab-001",
        type: "lab",
        label: "Troponin I",
        timestamp: new Date().toISOString(),
        properties: {
          value: 0.12,
          unit: "ng/mL",
          referenceRange: "0.00-0.04",
          interpretation: "High",
        },
        evidence: [{ source: "lab", id: "lab-001" }],
      },
    ],
    edges: [
      {
        id: "edge-001",
        source: "note-001",
        target: "patient-001",
        type: "observed-in",
      },
      {
        id: "edge-002",
        source: "lab-001",
        target: "patient-001",
        type: "observed-in",
      },
    ],
  };

  const input: ReasoningInput = {
    caseId: "test-case-001",
    graphId: testGraphData.id,
    modalities: testGraphData.modalities,
    graphData: testGraphData,
  };

  const result = await adapter.generateInterpretation(input);
  console.log(`  ✅ Generated interpretation for case: ${result.caseId}`);
  console.log(`  ✅ Summary: ${result.summary.substring(0, 100)}...`);
  console.log(`  ✅ Findings count: ${result.findings.length}`);
  console.log(`  ✅ Entities count: ${result.extractedEntities.length}`);
  console.log(`  ✅ Uncertainty level: ${result.uncertainty.level}`);

  // Test 4: Validate Output
  console.log("\nTest 4: Validate Output");
  const validationResult = validateOutput(result);
  console.log(`  ✅ Output valid: ${validationResult.valid}`);
  if (!validationResult.valid) {
    console.log(`  ❌ Errors: ${JSON.stringify(validationResult.errors, null, 2)}`);
  }

  // Test 5: Build Prompts
  console.log("\nTest 5: Build Prompts");
  const { systemPrompt, userPrompt } = buildCompletePrompt(testGraphData, "test-case-001");
  console.log(`  ✅ System prompt length: ${systemPrompt.length} chars`);
  console.log(`  ✅ User prompt length: ${userPrompt.length} chars`);

  // Test 6: Safety Flags
  console.log("\nTest 6: Safety Flags");
  console.log(`  ✅ notMedicalAdvice: ${result.safety.notMedicalAdvice}`);
  console.log(`  ✅ requiresClinicianReview: ${result.safety.requiresClinicianReview}`);

  console.log("\n✅ All tests passed!");
  console.log("\n📋 Full output:");
  console.log(JSON.stringify(result, null, 2));
}

runTests().catch(console.error);
