import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { newsFeeds } from "@/db/schema";
import { requireAdminUser } from "@/lib/admin-auth";

export const runtime = "nodejs";

const updateSchema=z.object({name:z.string().trim().min(2).max(120).optional(),type:z.enum(["rss","api","onn"]).optional(),endpoint:z.string().trim().url().optional(),apiKeyEnv:z.string().trim().max(100).nullable().optional(),notes:z.string().trim().max(2000).optional(),active:z.boolean().optional()});

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  if(!await requireAdminUser())return Response.json({error:"Unauthorized"},{status:401});
  const db=getDb();if(!db)return Response.json({error:"Database is not configured"},{status:503});
  const parsed=updateSchema.safeParse(await request.json());if(!parsed.success)return Response.json({error:"Invalid feed update"},{status:400});
  const {id}=await params,fields=parsed.data;
  const values={...fields,updatedAt:new Date()};
  const [feed]=await db.update(newsFeeds).set(values).where(eq(newsFeeds.id,id)).returning();
  return feed?Response.json({feed}):Response.json({error:"Feed not found"},{status:404});
}

export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){
  if(!await requireAdminUser())return Response.json({error:"Unauthorized"},{status:401});
  const db=getDb();if(!db)return Response.json({error:"Database is not configured"},{status:503});
  const {id}=await params;const [feed]=await db.delete(newsFeeds).where(eq(newsFeeds.id,id)).returning({id:newsFeeds.id});
  return feed?Response.json({deleted:true}):Response.json({error:"Feed not found"},{status:404});
}
