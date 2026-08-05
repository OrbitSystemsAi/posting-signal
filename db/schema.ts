import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const postStage = pgEnum("post_stage", ["idea", "draft", "review", "approved", "scheduled", "published", "failed"]);
export const platform = pgEnum("platform", ["linkedin", "instagram", "threads", "facebook", "x", "bluesky", "mastodon", "tiktok"]);
export const jobStatus = pgEnum("job_status", ["pending", "processing", "published", "retry", "failed", "cancelled"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("users_email_idx").on(table.email)]);

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("workspaces_slug_idx").on(table.slug)]);

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  summary: text("summary").default("").notNull(),
  hook: text("hook").default("").notNull(),
  body: text("body").default("").notNull(),
  closing: text("closing").default("").notNull(),
  pillar: text("pillar").notNull(),
  stage: postStage("stage").default("idea").notNull(),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  content: jsonb("content").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("posts_workspace_schedule_idx").on(table.workspaceId, table.scheduledFor)]);

export const socialConnections = pgTable("social_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  platform: platform("platform").notNull(),
  externalAccountId: text("external_account_id").notNull(),
  displayName: text("display_name").notNull(),
  encryptedAccessToken: text("encrypted_access_token").notNull(),
  encryptedRefreshToken: text("encrypted_refresh_token"),
  scopes: text("scopes").array().default([]).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("connections_account_idx").on(table.workspaceId, table.platform, table.externalAccountId)]);

export const publishingJobs = pgTable("publishing_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  connectionId: uuid("connection_id").references(() => socialConnections.id, { onDelete: "cascade" }).notNull(),
  status: jobStatus("status").default("pending").notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  runAt: timestamp("run_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  platformPostId: text("platform_post_id"),
  platformPostUrl: text("platform_post_url"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("publishing_jobs_idempotency_idx").on(table.idempotencyKey), index("publishing_jobs_due_idx").on(table.status, table.runAt)]);

export const engagementItems = pgTable("engagement_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  connectionId: uuid("connection_id").references(() => socialConnections.id, { onDelete: "cascade" }).notNull(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "set null" }),
  platformItemId: text("platform_item_id").notNull(),
  parentPlatformItemId: text("parent_platform_item_id"),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  suggestedReply: text("suggested_reply"),
  risk: text("risk").default("unclassified").notNull(),
  requiresApproval: boolean("requires_approval").default(true).notNull(),
  repliedAt: timestamp("replied_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("engagement_platform_item_idx").on(table.connectionId, table.platformItemId)]);
