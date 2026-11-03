"use client";
import {useState} from "react";
export default function CaptureForm(){
 const[title,setTitle]=useState("");const[account,setAccount]=useState("");const[context,setContext]=useState("");const[tags,setTags]=useState("");const[importance,setImportance]=useState("3");const[message,setMessage]=useState("");const[busy,setBusy]=useState(false);
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setMessage("");const response=await fetch("/api/v1/capture",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,originalAccount:account,context:context||undefined,tags:tags.split(",").map(x=>x.trim()).filter(Boolean),importance:Number(importance)})});const data=await response.json();setBusy(false);if(response.status===401){window.location.href="/login";return;}if(!response.ok){setMessage(data.error??"Could not save this event.");return;}setTitle("");setAccount("");setContext("");setTags("");setImportance("3");setMessage("Saved. Your original account is preserved.");window.location.reload();}
 return <form onSubmit={submit} className="capture-form">
 <label htmlFor="title">Short title</label><input id="title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="What happened?" required maxLength={160}/>
 <label htmlFor="originalAccount">Your account</label><textarea id="originalAccount" value={account} onChange={e=>setAccount(e.target.value)} placeholder="Write it as you remember it. Rough notes are fine." required rows={6} maxLength={30000}/>
 <label htmlFor="context">Context (optional)</label><textarea id="context" value={context} onChange={e=>setContext(e.target.value)} rows={2} maxLength={10000} placeholder="Where, when, who was involved, or what matters later?"/>
 <label htmlFor="tags">Tags (comma-separated)</label><input id="tags" value={tags} onChange={e=>setTags(e.target.value)} placeholder="work, family, decision"/>
 <label htmlFor="importance">Importance</label><select id="importance" value={importance} onChange={e=>setImportance(e.target.value)}><option value="1">1 — Low</option><option value="2">2</option><option value="3">3 — Normal</option><option value="4">4</option><option value="5">5 — High</option></select>
 <button disabled={busy}>{busy?"Saving…":"Save event"} <span>→</span></button>{message&&<small role="status">{message}</small>}</form>;
}
