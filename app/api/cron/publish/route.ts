import type { NextRequest } from "next/server";
import { and, asc, eq, inArray, lte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { posts, publishingJobs, socialConnections } from "@/db/schema";
import { env } from "@/lib/env";
import { linkedinAdapter } from "@/lib/linkedin/client";
import { PlatformPublishError } from "@/lib/platforms/types";
import { decryptToken } from "@/lib/token-crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

const BATCH_SIZE = 8;
const MAX_ATTEMPTS = 5;
const LEASE_TIMEOUT_MS = 15 * 60 * 1000;
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000];

function publishText(post: typeof posts.$inferSelect) {
  return [post.title, post.hook, post.body, post.closing].filter(Boolean).join("\n\n");
}

function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown publishing failure";
  return message.replace(/Bearer\s+\S+/gi, "Bearer [redacted]").slice(0, 500);
}

export async function GET(request: NextRequest) {
  if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return Response.json({ error: "DATABASE_URL is not configured" }, { status: 503 });
  }

  const now = new Date();
  const leaseExpiredAt = new Date(now.getTime() - LEASE_TIMEOUT_MS);
  const abandoned = await db.update(publishingJobs).set({
    status: "failed",
    lastError: "Publishing was interrupted after delivery began. Review manually before retrying to prevent a duplicate post.",
    updatedAt: now,
  }).where(and(eq(publishingJobs.status, "processing"), lte(publishingJobs.updatedAt, leaseExpiredAt))).returning({ postId: publishingJobs.postId });
  if (abandoned.length) {
    await db.update(posts).set({ stage: "failed", updatedAt: now }).where(inArray(posts.id, abandoned.map((job) => job.postId)));
  }
  const candidates = await db.select({ id: publishingJobs.id }).from(publishingJobs).where(and(
    inArray(publishingJobs.status, ["pending", "retry"]),
    lte(publishingJobs.runAt, now),
  )).orderBy(asc(publishingJobs.runAt)).limit(BATCH_SIZE * 2);

  const claimedIds: string[] = [];
  for (const candidate of candidates) {
    if (claimedIds.length >= BATCH_SIZE) break;
    const [claimed] = await db.update(publishingJobs).set({
      status: "processing",
      attempts: sql`${publishingJobs.attempts} + 1`,
      updatedAt: now,
    }).where(and(
      eq(publishingJobs.id, candidate.id),
      inArray(publishingJobs.status, ["pending", "retry"]),
      lte(publishingJobs.runAt, now),
    )).returning({ id: publishingJobs.id });
    if (claimed) claimedIds.push(claimed.id);
  }

  if (!claimedIds.length) return Response.json({ processed: 0, published: 0, retried: 0, failed: 0, abandoned: abandoned.length });

  const claimedJobs = await db.select({
    job: publishingJobs,
    post: posts,
    connection: socialConnections,
  }).from(publishingJobs)
    .innerJoin(posts, eq(posts.id, publishingJobs.postId))
    .innerJoin(socialConnections, eq(socialConnections.id, publishingJobs.connectionId))
    .where(inArray(publishingJobs.id, claimedIds));

  const totals = { processed: claimedJobs.length, published: 0, retried: 0, failed: 0, abandoned: abandoned.length };
  for (const { job, post, connection } of claimedJobs) {
    try {
      if (!connection.active) throw new PlatformPublishError("The social connection is inactive", false);
      if (connection.expiresAt && connection.expiresAt <= new Date()) throw new PlatformPublishError("LinkedIn access expired. Reconnect LinkedIn.", false);
      if (connection.platform !== "linkedin") throw new PlatformPublishError(`${connection.platform} publishing is not enabled`, false);
      const text = publishText(post);
      if (!text || text.length > 3000) throw new PlatformPublishError("LinkedIn post text must contain 1 to 3,000 characters", false);

      const result = await linkedinAdapter.publish({
        idempotencyKey: job.idempotencyKey,
        externalAccountId: connection.externalAccountId,
        text,
        mediaUrls: [],
      }, decryptToken(connection.encryptedAccessToken));
      const finishedAt = new Date();
      const [completed] = await db.update(publishingJobs).set({
        status: "published",
        platformPostId: result.platformPostId,
        platformPostUrl: result.platformPostUrl || null,
        lastError: null,
        updatedAt: finishedAt,
      }).where(and(eq(publishingJobs.id, job.id), eq(publishingJobs.status, "processing"))).returning({ id: publishingJobs.id });
      if (completed) {
        await db.update(posts).set({ stage: "published", updatedAt: finishedAt }).where(eq(posts.id, post.id));
        totals.published += 1;
      }
    } catch (error) {
      // Unknown failures may have happened after LinkedIn accepted the post.
      // Require manual review instead of risking an automatic duplicate.
      const retryable = error instanceof PlatformPublishError && error.retryable;
      const shouldRetry = retryable && job.attempts < MAX_ATTEMPTS;
      const delay = RETRY_DELAYS_MS[Math.min(Math.max(job.attempts - 1, 0), RETRY_DELAYS_MS.length - 1)];
      const failedAt = new Date();
      await db.update(publishingJobs).set({
        status: shouldRetry ? "retry" : "failed",
        runAt: shouldRetry ? new Date(failedAt.getTime() + delay) : job.runAt,
        lastError: safeError(error),
        updatedAt: failedAt,
      }).where(and(eq(publishingJobs.id, job.id), eq(publishingJobs.status, "processing")));
      if (shouldRetry) totals.retried += 1;
      else {
        await db.update(posts).set({ stage: "failed", updatedAt: failedAt }).where(eq(posts.id, post.id));
        totals.failed += 1;
      }
      console.error("Scheduled publishing failed", { jobId: job.id, retrying: shouldRetry, error: safeError(error) });
    }
  }

  return Response.json(totals);
}
