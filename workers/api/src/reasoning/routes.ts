import { handleInterpret, handleStatus, handleValidate } from "./handlers";

export async function handleReasoningRoutes(request: Request, pathname: string): Promise<Response | null> {
  const method = request.method.toUpperCase();
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] !== "reasoning") return null;

  if (parts.length === 2 && parts[1] === "interpret" && method === "POST") {
    return handleInterpret(request);
  }

  if (parts.length === 3 && parts[1] === "status" && method === "GET") {
    return handleStatus(parts[2]);
  }

  if (parts.length === 2 && parts[1] === "validate" && method === "POST") {
    return handleValidate(request);
  }

  return null;
}
