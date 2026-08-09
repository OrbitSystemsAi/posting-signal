import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { newsFeedArticles, newsFeeds } from "@/db/schema";

export type ManagedFeed = {
  id: string;
  name: string;
  type: "rss" | "api" | "onn";
  endpoint: string;
  apiKeyEnv?: string | null;
};

export type ManagedArticle = {
  id: string;
  feedId: string;
  source: string;
  headline: string;
  summary: string;
  topic: string;
  image?: string | null;
  url?: string | null;
  publishedAt?: string | null;
  trend: "up" | "down";
  change: string;
};

const clean = (value: unknown) => String(value ?? "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
const capture = (item: string, names: string[]) => {
  for (const name of names) {
    const match = item.match(new RegExp(`<${name}(?:\\s[^>]*)?>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`, "i"));
    if (match?.[1]) return clean(match[1]);
  }
  return "";
};
const attr = (item: string, tag: string, attribute: string) => item.match(new RegExp(`<${tag}[^>]*${attribute}=["']([^"']+)["'][^>]*>`, "i"))?.[1] || "";
const topicFor = (value: string) => {
  const text=value.toLowerCase();
  if(/artificial intelligence|\bai\b|technology|software/.test(text))return "AI & Innovation";
  if(/finance|bank|market|econom/.test(text))return "Finance & Strategy";
  if(/work|career|talent|leadership/.test(text))return "Future of Work";
  if(/data|privacy|security|governance/.test(text))return "Data Management";
  return "Adjacent Signals";
};

function normalizeApi(feed: ManagedFeed, payload: unknown): ManagedArticle[] {
  const root=payload as Record<string,unknown>;
  const response=root?.response as Record<string,unknown>|undefined;
  const candidates=[root?.articles,root?.results,response?.results,root?.items,root?.data,payload].find(Array.isArray) as Array<Record<string,unknown>>|undefined;
  return (candidates||[]).map((item,index)=>{
    const headline=clean(item.title||item.headline||item.webTitle||item.name);
    const url=clean(item.url||item.link||item.webUrl);
    const fields=item.fields as Record<string,unknown>|undefined;
    const summary=clean(item.description||item.summary||item.excerpt||item.abstract||fields?.trailText);
    const category=clean(item.category||item.section||item.sectionId||item.topic)||topicFor(`${headline} ${summary}`);
    return {id:`${feed.id}-${clean(item.id||url||index)}`,feedId:feed.id,source:clean((item.source as Record<string,unknown>)?.name||item.source||feed.name),headline,summary,topic:category,image:clean(item.urlToImage||item.image||item.thumbnail||fields?.thumbnail)||null,url:url||clean(item.webUrl)||null,publishedAt:clean(item.publishedAt||item.webPublicationDate||item.pubDate||item.date)||null,trend:(index%6===0?"down":"up") as "down"|"up",change:index%6===0?"Watch":"Emerging"};
  }).filter(item=>item.headline);
}

function normalizeRss(feed: ManagedFeed, xml: string): ManagedArticle[] {
  const items=xml.match(/<(?:item|entry)(?:\s[^>]*)?>[\s\S]*?<\/(?:item|entry)>/gi)||[];
  return items.map((item,index)=>{
    const headline=capture(item,["title"]),summary=capture(item,["description","summary","content:encoded","content"]);
    const link=capture(item,["link"])||attr(item,"link","href"),category=capture(item,["category"])||topicFor(`${headline} ${summary}`);
    return {id:`${feed.id}-${capture(item,["guid","id"])||link||index}`,feedId:feed.id,source:feed.name,headline,summary,topic:category,image:attr(item,"media:content","url")||attr(item,"media:thumbnail","url")||null,url:link||null,publishedAt:capture(item,["pubDate","published","updated"])||null,trend:(index%6===0?"down":"up") as "down"|"up",change:index%6===0?"Watch":"Emerging"};
  }).filter(item=>item.headline);
}

export async function refreshManagedFeed(feed: ManagedFeed) {
  if(!feed.endpoint)throw new Error("This feed needs an endpoint before it can be refreshed");
  const headers:Record<string,string>={Accept:feed.type==="rss"?"application/rss+xml, application/atom+xml, application/xml, text/xml":"application/json"};
  if(feed.apiKeyEnv){const key=process.env[feed.apiKeyEnv];if(!key)throw new Error(`Missing environment variable ${feed.apiKeyEnv}`);headers.Authorization=`Bearer ${key}`;headers["X-Api-Key"]=key}
  const response=await fetch(feed.endpoint,{headers,signal:AbortSignal.timeout(12000),cache:"no-store"});
  if(!response.ok)throw new Error(`${feed.name} returned ${response.status}`);
  const articles=feed.type==="rss"?normalizeRss(feed,await response.text()):normalizeApi(feed,await response.json());
  const categoryCounts=new Map<string,number>();
  articles.forEach(article=>categoryCounts.set(article.topic,(categoryCounts.get(article.topic)||0)+1));
  const categories=[...categoryCounts.entries()].sort((a,b)=>b[1]-a[1]);
  return {articles,stats:{delivered:articles.length,totalCategories:categories.length,topCategory:categories[0]?.[0]||null}};
}

export async function recordDeliveredArticles(articles: ManagedArticle[]) {
  const db=getDb();
  if(!db||!articles.length)return;
  await db.insert(newsFeedArticles).values(articles.map(article=>({feedId:article.feedId,articleId:article.id}))).onConflictDoNothing();
  const feedIds=[...new Set(articles.map(article=>article.feedId))];
  for(const feedId of feedIds){
    await db.update(newsFeeds).set({
      totalArticles:sql<number>`(select count(*)::int from ${newsFeedArticles} where ${newsFeedArticles.feedId} = ${feedId})`,
      updatedAt:new Date(),
    }).where(eq(newsFeeds.id,feedId));
  }
}
