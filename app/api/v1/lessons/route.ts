import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeUserOrAgent } from "@/lib/auth";

const schema = z.object({
  statement: z.string().trim().min(1).max(5000),
  limitations: z.string().max(5000).optional(),
  confidence: z.number().min(0).max(1).optional(),
  sourceEventIds: z.array(z.string()).min(1).max(30),
});

export async function GET(request: NextRequest) {
  const denied = authorizeUserOrAgent(request);
  if (denied) return denied;
  const status = request.nextUrl.searchParams.get("status");
  const data = await prisma.lesson.findMany({
    where: status && ["PROPOSED","ACCEPTED","REVISED","RETIRED"].includes(status) ? { status: status as "PROPOSED"|"ACCEPTED"|"REVISED"|"RETIRED" } : {},
    include: { events: { include: { event: true } } }, orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const denied = authorizeUserOrAgent(request);
  if (denied) return denied;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid lesson proposal", details: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const sources = await prisma.event.findMany({ where: { id: { in: input.sourceEventIds }, archivedAt: null }, select: { id: true } });
  if (sources.length !== input.sourceEventIds.length) return NextResponse.json({ error: "One or more source events were not found" }, { status: 404 });
  const data = await prisma.lesson.create({ data: {
    statement: input.statement, limitations: input.limitations, confidence: input.confidence,
    events: { create: input.sourceEventIds.map(eventId => ({ eventId })) },
  }, include: { events: { include: { event: true } } } });
  return NextResponse.json({ data, note: "Proposal is not active until explicitly accepted." }, { status: 201 });
}
