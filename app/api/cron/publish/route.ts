import type { NextRequest } from "next/server";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!env.DATABASE_URL) {
    return Response.json({ error: "DATABASE_URL is not configured" }, { status: 503 });
  }
  return Response.json({ processed: 0, message: "Publishing worker is ready for platform adapters." });
}
