CREATE TYPE "public"."feed_type" AS ENUM('rss', 'api', 'onn');--> statement-breakpoint
CREATE TABLE "news_feeds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "feed_type" NOT NULL,
	"endpoint" text NOT NULL,
	"api_key_env" text,
	"notes" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"downvotes" integer DEFAULT 0 NOT NULL,
	"total_articles" integer DEFAULT 0 NOT NULL,
	"total_categories" integer DEFAULT 0 NOT NULL,
	"top_category" text,
	"last_error" text,
	"last_refreshed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "news_feeds_name_idx" ON "news_feeds" USING btree ("name");