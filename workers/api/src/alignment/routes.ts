import {
  handleAlignmentForFinding,
  handleAlignmentFindings,
  handleEvidenceChain,
  handleCompare
} from "./handlers";

export async function handleAlignmentRoutes(request: Request, pathname: string): Promise<Response | null> {
  const method = request.method.toUpperCase();
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] === "alignment") {
    if (parts.length === 2 && parts[1] === "findings" && method === "GET") {
      return handleAlignmentFindings(request);
    }

    if (parts.length === 2 && parts[1] === "compare" && method === "GET") {
      return handleCompare(request);
    }

    if (parts.length === 2 && method === "GET") {
      return handleAlignmentForFinding(parts[1]);
    }
  }

  if (parts[0] === "evidence-chain" && parts.length === 2 && method === "GET") {
    return handleEvidenceChain(parts[1]);
  }

  return null;
}
