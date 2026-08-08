import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { articlePreferences } from "@/db/schema";
import { requireCurrentWorkspace } from "@/lib/current-workspace";

export const runtime = "nodejs";

const articleSchema = z.object({
  id: z.string().min(1).max(500), headline: z.string().min(1).max(500),
  summary: z.string().max(3000).default(""), source: z.string().max(200).default(""),
  topic: z.string().max(200).default(""), url: z.string().url().optional(),
  image: z.string().url().or(z.string().startsWith("/")).optional(), publishedAt: z.string().optional(),
}).passthrough();
const preferenceSchema = z.object({article:articleSchema,saved:z.boolean().optional(),hidden:z.boolean().optional()});

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
  const {article,saved,hidden}=parsed.data;
  const [existing]=await context.db.select().from(articlePreferences).where(and(eq(articlePreferences.workspaceId,context.workspace.id),eq(articlePreferences.articleId,article.id))).limit(1);
  if(existing){
    const [item]=await context.db.update(articlePreferences).set({article,...(saved!==undefined?{saved}:{}),...(hidden!==undefined?{hidden}:{}),updatedAt:new Date()}).where(eq(articlePreferences.id,existing.id)).returning();
    return Response.json({item});
  }
  const [item]=await context.db.insert(articlePreferences).values({workspaceId:context.workspace.id,articleId:article.id,article,saved:saved??false,hidden:hidden??false}).returning();
  return Response.json({item},{status:201});
}
