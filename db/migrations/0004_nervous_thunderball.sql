CREATE TABLE "news_feed_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feed_id" uuid NOT NULL,
	"article_id" text NOT NULL,
	"delivered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "news_feed_articles" ADD CONSTRAINT "news_feed_articles_feed_id_news_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."news_feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "news_feed_articles_feed_article_idx" ON "news_feed_articles" USING btree ("feed_id","article_id");--> statement-breakpoint
CREATE INDEX "news_feed_articles_feed_idx" ON "news_feed_articles" USING btree ("feed_id");