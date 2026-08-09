import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { newsFeeds } from "@/db/schema";
import { requireAdminUser } from "@/lib/admin-auth";
import { recordDeliveredArticles, refreshManagedFeed } from "@/lib/news-feed-refresh";

export const runtime = "nodejs";

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
  if(!await requireAdminUser())return Response.json({error:"Unauthorized"},{status:401});
  const db=getDb();if(!db)return Response.json({error:"Database is not configured"},{status:503});
  const {id}=await params;const [feed]=await db.select().from(newsFeeds).where(eq(newsFeeds.id,id)).limit(1);
  if(!feed)return Response.json({error:"Feed not found"},{status:404});
  try{
    const result=await refreshManagedFeed(feed);
    await recordDeliveredArticles(result.articles);
    const [updated]=await db.update(newsFeeds).set({totalCategories:result.stats.totalCategories,topCategory:result.stats.topCategory,lastRefreshedAt:new Date(),lastError:null,updatedAt:new Date()}).where(eq(newsFeeds.id,id)).returning();
    return Response.json({feed:updated,articles:result.articles.slice(0,5),delivered:result.stats.delivered});
  }catch(error){const message=error instanceof Error?error.message:"Feed refresh failed";const [updated]=await db.update(newsFeeds).set({lastError:message,lastRefreshedAt:new Date(),updatedAt:new Date()}).where(eq(newsFeeds.id,id)).returning();return Response.json({error:message,feed:updated},{status:502})}
}
