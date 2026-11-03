import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeUserOrAgent } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };
const schema = z.object({ action: z.enum(["accept","revise","retire"]), title: z.string().trim().min(1).max(160).optional(), triggerConditions: z.string().trim().min(1).max(5000).optional(), response: z.string().trim().min(1).max(5000).optional(), rationale: z.string().max(5000).optional(), exceptions: z.string().max(5000).optional() });

export async function POST(request: NextRequest, context: Context) {
  const denied = authorizeUserOrAgent(request);
  if (denied) return denied;
  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid review action", details: parsed.error.flatten() }, { status: 400 });
  const { action, ...fields } = parsed.data;
  if (action === "revise" && (!fields.title || !fields.triggerConditions || !fields.response)) return NextResponse.json({ error: "Revision requires title, triggerConditions and response" }, { status: 400 });
  try {
    const data = await prisma.policy.update({ where: { id }, data: {
      status: action === "accept" ? "ACCEPTED" : action === "retire" ? "RETIRED" : "REVISED",
      ...(action === "revise" ? fields : {}),
      ...(action === "accept" ? { lastReviewedAt: new Date() } : {}),
    }, include: { events: { include: { event: true } } } });
    return NextResponse.json({ data });
  } catch { return NextResponse.json({ error: "Policy not found" }, { status: 404 }); }
}
