import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { posts, publishingJobs } from "@/db/schema";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { serializePost, toDatabaseStage } from "@/lib/posts/serialize";

const updateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  summary: z.string().max(1000).optional(),
  hook: z.string().max(3000).optional(),
  body: z.string().max(3000).optional(),
  closing: z.string().max(1000).optional(),
  pillar: z.string().min(1).max(120).optional(),
  stage: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().max(100).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireCurrentWorkspace();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid post update" }, { status: 400 });
  const { id } = await params;

  const [existing] = await context.db.select().from(posts).where(and(eq(posts.id, id), eq(posts.workspaceId, context.workspace.id))).limit(1);
  if (!existing) return Response.json({ error: "Post not found" }, { status: 404 });
  const input = parsed.data;
  const content = {
    ...existing.content,
    ...input.content,
    ...(input.date ? { date: input.date } : {}),
    ...(input.time ? { time: input.time } : {}),
    ...(input.timezone ? { timezone: input.timezone } : {}),
  };
  const [updated] = await context.db.update(posts).set({
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.summary !== undefined ? { summary: input.summary } : {}),
    ...(input.hook !== undefined ? { hook: input.hook } : {}),
    ...(input.body !== undefined ? { body: input.body } : {}),
    ...(input.closing !== undefined ? { closing: input.closing } : {}),
    ...(input.pillar !== undefined ? { pillar: input.pillar } : {}),
    ...(input.stage !== undefined ? { stage: toDatabaseStage(input.stage) } : {}),
    content,
    updatedAt: new Date(),
  }).where(and(eq(posts.id, id), eq(posts.workspaceId, context.workspace.id))).returning();

  if (input.stage && input.stage.toLowerCase() !== "scheduled") {
    await context.db.update(publishingJobs).set({ status: "cancelled", updatedAt: new Date() }).where(and(
      eq(publishingJobs.postId, id),
      inArray(publishingJobs.status, ["pending", "retry"]),
    ));
  }
  return Response.json({ post: serializePost(updated) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireCurrentWorkspace();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const [processing] = await context.db.select({ id: publishingJobs.id }).from(publishingJobs).where(and(
    eq(publishingJobs.postId, id),
    eq(publishingJobs.status, "processing"),
  )).limit(1);
  if (processing) return Response.json({ error: "This post is currently publishing and cannot be deleted" }, { status: 409 });
  const [deleted] = await context.db.delete(posts).where(and(eq(posts.id, id), eq(posts.workspaceId, context.workspace.id))).returning({ id: posts.id });
  if (!deleted) return Response.json({ error: "Post not found" }, { status: 404 });
  return Response.json({ deleted: true });
}
