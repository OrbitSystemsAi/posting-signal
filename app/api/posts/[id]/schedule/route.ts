import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { posts, publishingJobs, socialConnections } from "@/db/schema";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { serializePost } from "@/lib/posts/serialize";

const scheduleSchema = z.object({
  scheduledFor: z.string().datetime({ offset: true }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().min(1).max(100),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireCurrentWorkspace();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = scheduleSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid publishing schedule" }, { status: 400 });
  const { id } = await params;
  const scheduledFor = new Date(parsed.data.scheduledFor);
  if (scheduledFor.getTime() < Date.now() - 30_000) return Response.json({ error: "Choose a future publishing time" }, { status: 400 });

  const [[post], [connection]] = await Promise.all([
    context.db.select().from(posts).where(and(eq(posts.id, id), eq(posts.workspaceId, context.workspace.id))).limit(1),
    context.db.select().from(socialConnections).where(and(
      eq(socialConnections.workspaceId, context.workspace.id),
      eq(socialConnections.platform, "linkedin"),
      eq(socialConnections.active, true),
    )).orderBy(desc(socialConnections.updatedAt)).limit(1),
  ]);
  if (!post) return Response.json({ error: "Post not found" }, { status: 404 });
  if (!connection) return Response.json({ error: "Connect LinkedIn before scheduling" }, { status: 409 });
  if (connection.expiresAt && connection.expiresAt <= scheduledFor) {
    return Response.json({ error: "LinkedIn access expires before this post is scheduled. Reconnect LinkedIn." }, { status: 409 });
  }

  const [processing] = await context.db.select({ id: publishingJobs.id }).from(publishingJobs).where(and(
    eq(publishingJobs.postId, post.id),
    eq(publishingJobs.status, "processing"),
  )).limit(1);
  if (processing) return Response.json({ error: "This post is already publishing and cannot be rescheduled" }, { status: 409 });

  const now = new Date();
  await context.db.update(publishingJobs).set({ status: "cancelled", updatedAt: now }).where(and(
    eq(publishingJobs.postId, post.id),
    inArray(publishingJobs.status, ["pending", "retry"]),
  ));
  const [updatedPost] = await context.db.update(posts).set({
    stage: "scheduled",
    scheduledFor,
    content: { ...post.content, date: parsed.data.date, time: parsed.data.time, timezone: parsed.data.timezone },
    updatedAt: now,
  }).where(eq(posts.id, post.id)).returning();
  const idempotencyKey = `post:${post.id}:connection:${connection.id}:at:${scheduledFor.toISOString()}`;
  const [job] = await context.db.insert(publishingJobs).values({
    postId: post.id,
    connectionId: connection.id,
    status: "pending",
    idempotencyKey,
    runAt: scheduledFor,
  }).onConflictDoUpdate({
    target: publishingJobs.idempotencyKey,
    set: { status: "pending", runAt: scheduledFor, lastError: null, updatedAt: now },
  }).returning();

  return Response.json({ post: serializePost(updatedPost, job), scheduled: true });
}
