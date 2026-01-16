import { handleGraphRequest } from "./graph/routes";
import { handleReasoningRoutes } from "./reasoning/routes";
import { handleDemoRoutes } from "./demo/routes";
import { handleAlignmentRoutes } from "./alignment/routes";

type Env = {
  APP_NAME: string;
};

const json = (value: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(value, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {})
    }
  });

const notFound = () => json({ error: "not_found" }, { status: 404 });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === "/health") {
      return json({ status: "ok", app: env.APP_NAME });
    }

    if (pathname.startsWith("/graph")) {
      const response = await handleGraphRequest(request);
      if (response) return response;
    }

    if (pathname.startsWith("/reasoning")) {
      const response = await handleReasoningRoutes(request, pathname);
      if (response) return response;
    }

    if (pathname.startsWith("/demo")) {
      const response = await handleDemoRoutes(request, pathname);
      if (response) return response;
    }

    if (pathname.startsWith("/alignment") || pathname.startsWith("/evidence-chain")) {
      const response = await handleAlignmentRoutes(request, pathname);
      if (response) return response;
    }

    return notFound();
  }
};
