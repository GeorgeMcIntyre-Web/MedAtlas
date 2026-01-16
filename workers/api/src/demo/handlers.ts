import { MockModelAdapter } from "@medatlas/reasoning";
import { SyntheticAdapter } from "@medatlas/ingestion";
import { DEMO_CASES } from "./demo-cases";

const mockAdapter = new MockModelAdapter();
const syntheticAdapter = new SyntheticAdapter();

const json = (value: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(value, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {})
    }
  });

export async function handleGetDemoCase(caseId: string): Promise<Response> {
  const demoCase = DEMO_CASES[caseId] ?? DEMO_CASES["cardiac-001"];

  const graphData = syntheticAdapter.transform(demoCase, demoCase.caseId);

  const interpretation = await mockAdapter.generateInterpretation({
    caseId: demoCase.caseId,
    graphId: graphData.id,
    modalities: ["synthetic", "lab", "imaging"],
    graphData
  });

  return json({
    case: demoCase,
    graph: graphData,
    interpretation
  });
}

export async function handleGetDefaultDemoCase(): Promise<Response> {
  return handleGetDemoCase("cardiac-001");
}

export async function handleListDemoCases(): Promise<Response> {
  return json({
    cases: Object.entries(DEMO_CASES).map(([id, demoCase]) => ({
      id,
      description: `${demoCase.patient.demographics.age}yo ${demoCase.patient.demographics.gender}`,
      encounterCount: demoCase.encounters.length
    }))
  });
}

export async function handleGenerateDemoCase(): Promise<Response> {
  const base = DEMO_CASES["cardiac-001"];
  const newId = `demo-${crypto.randomUUID()}`;
  const patientId = `patient-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const generated = {
    ...base,
    caseId: newId,
    patient: {
      ...base.patient,
      id: patientId,
      demographics: {
        ...base.patient.demographics,
        mrn: `MRN-${Math.floor(Math.random() * 90000) + 10000}`
      }
    },
    encounters: base.encounters.map(enc => ({
      ...enc,
      id: `enc-${crypto.randomUUID()}`,
      timestamp: now
    }))
  };

  const graphData = syntheticAdapter.transform(generated, generated.caseId);

  return json({
    case: generated,
    graph: graphData
  }, { status: 201 });
}
