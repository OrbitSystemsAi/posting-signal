import { productionReadiness } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  const readiness = productionReadiness();
  return Response.json({
    service: "posting-signal",
    version: "1.0.0-beta.1",
    status: readiness.ready ? "ready" : "configuration-required",
    missingConfiguration: readiness.missing,
    timestamp: new Date().toISOString(),
  }, { status: readiness.ready ? 200 : 503 });
}
