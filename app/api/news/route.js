const GUARDIAN_ENDPOINT="https://content.guardianapis.com/search";
const NEWSAPI_ENDPOINT="https://newsapi.org/v2/everything";
const DEFAULT_QUERY='"artificial intelligence" OR "finance transformation" OR "data governance" OR "future of work"';

const plainText=value=>String(value||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
const topicFor=(text,index=0)=>{const value=String(text||"").toLowerCase();return value.includes("artificial intelligence")||value.includes(" ai ")||value.includes("technology")?"AI & Innovation":value.includes("finance")||value.includes("bank")||value.includes("market")?"Finance & Strategy":value.includes("work")||value.includes("career")?"Future of Work":index%3===0?"Data Management":"Adjacent Signals"};

async function guardianArticles(query){
  const url=new URL(GUARDIAN_ENDPOINT);
  url.searchParams.set("q",query);
  url.searchParams.set("section","business|technology|media|society");
  url.searchParams.set("show-fields","thumbnail,trailText");
  url.searchParams.set("order-by","newest");
  url.searchParams.set("page-size","36");
  url.searchParams.set("api-key",process.env.GUARDIAN_API_KEY||"test");
  const response=await fetch(url,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(9000)});
  if(!response.ok)throw new Error(`The Guardian returned ${response.status}`);
  const data=await response.json();
  return (data.response?.results||[]).map((article,index)=>({
    id:`guardian-${article.id}`,
    source:"The Guardian",
    headline:article.webTitle,
    summary:plainText(article.fields?.trailText)||"Current reporting connected to your Spark topics. Open the source for the full article.",
    topic:article.sectionId==="technology"?"AI & Innovation":article.sectionId==="business"?"Finance & Strategy":index%3===0?"Future of Work":"Adjacent Signals",
    trend:index%5===0?"down":"up",
    change:index%5===0?"Watch":"Emerging",
    image:article.fields?.thumbnail||null,
    url:article.webUrl,
    publishedAt:article.webPublicationDate,
  }));
}

async function newsApiArticles(query){
  const key=process.env.NEWSAPI_API_KEY;
  if(process.env.NODE_ENV==="production"||!key)return [];
  const url=new URL(NEWSAPI_ENDPOINT);
  url.searchParams.set("q",query);
  url.searchParams.set("language","en");
  url.searchParams.set("sortBy","publishedAt");
  url.searchParams.set("pageSize","36");
  const response=await fetch(url,{headers:{Accept:"application/json","X-Api-Key":key},signal:AbortSignal.timeout(9000)});
  if(!response.ok)throw new Error(`NewsAPI returned ${response.status}`);
  const data=await response.json();
  return (data.articles||[]).filter(article=>article.title&&article.url).map((article,index)=>({
    id:`newsapi-${encodeURIComponent(article.url)}`,
    source:article.source?.name||"NewsAPI source",
    headline:article.title,
    summary:plainText(article.description)||"A current signal connected to your Spark topics. Open the source for the full article.",
    topic:topicFor(`${article.title} ${article.description||""}`,index),
    trend:index%6===0?"down":"up",
    change:index%6===0?"Watch":"Emerging",
    image:article.urlToImage||null,
    url:article.url,
    publishedAt:article.publishedAt,
  }));
}

export async function GET(request){
  const requestUrl=new URL(request.url);
  const query=requestUrl.searchParams.get("q")?.trim()||DEFAULT_QUERY;
  try{
    const db=getDb();
    if(db){
      try{
        const managed=await db.select().from(newsFeeds).where(eq(newsFeeds.active,true));
        if(managed.length){
          const results=await Promise.allSettled(managed.map(feed=>refreshManagedFeed(feed)));
          const articles=results.flatMap(result=>result.status==="fulfilled"?result.value.articles:[]).filter((article,index,list)=>list.findIndex(item=>item.url&&item.url===article.url||item.id===article.id)===index).sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0));
          const errors=results.flatMap(result=>result.status==="rejected"?[result.reason instanceof Error?result.reason.message:"Feed unavailable"]:[]);
          if(articles.length){await recordDeliveredArticles(articles);return Response.json({articles,provider:managed.map(feed=>feed.name).join(" + "),warnings:errors},{headers:{"Cache-Control":"public, s-maxage=900, stale-while-revalidate=1800"}})};
        }
      }catch(error){console.warn("Managed feeds unavailable; using built-in providers",error)}
    }
    const newsApiEnabled=process.env.NODE_ENV!=="production"&&Boolean(process.env.NEWSAPI_API_KEY);
    const results=await Promise.allSettled([guardianArticles(query),newsApiArticles(query)]);
    const articles=results.flatMap(result=>result.status==="fulfilled"?result.value:[]).filter((article,index,list)=>list.findIndex(item=>item.url===article.url)===index).sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0));
    const errors=results.flatMap(result=>result.status==="rejected"?[result.reason instanceof Error?result.reason.message:"Feed unavailable"]:[]);
    if(!articles.length)throw new Error(errors.join("; ")||"No live signals returned");
    const providers=["The Guardian Open Platform",...(newsApiEnabled?["NewsAPI Developer (local only)"]:[])];
    return Response.json({articles,provider:providers.join(" + "),warnings:errors},{headers:{"Cache-Control":"public, s-maxage=900, stale-while-revalidate=1800"}});
  }catch(error){
    return Response.json({articles:[],provider:"Configured news feeds",error:error instanceof Error?error.message:"News feed unavailable"},{status:502});
  }
}
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { newsFeeds } from "@/db/schema";
import { recordDeliveredArticles, refreshManagedFeed } from "@/lib/news-feed-refresh";
