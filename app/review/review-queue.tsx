"use client";
import Link from "next/link";
import {useState} from "react";

type Source={event:{id:string;title:string}};
type Lesson={id:string;statement:string;limitations:string|null;events:Source[]};
type Policy={id:string;title:string;triggerConditions:string;response:string;rationale:string|null;exceptions:string|null;events:Source[]};
type Reflection={id:string;observations:string|null;interpretation:string|null;alternatives:string|null;unresolvedQuestions:string|null;event:{id:string;title:string}};

export default function ReviewQueue({lessons,policies,reflections}:{lessons:Lesson[];policies:Policy[];reflections:Reflection[]}){
 const[busy,setBusy]=useState("");const[message,setMessage]=useState("");
 async function review(path:string,action:"accept"|"retire"){
  setBusy(path);setMessage("");
  const response=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action})});
  const data=await response.json();setBusy("");
  if(response.status===401){window.location.href="/login";return;}
  if(!response.ok){setMessage(data.error??"Review failed.");return;}
  setMessage("Review saved.");window.location.reload();
 }
 const sourceLinks=(sources:Source[])=><p className="review-sources">Evidence: {sources.map(x=><Link key={x.event.id} href={"/events/"+x.event.id}>{x.event.title}</Link>)}</p>;
 return <div>
  {reflections.map(item=><article className="review-card" key={item.id}><span className="status">REFLECTION PROPOSAL</span><h3><Link href={"/events/"+item.event.id}>{item.event.title}</Link></h3>{item.observations&&<p><strong>Observations:</strong> {item.observations}</p>}{item.interpretation&&<p><strong>Interpretation:</strong> {item.interpretation}</p>}{item.alternatives&&<p><strong>Alternative explanations:</strong> {item.alternatives}</p>}{item.unresolvedQuestions&&<p><strong>Open questions:</strong> {item.unresolvedQuestions}</p>}<div className="review-actions"><button disabled={!!busy} onClick={()=>review("/api/v1/reflections/"+item.id+"/review","accept")}>Accept reflection</button><button className="secondary" disabled={!!busy} onClick={()=>review("/api/v1/reflections/"+item.id+"/review","retire")}>Retire</button></div></article>)}
  {lessons.map(item=><article className="review-card" key={item.id}><span className="status">LESSON PROPOSAL</span><p className="review-statement">{item.statement}</p>{item.limitations&&<p className="review-muted">Limits: {item.limitations}</p>}{sourceLinks(item.events)}<div className="review-actions"><button disabled={!!busy} onClick={()=>review("/api/v1/lessons/"+item.id+"/review","accept")}>Accept lesson</button><button className="secondary" disabled={!!busy} onClick={()=>review("/api/v1/lessons/"+item.id+"/review","retire")}>Retire</button></div></article>)}
  {policies.map(item=><article className="review-card" key={item.id}><span className="status">POLICY PROPOSAL</span><h3>{item.title}</h3><p><strong>When it applies:</strong> {item.triggerConditions}</p><p><strong>Suggested response:</strong> {item.response}</p>{item.rationale&&<p><strong>Reason:</strong> {item.rationale}</p>}{item.exceptions&&<p><strong>Exceptions:</strong> {item.exceptions}</p>}{sourceLinks(item.events)}<div className="review-actions"><button disabled={!!busy} onClick={()=>review("/api/v1/policies/"+item.id+"/review","accept")}>Accept policy</button><button className="secondary" disabled={!!busy} onClick={()=>review("/api/v1/policies/"+item.id+"/review","retire")}>Retire</button></div></article>)}
  {message&&<p role="status" className="review-muted">{message}</p>}
 </div>;
}
