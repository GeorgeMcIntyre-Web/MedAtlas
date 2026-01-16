import { MockModelAdapter } from "@medatlas/reasoning";
import { validateOutput } from "@medatlas/reasoning";
import type { ReasoningInput } from "@medatlas/reasoning";

const mockAdapter = new MockModelAdapter();

const json = (value: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(value, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {})
    }
  });

const readJson = async <T>(request: Request): Promise<T | null> => {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
};

export async function handleInterpret(request: Request): Promise<Response> {
  const body = await readJson<ReasoningInput>(request);
  if (!body) {
    return json({ error: "invalid_body" }, { status: 400 });
  }

  const output = await mockAdapter.generateInterpretation(body);
  return json(output);
}

export async function handleStatus(caseId: string): Promise<Response> {
  return json({ caseId, status: "ready", adapter: mockAdapter.name });
}

export async function handleValidate(request: Request): Promise<Response> {
  const body = await readJson<{ output?: unknown }>(request);
  if (!body || body.output === undefined) {
    return json({ error: "invalid_body" }, { status: 400 });
  }

  const result = validateOutput(body.output);
  return json(result, { status: result.valid ? 200 : 422 });
}
