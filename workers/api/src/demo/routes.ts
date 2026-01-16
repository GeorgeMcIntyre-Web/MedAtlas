import {
  handleGetDemoCase,
  handleGetDefaultDemoCase,
  handleListDemoCases,
  handleGenerateDemoCase
} from "./handlers";

export async function handleDemoRoutes(request: Request, pathname: string): Promise<Response | null> {
  const method = request.method.toUpperCase();
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] !== "demo") return null;

  if (parts.length === 2 && parts[1] === "cases" && method === "GET") {
    return handleListDemoCases();
  }

  if (parts.length === 2 && parts[1] === "case" && method === "GET") {
    return handleGetDefaultDemoCase();
  }

  if (parts.length === 3 && parts[1] === "case" && method === "GET") {
    return handleGetDemoCase(parts[2]);
  }

  if (parts.length === 2 && parts[1] === "generate" && method === "POST") {
    return handleGenerateDemoCase();
  }

  return null;
}
