import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { articlePreferences, newsFeedArticles, newsFeeds } from "@/db/schema";
import { requireCurrentWorkspace } from "@/lib/current-workspace";

export const runtime = "nodejs";

const articleSchema = z.object({
  id: z.string().min(1).max(500), headline: z.string().min(1).max(500),
  summary: z.string().max(3000).default(""), source: z.string().max(200).default(""),
  topic: z.string().max(200).default(""), url: z.string().url().optional(),
  image: z.string().url().or(z.string().startsWith("/")).optional(), publishedAt: z.string().optional(),
}).passthrough();
const preferenceSchema = z.object({article:articleSchema,saved:z.boolean().optional(),hidden:z.boolean().optional(),vote:z.enum(["up","down"]).nullable().optional()});
type WorkspaceContext=NonNullable<Awaited<ReturnType<typeof requireCurrentWorkspace>>>;

async function updateFeedVotes(db:WorkspaceContext["db"],article:Record<string,unknown>,previous:string|null,newVote:string|null){
  const feedId=typeof article.feedId==="string"?article.feedId:"";
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(feedId)||previous===newVote)return;
  const articleId=typeof article.id==="string"?article.id:"";
  const [delivered]=await db.select({id:newsFeedArticles.id}).from(newsFeedArticles).where(and(eq(newsFeedArticles.feedId,feedId),eq(newsFeedArticles.articleId,articleId))).limit(1);
  if(!delivered)throw new Error("This article has not been recorded as delivered");
  const upDelta=(newVote==="up"?1:0)-(previous==="up"?1:0),downDelta=(newVote==="down"?1:0)-(previous==="down"?1:0);
  await db.update(newsFeeds).set({upvotes:sql`greatest(0, ${newsFeeds.upvotes} + ${upDelta})`,downvotes:sql`greatest(0, ${newsFeeds.downvotes} + ${downDelta})`,updatedAt:new Date()}).where(eq(newsFeeds.id,feedId));
}

export async function GET(){
  const context=await requireCurrentWorkspace();
  if(!context)return Response.json({error:"Unauthorized"},{status:401});
  const items=await context.db.select().from(articlePreferences).where(eq(articlePreferences.workspaceId,context.workspace.id)).orderBy(desc(articlePreferences.updatedAt));
  return Response.json({items});
}

export async function POST(request:Request){
  const context=await requireCurrentWorkspace();
  if(!context)return Response.json({error:"Unauthorized"},{status:401});
  const parsed=preferenceSchema.safeParse(await request.json());
  if(!parsed.success)return Response.json({error:"Invalid article preference"},{status:400});
  const {article,saved,hidden,vote}=parsed.data;
  const [existing]=await context.db.select().from(articlePreferences).where(and(eq(articlePreferences.workspaceId,context.workspace.id),eq(articlePreferences.articleId,article.id))).limit(1);
  if(existing){
    if(vote!==undefined)await updateFeedVotes(context.db,article,existing.vote,vote);
    const [item]=await context.db.update(articlePreferences).set({article,...(saved!==undefined?{saved}:{}),...(hidden!==undefined?{hidden}:{}),...(vote!==undefined?{vote}:{}),updatedAt:new Date()}).where(eq(articlePreferences.id,existing.id)).returning();
    return Response.json({item});
  }
  if(vote!==undefined)await updateFeedVotes(context.db,article,null,vote);
  const [item]=await context.db.insert(articlePreferences).values({workspaceId:context.workspace.id,articleId:article.id,article,saved:saved??false,hidden:hidden??false,vote:vote??null}).returning();
  return Response.json({item},{status:201});
}
