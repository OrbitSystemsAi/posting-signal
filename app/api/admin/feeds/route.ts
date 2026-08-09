import { asc, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { articlePreferences, newsFeedArticles, newsFeeds } from "@/db/schema";
import { requireAdminUser } from "@/lib/admin-auth";

export const runtime = "nodejs";

const feedInput=z.object({
  name:z.string().trim().min(2).max(120),
  type:z.enum(["rss","api","onn"]),
  endpoint:z.string().trim().url(),
  apiKeyEnv:z.string().trim().max(100).optional().or(z.literal("")),
  notes:z.string().trim().max(2000).optional().default(""),
  active:z.boolean().optional().default(true),
});

const defaults=[
  {name:"The Guardian Open Platform",type:"api" as const,endpoint:"https://content.guardianapis.com/search?q=%22artificial%20intelligence%22%20OR%20%22finance%20transformation%22&show-fields=thumbnail,trailText&order-by=newest&page-size=36&api-key=test",notes:"Free Guardian feed for Spark discovery.",active:true},
  {name:"NewsAPI Developer",type:"api" as const,endpoint:"https://newsapi.org/v2/everything?q=%22artificial%20intelligence%22%20OR%20%22finance%20transformation%22&language=en&sortBy=publishedAt&pageSize=36",apiKeyEnv:"NEWSAPI_API_KEY",notes:"Developer-tier feed. Keep disabled in production unless the plan permits it.",active:process.env.NODE_ENV!=="production"},
];

export async function GET(){
  if(!await requireAdminUser())return Response.json({error:"Unauthorized"},{status:401});
  const db=getDb();if(!db)return Response.json({error:"Database is not configured"},{status:503});
  await db.execute(sql`update ${newsFeeds} f set
    total_articles=(select count(*)::int from ${newsFeedArticles} a where a.feed_id=f.id),
    upvotes=(select count(*)::int from ${articlePreferences} p join ${newsFeedArticles} a on a.article_id=p.article_id and a.feed_id=f.id where p.vote='up'),
    downvotes=(select count(*)::int from ${articlePreferences} p join ${newsFeedArticles} a on a.article_id=p.article_id and a.feed_id=f.id where p.vote='down')`);
  let feeds=await db.select().from(newsFeeds).orderBy(asc(newsFeeds.createdAt));
  if(!feeds.length){await db.insert(newsFeeds).values(defaults).onConflictDoNothing();feeds=await db.select().from(newsFeeds).orderBy(asc(newsFeeds.createdAt))}
  return Response.json({feeds});
}

export async function POST(request:Request){
  if(!await requireAdminUser())return Response.json({error:"Unauthorized"},{status:401});
  const db=getDb();if(!db)return Response.json({error:"Database is not configured"},{status:503});
  const parsed=feedInput.safeParse(await request.json());
  if(!parsed.success)return Response.json({error:"Enter a valid name, type, and feed URL"},{status:400});
  try{const [feed]=await db.insert(newsFeeds).values({...parsed.data,apiKeyEnv:parsed.data.apiKeyEnv||null}).returning();return Response.json({feed},{status:201})}
  catch(error){return Response.json({error:error instanceof Error&&error.message.includes("unique")?"A feed with this name already exists":"Feed could not be added"},{status:400})}
}
