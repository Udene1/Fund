import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod/v4";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeAgent } from "@/lib/auth";

const handler = createMcpHandler(() => {
  const server = new McpServer({ name: "fund", version: "0.1.0" });

  server.registerTool("capture_event", {
    description: "Save a user's event in their original wording. Do not add interpretations to originalAccount.",
    inputSchema: z.object({
      title: z.string().min(1).max(160),
      originalAccount: z.string().min(1).max(30000),
      occurredAt: z.string().datetime().optional(),
      occurredAtNote: z.string().max(160).optional(),
      context: z.string().max(10000).optional(),
      tags: z.array(z.string().max(40)).max(20).optional(),
      importance: z.number().int().min(1).max(5).optional(),
    }),
  }, async input => {
    const event = await prisma.event.create({ data: {
      title: input.title, originalAccount: input.originalAccount,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
      occurredAtNote: input.occurredAtNote, context: input.context,
      tags: input.tags ?? [], importance: input.importance ?? 3,
    } });
    return { content: [{ type: "text", text: JSON.stringify({ saved: true, event }) }] };
  });

  server.registerTool("get_event", {
    description: "Retrieve one event with its original account, revisions, decisions, reflections, lessons and policies.",
    inputSchema: z.object({ eventId: z.string().min(1) }),
  }, async ({ eventId }) => {
    const event = await prisma.event.findUnique({ where: { id: eventId }, include: {
      revisions: { orderBy: { changedAt: "desc" } }, decisions: true, reflections: true,
      lessonLinks: { include: { lesson: true } }, policyLinks: { include: { policy: true } },
    } });
    if (!event || event.archivedAt) return { content: [{ type: "text", text: "Event not found." }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(event) }] };
  });

  server.registerTool("search_memories", {
    description: "Search event memories by text and optional tags. Returns source event IDs and original accounts.",
    inputSchema: z.object({ query: z.string().min(1).max(500), tags: z.array(z.string()).max(20).optional(), limit: z.number().int().min(1).max(50).optional() }),
  }, async ({ query, tags, limit = 20 }) => {
    const terms = query.split(/\\s+/).filter(Boolean);
    const events = await prisma.event.findMany({ where: {
      archivedAt: null,
      OR: terms.map(term => ({ OR: [
        { title: { contains: term, mode: "insensitive" } },
        { originalAccount: { contains: term, mode: "insensitive" } },
        { context: { contains: term, mode: "insensitive" } },
      ] })),
      ...(tags?.length ? { tags: { hasSome: tags } } : {}),
    }, orderBy: [{ importance: "desc" }, { capturedAt: "desc" }], take: limit });
    return { content: [{ type: "text", text: JSON.stringify({ retrievalMethod: "deterministic-term-overlap", events }) }] };
  });

  server.registerTool("record_decision", {
    description: "Record a decision and the user's stated rationale. Link a source event when one exists.",
    inputSchema: z.object({
      title: z.string().min(1).max(160), decision: z.string().min(1).max(20000),
      rationale: z.string().max(20000).optional(), options: z.array(z.string().max(2000)).max(30).optional(),
      constraints: z.string().max(10000).optional(), confidence: z.number().min(0).max(1).optional(),
      eventId: z.string().optional(),
    }),
  }, async input => {
    if (input.eventId && !(await prisma.event.findFirst({ where: { id: input.eventId, archivedAt: null } }))) {
      return { content: [{ type: "text", text: "Source event not found." }], isError: true };
    }
    const decision = await prisma.decision.create({ data: input, include: { event: true } });
    return { content: [{ type: "text", text: JSON.stringify(decision) }] };
  });

  server.registerTool("propose_lesson", {
    description: "Propose a lesson linked to one or more source events. It remains inactive until the user accepts it.",
    inputSchema: z.object({
      statement: z.string().min(1).max(5000), limitations: z.string().max(5000).optional(),
      confidence: z.number().min(0).max(1).optional(), sourceEventIds: z.array(z.string()).min(1).max(30),
    }),
  }, async input => {
    const sources = await prisma.event.findMany({ where: { id: { in: input.sourceEventIds }, archivedAt: null }, select: { id: true } });
    if (sources.length !== input.sourceEventIds.length) return { content: [{ type: "text", text: "One or more source events were not found." }], isError: true };
    const lesson = await prisma.lesson.create({ data: {
      statement: input.statement, limitations: input.limitations, confidence: input.confidence,
      events: { create: input.sourceEventIds.map(eventId => ({ eventId })) },
    }, include: { events: { include: { event: true } } } });
    return { content: [{ type: "text", text: JSON.stringify({ lesson, status: "PROPOSED", requiresUserApproval: true }) }] };
  });

  server.registerTool("propose_policy", {
    description: "Propose a contextual response policy linked to source events. It is not active until explicitly accepted by the user.",
    inputSchema: z.object({
      title: z.string().min(1).max(160), triggerConditions: z.string().min(1).max(5000),
      response: z.string().min(1).max(5000), rationale: z.string().max(5000).optional(),
      exceptions: z.string().max(5000).optional(), safetyConsiderations: z.string().max(5000).optional(),
      sourceEventIds: z.array(z.string()).min(1).max(30),
    }),
  }, async input => {
    const sources = await prisma.event.findMany({ where: { id: { in: input.sourceEventIds }, archivedAt: null }, select: { id: true } });
    if (sources.length !== input.sourceEventIds.length) return { content: [{ type: "text", text: "One or more source events were not found." }], isError: true };
    const policy = await prisma.policy.create({ data: {
      title: input.title, triggerConditions: input.triggerConditions, response: input.response,
      rationale: input.rationale, exceptions: input.exceptions, safetyConsiderations: input.safetyConsiderations,
      events: { create: input.sourceEventIds.map(eventId => ({ eventId })) },
    }, include: { events: { include: { event: true } } } });
    return { content: [{ type: "text", text: JSON.stringify({ policy, status: "PROPOSED", requiresUserApproval: true }) }] };
  });

  server.registerTool("propose_reflection", {
    description: "Attach an agent-authored analysis to an event. It remains a proposal and must not be represented as user-authored fact.",
    inputSchema: z.object({
      eventId: z.string().min(1), observations: z.string().max(10000).optional(),
      interpretation: z.string().max(10000).optional(), alternatives: z.string().max(10000).optional(),
      unresolvedQuestions: z.string().max(10000).optional(), agentName: z.string().max(120).optional(),
      provider: z.string().max(120).optional(), model: z.string().max(120).optional(),
    }),
  }, async input => {
    const event = await prisma.event.findFirst({ where: { id: input.eventId, archivedAt: null } });
    if (!event) return { content: [{ type: "text", text: "Source event not found." }], isError: true };
    const reflection = await prisma.reflection.create({ data: { ...input, authorType: "AGENT", status: "PROPOSED" }, include: { event: true } });
    return { content: [{ type: "text", text: JSON.stringify({ reflection, status: "PROPOSED" }) }] };
  });

  server.registerTool("review_lesson", {
    description: "Accept, revise or retire a proposed lesson. Acceptance is an explicit user-authorized action.",
    inputSchema: z.object({ lessonId: z.string().min(1), action: z.enum(["accept","revise","retire"]), statement: z.string().min(1).max(5000).optional(), limitations: z.string().max(5000).optional() }),
  }, async ({ lessonId, action, statement, limitations }) => {
    if (action === "revise" && !statement) return { content: [{ type: "text", text: "A revised statement is required." }], isError: true };
    try {
      const lesson = await prisma.lesson.update({ where: { id: lessonId }, data: {
        status: action === "accept" ? "ACCEPTED" : action === "retire" ? "RETIRED" : "REVISED",
        ...(statement ? { statement } : {}), ...(limitations !== undefined ? { limitations } : {}),
      }, include: { events: { include: { event: true } } } });
      return { content: [{ type: "text", text: JSON.stringify(lesson) }] };
    } catch { return { content: [{ type: "text", text: "Lesson not found." }], isError: true }; }
  });

  server.registerTool("review_policy", {
    description: "Accept, revise or retire a proposed policy. Acceptance makes it active; the user must explicitly authorize this action.",
    inputSchema: z.object({
      policyId: z.string().min(1), action: z.enum(["accept","revise","retire"]),
      title: z.string().min(1).max(160).optional(), triggerConditions: z.string().min(1).max(5000).optional(),
      response: z.string().min(1).max(5000).optional(), rationale: z.string().max(5000).optional(), exceptions: z.string().max(5000).optional(),
    }),
  }, async ({ policyId, action, ...fields }) => {
    if (action === "revise" && (!fields.title || !fields.triggerConditions || !fields.response)) return { content: [{ type: "text", text: "Revision requires title, triggerConditions and response." }], isError: true };
    try {
      const policy = await prisma.policy.update({ where: { id: policyId }, data: {
        status: action === "accept" ? "ACCEPTED" : action === "retire" ? "RETIRED" : "REVISED",
        ...(action === "revise" ? fields : {}), ...(action === "accept" ? { lastReviewedAt: new Date() } : {}),
      }, include: { events: { include: { event: true } } } });
      return { content: [{ type: "text", text: JSON.stringify(policy) }] };
    } catch { return { content: [{ type: "text", text: "Policy not found." }], isError: true }; }
  });

  server.registerTool("review_decision", {
    description: "Retrieve related event history, accepted lessons and policies for a current situation. Treat lexical matches as candidates, not proof.",
    inputSchema: z.object({ situation: z.string().min(1).max(5000), tags: z.array(z.string()).max(20).optional(), limit: z.number().int().min(1).max(30).optional() }),
  }, async ({ situation, tags, limit = 10 }) => {
    const terms = situation.split(/\\s+/).filter(term => term.length > 2).slice(0, 12);
    const events = await prisma.event.findMany({ where: {
      archivedAt: null, OR: terms.map(term => ({ OR: [
        { title: { contains: term, mode: "insensitive" } },
        { originalAccount: { contains: term, mode: "insensitive" } },
        { context: { contains: term, mode: "insensitive" } },
      ] })), ...(tags?.length ? { tags: { hasSome: tags } } : {}),
    }, include: { decisions: true, reflections: true, lessonLinks: { include: { lesson: true } }, policyLinks: { include: { policy: true } } },
    orderBy: [{ importance: "desc" }, { capturedAt: "desc" }], take: limit });
    const ids = events.map(event => event.id);
    const [lessons, policies] = await Promise.all([
      prisma.lesson.findMany({ where: { status: "ACCEPTED", events: { some: { eventId: { in: ids } } } }, include: { events: { include: { event: true } } } }),
      prisma.policy.findMany({ where: { status: "ACCEPTED", events: { some: { eventId: { in: ids } } } }, include: { events: { include: { event: true } } } }),
    ]);
    return { content: [{ type: "text", text: JSON.stringify({
      situation, retrievalMethod: "deterministic-term-overlap", events, acceptedLessons: lessons, acceptedPolicies: policies,
      limitations: ["Lexical matches are not proof of relevance.", "Check differences and missing context.", "Search may miss paraphrases and counterexamples."],
    }) }] };
  });

  server.registerTool("record_outcome", {
    description: "Record the observed result of a decision so future reviews can compare expected and actual outcomes.",
    inputSchema: z.object({ decisionId: z.string().optional(), observed: z.string().min(1).max(20000), expected: z.string().max(10000).optional(), followUpAt: z.string().datetime().optional() }),
  }, async input => {
    if (input.decisionId && !(await prisma.decision.findUnique({ where: { id: input.decisionId } }))) return { content: [{ type: "text", text: "Decision not found." }], isError: true };
    const outcome = await prisma.outcome.create({ data: { ...input, followUpAt: input.followUpAt ? new Date(input.followUpAt) : undefined } });
    return { content: [{ type: "text", text: JSON.stringify(outcome) }] };
  });

  return server;
}, { responseMode: "json" });

async function handle(request: NextRequest) {
  const denied = authorizeAgent(request);
  if (denied) return denied;
  return handler.fetch(request);
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
