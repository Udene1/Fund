import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export function authorizeAgent(request: NextRequest): NextResponse | null {
  const expected = process.env.FUND_AGENT_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!expected || !supplied) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
