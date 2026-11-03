import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeAgent } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  const denied = authorizeAgent(request);
  if (denied) return denied;
  const { id } = await context.params;
  const event = await prisma.event.findUnique({ where: { id }, include: { decisions: true, reflections: true, lessonLinks: { include: { lesson: true } }, policyLinks: { include: { policy: true } } } });
  if (!event || event.archivedAt) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json({ data: event });
}

const patchSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  originalAccount: z.string().trim().min(1).max(30000).optional(),
  occurredAt: z.string().datetime().nullable().optional(),
  occurredAtNote: z.string().max(160).nullable().optional(),
  context: z.string().max(10000).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  importance: z.number().int().min(1).max(5).optional(),
  archived: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, context: Context) {
  const denied = authorizeAgent(request);
  if (denied) return denied;
  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid update", details: parsed.error.flatten() }, { status: 400 });
  const { archived, occurredAt, ...fields } = parsed.data;
  try {
    const event = await prisma.event.update({
      where: { id },
      data: { ...fields, ...(occurredAt !== undefined ? { occurredAt: occurredAt ? new Date(occurredAt) : null } : {}), ...(archived !== undefined ? { archivedAt: archived ? new Date() : null } : {}) },
    });
    return NextResponse.json({ data: event });
  } catch {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const denied = authorizeAgent(request);
  if (denied) return denied;
  const { id } = await context.params;
  try {
    const event = await prisma.event.update({ where: { id }, data: { archivedAt: new Date() } });
    return NextResponse.json({ data: { id: event.id, archived: true } });
  } catch {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
}
