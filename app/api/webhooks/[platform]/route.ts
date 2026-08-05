import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  // Each platform adapter must verify its signature before this route persists an event.
  // Until an adapter is configured, fail closed rather than accepting unverified input.
  return Response.json({ error: `Webhook verification is not configured for ${platform}` }, { status: 501 });
}
