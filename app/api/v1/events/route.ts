import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeUserOrAgent } from "@/lib/auth";

const createEventSchema = z.object({
  title: z.string().trim().min(1).max(160),
  originalAccount: z.string().trim().min(1).max(30000),
  occurredAt: z.string().datetime().optional(),
  occurredAtNote: z.string().max(160).optional(),
  context: z.string().max(10000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  importance: z.number().int().min(1).max(5).optional(),
});

export async function GET(request: NextRequest) {
  const denied = authorizeUserOrAgent(request);
  if (denied) return denied;
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 30), 100);
  const events = await prisma.event.findMany({
    where: { archivedAt: null },
    orderBy: { capturedAt: "desc" },
    take: Number.isFinite(limit) && limit > 0 ? limit : 30,
  });
  return NextResponse.json({ data: events });
}

export async function POST(request: NextRequest) {
  const denied = authorizeUserOrAgent(request);
  if (denied) return denied;
  const parsed = createEventSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid event", details: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  const event = await prisma.event.create({
    data: {
      title: data.title,
      originalAccount: data.originalAccount,
      occurredAt: data.occurredAt ? new Date(data.occurredAt) : undefined,
      occurredAtNote: data.occurredAtNote,
      context: data.context,
      tags: data.tags ?? [],
      importance: data.importance ?? 3,
    },
  });
  return NextResponse.json({ data: event }, { status: 201 });
}
