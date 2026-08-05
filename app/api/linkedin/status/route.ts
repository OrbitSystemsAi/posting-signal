import { and, desc, eq } from "drizzle-orm";
import { socialConnections } from "@/db/schema";
import { requireCurrentWorkspace } from "@/lib/current-workspace";

export async function GET() {
  const context = await requireCurrentWorkspace();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [connection] = await context.db.select({
    id: socialConnections.id,
    displayName: socialConnections.displayName,
    active: socialConnections.active,
    expiresAt: socialConnections.expiresAt,
  }).from(socialConnections).where(and(
    eq(socialConnections.workspaceId, context.workspace.id),
    eq(socialConnections.platform, "linkedin"),
    eq(socialConnections.active, true),
  )).orderBy(desc(socialConnections.updatedAt)).limit(1);
  return Response.json({ connected: Boolean(connection), connection: connection || null });
}

export async function DELETE() {
  const context = await requireCurrentWorkspace();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await context.db.update(socialConnections).set({ active: false, updatedAt: new Date() }).where(and(
    eq(socialConnections.workspaceId, context.workspace.id),
    eq(socialConnections.platform, "linkedin"),
  ));
  return Response.json({ disconnected: true });
}
