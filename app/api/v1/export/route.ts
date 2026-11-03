import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeUserOrAgent } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const denied = authorizeUserOrAgent(request);
  if (denied) return denied;

  const [events, decisions, reflections, lessons, policies, outcomes] = await Promise.all([
    prisma.event.findMany({ include: { revisions: true, decisions: true, reflections: true, lessonLinks: true, policyLinks: true }, orderBy: { capturedAt: "asc" } }),
    prisma.decision.findMany({ include: { outcomes: true }, orderBy: { createdAt: "asc" } }),
    prisma.reflection.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.lesson.findMany({ include: { events: true }, orderBy: { createdAt: "asc" } }),
    prisma.policy.findMany({ include: { events: true }, orderBy: { createdAt: "asc" } }),
    prisma.outcome.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const payload = {
    format: "fund-export",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { events, decisions, reflections, lessons, policies, outcomes },
  };
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="fund-export-' + date + '.json"',
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
