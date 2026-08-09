"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

const sections = [
  { id: "users", label: "Users", description: "Manage access, roles, and account status." },
  { id: "feeds", label: "Feeds", description: "Configure news providers, sources, and refresh health." },
  { id: "news-elements", label: "News Elements", description: "Control article metadata, actions, and prominence rules." },
  { id: "pages", label: "Pages", description: "Review the pages and surfaces available across PostingSignal." },
  { id: "design", label: "Design", description: "Manage shared brand tokens, marks, typography, and interface behavior." },
  { id: "communication", label: "Communication", description: "Prepare product notices, onboarding messages, and service updates." },
] as const;

type SectionId = (typeof sections)[number]["id"];

const iconPaths: Record<SectionId, React.ReactNode> = {
  users: <><circle cx="9" cy="8" r="3"/><path d="M3.5 18a5.5 5.5 0 0 1 11 0M16 7h5M18.5 4.5v5"/></>,
  feeds: <><path d="M5 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM4 11a7 7 0 0 1 7 7M4 5a13 13 0 0 1 13 13"/></>,
  "news-elements": <><path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5"/></>,
  pages: <><path d="M6 3h9l3 3v15H6zM15 3v4h4M9 11h6M9 15h6"/></>,
  design: <><path d="m12 3 9 9-9 9-9-9Z"/><circle cx="12" cy="12" r="3"/></>,
  communication: <><path d="M4 5h16v11H8l-4 4ZM8 9h8M8 12h6"/></>,
};

function AdminIcon({ section }: { section: SectionId }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{iconPaths[section]}</svg>;
}

type Feed = {
  id:string;name:string;type:"rss"|"api"|"onn";endpoint:string;apiKeyEnv:string|null;notes:string;active:boolean;
  upvotes:number;downvotes:number;totalArticles:number;totalCategories:number;topCategory:string|null;lastError:string|null;lastRefreshedAt:string|null;
};

type FeedDraft={name:string;type:Feed["type"];endpoint:string;apiKeyEnv:string;notes:string;active:boolean};
const emptyFeed:FeedDraft={name:"",type:"rss",endpoint:"",apiKeyEnv:"",notes:"",active:true};

