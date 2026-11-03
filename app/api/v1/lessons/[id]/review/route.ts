import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeAgent } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };
const schema = z.object({ action: z.enum(["accept","revise","retire"]), statement: z.string().trim().min(1).max(5000).optional(), limitations: z.string().max(5000).optional() });

export async function POST(request: NextRequest, context: Context) {
  const denied = authorizeAgent(request);
  if (denied) return denied;
  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid review action", details: parsed.error.flatten() }, { status: 400 });
  const { action, statement, limitations } = parsed.data;
  if (action === "revise" && !statement) return NextResponse.json({ error: "A revised statement is required" }, { status: 400 });
  try {
    const data = await prisma.lesson.update({ where: { id }, data: {
      status: action === "accept" ? "ACCEPTED" : action === "retire" ? "RETIRED" : "REVISED",
      ...(statement ? { statement } : {}), ...(limitations !== undefined ? { limitations } : {}),
    }, include: { events: { include: { event: true } } } });
    return NextResponse.json({ data });
  } catch { return NextResponse.json({ error: "Lesson not found" }, { status: 404 }); }
}
