import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, sessionCookieName } from "@/lib/auth";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export default async function EventPage({params}:Props){
 const jar=await cookies();if(!verifySessionToken(jar.get(sessionCookieName)?.value))redirect("/login");
 const {id}=await params;
 const event=await prisma.event.findUnique({where:{id},include:{
  revisions:{orderBy:{changedAt:"desc"}},decisions:{include:{outcomes:true},orderBy:{createdAt:"desc"}},
  reflections:{orderBy:{createdAt:"desc"}},lessonLinks:{include:{lesson:true}},policyLinks:{include:{policy:true}},
 }});
 if(!event||event.archivedAt)notFound();
 return <main className="shell detail-shell">
  <header className="topbar"><Link href="/" className="back-link">← fund</Link><span className="private">PRIVATE MEMORY</span></header>
  <section className="detail-hero"><p className="eyebrow">ORIGINAL EVENT · {event.occurredAt?event.occurredAt.toLocaleDateString():"DATE UNKNOWN"}</p><h1>{event.title}</h1><p className="detail-meta">Captured {event.capturedAt.toLocaleString()} · Importance {event.importance}/5</p>{event.tags.length>0&&<div className="tag-row">{event.tags.map(tag=><span key={tag}>{tag}</span>)}</div>}</section>
  <section className="detail-section"><p className="eyebrow">YOUR ORIGINAL ACCOUNT</p><div className="narrative">{event.originalAccount}</div>{event.context&&<><p className="eyebrow context-label">CONTEXT</p><p className="detail-copy">{event.context}</p></>}</section>
  {event.decisions.length>0&&<section className="detail-section"><p className="eyebrow">DECISIONS</p>{event.decisions.map(x=><article className="detail-card" key={x.id}><h3>{x.title}</h3><p>{x.decision}</p>{x.rationale&&<p><strong>Why:</strong> {x.rationale}</p>}{x.outcomes.map(y=><p key={y.id}><strong>Outcome:</strong> {y.observed}</p>)}</article>)}</section>}
  {event.reflections.length>0&&<section className="detail-section"><p className="eyebrow">REFLECTIONS</p>{event.reflections.map(x=><article className="detail-card" key={x.id}><span className="status">{x.status} · {x.authorType}</span>{x.observations&&<p><strong>Observations:</strong> {x.observations}</p>}{x.interpretation&&<p><strong>Interpretation:</strong> {x.interpretation}</p>}{x.alternatives&&<p><strong>Alternatives:</strong> {x.alternatives}</p>}{x.unresolvedQuestions&&<p><strong>Open questions:</strong> {x.unresolvedQuestions}</p>}</article>)}</section>}
  {event.lessonLinks.length>0&&<section className="detail-section"><p className="eyebrow">LINKED LESSONS</p>{event.lessonLinks.map(({lesson})=><article className="detail-card" key={lesson.id}><span className="status">{lesson.status}</span><p>{lesson.statement}</p>{lesson.limitations&&<small>{lesson.limitations}</small>}</article>)}</section>}
  {event.policyLinks.length>0&&<section className="detail-section"><p className="eyebrow">LINKED POLICIES</p>{event.policyLinks.map(({policy})=><article className="detail-card" key={policy.id}><span className="status">{policy.status}</span><h3>{policy.title}</h3><p><strong>When:</strong> {policy.triggerConditions}</p><p><strong>Response:</strong> {policy.response}</p>{policy.exceptions&&<p><strong>Exceptions:</strong> {policy.exceptions}</p>}</article>)}</section>}
  {event.revisions.length>0&&<section className="detail-section"><p className="eyebrow">PREVIOUS VERSIONS</p>{event.revisions.map(revision=><article className="detail-card revision" key={revision.id}><small>{revision.changedAt.toLocaleString()}</small><h3>{revision.title}</h3><p>{revision.originalAccount}</p></article>)}</section>}
  <footer><Link href="/">← Back to your memory</Link></footer>
 </main>;
}
