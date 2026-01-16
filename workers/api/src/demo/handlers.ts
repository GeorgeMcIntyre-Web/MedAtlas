/**
 * Demo API Handlers
 * 
 * Request handlers for demo-related endpoints.
 * Provides pre-built demo cases for the MedAtlas UI.
 */

import type { MedAtlasOutput } from "@medatlas/schemas/types";
import type { 
  DemoCaseInfo, 
  DemoCasesResponse, 
  DemoCaseResponse,
  GenerateDemoRequest,
  GenerateDemoResponse
} from "./types.js";

/**
 * Pre-built demo cases
 */
const DEMO_CASES: Record<string, { info: DemoCaseInfo; output: MedAtlasOutput }> = {
  "demo-001": {
    info: {
      caseId: "demo-001",
      title: "Pulmonary Nodule Workup",
      description: "65-year-old patient with incidental pulmonary nodule on CT chest and elevated inflammatory markers.",
      modalities: ["synthetic", "note", "lab", "imaging"],
      createdAt: "2025-01-15T00:00:00Z"
    },
    output: {
      caseId: "demo-001",
      modalities: ["synthetic", "note", "lab", "imaging"],
      summary: "65-year-old patient with incidental right lower lobe pulmonary nodule discovered on CT chest. Laboratory findings show elevated inflammatory markers (CRP 45.2 mg/L). The nodule measures 1.2cm and requires follow-up imaging for characterization. Current on antibiotic therapy for chronic cough.",
      findings: [
        {
          label: "Right lower lobe pulmonary nodule",
          probability: 0.85,
          location: {
            anatomy: "Right lower lobe",
            imageRef: "ct-chest-001"
          },
          evidence: [
            { source: "dicom", id: "ct-series-001" },
            { source: "note", id: "radiology-report-001" }
          ]
        },
        {
          label: "Elevated inflammatory markers",
          probability: 0.92,
          evidence: [
            { source: "lab", id: "lab-crp-001" }
          ]
        }
      ],
      extractedEntities: [
        {
          type: "condition",
          text: "Pulmonary nodule",
          evidence: [{ source: "note", id: "clinical-note-001" }]
        },
        {
          type: "symptom",
          text: "Chronic cough",
          evidence: [{ source: "note", id: "clinical-note-001" }]
        },
        {
          type: "lab",
          text: "C-reactive protein",
          value: 45.2,
          unit: "mg/L",
          evidence: [{ source: "lab", id: "lab-crp-001" }]
        },
        {
          type: "medication",
          text: "Amoxicillin 500mg",
          evidence: [{ source: "fhir", id: "medication-001" }]
        }
      ],
      recommendations: [
        "Follow-up CT scan recommended in 3-6 months to assess nodule stability per Fleischner criteria.",
        "Review inflammatory markers trend after completion of antibiotic course.",
        "Consider pulmonology referral if nodule shows interval growth.",
        "Clinician review required for treatment decisions."
      ],
      uncertainty: {
        level: "medium",
        reasons: [
          "Synthetic demo data",
          "Nodule characteristics require interval imaging for malignancy risk stratification"
        ]
      },
      safety: {
        notMedicalAdvice: true,
        requiresClinicianReview: true
      }
    }
  },
  "demo-002": {
    info: {
      caseId: "demo-002",
      title: "Cardiac Chest Pain Evaluation",
      description: "58-year-old patient presenting with chest pain, elevated troponin, and ECG changes.",
      modalities: ["synthetic", "note", "lab", "device"],
      createdAt: "2025-01-16T00:00:00Z"
    },
    output: {
      caseId: "demo-002",
      modalities: ["synthetic", "note", "lab", "device"],
      summary: "58-year-old patient with acute chest pain and elevated high-sensitivity troponin (245 ng/L). ECG shows ST-segment changes in leads V1-V4 suggestive of anterior ischemia. Clinical presentation consistent with acute coronary syndrome requiring urgent evaluation.",
      findings: [
        {
          label: "Elevated high-sensitivity troponin",
          probability: 0.95,
          evidence: [
            { source: "lab", id: "lab-troponin-001" }
          ]
        },
        {
          label: "ST-segment changes on ECG",
          probability: 0.88,
          evidence: [
            { source: "device", id: "ecg-001" }
          ]
        },
        {
          label: "Acute chest pain syndrome",
          probability: 0.90,
          evidence: [
            { source: "note", id: "ed-note-001" }
          ]
        }
      ],
      extractedEntities: [
        {
          type: "symptom",
          text: "Chest pain",
          evidence: [{ source: "note", id: "ed-note-001" }]
        },
        {
          type: "lab",
          text: "High-sensitivity troponin",
          value: 245,
          unit: "ng/L",
          evidence: [{ source: "lab", id: "lab-troponin-001" }]
        },
        {
          type: "condition",
          text: "Hypertension",
          evidence: [{ source: "fhir", id: "condition-htn-001" }]
        },
        {
          type: "medication",
          text: "Aspirin 81mg",
          evidence: [{ source: "fhir", id: "medication-asa-001" }]
        }
      ],
      recommendations: [
        "Urgent cardiology consultation recommended.",
        "Consider coronary angiography based on clinical presentation.",
        "Serial troponin measurement per institutional protocol.",
        "Continuous cardiac monitoring."
      ],
      uncertainty: {
        level: "low",
        reasons: [
          "Clear clinical presentation with objective findings"
        ]
      },
      safety: {
        notMedicalAdvice: true,
        requiresClinicianReview: true
      }
    }
  },
  "demo-003": {
    info: {
      caseId: "demo-003",
      title: "Multi-Modal Sepsis Workup",
      description: "72-year-old patient with fever, elevated lactate, and pneumonia on imaging.",
      modalities: ["synthetic", "note", "lab", "imaging"],
      createdAt: "2025-01-17T00:00:00Z"
    },
    output: {
      caseId: "demo-003",
      modalities: ["synthetic", "note", "lab", "imaging"],
      summary: "72-year-old patient meeting SIRS criteria with suspected pneumonia as source. Chest X-ray shows right lower lobe consolidation. Laboratory findings include elevated lactate (3.2 mmol/L), leukocytosis (WBC 18.5), and elevated procalcitonin (8.2 ng/mL).",
      findings: [
        {
          label: "Right lower lobe pneumonia",
          probability: 0.90,
          location: {
            anatomy: "Right lower lobe"
          },
          evidence: [
            { source: "dicom", id: "cxr-series-001" },
            { source: "note", id: "radiology-cxr-001" }
          ]
        },
        {
          label: "Sepsis with elevated lactate",
          probability: 0.88,
          evidence: [
            { source: "lab", id: "lab-lactate-001" },
            { source: "lab", id: "lab-wbc-001" }
          ]
        },
        {
          label: "Systemic inflammatory response",
          probability: 0.92,
          evidence: [
            { source: "lab", id: "lab-procalcitonin-001" }
          ]
        }
      ],
      extractedEntities: [
        {
          type: "symptom",
          text: "Fever",
          evidence: [{ source: "note", id: "nursing-note-001" }]
        },
        {
          type: "lab",
          text: "Lactate",
          value: 3.2,
          unit: "mmol/L",
          evidence: [{ source: "lab", id: "lab-lactate-001" }]
        },
        {
          type: "lab",
          text: "White blood cell count",
          value: 18.5,
          unit: "K/uL",
          evidence: [{ source: "lab", id: "lab-wbc-001" }]
        },
        {
          type: "lab",
          text: "Procalcitonin",
          value: 8.2,
          unit: "ng/mL",
          evidence: [{ source: "lab", id: "lab-procalcitonin-001" }]
        },
        {
          type: "condition",
          text: "Community-acquired pneumonia",
          evidence: [{ source: "note", id: "admission-note-001" }]
        }
      ],
      recommendations: [
        "Initiate sepsis bundle per institutional protocol.",
        "Blood cultures before antibiotics if not already obtained.",
        "Consider ICU admission for close monitoring.",
        "Serial lactate measurements to assess treatment response."
      ],
      uncertainty: {
        level: "low",
        reasons: [
          "Clear source of infection identified",
          "Multiple objective markers supporting diagnosis"
        ]
      },
      safety: {
        notMedicalAdvice: true,
        requiresClinicianReview: true
      }
    }
  }
};

