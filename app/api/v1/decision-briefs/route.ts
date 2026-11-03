import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeUserOrAgent } from "@/lib/auth";

const schema = z.object({ situation: z.string().trim().min(1).max(5000), tags: z.array(z.string()).max(20).optional(), limit: z.number().int().min(1).max(30).optional() });

export async function POST(request: NextRequest) {
  const denied = authorizeUserOrAgent(request);
  if (denied) return denied;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid decision brief request", details: parsed.error.flatten() }, { status: 400 });
  const { situation, tags, limit = 10 } = parsed.data;
  const terms = situation.split(/\s+/).filter(term => term.length > 2).slice(0, 12);
  const events = await prisma.event.findMany({
    where: { archivedAt: null, OR: terms.map(term => ({ OR: [
      { title: { contains: term, mode: "insensitive" } },
      { originalAccount: { contains: term, mode: "insensitive" } },
      { context: { contains: term, mode: "insensitive" } },
    ] })), ...(tags?.length ? { tags: { hasSome: tags } } : {}) },
    include: { decisions: true, reflections: true, lessonLinks: { include: { lesson: true } }, policyLinks: { include: { policy: true } } },
    orderBy: [{ importance: "desc" }, { capturedAt: "desc" }], take: limit,
  });
  const [lessons, policies] = await Promise.all([
    prisma.lesson.findMany({ where: { status: "ACCEPTED", events: { some: { eventId: { in: events.map(e => e.id) } } } }, include: { events: { include: { event: true } } } }),
    prisma.policy.findMany({ where: { status: "ACCEPTED", events: { some: { eventId: { in: events.map(e => e.id) } } } }, include: { events: { include: { event: true } } } }),
  ]);
  return NextResponse.json({ data: {
    situation,
    retrievalMethod: "deterministic-term-overlap",
    events: events.map(event => ({ id: event.id, title: event.title, occurredAt: event.occurredAt, originalAccount: event.originalAccount, tags: event.tags, decisions: event.decisions, reflections: event.reflections, acceptedLessons: event.lessonLinks.filter(link => link.lesson.status === "ACCEPTED").map(link => link.lesson), acceptedPolicies: event.policyLinks.filter(link => link.policy.status === "ACCEPTED").map(link => link.policy) })),
    lessons, policies,
    limitations: ["This is lexical retrieval, not semantic understanding.", "Shared words do not prove that a past event applies to the current situation.", "Review differences, missing context and counterexamples before relying on a retrieved record."],
  } });
}
