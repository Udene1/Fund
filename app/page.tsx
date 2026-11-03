import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [eventCount, decisionCount, lessonCount, policyCount, recentEvents] = await Promise.all([
    prisma.event.count({ where: { archivedAt: null } }),
    prisma.decision.count(),
    prisma.lesson.count(),
    prisma.policy.count({ where: { status: "ACCEPTED" } }),
    prisma.event.findMany({ where: { archivedAt: null }, orderBy: { capturedAt: "desc" }, take: 8 }),
  ]);

  return (
    <main className="shell">
      <header className="topbar"><div className="mark">F</div><div><div className="brand">fund</div><div className="subbrand">PERSONAL DECISION INTELLIGENCE</div></div><span className="private">PRIVATE MEMORY</span></header>
      <section className="hero">
        <p className="eyebrow">YOUR EXPERIENCES, AVAILABLE WHEN THEY MATTER</p>
        <h1>Remember what<br /><em>you learned.</em></h1>
        <p className="intro">A durable record of what happened, what you decided, why you decided it, and what you want to carry forward.</p>
      </section>
      <section className="stats">
        <Stat label="Events captured" value={eventCount} />
        <Stat label="Decisions recorded" value={decisionCount} />
        <Stat label="Lessons proposed" value={lessonCount} />
        <Stat label="Active policies" value={policyCount} />
      </section>
      <section className="capture">
        <div><p className="eyebrow">CAPTURE A MOMENT</p><h2>Don't lose the original story.</h2><p className="muted">Save the account first. Structure and interpretation can come later.</p></div>
        <form action="/api/v1/events" method="post" className="capture-form">
          <label htmlFor="title">Short title</label><input id="title" name="title" placeholder="What happened?" required maxLength={160} />
          <label htmlFor="originalAccount">Your account</label><textarea id="originalAccount" name="originalAccount" placeholder="Write it as you remember it. Rough notes are fine." required rows={5} />
          <button type="button" disabled aria-disabled="true">Capture form coming next <span>→</span></button>
          <small>The capture API is available to authorized agents. Human sign-in and browser capture are the next implementation step.</small>
        </form>
      </section>
      <section className="recent"><div className="section-heading"><div><p className="eyebrow">YOUR RECORD</p><h2>Recently captured</h2></div><span>{eventCount} total</span></div>
        {recentEvents.length ? <div className="event-list">{recentEvents.map(event => <article className="event" key={event.id}><div className="event-date">{event.occurredAt ? event.occurredAt.toLocaleDateString() : "DATE UNKNOWN"}</div><div><h3>{event.title}</h3><p>{event.originalAccount.slice(0, 180)}{event.originalAccount.length > 180 ? "…" : ""}</p></div><span className="event-id">{event.id.slice(-6)}</span></article>)}</div> : <div className="empty">No events yet. Capture the first one above.</div>}
      </section>
      <footer>Fund is model-independent. Your records remain yours; no AI provider is required.</footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="stat"><strong>{value.toString().padStart(2, "0")}</strong><span>{label}</span></div>;
}
