import type { InferSelectModel } from "drizzle-orm";
import type { posts, publishingJobs } from "@/db/schema";

type PostRow = InferSelectModel<typeof posts>;
type JobRow = InferSelectModel<typeof publishingJobs>;

export function serializePost(post: PostRow, job?: JobRow | null) {
  const content = post.content || {};
  const scheduledFor = post.scheduledFor?.toISOString() || null;

  return {
    ...content,
    id: post.id,
    title: post.title,
    summary: post.summary,
    hook: post.hook,
    body: post.body,
    closing: post.closing,
    pillar: post.pillar,
    stage: toClientStage(post.stage),
    date: typeof content.date === "string" ? content.date : scheduledFor?.slice(0, 10) || post.createdAt.toISOString().slice(0, 10),
    time: typeof content.time === "string" ? content.time : scheduledFor?.slice(11, 16) || "09:00",
    timezone: typeof content.timezone === "string" ? content.timezone : "America/New_York",
    scheduledFor,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    publishingJob: job ? {
      id: job.id,
      status: job.status,
      attempts: job.attempts,
      runAt: job.runAt.toISOString(),
      platformPostId: job.platformPostId,
      platformPostUrl: job.platformPostUrl,
      lastError: job.lastError,
      updatedAt: job.updatedAt.toISOString(),
    } : null,
  };
}

export function toClientStage(stage: PostRow["stage"]) {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

export function toDatabaseStage(stage: string) {
  const normalized = stage.toLowerCase();
  if (["idea", "draft", "review", "approved", "scheduled", "published", "failed"].includes(normalized)) {
    return normalized as PostRow["stage"];
  }
  return "idea" as const;
}
