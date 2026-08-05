import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { socialConnections } from "@/db/schema";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { linkedinAdapter } from "@/lib/linkedin/client";
import { decryptToken } from "@/lib/token-crypto";

const requestSchema = z.object({ text: z.string().min(1).max(3000), idempotencyKey: z.string().min(8).max(200) });

export async function POST(request: Request) {
  const context = await requireCurrentWorkspace();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid LinkedIn post" }, { status: 400 });

  const [connection] = await context.db.select().from(socialConnections).where(and(
    eq(socialConnections.workspaceId, context.workspace.id),
    eq(socialConnections.platform, "linkedin"),
    eq(socialConnections.active, true),
  )).orderBy(desc(socialConnections.updatedAt)).limit(1);
  if (!connection) return Response.json({ error: "Connect LinkedIn before publishing" }, { status: 409 });
  if (connection.expiresAt && connection.expiresAt <= new Date()) {
    return Response.json({ error: "LinkedIn access expired. Reconnect LinkedIn." }, { status: 401 });
  }

  try {
    const result = await linkedinAdapter.publish({
      idempotencyKey: parsed.data.idempotencyKey,
      externalAccountId: connection.externalAccountId,
      text: parsed.data.text,
      mediaUrls: [],
    }, decryptToken(connection.encryptedAccessToken));
    return Response.json({ published: true, ...result });
  } catch (error) {
    console.error("LinkedIn publishing failed", error instanceof Error ? error.message : error);
    return Response.json({ error: "LinkedIn rejected the post. Reconnect the account or try again." }, { status: 502 });
  }
}
