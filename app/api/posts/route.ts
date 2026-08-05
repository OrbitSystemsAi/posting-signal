import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { posts, publishingJobs } from "@/db/schema";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { serializePost, toDatabaseStage } from "@/lib/posts/serialize";

export const runtime = "nodejs";

const postInput = z.object({
  title: z.string().min(1).max(300),
  summary: z.string().max(1000).default(""),
  hook: z.string().max(3000).default(""),
  body: z.string().max(3000).default(""),
  closing: z.string().max(1000).default(""),
  pillar: z.string().min(1).max(120),
  stage: z.string().default("Idea"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/).default("09:00"),
  timezone: z.string().max(100).default("America/New_York"),
  content: z.record(z.string(), z.unknown()).default({}),
});

export async function GET() {
  const context = await requireCurrentWorkspace();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const postRows = await context.db.select().from(posts).where(eq(posts.workspaceId, context.workspace.id)).orderBy(desc(posts.updatedAt));
  const jobRows = postRows.length
    ? await context.db.select().from(publishingJobs).where(inArray(publishingJobs.postId, postRows.map((post) => post.id))).orderBy(desc(publishingJobs.updatedAt))
    : [];
  const latestJobByPost = new Map<string, (typeof jobRows)[number]>();
  for (const job of jobRows) if (!latestJobByPost.has(job.postId)) latestJobByPost.set(job.postId, job);

  return Response.json({ posts: postRows.map((post) => serializePost(post, latestJobByPost.get(post.id))) });
}

export async function POST(request: Request) {
  const context = await requireCurrentWorkspace();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = postInput.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid post", details: parsed.error.flatten() }, { status: 400 });

  const input = parsed.data;
  const [created] = await context.db.insert(posts).values({
    workspaceId: context.workspace.id,
    title: input.title,
    summary: input.summary,
    hook: input.hook,
    body: input.body,
    closing: input.closing,
    pillar: input.pillar,
    stage: toDatabaseStage(input.stage),
    content: { ...input.content, date: input.date, time: input.time, timezone: input.timezone },
  }).returning();

  return Response.json({ post: serializePost(created) }, { status: 201 });
}