/**
 * List all available demo cases
 */
export function handleListCases(): DemoCasesResponse {
  const cases = Object.values(DEMO_CASES).map(c => c.info);
  
  return {
    cases,
    totalCount: cases.length
  };
}

/**
 * Get a specific demo case
 */
export function handleGetCase(caseId: string): DemoCaseResponse | null {
  const demoCase = DEMO_CASES[caseId];
  
  if (!demoCase) {
    return null;
  }

  return {
    caseInfo: demoCase.info,
    output: demoCase.output,
    graphStats: {
      nodeCount: 7,
      edgeCount: 4
    }
  };
}

/**
 * Generate a new demo case
 */
export function handleGenerateDemo(
  request: GenerateDemoRequest
): GenerateDemoResponse {
  const scenario = request.scenario || "random";
  const caseId = `demo-generated-${Date.now()}`;
  
  // Select template based on scenario
  let template: keyof typeof DEMO_CASES;
  switch (scenario) {
    case "pulmonary":
      template = "demo-001";
      break;
    case "cardiac":
      template = "demo-002";
      break;
    case "inflammation":
      template = "demo-003";
      break;
    default:
      const templates = Object.keys(DEMO_CASES) as Array<keyof typeof DEMO_CASES>;
      template = templates[Math.floor(Math.random() * templates.length)];
  }

  const baseCase = DEMO_CASES[template];
  
  // Create a new case based on template
  const output: MedAtlasOutput = {
    ...baseCase.output,
    caseId
  };

  const caseInfo: DemoCaseInfo = {
    ...baseCase.info,
    caseId,
    createdAt: new Date().toISOString()
  };

  return {
    caseInfo,
    output,
    message: `Generated ${scenario} demo case`
  };
}

/**
 * Get default demo case (for backward compatibility)
 */
export function handleGetDefaultDemo(): MedAtlasOutput {
  return DEMO_CASES["demo-001"].output;
}
