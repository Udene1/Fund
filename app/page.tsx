import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, sessionCookieName } from "@/lib/auth";
import CaptureForm from "./capture-form";
import LogoutButton from "./logout-button";

export const dynamic = "force-dynamic";

export default async function Home() {
  const jar = await cookies();
  if (!verifySessionToken(jar.get(sessionCookieName)?.value)) redirect("/login");
  const [eventCount, decisionCount, lessonCount, policyCount, recentEvents] = await Promise.all([
    prisma.event.count({ where: { archivedAt: null } }),
    prisma.decision.count(),
    prisma.lesson.count(),
    prisma.policy.count({ where: { status: "ACCEPTED" } }),
    prisma.event.findMany({ where: { archivedAt: null }, orderBy: { capturedAt: "desc" }, take: 8 }),
  ]);
  return <main className="shell">
    <header className="topbar"><div className="mark">F</div><div><div className="brand">fund</div><div className="subbrand">PERSONAL DECISION INTELLIGENCE</div></div><span className="private">PRIVATE MEMORY</span><LogoutButton/></header>
    <section className="hero"><p className="eyebrow">YOUR EXPERIENCES, AVAILABLE WHEN THEY MATTER</p><h1>Remember what<br/><em>you learned.</em></h1><p className="intro">A durable record of what happened, what you decided, why you decided it, and what you want to carry forward.</p></section>
    <section className="stats"><Stat label="Events captured" value={eventCount}/><Stat label="Decisions recorded" value={decisionCount}/><Stat label="Lessons proposed" value={lessonCount}/><Stat label="Active policies" value={policyCount}/></section>
    <section className="capture"><div><p className="eyebrow">CAPTURE A MOMENT</p><h2>Don't lose the original story.</h2><p className="muted">Save the account first. Structure and interpretation can come later. You can write rough notes; the original account is preserved.</p></div><CaptureForm/></section>
    <section className="recent"><div className="section-heading"><div><p className="eyebrow">YOUR RECORD</p><h2>Recently captured</h2></div><span>{eventCount} total</span></div>
    {recentEvents.length?<div className="event-list">{recentEvents.map(event=><article className="event" key={event.id}><div className="event-date">{event.occurredAt?event.occurredAt.toLocaleDateString():"DATE UNKNOWN"}</div><div><h3><Link href={"/events/"+event.id}>{event.title}</Link></h3><p>{event.originalAccount.slice(0,180)}{event.originalAccount.length>180?"…":""}</p></div><span className="event-id">{event.id.slice(-6)}</span></article>)}</div>:<div className="empty">No events yet. Capture the first one above.</div>}</section>
    <footer>Fund is model-independent. Your records remain yours; no AI provider is required.</footer>
  </main>;
}
function Stat({label,value}:{label:string;value:number}){return <div className="stat"><strong>{value.toString().padStart(2,"0")}</strong><span>{label}</span></div>}
