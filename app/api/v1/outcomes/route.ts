import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeUserOrAgent } from "@/lib/auth";

const schema = z.object({
  decisionId: z.string().optional(),
  observed: z.string().trim().min(1).max(20000),
  expected: z.string().max(10000).optional(),
  followUpAt: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  const denied = authorizeUserOrAgent(request);
  if (denied) return denied;
  const decisionId = request.nextUrl.searchParams.get("decisionId") ?? undefined;
  const data = await prisma.outcome.findMany({ where: decisionId ? { decisionId } : {}, include: { decision: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const denied = authorizeUserOrAgent(request);
  if (denied) return denied;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid outcome", details: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  if (input.decisionId && !(await prisma.decision.findUnique({ where: { id: input.decisionId } }))) {
    return NextResponse.json({ error: "Decision not found" }, { status: 404 });
  }
  const data = await prisma.outcome.create({ data: { ...input, followUpAt: input.followUpAt ? new Date(input.followUpAt) : undefined }, include: { decision: true } });
  return NextResponse.json({ data }, { status: 201 });
}
