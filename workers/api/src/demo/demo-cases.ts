import type { SyntheticCase } from "@medatlas/ingestion";

export const DEMO_CASES: Record<string, SyntheticCase> = {
  "cardiac-001": {
    caseId: "cardiac-001",
    patient: { id: "patient-001", demographics: { age: 55, gender: "male", mrn: "MRN-12345" } },
    encounters: [{
      id: "enc-001",
      type: "ED",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      reason: "Chest pain",
      labs: [
        { id: "lab-001", name: "Troponin I", value: 0.15, unit: "ng/mL", referenceRange: { low: 0, high: 0.04 }, isAbnormal: true },
        { id: "lab-002", name: "BNP", value: 450, unit: "pg/mL", referenceRange: { low: 0, high: 100 }, isAbnormal: true }
      ],
      studies: [{
        id: "study-001", modality: "CT", bodyPart: "Chest",
        findings: [{ id: "finding-001", description: "Coronary calcification", severity: "moderate", confidence: 0.85, anatomy: "LAD" }]
      }],
      notes: [{ id: "note-001", type: "admission", text: "55M presents with substernal chest pain radiating to left arm..." }],
      medications: [{ id: "med-001", name: "Aspirin 325mg", status: "active" }],
      conditions: [{ id: "cond-001", name: "Acute Coronary Syndrome", status: "active", severity: "moderate" }]
    }]
  },
  "pulmonary-001": {
    caseId: "pulmonary-001",
    patient: { id: "patient-002", demographics: { age: 62, gender: "female", mrn: "MRN-67890" } },
    encounters: [{
      id: "enc-002",
      type: "outpatient",
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      reason: "Chronic cough",
      labs: [{ id: "lab-003", name: "CRP", value: 45, unit: "mg/L", referenceRange: { low: 0, high: 10 }, isAbnormal: true }],
      studies: [{
        id: "study-002", modality: "CT", bodyPart: "Chest",
        findings: [{ id: "finding-002", description: "8mm pulmonary nodule", severity: "mild", confidence: 0.72, anatomy: "RUL" }]
      }],
      notes: [{ id: "note-002", type: "progress", text: "Follow-up for incidental pulmonary nodule..." }],
      medications: [],
      conditions: [{ id: "cond-002", name: "Pulmonary Nodule", status: "active" }]
    }]
  }
};