function FeedManager(){
  const [feeds,setFeeds]=useState<Feed[]>([]),[draft,setDraft]=useState(emptyFeed),[adding,setAdding]=useState(false),[busy,setBusy]=useState<string|null>("loading"),[message,setMessage]=useState("");
  const load=async()=>{setBusy("loading");try{const response=await fetch("/api/admin/feeds");const data=await response.json();if(!response.ok)throw Error(data.error);setFeeds(data.feeds||[])}catch(error){setMessage(error instanceof Error?error.message:"Feeds could not be loaded")}finally{setBusy(null)}};
  useEffect(()=>{load()},[]);
  const create=async(event:FormEvent)=>{event.preventDefault();setBusy("create");try{const response=await fetch("/api/admin/feeds",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(draft)}),data=await response.json();if(!response.ok)throw Error(data.error);setFeeds(all=>[...all,data.feed]);setDraft(emptyFeed);setAdding(false);setMessage(`${data.feed.name} added`)}catch(error){setMessage(error instanceof Error?error.message:"Feed could not be added")}finally{setBusy(null)}};
  const update=async(id:string,changes:Partial<Feed>|{vote:"up"|"down"})=>{setBusy(id);try{const response=await fetch(`/api/admin/feeds/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(changes)}),data=await response.json();if(!response.ok)throw Error(data.error);setFeeds(all=>all.map(feed=>feed.id===id?data.feed:feed));setMessage("Feed updated")}catch(error){setMessage(error instanceof Error?error.message:"Feed could not be updated")}finally{setBusy(null)}};
  const refresh=async(id:string)=>{setBusy(id);try{const response=await fetch(`/api/admin/feeds/${id}/refresh`,{method:"POST"}),data=await response.json();if(!response.ok)throw Error(data.error);setFeeds(all=>all.map(feed=>feed.id===id?data.feed:feed));setMessage(`${data.delivered} articles delivered`)}catch(error){setMessage(error instanceof Error?error.message:"Feed could not be refreshed");await load()}finally{setBusy(null)}};
  const remove=async(feed:Feed)=>{if(!confirm(`Remove “${feed.name}”?`))return;setBusy(feed.id);try{const response=await fetch(`/api/admin/feeds/${feed.id}`,{method:"DELETE"}),data=await response.json();if(!response.ok)throw Error(data.error);setFeeds(all=>all.filter(item=>item.id!==feed.id));setMessage("Feed removed")}catch(error){setMessage(error instanceof Error?error.message:"Feed could not be removed")}finally{setBusy(null)}};
  return <section className="feed-manager">
    <div className="feed-toolbar"><div><span><strong>{feeds.length}</strong><small>Configured feeds</small></span><span><strong>{feeds.filter(feed=>feed.active).length}</strong><small>Active</small></span></div><button type="button" onClick={()=>setAdding(value=>!value)}>{adding?"Cancel":"＋ Add feed"}</button></div>
    {adding?<form className="feed-form" onSubmit={create}><div className="feed-form-grid"><label><span>Feed name</span><input required value={draft.name} onChange={event=>setDraft({...draft,name:event.target.value})} placeholder="ONN"/></label><label><span>Connection</span><select value={draft.type} onChange={event=>setDraft({...draft,type:event.target.value as Feed["type"]})}><option value="rss">RSS</option><option value="api">API</option><option value="onn">ONN API</option></select></label><label className="feed-endpoint"><span>Feed or API endpoint</span><input required type="url" value={draft.endpoint} onChange={event=>setDraft({...draft,endpoint:event.target.value})} placeholder="https://api.example.com/news"/></label><label><span>API key environment variable</span><input value={draft.apiKeyEnv} onChange={event=>setDraft({...draft,apiKeyEnv:event.target.value})} placeholder="ONN_API_KEY"/></label><label className="feed-notes"><span>Admin note</span><textarea value={draft.notes} onChange={event=>setDraft({...draft,notes:event.target.value})} placeholder="What this feed is for, coverage limits, or contract notes."/></label></div><footer><small>Secrets stay in environment variables and are never saved here.</small><button disabled={busy==="create"}>{busy==="create"?"Adding…":"Add feed"}</button></footer></form>:null}
    {message?<p className="feed-message" role="status">{message}</p>:null}
    <div className="feed-list">{busy==="loading"?<p className="feed-loading">Loading feeds…</p>:feeds.map(feed=><article className={`feed-row${feed.active?"":" inactive"}`} key={feed.id}><header><div><span className={`feed-kind ${feed.type}`}>{feed.type==="onn"?"ONN API":feed.type.toUpperCase()}</span><h2>{feed.name}</h2><p>{feed.endpoint}</p></div><label className="feed-toggle"><input type="checkbox" checked={feed.active} onChange={event=>update(feed.id,{active:event.target.checked})}/><span>{feed.active?"Active":"Paused"}</span></label></header><div className="feed-stats"><div><b>↑ {feed.upvotes}</b><span>User up votes</span></div><div><b>↓ {feed.downvotes}</b><span>User down votes</span></div><div><b>{feed.totalArticles.toLocaleString()}</b><span>Articles delivered</span></div><div><b>{feed.totalCategories}</b><span>Categories</span></div><div><b>{feed.topCategory||"—"}</b><span>Top category</span></div></div><div className="feed-details"><label><span>Admin note</span><textarea defaultValue={feed.notes} onBlur={event=>event.target.value!==feed.notes&&update(feed.id,{notes:event.target.value})} placeholder="Add a note about this feed"/></label><div><span>Last refresh</span><b>{feed.lastRefreshedAt?new Date(feed.lastRefreshedAt).toLocaleString():"Never"}</b>{feed.lastError?<small className="feed-error">{feed.lastError}</small>:<small>Feed is ready</small>}</div></div><footer><button onClick={()=>refresh(feed.id)} disabled={busy===feed.id}>↻ {busy===feed.id?"Working…":"Refresh"}</button><button onClick={()=>update(feed.id,{name:prompt("Feed name",feed.name)||feed.name,endpoint:prompt("Feed endpoint",feed.endpoint)||feed.endpoint,apiKeyEnv:prompt("API key environment variable",feed.apiKeyEnv||"")||null})}>Edit connection</button><button className="danger" onClick={()=>remove(feed)}>Remove</button></footer></article>)}</div>
  </section>
}

export default function AdminConsole({ adminName, adminEmail }: { adminName: string; adminEmail: string }) {
  const [active, setActive] = useState<SectionId>("users");
  const section = sections.find((item) => item.id === active) || sections[0];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-back" href="/" aria-label="Go back to PostingSignal">
          <span aria-hidden="true">←</span> Go back
        </Link>
        <div className="admin-brand">
          <img src="/brand/post-icon-red.png" alt="" />
          <div><strong>PostingSignal</strong><span>Administration</span></div>
        </div>
        <nav aria-label="Admin navigation">
          {sections.map((item) => (
            <button
              type="button"
              key={item.id}
              className={active === item.id ? "active" : ""}
              aria-current={active === item.id ? "page" : undefined}
              onClick={() => setActive(item.id)}
            >
              <AdminIcon section={item.id} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <footer><span>{adminName}</span><small>{adminEmail}</small></footer>
      </aside>

      <main className="admin-main">
        <header>
          <div><span>Admin</span><h1>{section.label}</h1><p>{section.description}</p></div>
          <span className="admin-status"><i /> Admin access</span>
        </header>

        {active==="feeds"?<FeedManager/>:<section className="admin-workspace" aria-live="polite">
          <div className="admin-empty-mark" aria-hidden="true" />
          <div>
            <h2>{section.label} workspace</h2>
            <p>This section is ready for its management controls and data connections.</p>
            <dl>
              <div><dt>Access</dt><dd>Administrators only</dd></div>
              <div><dt>Status</dt><dd>Foundation ready</dd></div>
              <div><dt>Next step</dt><dd>Define {section.label.toLowerCase()} controls</dd></div>
            </dl>
          </div>
        </section>}
      </main>
    </div>
  );
}
