"use client";
import { useState } from "react";

export default function EventActions({ eventId }: { eventId: string }) {
  const [title, setTitle] = useState("");
  const [decision, setDecision] = useState("");
  const [rationale, setRationale] = useState("");
  const [observations, setObservations] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(path: string, body: Record<string, unknown>) {
    setBusy(true); setMessage("");
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json(); setBusy(false);
    if (response.status === 401) { window.location.href = "/login"; return false; }
    if (!response.ok) { setMessage(data.error ?? "Could not save."); return false; }
    setMessage("Saved."); return true;
  }

  async function submitDecision(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (await save("/api/v1/decisions", { eventId, title, decision, rationale: rationale || undefined })) window.location.reload();
  }
  async function submitReflection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (await save("/api/v1/reflections", { eventId, observations: observations || undefined, interpretation: interpretation || undefined })) window.location.reload();
  }

  return <section className="detail-section">
    <p className="eyebrow">ADD TO THIS MEMORY</p>
    <div className="action-grid">
      <form className="capture-form action-form" onSubmit={submitDecision}>
        <h3>Record a decision</h3>
        <label htmlFor="decision-title">Decision title</label><input id="decision-title" value={title} onChange={e => setTitle(e.target.value)} required maxLength={160} />
        <label htmlFor="decision-text">What did you decide?</label><textarea id="decision-text" value={decision} onChange={e => setDecision(e.target.value)} required rows={3} maxLength={20000} />
        <label htmlFor="rationale">Why did you decide it?</label><textarea id="rationale" value={rationale} onChange={e => setRationale(e.target.value)} rows={3} maxLength={20000} />
        <button disabled={busy}>Save decision <span>→</span></button>
      </form>
      <form className="capture-form action-form" onSubmit={submitReflection}>
        <h3>Add a reflection</h3>
        <label htmlFor="observations">What did you notice?</label><textarea id="observations" value={observations} onChange={e => setObservations(e.target.value)} rows={3} maxLength={10000} />
        <label htmlFor="interpretation">Your interpretation</label><textarea id="interpretation" value={interpretation} onChange={e => setInterpretation(e.target.value)} rows={3} maxLength={10000} />
        <button disabled={busy}>Save reflection <span>→</span></button>
      </form>
    </div>
    {message && <small role="status">{message}</small>}
  </section>;
}
