import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeAgent } from "@/lib/auth";

const schema = z.object({
  query: z.string().trim().min(1).max(500),
  tags: z.array(z.string()).max(20).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export async function POST(request: NextRequest) {
  const denied = authorizeAgent(request);
  if (denied) return denied;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid search", details: parsed.error.flatten() }, { status: 400 });
  const { query, tags, limit = 20 } = parsed.data;
  const terms = query.split(/\s+/).filter(Boolean);
  const events = await prisma.event.findMany({
    where: {
      archivedAt: null,
      OR: terms.map(term => ({ OR: [
        { title: { contains: term, mode: "insensitive" } },
        { originalAccount: { contains: term, mode: "insensitive" } },
        { context: { contains: term, mode: "insensitive" } },
      ] })),
      ...(tags?.length ? { tags: { hasSome: tags } } : {}),
    },
    orderBy: [{ importance: "desc" }, { capturedAt: "desc" }],
    take: limit,
  });
  return NextResponse.json({ data: events, meta: { query, count: events.length, method: "postgresql-substring" } });
}
