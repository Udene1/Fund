import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeAgent } from "@/lib/auth";

const schema = z.object({
  eventId: z.string().min(1),
  observations: z.string().max(10000).optional(),
  interpretation: z.string().max(10000).optional(),
  alternatives: z.string().max(10000).optional(),
  unresolvedQuestions: z.string().max(10000).optional(),
  agentName: z.string().max(120).optional(),
  provider: z.string().max(120).optional(),
  model: z.string().max(120).optional(),
});

export async function GET(request: NextRequest) {
  const denied = authorizeAgent(request);
  if (denied) return denied;
  const eventId = request.nextUrl.searchParams.get("eventId") ?? undefined;
  const data = await prisma.reflection.findMany({ where: eventId ? { eventId } : {}, include: { event: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const denied = authorizeAgent(request);
  if (denied) return denied;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid reflection", details: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const event = await prisma.event.findFirst({ where: { id: input.eventId, archivedAt: null } });
  if (!event) return NextResponse.json({ error: "Source event not found" }, { status: 404 });
  const data = await prisma.reflection.create({ data: { ...input, authorType: "AGENT", status: "PROPOSED" }, include: { event: true } });
  return NextResponse.json({ data, note: "Agent reflection is stored as a proposal, not as verified fact." }, { status: 201 });
}
