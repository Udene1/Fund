import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeAgent } from "@/lib/auth";

const schema = z.object({
  title: z.string().trim().min(1).max(160),
  decision: z.string().trim().min(1).max(20000),
  rationale: z.string().max(20000).optional(),
  options: z.array(z.string().max(2000)).max(30).optional(),
  constraints: z.string().max(10000).optional(),
  confidence: z.number().min(0).max(1).optional(),
  eventId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const denied = authorizeAgent(request);
  if (denied) return denied;
  const take = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 30), 1), 100);
  const data = await prisma.decision.findMany({ include: { event: true, outcomes: true }, orderBy: { createdAt: "desc" }, take });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const denied = authorizeAgent(request);
  if (denied) return denied;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid decision", details: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  if (input.eventId && !(await prisma.event.findFirst({ where: { id: input.eventId, archivedAt: null } }))) {
    return NextResponse.json({ error: "Source event not found" }, { status: 404 });
  }
  const data = await prisma.decision.create({ data: {
    title: input.title, decision: input.decision, rationale: input.rationale,
    options: input.options, constraints: input.constraints, confidence: input.confidence, eventId: input.eventId,
  }, include: { event: true } });
  return NextResponse.json({ data }, { status: 201 });
}
