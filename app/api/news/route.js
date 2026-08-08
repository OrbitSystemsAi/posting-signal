const GUARDIAN_ENDPOINT="https://content.guardianapis.com/search";
const DEFAULT_QUERY='"artificial intelligence" OR "finance transformation" OR "data governance" OR "future of work"';

const plainText=value=>String(value||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();

export async function GET(request){
  const requestUrl=new URL(request.url);
  const query=requestUrl.searchParams.get("q")?.trim()||DEFAULT_QUERY;
  const url=new URL(GUARDIAN_ENDPOINT);
  url.searchParams.set("q",query);
  url.searchParams.set("section","business|technology|media|society");
  url.searchParams.set("show-fields","thumbnail,trailText");
  url.searchParams.set("order-by","newest");
  url.searchParams.set("page-size","36");
  url.searchParams.set("api-key",process.env.GUARDIAN_API_KEY||"test");
  try{
    const response=await fetch(url,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(9000)});
    if(!response.ok)throw new Error(`The Guardian returned ${response.status}`);
    const data=await response.json();
    const results=data.response?.results||[];
    const articles=results.map((article,index)=>({
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
    return Response.json({articles,provider:"The Guardian Open Platform"},{headers:{"Cache-Control":"public, s-maxage=900, stale-while-revalidate=1800"}});
  }catch(error){
    return Response.json({articles:[],provider:"The Guardian Open Platform",error:error instanceof Error?error.message:"News feed unavailable"},{status:502});
  }
}
