import { eq } from "drizzle-orm";
import { z } from "zod";
import { posts } from "@/db/schema";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { serializePost, toDatabaseStage } from "@/lib/posts/serialize";

const legacyPost = z.object({
  id: z.union([z.string(), z.number()]).optional(),
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
}).passthrough();

const importSchema = z.object({ posts: z.array(legacyPost).max(250) });

export async function POST(request: Request) {
  const context = await requireCurrentWorkspace();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = importSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid post import" }, { status: 400 });

  const [existing] = await context.db.select({ id: posts.id }).from(posts).where(eq(posts.workspaceId, context.workspace.id)).limit(1);
  if (existing) return Response.json({ error: "Workspace already contains posts" }, { status: 409 });
  if (!parsed.data.posts.length) return Response.json({ posts: [] });

  const created = await context.db.insert(posts).values(parsed.data.posts.map((input) => {
    const { id: legacyId, title, summary, hook, body, closing, pillar, stage, date, time, timezone, ...content } = input;
    return {
      workspaceId: context.workspace.id,
      title,
      summary,
      hook,
      body,
      closing,
      pillar,
      stage: toDatabaseStage(stage),
      content: { ...content, legacyId, date, time, timezone },
    };
  })).returning();

  return Response.json({ posts: created.map((post) => serializePost(post)) }, { status: 201 });
}
