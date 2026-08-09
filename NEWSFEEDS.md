# News-feed options for PostingSignal

Last verified: August 8, 2026

This is a practical catalog of legitimate feeds that PostingSignal could integrate, ordered from no-cost sources to enterprise licensing. It is not a claim to enumerate every RSS feed on the web. Prices and reuse terms change; verify them again before production launch.

## Recommended MVP approach

Start with official RSS feeds from public institutions plus one normalized news API. Store only the source-supplied metadata needed for discovery: headline, short description, publisher, publication date, image URL, and canonical URL. Attribute every item and send readers to the original article. Do not copy full articles unless the provider's license expressly permits it.

The best first API candidate is **NewsData.io** because its published free plan currently permits commercial use, although news is delayed by 12 hours. Pair it with the official Federal Reserve, SEC, and IMF RSS feeds for timely finance and policy signals. Use development-only services only for evaluation until a production license is purchased. PostingSignal also uses the **NewsAPI.org Developer plan on localhost only** when `NEWSAPI_API_KEY` is configured; the server route disables it automatically in production.

## Tier 1 — Free and suitable to evaluate for an MVP

| Provider/feed | Type | Cost | Coverage and limits | Production/licensing note | Source |
|---|---|---:|---|---|---|
| NewsData.io | API (JSON) | Free | 200 credits/day, 10 articles/credit, 12-hour delay, no full text | Provider states that its free plan may be used commercially; raw data may not be resold | [Pricing explanation](https://newsdata.io/blog/pricing-plan-in-newsdata-io/) |
| Federal Reserve Board | RSS | Free | Press releases, speeches, testimony, research papers, monetary policy and financial data | Official public-sector source; retain attribution and canonical links | [Feed directory](https://www.federalreserve.gov/feeds/feeds.htm) |
| U.S. Securities and Exchange Commission | RSS | Free | Press releases, statements, litigation, administrative proceedings, trading suspensions, and EDGAR searches | Official public-sector source; particularly useful for finance, governance, and company signals | [Feed directory](https://www.sec.gov/about/rss-feeds) |
| International Monetary Fund | RSS | Free | Global economics, finance, policy, publications, and country material | Official institutional source; check IMF copyright rules before reproducing more than feed metadata | [RSS directory](https://www.imf.org/en/publications/rss?language=eng) |
| NASA/JPL | RSS | Free | Technology, science, research, and innovation news and features | Official public-sector source; useful as a controlled adjacent-signal source | [Feed directory](https://www.jpl.nasa.gov/rss/) |
| NASA Earth Observatory | RSS | Free | Image of the Day and natural-event feeds | Official public-sector source; more adjacent than core business coverage | [Feed directory](https://science.nasa.gov/earth/earth-observatory/subscribe/feeds/) |
| Publisher-provided RSS feeds | RSS/Atom | Usually free | Varies by publisher; often headline, excerpt, date, and URL | Each publisher has separate copyright and commercial-use terms. Maintain an explicit allowlist and rights record | Publisher-specific |
| Company and research-site feeds | RSS/Atom | Usually free | Corporate newsrooms, investor relations, think tanks, universities, and research labs | Best for first-party signals; validate each feed and its terms independently | Source-specific |

## Tier 2 — Free for development or non-commercial evaluation only

These are useful on localhost, but their free plans should not be treated as authorization for a public commercial PostingSignal deployment.

| Provider | Type | Free access | First production tier | Important restriction | Source |
|---|---|---:|---:|---|---|
| The Guardian Open Platform | API | 500 calls/day and 1 call/second | Custom quote | Free developer key is non-commercial; commercial use and generative-AI-derived services require a commercial key | [Access levels](https://open-platform.theguardian.com/access/) |
| GNews | API | 100 requests/day, 10 results/request, 12-hour delay | €49.99/month monthly (€39.99/month annual) | Free plan is development/testing and non-commercial only | [Pricing](https://gnews.io/pricing) |
| NewsAPI.org | API | 100 requests/day, 24-hour delay | $449/month | Free Developer plan is limited to development/testing and cannot be used in staging or production | [Pricing](https://newsapi.org/pricing) |
| Mediastack | API | 100 calls/month, delayed data | $24.99/month ($22.99 annual rate) | Commercial use is listed on paid plans; confirm the free-plan rights before public use | [Pricing](https://mediastack.com/pricing/) |
| NewsAPI.ai / Event Registry | API + Node/Python SDKs | 2,000 one-time testing tokens | Usage-based subscription | Registration is free for testing; paid tokens are required beyond the initial allowance | [Documentation](https://newsapi.ai/documentation) |
| NewsCatcher CatchAll | Web-search API | Free individual/pay-as-you-go entry with limited search depth | $50/month Starter | This is web search, not NewsCatcher's enterprise News API; confirm display and content rights for the selected sources | [Pricing](https://www.newscatcherapi.com/pricing?tab=news-api) |

## Tier 3 — Lower-cost production APIs

| Provider | Type | Starting cost | Good fit | Cautions | Source |
|---|---|---:|---|---|---|
| Mediastack Standard | API | $24.99/month | Cheapest clearly listed production API in this catalog; live and historical metadata across 7,500+ sources | Validate source quality, image rights, deduplication, and excerpt rights during trial | [Pricing](https://mediastack.com/pricing/) |
| GNews Essential | API | €49.99/month | Simple integration, real-time results, historical data from 2020, up to 25 articles/request | Confirm that “full content” can be displayed or processed for PostingSignal's precise use case | [Pricing](https://gnews.io/pricing) |
| NewsCatcher CatchAll Starter | Web-search API | $50/month | Monitoring queries and adjacent signals across the open web | It is not the enterprise news corpus; results and rights remain source-dependent | [Pricing](https://www.newscatcherapi.com/pricing?tab=news-api) |
| Mediastack Professional | API | $99.99/month | Higher request allowance and commercial metadata use | Same source-level rights and quality review required | [Pricing](https://mediastack.com/pricing/) |
| NewsData.io Basic | API | $199.99/month | Real-time news, six months of history, full-content availability, AI summaries and sentiment | Confirm redistribution and AI-derived-content terms before using full text | [Pricing explanation](https://newsdata.io/blog/pricing-plan-in-newsdata-io/) |
| NewsAPI.ai / Event Registry | API | Usage based | Event clustering, concepts, sentiment, archive, SDKs, and structured enrichment | Token costs vary by operation and historical range | [Plans](https://newsapi.ai/plans) |

## Tier 4 — Higher-cost and enterprise services

| Provider | Type | Cost | Strength | Source |
|---|---|---:|---|---|
| NewsAPI.org Business | API | $449/month | Broad normalized source coverage, real-time production access, 250,000 requests/month | [Pricing](https://newsapi.org/pricing) |
| NewsCatcher News API | Enterprise API | Custom quote | 150,000+ sources, clustering, entities, sentiment, translations, monitoring, and history from 2019 | [Product](https://www.newscatcherapi.com/) |
| The Guardian Commercial | API | Custom quote | Licensed access to Guardian text, images, audio, video, and archive; explicitly addresses AI and derived services | [Access levels](https://open-platform.theguardian.com/access/) |
| Associated Press | Licensed content/API | Custom quote | Premium first-party reporting and dependable commercial licensing | [AP Content Services](https://www.ap.org/content/) |
| Reuters | Licensed content/API | Custom quote | Global business, financial, political, and general news with enterprise rights | [Reuters Connect](https://www.reutersconnect.com/) |
| Dow Jones / Factiva | Licensed feeds/API | Custom quote | Business intelligence, company monitoring, licensed premium publications, and archives | [Factiva](https://www.dowjones.com/professional/factiva/) |

## Top ten to evaluate first

1. **NewsData.io API** — best zero-cost normalized API candidate for a commercial MVP, accepting a 12-hour delay.
2. **Federal Reserve RSS** — highly relevant, authoritative finance and monetary-policy signals.
3. **SEC RSS** — authoritative company, markets, governance, enforcement, and filing signals.
4. **IMF RSS** — global finance, economic policy, transformation, and country-level context.
5. **NASA/JPL RSS** — credible technology and innovation signals that can support deliberately adjacent content.
6. **The Guardian Open Platform** — strong API and archive for non-commercial development; request commercial terms before launch.
7. **Mediastack** — inexpensive production upgrade path and easy normalized API.
8. **GNews** — useful real-time commercial API once upgraded from its development-only free plan.
9. **NewsAPI.ai / Event Registry** — useful when clustering, topic extraction, sentiment, and event detection become priorities.
10. **NewsAPI.org** — very easy to prototype, but its production price makes it a later comparison rather than the default MVP choice.

## Integration and compliance checklist

- Record the provider, exact plan, terms URL, verification date, allowed environments, attribution requirements, cache duration, image rights, excerpt rights, AI-processing rights, and deletion obligations.
- Preserve the canonical publisher URL and source name on every record.
- Treat article images as separately licensed unless the provider expressly grants display rights.
- Do not scrape full article pages merely because an API returns their URLs.
- Deduplicate stories by canonical URL, normalized title, and similarity clustering.
- Store source content separately from user-created commentary and generated posts.
- For **Editor**, generate an original, attributed perspective rather than reproducing the article.
- For **Save**, retain a bookmark and permitted metadata—not an unauthorized copy.
- For **Share**, share the canonical link with attribution and optional user commentary.
- Support takedown, source suppression, expiration, and user-level hiding.
- Recheck all terms before production; this document is product research, not legal advice.
